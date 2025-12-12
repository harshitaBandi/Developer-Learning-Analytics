import os
import json
from pathlib import Path
from typing import Optional
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable
import ssl
import certifi
from firebase_admin import initialize_app, get_app, firestore
from firebase_admin.credentials import Certificate
from firebase_admin.exceptions import FirebaseError
import firebase_admin


class Neo4jConnection:
    # Neo4j helper - creates new driver per request
    
    @classmethod
    def create_driver(cls):
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USER")
        password = os.getenv("NEO4J_PASSWORD")

        if not all([uri, user, password]):
            raise ValueError("Neo4j configuration missing. Set NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD")

        # Python 3.13+ needs explicit SSL cert config for Neo4j Aura
        os.environ['SSL_CERT_FILE'] = certifi.where()
        os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
        
        driver = GraphDatabase.driver(
            uri,
            auth=(user, password),
            max_connection_lifetime=3600,
            max_connection_pool_size=50,
            connection_timeout=30,
            connection_acquisition_timeout=60
        )
        return driver

    @classmethod
    def is_configured(cls):
        return all([
            os.getenv("NEO4J_URI"),
            os.getenv("NEO4J_USER"),
            os.getenv("NEO4J_PASSWORD")
        ])


class FirebaseConnection:
    _initialized = False

    @classmethod
    def initialize(cls):
        if cls._initialized:
            return

        try:
            get_app()
            cls._initialized = True
            return
        except ValueError:
            pass

        # Try service account file first
        root = Path(__file__).parent.parent.parent
        sa_path = root / "serviceAccountKey.json"
        if not sa_path.exists():
            sa_path = Path("serviceAccountKey.json")
        if sa_path.exists():
            with open(sa_path, 'r') as f:
                sa = json.load(f)
            initialize_app(credential=Certificate(sa))
            cls._initialized = True
            return

        # Fall back to env vars
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
        private_key = os.getenv("FIREBASE_PRIVATE_KEY")

        if all([project_id, client_email, private_key]):
            # Handle key format variations
            formatted_key = private_key
            if formatted_key.startswith('"') and formatted_key.endswith('"'):
                formatted_key = formatted_key[1:-1]
            formatted_key = formatted_key.replace('\\n', '\n')

            initialize_app(credential=Certificate({
                "project_id": project_id,
                "client_email": client_email,
                "private_key": formatted_key,
            }))
            cls._initialized = True
            return

        # Default initialization
        initialize_app()
        cls._initialized = True

    @classmethod
    def get_firestore(cls):
        cls.initialize()
        return firestore.client()

    @classmethod
    def is_configured(cls):
        root = Path(__file__).parent.parent.parent
        sa_path = root / "serviceAccountKey.json"
        if not sa_path.exists():
            sa_path = Path("serviceAccountKey.json")
        if sa_path.exists():
            return True
        return all([
            os.getenv("FIREBASE_PROJECT_ID"),
            os.getenv("FIREBASE_CLIENT_EMAIL"),
            os.getenv("FIREBASE_PRIVATE_KEY")
        ]) or bool(os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"))
