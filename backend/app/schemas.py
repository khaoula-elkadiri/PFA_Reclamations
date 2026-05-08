from pydantic import BaseModel


class ReclamationCreate(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: str
    numero_commande: str
    articles: list[str]
    quantites: list[int]
    description: str