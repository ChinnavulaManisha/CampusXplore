import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

print(f"Django Database Engine: {connection.settings_dict['ENGINE']}")
print(f"Database Vendor: {connection.vendor}")
print(f"Configured Database Name: {connection.settings_dict['NAME']}")

with connection.cursor() as cursor:
    cursor.execute("SELECT current_database(), version();")
    db_name, version = cursor.fetchone()
    print(f"Connected Database: {db_name}")
    print(f"PostgreSQL Version: {version.split(',')[0]}")
    
    cursor.execute("SELECT datname FROM pg_database WHERE datname='campusxplore_db';")
    exists = cursor.fetchone()
    print(f"Database 'campusxplore_db' exists in pg_database: {exists is not None}")
