"""
Module de prétraitement du texte (identique à celui utilisé pendant l'entraînement).
"""

import re
import unicodedata
import spacy

# Charger le modèle spaCy au démarrage (une seule fois)
print("Chargement du modèle spaCy français...")
nlp = spacy.load("fr_core_news_md")
print("✅ spaCy chargé")


def normaliser_texte(texte: str) -> str:
    """Met en minuscules et enlève les accents."""
    texte = str(texte).lower().strip()
    texte = unicodedata.normalize('NFKD', texte)
    texte = ''.join([c for c in texte if not unicodedata.combining(c)])
    return texte


def nettoyer_texte(texte: str) -> str:
    """Enlève la ponctuation et les chiffres."""
    texte = re.sub(r'[^\w\s]', ' ', texte)
    texte = re.sub(r'\d+', ' ', texte)
    texte = re.sub(r'\s+', ' ', texte).strip()
    return texte


def lemmatiser_texte(texte: str) -> str:
    """Lemmatise et enlève les stopwords."""
    doc = nlp(texte)
    tokens = []
    for token in doc:
        if (not token.is_stop and not token.is_punct 
            and len(token.text) > 2 and token.is_alpha):
            tokens.append(token.lemma_)
    return ' '.join(tokens)


def preprocesser_complet(texte: str) -> str:
    """Pipeline complet de preprocessing."""
    texte = normaliser_texte(texte)
    texte = nettoyer_texte(texte)
    texte = lemmatiser_texte(texte)
    return texte


def extraire_mots_cles(texte: str, n: int = 5) -> list:
    """Extrait les n mots-clés les plus importants du texte original."""
    doc = nlp(texte)
    mots = []
    for token in doc:
        if (token.pos_ in ['NOUN', 'VERB', 'ADJ']
            and not token.is_stop 
            and len(token.text) > 2 
            and token.is_alpha):
            mots.append(token.lemma_.lower())
    
    # Compter et garder les plus fréquents
    from collections import Counter
    plus_frequents = Counter(mots).most_common(n)
    return [mot for mot, _ in plus_frequents]