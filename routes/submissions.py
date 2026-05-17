from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from utils.database import supabase
from utils.auth import get_current_user
from services.ocr import extract_text, extract_text_from_multiple_files
from services.llm import grade_paper

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB per file
MAX_FILES = 20  # Maximum number of files per submission

class GradeRequest(BaseModel):
    submission_id: str


# ── STEP 1: Upload answer sheet (multiple files) ────────────
@router.post("/submissions/upload", status_code=201)
async def upload_answer_sheet(
    exam_id:      str        = Form(...),
    student_name: str        = Form(...),
    student_roll: str        = Form(""),
    files:        List[UploadFile] = File(...),
    user: dict               = Depends(get_current_user)
):
    """
    Upload a student's answer sheets (multiple PDFs or images).
    Extracts text via OCR from all files and saves to DB.
    Returns submission_id — use this to call /grade next.
    """
    
    # Validate number of files
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Too many files. Max {MAX_FILES} allowed.")
    
    # Validate exam exists
    exam_res = supabase.table("exams").select("id").eq("id", exam_id).execute()
    if not exam_res.data:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Process all files
    all_text_parts = []
    file_urls = []
    
    for idx, file in enumerate(files):
        # Validate file size
        file_bytes = await file.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {file.filename} too large. Max 10MB allowed.")
        
        # Upload file to Supabase Storage (optional)
        file_path = f"{exam_id}/{student_name.replace(' ', '_')}_{idx}_{file.filename}"
        file_url = None
        try:
            supabase.storage.from_("answer-sheets").upload(file_path, file_bytes)
            file_url = supabase.storage.from_("answer-sheets").get_public_url(file_path)
            file_urls.append(file_url)
        except Exception as e:
            print(f"Storage upload failed for {file.filename}: {e}")
            file_urls.append(None)
        
        # Extract text from file
        try:
            extracted_text = extract_text(file_bytes, file.filename)
            if extracted_text and extracted_text.strip():
                all_text_parts.append(f"=== Page {idx + 1}: {file.filename} ===\n{extracted_text}")
            else:
                print(f"Warning: No text extracted from {file.filename}")
        except Exception as e:
            print(f"Text extraction failed for {file.filename}: {e}")
            all_text_parts.append(f"=== Page {idx + 1}: {file.filename} ===\n[Unable to extract text: {str(e)}]")
    
    # Combine all extracted text
    combined_text = "\n\n".join(all_text_parts) if all_text_parts else ""
    
    if not combined_text or len(combined_text.strip()) < 10:
        raise HTTPException(
            status_code=422, 
            detail="Extracted text is too short — files may be blank, unreadable, or not containing text."
        )
    
    # Save submission with combined extracted text
    result = supabase.table("submissions").insert({
        "exam_id":        exam_id,
        "teacher_id":     user["sub"],
        "student_name":   student_name,
        "student_roll":   student_roll,
        "file_url":       file_urls[0] if file_urls else None,
        "extracted_text": combined_text,
        "status":         "pending",
    }).execute()
    
    submission = result.data[0]
    
    return {
        "submission_id":  submission["id"],
        "student_name":   student_name,
        "status":         "pending",
        "files_processed": len(files),
        "extracted_text_preview": combined_text[:500] + "..." if len(combined_text) > 500 else combined_text,
        "next_step": f"POST /api/submissions/grade with submission_id: {submission['id']}"
    }


# ── STEP 2: Grade the submission ───────────────────────────
@router.post("/submissions/grade")
def grade_submission(
    request: GradeRequest,
    user: dict = Depends(get_current_user)
):
    """
    Trigger AI grading for an uploaded submission.
    Calls DeepSeek API → returns full 6-section report.
    Also saves report to graded_reports table.
    """
    submission_id = request.submission_id
    
    # Fetch submission
    sub_res = supabase.table("submissions").select("*").eq("id", submission_id).execute()
    if not sub_res.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission = sub_res.data[0]
    
    if submission["status"] == "done":
        raise HTTPException(status_code=400, detail="Already graded. Fetch report via GET /api/reports/submission/{submission_id}")
    
    if not submission.get("extracted_text"):
        raise HTTPException(status_code=400, detail="No extracted text. Re-upload the answer sheet.")
    
    # Fetch exam (questions + rubric)
    exam_res = supabase.table("exams").select("*").eq("id", submission["exam_id"]).execute()
    if not exam_res.data:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam = exam_res.data[0]
    
    # Mark as processing
    supabase.table("submissions").update({"status": "processing"}).eq("id", submission_id).execute()
    
    try:
        # ── Call DeepSeek AI ──────────────────────────────
        result = grade_paper(
            subject        = exam["subject"],
            student_class  = exam["class"],
            student_name   = submission["student_name"],
            questions      = exam["questions"],
            extracted_text = submission["extracted_text"]
        )
        
        # Extract values from result with safe defaults
        total_score = result.get("total_score", 0)
        max_score = result.get("max_score", exam.get("total_marks", 0))
        percentage = result.get("percentage", 0)
        
        # If percentage is 0 but we have scores, calculate it
        if percentage == 0 and total_score > 0 and max_score > 0:
            percentage = round((total_score / max_score) * 100, 1)
        
        # ── Save graded report ──────────────────────────
        report_res = supabase.table("graded_reports").insert({
            "submission_id":    submission_id,
            "exam_id":          exam["id"],
            "student_name":     submission["student_name"],
            "total_score":      total_score,
            "max_score":        max_score,
            "percentage":       percentage,
            "score_breakdown":  result.get("score_breakdown", []),
            "concept_gaps":     result.get("concept_gaps", ""),
            "improvement_tips": result.get("improvement_tips", ""),
            "writing_quality":  result.get("writing_quality", ""),
            "performance_trend": result.get("performance_trend", ""),
            "parent_summary":   result.get("parent_summary", ""),
        }).execute()
        
        # ── Mark submission as done ─────────────────────
        supabase.table("submissions").update({"status": "done"}).eq("id", submission_id).execute()
        
        return {
            "report_id":    report_res.data[0]["id"],
            "student_name": submission["student_name"],
            "total_score":  total_score,
            "max_score":    max_score,
            "percentage":   percentage,
            "report":       result,
            "pdf_download": f"/api/reports/{report_res.data[0]['id']}/pdf"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        supabase.table("submissions").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", submission_id).execute()
        raise HTTPException(status_code=500, detail=f"Grading failed: {str(e)}")


# ── Get all submissions for an exam ───────────────────────
@router.get("/submissions/exam/{exam_id}")
def get_exam_submissions(exam_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("submissions")\
        .select("id, student_name, student_roll, status, created_at")\
        .eq("exam_id", exam_id)\
        .order("created_at", desc=True)\
        .execute()
    return {"submissions": result.data, "count": len(result.data)}


# ── Get single submission ──────────────────────────────────
@router.get("/submissions/{submission_id}")
def get_submission(submission_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("submissions").select("*").eq("id", submission_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    return result.data[0]