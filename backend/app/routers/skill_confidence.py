from fastapi import APIRouter, HTTPException
from app.models import RadarDataPoint, ApiResponse
from app.database import Neo4jConnection
from typing import List

router = APIRouter()


def get_top_skills(user_id: str) -> List[RadarDataPoint]:
    """Get top skills by confidence - matches Next.js implementation"""
    if not Neo4jConnection.is_configured():
        raise HTTPException(status_code=500, detail="Neo4j not configured")

    # Create new driver for each request (like Next.js does)
    driver = Neo4jConnection.create_driver()
    session = driver.session()
    
    try:
        query = """
        MATCH (u:User {id: $userId})-[l:LEARNED]->(s:Skill)
        RETURN s.name as skill, l.confidence as confidence
        ORDER BY l.confidence DESC
        LIMIT 6
        """
        result = session.run(query, userId=user_id)
        records = list(result)  # Consume results immediately

        skills = []
        for record in records:
            confidence = record["confidence"]
            # Handle Neo4j Integer type conversion
            if hasattr(confidence, 'to_number'):
                confidence = confidence.to_number()
            elif hasattr(confidence, '__float__'):
                confidence = float(confidence)
            else:
                confidence = float(confidence) if confidence is not None else 0.0
            
            skills.append(RadarDataPoint(
                skill=str(record["skill"]),
                confidence=float(confidence),
                fullMark=100
            ))

        return skills
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
async def get_skill_confidence():
    """Get skill confidence data directly from Neo4j"""
    try:
        data = get_top_skills("user-1")
        return ApiResponse(
            data=[s.model_dump() for s in data],
            error=None,
            success=True
        )
    except Exception as e:
        # Return error response
            return ApiResponse(
                data=[],
            error=f"Failed to fetch skill confidence: {str(e)}",
                success=False
            )

