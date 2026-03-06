import { useExamStore } from './store';
import { cn } from '../../shared/lib/utils';
import { memo } from 'react';
import { X, BookMarked } from 'lucide-react';

const PaletteItem = memo(({ index, status, active, onClick }: { index: number, status: string, active: boolean, onClick: () => void }) => {
    let base = "";
    let icon = null;

    if (status === 'NOT_VISITED') {
        base = "bg-white/[0.03] border-white/[0.06] text-slate-600 hover:text-slate-400 hover:border-white/15 hover:bg-white/[0.06]";
    } else if (status === 'NOT_ANSWERED') {
        base = "bg-red-500/10 text-red-400 border-red-500/40 hover:bg-red-500/20 shadow-[0_0_10px_-4px_rgba(239,68,68,0.4)]";
    } else if (status === 'ANSWERED') {
        base = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold hover:bg-emerald-500/30 shadow-[0_0_12px_-4px_rgba(16,185,129,0.5)]";
    } else if (status === 'MARKED') {
        base = "bg-violet-500/15 text-violet-300 border-violet-500/40 hover:bg-violet-500/25 shadow-[0_0_10px_-4px_rgba(139,92,246,0.4)]";
        icon = <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-violet-500 rounded-full border border-[#0a0a0a] flex items-center justify-center"><BookMarked size={7} className="text-white" /></span>;
    } else if (status === 'MARKED_ANSWERED') {
        base = "bg-violet-500/25 text-violet-200 border-violet-400/60 font-bold hover:bg-violet-500/35 shadow-[0_0_14px_-4px_rgba(139,92,246,0.6)]";
        icon = <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-[#0a0a0a] flex items-center justify-center text-[8px] font-black text-black">✓</span>;
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative h-10 w-10 border rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-200 active:scale-90 touch-manipulation select-none",
                base,
                active && "ring-2 ring-white/80 ring-offset-1 ring-offset-[#0a0a0a] scale-110 z-10 font-black"
            )}
        >
            {index + 1}
            {icon}
        </button>
    );
});

interface QuestionPaletteProps {
    className?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export function QuestionPalette({ className, isOpen, onClose }: QuestionPaletteProps) {
    const { questions, answers, marked, visited, currentIndex, navigate } = useExamStore();
    const answeredCount = Object.keys(answers).length;
    const markedCount = Object.values(marked).filter(Boolean).length;
    const leftCount = questions.length - answeredCount;

    return (
        <aside className={cn(
            "bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/[0.07] shadow-2xl z-40 flex flex-col h-full transition-transform duration-300 ease-in-out",
            "fixed inset-y-0 right-0 w-[80vw] sm:w-80 md:relative md:translate-x-0 md:w-72 xl:w-80",
            isOpen ? "translate-x-0" : "translate-x-full",
            className
        )}>

            {/* HEADER */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/[0.07] bg-white/[0.02]">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <span className="w-1 h-5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        <h3 className="font-black text-white text-sm tracking-widest uppercase">Overview</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors hover:bg-white/5 border border-white/5"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Compact 3-stat row */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-center">
                        <div className="text-xl font-black text-emerald-400 tabular-nums leading-none">{answeredCount}</div>
                        <div className="text-[9px] uppercase font-bold text-emerald-500/70 mt-1 tracking-wider">Done</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 text-center">
                        <div className="text-xl font-black text-red-400 tabular-nums leading-none">{leftCount}</div>
                        <div className="text-[9px] uppercase font-bold text-red-500/70 mt-1 tracking-wider">Left</div>
                    </div>
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-2 text-center">
                        <div className="text-xl font-black text-violet-400 tabular-nums leading-none">{markedCount}</div>
                        <div className="text-[9px] uppercase font-bold text-violet-500/70 mt-1 tracking-wider">Marked</div>
                    </div>
                </div>
            </div>

            {/* LEGEND ROW */}
            <div className="shrink-0 px-4 py-2 flex flex-wrap gap-x-3 gap-y-1 border-b border-white/[0.05] bg-black/30">
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="w-2 h-2 rounded bg-white/10 border border-white/10" />Not visited
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-red-500/70">
                    <span className="w-2 h-2 rounded bg-red-500/20 border border-red-500/40" />Unanswered
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-500/70">
                    <span className="w-2 h-2 rounded bg-emerald-500/20 border border-emerald-500/50" />Answered
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-violet-400/70">
                    <span className="w-2 h-2 rounded bg-violet-500/20 border border-violet-500/40" />Marked
                </span>
            </div>

            {/* SCROLLABLE GRID */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 relative">
                <div className="grid grid-cols-5 gap-2.5 p-4 pb-8">
                    {questions.map((q, index) => {
                        const qId = q.id;
                        const isAns = answers[qId] !== undefined;
                        const isMark = marked[qId];
                        const isVisit = visited[index];
                        const isCurrent = index === currentIndex;

                        let status = 'NOT_VISITED';
                        if (isVisit) status = 'NOT_ANSWERED';
                        if (isAns) status = 'ANSWERED';
                        if (isMark && !isAns) status = 'MARKED';
                        if (isMark && isAns) status = 'MARKED_ANSWERED';

                        return (
                            <PaletteItem
                                key={qId}
                                index={index}
                                status={status}
                                active={isCurrent}
                                onClick={() => {
                                    navigate(index);
                                    if (window.innerWidth < 768) onClose?.();
                                }}
                            />
                        )
                    })}
                </div>
            </div>
        </aside>
    );
}
