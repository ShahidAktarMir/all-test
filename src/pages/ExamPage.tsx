import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';
import { QuestionCard } from '../entities/question/QuestionCard';
import { QuestionPalette } from '../features/exam/QuestionPalette';
import { ExamTimer } from '../features/exam/ExamTimer';
import { Bookmark, Eraser, ChevronLeft, Pause, PlayCircle, Loader2 } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { cn } from '../shared/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export function ExamPage() {
    const navigate = useNavigate();
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    const questions = useExamStore(state => state.questions);
    const currentIndex = useExamStore(state => state.currentIndex);
    const answers = useExamStore(state => state.answers);
    const marked = useExamStore(state => state.marked);
    const isPaused = useExamStore(state => state.isPaused);
    const status = useExamStore(state => state.status);

    const answerQuestion = useExamStore(state => state.answerQuestion);
    const nextQuestion = useExamStore(state => state.nextQuestion);
    const prevQuestion = useExamStore(state => state.prevQuestion);
    const toggleMark = useExamStore(state => state.toggleMark);
    const clearResponse = useExamStore(state => state.clearResponse);
    const togglePause = useExamStore(state => state.togglePause);
    const finishExam = useExamStore(state => state.finishExam);

    useEffect(() => {
        if (status === 'RESULT') navigate('/result');
        if (questions.length === 0) navigate('/');
    }, [status, questions, navigate]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextQuestion();
            else if (e.key === 'ArrowLeft') prevQuestion();
            else if (e.key === 'm' || e.key === 'M') {
                if (questions[currentIndex]) toggleMark(questions[currentIndex].id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextQuestion, prevQuestion, currentIndex, questions, toggleMark]);

    const currentQ = questions[currentIndex];
    if (!currentQ) return null;

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-deep)] overflow-hidden font-sans select-none relative text-white transition-colors duration-700">

            {/* AMBIENT NOISE & LIGHTING (Zero-Gravity Atmosphere) */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* PAUSE OVERLAY (Holographic Stasis) */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="super-card p-12 text-center max-w-md w-full bg-[#0a0a0a]/80 border-indigo-500/20 shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                            <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(99,102,241,0.2)] border border-indigo-500/20">
                                <Pause size={32} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">SYSTEM PAUSED</h2>
                            <p className="text-slate-400 mb-8 font-medium tracking-wide text-sm">Temporal Stasis Field Active</p>
                            <Button size="lg" onClick={togglePause} className="w-full gap-2 relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <PlayCircle size={20} /> Resume Protocol
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HUD HEADER (Liquid Glass) */}
            <header className="h-16 md:h-20 px-4 md:px-8 fixed top-0 left-0 right-0 z-20 flex items-center justify-between backdrop-blur-xl bg-black/10 border-b border-white/5 shadow-2xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all active:scale-95 group"
                        title="Abort Mission"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase leading-none mb-1">Sector 7</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            <span className="font-bold text-slate-200 tracking-wider text-xs">LIVE FEED</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    <ExamTimer />
                    <button
                        className="md:hidden flex flex-col gap-1.5 p-2"
                        onClick={() => setIsPaletteOpen(true)}
                    >
                        <span className="w-6 h-0.5 bg-white/50 rounded-full" />
                        <span className="w-4 h-0.5 bg-white/50 rounded-full ml-auto" />
                        <span className="w-5 h-0.5 bg-white/50 rounded-full ml-auto" />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT (Deep Field) */}
            <div className="flex-1 flex overflow-hidden relative pt-16 md:pt-20">
                <main className="flex-1 flex flex-col relative w-full max-w-7xl mx-auto h-full">

                    {/* QUANTUM PROGRESS (Energy Pulse) */}
                    <div className="px-6 md:px-12 pt-6 md:pt-8 pb-2 flex flex-col gap-2 z-10 shrink-0">
                        <div className="flex justify-between items-end text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
                            <span className="text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                Sector {String(currentIndex + 1).padStart(2, '0')} <span className="text-slate-700 mx-2">|</span> {questions.length}
                            </span>
                            <span className="flex items-center gap-2 text-slate-500">
                                <Loader2 size={12} className={cn("animate-spin", answers[currentQ.id] !== undefined ? "text-emerald-500" : "text-slate-800")} />
                                {answers[currentQ.id] !== undefined ? "DATA LOCKED" : "AWAITING INPUT"}
                            </span>
                        </div>
                        <div className="h-0.5 md:h-1 bg-white/5 rounded-full overflow-hidden relative">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                transition={{ type: "spring", stiffness: 40, damping: 15 }}
                            />
                        </div>
                    </div>

                    {/* QUESTION VIEWPORT (Zero-Gravity) - Fixed Layout for Controls */}
                    <div className="flex-1 relative overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-40 md:pb-32 scroll-smooth custom-scrollbar flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentQ.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.99, filter: "blur(4px)" }}
                                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -20, scale: 0.99, filter: "blur(4px)" }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full max-w-5xl my-auto py-8 min-h-min"
                                >
                                    <QuestionCard
                                        question={currentQ}
                                        selectedOption={answers[currentQ.id]}
                                        onSelectOption={(opt) => answerQuestion(currentQ.id, opt)}
                                        className="w-full shadow-2xl"
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* TACTILE CONTROL DECK - Fixed Bottom Logic */}
                        <footer className="fixed bottom-0 left-0 right-0 z-50">
                            {/* Glass Panel */}
                            <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl border-t border-white/10" />

                            {/* The Dock */}
                            <div className="relative px-4 py-3 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">

                                {/* Left Group: Tools */}
                                <div className="hidden md:flex gap-3 w-auto bg-white/5 p-1 rounded-xl border border-white/5">
                                    <Button
                                        variant="ghost"
                                        onClick={() => toggleMark(currentQ.id)}
                                        className={cn(
                                            "gap-2 h-9 rounded-lg transition-all",
                                            marked[currentQ.id] ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <Bookmark size={16} className={cn(marked[currentQ.id] && "fill-current")} />
                                        <span className="text-xs font-bold uppercase tracking-wider">{marked[currentQ.id] ? "Marked" : "Mark"}</span>
                                    </Button>

                                    <Button variant="ghost" onClick={() => clearResponse(currentQ.id)} className="w-9 h-9 p-0 text-slate-500 hover:text-white rounded-lg">
                                        <Eraser size={16} />
                                    </Button>
                                </div>

                                {/* Mobile Tools (Compact) */}
                                <div className="absolute top-[-3rem] left-4 flex gap-2 md:hidden">
                                    <button
                                        onClick={() => toggleMark(currentQ.id)}
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-colors",
                                            marked[currentQ.id] ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-black/40 border-white/10 text-slate-400"
                                        )}
                                    >
                                        <Bookmark size={18} className={cn(marked[currentQ.id] && "fill-current")} />
                                    </button>
                                </div>

                                {/* Center Group: Navigation */}
                                <div className="flex gap-3 w-full md:w-auto items-center justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={prevQuestion}
                                        disabled={currentIndex === 0}
                                        className="w-16 md:w-24 h-12 border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl"
                                    >
                                        <ChevronLeft size={24} />
                                    </Button>

                                    <Button
                                        onClick={nextQuestion}
                                        className="flex-1 md:w-64 h-12 bg-white text-black hover:bg-indigo-50 hover:scale-[1.02] active:scale-95 transition-all rounded-2xl font-black tracking-widest text-sm uppercase shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                    >
                                        Next
                                    </Button>
                                </div>

                                {/* Right Group: Submit */}
                                <div className="hidden md:block">
                                    <Button
                                        variant="danger"
                                        onClick={finishExam}
                                        className="px-6 h-10 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold tracking-wider text-xs uppercase rounded-xl"
                                    >
                                        Finish
                                    </Button>
                                </div>

                                {/* Mobile Submit (Floating) */}
                                <button
                                    onClick={finishExam}
                                    className="md:hidden absolute top-[-3.5rem] right-4 px-5 py-2.5 bg-red-500 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg shadow-red-500/20 active:scale-95 transition-transform border border-white/10 backdrop-blur-md"
                                >
                                    Submit
                                </button>
                            </div>
                        </footer>
                    </div>
                </main>

                {/* SIDEBAR (Responsive Drawer) */}
                <AnimatePresence>
                    {isPaletteOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm"
                                onClick={() => setIsPaletteOpen(false)}
                            />
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 right-0 z-[70] h-full shadow-2xl"
                            >
                                <QuestionPalette
                                    isOpen={true} // Controlled by presence
                                    onClose={() => setIsPaletteOpen(false)}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Desktop Persistent Palette - Integrated into the Deep Field */}
                <div className="hidden xl:block w-80 relative z-30 border-l border-white/5 bg-black/10 backdrop-blur-xl shrink-0">
                    <QuestionPalette className="h-full bg-transparent" />
                </div>
            </div>
        </div>
    );
}
