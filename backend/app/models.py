from typing import List, Literal, Optional, Union, Any
from pydantic import BaseModel


SkillCategory = Literal['frontend', 'backend', 'database', 'devops', 'ai-ml', 'mobile', 'security']


class GraphNode(BaseModel):
    id: str
    name: str
    category: SkillCategory
    confidence: float
    learned: bool
    x: Optional[float] = None
    y: Optional[float] = None
    fx: Optional[float] = None
    fy: Optional[float] = None


class GraphLink(BaseModel):
    source: str
    target: str
    type: Literal['PREREQUISITE_OF', 'RELATES_TO']


class SuggestedSkill(BaseModel):
    id: str
    name: str
    category: SkillCategory
    prerequisites: List[str]
    readinessScore: int


class KnowledgeGraphData(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]
    suggestedNextSkills: List[SuggestedSkill]


class RadarDataPoint(BaseModel):
    skill: str
    confidence: float
    fullMark: int


class LVIData(BaseModel):
    score: int
    conceptsMastered: int
    applicationRate: float
    avgTimeToMastery: float
    scalingFactor: int
    weekStart: str
    weekEnd: str


class LVISnapshot(BaseModel):
    id: str
    weekNumber: int
    year: int
    score: int
    conceptsMastered: int
    applicationRate: float
    avgTimeToMastery: float
    createdAt: str


class LVITrendData(BaseModel):
    snapshots: List[LVISnapshot]
    trend: Literal['accelerating', 'stable', 'decelerating']
    percentChange: float


class ApiResponse(BaseModel):
    data: Optional[Union[dict, list, Any]] = None
    error: Optional[str] = None
    success: bool
