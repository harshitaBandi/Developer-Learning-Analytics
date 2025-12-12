'use client';

import { clsx } from 'clsx';
import { categoryColors, categoryLabels, SkillCategory } from '@/types';

interface LegendProps {
  categories: SkillCategory[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Legend({
  categories,
  className,
  orientation = 'horizontal',
}: LegendProps) {
  return (
    <div
      className={clsx(
        'flex gap-3',
        orientation === 'vertical' ? 'flex-col' : 'flex-wrap',
        className
      )}
    >
      {categories.map((category) => (
        <div key={category} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryColors[category] }}
          />
          <span className="text-xs text-surface-400">
            {categoryLabels[category]}
          </span>
        </div>
      ))}
    </div>
  );
}

interface RelationshipLegendProps {
  className?: string;
}

export function RelationshipLegend({ className }: RelationshipLegendProps) {
  return (
    <div className={clsx('flex gap-4', className)}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-0.5 bg-surface-500" />
        <span className="text-xs text-surface-400">Prerequisite</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-0.5 bg-surface-500 border-dashed border-t-2 border-surface-500 h-0" 
             style={{ borderStyle: 'dashed' }} />
        <span className="text-xs text-surface-400">Related</span>
      </div>
    </div>
  );
}

interface SkillStatusLegendProps {
  className?: string;
}

export function SkillStatusLegend({ className }: SkillStatusLegendProps) {
  return (
    <div className={clsx('flex gap-4', className)}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="text-xs text-surface-400">Learned</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border-2 border-surface-500 bg-transparent" />
        <span className="text-xs text-surface-400">Not Learned</span>
      </div>
    </div>
  );
}

