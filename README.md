# AI Paper Evaluator
### Upload student answer sheet → AI grades it → Full 6-section report + PDF

---

## What this does (purely answer paper evaluation)

1. Teacher creates an exam — pastes questions + expected answers (rubric)
2. Teacher uploads a student's answer sheet (PDF or image)
3. AI reads the paper (OCR), compares with rubric, grades every question
4. System generates a detailed 6-section report:
   - Score breakdown (per question)
   - Concept gaps
   - Improvement tips
   - Writing quality
   - Performance trend
   - Parent summary
5. Download as PDF

---

## Setup in VS Code (step by step)

### Step 1 — Open in VS Code
Extract the zip. Open the folder in VS Code.
```
File → Open Folder → select ai-paper-evaluator/
```

### Step 2 — Create virtual environment
Open the VS Code terminal (Ctrl + `) and run:
```bash
python -m venv venv
```

Activate it:
```bash
# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

### Step 3 — Install all packages
```bash
pip install -r requirements.txt
```

### Step 4 — Set up your API keys
```bash
cp .env.example .env
```
Now open `.env` and fill in:
```
ANTHROPIC_API_KEY=your_key_from_console.anthropic.com
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_KEY=your_anon_key_from_supabase
JWT_SECRET=any_long_random_string_like_this_abc123xyz
```

### Step 5 — Set up the database
- Go to https://supabase.com → your project → SQL Editor
- Open the file `db/schema.sql`
- Copy the entire content → paste in Supabase SQL Editor → click Run
- All 4 tables are created instantly

### Step 6 — Create Supabase Storage bucket
- Go to Supabase → Storage → New bucket
- Name: `answer-sheets`
- Public: No (keep it private)
- Click Create

### Step 7 — Run the server
```bash
uvicorn main:app --reload
```

Server starts at: http://localhost:8000
API docs (Swagger): http://localhost:8000/docs

---

## How to use it (test in browser)

Open http://localhost:8000/docs — this is your interactive testing page.

### Step 1 — Register a teacher
```
POST /auth/register
{
  "full_name": "Priya Sharma",
  "email": "priya@school.com",
  "password": "test1234"
}
```
Copy the `token` from the response.

### Step 2 — Authorize
Click the `Authorize` button (top right in /docs).
Enter: `Bearer <your_token>`

### Step 3 — Create an exam
```
POST /api/exams
{
  "title": "Unit Test 1 - Science",
  "subject": "Science",
  "class_name": "Class 8",
  "total_marks": 20,
  "questions": [
    {
      "q_no": 1,
      "question": "What is photosynthesis? Explain the process.",
      "max_marks": 10,
      "expected_answer": "Photosynthesis is the process by which plants make food using sunlight, water and CO2. Chlorophyll absorbs sunlight. The plant takes in CO2 through stomata and water through roots. Glucose and oxygen are produced.",
      "keywords": ["sunlight", "chlorophyll", "CO2", "glucose", "oxygen", "stomata"]
    },
    {
      "q_no": 2,
      "question": "State Newton's second law of motion.",
      "max_marks": 10,
      "expected_answer": "Newton's second law states that force equals mass times acceleration. F = ma. The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.",
      "keywords": ["force", "mass", "acceleration", "F=ma", "proportional"]
    }
  ]
}
```
Copy the `id` from the response — this is your `exam_id`.

### Step 4 — Upload student answer sheet
```
POST /api/submissions/upload
Form data:
  exam_id: <exam_id from step 3>
  student_name: Rahul Verma
  student_roll: 12
  file: <upload a PDF or image of the answer sheet>
```
Copy the `submission_id` from the response.

### Step 5 — Grade it
```
POST /api/submissions/grade
{
  "submission_id": "<submission_id from step 4>"
}
```
Wait 3-5 seconds. You get the full graded report back instantly.

### Step 6 — Download PDF
```
GET /api/reports/<report_id>/pdf
```
Opens/downloads a formatted PDF report.

---

## All API endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | /auth/register | Create teacher account |
| POST | /auth/login | Login, get token |
| POST | /api/exams | Create exam with questions + rubric |
| GET | /api/exams | List all your exams |
| GET | /api/exams/:id | Get one exam |
| POST | /api/submissions/upload | Upload student answer sheet |
| POST | /api/submissions/grade | AI grades the submission |
| GET | /api/submissions/exam/:id | All submissions for an exam |
| GET | /api/reports/:id | Get full report JSON |
| GET | /api/reports/submission/:id | Get report by submission |
| GET | /api/reports/exam/:id | All reports for an exam |
| GET | /api/reports/:id/pdf | Download PDF report |
| PUT | /api/reports/:id/edit-score | Teacher edits a question score |
| POST | /api/reports/:id/regrade | AI re-grades one question |
| GET | /api/analytics/exam/:id | Class analytics, rank list |

---

## File structure
```
ai-paper-evaluator/
├── main.py                    ← run this to start server
├── requirements.txt           ← all packages
├── .env.example               ← copy to .env and add keys
├── .gitignore
├── db/
│   └── schema.sql             ← paste in Supabase SQL editor
├── routes/
│   ├── auth.py                ← register, login
│   ├── exams.py               ← create question paper + rubric
│   ├── submissions.py         ← upload answer sheet + grade
│   └── reports.py             ← fetch report, PDF, edit, analytics
├── services/
│   ├── ocr.py                 ← text extraction (PDF/image)
│   ├── llm.py                 ← Claude API grading
│   └── report_builder.py      ← PDF generation
└── utils/
    ├── auth.py                ← JWT helpers
    ├── database.py            ← Supabase client
    └── prompts.py             ← LLM prompt templates (tweak this for quality)
```

---

## Keys you need (all free tiers available)

| Key | Where to get it | Free tier |
|-----|----------------|-----------|
| ANTHROPIC_API_KEY | console.anthropic.com | $5 free credit |
| SUPABASE_URL + KEY | supabase.com | Free forever |
| JWT_SECRET | Just type any random string | No signup needed |

---

## For handwritten papers (optional)
By default the system handles typed PDFs perfectly.
For handwritten answer sheets, set up Google Cloud Vision:
1. Go to console.cloud.google.com
2. Enable Vision API
3. Create a service account → download JSON key
4. Set GOOGLE_VISION_CREDENTIALS=path/to/key.json in .env

---

## Common errors and fixes

| Error | Fix |
|-------|-----|
| `ANTHROPIC_API_KEY not set` | Add key to .env file |
| `PDF appears to be scanned` | Use a typed PDF for testing first |
| `Submission not found` | Make sure you uploaded first, then grade |
| `Sum of marks mismatch` | total_marks must equal sum of all question marks |
| `Table not found` | Run db/schema.sql in Supabase SQL editor |
