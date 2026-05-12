"""
Schémas Pydantic pour valider les requêtes et réponses de l'API.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class InfoCommande(BaseModel):
    """Informations optionnelles sur la commande."""
    id: Optional[str] = Field(None, description="ID de la commande")
    type_produit: Optional[str] = Field(
        "standard", 
        description="Type: standard, perissable, fragile, medicament, etc."
    )
    client_prioritaire: Optional[bool] = Field(
        False, 
        description="True si client VIP/prioritaire"
    )
    montant: Optional[float] = Field(
        0.0, 
        description="Montant de la commande en euros"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "CMD-12345",
                "type_produit": "perissable",
                "client_prioritaire": True,
                "montant": 1500.0
            }
        }


class RequeteAnalyse(BaseModel):
    """Requête envoyée par le backend pour analyser une réclamation."""
    texte_reclamation: str = Field(
        ..., 
        min_length=1,
        description="Le texte de la réclamation en français"
    )
    commande: Optional[InfoCommande] = Field(
        None, 
        description="Informations optionnelles sur la commande"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "texte_reclamation": "Ma commande de medicaments est en retard de 5 jours, c'est urgent !",
                "commande": {
                    "id": "CMD-12345",
                    "type_produit": "medicament",
                    "client_prioritaire": True,
                    "montant": 200.0
                }
            }
        }


class ReponseAnalyse(BaseModel):
    """Réponse renvoyée par l'API après analyse."""
    categorie: str = Field(..., description="Catégorie détectée")
    priorite: str = Field(..., description="Niveau de priorité: faible/moyenne/elevee/critique")
    confiance: float = Field(..., description="Confiance du modèle (0 à 1)")
    mots_cles: List[str] = Field(default_factory=list, description="Mots-clés extraits")
    cas_complexe: bool = Field(..., description="True si nécessite un agent humain")
    raisons_complexite: List[str] = Field(
        default_factory=list, 
        description="Raisons pour lesquelles c'est un cas complexe"
    )
    equipe_suggeree: str = Field(..., description="Équipe à laquelle transférer")
    score_priorite: int = Field(..., description="Score brut de priorité")
    raisons_priorite: List[str] = Field(
        default_factory=list,
        description="Justifications du niveau de priorité"
    )
    probabilites: Dict[str, float] = Field(
        default_factory=dict,
        description="Probabilités pour chaque catégorie"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "categorie": "retard_livraison",
                "priorite": "critique",
                "confiance": 0.85,
                "mots_cles": ["retard", "medicament", "urgent"],
                "cas_complexe": False,
                "raisons_complexite": [],
                "equipe_suggeree": "equipe_transport",
                "score_priorite": 12,
                "raisons_priorite": ["1 mot(s) critique(s)", "Produit medicament"],
                "probabilites": {
                    "retard_livraison": 0.85,
                    "probleme_transport": 0.08,
                    "erreur_picking": 0.04
                }
            }
        }


class ReponseSante(BaseModel):
    """Réponse du endpoint de santé."""
    status: str
    service: str
    version: str
    modele_charge: bool