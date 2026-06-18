from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime, date
from decimal import Decimal


# ===== REQUÊTES =====

class ReclamationCreate(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: Optional[str] = None
    numero_commande: str
    articles: List[str] = Field(default_factory=list)
    quantites: List[int] = Field(default_factory=list)
    description: str = Field(..., min_length=10)


# ===== RÉPONSES =====

class ReclamationResponse(BaseModel):
    id_reclamation: int
    statut_reclamation: str
    classification_detectee: str
    priorite_detectee: str
    score_confiance: float
    est_complexe: bool
    service_destinataire: str
    message: str

    class Config:
        from_attributes = True


class ClientResponse(BaseModel):
    id_client: int
    nom: str
    prenom: str
    telephone: str
    email: Optional[str]

    class Config:
        from_attributes = True


class ClientInfo(BaseModel):
    nom: str
    prenom: str
    email: Optional[str]
    telephone: str


class ReclamationDetail(BaseModel):
    id_reclamation: int
    id_commande: int
    description: str
    statut_reclamation: str
    classification_detectee: str
    priorite_detectee: str
    score_priorite: int
    score_confiance: float
    est_complexe: bool
    service_destinataire: Optional[str]
    date_creation: datetime

    class Config:
        from_attributes = True


class ReclamationAffecteeAgentResponse(BaseModel):
    id_affectation: int
    statut_affectation: str
    commentaire_affectation: Optional[str]
    id_reclamation: int
    description: str
    statut_reclamation: str
    classification_detectee: str
    priorite_detectee: str
    score_confiance: float
    est_complexe: bool
    service_destinataire: Optional[str]
    date_creation: datetime
    client: Optional[ClientInfo]


class NotificationResponse(BaseModel):
    id_notification: int
    message: str
    type_notification: str
    date_envoi: datetime

    class Config:
        from_attributes = True


class MatchingResult(BaseModel):
    trouve: bool
    id_commande: Optional[int] = None
    id_client: Optional[int] = None
    message: str


class DashboardStats(BaseModel):
    total_reclamations: int
    en_attente: int
    en_traitement: int
    resolues: int
    par_categorie: dict
    par_priorite: dict


# ===== AUTH =====

class AgentLoginRequest(BaseModel):
    email: str
    mot_de_passe: str


class ClientLoginRequest(BaseModel):
    email: str
    mot_de_passe: str


class ClientRegisterRequest(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: str
    mot_de_passe: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_info: dict


# ===== RÉPONSES AGENTS =====

class ReponseCreate(BaseModel):
    contenu: str = Field(..., min_length=10)


class ReponseOut(BaseModel):
    id_reponse: int
    id_reclamation: int
    contenu: str
    date_envoi: datetime
    nom_agent: Optional[str] = None
    prenom_agent: Optional[str] = None

    class Config:
        from_attributes = True
