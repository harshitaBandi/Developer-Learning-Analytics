// trend analysis for LVI snapshots
export function determineTrend(snapshots: { score: number }[]) {
  if (snapshots.length < 2) return { trend: 'stable' as const, percentChange: 0 };
  
  const mid = Math.floor(snapshots.length / 2);
  const avgFirst = snapshots.slice(0, mid).reduce((s, x) => s + x.score, 0) / mid;
  const avgSecond = snapshots.slice(mid).reduce((s, x) => s + x.score, 0) / (snapshots.length - mid);
  
  const change = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
  
  const trend = change > 5 ? 'accelerating' : change < -5 ? 'decelerating' : 'stable';
  return { trend: trend as 'accelerating' | 'stable' | 'decelerating', percentChange: change };
}
