import os
import io
import json
import pdfplumber
from PIL import Image
from typing import List
from fastapi import UploadFile

# Google Cloud Vision setup
VISION_AVAILABLE = False
vision_client = None

try:
    from google.cloud import vision as gvision
    from google.oauth2 import service_account
    
    # Try multiple environment variable names
    creds_json = None
    env_names = ["GOOGLE_VISION_CREDENTIALS", "GOOGLE_CREDENTIALS", "VISION_CREDENTIALS", "GOOGLE_APPLICATION_CREDENTIALS_JSON"]
    
    for env_name in env_names:
        creds_json = os.getenv(env_name)
        if creds_json:
            print(f"✅ Found credentials in {env_name}")
            break
    
    if creds_json:
        # Parse the JSON string
        creds_dict = json.loads(creds_json)
        credentials = service_account.Credentials.from_service_account_info(creds_dict)
        vision_client = gvision.ImageAnnotatorClient(credentials=credentials)
        VISION_AVAILABLE = True
        print("✅ Google Vision OCR initialized successfully")
    else:
        print("⚠️ No credentials found in any environment variable")
        print(f"Available env vars: {list(os.environ.keys())}")
        
except ImportError:
    print("⚠️ Google Cloud Vision not installed - run: pip install google-cloud-vision")
except json.JSONDecodeError as e:
    print(f"⚠️ Invalid JSON in credentials: {e}")
except Exception as e:
    print(f"⚠️ Google Vision init error: {e}")


def extract_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a typed/digital PDF."""
    text_parts = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text and text.strip():
                    text_parts.append(f"[Page {i+1}]\n{text.strip()}")
        return "\n\n".join(text_parts) if text_parts else None
    except Exception as e:
        raise ValueError(f"PDF extraction failed: {str(e)}")


def extract_from_image_google(file_bytes: bytes) -> str:
    """Extract text from image using Google Cloud Vision."""
    if not VISION_AVAILABLE or vision_client is None:
        raise ValueError(
            "Google Vision is not configured. "
            "Please set GOOGLE_VISION_CREDENTIALS environment variable with your service account JSON."
        )
    
    image = gvision.Image(content=file_bytes)
    response = vision_client.document_text_detection(image=image)
    
    if response.error.message:
        raise ValueError(f"Google Vision error: {response.error.message}")
    
    return response.full_text_annotation.text


def _ocr_scanned_pdf(file_bytes: bytes) -> str:
    """Convert scanned PDF pages to images and OCR them via Google Vision."""
    try:
        from pdf2image import convert_from_bytes
        pages = convert_from_bytes(file_bytes)
        results = []
        for i, page in enumerate(pages):
            buf = io.BytesIO()
            page.save(buf, format="PNG")
            text = extract_from_image_google(buf.getvalue())
            results.append(f"[Page {i+1}]\n{text}")
        return "\n\n".join(results)
    except ImportError:
        raise ValueError("pdf2image not installed. Run: pip install pdf2image")
    except Exception as e:
        raise ValueError(f"Scanned PDF OCR failed: {str(e)}")


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Main entry point - auto-detects file type and extracts text."""
    filename_lower = filename.lower()

    # PDF files
    if filename_lower.endswith(".pdf"):
        text = extract_from_pdf(file_bytes)
        
        # If no text extracted, it's a scanned PDF - use Google Vision
        if not text or len(text.strip()) < 20:
            if VISION_AVAILABLE:
                return _ocr_scanned_pdf(file_bytes)
            else:
                raise ValueError(
                    "This PDF appears to be scanned/handwritten. "
                    "Text extraction requires Google Vision. "
                    "Please set GOOGLE_VISION_CREDENTIALS environment variable."
                )
        return text

    # Image files - use Google Vision
    elif filename_lower.endswith((".jpg", ".jpeg", ".png", ".webp")):
        if VISION_AVAILABLE:
            return extract_from_image_google(file_bytes)
        else:
            raise ValueError(
                "Image OCR requires Google Vision. "
                "Please set GOOGLE_VISION_CREDENTIALS environment variable."
            )

    else:
        raise ValueError(f"Unsupported file type: {filename}. Supported: PDF, JPG, JPEG, PNG, WEBP")


async def extract_text_from_multiple_files(files: List[UploadFile]) -> str:
    """Extract text from multiple uploaded files (PDFs or images)."""
    all_text_parts = []
    
    for idx, file in enumerate(files):
        try:
            file_bytes = await file.read()
            filename = file.filename
            
            text = extract_text(file_bytes, filename)
            
            if text and text.strip():
                all_text_parts.append(f"=== Document {idx + 1}: {filename} ===\n{text}")
            else:
                print(f"Warning: No text extracted from {filename}")
                
        except Exception as e:
            raise ValueError(f"Error processing {file.filename}: {str(e)}")
    
    if not all_text_parts:
        raise ValueError("No text could be extracted from any of the uploaded files")
    
    return "\n\n".join(all_text_parts)