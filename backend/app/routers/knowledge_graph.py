from fastapi import APIRouter, HTTPException
from app.models import KnowledgeGraphData, ApiResponse, GraphNode, GraphLink, SuggestedSkill
from app.database import Neo4jConnection
from typing import List

router = APIRouter()


def get_graph_data(user_id: str) -> KnowledgeGraphData:
    """Get knowledge graph data - matches Next.js implementation"""
    if not Neo4jConnection.is_configured():
        raise HTTPException(status_code=500, detail="Neo4j not configured")

    # Create new driver for each request (like Next.js does)
    driver = Neo4jConnection.create_driver()
    session = driver.session()
    
    try:
        # Get nodes
        nodes_query = """
        MATCH (s:Skill)
        OPTIONAL MATCH (u:User {id: $userId})-[l:LEARNED]->(s)
        RETURN s.id as id, s.name as name, s.category as category,
               COALESCE(l.confidence, 0) as confidence,
               CASE WHEN l IS NOT NULL THEN true ELSE false END as learned
        """
        nodes_result = session.run(nodes_query, userId=user_id)
        nodes_records = list(nodes_result)  # Consume results immediately

        # Get links
        links_query = """
        MATCH (s1:Skill)-[r:PREREQUISITE_OF|RELATES_TO]->(s2:Skill)
        RETURN s1.id as source, s2.id as target, type(r) as type
        """
        links_result = session.run(links_query)
        links_records = list(links_result)  # Consume results immediately

        # Get suggestions
        suggestions_query = """
        MATCH (u:User {id: $userId})-[:LEARNED]->(known:Skill)-[:PREREQUISITE_OF]->(next:Skill)
        WHERE NOT (u)-[:LEARNED]->(next)
        WITH next, collect(DISTINCT known.name) as learnedPrereqs
        OPTIONAL MATCH (allPrereq:Skill)-[:PREREQUISITE_OF]->(next)
        WITH next, learnedPrereqs, collect(DISTINCT allPrereq.name) as allPrereqs
        WITH next, learnedPrereqs, allPrereqs,
             CASE WHEN size(allPrereqs) > 0 
                  THEN toFloat(size(learnedPrereqs)) / size(allPrereqs) * 100 
                  ELSE 100.0 END as readiness
        RETURN DISTINCT next.id as id, next.name as name, next.category as category,
               learnedPrereqs as prerequisites, readiness
        ORDER BY readiness DESC, size(learnedPrereqs) DESC
        LIMIT 5
        """
        suggestions_result = session.run(suggestions_query, userId=user_id)
        suggestions_records = list(suggestions_result)  # Consume results immediately

        # Process nodes
        nodes: List[GraphNode] = []
        for record in nodes_records:
            confidence = record["confidence"]
            # Handle Neo4j Integer type conversion
            if hasattr(confidence, 'to_number'):
                confidence = confidence.to_number()
            elif hasattr(confidence, '__int__'):
                confidence = float(confidence)
            else:
                confidence = float(confidence) if confidence is not None else 0.0
            
            nodes.append(GraphNode(
                id=str(record["id"]),
                name=str(record["name"]),
                category=str(record["category"]),
                confidence=float(confidence),
                learned=bool(record["learned"])
            ))

        # Process links
        links: List[GraphLink] = []
        for record in links_records:
            links.append(GraphLink(
                source=str(record["source"]),
                target=str(record["target"]),
                type=str(record["type"])
            ))

        # Process suggestions
        suggested_skills: List[SuggestedSkill] = []
        for record in suggestions_records:
            readiness = record["readiness"]
            # Handle Neo4j Integer/Float type conversion
            if hasattr(readiness, 'to_number'):
                readiness = readiness.to_number()
            elif hasattr(readiness, '__float__'):
                readiness = float(readiness)
            else:
                readiness = float(readiness) if readiness is not None else 0.0
            
            prerequisites = record["prerequisites"]
            if prerequisites is None:
                prerequisites = []
            
            suggested_skills.append(SuggestedSkill(
                id=str(record["id"]),
                name=str(record["name"]),
                category=str(record["category"]),
                prerequisites=[str(p) for p in prerequisites] if prerequisites else [],
                readinessScore=int(round(readiness))
            ))

        return KnowledgeGraphData(
            nodes=nodes,
            links=links,
            suggestedNextSkills=suggested_skills
        )
    except Exception as e:
        # Re-raise to be handled by endpoint
        raise e
    finally:
        # Always close session and driver (like Next.js does)
        try:
            session.close()
        except:
            pass
        try:
            driver.close()
        except:
            pass


@router.get("", response_model=ApiResponse)
async def get_knowledge_graph():
    """Get knowledge graph data directly from Neo4j"""
    try:
        data = get_graph_data("user-1")
        return ApiResponse(
            data=data.model_dump(),
            error=None,
            success=True
        )
    except Exception as e:
        # Return error response
            return ApiResponse(
                data={
                    "nodes": [],
                    "links": [],
                    "suggestedNextSkills": []
                },
            error=f"Failed to fetch knowledge graph: {str(e)}",
                success=False
            )

