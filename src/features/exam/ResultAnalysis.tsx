
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from './store';
import { Trophy, Target, Download, RefreshCw, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../../shared/ui/Card';
import { cn } from '../../shared/lib/utils';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '../../shared/ui/Button';
import { PDFGenerator } from '../../shared/lib/pdf-generator';

export function ResultAnalysis() {
    const { questions, answers, status } = useExamStore();
    const navigate = useNavigate();


    useEffect(() => {
        if (status === 'EXAM') navigate('/exam');
        if (status === 'IDLE') navigate('/');
    }, [status, navigate]);

    const handleDownload = () => {
        const generator = new PDFGenerator();
        generator.generate(questions, "Exam Results");
    }

    const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    const skippedCount = questions.length - Object.keys(answers).length;
    const wrongCount = questions.length - correctCount - skippedCount;
    const score = Math.round((correctCount / questions.length) * 100);

    // Confetti Effect for High Score
    useEffect(() => {
        if (score >= 40) { // Pass mark
            const duration = 2 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: ReturnType<typeof setInterval> = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);

                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [score]);

    const pieData = [
        { name: 'Correct', value: correctCount, color: '#10b981' },
        { name: 'Wrong', value: wrongCount, color: '#ef4444' },
        { name: 'Skipped', value: skippedCount, color: '#94a3b8' }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen text-white py-12 px-4 md:px-8 font-sans">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-12"
            >
                {/* HEADLINE */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                            MISSION REPORT
                        </h1>
                        <p className="text-slate-400 text-lg uppercase tracking-widest font-bold">Protocol Analysis Complete</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={handleDownload} className="hidden md:flex">
                            <Download className="mr-2" size={18} /> Export
                        </Button>

                        {/* Temporal Reset Controls */}
                        <div className="flex gap-2 bg-white/10 p-1 rounded-xl border border-white/5">
                            <Button
                                onClick={() => useExamStore.getState().reattempt('full')}
                                className="bg-white/10 text-white hover:bg-white/20 border-none text-xs"
                                title="Full Re-attempt"
                            >
                                <RefreshCw size={16} className="mr-2" /> Full
                            </Button>
                            <Button
                                onClick={() => useExamStore.getState().reattempt('incorrect')}
                                className="bg-red-500/20 text-red-200 hover:bg-red-500/30 border-none text-xs"
                                title="Re-attempt Incorrect"
                            >
                                <Target size={16} className="mr-2" /> Mistakes
                            </Button>
                            <Button
                                onClick={() => useExamStore.getState().reattempt('unattempted')}
                                className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border-none text-xs"
                                title="Attempt Skipped"
                            >
                                <RefreshCw size={16} className="mr-2" /> Voide
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* BENTO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* 1. HERO SCORE (Large Square) */}
                    <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 row-span-2 super-card relative overflow-hidden group p-8 flex flex-col justify-between min-h-[400px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

                        <div className="flex justify-between items-start z-10">
                            <div>
                                <h2 className="text-indigo-400 font-bold tracking-widest uppercase text-sm mb-1">Overall Performance</h2>
                                <div className="text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                    {score}%
                                </div>
                            </div>
                            <div className={cn(
                                "px-4 py-1 rounded-full text-xs font-bold uppercase border",
                                score >= 40 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}>
                                {score >= 40 ? 'Mission Success' : 'Critical Failure'}
                            </div>
                        </div>

                        <div className="h-48 w-full mt-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pieData} layout="vertical" barSize={32}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={12} width={60} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: '12px' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {pieData.map((e, index) => (
                                            <Cell key={`cell-${index}`} fill={e.color} strokeWidth={0} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* 2. AI INSIGHT (Wide Rect) */}
                    <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 super-card bg-indigo-900/10 border-indigo-500/30 p-8 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-20 text-indigo-500">
                            <Target size={180} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                                <Trophy size={20} />
                            </div>
                            <h3 className="font-bold text-indigo-300 uppercase tracking-wider text-sm">AI Tactical Insight</h3>
                        </div>
                        <p className="text-xl font-medium text-indigo-100 leading-relaxed max-w-lg z-10">
                            {score > 80 ? "Outstanding tactical execution. Your mastery of core concepts is evident." :
                                score > 50 ? "Solid performance, but inconsistencies detected in complex reasoning modules." :
                                    "Tactical realignment required. Focus on foundational protocols immediately."}
                        </p>
                    </motion.div>

                    {/* 3. STAT ORBS ("Pills") */}
                    <motion.div variants={itemVariants} className="super-card p-6 flex flex-col justify-center items-center gap-2">
                        <div className="text-emerald-400 font-black text-4xl">{correctCount}</div>
                        <div className="text-white/40 text-xs font-bold uppercase tracking-widest">Correct</div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="super-card p-6 flex flex-col justify-center items-center gap-2">
                        <div className="text-red-400 font-black text-4xl">{wrongCount}</div>
                        <div className="text-white/40 text-xs font-bold uppercase tracking-widest">Errors</div>
                    </motion.div>
                </div>

                {/* DETAIL LIST */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                        <BarChart3 className="text-indigo-500" />
                        <h3 className="text-2xl font-bold text-white">Detailed Log</h3>
                    </div>

                    <div className="space-y-4">
                        {questions.map((q) => (
                            <Card key={q.id} className="p-0 border-white/5 bg-white/5 group hover:border-indigo-500/30 transition-colors">
                                <div className="p-6 md:p-8">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                answers[q.id] === q.correctAnswer ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
                                                    answers[q.id] !== undefined ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                                                        "bg-slate-700 text-slate-400"
                                            )}>
                                                {q.id}
                                            </div>
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider border border-indigo-500/20 px-2 py-1 rounded-full bg-indigo-500/10">
                                                {q.topic || 'General'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-lg font-medium text-slate-200 mb-6 font-sans">
                                        {q.question}
                                    </div>

                                    {/* Reveal Answer */}
                                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                        <div className="flex flex-col md:flex-row gap-4 text-sm">
                                            <div className="flex-1">
                                                <span className="text-emerald-500 font-bold block mb-1 uppercase text-xs">Correct Answer</span>
                                                <span className="text-white">{q.options[q.correctAnswer]}</span>
                                            </div>
                                            {answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer && (
                                                <div className="flex-1">
                                                    <span className="text-red-500 font-bold block mb-1 uppercase text-xs">Your Input</span>
                                                    <span className="text-slate-300">{q.options[answers[q.id]]}</span>
                                                </div>
                                            )}
                                        </div>
                                        {q.explanation && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <span className="text-indigo-400 font-bold block mb-1 uppercase text-xs">Explanation</span>
                                                <p className="text-slate-400 leading-relaxed">{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
