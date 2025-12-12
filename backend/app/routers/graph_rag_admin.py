"""
Graph RAG Admin API - Generate and manage dynamic knowledge graph
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from app.models import ApiResponse
from app.graph_rag import GraphRAG, Skill, SkillRelationship, LearningPath
from app.database import Neo4jConnection
import os

router = APIRouter()


class GenerateSkillsRequest(BaseModel):
    domain: str
    num_skills: int = 20
    user_id: str = "user-1"


class GeneratePathRequest(BaseModel):
    user_id: str
    target_skill_id: str


class EnrichSkillRequest(BaseModel):
    skill_id: str


@router.post("/generate-skills", response_model=ApiResponse)
async def generate_skills(request: GenerateSkillsRequest, background_tasks: BackgroundTasks):
    """
    Generate skills dynamically using Graph RAG and populate Neo4j
    
    This endpoint:
    1. Uses LLM to generate skills for the specified domain
    2. Generates intelligent relationships between skills
    3. Populates Neo4j with the generated data
    """
    try:
        # Initialize Graph RAG
        graph_rag = GraphRAG()
        
        # Generate skills
        skills = graph_rag.generate_skills_from_domain(
            domain=request.domain,
            num_skills=request.num_skills
        )
        
        if not skills:
            raise HTTPException(status_code=500, detail="Failed to generate skills")
        
        # Generate relationships
        relationships = graph_rag.generate_skill_relationships(skills)
        
        # Populate Neo4j in background
        background_tasks.add_task(
            populate_neo4j_with_generated_data,
            skills=skills,
            relationships=relationships,
            user_id=request.user_id
        )
        
        return ApiResponse(
            data={
                "message": f"Generating {len(skills)} skills and {len(relationships)} relationships",
                "domain": request.domain,
                "skills_count": len(skills),
                "relationships_count": len(relationships),
                "status": "processing"
            },
            error=None,
            success=True
        )
        
    except Exception as e:
        return ApiResponse(
            data=None,
            error=f"Failed to generate skills: {str(e)}",
            success=False
        )


@router.post("/generate-learning-path", response_model=ApiResponse)
async def generate_learning_path(request: GeneratePathRequest):
    """
    Generate personalized learning path using Graph RAG
    
    Analyzes user's current skills and generates optimal path to target skill
    """
    try:
        if not Neo4jConnection.is_configured():
            raise HTTPException(status_code=500, detail="Neo4j not configured")
        
        # Get user's current skills from Neo4j
        driver = Neo4jConnection.create_driver()
        session = driver.session()
        
        try:
            # Get user's learned skills
            user_skills_result = session.run("""
                MATCH (u:User {id: $userId})-[:LEARNED]->(s:Skill)
                RETURN s.id as skill_id
            """, userId=request.user_id)
            user_skills = [record["skill_id"] for record in user_skills_result]
            
            # Get all skills
            all_skills_result = session.run("""
                MATCH (s:Skill)
                RETURN s.id as id, s.name as name, s.category as category,
                       s.description as description, s.difficulty_level as difficulty,
                       s.learning_time_hours as hours
            """)
            
            all_skills = []
            for record in all_skills_result:
                all_skills.append(Skill(
                    id=record["id"],
                    name=record["name"],
                    category=record["category"],
                    description=record.get("description", ""),
                    difficulty_level=int(record.get("difficulty", 1)),
                    learning_time_hours=int(record.get("hours", 10))
                ))
            
            # Get relationships
            relationships_result = session.run("""
                MATCH (s1:Skill)-[r:PREREQUISITE_OF|RELATES_TO]->(s2:Skill)
                RETURN s1.id as source, s2.id as target, type(r) as type
            """)
            
            relationships = []
            for record in relationships_result:
                relationships.append(SkillRelationship(
                    source_skill_id=record["source"],
                    target_skill_id=record["target"],
                    relationship_type=record["type"],
                    strength=0.8
                ))
            
        finally:
            session.close()
            driver.close()
        
        # Generate learning path using Graph RAG
        graph_rag = GraphRAG()
        learning_path = graph_rag.generate_learning_path(
            user_skills=user_skills,
            target_skill=request.target_skill_id,
            all_skills=all_skills,
            relationships=relationships
        )
        
        if not learning_path:
            raise HTTPException(status_code=404, detail="Could not generate learning path")
        
        return ApiResponse(
            data=learning_path.model_dump(),
            error=None,
            success=True
        )
        
    except Exception as e:
        return ApiResponse(
            data=None,
            error=f"Failed to generate learning path: {str(e)}",
            success=False
        )


@router.post("/enrich-skill", response_model=ApiResponse)
async def enrich_skill(request: EnrichSkillRequest):
    """
    Enrich a skill with learning resources, projects, and tips using Graph RAG
    """
    try:
        if not Neo4jConnection.is_configured():
            raise HTTPException(status_code=500, detail="Neo4j not configured")
        
        # Get skill from Neo4j
        driver = Neo4jConnection.create_driver()
        session = driver.session()
        
        try:
            result = session.run("""
                MATCH (s:Skill {id: $skillId})
                RETURN s.id as id, s.name as name, s.category as category,
                       s.description as description, s.difficulty_level as difficulty,
                       s.learning_time_hours as hours
            """, skillId=request.skill_id)
            
            record = result.single()
            if not record:
                raise HTTPException(status_code=404, detail="Skill not found")
            
            skill = Skill(
                id=record["id"],
                name=record["name"],
                category=record["category"],
                description=record.get("description", ""),
                difficulty_level=int(record.get("difficulty", 1)),
                learning_time_hours=int(record.get("hours", 10))
            )
            
        finally:
            session.close()
            driver.close()
        
        # Enrich skill using Graph RAG
        graph_rag = GraphRAG()
        enriched_data = graph_rag.enrich_skill_with_resources(skill)
        
        return ApiResponse(
            data=enriched_data,
            error=None,
            success=True
        )
        
    except Exception as e:
        return ApiResponse(
            data=None,
            error=f"Failed to enrich skill: {str(e)}",
            success=False
        )


def populate_neo4j_with_generated_data(
    skills: List[Skill],
    relationships: List[SkillRelationship],
    user_id: str
):
    """Background task to populate Neo4j with generated data"""
    try:
        driver = Neo4jConnection.create_driver()
        session = driver.session()
        
        try:
            # Clear existing skills (keep user)
            session.run("MATCH (s:Skill) DETACH DELETE s")
            
            # Create skills
            for skill in skills:
                session.run("""
                    CREATE (s:Skill {
                        id: $id,
                        name: $name,
                        category: $category,
                        description: $description,
                        difficulty_level: $difficulty,
                        learning_time_hours: $hours
                    })
                """, **skill.model_dump())
            
            # Create relationships
            for rel in relationships:
                session.run(f"""
                    MATCH (s1:Skill {{id: $source}})
                    MATCH (s2:Skill {{id: $target}})
                    CREATE (s1)-[:{rel.relationship_type} {{strength: $strength}}]->(s2)
                """, source=rel.source_skill_id, target=rel.target_skill_id, strength=rel.strength)
            
            # Assign some random skills to user as "learned"
            session.run("""
                MATCH (u:User {id: $userId})
                MATCH (s:Skill)
                WHERE s.difficulty_level <= 2
                WITH u, s, rand() as r
                WHERE r < 0.6
                CREATE (u)-[:LEARNED {confidence: toInteger(70 + rand() * 25)}]->(s)
            """, userId=user_id)
            
            print(f"✅ Populated Neo4j with {len(skills)} skills and {len(relationships)} relationships")
            
        finally:
            session.close()
            driver.close()
            
    except Exception as e:
        print(f"❌ Error populating Neo4j: {e}")


@router.get("/status", response_model=ApiResponse)
async def get_graph_rag_status():
    """Check if Graph RAG is configured and ready"""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        neo4j_configured = Neo4jConnection.is_configured()
        
        return ApiResponse(
            data={
                "openai_configured": bool(api_key),
                "neo4j_configured": neo4j_configured,
                "ready": bool(api_key) and neo4j_configured
            },
            error=None,
            success=True
        )
    except Exception as e:
        return ApiResponse(
            data=None,
            error=str(e),
            success=False
        )

