from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from utils.database import supabase
from utils.auth import hash_password, verify_password, create_token

router = APIRouter()


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    existing = supabase.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    result = supabase.table("users").insert({
        "full_name": body.full_name,
        "email": body.email,
        "password_hash": hash_password(body.password),
    }).execute()

    user  = result.data[0]
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["full_name"], "email": user["email"]}
    }


@router.post("/login")
def login(body: LoginRequest):
    result = supabase.table("users").select("*").eq("email", body.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["full_name"], "email": user["email"]}
    }
