"""
Client pour communiquer avec ton API IA (ai-service).
"""
import httpx
from typing import Dict, Any, Optional

# URL de ton API IA
AI_SERVICE_URL = "http://localhost:8001"


async def analyser_reclamation_ia(
    texte: str, 
    info_commande: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Appelle ton API IA pour analyser la réclamation.
    """
    payload = {"texte_reclamation": texte}
    
    if info_commande:
        payload["commande"] = info_commande
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/ai/analyze",
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.ConnectError:
        # Si l'API IA n'est pas accessible, retour par défaut
        return {
            "categorie": "autre",
            "priorite": "moyenne",
            "confiance": 0.0,
            "mots_cles": [],
            "cas_complexe": True,
            "raisons_complexite": ["API IA non accessible"],
            "equipe_suggeree": "service_client",
            "score_priorite": 0,
            "raisons_priorite": [],
            "probabilites": {}
        }
    except Exception as e:
        print(f"Erreur IA : {e}")
        return {
            "categorie": "autre",
            "priorite": "moyenne",
            "confiance": 0.0,
            "mots_cles": [],
            "cas_complexe": True,
            "raisons_complexite": [f"Erreur: {str(e)}"],
            "equipe_suggeree": "service_client",
            "score_priorite": 0,
            "raisons_priorite": [],
            "probabilites": {}
        }


# Mapping équipe IA → nom service en BDD
EQUIPE_TO_SERVICE = {
    "equipe_transport": "Transport",
    "equipe_qualite": "Qualite",
    "equipe_preparation": "Preparation",
    "equipe_stock": "Stock",
    "equipe_admin": "Service Client",
    "service_client": "Service Client"
}


# Mapping catégorie IA → catégorie BDD (enum)
CATEGORIE_IA_TO_BDD = {
    "retard_livraison": "probleme_livraison",
    "probleme_transport": "probleme_transport",
    "produit_casse": "produit_brise",
    "mauvaise_qualite": "probleme_qualite",
    "erreur_picking": "erreur_picking",
    "article_manquant": "article_manquant",
    "erreur_administrative": "autre",
    "autre": "autre",
    "indetermine": "autre"
}