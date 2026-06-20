import sys
sys.path.insert(0, '.')
from backend.app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text(
        "ALTER TABLE agent MODIFY role ENUM("
        "'agent_service_client','agent_transport','agent_qualite',"
        "'agent_stock','responsable_logistique','superviseur','administrateur'"
        ") DEFAULT 'agent_service_client'"
    ))
    conn.commit()
    r = conn.execute(text("SHOW COLUMNS FROM agent WHERE Field='role'"))
    for row in r:
        print(dict(row._mapping))
print("ALTER TABLE agent.role OK")
