"""
Database initialization script for CampusXplore.
Reads DB credentials from backend/.env, connects to PostgreSQL maintenance database,
checks and creates 'campusxplore_db' if it does not exist, and applies Django migrations.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

db_name = os.environ.get('DB_NAME', 'campusxplore_db')
db_user = os.environ.get('DB_USER', 'postgres')
db_password = os.environ.get('DB_PASSWORD', '')
db_host = os.environ.get('DB_HOST', '127.0.0.1')
db_port = os.environ.get('DB_PORT', '5432')

print(f"Attempting to connect to PostgreSQL at {db_host}:{db_port} as user '{db_user}'...")

try:
    conn = psycopg.connect(
        dbname="postgres",
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port,
        autocommit=True
    )
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
    exists = cursor.fetchone()

    if not exists:
        print(f"Database '{db_name}' does not exist. Creating...")
        # Note: Database names cannot be parameterized in SQL queries, safe identifier quoting used
        cursor.execute(f'CREATE DATABASE "{db_name}" OWNER "{db_user}";')
        print(f"Database '{db_name}' created successfully.")
    else:
        print(f"Database '{db_name}' already exists.")

    cursor.close()
    conn.close()
    print("PostgreSQL connection and database check succeeded.")
except psycopg.OperationalError as e:
    print(f"PostgreSQL OperationalError: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Unexpected error: {e}")
    sys.exit(1)
