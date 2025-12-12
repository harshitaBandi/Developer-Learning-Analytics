'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Sparkles, Github, ExternalLink, Menu, X,
  Rocket, Brain, Target, TrendingUp,
} from 'lucide-react';
import { KnowledgeGraph, SkillConfidenceRadar, LVICard, LVITrend } from '@/components/widgets';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-800/50 bg-surface-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-purple-400 rounded-full" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text-animated">VibecoderZ</h1>
              <p className="text-xs text-surface-500 -mt-0.5">Developer Upskilling</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#dashboard" className="flex items-center gap-2 text-sm text-surface-300 hover:text-white transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-surface-300 hover:text-white transition-colors">
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a href="#" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
              <ExternalLink className="w-4 h-4" />
              Deploy
            </a>
          </nav>

          <button className="md:hidden p-2 rounded-lg hover:bg-surface-800 text-surface-300" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden py-4 border-t border-surface-800">
            <nav className="flex flex-col gap-2">
              <a href="#dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white">
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}

function HeroSection() {
  const features = [
    { icon: Brain, label: 'Knowledge Graph', color: 'brand' },
    { icon: Target, label: 'Skill Confidence', color: 'emerald' },
    { icon: TrendingUp, label: 'LVI Tracking', color: 'purple' },
  ];

  return (
    <section className="relative py-12 md:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
            <Rocket className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-brand-300">Gradientflo Assessment</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Developer </span>
            <span className="gradient-text-animated">Learning Analytics</span>
          </h1>
          
          <p className="text-lg md:text-xl text-surface-400 max-w-2xl mx-auto mb-8 text-balance">
            Track your learning velocity, visualize skill relationships, and accelerate your journey with data-driven insights.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {features.map((f, i) => (
              <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/50 border border-surface-700/50">
                <f.icon className={`w-4 h-4 text-${f.color}-400`} />
                <span className="text-sm text-surface-300">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section id="dashboard" className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
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
    </section>
  );
}

function TechStackSection() {
  const tech = [
    { name: 'Next.js', cat: 'Frontend' },
    { name: 'TypeScript', cat: 'Language' },
    { name: 'Neo4j', cat: 'Graph DB' },
    { name: 'Firestore', cat: 'Document DB' },
    { name: 'D3.js', cat: 'Visualization' },
    { name: 'Recharts', cat: 'Charts' },
    { name: 'Tailwind CSS', cat: 'Styling' },
    { name: 'Framer Motion', cat: 'Animation' },
  ];

  return (
    <section className="py-12 md:py-16 border-t border-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="text-xl font-semibold text-surface-300 mb-2">Tech Stack</h2>
          <p className="text-surface-500 text-sm">Built with modern technologies</p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4">
          {tech.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group relative px-4 py-2 rounded-xl bg-surface-900/50 border border-surface-800 hover:border-brand-500/50 transition-colors">
              <span className="text-sm font-medium text-surface-300 group-hover:text-white transition-colors">{t.name}</span>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t.cat}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 border-t border-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <span className="text-surface-400 text-sm">VibecoderZ © {new Date().getFullYear()}</span>
          </div>
          <p className="text-surface-500 text-sm text-center">Built for the Gradientflo Full-Stack Assessment</p>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-surface-400 hover:text-white transition-colors">
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-950 bg-noise">
      <Header />
      <main>
        <HeroSection />
        <DashboardSection />
        <TechStackSection />
      </main>
      <Footer />
    </div>
  );
}
