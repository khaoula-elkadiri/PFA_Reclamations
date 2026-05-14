"""
Module de matching : vérifier que la commande existe vraiment.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from backend.app.models import Client, Commande


def matcher_commande(
    db: Session,
    nom: str,
    prenom: str,
    telephone: str,
    email: str,
    numero_commande: str
) -> dict:
    """
    Vérifie si une commande existe dans la base.
    Match sur : numéro commande + (téléphone OU email) + nom du client.
    """
    # Étape 1 : chercher la commande par numéro
    commande = db.query(Commande).filter(
        Commande.numero_commande == numero_commande
    ).first()
    
    if not commande:
        return {
            "trouve": False,
            "id_commande": None,
            "id_client": None,
            "message": f"Aucune commande trouvée avec le numéro {numero_commande}"
        }
    
    # Étape 2 : vérifier que le client correspond
    client = db.query(Client).filter(Client.id_client == commande.id_client).first()
    
    if not client:
        return {
            "trouve": False,
            "id_commande": None,
            "id_client": None,
            "message": "Client introuvable pour cette commande"
        }
    
    # Étape 3 : vérifier la correspondance des informations
    # Tolérance : insensible à la casse, espaces
    nom_match = client.nom.lower().strip() == nom.lower().strip()
    prenom_match = client.prenom.lower().strip() == prenom.lower().strip()
    telephone_match = client.telephone.replace(" ", "") == telephone.replace(" ", "")
    
    email_match = True  # par défaut OK si pas d'email fourni
    if email and client.email:
        email_match = client.email.lower().strip() == email.lower().strip()
    
    # Le matching réussit si : nom + prénom + (téléphone OU email)
    if nom_match and prenom_match and (telephone_match or email_match):
        return {
            "trouve": True,
            "id_commande": commande.id_commande,
            "id_client": client.id_client,
            "message": "Commande trouvée et vérifiée"
        }
    
    return {
        "trouve": False,
        "id_commande": None,
        "id_client": None,
        "message": "Les informations ne correspondent pas à la commande"
    }


def get_info_commande_pour_ia(db: Session, id_commande: int) -> dict:
    """
    Récupère les infos d'une commande pour les envoyer à l'IA.
    """
    commande = db.query(Commande).filter(Commande.id_commande == id_commande).first()
    if not commande:
        return {}
    
    client = db.query(Client).filter(Client.id_client == commande.id_client).first()
    
    # Déterminer le type de produit dominant
    type_produit = "standard"
    if commande.lignes:
        for ligne in commande.lignes:
            if ligne.article and ligne.article.est_perissable:
                type_produit = "perissable"
                break
            elif ligne.article and ligne.article.est_fragile:
                type_produit = "fragile"
    
    return {
        "id": commande.numero_commande,
        "type_produit": type_produit,
        "client_prioritaire": client.est_prioritaire if client else False,
        "montant": float(commande.montant_total) if commande.montant_total else 0.0
    }