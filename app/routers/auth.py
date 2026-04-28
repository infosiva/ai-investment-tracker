from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(req: LoginRequest):
    # TODO: implement real auth with JWT + database
    return {"token": "placeholder_jwt", "email": req.email}

@router.post("/register")
async def register(req: LoginRequest):
    # TODO: implement real registration
    return {"message": "User registered", "email": req.email}
