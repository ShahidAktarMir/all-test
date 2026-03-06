import { memo } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../../shared/ui/Card';
import { cn } from '../../shared/lib/utils';
import type { Question } from '../../features/exam/store';

interface QuestionCardProps {
    question: Question;
    selectedOption?: number; // Index 0-3
    onSelectOption?: (index: number) => void;
    showResult?: boolean; // If true, shows correct/incorrect state
    className?: string;
}

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
                <div className="mb-8 md:mb-12">
                    <div className="flex flex-wrap items-center gap-3 mb-6 opacity-60">
                        <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-500/20">
                            {question.topic || "General"}
                        </span>
                        {question.source && (
                            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                                {question.source.type} {question.source.year}
                            </span>
                        )}
                    </div>
                    {/* Focus Rule: The Question is the brightest object */}
                    <div className="font-medium text-white leading-relaxed font-sans tracking-tight text-xl sm:text-2xl md:text-[var(--font-h3)]">
                        {question.question}
                    </div>
                </div>

                <motion.div
                    className="space-y-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.1 }
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
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                onClick={() => !showResult && onSelectOption?.(i)}
                                className={cn(
                                    "group relative flex items-center gap-3 sm:gap-4 md:gap-5 p-4 sm:p-5 rounded-[1rem] sm:rounded-2xl border transition-all duration-500 ease-spring cursor-pointer overflow-hidden transform-gpu",

                                    // Default Interaction Rule: Dim glass, lift on hover, liquid gradient border
                                    !hasSelection && !showResult && "bg-white/[0.02] border-white/5 backdrop-blur-md hover:border-transparent hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.15)]",

                                    // **COGNITIVE FOCUS: Dim & Blur Unselected Items**
                                    hasSelection && !isSelected && !showResult && "opacity-30 scale-[0.98] blur-[2px] grayscale border-transparent bg-transparent pointer-events-none hover:blur-none hover:opacity-100 hover:grayscale-0 transition-all duration-700",

                                    // Selected Rule: Hyper-focused, illuminated
                                    isSelected && !showResult && "bg-indigo-500/10 border-indigo-500/80 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5),_inset_0_1px_rgba(255,255,255,0.2)] scale-[1.02]",

                                    // Result States (Kept highly visible)
                                    showResult && isCorrect && "bg-emerald-500/10 border-emerald-500/80 text-emerald-400 shadow-[0_0_40px_-5px_rgba(16,185,129,0.5)] scale-[1.02] z-10",
                                    showResult && isWrong && "bg-red-500/10 border-red-500/80 text-red-400 shadow-[0_0_40px_-5px_rgba(239,68,68,0.5)] scale-[1.02] z-10",
                                    showResult && !isCorrect && !isWrong && "opacity-20 scale-95 blur-[3px] grayscale pointer-events-none"
                                )}
                            >
                                {/* Liquid Hover Gradient Border (Only shows on default hover) */}
                                {!hasSelection && !showResult && (
                                    <div className="absolute inset-0 rounded-[1rem] sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[1px] bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-indigo-500/50 [-webkit-mask-image:linear-gradient(#fff_0_0)] [-webkit-mask-composite:destination-out] mask-composite-exclude pointer-events-none" />
                                )}
                                <div className={cn(
                                    "h-8 w-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-300",
                                    isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-600 group-hover:border-white/50 text-slate-500",
                                    showResult && isCorrect && "border-emerald-500 bg-emerald-500 text-black",
                                    showResult && isWrong && "border-red-500 bg-red-500 text-white"
                                )}>
                                    {showResult && isCorrect ? <Check size={16} /> :
                                        showResult && isWrong ? <X size={16} /> :
                                            <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>}
                                </div>

                                <div className={cn(
                                    "text-base sm:text-lg md:text-xl flex-1 font-medium transition-colors",
                                    isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                )}>
                                    {opt}
                                </div>

                                {/* Selection Indicator Glow */}
                                {isSelected && !showResult && (
                                    <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 animate-pulse pointer-events-none" />
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </Card>

            {showResult && (
                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Explanation Cards use 'Super-Card' logic via Card component now */}
                    {question.explanation && (
                        <Card className="bg-indigo-950/30 border-indigo-500/30">
                            <div className="p-6 flex gap-4">
                                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 h-fit">
                                    <Sparkles size={20} />
                                </div>
                                <div className="text-slate-300">
                                    <h4 className="font-bold text-indigo-300 text-sm uppercase tracking-wider mb-2">Explanation</h4>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {question.explanation}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
});
