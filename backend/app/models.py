from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
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


class Livraison(Base):
    __tablename__ = "livraison"

    id_livraison = Column(Integer, primary_key=True, index=True)

    numero_suivi = Column(String(100), nullable=False)

    statut_livraison = Column(String(100))

    adresse_destination = Column(Text)


class Commande(Base):
    __tablename__ = "commande"

    id_commande = Column(Integer, primary_key=True, index=True)

    numero_commande = Column(String(100), nullable=False)

    id_client = Column(Integer, ForeignKey("client.id_client"))

    id_livraison = Column(Integer, ForeignKey("livraison.id_livraison"))

    statut_commande = Column(String(100))

    classification = Column(String(100))

    priorite = Column(String(100))

    client = relationship("Client")

    livraison = relationship("Livraison")


class Reclamation(Base):
    __tablename__ = "reclamation"

    id_reclamation = Column(Integer, primary_key=True, index=True)

    id_commande = Column(Integer, ForeignKey("commande.id_commande"))

    description = Column(Text)

    classification = Column(String(100))

    priorite = Column(String(100))

    statut = Column(String(100))

    score_confiance = Column(Integer)

    date_creation = Column(DateTime(timezone=True), server_default=func.now())

    commande = relationship("Commande")