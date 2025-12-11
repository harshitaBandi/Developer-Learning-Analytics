import { NextResponse } from 'next/server';
import { LVIData, ApiResponse } from '@/types';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const hasFirestore = () => !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID);

function calcLVI(concepts: number, rate: number, time: number, scale = 10) {
  if (time <= 0) return 0;
  return Math.min(Math.max(Math.round((concepts * rate) / time * scale), 0), 100);
}

async function getLVIData(userId: string): Promise<LVIData> {
  const db = getAdminFirestore();
  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [sessions, apps] = await Promise.all([
    db.collection('sessions')
      .where('userId', '==', userId)
      .where('startTime', '>=', Timestamp.fromDate(weekStart))
      .where('startTime', '<=', Timestamp.fromDate(weekEnd))
      .get(),
    db.collection('skill_applications')
      .where('userId', '==', userId)
      .where('appliedAt', '>=', Timestamp.fromDate(weekStart))
      .where('appliedAt', '<=', Timestamp.fromDate(weekEnd))
      .get()
  ]);

  const concepts = new Set<string>();
  let totalDuration = 0;
  sessions.docs.forEach(doc => {
    const d = doc.data();
    d.conceptsLearned?.forEach((c: string) => concepts.add(c));
    totalDuration += d.duration || 0;
  });

  let rateSum = 0;
  apps.docs.forEach(doc => rateSum += doc.data().successRate || 0);
  const rate = apps.size > 0 ? rateSum / apps.size : 0;

  const count = concepts.size;
  const avgTime = count > 0 ? (totalDuration / 60 / 24) / count : 1;

  return {
    score: calcLVI(count, rate, avgTime),
    conceptsMastered: count,
    applicationRate: rate,
    avgTimeToMastery: Math.max(avgTime, 0.1),
    scalingFactor: 10,
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
  };
}

export async function GET(): Promise<NextResponse<ApiResponse<LVIData>>> {
  if (!hasFirestore()) {
    return NextResponse.json({ data: null as any, error: 'Firestore not configured', success: false }, { status: 500 });
  }

  try {
    const data = await getLVIData('user-1');
    return NextResponse.json({ data, error: null, success: true });
  } catch (err) {
    console.error('LVI fetch failed:', err);
    return NextResponse.json({
      data: null as any,
      error: err instanceof Error ? err.message : 'Failed',
      success: false,
    }, { status: 500 });
  }
}
