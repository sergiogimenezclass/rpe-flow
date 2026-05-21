import sqlite3
import os

def init_db():
    db_path = 'backend/database/database.db'
    schema_path = 'backend/database/schema.sql'
    
    conn = sqlite3.connect(db_path)
    with open(schema_path, 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f"Base de datos inicializada en {db_path}")

if __name__ == "__main__":
    init_db()
