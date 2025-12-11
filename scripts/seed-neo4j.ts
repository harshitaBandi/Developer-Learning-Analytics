// Neo4j seed script - run once with: npm run seed:neo4j

import neo4j from 'neo4j-driver';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local for ts-node
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length && !process.env[key.trim()]) {
      process.env[key.trim()] = val.join('=').trim();
    }
  });
}

const uri = process.env.NEO4J_URI!;
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD!;

if (!uri || !password) {
  console.error('Missing NEO4J_URI or NEO4J_PASSWORD in .env.local');
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function seed() {
  const session = driver.session();

  try {
    console.log('Seeding Neo4j...\n');

    // Clear everything
    await session.run('MATCH (n) DETACH DELETE n');

    // Create user
    await session.run(`CREATE (u:User {id: 'user-1', name: 'Demo Developer', email: 'demo@vibecoderz.com'})`);

    // Skills across categories
    const skills = [
      // Frontend
      { id: 'html', name: 'HTML5', category: 'frontend' },
      { id: 'css', name: 'CSS3', category: 'frontend' },
      { id: 'javascript', name: 'JavaScript', category: 'frontend' },
      { id: 'typescript', name: 'TypeScript', category: 'frontend' },
      { id: 'react', name: 'React', category: 'frontend' },
      { id: 'nextjs', name: 'Next.js', category: 'frontend' },
      { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend' },
      { id: 'vue', name: 'Vue.js', category: 'frontend' },
      { id: 'angular', name: 'Angular', category: 'frontend' },
      { id: 'svelte', name: 'Svelte', category: 'frontend' },
      { id: 'd3', name: 'D3.js', category: 'frontend' },
      
      // Backend
      { id: 'nodejs', name: 'Node.js', category: 'backend' },
      { id: 'express', name: 'Express.js', category: 'backend' },
      { id: 'python', name: 'Python', category: 'backend' },
      { id: 'fastapi', name: 'FastAPI', category: 'backend' },
      { id: 'graphql', name: 'GraphQL', category: 'backend' },
      { id: 'rest-api', name: 'REST API', category: 'backend' },
      { id: 'nestjs', name: 'NestJS', category: 'backend' },
      { id: 'websockets', name: 'WebSockets', category: 'backend' },
      
      // Database
      { id: 'sql', name: 'SQL', category: 'database' },
      { id: 'mongodb', name: 'MongoDB', category: 'database' },
      { id: 'neo4j', name: 'Neo4j', category: 'database' },
      { id: 'redis', name: 'Redis', category: 'database' },
      { id: 'postgresql', name: 'PostgreSQL', category: 'database' },
      { id: 'prisma', name: 'Prisma', category: 'database' },
      { id: 'firestore', name: 'Firestore', category: 'database' },
      
      // DevOps
      { id: 'docker', name: 'Docker', category: 'devops' },
      { id: 'kubernetes', name: 'Kubernetes', category: 'devops' },
      { id: 'cicd', name: 'CI/CD', category: 'devops' },
      { id: 'aws', name: 'AWS', category: 'devops' },
      { id: 'gcp', name: 'Google Cloud', category: 'devops' },
      { id: 'terraform', name: 'Terraform', category: 'devops' },
      { id: 'github-actions', name: 'GitHub Actions', category: 'devops' },
      
      // AI/ML
      { id: 'ml-basics', name: 'ML Basics', category: 'ai-ml' },
      { id: 'tensorflow', name: 'TensorFlow', category: 'ai-ml' },
      { id: 'pytorch', name: 'PyTorch', category: 'ai-ml' },
      { id: 'llm', name: 'LLM Integration', category: 'ai-ml' },
      { id: 'langchain', name: 'LangChain', category: 'ai-ml' },
      { id: 'vector-db', name: 'Vector Databases', category: 'ai-ml' },
      
      // Mobile
      { id: 'react-native', name: 'React Native', category: 'mobile' },
      { id: 'flutter', name: 'Flutter', category: 'mobile' },
      { id: 'swift', name: 'Swift', category: 'mobile' },
      { id: 'kotlin', name: 'Kotlin', category: 'mobile' },
      { id: 'expo', name: 'Expo', category: 'mobile' },
      
      // Security
      { id: 'auth', name: 'Authentication', category: 'security' },
      { id: 'oauth', name: 'OAuth 2.0', category: 'security' },
      { id: 'jwt', name: 'JWT', category: 'security' },
      { id: 'encryption', name: 'Encryption', category: 'security' },
      { id: 'owasp', name: 'OWASP Security', category: 'security' },
    ];

    for (const s of skills) {
      await session.run(
        'CREATE (s:Skill {id: $id, name: $name, category: $category})',
        s
      );
    }
    console.log(`Created ${skills.length} skills`);

    // User's learned skills with confidence levels
    const learned = [
      { id: 'html', conf: 95 },
      { id: 'css', conf: 92 },
      { id: 'javascript', conf: 88 },
      { id: 'typescript', conf: 82 },
      { id: 'react', conf: 85 },
      { id: 'nextjs', conf: 78 },
      { id: 'tailwind', conf: 90 },
      { id: 'd3', conf: 72 },
      { id: 'nodejs', conf: 80 },
      { id: 'express', conf: 75 },
      { id: 'python', conf: 70 },
      { id: 'graphql', conf: 65 },
      { id: 'rest-api', conf: 85 },
      { id: 'sql', conf: 88 },
      { id: 'mongodb', conf: 75 },
      { id: 'neo4j', conf: 68 },
      { id: 'postgresql', conf: 82 },
      { id: 'firestore', conf: 70 },
      { id: 'docker', conf: 72 },
      { id: 'cicd', conf: 68 },
      { id: 'aws', conf: 58 },
      { id: 'github-actions', conf: 75 },
      { id: 'ml-basics', conf: 55 },
      { id: 'llm', conf: 62 },
      { id: 'react-native', conf: 45 },
      { id: 'auth', conf: 78 },
      { id: 'oauth', conf: 65 },
      { id: 'jwt', conf: 72 },
    ];

    for (const { id, conf } of learned) {
      await session.run(`
        MATCH (u:User {id: 'user-1'}), (s:Skill {id: $id})
        CREATE (u)-[:LEARNED {confidence: $conf, learnedAt: datetime()}]->(s)
      `, { id, conf });
    }
    console.log(`Created ${learned.length} LEARNED relationships`);

    // Skill prerequisites (learning paths)
    const prereqs = [
      ['html', 'css'], ['css', 'javascript'], ['javascript', 'typescript'],
      ['javascript', 'react'], ['javascript', 'vue'], ['javascript', 'angular'],
      ['javascript', 'svelte'], ['react', 'nextjs'], ['css', 'tailwind'],
      ['javascript', 'd3'], ['javascript', 'nodejs'], ['nodejs', 'express'],
      ['nodejs', 'nestjs'], ['typescript', 'nestjs'], ['python', 'fastapi'],
      ['javascript', 'graphql'], ['nodejs', 'rest-api'], ['nodejs', 'websockets'],
      ['sql', 'postgresql'], ['sql', 'prisma'], ['nodejs', 'prisma'],
      ['nodejs', 'mongodb'], ['graphql', 'neo4j'], ['docker', 'kubernetes'],
      ['docker', 'cicd'], ['cicd', 'github-actions'], ['aws', 'terraform'],
      ['docker', 'aws'], ['docker', 'gcp'], ['python', 'ml-basics'],
      ['ml-basics', 'tensorflow'], ['ml-basics', 'pytorch'], ['python', 'llm'],
      ['llm', 'langchain'], ['llm', 'vector-db'], ['react', 'react-native'],
      ['react-native', 'expo'], ['javascript', 'flutter'], ['auth', 'oauth'],
      ['auth', 'jwt'], ['jwt', 'encryption'], ['auth', 'owasp'],
    ];

    for (const [from, to] of prereqs) {
      await session.run(`
        MATCH (a:Skill {id: $from}), (b:Skill {id: $to})
        CREATE (a)-[:PREREQUISITE_OF]->(b)
      `, { from, to });
    }
    console.log(`Created ${prereqs.length} PREREQUISITE_OF relationships`);

    // Related skills (cross-domain connections)
    const related = [
      ['react', 'typescript'], ['nextjs', 'nodejs'], ['nextjs', 'prisma'],
      ['graphql', 'react'], ['graphql', 'typescript'], ['vue', 'typescript'],
      ['angular', 'typescript'], ['nodejs', 'mongodb'], ['nodejs', 'postgresql'],
      ['express', 'rest-api'], ['nestjs', 'graphql'], ['neo4j', 'graphql'],
      ['fastapi', 'postgresql'], ['prisma', 'postgresql'], ['firestore', 'nextjs'],
      ['aws', 'docker'], ['gcp', 'docker'], ['kubernetes', 'aws'],
      ['terraform', 'kubernetes'], ['github-actions', 'docker'], ['cicd', 'aws'],
      ['ml-basics', 'llm'], ['tensorflow', 'python'], ['pytorch', 'python'],
      ['langchain', 'python'], ['vector-db', 'mongodb'], ['llm', 'nodejs'],
      ['react-native', 'typescript'], ['expo', 'react-native'],
      ['nodejs', 'auth'], ['jwt', 'nodejs'], ['oauth', 'rest-api'],
      ['owasp', 'nodejs'], ['encryption', 'auth'], ['d3', 'react'],
      ['d3', 'typescript'], ['websockets', 'redis'], ['websockets', 'react'],
    ];

    for (const [from, to] of related) {
      await session.run(`
        MATCH (a:Skill {id: $from}), (b:Skill {id: $to})
        CREATE (a)-[:RELATES_TO]->(b)
      `, { from, to });
    }
    console.log(`Created ${related.length} RELATES_TO relationships`);

    // Quick verification
    const counts = await session.run(`
      MATCH (s:Skill) WITH count(s) as skills
      MATCH ()-[l:LEARNED]->() WITH skills, count(l) as learned
      MATCH ()-[p:PREREQUISITE_OF]->() WITH skills, learned, count(p) as prereqs
      MATCH ()-[r:RELATES_TO]->() 
      RETURN skills, learned, prereqs, count(r) as related
    `);
    const r = counts.records[0];
    console.log(`\nDone! ${r.get('skills')} skills, ${r.get('learned')} learned, ${r.get('prereqs')} prereqs, ${r.get('related')} related`);

  } catch (err) {
    console.error('Error:', err);
    throw err;
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
