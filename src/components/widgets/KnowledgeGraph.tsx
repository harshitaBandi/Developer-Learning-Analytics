'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, ZoomIn, ZoomOut, Maximize2, Rocket, ArrowRight, CheckCircle2, X, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { Legend, SkillStatusLegend } from '@/components/ui/Legend';
import { KnowledgeGraphData, GraphNode, GraphLink, categoryColors, SkillCategory, SuggestedSkill } from '@/types';

export function KnowledgeGraph({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [graph, setGraph] = useState<KnowledgeGraphData | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/knowledge-graph');
      const data = await res.json();
      if (data.success) setGraph(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDims({ width: width || 800, height: height || 500 });
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !dims.width || !graph) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dims;
    const data: KnowledgeGraphData = JSON.parse(JSON.stringify(graph));

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', e => container.attr('transform', e.transform));

    zoomRef.current = zoom;
    svg.call(zoom);

    const container = svg.append('g');
    const defs = svg.append('defs');
    
    // arrow markers
    defs.append('marker')
      .attr('id', 'arrow-prereq').attr('viewBox', '0 -5 10 10')
      .attr('refX', 20).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('fill', 'rgba(99,102,241,0.6)').attr('d', 'M0,-5L10,0L0,5');

    defs.append('marker')
      .attr('id', 'arrow-relates').attr('viewBox', '0 -5 10 10')
      .attr('refX', 20).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('fill', 'rgba(156,163,175,0.4)').attr('d', 'M0,-5L10,0L0,5');

    const sim = d3.forceSimulation<GraphNode>(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(data.links).id(d => d.id).distance(100).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const links = container.append('g').selectAll('line').data(data.links).enter().append('line')
      .attr('stroke', d => d.type === 'PREREQUISITE_OF' ? 'rgba(99,102,241,0.5)' : 'rgba(156,163,175,0.3)')
      .attr('stroke-width', d => d.type === 'PREREQUISITE_OF' ? 2 : 1)
      .attr('stroke-dasharray', d => d.type === 'RELATES_TO' ? '5,5' : '0')
      .attr('marker-end', d => d.type === 'PREREQUISITE_OF' ? 'url(#arrow-prereq)' : 'url(#arrow-relates)');

    const nodes = container.append('g').selectAll('g').data(data.nodes).enter().append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    // circles sized by confidence, colored by category
    nodes.append('circle')
      .attr('r', d => Math.max(8, d.confidence / 5))
      .attr('fill', d => d.learned ? categoryColors[d.category as SkillCategory] : 'transparent')
      .attr('stroke', d => categoryColors[d.category as SkillCategory])
      .attr('stroke-width', d => d.learned ? 2 : 3)
      .attr('stroke-dasharray', d => d.learned ? '0' : '4,2')
      .attr('opacity', d => d.learned ? 1 : 0.6)
      .on('mouseover', function(_, d) {
        d3.select(this).transition().duration(200).attr('r', Math.max(10, d.confidence / 4));
        setSelected(d);
      })
      .on('mouseout', function(_, d) {
        d3.select(this).transition().duration(200).attr('r', Math.max(8, d.confidence / 5));
      })
      .on('click', (_, d) => setSelected(d));

    // glow for high confidence
    nodes.filter(d => d.learned && d.confidence >= 80).append('circle')
      .attr('r', d => Math.max(8, d.confidence / 5) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => categoryColors[d.category as SkillCategory])
      .attr('stroke-width', 1).attr('opacity', 0.3);

    // labels
    nodes.append('text')
      .text(d => d.name)
      .attr('x', 0).attr('y', d => -Math.max(12, d.confidence / 4) - 4)
      .attr('text-anchor', 'middle').attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', '10px').attr('font-weight', '500')
      .style('pointer-events', 'none');

    sim.on('tick', () => {
      links.attr('x1', d => (d.source as GraphNode).x!).attr('y1', d => (d.source as GraphNode).y!)
           .attr('x2', d => (d.target as GraphNode).x!).attr('y2', d => (d.target as GraphNode).y!);
      nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, [dims, graph]);

  const zoomIn = () => svgRef.current && zoomRef.current && 
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
  const zoomOut = () => svgRef.current && zoomRef.current && 
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
  const reset = () => svgRef.current && zoomRef.current && 
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);

  const cats: SkillCategory[] = ['frontend', 'backend', 'database', 'devops', 'ai-ml', 'mobile', 'security'];

  return (
    <Card className={className} title="Knowledge Graph" subtitle="Interactive skill relationship map" icon={<Network className="w-5 h-5" />} gradient dbSource="neo4j" onRefresh={() => fetchData(true)} isRefreshing={refreshing}>
      {loading && <LoadingOverlay message="Building graph..." />}
      
      <div className="relative">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {/* Suggest Next Steps Button */}
          {graph?.suggestedNextSkills && graph.suggestedNextSkills.length > 0 && (
            <button 
              onClick={() => setShowSuggestionsModal(true)} 
              title="Suggest Next Steps"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-all"
            >
              <Rocket className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Next Steps</span>
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/30 text-[10px] font-bold">
                {graph.suggestedNextSkills.length}
              </span>
            </button>
          )}
          
          {[{ fn: zoomIn, Icon: ZoomIn, tip: 'Zoom In' }, { fn: zoomOut, Icon: ZoomOut, tip: 'Zoom Out' }, { fn: reset, Icon: Maximize2, tip: 'Reset' }].map(b => (
            <button key={b.tip} onClick={b.fn} title={b.tip} className="p-2 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors">
              <b.Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div ref={containerRef} className="w-full h-[520px] rounded-xl overflow-hidden bg-surface-950/50">
          <svg ref={svgRef} width="100%" height="100%" className="select-none" />
        </div>

        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-surface-800/90 backdrop-blur-sm border border-surface-700/50">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: categoryColors[selected.category as SkillCategory] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white">{selected.name}</h4>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${selected.learned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-600/50 text-surface-400'}`}>
                    {selected.learned ? 'Learned' : 'Next Step'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm">
                  <span className="text-surface-400">Confidence: <span className="text-white font-medium">{selected.confidence}%</span></span>
                  <span className="text-surface-400">Category: <span className="text-white font-medium capitalize">{selected.category.replace('-', '/')}</span></span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-white">×</button>
            </div>
          </motion.div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <Legend categories={cats} />
          <SkillStatusLegend />
        </div>

        {/* Suggestions Modal */}
        <AnimatePresence>
          {showSuggestionsModal && graph?.suggestedNextSkills && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowSuggestionsModal(false)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-surface-900 border border-surface-700/50 shadow-2xl"
              >
                {/* Header */}
                <div className="relative px-6 py-5 border-b border-surface-700/50 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Suggested Next Steps</h3>
                      <p className="text-sm text-surface-400">Skills you&apos;re ready to learn based on your progress</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuggestionsModal(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-4 space-y-3">
                  {graph.suggestedNextSkills.map((skill, index) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="group relative p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-surface-600 hover:bg-surface-800 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div 
                          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${categoryColors[skill.category as SkillCategory]}20` }}
                        >
                          <span 
                            className="text-xl font-bold"
                            style={{ color: categoryColors[skill.category as SkillCategory] }}
                          >
                            {skill.name.charAt(0)}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{skill.name}</h4>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-surface-700/50 text-surface-400 capitalize">
                              {skill.category.replace('-', '/')}
                            </span>
                          </div>

                          {/* Prerequisites */}
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <span className="text-xs text-surface-500">You know:</span>
                            {skill.prerequisites.map((prereq, i) => (
                              <span 
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {prereq}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Readiness */}
                        <div className="flex-shrink-0 text-right">
                          <div className={`text-2xl font-bold ${
                            skill.readinessScore >= 75 ? 'text-emerald-400' : 
                            skill.readinessScore >= 50 ? 'text-amber-400' : 'text-surface-400'
                          }`}>
                            {skill.readinessScore}%
                          </div>
                          <div className="text-xs text-surface-500">ready</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-1 bg-surface-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: skill.readinessScore >= 75 
                              ? 'linear-gradient(90deg, #10B981, #34D399)'
                              : skill.readinessScore >= 50
                              ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                              : 'linear-gradient(90deg, #6B7280, #9CA3AF)'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.readinessScore}%` }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                        />
                      </div>

                      {/* Hover arrow */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-brand-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-surface-700/50 bg-surface-900/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-surface-500 text-sm">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Recommendations based on your learning path</span>
                    </div>
                    <button
                      onClick={() => setShowSuggestionsModal(false)}
                      className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
