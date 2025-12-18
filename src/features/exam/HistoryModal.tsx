import { X, Trash2, Clock, CheckCircle2, History } from 'lucide-react';
import { useExamStore } from './store';
import { Button } from '../../shared/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
// Since date-fns might not be installed, I'll write a simple formatter

export function HistoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { history, clearHistory } = useExamStore();

    const formatDate = (date: number) => {
        return new Date(date).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-all"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="bg-white pointer-events-auto rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-200 overflow-hidden">
                            {/* HEADER */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <History size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Exam History</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{history.length} Attempts recorded</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 flex items-center justify-center transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* SCROLLABLE LIST */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                                {history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
                                        <History size={48} className="mb-4 text-slate-300" />
                                        <p className="text-slate-500 font-medium">No history yet.</p>
                                        <p className="text-xs text-slate-400">Complete an exam to see it here.</p>
                                    </div>
                                ) : (
                                    history.map((attempt) => (
                                        <motion.div
                                            layout
                                            key={attempt.id}
                                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-indigo-200 transition-colors"
                                        >
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm border",
                                                    attempt.score >= 40
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : "bg-red-50 text-red-600 border-red-100"
                                                )}>
                                                    {attempt.score}%
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700 text-sm">
                                                        {attempt.score >= 40 ? "Passed" : "Needs Improvement"}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-medium">
                                                        {formatDate(attempt.date)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                        <CheckCircle2 size={12} /> Correct
                                                    </div>
                                                    <div className="font-bold text-slate-700 leading-none mt-1">
                                                        {attempt.correctCount} <span className="text-xs text-slate-400 font-normal">/ {attempt.totalQuestions}</span>
                                                    </div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                        <Clock size={12} /> Time
                                                    </div>
                                                    <div className="font-bold text-slate-700 leading-none mt-1">
                                                        {formatTime(attempt.timeSpent)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ACTIONS */}
                                            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        useExamStore.getState().loadHistoryReview(attempt.id);
                                                        onClose();
                                                    }}
                                                    className="h-8 w-8 p-0 rounded-full border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    title="Review Result"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        useExamStore.getState().reattemptHistory(attempt.id);
                                                        onClose();
                                                    }}
                                                    className="h-8 w-8 p-0 rounded-full border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    title="Re-Attempt"
                                                >
                                                    <History size={16} className="rotate-180" /> {/* Flip for re-play vibe */}
                                                </Button>
                                            </div>

                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* FOOTER */}
                            {history.length > 0 && (
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearHistory}
                                        className="w-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Clear History
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}
