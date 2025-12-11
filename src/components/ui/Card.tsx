'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Database, Flame, RefreshCw } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  gradient?: boolean;
  animate?: boolean;
  dbSource?: 'neo4j' | 'firestore';
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function DbBadge({ type }: { type: 'neo4j' | 'firestore' }) {
  const config = {
    neo4j: { label: 'Neo4j', icon: Database, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    firestore: { label: 'Firestore', icon: Flame, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  }[type];
  
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <config.icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  subtitle,
  icon,
  gradient = false,
  animate = true,
  dbSource,
  onRefresh,
  isRefreshing,
}: CardProps) {
  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut' },
      }
    : {};

  return (
    <Wrapper
      className={clsx(
        'relative overflow-hidden rounded-2xl flex flex-col',
        'bg-surface-900/80 backdrop-blur-xl',
        'border border-surface-700/50',
        'shadow-2xl shadow-black/20',
        gradient && 'bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900',
        className
      )}
      {...wrapperProps}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Card Header */}
      {(title || subtitle || icon) && (
        <div className="relative px-6 pt-6 pb-4 border-b border-surface-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-sm text-surface-400 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
              {dbSource && <DbBadge type={dbSource} />}
            </div>
          </div>
        </div>
      )}
      
      {/* Card Content */}
      <div className="relative p-6 flex-1">{children}</div>
    </Wrapper>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-surface-900/80 backdrop-blur-xl',
        'border border-surface-700/50',
        'animate-pulse',
        className
      )}
    >
      <div className="p-6">
        <div className="h-4 bg-surface-700 rounded w-1/3 mb-4" />
        <div className="h-32 bg-surface-800 rounded" />
      </div>
    </div>
  );
}
