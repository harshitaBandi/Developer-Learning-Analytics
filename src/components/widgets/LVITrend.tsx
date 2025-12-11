'use client';

import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, ComposedChart, Line,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { LVITrendData, LVISnapshot } from '@/types';

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="px-4 py-3 rounded-xl bg-surface-800/95 backdrop-blur-sm border border-surface-700/50 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3 h-3 text-surface-400" />
        <span className="text-surface-400 text-xs">Week {d.weekNumber}</span>
      </div>
      <p className="text-white font-bold text-xl">{d.score}</p>
      <p className="text-brand-400 text-xs">LVI Score</p>
    </div>
  );
};

function TrendBadge({ trend, change }: { trend: 'accelerating' | 'stable' | 'decelerating'; change: number }) {
  const cfg = {
    accelerating: { Icon: TrendingUp, color: 'emerald', label: 'Accelerating' },
    stable: { Icon: Minus, color: 'amber', label: 'Stable' },
    decelerating: { Icon: TrendingDown, color: 'red', label: 'Decelerating' },
  }[trend];
  
  const pos = change >= 0;
  
  return (
    <div className={`px-4 py-3 rounded-xl bg-${cfg.color}-500/10 border border-${cfg.color}-500/20`}>
      <div className="flex items-center gap-2">
        <cfg.Icon className={`w-5 h-5 text-${cfg.color}-400`} />
        <span className={`font-semibold text-${cfg.color}-400`}>{cfg.label}</span>
      </div>
      <div className="mt-1 flex items-center gap-1">
        {pos ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
        <span className={`text-sm ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
          {pos ? '+' : ''}{change.toFixed(1)}%
        </span>
        <span className="text-xs text-surface-500">vs. previous period</span>
      </div>
    </div>
  );
}

export function LVITrend({ className }: { className?: string }) {
  const [data, setData] = useState<LVITrendData | null>(null);
  const [chart, setChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/lvi-trend');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setChart(result.data.snapshots.map((s: LVISnapshot) => ({
          week: `W${s.weekNumber}`,
          weekNumber: s.weekNumber,
          score: s.score,
          year: s.year,
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const scores = data?.snapshots.map(s => s.score) || [];
  const stats = {
    current: scores[scores.length - 1] || 0,
    highest: Math.max(...scores, 0),
    lowest: Math.min(...scores, 0),
    average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
  };

  return (
    <Card
      className={className}
      title="LVI Trend"
      subtitle="12-week learning performance"
      icon={<TrendingUp className="w-5 h-5" />}
      gradient
      dbSource="firestore"
      onRefresh={() => fetchData(true)}
      isRefreshing={refreshing}
    >
      {loading && <LoadingOverlay message="Loading trend data..." />}

      {data && (
        <div className="relative">
          <div className="mb-4">
            <TrendBadge trend={data.trend} change={data.percentChange} />
          </div>

          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis domain={[50, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} tickCount={6} />
                <Tooltip content={<ChartTooltip />} />
                
                <ReferenceLine y={stats.average} stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" 
                  label={{ value: `Avg: ${stats.average}`, position: 'right', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                
                <Area type="monotone" dataKey="score" fill="url(#areaGrad)" stroke="none" />
                <Line
                  type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={3}
                  dot={{ fill: '#8B5CF6', stroke: '#1E1E2E', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#EC4899', stroke: '#1E1E2E', strokeWidth: 2, r: 6 }}
                  animationDuration={1500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Current', value: stats.current, color: 'text-brand-400' },
              { label: 'Highest', value: stats.highest, color: 'text-emerald-400' },
              { label: 'Lowest', value: stats.lowest, color: 'text-amber-400' },
              { label: 'Average', value: stats.average, color: 'text-purple-400' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="text-center p-2 rounded-lg bg-surface-800/30"
              >
                <p className="text-xs text-surface-500 mb-0.5">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-xs text-center text-surface-500"
          >
            Showing weeks {data.snapshots[0]?.weekNumber} - {data.snapshots[data.snapshots.length - 1]?.weekNumber} of {data.snapshots[0]?.year}
          </motion.div>
        </div>
      )}
    </Card>
  );
}
