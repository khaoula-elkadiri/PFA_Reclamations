"""Endpoints d'authentification : login agent, login client, inscription client."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Agent, Client
from backend.app.schemas import (
    AgentLoginRequest, ClientLoginRequest, ClientRegisterRequest, TokenResponse
)
from backend.app.auth import (
    verify_password, hash_password, create_token,
    get_current_agent, get_current_client, EXPIRE_AGENT, EXPIRE_CLIENT
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/agent/login", response_model=TokenResponse)
def login_agent(data: AgentLoginRequest, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.email == data.email).first()
    if not agent or not agent.mot_de_passe_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    if not verify_password(data.mot_de_passe, agent.mot_de_passe_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    token = create_token(
        {"sub": str(agent.id_agent), "type": "agent", "role": agent.role},
        EXPIRE_AGENT,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_type="agent",
        user_info={
            "id": agent.id_agent,
            "nom": agent.nom,
            "prenom": agent.prenom,
            "email": agent.email,
            "role": agent.role,
            "service": agent.service.nom_service if agent.service else None,
        },
    )


@router.post("/client/login", response_model=TokenResponse)
def login_client(data: ClientLoginRequest, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.email == data.email).first()
    if not client or not client.est_inscrit or not client.mot_de_passe_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    if not verify_password(data.mot_de_passe, client.mot_de_passe_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    token = create_token(
        {"sub": str(client.id_client), "type": "client"},
        EXPIRE_CLIENT,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_type="client",
        user_info={
            "id": client.id_client,
            "nom": client.nom,
            "prenom": client.prenom,
            "email": client.email,
        },
    )


@router.post("/client/register", response_model=TokenResponse)
def register_client(data: ClientRegisterRequest, db: Session = Depends(get_db)):
    # Vérifier si un compte existe déjà
    existing = db.query(Client).filter(Client.email == data.email).first()
    if existing and existing.est_inscrit:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email")

    if existing:
        # Lier les credentials au client existant (commandes préservées)
        existing.mot_de_passe_hash = hash_password(data.mot_de_passe)
        existing.est_inscrit = True
        client = existing
    else:
        # Créer un nouveau client
        client = Client(
            nom=data.nom,
            prenom=data.prenom,
            telephone=data.telephone,
            email=data.email,
            mot_de_passe_hash=hash_password(data.mot_de_passe),
            est_inscrit=True,
        )
        db.add(client)

    db.commit()
    db.refresh(client)

    token = create_token(
        {"sub": str(client.id_client), "type": "client"},
        EXPIRE_CLIENT,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_type="client",
        user_info={
            "id": client.id_client,
            "nom": client.nom,
            "prenom": client.prenom,
            "email": client.email,
        },
    )


@router.get("/me")
def get_me_agent(agent: Agent = Depends(get_current_agent)):
    return {
        "type": "agent",
        "id": agent.id_agent,
        "nom": agent.nom,
        "prenom": agent.prenom,
        "email": agent.email,
        "role": agent.role,
        "service": agent.service.nom_service if agent.service else None,
    }


@router.get("/me/client")
def get_me_client(client: Client = Depends(get_current_client)):
    return {
        "type": "client",
        "id": client.id_client,
        "nom": client.nom,
        "prenom": client.prenom,
        "email": client.email,
    }
