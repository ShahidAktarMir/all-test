
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from './store';
import { Trophy, Target, Check, X, Minus, RefreshCw, UploadCloud, BarChart3, Download, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../../shared/ui/Card';
import { QuestionCard } from '../../entities/question/QuestionCard';
import { cn } from '../../shared/lib/utils';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '../../shared/ui/Button';
import { PDFGenerator } from '../../shared/lib/pdf-generator';



export function ResultAnalysis() {
    const { questions, answers, restartExam, resetExam, status } = useExamStore();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'SKIPPED' | 'MENU'>('ALL');

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

    const filteredQuestions = questions.filter(q => {
        if (filter === 'CORRECT') return answers[q.id] === q.correctAnswer;
        if (filter === 'WRONG') return answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer;
        if (filter === 'SKIPPED') return answers[q.id] === undefined;
        return true;
    });

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
        <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8 font-sans">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-12"
            >

                {/* HEADER SECTION */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                            Result <span className="text-indigo-600">Analysis</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium">Here's how you performed on this assessment.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={handleDownload}
                            className="bg-white text-slate-800 hover:bg-slate-50 border-slate-200 shadow-sm font-bold text-xs"
                        >
                            <Download className="mr-2 h-4 w-4" /> Download Report
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={resetExam}
                            className="bg-white text-slate-600 hover:bg-slate-100 border-slate-200 shadow-sm"
                        >
                            <UploadCloud className="mr-2 h-5 w-5" /> Upload New
                        </Button>
                        {/* RE-ATTEMPT DROPDOWN */}
                        <div className="relative z-50">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => setFilter(filter === 'MENU' ? 'ALL' : 'MENU')} // Using filter state hack or new state? Better to use new state.
                                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 pr-3"
                            >
                                <RefreshCw className="mr-2 h-5 w-5" /> Re-Attempt <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                            </Button>

                            {/* DROPDOWN MENU */}
                            {filter === 'MENU' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-2"
                                >
                                    <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Select Mode</div>

                                    <button
                                        onClick={() => restartExam('ALL')}
                                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold transition-all flex items-center mb-1"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3">
                                            <RefreshCw size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm">Full Re-Attempt</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Reset everything</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => restartExam('WRONG')}
                                        disabled={wrongCount === 0}
                                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold transition-all flex items-center mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mr-3">
                                            <X size={16} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <div className="text-sm">Mistakes Only</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{wrongCount} questions</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => restartExam('SKIPPED')}
                                        disabled={skippedCount === 0}
                                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center mr-3">
                                            <Minus size={16} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <div className="text-sm">Skipped Only</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{skippedCount} questions</div>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* KEY STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* SCORE CARD (MAIN) */}
                    <div className="md:col-span-4 lg:col-span-3">
                        <motion.div
                            variants={itemVariants}
                            className="h-full bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Trophy size={180} />
                            </div>

                            <div>
                                <h2 className="text-indigo-200 font-bold tracking-widest text-xs uppercase mb-1">Total Score</h2>
                                <div className="text-7xl font-black tracking-tighter mb-4">{score}%</div>
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold">
                                    {score >= 40 ? 'Passed 🎉' : 'Needs Improvement 🎯'}
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
                                <div>
                                    <div className="text-indigo-200 text-xs font-bold uppercase">Questions</div>
                                    <div className="text-2xl font-bold">{questions.length}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-indigo-200 text-xs font-bold uppercase">Attempts</div>
                                    <div className="text-2xl font-bold">{questions.length - skippedCount}</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* PIE CHART & DETAILS */}
                    <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CHART */}
                        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
                            <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2 w-full">
                                <BarChart3 size={20} className="text-indigo-500" /> Accuracy Breakdown
                            </h3>
                            <div className="w-full h-56">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            cornerRadius={8}
                                        >
                                            {pieData.map((e) => <Cell key={e.name} fill={e.color} strokeWidth={0} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* DETAILED STATS */}
                        <div className="space-y-6">
                            <motion.div variants={itemVariants} className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                        <Check size={24} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className="text-slate-900 font-bold text-lg">Correct</div>
                                        <div className="text-emerald-600 text-sm font-medium">Keep it up!</div>
                                    </div>
                                </div>
                                <span className="text-3xl font-black text-emerald-600">{correctCount}</span>
                            </motion.div>

                            <motion.div variants={itemVariants} className="bg-red-50/50 rounded-3xl p-6 border border-red-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                                        <X size={24} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className="text-slate-900 font-bold text-lg">Incorrect</div>
                                        <div className="text-red-600 text-sm font-medium">Review these.</div>
                                    </div>
                                </div>
                                <span className="text-3xl font-black text-red-600">{wrongCount}</span>
                            </motion.div>

                            <motion.div variants={itemVariants} className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center">
                                        <Minus size={24} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className="text-slate-900 font-bold text-lg">Skipped</div>
                                        <div className="text-slate-500 text-sm font-medium">Not attempted.</div>
                                    </div>
                                </div>
                                <span className="text-3xl font-black text-slate-500">{skippedCount}</span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* QUESTION REVIEW */}
                <motion.div variants={itemVariants}>
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Target className="text-indigo-600" /> Detailed Review
                            </h2>
                            <p className="text-slate-500 mt-1">Analyze standard answers and explanations.</p>
                        </div>

                        <div className="flex p-1 bg-slate-100 rounded-full">
                            {['ALL', 'CORRECT', 'WRONG', 'SKIPPED'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as 'ALL' | 'CORRECT' | 'WRONG' | 'SKIPPED' | 'MENU')}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-bold transition-all",
                                        filter === f
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TOPIC ANALYSIS CHART - NEW */}
                    {Object.values(questions).some(q => q.topic) && (
                        <motion.div variants={itemVariants} className="col-span-1 md:col-span-3 mb-8">
                            <Card className="p-6 border-slate-200">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                        <BarChart3 size={20} />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Topic Performance</h3>
                                </div>

                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={(() => {
                                                const topics: Record<string, { total: number, correct: number }> = {};
                                                questions.forEach(q => {
                                                    const t = q.topic || 'Uncategorized';
                                                    if (!topics[t]) topics[t] = { total: 0, correct: 0 };
                                                    topics[t].total++;
                                                    if (answers[q.id] === q.correctAnswer) topics[t].correct++;
                                                });
                                                return Object.entries(topics).map(([name, stats]) => ({
                                                    name,
                                                    score: Math.round((stats.correct / stats.total) * 100),
                                                    count: stats.total
                                                })).sort((a, b) => b.score - a.score);
                                            })()}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="score" name="Score %" radius={[6, 6, 0, 0]}>
                                                {(() => {
                                                    const topics: Record<string, { total: number, correct: number }> = {};
                                                    questions.forEach(q => {
                                                        const t = q.topic || 'Uncategorized';
                                                        if (!topics[t]) topics[t] = { total: 0, correct: 0 };
                                                        topics[t].total++;
                                                        if (answers[q.id] === q.correctAnswer) topics[t].correct++;
                                                    });
                                                    const data = Object.entries(topics).map(([name, stats]) => ({
                                                        name,
                                                        score: Math.round((stats.correct / stats.total) * 100),
                                                        count: stats.total
                                                    })).sort((a, b) => b.score - a.score);

                                                    return data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.score >= 40 ? '#10b981' : '#ef4444'} />
                                                    ));
                                                })()}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    <div className="space-y-6">
                        {filteredQuestions.length > 0 ? (
                            filteredQuestions.map((q) => (
                                <Card key={q.id} className="p-6 md:p-8 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group">
                                    <QuestionCard
                                        question={q}
                                        index={q.id - 1}
                                        selectedOption={answers[q.id]}
                                        showResult={true}
                                    />
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 border-dashed animate-in fade-in zoom-in duration-500">
                                <div className="text-slate-300 mb-6 mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                                    <Target size={40} className="opacity-50" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">No Questions Found</h3>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto">
                                    There are no questions matching the
                                    <span className="font-bold text-indigo-500 mx-1">"{filter}"</span>
                                    filter criteria.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center pt-8 text-slate-400 text-sm font-medium">
                    NEURO EXAM &copy; 2025 • High Performance Assessment Engine
                </motion.div>
            </motion.div>
        </div>
    );
}
