from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response, HTMLResponse
from pydantic import BaseModel
from typing import Optional
from utils.database import supabase
from utils.auth import get_current_user
from services.report_builder import build_pdf
from services.html_report_builder import build_html_report
from services.llm import regrade_question

router = APIRouter()


# ── Get report by ID ──────────────────────────────────────
@router.get("/reports/{report_id}")
def get_report(report_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("graded_reports").select("*").eq("id", report_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return result.data[0]


# ── Get report by submission ID ───────────────────────────
@router.get("/reports/submission/{submission_id}")
def get_report_by_submission(submission_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("graded_reports")\
        .select("*").eq("submission_id", submission_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found. Grade it first.")
    return result.data[0]


# ── Get all reports for an exam ───────────────────────────
@router.get("/reports/exam/{exam_id}")
def get_exam_reports(exam_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("graded_reports")\
        .select("id, student_name, total_score, max_score, percentage, created_at")\
        .eq("exam_id", exam_id)\
        .order("percentage", desc=True)\
        .execute()
    return {
        "reports": result.data,
        "count": len(result.data),
        "class_average": round(
            sum(r["percentage"] for r in result.data) / len(result.data), 1
        ) if result.data else 0
    }


# ── Download PDF report ───────────────────────────────────
@router.get("/reports/{report_id}/pdf")
def download_pdf(report_id: str, user: dict = Depends(get_current_user)):
    # Fetch report
    report_res = supabase.table("graded_reports").select("*").eq("id", report_id).execute()
    if not report_res.data:
        raise HTTPException(status_code=404, detail="Report not found")
    report = report_res.data[0]

    # Fetch exam for context
    exam_res = supabase.table("exams").select("*").eq("id", report["exam_id"]).execute()
    exam = exam_res.data[0] if exam_res.data else {}

    # Build PDF
    pdf_bytes = build_pdf(
        student_name=report.get("student_name", "Student"),
        exam=exam,
        report=report
    )

    filename = (
        f"Report_{report.get('student_name', 'student').replace(' ', '_')}"
        f"_{exam.get('subject', 'exam')}.pdf"
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── Download HTML report ───────────────────────────────────
@router.get("/reports/{report_id}/html")
def download_html(report_id: str, user: dict = Depends(get_current_user)):
    """Get HTML version of the report"""
    # Fetch report
    report_res = supabase.table("graded_reports").select("*").eq("id", report_id).execute()
    if not report_res.data:
        raise HTTPException(status_code=404, detail="Report not found")
    report = report_res.data[0]

    # Fetch exam for context
    exam_res = supabase.table("exams").select("*").eq("id", report["exam_id"]).execute()
    exam = exam_res.data[0] if exam_res.data else {}

    # Build HTML report
    html_content = build_html_report(
        student_name=report.get("student_name", "Student"),
        exam=exam,
        report=report
    )
    
    filename = f"Report_{report.get('student_name', 'student').replace(' ', '_')}_{exam.get('subject', 'exam')}.html"
    
    return HTMLResponse(
        content=html_content,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── Teacher edits a question's score (override AI) ───────
class EditScore(BaseModel):
    q_no: int
    new_score: int
    reason: str


@router.put("/reports/{report_id}/edit-score")
def edit_score(report_id: str, body: EditScore, user: dict = Depends(get_current_user)):
    """Teacher can manually override a single question score."""
    report_res = supabase.table("graded_reports").select("*").eq("id", report_id).execute()
    if not report_res.data:
        raise HTTPException(status_code=404, detail="Report not found")

    report    = report_res.data[0]
    breakdown = report.get("score_breakdown", [])

    # Update the specific question score
    updated  = False
    for q in breakdown:
        if q.get("q_no") == body.q_no:
            q["score"]    = body.new_score
            q["feedback"] = f"[Teacher edited] {body.reason}"
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail=f"Question {body.q_no} not found in report")

    # Recalculate total
    total = sum(q.get("score", 0) for q in breakdown)
    pct   = round((total / report["max_score"]) * 100, 1) if report["max_score"] else 0

    result = supabase.table("graded_reports").update({
        "score_breakdown": breakdown,
        "total_score":     total,
        "percentage":      pct,
    }).eq("id", report_id).execute()

    return {
        "message":     f"Q{body.q_no} score updated to {body.new_score}",
        "new_total":   total,
        "new_percentage": pct,
        "report":      result.data[0]
    }


# ── AI Re-grade a single question ─────────────────────────
class RegradeRequest(BaseModel):
    q_no: int
    teacher_comment: str


@router.post("/reports/{report_id}/regrade")
def regrade(report_id: str, body: RegradeRequest, user: dict = Depends(get_current_user)):
    """Ask AI to re-evaluate one question based on teacher's comment."""
    report_res = supabase.table("graded_reports").select("*").eq("id", report_id).execute()
    if not report_res.data:
        raise HTTPException(status_code=404, detail="Report not found")
    report = report_res.data[0]

    exam_res = supabase.table("exams").select("*").eq("id", report["exam_id"]).execute()
    exam = exam_res.data[0]

    # Find the question
    question_data = next((q for q in exam["questions"] if q["q_no"] == body.q_no), None)
    if not question_data:
        raise HTTPException(status_code=404, detail=f"Question {body.q_no} not found")

    # Find student's answer in the submission
    sub_res = supabase.table("submissions")\
        .select("extracted_text")\
        .eq("id", report["submission_id"]).execute()
    student_text = sub_res.data[0]["extracted_text"] if sub_res.data else ""

    # Call AI re-grade
    new_grade = regrade_question(
        q_no=body.q_no,
        question=question_data["question"],
        expected_answer=question_data["expected_answer"],
        student_answer=student_text,
        max_marks=question_data["max_marks"],
        teacher_comment=body.teacher_comment
    )

    # Update breakdown
    breakdown = report.get("score_breakdown", [])
    for q in breakdown:
        if q.get("q_no") == body.q_no:
            q["score"]    = new_grade.get("new_score", q["score"])
            q["feedback"] = new_grade.get("feedback", q["feedback"])
            break

    total = sum(q.get("score", 0) for q in breakdown)
    pct   = round((total / report["max_score"]) * 100, 1) if report["max_score"] else 0

    supabase.table("graded_reports").update({
        "score_breakdown": breakdown,
        "total_score": total,
        "percentage": pct,
    }).eq("id", report_id).execute()

    return {
        "message":        f"Q{body.q_no} re-graded by AI",
        "new_score":      new_grade.get("new_score"),
        "new_feedback":   new_grade.get("feedback"),
        "new_total":      total,
        "new_percentage": pct
    }


# ── Class analytics ────────────────────────────────────────
@router.get("/analytics/exam/{exam_id}")
def exam_analytics(exam_id: str, user: dict = Depends(get_current_user)):
    reports_res = supabase.table("graded_reports")\
        .select("student_name, total_score, max_score, percentage")\
        .eq("exam_id", exam_id)\
        .order("percentage", desc=True)\
        .execute()

    data = reports_res.data
    if not data:
        return {"message": "No graded reports yet for this exam"}

    scores = [r["percentage"] for r in data]
    return {
        "exam_id":        exam_id,
        "total_students": len(data),
        "class_average":  round(sum(scores) / len(scores), 1),
        "highest_score":  max(scores),
        "lowest_score":   min(scores),
        "passed":         sum(1 for s in scores if s >= 35),
        "failed":         sum(1 for s in scores if s < 35),
        "rank_list":      data
    }