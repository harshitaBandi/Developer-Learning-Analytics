'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, BookOpen, Rocket, Clock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { LVIData } from '@/types';

function ProgressRing({ value, size = 200, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: 'conic-gradient(from 180deg, #3B82F6, #8B5CF6, #EC4899, #F59E0B, #10B981, #3B82F6)' }}
      />
      
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <defs>
          <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="20%" stopColor="#8B5CF6" />
            <stop offset="40%" stopColor="#EC4899" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke="url(#rainbow)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          filter="url(#glow)"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-center"
        >
          <span className="text-5xl font-bold text-white">{value}</span>
          <p className="text-surface-400 text-sm mt-1">LVI Score</p>
        </motion.div>
      </div>
      
      <motion.div
        className="absolute top-4 right-8"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
      </motion.div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, unit, color, delay = 0 }: { 
  icon: any; label: string; value: string | number; unit?: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/30"
    >
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-surface-400 truncate">{label}</p>
        <p className="text-white font-semibold">
          {value}{unit && <span className="text-surface-400 font-normal text-xs ml-1">{unit}</span>}
        </p>
      </div>
    </motion.div>
  );
}

export function LVICard({ className }: { className?: string }) {
  const [data, setData] = useState<LVIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/lvi');
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatRange = (s: string, e: string) => {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(s)} - ${fmt(e)}`;
  };

  return (
    <Card
      className={className}
      title="Learning Velocity Index"
      subtitle={data ? formatRange(data.weekStart, data.weekEnd) : 'Current Week'}
      icon={<Zap className="w-5 h-5" />}
      gradient
      dbSource="firestore"
      onRefresh={() => fetchData(true)}
      isRefreshing={refreshing}
    >
      {loading && <LoadingOverlay message="Calculating LVI..." />}

      {data && (
        <div className="relative">
          <div className="flex justify-center mb-6">
            <ProgressRing value={data.score} />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center mb-6"
          >
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
              <span className="text-sm font-medium text-emerald-400">🚀 Excellent Progress</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <Metric icon={BookOpen} label="Concepts Mastered" value={data.conceptsMastered} color="#3B82F6" delay={0.2} />
            <Metric icon={Rocket} label="Application Rate" value={Math.round(data.applicationRate * 100)} unit="%" color="#10B981" delay={0.3} />
            <Metric icon={Clock} label="Avg. Mastery Time" value={data.avgTimeToMastery.toFixed(1)} unit="days" color="#F59E0B" delay={0.4} />
            <Metric icon={Sparkles} label="Scaling Factor" value={`${data.scalingFactor}x`} color="#EC4899" delay={0.5} />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 p-3 rounded-lg bg-surface-800/30 border border-surface-700/20"
          >
            <p className="text-xs text-surface-500 text-center font-mono">
              LVI = (Concepts × AppRate) / AvgTime × Scale
            </p>
          </motion.div>
        </div>
      )}
    </Card>
  );
}
