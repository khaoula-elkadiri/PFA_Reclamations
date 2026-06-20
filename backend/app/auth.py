"""Utilitaires d'authentification JWT + hashage de mots de passe."""
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Agent, Client

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "pfa_reclamations_secret_key_2024")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_AGENT = int(os.getenv("JWT_EXPIRE_HOURS_AGENT", "8"))
EXPIRE_CLIENT = int(os.getenv("JWT_EXPIRE_HOURS_CLIENT", "24"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict, expires_hours: int) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=expires_hours)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[dict]:
    if not credentials:
        return None
    try:
        return jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_current_agent(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Agent:
    payload = _decode_token(credentials)
    if not payload or payload.get("type") != "agent":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification agent requise",
            headers={"WWW-Authenticate": "Bearer"},
        )
    agent = db.query(Agent).filter(Agent.id_agent == int(payload["sub"])).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Agent introuvable")
    return agent


def get_current_client(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Client:
    payload = _decode_token(credentials)
    if not payload or payload.get("type") != "client":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification client requise",
            headers={"WWW-Authenticate": "Bearer"},
        )
    client = db.query(Client).filter(Client.id_client == int(payload["sub"])).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client introuvable")
    return client


def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Agent:
    payload = _decode_token(credentials)
    if not payload or payload.get("type") != "agent":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification administrateur requise",
            headers={"WWW-Authenticate": "Bearer"},
        )
    agent = db.query(Agent).filter(Agent.id_agent == int(payload["sub"])).first()
    if not agent or agent.role != "administrateur":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès administrateur requis")
    return agent


def get_optional_client(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[Client]:
    payload = _decode_token(credentials)
    if not payload or payload.get("type") != "client":
        return None
    return db.query(Client).filter(Client.id_client == int(payload["sub"])).first()
