import os
import json
from openai import OpenAI
from dotenv import load_dotenv

from utils.prompts import get_grading_prompt, get_regrade_prompt

load_dotenv()

# Switch from Groq to DeepSeek
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1"
)

MODEL = "deepseek-chat"  # Options: "deepseek-chat", "deepseek-coder"


def _call_llm(prompt: str, max_tokens: int = 4000):
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.3  # Lower temperature for more consistent grading
    )
    return response.choices[0].message.content


def _parse_json(raw: str) -> dict:
    try:
        # Remove markdown code blocks if present
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        # DeepSeek sometimes adds extra text before/after JSON
        # Try to find JSON object in the response
        start_idx = cleaned.find('{')
        end_idx = cleaned.rfind('}') + 1
        if start_idx != -1 and end_idx > start_idx:
            cleaned = cleaned[start_idx:end_idx]
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