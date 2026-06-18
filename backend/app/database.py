from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Mot de passe original: tabete/01 → encodé en URL: tabete%2F01
DATABASE_URL = "mysql+pymysql://root:tabete%2F01@localhost:3306/pfa_reclamations"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """Dependency pour FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()