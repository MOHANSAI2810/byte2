import json


def get_grading_prompt(
    subject: str,
    student_class: str,
    student_name: str,
    questions: list,
    student_answers_text: str
) -> str:
    """
    Master prompt — sends question paper + rubric + student answer to AI.
    Returns structured JSON with per-question scores + 6-section analysis.
    """

    questions_block = ""
    total_marks = 0
    
    for q in questions:
        if q.get('has_choices', False):
            # Question with internal choices
            choices_text = ""
            for idx, choice in enumerate(q.get('choices', []), 1):
                choice_label = chr(96 + idx)  # a, b, c, ...
                choices_text += f"""
    Choice {choice_label}):
    Question: {choice.get('choice_text', '')}
    Expected Answer: {choice.get('expected_answer', '')}
    Keywords: {', '.join(choice.get('keywords', []))}
"""
            questions_block += f"""
Question {q['q_no']} ({q['max_marks']} marks) - [HAS INTERNAL CHOICES - Student can answer ANY ONE]:
{q['question']}

CHOICES AVAILABLE:
{choices_text}
---"""
        else:
            # Regular question
            questions_block += f"""
Question {q['q_no']} ({q['max_marks']} marks):
{q['question']}

Expected Answer / Rubric:
{q.get('expected_answer', '')}

Keywords to look for: {', '.join(q.get('keywords', []))}
---"""
        total_marks += q['max_marks']

    # FIXED: Removed the {total_score} placeholder since it's not needed in the prompt
    # The AI will fill in the actual score
    return f"""You are an expert academic evaluator and educational assessment specialist.

Student Name : {student_name}
Subject      : {subject}
Class        : {student_class}
Total Marks  : {total_marks}

=== QUESTION PAPER WITH RUBRIC ===
{questions_block}

=== STUDENT'S ANSWER SHEET (extracted text) ===
{student_answers_text}

=== YOUR TASK ===
Carefully evaluate the student's answers against each question's rubric and expected answer.

IMPORTANT: 
- For questions with INTERNAL CHOICES (marked with "[HAS INTERNAL CHOICES]"), the student only needs to answer ONE of the available choices.
- Identify which choice the student attempted and grade only that one.
- If the student attempted multiple choices for a single question, grade the best one.

Return ONLY a valid JSON object in exactly this format. No explanation outside the JSON.

{{
  "score_breakdown": [
    {{
      "q_no": 1,
      "score": 4,
      "max_marks": 5,
      "verdict": "Good",
      "feedback": "Correctly explained the concept but missed F=ma formula.",
      "choice_attempted": null
    }},
    {{
      "q_no": 3,
      "score": 6,
      "max_marks": 6,
      "verdict": "Excellent",
      "feedback": "Perfect answer for choice (a).",
      "choice_attempted": "a"
    }}
  ],
  "total_score": 18,
  "max_score": {total_marks},
  "percentage": 72.0,
  "concept_gaps": "The student has a weak understanding of Newton's third law and lacks clarity on the difference between speed and velocity.",
  "improvement_tips": "1. Revise Newton's laws of motion from Chapter 3. 2. Practice numerical problems on force and acceleration. 3. Focus on definitions — write them out 5 times each.",
  "writing_quality": "Answers are structured reasonably well. Student uses some key terms correctly but sentences are incomplete.",
  "performance_trend": "Based on this paper, the student is performing at an average level.",
  "parent_summary": "Your child scored [TOTAL_SCORE] out of {total_marks}. They understand basic concepts but need more practice."
}}

Scoring rules:
- Be fair but strict. Only award marks for correct content.
- For choice questions, only grade the choice the student attempted.
- Partial credit is allowed — award proportional marks for partially correct answers.
- If a question answer is not found in the student text, award 0.
- Keep feedback per question to 1-2 sentences maximum.
- concept_gaps: 2-4 specific concepts the student clearly does not understand.
- improvement_tips: exactly 3 numbered, specific, actionable study tips.
- writing_quality: comment on structure, clarity, keyword usage, diagrams if applicable.
- parent_summary: simple language, no jargon, 2-3 sentences max.
"""


def get_regrade_prompt(
    q_no: int,
    question: str,
    expected_answer: str,
    student_answer: str,
    max_marks: int,
    teacher_comment: str
) -> str:
    return f"""You are re-evaluating a single exam question based on a teacher's comment.

Question {q_no}: {question}
Max Marks: {max_marks}
Expected Answer: {expected_answer}
Student's Answer: {student_answer}
Teacher's Comment: {teacher_comment}

Re-evaluate and return ONLY this JSON:
{{
  "q_no": {q_no},
  "new_score": 3,
  "max_marks": {max_marks},
  "feedback": "Revised feedback here based on teacher comment."
}}"""