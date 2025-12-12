from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import certifi
from app.routers import knowledge_graph, lvi, lvi_trend, skill_confidence, graph_rag_admin, skill_management

# Load environment variables from project root
project_root = Path(__file__).parent.parent
load_dotenv(project_root / '.env.local')  # Try .env.local first
load_dotenv(project_root / '.env')  # Fall back to .env
load_dotenv()  # Also load from current directory

# Configure SSL certificates for Neo4j Aura (Python 3.13+ compatibility)
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

app = FastAPI(
    title="Neu4G API",
    description="Learning Analytics Dashboard API",
    version="1.0.0"
)

# CORS middleware - allow frontend origins
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://developer-learning-analytics-snbb-9juvmwpl.vercel.app",
]

# Add env var for additional origins (useful for Railway/production)
if frontend_url := os.getenv("FRONTEND_URL"):
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(knowledge_graph.router, prefix="/api/knowledge-graph", tags=["knowledge-graph"])
app.include_router(lvi.router, prefix="/api/lvi", tags=["lvi"])
app.include_router(lvi_trend.router, prefix="/api/lvi-trend", tags=["lvi-trend"])
app.include_router(skill_confidence.router, prefix="/api/skill-confidence", tags=["skill-confidence"])
app.include_router(graph_rag_admin.router, prefix="/api/graph-rag", tags=["graph-rag"])
app.include_router(skill_management.router, prefix="/api/skills", tags=["skills"])


@app.get("/")
async def root():
    return {"message": "Neu4G API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/debug/env")
async def debug_env():
    """Debug endpoint to check environment variables"""
    import os
    return {
        "neo4j_uri": os.getenv("NEO4J_URI", "NOT SET"),
        "neo4j_user": os.getenv("NEO4J_USER", "NOT SET"),
        "neo4j_password_set": bool(os.getenv("NEO4J_PASSWORD")),
        "firebase_project_id": os.getenv("FIREBASE_PROJECT_ID", "NOT SET"),
    }

