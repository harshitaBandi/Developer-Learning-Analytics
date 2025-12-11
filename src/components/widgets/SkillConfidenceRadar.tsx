'use client';

import { useState, useEffect } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { RadarDataPoint } from '@/types';

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-lg bg-surface-800/95 backdrop-blur-sm border border-surface-700/50 shadow-xl">
      <p className="text-white font-medium">{d.skill}</p>
      <p className="text-brand-400 text-sm">
        Confidence: <span className="font-semibold">{d.confidence}%</span>
      </p>
    </div>
  );
};

export function SkillConfidenceRadar({ className }: { className?: string }) {
  const [data, setData] = useState<RadarDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/skill-confidence');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setKey(k => k + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const avg = data.length ? Math.round(data.reduce((s, d) => s + d.confidence, 0) / data.length) : 0;
  const top = data.length ? data.reduce((m, d) => d.confidence > m.confidence ? d : m, data[0]) : null;

  return (
    <Card
      className={className}
      title="Skill Confidence Index"
      subtitle="Top 6 skills mastery level"
      icon={<Target className="w-5 h-5" />}
      gradient
      dbSource="neo4j"
      onRefresh={() => fetchData(true)}
      isRefreshing={refreshing}
    >
      {loading && <LoadingOverlay message="Loading skills..." />}

      <div className="relative">
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart key={key} cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="skill"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickCount={5}
                axisLine={false}
              />
              <Radar
                name="Confidence"
                dataKey="confidence"
                stroke="url(#radarStroke)"
                fill="url(#radarFill)"
                strokeWidth={2}
                animationDuration={1500}
              />
              <Tooltip content={<ChartTooltip />} />
              <defs>
                <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/30"
          >
            <div className="flex items-center gap-2 text-surface-400 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>Average Confidence</span>
            </div>
            <p className="text-2xl font-bold text-white">{avg}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/30"
          >
            <div className="flex items-center gap-2 text-surface-400 text-xs mb-1">
              <Target className="w-3 h-3" />
              <span>Top Skill</span>
            </div>
            <p className="text-lg font-bold text-white truncate">{top?.skill || '-'}</p>
            <p className="text-xs text-brand-400">{top?.confidence || 0}%</p>
          </motion.div>
        </div>

        <div className="mt-4 space-y-2">
          {data.map((skill, i) => (
            <motion.div
              key={skill.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center gap-3"
            >
              <div className="w-24 text-xs text-surface-400 truncate">{skill.skill}</div>
              <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.confidence}%` }}
                  transition={{ duration: 1, delay: 0.2 * i }}
                />
              </div>
              <div className="w-10 text-right text-xs font-medium text-white">{skill.confidence}%</div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
