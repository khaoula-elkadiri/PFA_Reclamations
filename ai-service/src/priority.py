
"""
Module de priorisation pour les réclamations logistiques.
"""

MOTS_CRITIQUES = [
    'urgent', 'urgence', 'immediat', 'immediatement',
    'perissable', 'perissables', 'gate', 'gates', 'avarie',
    'medicament', 'medicaments', 'medical', 'medicale',
    'congele', 'congeles', 'frais', 'fraiche',
    'inadmissible', 'scandaleux', 'inacceptable',
    'avocat', 'avocats', 'plainte', 'tribunal', 'justice',
    'rembourser', 'remboursement', 'remboursez',
    'danger', 'dangereux', 'risque'
]

MOTS_ELEVE = [
    'tres', 'enorme', 'enormement', 'beaucoup',
    'jamais', 'totalement', 'completement', 'entierement',
    'furieux', 'furieuse', 'enerve', 'enervee', 'colere',
    'inadmissible', 'horrible', 'terrible', 'catastrophe',
    'mecontent', 'mecontente', 'decu', 'decue',
    'rapidement', 'vite', 'pressant'
]

MOTS_MOYEN = [
    'probleme', 'soucis', 'mauvais', 'mauvaise',
    'erreur', 'incorrect', 'incorrecte',
    'attendu', 'attendue', 'reception'
]

CATEGORIES_URGENTES = {
    'produit_casse': 3,
    'retard_livraison': 2,
    'article_manquant': 2,
    'erreur_picking': 2,
    'probleme_transport': 2,
    'mauvaise_qualite': 1,
    'erreur_administrative': 1
}

PRODUITS_URGENCE = {
    'perissable': 5,
    'medicament': 5,
    'frais': 4,
    'fragile': 3,
    'electronique': 2,
    'standard': 0
}


def calculer_priorite(texte, categorie, info_commande=None):
    """Calcule la priorité d'une réclamation."""
    score = 0
    raisons = []

    texte_lower = str(texte).lower()

    nb_critiques = sum(1 for mot in MOTS_CRITIQUES if mot in texte_lower)
    nb_eleves = sum(1 for mot in MOTS_ELEVE if mot in texte_lower)
    nb_moyens = sum(1 for mot in MOTS_MOYEN if mot in texte_lower)

    score += nb_critiques * 4
    score += nb_eleves * 2
    score += nb_moyens * 1

    if nb_critiques > 0:
        raisons.append(f"{nb_critiques} mot(s) critique(s)")
    if nb_eleves > 0:
        raisons.append(f"{nb_eleves} mot(s) à forte urgence")

    score_categorie = CATEGORIES_URGENTES.get(categorie, 0)
    score += score_categorie
    if score_categorie >= 2:
        raisons.append(f"Categorie urgente")

    if info_commande:
        type_produit = info_commande.get('type_produit', 'standard').lower()
        score_produit = PRODUITS_URGENCE.get(type_produit, 0)
        score += score_produit
        if score_produit >= 3:
            raisons.append(f"Produit {type_produit}")

        if info_commande.get('client_prioritaire', False):
            score += 3
            raisons.append("Client prioritaire")

        montant = info_commande.get('montant', 0)
        if montant > 5000:
            score += 3
            raisons.append(f"Montant eleve")
        elif montant > 1000:
            score += 1

    if score >= 10:
        priorite = 'critique'
    elif score >= 6:
        priorite = 'elevee'
    elif score >= 3:
        priorite = 'moyenne'
    else:
        priorite = 'faible'

    return priorite, score, raisons
