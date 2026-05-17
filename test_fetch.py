import asyncio
import httpx
import os
from utils.auth import create_token

async def main():
    token = create_token("test_user_1", "test@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            files = {
                "question_paper": ("dummy_q.pdf", b"%PDF-1.4\n1 0 obj\n...", "application/pdf"),
                "answer_key": ("dummy_a.pdf", b"%PDF-1.4\n1 0 obj\n...", "application/pdf")
            }
            response = await client.post("http://localhost:8000/api/exams/extract-questions", files=files, headers=headers)
            print(response.status_code, response.text)
        except Exception as e:
            print("Failed to fetch:", str(e))

asyncio.run(main())
