// Firestore seed script - run once with: npm run seed:firestore

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

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

// Init Firebase Admin
try {
  const sa = require(path.join(process.cwd(), 'serviceAccountKey.json')) as ServiceAccount;
  initializeApp({ credential: cert(sa) });
} catch {
  initializeApp();
}

const db = getFirestore();

function weeksAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d;
}

function getWeekNum(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

async function seed() {
  console.log('Seeding Firestore...\n');
  const userId = 'user-1';

  // Clear existing
  for (const col of ['sessions', 'skill_applications', 'lvi_snapshots']) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  const skillIds = ['react', 'typescript', 'nextjs', 'nodejs', 'graphql', 'tailwind', 'd3', 'postgresql', 'docker', 'jwt'];
  const concepts = ['React Hooks Deep Dive', 'State Management with Zustand', 'API Routes Design', 'Query Optimization', 'Docker Compose Setup'];
  const types = ['tutorial', 'project', 'practice', 'review', 'debugging'];
  const durations = [270, 280, 260, 250, 270, 280, 260, 250, 270, 280, 260, 250, 270, 280];

  // Sessions - 14 this week
  for (let i = 0; i < 14; i++) {
    const dayOffset = Math.floor(i / 2);
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + dayOffset);
    start.setHours(9 + (i % 2) * 5);
    
    const dur = durations[i];
    const end = new Date(start.getTime() + dur * 60000);
    const practiced = skillIds.slice(0, Math.floor(Math.random() * 3) + 1);
    
    await db.collection('sessions').add({
      userId,
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      duration: dur,
      sessionType: types[i % types.length],
      skillsPracticed: practiced,
      conceptsLearned: [concepts[Math.floor(i / 3) % concepts.length]],
      completionRate: 0.7 + Math.random() * 0.3,
      createdAt: Timestamp.fromDate(start)
    });
  }
  console.log('Created 14 sessions');

  // Skill applications - 20 this week
  const projects = [
    { id: 'dash', name: 'Analytics Dashboard' },
    { id: 'shop', name: 'E-Commerce Store' },
    { id: 'bot', name: 'AI Chatbot' },
    { id: 'api', name: 'REST API Service' },
    { id: 'auth', name: 'Auth System' },
  ];
  const contexts = ['Feature implementation', 'Bug fix', 'Refactoring', 'Performance tuning', 'Testing'];
  const rates = [0.85, 0.75, 0.82, 0.70, 0.85, 0.76, 0.84, 0.72, 0.80, 0.86,
                 0.74, 0.82, 0.70, 0.85, 0.76, 0.84, 0.72, 0.80, 0.86, 0.74];

  for (let i = 0; i < 20; i++) {
    const dayOffset = Math.floor(i / 3);
    const applied = new Date();
    applied.setDate(applied.getDate() - applied.getDay() + dayOffset);
    applied.setHours(9 + (i % 3) * 4);

    const proj = projects[i % projects.length];
    await db.collection('skill_applications').add({
      userId,
      skillId: skillIds[i % skillIds.length],
      appliedAt: Timestamp.fromDate(applied),
      projectId: proj.id,
      projectName: proj.name,
      context: contexts[i % contexts.length],
      successRate: rates[i],
      timeSpent: 30 + Math.floor(Math.random() * 150),
      complexity: ['low', 'medium', 'high'][i % 3],
      createdAt: Timestamp.fromDate(applied)
    });
  }
  console.log('Created 20 skill applications');

  // LVI snapshots - 12 weeks of history showing progression
  const history = [
    { w: 11, score: 52, concepts: 4, rate: 0.48, time: 7.5 },
    { w: 10, score: 55, concepts: 5, rate: 0.51, time: 7.0 },
    { w: 9, score: 54, concepts: 5, rate: 0.50, time: 7.2 },
    { w: 8, score: 59, concepts: 6, rate: 0.55, time: 6.5 },
    { w: 7, score: 64, concepts: 7, rate: 0.60, time: 6.0 },
    { w: 6, score: 61, concepts: 7, rate: 0.58, time: 6.2 },
    { w: 5, score: 68, concepts: 8, rate: 0.64, time: 5.5 },
    { w: 4, score: 72, concepts: 9, rate: 0.68, time: 5.0 },
    { w: 3, score: 75, concepts: 9, rate: 0.71, time: 4.8 },
    { w: 2, score: 78, concepts: 10, rate: 0.73, time: 4.5 },
    { w: 1, score: 79, concepts: 10, rate: 0.74, time: 4.4 },
    { w: 0, score: 81, concepts: 11, rate: 0.75, time: 4.2 },
  ];

  for (const h of history) {
    const date = weeksAgo(h.w);
    await db.collection('lvi_snapshots').add({
      userId,
      weekNumber: getWeekNum(date),
      year: date.getFullYear(),
      score: h.score,
      conceptsMastered: h.concepts,
      applicationRate: h.rate,
      avgTimeToMastery: h.time,
      scalingFactor: 10,
      createdAt: Timestamp.fromDate(date)
    });
  }
  console.log('Created 12 LVI snapshots');

  // Verify
  const [sess, apps, snaps] = await Promise.all([
    db.collection('sessions').count().get(),
    db.collection('skill_applications').count().get(),
    db.collection('lvi_snapshots').count().get()
  ]);
  console.log(`\nDone! ${sess.data().count} sessions, ${apps.data().count} applications, ${snaps.data().count} snapshots`);
}

seed();
