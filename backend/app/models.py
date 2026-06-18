from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, DECIMAL, Date, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Client(Base):
    __tablename__ = "client"
    id_client = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    telephone = Column(String(30), nullable=False)
    email = Column(String(150))
    est_prioritaire = Column(Boolean, default=False)
    type_client = Column(String(50), default="normal")
    date_creation = Column(DateTime(timezone=True), server_default=func.now())


class Article(Base):
    __tablename__ = "article"
    id_article = Column(Integer, primary_key=True, index=True)
    nom_article = Column(String(150), nullable=False)
    categorie_article = Column(String(100))
    est_perissable = Column(Boolean, default=False)
    est_brisable = Column(Boolean, default=False)
    est_fragile = Column(Boolean, default=False)


class Commande(Base):
    __tablename__ = "commande"
    id_commande = Column(Integer, primary_key=True, index=True)
    numero_commande = Column(String(50), nullable=False, unique=True)
    id_client = Column(Integer, ForeignKey("client.id_client"), nullable=False)
    date_commande = Column(Date, nullable=False)
    statut_commande = Column(String(50), default="en_preparation")
    montant_total = Column(DECIMAL(10, 2), default=0)
    priorite_commande = Column(String(50), default="faible")

    client = relationship("Client")
    lignes = relationship("LigneCommande", back_populates="commande")
    livraisons = relationship("Livraison", back_populates="commande")


class LigneCommande(Base):
    __tablename__ = "ligne_commande"
    id_ligne = Column(Integer, primary_key=True, index=True)
    id_commande = Column(Integer, ForeignKey("commande.id_commande"), nullable=False)
    id_article = Column(Integer, ForeignKey("article.id_article"), nullable=False)
    quantite = Column(Integer, default=1)

    commande = relationship("Commande", back_populates="lignes")
    article = relationship("Article")


class Livraison(Base):
    __tablename__ = "livraison"
    id_livraison = Column(Integer, primary_key=True, index=True)
    id_commande = Column(Integer, ForeignKey("commande.id_commande"), nullable=False)
    numero_suivi = Column(String(100), unique=True, nullable=False)
    statut_livraison = Column(String(50), default="en_preparation")
    transporteur = Column(String(100))
    adresse_livraison = Column(Text)
    date_expedition = Column(Date)
    date_livraison_prevue = Column(Date)
    date_livraison_reelle = Column(Date)

    commande = relationship("Commande", back_populates="livraisons")


class Reclamation(Base):
    __tablename__ = "reclamation"
    id_reclamation = Column(Integer, primary_key=True, index=True)
    id_commande = Column(Integer, ForeignKey("commande.id_commande"), nullable=False)
    id_client = Column(Integer, ForeignKey("client.id_client"), nullable=False)
    description = Column(Text, nullable=False)
    statut_reclamation = Column(String(50), default="en_attente")
    classification_detectee = Column(String(50), default="autre")
    priorite_detectee = Column(String(50), default="faible")
    score_priorite = Column(Integer, default=0)
    score_confiance = Column(DECIMAL(5, 2), default=0)
    est_complexe = Column(Boolean, default=False)
    service_destinataire = Column(String(100))
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    date_traitement = Column(DateTime, nullable=True)

    commande = relationship("Commande")
    client = relationship("Client")
    affectations = relationship("AffectationReclamation", back_populates="reclamation")


class Service(Base):
    __tablename__ = "service"
    id_service = Column(Integer, primary_key=True, index=True)
    nom_service = Column(String(100), nullable=False)
    description = Column(Text)

    agents = relationship("Agent", back_populates="service")


class Agent(Base):
    __tablename__ = "agent"
    id_agent = Column(Integer, primary_key=True, index=True)
    id_service = Column(Integer, ForeignKey("service.id_service"), nullable=False)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    email = Column(String(150), unique=True)
    role = Column(String(50), default="agent_service_client")
    disponible = Column(Boolean, default=True)

    service = relationship("Service", back_populates="agents")
    affectations = relationship("AffectationReclamation", back_populates="agent")


class Notification(Base):
    __tablename__ = "notification"
    id_notification = Column(Integer, primary_key=True, index=True)
    id_client = Column(Integer, ForeignKey("client.id_client"), nullable=False)
    id_reclamation = Column(Integer, ForeignKey("reclamation.id_reclamation"), nullable=False)
    message = Column(Text, nullable=False)
    type_notification = Column(String(50), default="information")
    date_envoi = Column(DateTime(timezone=True), server_default=func.now())


class HistoriqueStatut(Base):
    __tablename__ = "historique_statut"
    id_historique = Column(Integer, primary_key=True, index=True)
    id_reclamation = Column(Integer, ForeignKey("reclamation.id_reclamation"), nullable=False)
    ancien_statut = Column(String(100))
    nouveau_statut = Column(String(100))
    commentaire = Column(Text)
    date_changement = Column(DateTime(timezone=True), server_default=func.now())


class AffectationReclamation(Base):
    __tablename__ = "affectation_reclamation"
    id_affectation = Column(Integer, primary_key=True, index=True)
    id_reclamation = Column(Integer, ForeignKey("reclamation.id_reclamation"), nullable=False)
    id_agent = Column(Integer, ForeignKey("agent.id_agent"), nullable=False)
    date_affectation = Column(DateTime(timezone=True), server_default=func.now())
    statut_affectation = Column(String(50), default="affectee")
    commentaire = Column(Text)

    reclamation = relationship("Reclamation", back_populates="affectations")
    agent = relationship("Agent", back_populates="affectations")
