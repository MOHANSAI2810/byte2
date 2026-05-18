import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

from utils.prompts import get_grading_prompt, get_regrade_prompt

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCPq7PTGD0b-CGFqlHmCZbOBSW3AFh1a58")
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = 'gemini-2.5-flash'  # or 'gemini-1.5-pro' for better quality
# Available models: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash-exp


def _call_llm(prompt: str, max_tokens: int = 4000):
    """Call Gemini API with the given prompt."""
    model = genai.GenerativeModel(MODEL_NAME)
    
    response = model.generate_content(
        prompt,
        generation_config={
            "max_output_tokens": max_tokens,
            "temperature": 0.1,  # Low temperature for consistent grading
            "top_p": 0.95,
        }
    )
    
    # Handle response
    if response.text:
        return response.text
    elif response.prompt_feedback:
        raise Exception(f"Prompt blocked: {response.prompt_feedback}")
    else:
        raise Exception("No response from Gemini")


def _parse_json(raw: str) -> dict:
    try:
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "error": "JSON parse failed",
            "raw_response": raw[:500],
            "score_breakdown": [],
            "total_score": 0,
            "max_score": 0,
            "percentage": 0,
            "concept_gaps": "Could not parse AI response. Please retry.",
            "improvement_tips": "Please retry grading.",
            "writing_quality": "N/A",
            "performance_trend": "N/A",
            "parent_summary": "N/A"
        }


def grade_paper(
    subject: str,
    student_class: str,
    student_name: str,
    questions: list,
    extracted_text: str
) -> dict:
    prompt = get_grading_prompt(
        subject=subject,
        student_class=student_class,
        student_name=student_name,
        questions=questions,
        student_answers_text=extracted_text
    )
    raw = _call_llm(prompt, max_tokens=4000)
    result = _parse_json(raw)

    if result.get("total_score") and result.get("max_score"):
        result["percentage"] = round(
            (result["total_score"] / result["max_score"]) * 100, 1
        )
    else:
        # Fallback: calculate from score_breakdown if available
        breakdown = result.get("score_breakdown", [])
        if breakdown:
            total = sum(q.get("score", 0) for q in breakdown)
            max_score = sum(q.get("max_marks", 0) for q in breakdown)
            result["total_score"] = total
            result["max_score"] = max_score
            result["percentage"] = round((total / max_score) * 100, 1) if max_score > 0 else 0

    return result


def regrade_question(
    q_no: int,
    question: str,
    expected_answer: str,
    student_answer: str,
    max_marks: int,
    teacher_comment: str
) -> dict:
    prompt = get_regrade_prompt(
        q_no=q_no,
        question=question,
        expected_answer=expected_answer,
        student_answer=student_answer,
        max_marks=max_marks,
        teacher_comment=teacher_comment
    )
    raw = _call_llm(prompt, max_tokens=500)
    return _parse_json(raw)