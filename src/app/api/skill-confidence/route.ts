import { NextResponse } from 'next/server';
import { RadarDataPoint, ApiResponse } from '@/types';

const hasNeo4j = () => !!(process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD);

async function getTopSkills(userId: string): Promise<RadarDataPoint[]> {
  const neo4j = await import('neo4j-driver');
  
  const driver = neo4j.default.driver(
    process.env.NEO4J_URI!,
    neo4j.default.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );
  const session = driver.session();
  
  try {
    const res = await session.run(`
      MATCH (u:User {id: $userId})-[l:LEARNED]->(s:Skill)
      RETURN s.name as skill, l.confidence as confidence
      ORDER BY l.confidence DESC
      LIMIT 6
    `, { userId });

    return res.records.map(r => ({
      skill: r.get('skill'),
      confidence: typeof r.get('confidence') === 'object' 
        ? r.get('confidence').toNumber() 
        : r.get('confidence'),
      fullMark: 100,
    }));
  } finally {
    await session.close();
    await driver.close();
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<RadarDataPoint[]>>> {
  if (!hasNeo4j()) {
    return NextResponse.json({
      data: null as any,
      error: 'Neo4j not configured',
      success: false,
    }, { status: 500 });
  }

  try {
    const data = await getTopSkills('user-1');
    return NextResponse.json({ data, error: null, success: true });
  } catch (err) {
    console.error('Skill confidence fetch failed:', err);
    return NextResponse.json({
      data: null as any,
      error: err instanceof Error ? err.message : 'Failed to fetch skills',
      success: false,
    }, { status: 500 });
  }
}
