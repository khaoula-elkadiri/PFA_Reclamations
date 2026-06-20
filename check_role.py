import sys
sys.path.insert(0, '.')
from backend.app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    r = conn.execute(text("SHOW COLUMNS FROM agent WHERE Field='role'"))
    for row in r:
        print(dict(row._mapping))
