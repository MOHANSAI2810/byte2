from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from utils.database import supabase
from utils.auth import get_current_user
from services.ocr import extract_text_from_multiple_files
import google.generativeai as genai
import os, json
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured. Please set it in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.5-flash"


# ── Models ───────────────────────────────────────────────────

class Choice(BaseModel):
    choice_text: str
    expected_answer: str
    keywords: Optional[List[str]] = []


class Question(BaseModel):
    q_no: int
    question: str
    max_marks: int
    has_choices: bool = False
    choices: Optional[List[Choice]] = []
    expected_answer: Optional[str] = ""
    keywords: Optional[List[str]] = []


class ExamCreate(BaseModel):
    title: str
    subject: str
    class_name: str
    total_marks: int
    questions: List[Question]


# ── Helper: AI extracts questions from extracted text ──────────────

def _extract_exam_from_text(extracted_text: str, answer_text: str, total_marks: int) -> list:
    """Extract questions from OCR-extracted text from images or PDFs."""
    
    prompt = f"""
You are an expert exam parser. You will be given:
1. A QUESTION PAPER (extracted text from images/PDF - may have some OCR errors)
2. An ANSWER KEY (with expected answers)

Your job is to extract and match them into structured JSON.

IMPORTANT: 
- The text may come from OCR on images, so there might be minor typos or formatting issues.
- Detect if a question has internal choices (like "OR", "Choose any one", "Attempt any one").
- Look for question numbers (1., 1), Q1, etc.)

EXTRACTED QUESTION PAPER TEXT:
{extracted_text}

ANSWER KEY TEXT:
{answer_text}

TOTAL MARKS: {total_marks}

Return ONLY a valid JSON array with this exact structure (no extra text, no markdown):

For REGULAR questions (no choices):
[
  {{
    "q_no": 1,
    "question": "Full question text here",
    "max_marks": 4,
    "has_choices": false,
    "expected_answer": "Full expected answer from answer key",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }}
]

For questions with CHOICES (like "OR" between two questions):
[
  {{
    "q_no": 3,
    "question": "Question 3 text with OR options",
    "max_marks": 6,
    "has_choices": true,
    "choices": [
      {{
        "choice_text": "Option A text",
        "expected_answer": "Expected answer for option A",
        "keywords": ["keyword1", "keyword2"]
      }},
      {{
        "choice_text": "Option B text",
        "expected_answer": "Expected answer for option B",
        "keywords": ["keyword3", "keyword4"]
      }}
    ]
  }}
]

Rules:
- Match each question with its answer from the answer key
- For questions with "OR", "Choose any one", "Attempt any one", set has_choices=true
- Extract keywords from the expected answer (important terms)
- max_marks should be based on the marking scheme in the paper
- Return ONLY the JSON array, nothing else
"""
    
    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(
        prompt,
        generation_config={
            "max_output_tokens": 4000,
            "temperature": 0.1,
            "top_p": 0.95,
        }
    )
    
    raw = response.text
    print(f"Gemini response: {raw[:500]}")  # Debug
    
    cleaned = raw.replace("```json", "").replace("```", "").strip()
    
    # Try to extract JSON array if embedded
    import re
    json_match = re.search(r'\[.*\]', cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group()

    try:
        questions = json.loads(cleaned)
        return questions
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(f"Cleaned text: {cleaned[:500]}")
        raise HTTPException(
            status_code=500,
            detail=f"AI could not parse the exam. Raw response: {raw[:200]}"
        )


# ── Create exam by uploading images/PDFs ───────────────────────────

@router.post("/exams/upload-pdf", status_code=201)
async def create_exam_from_uploads(
    title: str = Form(...),
    subject: str = Form(...),
    class_name: str = Form(...),
    total_marks: int = Form(...),
    question_papers: List[UploadFile] = File(...),
    answer_keys: List[UploadFile] = File(...),
    user: dict = Depends(get_current_user)
):
    try:
        # Extract text from uploaded files (images or PDFs)
        question_text = await extract_text_from_multiple_files(question_papers)
        answer_text = await extract_text_from_multiple_files(answer_keys)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

    # Debug output
    print(f"Question text length: {len(question_text)}")
    print(f"Question text preview: {question_text[:500]}")
    print(f"Answer text length: {len(answer_text)}")
    print(f"Answer text preview: {answer_text[:500]}")
    
    if len(question_text) < 50:
        raise HTTPException(
            status_code=400, 
            detail=f"Only {len(question_text)} characters extracted. The images may be unclear or have poor quality. Please ensure images are clear and well-lit."
        )

    try:
        questions = _extract_exam_from_text(question_text, answer_text, total_marks)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")

    # Validate and adjust marks
    if questions and isinstance(questions, list):
        marks_sum = sum(q.get("max_marks", 0) for q in questions)
        if marks_sum != total_marks and questions:
            # Distribute remaining marks to last question
            diff = total_marks - marks_sum
            if diff > 0:
                questions[-1]["max_marks"] = questions[-1].get("max_marks", 0) + diff

    result = supabase.table("exams").insert({
        "teacher_id":  user["sub"],
        "title":       title,
        "subject":     subject,
        "class":       class_name,
        "total_marks": total_marks,
        "questions":   questions if questions else [],
    }).execute()

    exam = result.data[0]
    exam["questions_extracted"] = len(questions) if questions else 0
    return exam


# ── Extract questions from uploaded files (for preview) ───────────────────

@router.post("/exams/extract-questions")
async def extract_questions_from_images(
    question_papers: List[UploadFile] = File(...),
    answer_keys: List[UploadFile] = File(...),
    user: dict = Depends(get_current_user)
):
    try:
        question_text = await extract_text_from_multiple_files(question_papers)
        answer_text = await extract_text_from_multiple_files(answer_keys)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

    try:
        questions = _extract_exam_from_text(question_text, answer_text, 100)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")
        
    return {"questions": questions, "extracted_text": question_text[:1000]}


# ── Create exam manually with JSON ───────────────────────────

@router.post("/exams", status_code=201)
def create_exam(body: ExamCreate, user: dict = Depends(get_current_user)):
    marks_sum = sum(q.max_marks for q in body.questions)
    if marks_sum != body.total_marks:
        raise HTTPException(
            status_code=400,
            detail=f"Sum of question marks ({marks_sum}) does not match total_marks ({body.total_marks})"
        )
    result = supabase.table("exams").insert({
        "teacher_id":  user["sub"],
        "title":       body.title,
        "subject":     body.subject,
        "class":       body.class_name,
        "total_marks": body.total_marks,
        "questions":   [q.model_dump() for q in body.questions],
    }).execute()
    return result.data[0]


# ── Get all exams ─────────────────────────────────────────────

@router.get("/exams")
def get_exams(user: dict = Depends(get_current_user)):
    result = supabase.table("exams")\
        .select("id, title, subject, class, total_marks, created_at")\
        .eq("teacher_id", user["sub"])\
        .order("created_at", desc=True)\
        .execute()
    return {"exams": result.data, "count": len(result.data)}


# ── Get single exam ───────────────────────────────────────────

@router.get("/exams/{exam_id}")
def get_exam(exam_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("exams").select("*").eq("id", exam_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Exam not found")
    return result.data[0]


# ── Delete exam ───────────────────────────────────────────────

@router.delete("/exams/{exam_id}", status_code=204)
def delete_exam(exam_id: str, user: dict = Depends(get_current_user)):
    supabase.table("exams").delete()\
        .eq("id", exam_id)\
        .eq("teacher_id", user["sub"])\
        .execute()
    return None