import { NextResponse } from 'next/server';
import { KnowledgeGraphData, ApiResponse, GraphNode, GraphLink, SkillCategory, SuggestedSkill } from '@/types';

const hasNeo4j = () => !!(process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD);

async function getGraphData(userId: string): Promise<KnowledgeGraphData> {
  const neo4j = await import('neo4j-driver');
  const driver = neo4j.default.driver(
    process.env.NEO4J_URI!,
    neo4j.default.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );
  const session = driver.session();

  try {
    const nodesRes = await session.run(`
      MATCH (s:Skill)
      OPTIONAL MATCH (u:User {id: $userId})-[l:LEARNED]->(s)
      RETURN s.id as id, s.name as name, s.category as category,
             COALESCE(l.confidence, 0) as confidence,
             CASE WHEN l IS NOT NULL THEN true ELSE false END as learned
    `, { userId });

    const linksRes = await session.run(`
      MATCH (s1:Skill)-[r:PREREQUISITE_OF|RELATES_TO]->(s2:Skill)
      RETURN s1.id as source, s2.id as target, type(r) as type
    `);

    const suggestionsRes = await session.run(`
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
    `, { userId });

    const nodes: GraphNode[] = nodesRes.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      category: r.get('category') as SkillCategory,
      confidence: typeof r.get('confidence') === 'object' ? r.get('confidence').toNumber() : r.get('confidence'),
      learned: r.get('learned'),
    }));

    const links: GraphLink[] = linksRes.records.map(r => ({
      source: r.get('source'),
      target: r.get('target'),
      type: r.get('type') as 'PREREQUISITE_OF' | 'RELATES_TO',
    }));

    const suggestedNextSkills: SuggestedSkill[] = suggestionsRes.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      category: r.get('category') as SkillCategory,
      prerequisites: r.get('prerequisites') as string[],
      readinessScore: typeof r.get('readiness') === 'object'
        ? Math.round(r.get('readiness').toNumber())
        : Math.round(r.get('readiness')),
    }));

    return { nodes, links, suggestedNextSkills };
  } finally {
    await session.close();
    await driver.close();
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<KnowledgeGraphData>>> {
  if (!hasNeo4j()) {
    return NextResponse.json({ data: null as any, error: 'Neo4j not configured', success: false }, { status: 500 });
  }

  try {
    const data = await getGraphData('user-1');
    return NextResponse.json({ data, error: null, success: true });
  } catch (err) {
    console.error('Graph fetch failed:', err);
    return NextResponse.json({
      data: null as any,
      error: err instanceof Error ? err.message : 'Failed',
      success: false,
    }, { status: 500 });
  }
}
