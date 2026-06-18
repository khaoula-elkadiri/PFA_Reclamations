"""
Logique d'affectation automatique des reclamations aux agents.
"""
from sqlalchemy.orm import Session

from backend.app.models import (
    Agent,
    Service,
    AffectationReclamation,
    Reclamation,
)


STATUTS_AFFECTATION_ACTIFS = ["affectee", "en_cours"]


def compter_affectations_actives_agent(db: Session, id_agent: int) -> int:
    """
    Compte les affectations encore actives pour un agent.
    """
    return db.query(AffectationReclamation).filter(
        AffectationReclamation.id_agent == id_agent,
        AffectationReclamation.statut_affectation.in_(STATUTS_AFFECTATION_ACTIFS)
    ).count()


def trouver_agent_disponible(db: Session, nom_service: str):
    """
    Trouve l'agent disponible le moins charge pour un service donne.
    """
    if not nom_service:
        return None

    service = db.query(Service).filter(
        Service.nom_service == nom_service
    ).first()

    if not service:
        return None

    agents_disponibles = db.query(Agent).filter(
        Agent.id_service == service.id_service,
        Agent.disponible == True
    ).all()

    if not agents_disponibles:
        return None

    return min(
        agents_disponibles,
        key=lambda agent: compter_affectations_actives_agent(db, agent.id_agent)
    )


def affecter_reclamation_automatiquement(
    db: Session,
    reclamation: Reclamation
) -> dict:
    """
    Affecte une reclamation a un agent disponible du service destinataire.
    La fonction n'effectue pas de commit pour laisser la route gerer la transaction.
    """
    nom_service = reclamation.service_destinataire
    agent = trouver_agent_disponible(db, nom_service)

    if not agent:
        return {
            "affecte": False,
            "id_agent": None,
            "nom_agent": None,
            "service": nom_service,
            "message": "Aucun agent disponible pour ce service"
        }

    affectation = AffectationReclamation(
        id_reclamation=reclamation.id_reclamation,
        id_agent=agent.id_agent,
        statut_affectation="affectee",
        commentaire="Affectation automatique apres analyse IA"
    )
    db.add(affectation)

    return {
        "affecte": True,
        "id_agent": agent.id_agent,
        "nom_agent": f"{agent.prenom} {agent.nom}",
        "service": nom_service,
        "message": "Reclamation affectee automatiquement"
    }
