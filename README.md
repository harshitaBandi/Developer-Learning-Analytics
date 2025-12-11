# VibecoderZ

A developer learning analytics dashboard built for the Gradientflo Full-Stack Assessment.

## What It Does

Four widgets that track a developer's learning progress:

1. **Knowledge Graph** - Interactive D3 force-directed graph showing skills and their relationships (prerequisites, related skills). Click nodes to see details.

2. **Skill Confidence Index** - Radar chart of top 6 skills with confidence percentages. Shows average and highlights strongest skill.

3. **LVI Score** - Learning Velocity Index calculated as `(Concepts × Application Rate) / Avg Time to Mastery × 10`. Displayed as a rainbow progress ring.

4. **LVI Trend** - 12-week line chart showing learning performance over time. Indicates if progress is accelerating, stable, or slowing down.

## Tech Used

- Next.js 14 with App Router
- TypeScript
- Neo4j (graph database for skills/relationships)
- Firebase Firestore (document database for sessions/metrics)
- D3.js for the knowledge graph
- Recharts for radar and line charts
- Tailwind CSS + Framer Motion

## Setup

```bash
git clone <repo>
cd neu4g
npm install
```

Create `.env.local`:

```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=yourpassword

NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Or drop your `serviceAccountKey.json` from Firebase Console into the project root.

Seed the databases:

```bash
npm run seed:neo4j
npm run seed:firestore
```

Run:

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
  app/
    api/
      knowledge-graph/   → Neo4j query for skills graph
      skill-confidence/  → Neo4j query for top skills
      lvi/              → Firestore query for current LVI
      lvi-trend/        → Firestore query for historical LVI
    page.tsx            → Main dashboard
    globals.css         → Custom styles
  components/
    ui/                 → Card, Legend, LoadingSpinner
    widgets/            → KnowledgeGraph, SkillConfidenceRadar, LVICard, LVITrend
  lib/
    firebase-admin.ts   → Firestore connection
    firebase.ts         → Trend calculation helper
  types/
    index.ts            → TypeScript interfaces
scripts/
  seed-neo4j.ts         → Populates Neo4j with skills data
  seed-firestore.ts     → Populates Firestore with session data
```

## API Endpoints

| Route | Method | Returns |
|-------|--------|---------|
| /api/knowledge-graph | GET | Skills, relationships, suggested next skills |
| /api/skill-confidence | GET | Top 6 skills with confidence scores |
| /api/lvi | GET | Current week LVI score and breakdown |
| /api/lvi-trend | GET | 12 weeks of LVI history |

## Database Schema

**Neo4j:**
- `(:User)` - the learner
- `(:Skill)` - skills with id, name, category
- `[:LEARNED]` - user learned skill with confidence score
- `[:PREREQUISITE_OF]` - skill A required before skill B
- `[:RELATES_TO]` - skills are related

**Firestore:**
- `sessions` - learning sessions with duration, concepts learned
- `skill_applications` - when skills were applied in projects
- `lvi_snapshots` - weekly LVI scores

## Notes

The seed scripts are one-time setup tools. All runtime data comes from the databases - no hardcoded data in the app code.

The LVI formula: `LVI = (Concepts Mastered × Application Rate) / Avg Time to Mastery × Scaling Factor`

Built for Gradientflo Assessment.
