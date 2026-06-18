"""
Application FastAPI principale.
Analyse intelligente des réclamations logistiques.
"""

import sys
import os
# Ajouter le dossier parent au PYTHONPATH pour importer src/
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import RequeteAnalyse, ReponseAnalyse, ReponseSante
from api.preprocessing import preprocesser_complet, extraire_mots_cles
from api.config import (
    MODEL_PATH, CATEGORIES_PATH,
    API_TITLE, API_VERSION, API_DESCRIPTION,
    ROUTAGE_EQUIPES
)

# Importer les modules métier
from src.priority import calculer_priorite
from src.complexity import detecter_cas_complexe


# ============================================
# CRÉATION DE L'APPLICATION
# ============================================

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION
)

# CORS : permettre au backend du binôme d'appeler cette API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, mettre l'URL exacte du backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# CHARGEMENT DU MODÈLE AU DÉMARRAGE
# ============================================

print("Chargement du modèle de classification...")
try:
    modele = joblib.load(MODEL_PATH)
    categories = joblib.load(CATEGORIES_PATH)
    modele_charge = True
    print(f"✅ Modèle chargé. Catégories : {categories}")
except Exception as e:
    print(f"❌ Erreur de chargement : {e}")
    modele = None
    categories = []
    modele_charge = False


# ============================================
# ENDPOINTS
# ============================================

@app.get("/", response_model=ReponseSante, tags=["Système"])
def health_check():
    """
    Vérification de santé de l'API.
    Permet au binôme de tester que l'API tourne bien.
    """
    return ReponseSante(
        status="ok",
        service="API IA Reclamations",
        version=API_VERSION,
        modele_charge=modele_charge
    )


@app.post("/ai/analyze", response_model=ReponseAnalyse, tags=["Analyse"])
def analyser_reclamation(requete: RequeteAnalyse):
    """
    🎯 ENDPOINT PRINCIPAL : Analyse intelligente d'une réclamation.
    
    Reçoit le texte de la réclamation (et optionnellement les infos commande)
    et renvoie une analyse complète :
    - Catégorie détectée
    - Niveau de priorité
    - Détection de cas complexe
    - Équipe à laquelle transférer
    """
    if not modele_charge:
        raise HTTPException(
            status_code=503, 
            detail="Modèle non chargé. Vérifiez les fichiers dans models/"
        )
    
    try:
        # === ÉTAPE 1 : Preprocessing du texte ===
        texte_original = requete.texte_reclamation
        texte_clean = preprocesser_complet(texte_original)
        
        # === ÉTAPE 1.5 : Détection texte vide ===
        # Si le texte est complètement vide après nettoyage, on ne peut rien faire
        if not texte_clean:
            texte_clean = texte_original[:200]  # Utiliser le texte brut comme fallback

        texte_trop_court = len(texte_clean.split()) < 3

        # === ÉTAPE 2 : Classification (toujours via le modèle) ===
        prediction = modele.predict([texte_clean])[0]
        probas = modele.predict_proba([texte_clean])[0]
        confiance = float(max(probas))
        
        # Dict catégorie → probabilité
        probas_dict = {cat: float(prob) for cat, prob in zip(modele.classes_, probas)}
        
        # === ÉTAPE 3 : Calcul de la priorité ===
        info_commande_dict = None
        if requete.commande:
            info_commande_dict = requete.commande.dict()
        
        priorite, score_priorite, raisons_priorite = calculer_priorite(
            texte_original,
            prediction,
            info_commande_dict
        )
        
        # === ÉTAPE 4 : Détection cas complexe ===
        resultat_complexite = detecter_cas_complexe(texte_original, probas_dict)
        if texte_trop_court:
            resultat_complexite['cas_complexe'] = True
            resultat_complexite['raisons'].insert(0, "Texte trop court — résultat incertain")
        
        # === ÉTAPE 5 : Extraction mots-clés ===
        mots_cles = extraire_mots_cles(texte_original, n=5)
        
        # === ÉTAPE 6 : Routage équipe ===
        if resultat_complexite['cas_complexe']:
            # Si cas complexe → service client (agent humain)
            equipe_suggeree = "service_client"
        else:
            equipe_suggeree = ROUTAGE_EQUIPES.get(prediction, "service_client")
        
        # === RÉPONSE FINALE ===
        return ReponseAnalyse(
            categorie=prediction,
            priorite=priorite,
            confiance=confiance,
            mots_cles=mots_cles,
            cas_complexe=resultat_complexite['cas_complexe'],
            raisons_complexite=resultat_complexite['raisons'],
            equipe_suggeree=equipe_suggeree,
            score_priorite=score_priorite,
            raisons_priorite=raisons_priorite,
            probabilites=probas_dict
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'analyse : {str(e)}"
        )


@app.get("/ai/categories", tags=["Système"])
def lister_categories():
    """Liste toutes les catégories supportées par le modèle."""
    return {
        "categories": list(categories),
        "total": len(categories)
    }


@app.get("/ai/equipes", tags=["Système"])
def lister_equipes():
    """Liste le routage catégorie → équipe."""
    return {
        "routage": ROUTAGE_EQUIPES,
        "equipes_uniques": list(set(ROUTAGE_EQUIPES.values()))
    }