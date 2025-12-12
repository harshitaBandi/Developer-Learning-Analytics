from fastapi import APIRouter, HTTPException
from app.models import LVIData, ApiResponse
from app.database import FirebaseConnection
from datetime import datetime, timedelta

router = APIRouter()


def calc_lvi(concepts: int, rate: float, time: float, scale: int = 10) -> int:
    if time <= 0:
        return 0
    return min(max(round((concepts * rate) / time * scale), 0), 100)


def get_lvi_data(user_id: str) -> LVIData:
    if not FirebaseConnection.is_configured():
        raise HTTPException(status_code=500, detail="Firestore not configured")

    db = FirebaseConnection.get_firestore()
    now = datetime.now()
    
    # Calculate week start (Sunday)
    week_start = now - timedelta(days=now.weekday() + 1)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Calculate week end (Saturday)
    week_end = week_start + timedelta(days=6)
    week_end = week_end.replace(hour=23, minute=59, second=59, microsecond=999)
    
    # Firestore client automatically converts Python datetime to Firestore Timestamp
    # Query sessions
    sessions_ref = db.collection('sessions')
    sessions_query = sessions_ref.where('userId', '==', user_id)\
        .where('startTime', '>=', week_start)\
        .where('startTime', '<=', week_end)
    sessions = sessions_query.get()
    
    # Query skill applications
    apps_ref = db.collection('skill_applications')
    apps_query = apps_ref.where('userId', '==', user_id)\
        .where('appliedAt', '>=', week_start)\
        .where('appliedAt', '<=', week_end)
    apps = apps_query.get()
    
    # Process sessions
    concepts = set()
    total_duration = 0
    for doc in sessions:
        data = doc.to_dict()
        concepts_learned = data.get('conceptsLearned', [])
        if concepts_learned:
            concepts.update(concepts_learned)
            total_duration += data.get('duration', 0)
    
    # Process applications
    rate_sum = 0.0
    for doc in apps:
        data = doc.to_dict()
        rate_sum += data.get('successRate', 0.0)
    rate = rate_sum / len(apps) if apps else 0.0
    
    count = len(concepts)
    avg_time = (total_duration / 60 / 24) / count if count > 0 else 1.0
    
    return LVIData(
        score=calc_lvi(count, rate, avg_time),
        conceptsMastered=count,
        applicationRate=rate,
        avgTimeToMastery=max(avg_time, 0.1),
        scalingFactor=10,
        weekStart=week_start.strftime('%Y-%m-%d'),
        weekEnd=week_end.strftime('%Y-%m-%d')
    )
        

@router.get("", response_model=ApiResponse)
async def get_lvi():
    try:
        data = get_lvi_data("user-1")
        return ApiResponse(
            data=data.model_dump(),
            error=None,
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        return ApiResponse(
            data=None,
            error=str(e),
            success=False
        )

