from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, exams, submissions, reports
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="AI Paper Evaluator",
    description="Upload answer sheets → AI grades them → Detailed 6-section report",
    version="1.0.0"
)

# Updated CORS with your Netlify URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://ai-paper-evaluator.netlify.app",  # Your frontend URL
        "https://ai-paper-evaluator-6nsp.onrender.com",  # Your backend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/auth",  tags=["Auth"])
app.include_router(exams.router,       prefix="/api",   tags=["Exams"])
app.include_router(submissions.router, prefix="/api",   tags=["Submissions"])
app.include_router(reports.router,     prefix="/api",   tags=["Reports"])


@app.get("/")
def root():
    return {
        "message": "AI Paper Evaluator API is running",
        "docs": "/docs",
        "flow": [
            "1. POST /auth/register — create teacher account",
            "2. POST /auth/login    — get token",
            "3. POST /api/exams     — create exam with questions + rubric",
            "4. POST /api/submissions/upload — upload student answer sheet (PDF/image)",
            "5. POST /api/submissions/grade  — AI grades it, generates full report",
            "6. GET  /api/reports/:id        — fetch 6-section report",
            "7. GET  /api/reports/:id/pdf    — download PDF report"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)