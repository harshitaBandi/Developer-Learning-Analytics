# Skill management API - add, update, delete skills

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models import ApiResponse, SkillCategory
from app.database import Neo4jConnection
from app.graph_rag import GraphRAG
from typing import Optional

router = APIRouter()


class AddSkillRequest(BaseModel):
    skill_name: str
    category: Optional[SkillCategory] = None
    learned: bool
    confidence: Optional[int] = 50
    user_id: str = "user-1"


class UpdateSkillStatusRequest(BaseModel):
    skill_id: str
    learned: bool
    confidence: Optional[int] = None
    user_id: str = "user-1"


def enrich_skill(skill_name):
    # Use AI to get skill metadata
    try:
        rag = GraphRAG()
        return rag.enrich_single_skill(skill_name)
    except Exception as e:
        print(f"Error in GraphRAG enrichment: {e}")
        return {
            'category': 'backend',
            'description': f'User-added skill: {skill_name}',
            'difficulty_level': 2,
            'learning_time_hours': 20
        }


@router.post("/add-skill", response_model=ApiResponse)
async def add_skill(request: AddSkillRequest):
    try:
        if not Neo4jConnection.is_configured():
            raise HTTPException(status_code=500, detail="Neo4j not configured")
        
        driver = Neo4jConnection.create_driver()
        session = driver.session()
        
        try:
            # Get AI-enriched skill data
            enriched = enrich_skill(request.skill_name)
            desc = enriched['description']
            difficulty = enriched['difficulty_level']
            learning_time = enriched['learning_time_hours']
            
            # Category is optional (for visualization only)
            category = request.category or enriched.get('category', 'backend')
            
            # Generate skill ID
            skill_id = request.skill_name.lower().replace(' ', '-').replace('.', '')
            
            # Check if exists
            check = session.run("""
                MATCH (s:Skill {id: $skillId})
                RETURN s.id as id
            """, skillId=skill_id)
            
            if check.single():
                return ApiResponse(
                    data=None,
                    error=f"Skill '{request.skill_name}' already exists",
                    success=False
                )
            
            # Create skill node
            session.run("""
                CREATE (s:Skill {
                    id: $id,
                    name: $name,
                    category: $category,
                    description: $description,
                    difficulty_level: $difficulty,
                    learning_time_hours: $learningTime
                })
            """, 
            id=skill_id,
            name=request.skill_name,
            category=category,
            description=desc,
            difficulty=difficulty,
            learningTime=learning_time)
            
            # Get existing skills for AI analysis
            existing = session.run("""
                MATCH (s:Skill)
                WHERE s.id <> $skillId
                RETURN s.name as name
            """, skillId=skill_id)
            existing_names = [r['name'] for r in existing]
            
            # Use AI to find related skills
            try:
                rag = GraphRAG()
                related = rag.find_related_skills(request.skill_name, existing_names)
                print(f"AI found related skills for '{request.skill_name}': {related}")
            except Exception as e:
                print(f"ERROR: GraphRAG failed to find related skills: {e}")
                related = []
            
            # Create RELATES_TO relationships
            relates_count = 0
            if related:
                for rel_name in related:
                    rel_id = rel_name.lower().replace(' ', '-').replace('.', '')
                    result = session.run("""
                        MATCH (new:Skill {id: $skillId})
                        MATCH (related:Skill)
                        WHERE related.id = $relatedId OR related.name = $relatedName
                        CREATE (new)-[:RELATES_TO]->(related)
                        RETURN count(*) as count
                    """, skillId=skill_id, relatedId=rel_id, relatedName=rel_name)
                    rec = result.single()
                    if rec and rec['count'] > 0:
                        relates_count += rec['count']
            
            # Find prerequisites using AI
            try:
                prereqs = rag.find_prerequisites(request.skill_name, existing_names)
                print(f"AI found prerequisites for '{request.skill_name}': {prereqs}")
            except Exception as e:
                print(f"ERROR: GraphRAG failed to find prerequisites: {e}")
                prereqs = []
            
            # Create PREREQUISITE_OF relationships
            prereq_count = 0
            if prereqs:
                for prereq_name in prereqs:
                    prereq_id = prereq_name.lower().replace(' ', '-').replace('.', '')
                    result = session.run("""
                        MATCH (prereq:Skill)
                        WHERE prereq.id = $prereqId OR prereq.name = $prereqName
                        MATCH (new:Skill {id: $skillId})
                        CREATE (prereq)-[:PREREQUISITE_OF]->(new)
                        RETURN count(*) as count
                    """, prereqId=prereq_id, prereqName=prereq_name, skillId=skill_id)
                    rec = result.single()
                    if rec and rec['count'] > 0:
                        prereq_count += rec['count']
            
            # Mark as learned if requested
            if request.learned:
                session.run("""
                    MATCH (u:User {id: $userId})
                    MATCH (s:Skill {id: $skillId})
                    CREATE (u)-[:LEARNED {confidence: $confidence}]->(s)
                """, 
                userId=request.user_id,
                skillId=skill_id,
                confidence=request.confidence or 50)
            
            return ApiResponse(
                data={
                    "skill_id": skill_id,
                    "skill_name": request.skill_name,
                    "learned": request.learned,
                    "relationships_created": {
                        "relates_to": relates_count,
                        "prerequisites": prereq_count
                    },
                    "message": f"Skill added with {relates_count + prereq_count} relationships"
                },
                error=None,
                success=True
            )
            
        finally:
            session.close()
            driver.close()
            
    except Exception as e:
        return ApiResponse(
            data=None,
            error=f"Failed to add skill: {str(e)}",
            success=False
        )


@router.post("/update-skill-status", response_model=ApiResponse)
async def update_skill_status(request: UpdateSkillStatusRequest):
    try:
        if not Neo4jConnection.is_configured():
            raise HTTPException(status_code=500, detail="Neo4j not configured")
        
        driver = Neo4jConnection.create_driver()
        session = driver.session()
        
        try:
            if request.learned:
                session.run("""
                    MATCH (u:User {id: $userId})
                    MATCH (s:Skill {id: $skillId})
                    MERGE (u)-[l:LEARNED]->(s)
                    SET l.confidence = $confidence
                """, 
                userId=request.user_id,
                skillId=request.skill_id,
                confidence=request.confidence or 50)
                msg = "Skill marked as learned"
            else:
                session.run("""
                    MATCH (u:User {id: $userId})-[l:LEARNED]->(s:Skill {id: $skillId})
                    DELETE l
                """, 
                userId=request.user_id,
                skillId=request.skill_id)
                msg = "Skill marked as not learned"
            
            return ApiResponse(
                data={
                    "skill_id": request.skill_id,
                    "learned": request.learned,
                    "message": msg
                },
                error=None,
                success=True
            )
            
        finally:
            session.close()
            driver.close()
            
    except Exception as e:
        return ApiResponse(
            data=None,
            error=f"Failed to update skill status: {str(e)}",
            success=False
        )


@router.delete("/delete-skill/{skill_id}", response_model=ApiResponse)
async def delete_skill(skill_id: str):
    try:
        if not Neo4jConnection.is_configured():
            raise HTTPException(status_code=500, detail="Neo4j not configured")
        
        driver = Neo4jConnection.create_driver()
        session = driver.session()
        
        try:
            result = session.run("""
                MATCH (s:Skill {id: $skillId})
                DETACH DELETE s
                RETURN count(s) as deleted
            """, skillId=skill_id)
            
            deleted = result.single()["deleted"]
            
            if deleted == 0:
                return ApiResponse(
                    data=None,
                    error=f"Skill '{skill_id}' not found",
                    success=False
                )
            
            return ApiResponse(
                data={
                    "skill_id": skill_id,
                    "message": "Skill deleted successfully"
                },
                error=None,
                success=True
            )
            
        finally:
            session.close()
            driver.close()
            
    except Exception as e:
        return ApiResponse(
            data=None,
            error=f"Failed to delete skill: {str(e)}",
            success=False
        )
