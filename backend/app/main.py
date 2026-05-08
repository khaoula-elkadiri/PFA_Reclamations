from fastapi import FastAPI
from backend.app.database import SessionLocal
from backend.app.models import Client
from backend.app.schemas import ReclamationCreate

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Backend PFA Réclamations fonctionne correctement"
    }
@app.get("/clients")
def get_clients():

    db = SessionLocal()

    clients = db.query(Client).all()

    return clients

@app.post("/reclamation")
def creer_reclamation(reclamation: ReclamationCreate):
    return {
        "message": "Réclamation reçue avec succès",
        "statut": "Votre réclamation est en cours de traitement",
        "data": reclamation
    }