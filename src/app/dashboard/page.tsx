'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Github, ExternalLink } from 'lucide-react';
import { KnowledgeGraph, SkillConfidenceRadar, LVICard, LVITrend } from '@/components/widgets';

function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-800/50 bg-surface-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Back</span>
            </Link>
            <div className="h-6 w-px bg-surface-700" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-7 h-7 text-purple-500" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-400 rounded-full" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text-animated">Analytics Dashboard</h1>
                <p className="text-xs text-surface-500 -mt-0.5">Real-time learning metrics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://github.com/harshitaBandi/Developer-Learning-Analytics" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-all">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
              <ExternalLink className="w-4 h-4" />
              Deploy
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-surface-950 bg-noise">
      <DashboardHeader />
      
      <main className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-surface-400">Four critical widgets powered by Neo4j and Firestore</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
              <KnowledgeGraph className="h-full" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
              <SkillConfidenceRadar className="h-full" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="h-full">
              <LVICard className="h-full" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="h-full">
              <LVITrend className="h-full" />
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-surface-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-surface-500 text-sm text-center">Built for the Gradientflo Full-Stack Assessment</p>
        </div>
      </footer>
    </div>
  );
}


