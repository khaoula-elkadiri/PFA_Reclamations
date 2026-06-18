"""Script one-shot : hash les mots de passe par défaut des agents seedés."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from passlib.context import CryptContext
from backend.app.database import SessionLocal
from backend.app.models import Agent

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

AGENT_PASSWORDS = {
    "yassine.transport@gmail.com": "transport123",
    "salma.qualite@gmail.com":     "qualite123",
    "omar.stock@gmail.com":        "stock123",
    "meryem.preparation@gmail.com": "preparation123",
    "sara.client@gmail.com":       "client123",
}

db = SessionLocal()
try:
    for email, password in AGENT_PASSWORDS.items():
        agent = db.query(Agent).filter(Agent.email == email).first()
        if agent:
            agent.mot_de_passe_hash = pwd_context.hash(password)
            print(f"OK : {email} - mot de passe hache")
        else:
            print(f"MANQUANT : {email}")
    db.commit()
    print("\nSeed termine avec succes.")
finally:
    db.close()
