"""
Configuration de l'API.
"""

# Chemins vers les modèles (relatifs au dossier ai-service/)
MODEL_PATH = "models/classifier_pipeline.pkl"
CATEGORIES_PATH = "models/categories.pkl"

# Paramètres de l'API
API_TITLE = "API IA - Réclamations Logistiques"
API_VERSION = "1.0.0"
API_DESCRIPTION = """
API d'analyse intelligente des réclamations logistiques.

Cette API permet de :
- Classifier automatiquement une réclamation
- Évaluer son niveau de priorité
- Détecter les cas complexes nécessitant un agent humain
- Suggérer l'équipe à laquelle transférer la réclamation
"""

# Routage des équipes selon la catégorie
ROUTAGE_EQUIPES = {
    "retard_livraison": "equipe_transport",
    "probleme_transport": "equipe_transport",
    "produit_casse": "equipe_qualite",
    "mauvaise_qualite": "equipe_qualite",
    "erreur_picking": "equipe_preparation",
    "article_manquant": "equipe_stock",
    "erreur_administrative": "equipe_admin"
}