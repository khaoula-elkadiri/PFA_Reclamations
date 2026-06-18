"""Test le login en simulant exactement ce que fait le backend."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app.database import SessionLocal
from backend.app.models import Agent, Client
from backend.app.auth import verify_password

db = SessionLocal()

# Test agent login
agent = db.query(Agent).filter(Agent.email == "yassine.transport@gmail.com").first()
if agent:
    print(f"Agent: {agent.nom} {agent.prenom}")
    print(f"Hash present: {bool(agent.mot_de_passe_hash)}")
    print(f"Hash length: {len(agent.mot_de_passe_hash) if agent.mot_de_passe_hash else 0}")
    result = verify_password("transport123", agent.mot_de_passe_hash)
    print(f"verify_password('transport123', hash) = {result}")
else:
    print("Agent NOT FOUND")

# Test client register
client_email = "aymanetabete@gmail.com"
existing = db.query(Client).filter(Client.email == client_email).first()
if existing:
    print(f"\nClient existant: {existing.nom} {existing.prenom}, est_inscrit={existing.est_inscrit}")
else:
    print(f"\nClient {client_email} non trouve en DB - inscription possible")

db.close()
