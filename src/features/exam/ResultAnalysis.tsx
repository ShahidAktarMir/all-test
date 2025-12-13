import { useState, useEffect } from 'react';
import { useExamStore } from './store';
import { Trophy, Target, Target as TargetIcon, Check, X, Minus, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../../shared/ui/Card';
import { QuestionCard } from '../../entities/question/QuestionCard';
import { cn } from '../../shared/lib/utils';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export function ResultAnalysis() {
    const { questions, answers } = useExamStore();
    const [filter, setFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'SKIPPED'>('ALL');

    const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    const skippedCount = questions.length - Object.keys(answers).length;
    const wrongCount = questions.length - correctCount - skippedCount;
    const score = Math.round((correctCount / questions.length) * 100);

    // Confetti Effect for High Score
    useEffect(() => {
        if (score >= 40) { // Pass mark
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [score]);

    const pieData = [
        { name: 'Correct', value: correctCount, color: '#10b981' },
        { name: 'Wrong', value: wrongCount, color: '#ef4444' },
        { name: 'Skipped', value: skippedCount, color: '#94a3b8' }
    ];

    const filteredQuestions = questions.filter(q => {
        if (filter === 'CORRECT') return answers[q.id] === q.correctAnswer;
        if (filter === 'WRONG') return answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer;
        if (filter === 'SKIPPED') return answers[q.id] === undefined;
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center md:text-left gap-6"
            >
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">Assessment Report</h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base">Detailed performance analysis and review.</p>
                </div>
                <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 min-w-[160px]">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                        className="text-4xl md:text-5xl font-black text-indigo-600"
                    >
                        {score}%
                    </motion.div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Score</span>
                </div>
            </motion.div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                {/* Main Card */}
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="p-8 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-indigo-200 min-h-[250px]">
                        <Trophy size={56} className="text-yellow-300 mb-4 drop-shadow-md md:w-16 md:h-16" />
                        <div className="text-6xl md:text-7xl font-black mb-2 tracking-tighter">{correctCount}</div>
                        <div className="text-indigo-200 font-bold uppercase tracking-widest text-xs">Total Marks</div>
                    </Card>
                </motion.div>

                {/* Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                    <Card className="p-8 flex flex-col justify-center min-h-[250px]">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><TargetIcon className="text-indigo-500" size={20} /> Accuracy</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {pieData.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                                    </Pie>
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </motion.div>

                {/* Detailed Counts */}
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-4 md:col-span-2 lg:col-span-1">
                    <Card className="p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Check size={18} /></div>
                            <span className="font-bold text-slate-700 text-sm md:text-base">Correct Answers</span>
                        </div>
                        <span className="text-xl md:text-2xl font-black text-emerald-600">{correctCount}</span>
                    </Card>
                    <Card className="p-5 flex items-center justify-between border-l-4 border-l-red-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg text-red-600"><X size={18} /></div>
                            <span className="font-bold text-slate-700 text-sm md:text-base">Wrong Answers</span>
                        </div>
                        <span className="text-xl md:text-2xl font-black text-red-600">{wrongCount}</span>
                    </Card>
                    <Card className="p-5 flex items-center justify-between border-l-4 border-l-slate-400">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Minus size={18} /></div>
                            <span className="font-bold text-slate-700 text-sm md:text-base">Skipped</span>
                        </div>
                        <span className="text-xl md:text-2xl font-black text-slate-500">{skippedCount}</span>
                    </Card>
                </motion.div>
            </div>

            {/* Question Review Section */}
            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3"
            >
                <Target className="text-indigo-600" /> Question Breakdown
            </motion.h2>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            >
                {['ALL', 'CORRECT', 'WRONG', 'SKIPPED'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={cn(
                            "px-5 py-2 md:px-6 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all whitespace-nowrap",
                            filter === f
                                ? "bg-slate-900 text-white shadow-lg scale-105"
                                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </motion.div>

            <motion.div layout className="space-y-6">
                {filteredQuestions.map((q, i) => (
                    <motion.div
                        key={q.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }} // Stagger
                    >
                        <Card className="p-6 md:p-8 hover:shadow-md transition-shadow">
                            <QuestionCard
                                question={q}
                                index={q.id - 1}
                                selectedOption={answers[q.id]}
                                showResult={true}
                            />
                        </Card>
                    </motion.div>
                ))}
                {filteredQuestions.length === 0 && (
                    <div className="text-center py-20 text-slate-400">No questions found for this filter.</div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-20 text-center"
            >
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-3 px-10 py-4 md:px-12 md:py-5 bg-indigo-600 result-btn-gradient text-white rounded-3xl font-bold text-lg md:text-xl shadow-2xl hover:scale-105 transition-transform w-full md:w-auto justify-center"
                >
                    <RefreshCw /> Start New Exam
                </button>
                <div className="mt-8 text-slate-400 font-mono text-xs">
                    System Design by Shahid Aktar Mir &copy; 2025
                </div>
            </motion.div>

        </div>
    );
}
