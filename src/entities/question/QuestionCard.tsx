import { memo } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../shared/ui/Card';
import { cn } from '../../shared/lib/utils';
import type { Question } from '../../features/exam/store';

interface QuestionCardProps {
    question: Question;
    selectedOption?: number;
    onSelectOption?: (index: number) => void;
    showResult?: boolean;
    className?: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const QuestionCard = memo(function QuestionCard({
    question,
    selectedOption,
    onSelectOption,
    showResult = false,
    className
}: QuestionCardProps) {

    return (
        <div className={cn("scale-100 animate-in fade-in zoom-in-95 duration-300", className)}>
            <Card className="p-6 sm:p-8 md:p-12 min-h-[40vh] sm:min-h-[50vh] flex flex-col justify-center">

                {/* Question Header */}
                <div className="mb-8 md:mb-12">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {/* Premium Topic Tag */}
                        <span className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.1)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                            {question.topic || "General"}
                        </span>
                        {question.source && (
                            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                                {question.source.type} {question.source.year}
                            </span>
                        )}
                    </div>
                    {/* Question Text */}
                    <div className="font-semibold text-white leading-relaxed font-sans tracking-tight text-xl sm:text-2xl md:text-[var(--font-h3)]">
                        {question.question}
                    </div>
                </div>

                {/* Options */}
                <motion.div
                    className="space-y-3 sm:space-y-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.08 }
                        }
                    }}
                >
                    {question.options.map((opt, i) => {
                        const isSelected = selectedOption === i;
                        const hasSelection = selectedOption !== undefined;
                        const isCorrect = showResult && i === question.correctAnswer;
                        const isWrong = showResult && isSelected && !isCorrect;

                        return (
                            <motion.div
                                key={`${question.id}-${i}`}
                                variants={{
                                    hidden: { opacity: 0, y: 16 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                animate={isWrong ? {
                                    x: [0, -8, 8, -6, 6, -4, 0],
                                    transition: { duration: 0.4, ease: "easeInOut" }
                                } : {}}
                                onClick={() => !showResult && onSelectOption?.(i)}
                                className={cn(
                                    "group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden transform-gpu",

                                    // Default: glass hover
                                    !hasSelection && !showResult && "bg-white/[0.02] border-white/[0.06] backdrop-blur-md hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(99,102,241,0.15)]",

                                    // Dimmed: unselected after picking
                                    hasSelection && !isSelected && !showResult && "opacity-30 scale-[0.98] grayscale border-transparent bg-transparent pointer-events-none",

                                    // Selected
                                    isSelected && !showResult && "bg-indigo-500/10 border-indigo-500/70 shadow-[0_0_30px_-10px_rgba(99,102,241,0.5),_inset_0_1px_rgba(255,255,255,0.15)] scale-[1.01]",

                                    // Result: Correct
                                    showResult && isCorrect && "bg-emerald-500/10 border-emerald-500/70 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] scale-[1.01] z-10",

                                    // Result: Wrong
                                    showResult && isWrong && "bg-red-500/10 border-red-500/70 shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] z-10",

                                    // Result: Other
                                    showResult && !isCorrect && !isWrong && "opacity-20 scale-95 grayscale pointer-events-none border-transparent"
                                )}
                            >
                                {/* Pulsing ring for correct answer reveal */}
                                {showResult && isCorrect && (
                                    <motion.div
                                        className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-emerald-400 pointer-events-none"
                                        animate={{ opacity: [0.8, 0.2, 0.8], scale: [1, 1.01, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}

                                {/* LETTER BADGE — A, B, C, D */}
                                <div className={cn(
                                    "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm transition-all duration-300 border",
                                    !isSelected && !showResult && "bg-white/5 border-white/10 text-slate-400 group-hover:border-indigo-500/40 group-hover:text-white group-hover:bg-indigo-500/10",
                                    isSelected && !showResult && "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]",
                                    showResult && isCorrect && "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.6)]",
                                    showResult && isWrong && "bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)]",
                                    showResult && !isCorrect && !isWrong && "bg-white/5 border-white/5 text-slate-600"
                                )}>
                                    {showResult && isCorrect ? <Check size={16} strokeWidth={3} /> :
                                        showResult && isWrong ? <X size={16} strokeWidth={3} /> :
                                            OPTION_LETTERS[i]}
                                </div>

                                {/* Option Text */}
                                <div className={cn(
                                    "text-base sm:text-lg flex-1 font-medium transition-colors leading-snug",
                                    isSelected && !showResult ? "text-white" :
                                        showResult && isCorrect ? "text-emerald-300 font-semibold" :
                                            showResult && isWrong ? "text-red-300" :
                                                "text-slate-400 group-hover:text-slate-200"
                                )}>
                                    {opt}
                                </div>

                                {/* Selection pulse overlay */}
                                {isSelected && !showResult && (
                                    <motion.div
                                        className="absolute inset-0 rounded-2xl bg-indigo-500/5 pointer-events-none"
                                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </Card>

            {/* Explanation Card */}
            <AnimatePresence>
                {showResult && question.explanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6"
                    >
                        <Card className="bg-indigo-950/30 border-indigo-500/30 shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)]">
                            <div className="p-5 sm:p-6 flex gap-4">
                                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 h-fit shrink-0 shadow-[inset_0_1px_rgba(255,255,255,0.1)]">
                                    <Sparkles size={18} />
                                </div>
                                <div className="text-slate-300">
                                    <h4 className="font-bold text-indigo-300 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        Explanation
                                    </h4>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
                                        {question.explanation}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
