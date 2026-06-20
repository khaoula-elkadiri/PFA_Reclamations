import sys
sys.path.insert(0, '.')
from backend.app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    for table, col in [
        ('livraison', 'statut_livraison'),
        ('reclamation', 'statut_reclamation'),
    ]:
        r = conn.execute(text(f"SHOW COLUMNS FROM {table} WHERE Field='{col}'"))
        for row in r:
            print(f"{table}.{col}:", dict(row._mapping)['Type'])
