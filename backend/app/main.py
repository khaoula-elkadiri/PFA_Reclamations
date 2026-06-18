"""
Application Backend principal - PFA Réclamations Logistiques.
"""
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from backend.app.database import get_db, engine, Base
from backend.app.models import (
    Client, Commande, Reclamation, Notification,
    HistoriqueStatut, Service, Agent
)
from backend.app.schemas import (
    ReclamationCreate, ReclamationResponse, ReclamationDetail,
    ClientResponse, NotificationResponse, DashboardStats
)
from backend.app.ai_client import (
    analyser_reclamation_ia, EQUIPE_TO_SERVICE, CATEGORIE_IA_TO_BDD
)
from backend.app.matching import matcher_commande, get_info_commande_pour_ia
from backend.app.auth import get_current_agent, get_current_client
from backend.app.routers.auth_router import router as auth_router
from backend.app.routers.reponses_router import router as reponses_router


# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Backend PFA - Réclamations Logistiques",
    version="1.0.0"
)

# CORS pour permettre au frontend React de communiquer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production : URL exacte du frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(reponses_router)


# ============================================
# ENDPOINTS SYSTÈME
# ============================================

@app.get("/")
def home():
    return {
        "message": "Backend PFA Réclamations - OK",
        "version": "1.0.0",
        "endpoints": [
            "POST /reclamation",
            "GET /reclamation/{id}",
            "GET /reclamations",
            "GET /notifications/client/{id_client}",
            "GET /dashboard/stats",
            "GET /clients"
        ]
    }

# ============================================
# RECHERCHE DE COMMANDE (NOUVEAU !)
# ============================================

@app.get("/commande/rechercher/{numero_commande}")
def rechercher_commande(numero_commande: str, db: Session = Depends(get_db)):
    """
    Recherche une commande par son numéro et renvoie tous les détails.
    Utilisé par le frontend pour afficher la commande avant de réclamer.
    """
    commande = db.query(Commande).filter(
        Commande.numero_commande == numero_commande
    ).first()
    
    if not commande:
        raise HTTPException(
            status_code=404, 
            detail=f"Commande {numero_commande} introuvable"
        )
    
    client = db.query(Client).filter(Client.id_client == commande.id_client).first()
    
    # Récupérer les articles de la commande
    articles = []
    for ligne in commande.lignes:
        if ligne.article:
            articles.append({
                "id_article": ligne.article.id_article,
                "nom_article": ligne.article.nom_article,
                "categorie": ligne.article.categorie_article,
                "quantite": ligne.quantite,
                "est_perissable": ligne.article.est_perissable,
                "est_fragile": ligne.article.est_fragile
            })
    
    # Récupérer la livraison
    livraison = None
    if commande.livraisons:
        liv = commande.livraisons[0]
        livraison = {
            "numero_suivi": liv.numero_suivi,
            "statut_livraison": liv.statut_livraison,
            "transporteur": liv.transporteur,
            "adresse_livraison": liv.adresse_livraison,
            "date_expedition": str(liv.date_expedition) if liv.date_expedition else None,
            "date_livraison_prevue": str(liv.date_livraison_prevue) if liv.date_livraison_prevue else None,
            "date_livraison_reelle": str(liv.date_livraison_reelle) if liv.date_livraison_reelle else None,
        }
    
    return {
        "id_commande": commande.id_commande,
        "numero_commande": commande.numero_commande,
        "date_commande": str(commande.date_commande),
        "statut_commande": commande.statut_commande,
        "montant_total": float(commande.montant_total),
        "priorite_commande": commande.priorite_commande,
        "client": {
            "nom": client.nom,
            "prenom": client.prenom,
            "telephone": client.telephone,
            "email": client.email
        } if client else None,
        "articles": articles,
        "livraison": livraison
    }


@app.get("/commandes/client")
def rechercher_commandes_par_client(
    telephone: str = None,
    email: str = None,
    db: Session = Depends(get_db)
):
    """
    Recherche toutes les commandes d'un client par téléphone ou email.
    """
    if not telephone and not email:
        raise HTTPException(status_code=400, detail="Téléphone ou email requis")
    
    query = db.query(Client)
    if telephone:
        query = query.filter(Client.telephone == telephone)
    if email:
        query = query.filter(Client.email == email)
    
    client = query.first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    
    commandes = db.query(Commande).filter(
        Commande.id_client == client.id_client
    ).order_by(Commande.date_commande.desc()).all()
    
    return {
        "client": {
            "nom": client.nom,
            "prenom": client.prenom,
            "telephone": client.telephone,
            "email": client.email
        },
        "commandes": [
            {
                "id_commande": c.id_commande,
                "numero_commande": c.numero_commande,
                "date_commande": str(c.date_commande),
                "statut_commande": c.statut_commande,
                "montant_total": float(c.montant_total)
            } for c in commandes
        ]
    }
# ============================================
# CLIENTS
# ============================================

@app.get("/clients", response_model=List[ClientResponse])
def get_clients(db: Session = Depends(get_db)):
    return db.query(Client).all()


# ============================================
# RÉCLAMATIONS (CŒUR DU SYSTÈME)
# ============================================

@app.post("/reclamation", response_model=ReclamationResponse)
async def creer_reclamation(
    reclamation: ReclamationCreate,
    db: Session = Depends(get_db)
):
    """
    🎯 ENDPOINT PRINCIPAL : Création d'une réclamation.
    
    Workflow :
    1. Matching : vérifier que la commande existe
    2. Appeler l'API IA pour analyser
    3. Enregistrer la réclamation en BDD
    4. Créer une notification pour le client
    5. Enregistrer dans l'historique
    """
    
    # ===== ÉTAPE 1 : MATCHING =====
    matching = matcher_commande(
        db=db,
        nom=reclamation.nom,
        prenom=reclamation.prenom,
        telephone=reclamation.telephone,
        email=reclamation.email or "",
        numero_commande=reclamation.numero_commande
    )
    
    if not matching["trouve"]:
        raise HTTPException(
            status_code=404,
            detail=matching["message"]
        )
    
    id_commande = matching["id_commande"]
    id_client = matching["id_client"]
    
    # ===== ÉTAPE 2 : APPEL À L'API IA =====
    info_commande = get_info_commande_pour_ia(db, id_commande)
    resultat_ia = await analyser_reclamation_ia(
        texte=reclamation.description,
        info_commande=info_commande
    )
    
    # ===== ÉTAPE 3 : MAPPING DES VALEURS =====
    classification_bdd = CATEGORIE_IA_TO_BDD.get(
        resultat_ia["categorie"], "autre"
    )
    service_destinataire = EQUIPE_TO_SERVICE.get(
        resultat_ia["equipe_suggeree"], "Service Client"
    )
    
    # ===== ÉTAPE 4 : ENREGISTREMENT EN BDD =====
    nouvelle_reclamation = Reclamation(
        id_commande=id_commande,
        id_client=id_client,
        description=reclamation.description,
        statut_reclamation="en_analyse" if not resultat_ia["cas_complexe"] else "en_attente",
        classification_detectee=classification_bdd,
        priorite_detectee=resultat_ia["priorite"],
        score_priorite=resultat_ia["score_priorite"],
        score_confiance=resultat_ia["confiance"] * 100,
        est_complexe=resultat_ia["cas_complexe"],
        service_destinataire=service_destinataire
    )
    
    db.add(nouvelle_reclamation)
    db.commit()
    db.refresh(nouvelle_reclamation)
    
    # ===== ÉTAPE 5 : NOTIFICATION CLIENT =====
    message_notif = "Votre réclamation a bien été enregistrée et est en cours de traitement."
    if resultat_ia["cas_complexe"]:
        message_notif = "Votre réclamation a été transférée à un agent du service client pour analyse approfondie."
    else:
        message_notif = f"Votre réclamation a été classée comme '{classification_bdd}' avec une priorité '{resultat_ia['priorite']}' et transférée au service {service_destinataire}."
    
    notification = Notification(
        id_client=id_client,
        id_reclamation=nouvelle_reclamation.id_reclamation,
        message=message_notif,
        type_notification="information"
    )
    db.add(notification)
    
    # ===== ÉTAPE 6 : HISTORIQUE =====
    historique = HistoriqueStatut(
        id_reclamation=nouvelle_reclamation.id_reclamation,
        ancien_statut=None,
        nouveau_statut=nouvelle_reclamation.statut_reclamation,
        commentaire=f"Réclamation créée. IA: {resultat_ia['categorie']} ({resultat_ia['confiance']*100:.1f}%)"
    )
    db.add(historique)
    
    db.commit()
    
    # ===== RÉPONSE =====
    return ReclamationResponse(
        id_reclamation=nouvelle_reclamation.id_reclamation,
        statut_reclamation=nouvelle_reclamation.statut_reclamation,
        classification_detectee=nouvelle_reclamation.classification_detectee,
        priorite_detectee=nouvelle_reclamation.priorite_detectee,
        score_confiance=float(nouvelle_reclamation.score_confiance),
        est_complexe=nouvelle_reclamation.est_complexe,
        service_destinataire=nouvelle_reclamation.service_destinataire,
        message=message_notif
    )


@app.get("/reclamation/{id_reclamation}", response_model=ReclamationDetail)
def get_reclamation(id_reclamation: int, db: Session = Depends(get_db)):
    """Récupérer une réclamation par son ID."""
    rec = db.query(Reclamation).filter(
        Reclamation.id_reclamation == id_reclamation
    ).first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Réclamation introuvable")
    
    return rec


@app.get("/client/mes-reclamations")
def get_mes_reclamations(
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client),
):
    """Toutes les réclamations du client connecté avec leur réponse si disponible."""
    reclamations = db.query(Reclamation).filter(
        Reclamation.id_client == current_client.id_client
    ).order_by(Reclamation.date_creation.desc()).all()

    result = []
    for rec in reclamations:
        item = {
            "id_reclamation": rec.id_reclamation,
            "description": rec.description,
            "statut_reclamation": rec.statut_reclamation,
            "classification_detectee": rec.classification_detectee,
            "priorite_detectee": rec.priorite_detectee,
            "service_destinataire": rec.service_destinataire,
            "date_creation": rec.date_creation,
            "a_reponse": rec.reponse is not None,
        }
        result.append(item)
    return result


@app.get("/reclamations", response_model=List[ReclamationDetail])
def get_all_reclamations(
    statut: str = None,
    service: str = None,
    priorite: str = None,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Liste toutes les réclamations avec filtres optionnels."""
    query = db.query(Reclamation)
    
    if statut:
        query = query.filter(Reclamation.statut_reclamation == statut)
    if service:
        query = query.filter(Reclamation.service_destinataire == service)
    if priorite:
        query = query.filter(Reclamation.priorite_detectee == priorite)
    
    return query.order_by(Reclamation.date_creation.desc()).all()


@app.put("/reclamation/{id_reclamation}/statut")
def update_statut_reclamation(
    id_reclamation: int,
    nouveau_statut: str,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Mettre à jour le statut d'une réclamation."""
    rec = db.query(Reclamation).filter(
        Reclamation.id_reclamation == id_reclamation
    ).first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Réclamation introuvable")
    
    ancien_statut = rec.statut_reclamation
    rec.statut_reclamation = nouveau_statut
    
    # Historique
    historique = HistoriqueStatut(
        id_reclamation=id_reclamation,
        ancien_statut=ancien_statut,
        nouveau_statut=nouveau_statut,
        commentaire=f"Changement de statut: {ancien_statut} → {nouveau_statut}"
    )
    db.add(historique)
    
    # Notification client si résolu
    if nouveau_statut == "resolue":
        notif = Notification(
            id_client=rec.id_client,
            id_reclamation=id_reclamation,
            message="Votre réclamation a été traitée et résolue.",
            type_notification="resolution"
        )
        db.add(notif)
    
    db.commit()
    return {"message": "Statut mis à jour", "ancien": ancien_statut, "nouveau": nouveau_statut}


# ============================================
# NOTIFICATIONS
# ============================================

@app.get("/notifications/client/{id_client}", response_model=List[NotificationResponse])
def get_notifications_client(id_client: int, db: Session = Depends(get_db)):
    """Récupère toutes les notifications d'un client."""
    return db.query(Notification).filter(
        Notification.id_client == id_client
    ).order_by(Notification.date_envoi.desc()).all()


# ============================================
# DASHBOARDS
# ============================================

@app.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Statistiques globales pour le dashboard."""
    total = db.query(Reclamation).count()
    en_attente = db.query(Reclamation).filter(
        Reclamation.statut_reclamation == "en_attente"
    ).count()
    en_traitement = db.query(Reclamation).filter(
        Reclamation.statut_reclamation.in_(["en_analyse", "affectee", "en_traitement"])
    ).count()
    resolues = db.query(Reclamation).filter(
        Reclamation.statut_reclamation == "resolue"
    ).count()
    
    # Par catégorie
    par_cat = db.query(
        Reclamation.classification_detectee,
        func.count(Reclamation.id_reclamation)
    ).group_by(Reclamation.classification_detectee).all()
    
    par_prio = db.query(
        Reclamation.priorite_detectee,
        func.count(Reclamation.id_reclamation)
    ).group_by(Reclamation.priorite_detectee).all()
    
    return DashboardStats(
        total_reclamations=total,
        en_attente=en_attente,
        en_traitement=en_traitement,
        resolues=resolues,
        par_categorie={cat: count for cat, count in par_cat},
        par_priorite={prio: count for prio, count in par_prio}
    )


@app.get("/dashboard/service/{nom_service}")
def get_reclamations_service(
    nom_service: str,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Réclamations affectées à un service spécifique."""
    return db.query(Reclamation).filter(
        Reclamation.service_destinataire == nom_service
    ).order_by(Reclamation.priorite_detectee.desc()).all()