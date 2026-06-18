
"""
Module de détection des cas complexes.
"""

# Avec le modèle calibré (LinearSVC + CalibratedClassifierCV), les probabilités
# sont bien distribuées. Un résultat < 40% mérite une revue humaine.
SEUIL_CONFIANCE = 0.40
SEUIL_LONGUEUR_MIN = 4
SEUIL_LONGUEUR_MAX = 500


def detecter_cas_complexe(texte, probas_dict):
    """Détecte si une réclamation nécessite un agent humain."""
    raisons = []
    cas_complexe = False

    probas_triees = sorted(probas_dict.values(), reverse=True)
    confiance_max = probas_triees[0] if probas_triees else 0

    if confiance_max < SEUIL_CONFIANCE:
        cas_complexe = True
        raisons.append(f"Confiance trop faible ({confiance_max*100:.1f}%)")

    nb_mots = len(str(texte).split())
    if nb_mots < SEUIL_LONGUEUR_MIN:
        cas_complexe = True
        raisons.append(f"Texte trop court ({nb_mots} mots)")

    if nb_mots > SEUIL_LONGUEUR_MAX:
        cas_complexe = True
        raisons.append(f"Texte tres long ({nb_mots} mots)")

    if len(probas_triees) >= 2:
        diff = probas_triees[0] - probas_triees[1]
        if diff < 0.05:
            cas_complexe = True
            raisons.append(f"Ambiguite entre categories")

    return {
        'cas_complexe': cas_complexe,
        'raisons': raisons,
        'confiance_max': confiance_max,
        'necessite_agent': cas_complexe
    }
