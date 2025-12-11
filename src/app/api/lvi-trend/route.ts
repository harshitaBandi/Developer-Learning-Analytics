import { NextResponse } from 'next/server';
import { LVITrendData, LVISnapshot, ApiResponse } from '@/types';
import { determineTrend } from '@/lib/firebase';
import { getAdminFirestore } from '@/lib/firebase-admin';

const hasFirestore = () => !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID);

async function getSnapshots(userId: string): Promise<LVISnapshot[]> {
  const db = getAdminFirestore();

  const snap = await db.collection('lvi_snapshots')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(12)
    .get();

  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      weekNumber: d.weekNumber,
      year: d.year,
      score: d.score,
      conceptsMastered: d.conceptsMastered,
      applicationRate: d.applicationRate,
      avgTimeToMastery: d.avgTimeToMastery,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }).reverse();
}

export async function GET(): Promise<NextResponse<ApiResponse<LVITrendData>>> {
  if (!hasFirestore()) {
    return NextResponse.json({ data: null as any, error: 'Firestore not configured', success: false }, { status: 500 });
  }

  try {
    const snapshots = await getSnapshots('user-1');
    const { trend, percentChange } = determineTrend(snapshots);
    return NextResponse.json({ data: { snapshots, trend, percentChange }, error: null, success: true });
  } catch (err) {
    console.error('LVI trend failed:', err);
    return NextResponse.json({
      data: null as any,
      error: err instanceof Error ? err.message : 'Failed',
      success: false,
    }, { status: 500 });
  }
}
