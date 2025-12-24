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
    index: number;
}

export const QuestionCard = memo(function QuestionCard({
    question,
    selectedOption,
    onSelectOption,
    showResult = false,
    className,
    index
}: QuestionCardProps) {

    return (
        <div className={cn("w-full max-w-4xl mx-auto transition-all duration-300", className)}>
            <div className="mb-4 md:mb-8 transition-all">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-bold text-slate-400 text-[10px] md:text-xs select-none uppercase tracking-wider">Q.{question.id} (Ref: {index + 1})</span>
                    {question.topic && (
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-indigo-100/50">
                            {question.topic}
                        </span>
                    )}
                    {question.source && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-100/50 flex items-center gap-1">
                                <span className="opacity-70">{question.source.type}:</span> {question.source.text}
                            </span>
                            {question.source.year && (
                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-100/50">
                                    {question.source.year}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {/* Fluid Typography: Scales with screen size */}
                <div className="text-lg md:text-xl lg:text-2xl font-medium text-slate-900 leading-relaxed font-sans whitespace-pre-wrap">
                    {question.question}
                </div>
            </div>

            <div className="space-y-3 md:space-y-4">
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
                                "group relative flex items-start gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.99] touch-manipulation", // Added touch-manipulation and active scale
                                stateStyles,
                                showResult && "cursor-default active:scale-100"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 h-6 w-6 md:h-7 md:w-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                                isSelected ? "border-indigo-600" : "border-slate-300 group-hover:border-indigo-400",
                                showResult && isCorrect && "border-emerald-600 bg-emerald-600 text-white",
                                showResult && isWrong && "border-red-600 bg-red-600 text-white"
                            )}>
                                {showResult && isCorrect && <Check size={16} />}
                                {showResult && isWrong && <X size={16} />}
                                {!showResult && isSelected && <div className="h-3 w-3 md:h-3.5 md:w-3.5 bg-indigo-600 rounded-full" />}
                            </div>

                            <div className="text-base md:text-lg flex-1 leading-relaxed">
                                <span className="font-bold mr-3 opacity-50 font-mono text-xs md:text-sm">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showResult && (
                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

                    {/* Godfather Insight */}
                    {question.godfatherInsight && (
                        <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                            <div className="flex gap-3">
                                <div className="mt-1 bg-amber-100 p-2 rounded-lg text-amber-600 h-fit">
                                    <Sparkles size={18} fill="currentColor" className="opacity-80" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                                        Godfather Insight
                                    </h4>
                                    <p className="text-amber-800 text-sm leading-relaxed font-medium">
                                        {question.godfatherInsight}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Heatmap & Source Stats */}
                    {(question.heatmap || question.source) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {question.heatmap && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex flex-wrap gap-3 items-center">
                                    <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Heatmap</span>
                                    {question.heatmap.diff && (
                                        <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                                            Diff: <strong className="text-slate-800">{question.heatmap.diff}</strong>
                                        </span>
                                    )}
                                    {question.heatmap.avgTime && (
                                        <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                                            Time: <strong className="text-slate-800">{question.heatmap.avgTime}</strong>
                                        </span>
                                    )}
                                    {question.heatmap.type && (
                                        <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                                            Type: <strong className="text-slate-800">{question.heatmap.type}</strong>
                                        </span>
                                    )}
                                </div>
                            )}

                            {question.source && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-slate-600 flex flex-wrap gap-3 items-center">
                                    <span className="font-bold uppercase tracking-wider text-blue-300 text-[10px]">
                                        {question.source.type}
                                    </span>
                                    <span className="text-blue-700 font-medium">
                                        {question.source.text}
                                    </span>
                                    {question.source.year && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                            {question.source.year}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standard Explanation */}
                    {question.explanation && (
                        <Card className="bg-indigo-50/50 border-indigo-100 overflow-hidden">
                            <div className="p-4 flex gap-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm h-fit text-indigo-500">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-indigo-900 text-sm uppercase tracking-wider mb-2">Explanation</h4>
                                    <div className="text-indigo-800 text-sm leading-relaxed whitespace-pre-wrap">
                                        {question.explanation.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <span key={i} className="font-extrabold text-indigo-950 bg-indigo-100/50 px-1 rounded">{part.slice(2, -2)}</span>;
                                            }
                                            return part;
                                        })}
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
