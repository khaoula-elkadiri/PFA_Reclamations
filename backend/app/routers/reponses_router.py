"""Endpoints pour les réponses des agents aux réclamations."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Any

from backend.app.database import get_db
from backend.app.models import Reclamation, ReponseReclamation, Agent, Client, Notification
from backend.app.schemas import ReponseCreate, ReponseOut
from backend.app.auth import get_current_agent, get_current_client, get_optional_client

router = APIRouter(prefix="/reponse", tags=["reponses"])


@router.get("/reclamation/{id_reclamation}/agent")
def get_reponse_agent(
    id_reclamation: int,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Retourne la réponse (accès agent uniquement)."""
    reponse = db.query(ReponseReclamation).filter(
        ReponseReclamation.id_reclamation == id_reclamation
    ).first()

    if not reponse:
        return None

    return {
        "id_reponse": reponse.id_reponse,
        "id_reclamation": reponse.id_reclamation,
        "contenu": reponse.contenu,
        "date_envoi": reponse.date_envoi,
        "nom_agent": reponse.agent.nom if reponse.agent else None,
        "prenom_agent": reponse.agent.prenom if reponse.agent else None,
    }


@router.get("/reclamation/{id_reclamation}/client")
def get_reponse_client(
    id_reclamation: int,
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client),
):
    """Retourne la réponse au client propriétaire de la réclamation."""
    rec = db.query(Reclamation).filter(Reclamation.id_reclamation == id_reclamation).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Réclamation introuvable")

    reponse = db.query(ReponseReclamation).filter(
        ReponseReclamation.id_reclamation == id_reclamation
    ).first()

    if not reponse:
        return None

    return {
        "id_reponse": reponse.id_reponse,
        "id_reclamation": reponse.id_reclamation,
        "contenu": reponse.contenu,
        "date_envoi": reponse.date_envoi,
        "nom_agent": reponse.agent.nom if reponse.agent else None,
        "prenom_agent": reponse.agent.prenom if reponse.agent else None,
    }


@router.post("/reclamation/{id_reclamation}", response_model=ReponseOut)
def creer_reponse(
    id_reclamation: int,
    data: ReponseCreate,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """L'agent envoie une réponse à une réclamation."""
    rec = db.query(Reclamation).filter(Reclamation.id_reclamation == id_reclamation).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Réclamation introuvable")

    # Vérifier qu'une réponse n'existe pas déjà
    existing = db.query(ReponseReclamation).filter(
        ReponseReclamation.id_reclamation == id_reclamation
    ).first()
    if existing:
        # Mettre à jour la réponse existante
        existing.contenu = data.contenu
        existing.id_agent = current_agent.id_agent
        db.commit()
        db.refresh(existing)
        reponse = existing
    else:
        reponse = ReponseReclamation(
            id_reclamation=id_reclamation,
            id_agent=current_agent.id_agent,
            contenu=data.contenu,
        )
        db.add(reponse)

    # Passer la réclamation en statut "en_traitement"
    if rec.statut_reclamation in ("en_attente", "en_analyse", "affectee"):
        rec.statut_reclamation = "en_traitement"

    # Notifier le client
    notif = Notification(
        id_client=rec.id_client,
        id_reclamation=id_reclamation,
        message=f"L'agent {current_agent.prenom} {current_agent.nom} a répondu à votre réclamation.",
        type_notification="mise_a_jour",
    )
    db.add(notif)
    db.commit()
    db.refresh(reponse)

    return ReponseOut(
        id_reponse=reponse.id_reponse,
        id_reclamation=reponse.id_reclamation,
        contenu=reponse.contenu,
        date_envoi=reponse.date_envoi,
        nom_agent=current_agent.nom,
        prenom_agent=current_agent.prenom,
    )
