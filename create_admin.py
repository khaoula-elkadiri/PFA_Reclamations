"""
Crée le compte administrateur du système.
Execution : .\\venv\\Scripts\\python create_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from passlib.context import CryptContext
from sqlalchemy.orm import sessionmaker

from backend.app.database import engine
from backend.app.models import Agent, Service

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_EMAIL = "admin@reclamations.dz"
ADMIN_PASSWORD = "Admin2024!"


def create_admin():
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Vérifier si admin existe déjà
        existing = db.query(Agent).filter(Agent.email == ADMIN_EMAIL).first()
        if existing:
            print(f"Compte admin deja existant : {ADMIN_EMAIL}")
            print(f"Role actuel : {existing.role}")
            if existing.role != "administrateur":
                existing.role = "administrateur"
                db.commit()
                print("Role mis a jour vers 'administrateur'")
            return

        # Trouver ou créer le service Administration
        service = db.query(Service).filter(Service.nom_service == "Administration").first()
        if not service:
            service = Service(
                nom_service="Administration",
                description="Service d'administration du système",
            )
            db.add(service)
            db.flush()

        admin = Agent(
            nom="Administrateur",
            prenom="Système",
            email=ADMIN_EMAIL,
            role="administrateur",
            disponible=True,
            id_service=service.id_service,
            mot_de_passe_hash=pwd_context.hash(ADMIN_PASSWORD),
        )
        db.add(admin)
        db.commit()

        sep = "=" * 50
        print(sep)
        print("COMPTE ADMIN CREE")
        print(sep)
        print(f"Email    : {ADMIN_EMAIL}")
        print(f"Password : {ADMIN_PASSWORD}")
        print(f"Role     : administrateur")
        print(sep)

    except Exception as e:
        db.rollback()
        print(f"ERREUR : {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
