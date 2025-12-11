export type SkillCategory = 'frontend' | 'backend' | 'database' | 'devops' | 'ai-ml' | 'mobile' | 'security';

export interface GraphNode {
  id: string;
  name: string;
  category: SkillCategory;
  confidence: number;
  learned: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'PREREQUISITE_OF' | 'RELATES_TO';
}

export interface SuggestedSkill {
  id: string;
  name: string;
  category: SkillCategory;
  prerequisites: string[];
  readinessScore: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  suggestedNextSkills: SuggestedSkill[];
}

export interface RadarDataPoint {
  skill: string;
  confidence: number;
  fullMark: number;
}

export interface LVIData {
  score: number;
  conceptsMastered: number;
  applicationRate: number;
  avgTimeToMastery: number;
  scalingFactor: number;
  weekStart: string;
  weekEnd: string;
}

export interface LVISnapshot {
  id: string;
  weekNumber: number;
  year: number;
  score: number;
  conceptsMastered: number;
  applicationRate: number;
  avgTimeToMastery: number;
  createdAt: string;
}

export interface LVITrendData {
  snapshots: LVISnapshot[];
  trend: 'accelerating' | 'stable' | 'decelerating';
  percentChange: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export const categoryColors: Record<SkillCategory, string> = {
  frontend: '#3B82F6',
  backend: '#10B981',
  database: '#8B5CF6',
  devops: '#F59E0B',
  'ai-ml': '#EC4899',
  mobile: '#06B6D4',
  security: '#EF4444',
};

export const categoryLabels: Record<SkillCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  devops: 'DevOps',
  'ai-ml': 'AI/ML',
  mobile: 'Mobile',
  security: 'Security',
};
