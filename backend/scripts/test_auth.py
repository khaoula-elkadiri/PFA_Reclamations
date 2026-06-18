"""Test rapide de l'authentification."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from passlib.context import CryptContext
from backend.app.database import SessionLocal
from backend.app.models import Agent

ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

agent = db.query(Agent).filter(Agent.email == "yassine.transport@gmail.com").first()
print(f"Agent trouve: {agent.nom} {agent.prenom}")
print(f"Hash en DB (60 chars?): {len(agent.mot_de_passe_hash)} chars = {agent.mot_de_passe_hash}")
print(f"Verify transport123: {ctx.verify('transport123', agent.mot_de_passe_hash)}")

db.close()
