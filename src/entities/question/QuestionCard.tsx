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
    index: number;
}

export function QuestionCard({
    question,
    selectedOption,
    onSelectOption,
    showResult = false,
    className,
    index
}: QuestionCardProps) {

    return (
        <div className={cn("w-full max-w-5xl mx-auto", className)}>
            <div className="mb-6 text-xl font-medium text-slate-900 leading-relaxed font-sans">
                <span className="font-bold text-slate-400 mr-2 text-sm select-none">Q.{question.id} (Ref: {index + 1})</span>
                <br />
                {question.question}
            </div>

            <div className="space-y-3">
                {question.options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const isCorrect = showResult && i === question.correctAnswer;
                    const isWrong = showResult && isSelected && i !== question.correctAnswer;

                    let stateStyles = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
                    if (isSelected) stateStyles = "border-indigo-600 bg-indigo-50 shadow-sm ring-1 ring-indigo-600";

                    // Result Overrides
                    if (showResult) {
                        if (isCorrect) stateStyles = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 text-emerald-800";
                        else if (isWrong) stateStyles = "border-red-500 bg-red-50 ring-1 ring-red-500 text-red-800";
                        else stateStyles = "border-slate-100 opacity-60"; // Dim others
                    }

                    return (
                        <div
                            key={i}
                            onClick={() => !showResult && onSelectOption?.(i)}
                            className={cn(
                                "group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                                stateStyles,
                                showResult && "cursor-default"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                isSelected ? "border-indigo-600" : "border-slate-300 group-hover:border-indigo-400",
                                showResult && isCorrect && "border-emerald-600 bg-emerald-600 text-white",
                                showResult && isWrong && "border-red-600 bg-red-600 text-white"
                            )}>
                                {showResult && isCorrect && <Check size={14} />}
                                {showResult && isWrong && <X size={14} />}
                                {!showResult && isSelected && <div className="h-3 w-3 bg-indigo-600 rounded-full" />}
                            </div>

                            <div className="text-base flex-1">
                                <span className="font-bold mr-3 opacity-50 font-mono text-sm">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showResult && question.explanation && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="bg-indigo-50/50 border-indigo-100 overflow-hidden">
                        <div className="p-4 flex gap-4">
                            <div className="bg-white p-2 rounded-lg shadow-sm h-fit text-indigo-500">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm uppercase tracking-wider mb-2">Explanation</h4>
                                <p className="text-indigo-800 text-sm leading-relaxed">{question.explanation}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
