from fastapi import APIRouter, HTTPException
from app.models import LVITrendData, LVISnapshot, ApiResponse
from app.database import FirebaseConnection
from typing import List, Literal
from datetime import datetime

router = APIRouter()


def determine_trend(snapshots: List[dict]) -> dict:
    if len(snapshots) < 2:
        return {"trend": "stable", "percentChange": 0.0}

    mid = len(snapshots) // 2
    avg_first = sum(s["score"] for s in snapshots[:mid]) / mid
    avg_second = sum(s["score"] for s in snapshots[mid:]) / (len(snapshots) - mid)

    change = ((avg_second - avg_first) / avg_first * 100) if avg_first > 0 else 0.0

    if change > 5:
        trend: Literal['accelerating', 'stable', 'decelerating'] = 'accelerating'
    elif change < -5:
        trend = 'decelerating'
    else:
        trend = 'stable'

    return {"trend": trend, "percentChange": change}


def get_snapshots(user_id: str) -> List[LVISnapshot]:
    if not FirebaseConnection.is_configured():
        raise HTTPException(status_code=500, detail="Firestore not configured")

    db = FirebaseConnection.get_firestore()

    snapshots_ref = db.collection('lvi_snapshots')
    snapshots_query = snapshots_ref.where('userId', '==', user_id)\
        .order_by('createdAt', direction='DESCENDING')\
        .limit(12)
    snapshots = snapshots_query.get()

    result = []
    for doc in snapshots:
        data = doc.to_dict()
        created_at = data.get('createdAt')
        if hasattr(created_at, 'to_datetime'):
            created_at_str = created_at.to_datetime().isoformat()
        elif hasattr(created_at, 'isoformat'):
            created_at_str = created_at.isoformat()
        else:
            created_at_str = datetime.now().isoformat()

        result.append(LVISnapshot(
            id=doc.id,
            weekNumber=data.get('weekNumber', 0),
            year=data.get('year', 2024),
            score=data.get('score', 0),
            conceptsMastered=data.get('conceptsMastered', 0),
            applicationRate=data.get('applicationRate', 0.0),
            avgTimeToMastery=data.get('avgTimeToMastery', 0.0),
            createdAt=created_at_str
        ))

    return list(reversed(result))


@router.get("", response_model=ApiResponse)
async def get_lvi_trend():
    try:
        snapshots = get_snapshots("user-1")
        trend_data = determine_trend([s.model_dump() for s in snapshots])

        data = LVITrendData(
            snapshots=snapshots,
            trend=trend_data["trend"],
            percentChange=trend_data["percentChange"]
        )

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

