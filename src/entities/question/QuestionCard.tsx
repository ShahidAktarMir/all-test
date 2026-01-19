import { memo } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
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
            <Card className="p-8 md:p-12 min-h-[50vh] flex flex-col justify-center">
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
                    <div className="font-medium text-white leading-relaxed font-sans tracking-tight" style={{ fontSize: 'var(--font-h3)' }}>
                        {question.question}
                    </div>
                </div>

                <div className="space-y-4">
                    {question.options.map((opt, i) => {
                        const isSelected = selectedOption === i;
                        const isCorrect = showResult && i === question.correctAnswer;
                        const isWrong = showResult && isSelected && i !== question.correctAnswer;

                        return (
                            <div
                                key={i}
                                onClick={() => !showResult && onSelectOption?.(i)}
                                className={cn(
                                    "group relative flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 cursor-pointer interact-smooth",
                                    // Default Interaction Rule: Dim grey, lift on hover
                                    !isSelected && !showResult && "border-white/5 bg-[#18181b] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]",
                                    // Selected Rule: Tinted Blue/Gold
                                    isSelected && !showResult && "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)]",
                                    // Result States
                                    showResult && isCorrect && "bg-emerald-500/10 border-emerald-500 text-emerald-400",
                                    showResult && isWrong && "bg-red-500/10 border-red-500 text-red-400",
                                    showResult && !isCorrect && !isWrong && "opacity-40 grayscale"
                                )}
                            >
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
                                    "text-lg md:text-xl flex-1 font-medium transition-colors",
                                    isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                )}>
                                    {opt}
                                </div>

                                {/* Selection Indicator Glow */}
                                {isSelected && !showResult && (
                                    <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 animate-pulse pointer-events-none" />
                                )}
                            </div>
                        );
                    })}
                </div>
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
