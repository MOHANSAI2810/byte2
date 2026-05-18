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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCPq7PTGD0b-CGFqlHmCZbOBSW3AFh1a58")
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


# ── Helper: AI extracts questions from PDF text ──────────────

def _extract_exam_from_pdfs(question_text: str, answer_key_text: str, total_marks: int) -> list:
    prompt = f"""
You are an expert exam parser. You will be given:
1. A QUESTION PAPER (with questions and mark allocations)
2. An ANSWER KEY (with expected answers)

Your job is to extract and match them into structured JSON.

IMPORTANT: Detect if a question has internal choices (like "OR", "Choose any one", "Attempt any one").

QUESTION PAPER:
{question_text}

ANSWER KEY:
{answer_key_text}

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

For questions with CHOICES (like Q3 has "OR" between two questions):
[
  {{
    "q_no": 3,
    "question": "Question 3: (a) Explain Newton's laws? OR (b) Describe thermodynamics?",
    "max_marks": 6,
    "has_choices": true,
    "choices": [
      {{
        "choice_text": "(a) Explain Newton's laws of motion.",
        "expected_answer": "Newton's first law states...",
        "keywords": ["inertia", "force", "acceleration"]
      }},
      {{
        "choice_text": "(b) Describe the laws of thermodynamics.",
        "expected_answer": "First law: Energy cannot be created...",
        "keywords": ["energy", "entropy", "heat"]
      }}
    ]
  }}
]

Rules:
- Match each question with its answer from the answer key
- For questions with "OR", "Choose any one", "Attempt any one", set has_choices=true and populate choices array
- Extract keywords from the expected answer (important terms)
- max_marks should match what is written in the question paper
- Return ONLY the JSON array, nothing else
"""
    
    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(
        prompt,
        generation_config={
            "max_output_tokens": 4000,
            "temperature": 0.1,
        }
    )
    
    raw = response.text
    cleaned = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="AI could not parse the PDFs. Please make sure both PDFs are clear and readable."
        )


# ── Create exam by uploading PDFs ───────────────────────────

@router.post("/exams/upload-pdf", status_code=201)
async def create_exam_from_pdf(
    title: str = Form(...),
    subject: str = Form(...),
    class_name: str = Form(...),
    total_marks: int = Form(...),
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
        questions = _extract_exam_from_pdfs(question_text, answer_text, total_marks)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")

    marks_sum = sum(q.get("max_marks", 0) for q in questions)
    if marks_sum != total_marks and questions:
        diff = total_marks - marks_sum
        questions[-1]["max_marks"] += diff

    result = supabase.table("exams").insert({
        "teacher_id":  user["sub"],
        "title":       title,
        "subject":     subject,
        "class":       class_name,
        "total_marks": total_marks,
        "questions":   questions,
    }).execute()

    exam = result.data[0]
    exam["questions_extracted"] = len(questions)
    return exam


# ── Extract questions from uploaded files ───────────────────

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
        questions = _extract_exam_from_pdfs(question_text, answer_text, 100)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")
        
    return {"questions": questions}


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