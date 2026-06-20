"""
Endpoints administrateur - toutes les fonctionnalités de gestion du système.
Accès réservé aux agents avec role='administrateur'.
"""
from datetime import datetime, timedelta, date as date_type
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, cast, Float, Integer as SAInteger
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Agent, Service, Reclamation, AffectationReclamation, Client, Commande, LigneCommande, Livraison, Article
from backend.app.auth import get_current_admin, hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Schémas Pydantic ─────────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    nom: str
    prenom: str
    email: str
    mot_de_passe: str
    id_service: int
    role: str = "agent_service_client"


class AgentUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    id_service: Optional[int] = None
    role: Optional[str] = None
    disponible: Optional[bool] = None
    nouveau_mot_de_passe: Optional[str] = None


class ReassignRequest(BaseModel):
    nouveau_service: str
    commentaire: Optional[str] = None


class ClientCreate(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: Optional[str] = None
    mot_de_passe: Optional[str] = None
    type_client: str = "normal"
    est_prioritaire: bool = False


class ClientUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    type_client: Optional[str] = None
    est_prioritaire: Optional[bool] = None


class CommandeStatusUpdate(BaseModel):
    nouveau_statut: str


class LigneCreate(BaseModel):
    id_article: int
    quantite: int = 1


class CommandeCreate(BaseModel):
    id_client: int
    numero_commande: str
    date_commande: str          # format YYYY-MM-DD
    statut_commande: str = "en_preparation"
    montant_total: float
    priorite_commande: str = "faible"
    lignes: List[LigneCreate] = []
    transporteur: Optional[str] = None
    adresse_livraison: Optional[str] = None
    date_livraison_prevue: Optional[str] = None


# ── 1. GESTION DES AGENTS ────────────────────────────────────────────────────

@router.get("/agents")
def list_agents(db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    agents = db.query(Agent).all()
    return [
        {
            "id": a.id_agent,
            "nom": a.nom,
            "prenom": a.prenom,
            "email": a.email,
            "role": a.role,
            "disponible": a.disponible,
            "date_creation": a.date_creation,
            "service": {
                "id": a.service.id_service,
                "nom": a.service.nom_service,
            } if a.service else None,
            "nb_reclamations": db.query(AffectationReclamation).filter(
                AffectationReclamation.id_agent == a.id_agent
            ).count(),
        }
        for a in agents
    ]


@router.post("/agents", status_code=201)
def create_agent(data: AgentCreate, db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    if db.query(Agent).filter(Agent.email == data.email).first():
        raise HTTPException(status_code=400, detail="Un agent avec cet email existe déjà")

    service = db.query(Service).filter(Service.id_service == data.id_service).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service introuvable")

    agent = Agent(
        nom=data.nom,
        prenom=data.prenom,
        email=data.email,
        id_service=data.id_service,
        role=data.role,
        mot_de_passe_hash=hash_password(data.mot_de_passe),
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return {"message": "Agent créé avec succès", "id": agent.id_agent}


@router.put("/agents/{id_agent}")
def update_agent(id_agent: int, data: AgentUpdate, db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    agent = db.query(Agent).filter(Agent.id_agent == id_agent).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent introuvable")

    if data.nom is not None:
        agent.nom = data.nom
    if data.prenom is not None:
        agent.prenom = data.prenom
    if data.email is not None:
        existing = db.query(Agent).filter(Agent.email == data.email, Agent.id_agent != id_agent).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        agent.email = data.email
    if data.id_service is not None:
        if not db.query(Service).filter(Service.id_service == data.id_service).first():
            raise HTTPException(status_code=404, detail="Service introuvable")
        agent.id_service = data.id_service
    if data.role is not None:
        agent.role = data.role
    if data.disponible is not None:
        agent.disponible = data.disponible
    if data.nouveau_mot_de_passe:
        agent.mot_de_passe_hash = hash_password(data.nouveau_mot_de_passe)

    db.commit()
    return {"message": "Agent mis à jour"}


@router.delete("/agents/{id_agent}")
def deactivate_agent(id_agent: int, db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    if id_agent == admin.id_agent:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas désactiver votre propre compte")
    agent = db.query(Agent).filter(Agent.id_agent == id_agent).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent introuvable")
    agent.disponible = False
    db.commit()
    return {"message": f"Agent {agent.prenom} {agent.nom} désactivé"}


@router.get("/services")
def list_services(db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    services = db.query(Service).all()
    return [{"id": s.id_service, "nom": s.nom_service, "description": s.description} for s in services]


# ── 2. SUPER DASHBOARD ───────────────────────────────────────────────────────

@router.get("/dashboard")
def super_dashboard(db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    total = db.query(Reclamation).count()
    en_attente = db.query(Reclamation).filter(Reclamation.statut_reclamation == "en_attente").count()
    en_traitement = db.query(Reclamation).filter(Reclamation.statut_reclamation == "en_traitement").count()
    resolues = db.query(Reclamation).filter(Reclamation.statut_reclamation == "resolue").count()
    complexes = db.query(Reclamation).filter(Reclamation.est_complexe == True).count()

    par_service = (
        db.query(Reclamation.service_destinataire, func.count(Reclamation.id_reclamation))
        .group_by(Reclamation.service_destinataire)
        .all()
    )

    par_priorite = (
        db.query(Reclamation.priorite_detectee, func.count(Reclamation.id_reclamation))
        .group_by(Reclamation.priorite_detectee)
        .all()
    )

    par_statut = (
        db.query(Reclamation.statut_reclamation, func.count(Reclamation.id_reclamation))
        .group_by(Reclamation.statut_reclamation)
        .all()
    )

    # Dernières 20 réclamations toutes catégories confondues
    recentes = (
        db.query(Reclamation)
        .order_by(Reclamation.date_creation.desc())
        .limit(20)
        .all()
    )

    def format_rec(r):
        return {
            "id_reclamation": r.id_reclamation,
            "description": r.description[:100] + "..." if len(r.description) > 100 else r.description,
            "statut_reclamation": r.statut_reclamation,
            "classification_detectee": r.classification_detectee,
            "priorite_detectee": r.priorite_detectee,
            "score_confiance": float(r.score_confiance),
            "est_complexe": r.est_complexe,
            "service_destinataire": r.service_destinataire,
            "date_creation": r.date_creation,
            "client": {
                "nom": r.client.nom,
                "prenom": r.client.prenom,
                "email": r.client.email,
            } if r.client else None,
        }

    # KPI : délai moyen de traitement (en heures) pour les résolues
    resolues_avec_date = db.query(Reclamation).filter(
        Reclamation.statut_reclamation == "resolue",
        Reclamation.date_traitement.isnot(None)
    ).all()
    if resolues_avec_date:
        delais = [(r.date_traitement - r.date_creation).total_seconds() / 3600 for r in resolues_avec_date]
        delai_moyen_h = round(sum(delais) / len(delais), 1)
    else:
        delai_moyen_h = None

    return {
        "kpis": {
            "total": total,
            "en_attente": en_attente,
            "en_traitement": en_traitement,
            "resolues": resolues,
            "complexes": complexes,
            "taux_resolution": round(resolues / total * 100, 1) if total > 0 else 0,
            "delai_moyen_heures": delai_moyen_h,
        },
        "par_service": [{"service": s, "count": c} for s, c in par_service],
        "par_priorite": [{"priorite": p, "count": c} for p, c in par_priorite],
        "par_statut": [{"statut": s, "count": c} for s, c in par_statut],
        "recentes": [format_rec(r) for r in recentes],
    }


# ── 3. RÉAFFECTATION DES RÉCLAMATIONS ────────────────────────────────────────

@router.put("/reclamations/{id_reclamation}/reassigner")
def reassigner_reclamation(
    id_reclamation: int,
    data: ReassignRequest,
    db: Session = Depends(get_db),
    admin: Agent = Depends(get_current_admin),
):
    reclamation = db.query(Reclamation).filter(Reclamation.id_reclamation == id_reclamation).first()
    if not reclamation:
        raise HTTPException(status_code=404, detail="Réclamation introuvable")

    ancien_service = reclamation.service_destinataire
    reclamation.service_destinataire = data.nouveau_service
    reclamation.statut_reclamation = "en_traitement"

    # Chercher un agent disponible dans le nouveau service
    service = db.query(Service).filter(Service.nom_service == data.nouveau_service).first()
    agent_cible = None
    if service:
        agent_cible = (
            db.query(Agent)
            .filter(Agent.id_service == service.id_service, Agent.disponible == True)
            .first()
        )
        if agent_cible:
            affectation = AffectationReclamation(
                id_reclamation=id_reclamation,
                id_agent=agent_cible.id_agent,
                commentaire=data.commentaire or f"Réaffecté par admin depuis {ancien_service}",
                statut_affectation="affectee",
            )
            db.add(affectation)

    db.commit()
    return {
        "message": f"Réclamation #{id_reclamation} réaffectée vers '{data.nouveau_service}'",
        "agent_assigne": f"{agent_cible.prenom} {agent_cible.nom}" if agent_cible else "Aucun agent disponible",
    }


@router.get("/reclamations")
def get_all_reclamations_admin(
    statut: Optional[str] = None,
    service: Optional[str] = None,
    complexe: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: Agent = Depends(get_current_admin),
):
    q = db.query(Reclamation)
    if statut:
        q = q.filter(Reclamation.statut_reclamation == statut)
    if service:
        q = q.filter(Reclamation.service_destinataire == service)
    if complexe is not None:
        q = q.filter(Reclamation.est_complexe == complexe)
    reclamations = q.order_by(Reclamation.date_creation.desc()).all()

    return [
        {
            "id_reclamation": r.id_reclamation,
            "description": r.description[:120] + "..." if len(r.description) > 120 else r.description,
            "statut_reclamation": r.statut_reclamation,
            "classification_detectee": r.classification_detectee,
            "priorite_detectee": r.priorite_detectee,
            "score_confiance": float(r.score_confiance),
            "est_complexe": r.est_complexe,
            "service_destinataire": r.service_destinataire,
            "date_creation": r.date_creation,
            "client": {
                "nom": r.client.nom,
                "prenom": r.client.prenom,
                "email": r.client.email,
            } if r.client else None,
        }
        for r in reclamations
    ]


# ── 4. MONITORING IA ─────────────────────────────────────────────────────────

@router.get("/ia/monitoring")
def monitoring_ia(db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    total = db.query(Reclamation).count()
    complexes = db.query(Reclamation).filter(Reclamation.est_complexe == True).count()

    # Confiance moyenne globale
    confiance_globale = db.query(func.avg(cast(Reclamation.score_confiance, Float))).scalar() or 0

    # Statistiques par catégorie
    par_categorie = (
        db.query(
            Reclamation.classification_detectee,
            func.count(Reclamation.id_reclamation).label("total"),
            func.avg(cast(Reclamation.score_confiance, Float)).label("confiance_moy"),
            func.sum(cast(Reclamation.est_complexe, SAInteger)).label("nb_complexes"),
        )
        .group_by(Reclamation.classification_detectee)
        .all()
    )

    # Évolution sur les 7 derniers jours
    tendance_7j = []
    for i in range(6, -1, -1):
        jour = datetime.now() - timedelta(days=i)
        debut = jour.replace(hour=0, minute=0, second=0, microsecond=0)
        fin = jour.replace(hour=23, minute=59, second=59, microsecond=999999)
        nb = db.query(Reclamation).filter(
            Reclamation.date_creation >= debut,
            Reclamation.date_creation <= fin,
        ).count()
        conf = db.query(func.avg(cast(Reclamation.score_confiance, Float))).filter(
            Reclamation.date_creation >= debut,
            Reclamation.date_creation <= fin,
        ).scalar()
        tendance_7j.append({
            "date": jour.strftime("%d/%m"),
            "nb_reclamations": nb,
            "confiance_moy": round(float(conf), 1) if conf else 0,
        })

    # Distribution des niveaux de confiance
    haute = db.query(Reclamation).filter(Reclamation.score_confiance >= 70).count()
    moyenne_conf = db.query(Reclamation).filter(
        Reclamation.score_confiance >= 40, Reclamation.score_confiance < 70
    ).count()
    basse = db.query(Reclamation).filter(Reclamation.score_confiance < 40).count()

    return {
        "global": {
            "total": total,
            "complexes": complexes,
            "pct_complexes": round(complexes / total * 100, 1) if total > 0 else 0,
            "confiance_moy": round(float(confiance_globale), 1),
        },
        "par_categorie": [
            {
                "categorie": r.classification_detectee,
                "total": r.total,
                "confiance_moy": round(float(r.confiance_moy or 0), 1),
                "nb_complexes": int(r.nb_complexes or 0),
                "pct_complexes": round(int(r.nb_complexes or 0) / r.total * 100, 1) if r.total > 0 else 0,
            }
            for r in par_categorie
        ],
        "tendance_7j": tendance_7j,
        "distribution_confiance": {
            "haute_70plus": haute,
            "moyenne_40_70": moyenne_conf,
            "basse_sous_40": basse,
        },
    }


# ── 5. GESTION DES CLIENTS ───────────────────────────────────────────────────

def _format_commande(c: Commande) -> dict:
    livraison = c.livraisons[0] if c.livraisons else None
    return {
        "id_commande": c.id_commande,
        "numero_commande": c.numero_commande,
        "date_commande": str(c.date_commande),
        "statut_commande": c.statut_commande,
        "montant_total": float(c.montant_total),
        "priorite_commande": c.priorite_commande,
        "articles": [
            {
                "nom_article": l.article.nom_article,
                "quantite": l.quantite,
                "categorie": l.article.categorie_article,
            }
            for l in c.lignes if l.article
        ],
        "livraison": {
            "numero_suivi": livraison.numero_suivi,
            "statut_livraison": livraison.statut_livraison,
            "transporteur": livraison.transporteur,
            "adresse_livraison": livraison.adresse_livraison,
            "date_expedition": str(livraison.date_expedition) if livraison.date_expedition else None,
            "date_livraison_prevue": str(livraison.date_livraison_prevue) if livraison.date_livraison_prevue else None,
            "date_livraison_reelle": str(livraison.date_livraison_reelle) if livraison.date_livraison_reelle else None,
        } if livraison else None,
    }


@router.get("/clients")
def list_clients(db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    clients = db.query(Client).order_by(Client.date_creation.desc()).all()
    return [
        {
            "id_client": c.id_client,
            "nom": c.nom,
            "prenom": c.prenom,
            "email": c.email,
            "telephone": c.telephone,
            "type_client": c.type_client,
            "est_prioritaire": c.est_prioritaire,
            "est_inscrit": c.est_inscrit,
            "date_creation": c.date_creation,
            "nb_commandes": db.query(Commande).filter(Commande.id_client == c.id_client).count(),
            "nb_reclamations": db.query(Reclamation).filter(Reclamation.id_client == c.id_client).count(),
        }
        for c in clients
    ]


@router.get("/clients/{id_client}")
def get_client_detail(id_client: int, db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    c = db.query(Client).filter(Client.id_client == id_client).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client introuvable")

    commandes = db.query(Commande).filter(Commande.id_client == id_client).order_by(Commande.date_commande.desc()).all()
    reclamations = db.query(Reclamation).filter(Reclamation.id_client == id_client).order_by(Reclamation.date_creation.desc()).all()

    return {
        "id_client": c.id_client,
        "nom": c.nom,
        "prenom": c.prenom,
        "email": c.email,
        "telephone": c.telephone,
        "type_client": c.type_client,
        "est_prioritaire": c.est_prioritaire,
        "est_inscrit": c.est_inscrit,
        "date_creation": c.date_creation,
        "commandes": [_format_commande(cmd) for cmd in commandes],
        "reclamations": [
            {
                "id_reclamation": r.id_reclamation,
                "description": r.description[:100] + "..." if len(r.description) > 100 else r.description,
                "statut_reclamation": r.statut_reclamation,
                "classification_detectee": r.classification_detectee,
                "priorite_detectee": r.priorite_detectee,
                "score_confiance": float(r.score_confiance),
                "est_complexe": r.est_complexe,
                "service_destinataire": r.service_destinataire,
                "date_creation": r.date_creation,
            }
            for r in reclamations
        ],
    }


@router.put("/clients/{id_client}")
def update_client(id_client: int, data: ClientUpdate, db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    c = db.query(Client).filter(Client.id_client == id_client).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client introuvable")

    if data.nom is not None:
        c.nom = data.nom
    if data.prenom is not None:
        c.prenom = data.prenom
    if data.telephone is not None:
        c.telephone = data.telephone
    if data.email is not None:
        existing = db.query(Client).filter(Client.email == data.email, Client.id_client != id_client).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé par un autre client")
        c.email = data.email
    if data.type_client is not None:
        c.type_client = data.type_client
    if data.est_prioritaire is not None:
        c.est_prioritaire = data.est_prioritaire

    db.commit()
    return {"message": "Client mis à jour avec succès"}


@router.post("/clients", status_code=201)
def create_client(data: ClientCreate, db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    if data.email:
        existing = db.query(Client).filter(Client.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Un client avec cet email existe déjà")

    pwd_hash = hash_password(data.mot_de_passe) if data.mot_de_passe else None
    client = Client(
        nom=data.nom,
        prenom=data.prenom,
        telephone=data.telephone,
        email=data.email,
        type_client=data.type_client,
        est_prioritaire=data.est_prioritaire,
        mot_de_passe_hash=pwd_hash,
        est_inscrit=bool(data.mot_de_passe),
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return {"message": "Client créé avec succès", "id_client": client.id_client}


@router.delete("/clients/{id_client}")
def delete_client(id_client: int, db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    c = db.query(Client).filter(Client.id_client == id_client).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client introuvable")

    nb_commandes = db.query(Commande).filter(Commande.id_client == id_client).count()
    nb_reclamations = db.query(Reclamation).filter(Reclamation.id_client == id_client).count()

    if nb_commandes > 0 or nb_reclamations > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de supprimer : ce client possède {nb_commandes} commande(s) et {nb_reclamations} réclamation(s). Supprimez-les d'abord."
        )

    db.delete(c)
    db.commit()
    return {"message": f"Client {c.prenom} {c.nom} supprimé définitivement"}


@router.get("/articles")
def list_articles(db: Session = Depends(get_db), admin: Agent = Depends(get_current_admin)):
    articles = db.query(Article).order_by(Article.nom_article).all()
    return [
        {
            "id_article": a.id_article,
            "nom_article": a.nom_article,
            "categorie_article": a.categorie_article,
            "est_perissable": a.est_perissable,
            "est_fragile": a.est_fragile,
            "est_brisable": a.est_brisable,
        }
        for a in articles
    ]


@router.post("/commandes", status_code=201)
def create_commande(
    data: CommandeCreate,
    db: Session = Depends(get_db),
    admin: Agent = Depends(get_current_admin),
):
    if not db.query(Client).filter(Client.id_client == data.id_client).first():
        raise HTTPException(status_code=404, detail="Client introuvable")

    if db.query(Commande).filter(Commande.numero_commande == data.numero_commande).first():
        raise HTTPException(status_code=400, detail=f"Le numéro de commande '{data.numero_commande}' existe déjà")

    try:
        date_cmd = date_type.fromisoformat(data.date_commande)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format de date invalide (attendu : YYYY-MM-DD)")

    commande = Commande(
        numero_commande=data.numero_commande,
        id_client=data.id_client,
        date_commande=date_cmd,
        statut_commande=data.statut_commande,
        montant_total=data.montant_total,
        priorite_commande=data.priorite_commande,
    )
    db.add(commande)
    db.flush()

    for ligne in data.lignes:
        article = db.query(Article).filter(Article.id_article == ligne.id_article).first()
        if not article:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Article #{ligne.id_article} introuvable")
        db.add(LigneCommande(
            id_commande=commande.id_commande,
            id_article=ligne.id_article,
            quantite=ligne.quantite,
        ))

    import uuid
    numero_suivi = f"TRK-ADM-{commande.id_commande}-{uuid.uuid4().hex[:6].upper()}"
    date_prevue = None
    if data.date_livraison_prevue:
        try:
            date_prevue = date_type.fromisoformat(data.date_livraison_prevue)
        except ValueError:
            pass

    db.add(Livraison(
        id_commande=commande.id_commande,
        numero_suivi=numero_suivi,
        statut_livraison="en_preparation",
        transporteur=data.transporteur,
        adresse_livraison=data.adresse_livraison,
        date_livraison_prevue=date_prevue,
    ))

    db.commit()
    return {
        "message": f"Commande {data.numero_commande} créée avec succès",
        "id_commande": commande.id_commande,
        "numero_suivi": numero_suivi,
    }


@router.put("/commandes/{id_commande}/statut")
def update_commande_statut(
    id_commande: int,
    data: CommandeStatusUpdate,
    db: Session = Depends(get_db),
    admin: Agent = Depends(get_current_admin),
):
    commande = db.query(Commande).filter(Commande.id_commande == id_commande).first()
    if not commande:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    commande.statut_commande = data.nouveau_statut
    db.commit()
    return {"message": f"Statut commande #{commande.numero_commande} mis à jour : {data.nouveau_statut}"}
