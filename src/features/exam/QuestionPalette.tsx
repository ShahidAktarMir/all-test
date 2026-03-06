import { useExamStore } from './store';
import { cn } from '../../shared/lib/utils';
import { memo } from 'react';
import { X } from 'lucide-react';

const PaletteItem = memo(({ index, status, active, onClick }: { index: number, status: string, active: boolean, onClick: () => void }) => {
    // Orb Styles "The Glowing Orbs"
    let orbClass = "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20";
    let glowClass = "shadow-[inset_0_1px_rgba(255,255,255,0.05)]";

    if (status === 'NOT_ANSWERED') {
        orbClass = "bg-red-500/10 text-red-500 border border-red-500/40 hover:bg-red-500/20";
        glowClass = "shadow-[inset_0_1px_rgba(255,255,255,0.1),_0_0_15px_-5px_rgba(239,68,68,0.5)]";
    }
    if (status === 'ANSWERED') {
        orbClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold hover:bg-emerald-500/30";
        glowClass = "shadow-[inset_0_1px_rgba(255,255,255,0.2),_0_0_15px_-5px_rgba(16,185,129,0.5)]";
    }
    if (status === 'MARKED') {
        orbClass = "bg-purple-500/10 text-purple-400 border border-purple-500/40 hover:bg-purple-500/20";
        glowClass = "shadow-[inset_0_1px_rgba(255,255,255,0.1),_0_0_15px_-5px_rgba(168,85,247,0.5)]";
    }
    if (status === 'MARKED_ANSWERED') {
        orbClass = "bg-purple-500/30 text-purple-300 border border-purple-400/60 font-bold hover:bg-purple-500/40";
        glowClass = "shadow-[inset_0_1px_rgba(255,255,255,0.2),_0_0_20px_-5px_rgba(168,85,247,0.6)] relative after:content-['✓'] after:absolute after:-top-1 after:-right-1 after:text-emerald-400 after:text-[10px] after:bg-gray-900 after:border after:border-emerald-500/50 after:rounded-full after:w-4 after:h-4 after:flex after:items-center after:justify-center after:shadow-sm";
    }
    if (status === 'NOT_VISITED') {
        orbClass = "bg-transparent border border-white/5 text-slate-600 hover:text-slate-400 hover:border-white/15";
        glowClass = "";
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "h-10 w-10 border rounded-full flex items-center justify-center text-xs transition-all duration-300 active:scale-90 interact-smooth touch-manipulation", // Added touch-manipulation
                orbClass,
                glowClass,
                active && "ring-2 ring-white ring-offset-2 ring-offset-black scale-110 z-10"
            )}
        >
            {index + 1}
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

    return (
        <aside className={cn(
            "bg-[#0a0a0a]/90 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 flex flex-col h-full transition-transform duration-300 ease-in-out",
            "fixed inset-y-0 right-0 w-[85vw] sm:w-96 md:relative md:translate-x-0 md:w-80 xl:w-96", // Mobile: 85vw, Tablet: Fixed, Desktop: Fixed larger
            isOpen ? "translate-x-0" : "translate-x-full",
            className
        )}>
            {/* 1. TOP ZONE (Premium Header Dashboard) */}
            <div className="shrink-0 flex flex-col border-b border-white/10 bg-white/[0.02]">
                {/* Title */}
                <div className="p-5 pb-3 flex justify-between items-center">
                    <h3 className="font-black text-white text-lg tracking-[-0.02em] uppercase max-w-[80%] flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                        Overview
                    </h3>
                    <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white rounded-full transition-colors bg-white/5 border border-white/10 hover:bg-white/10">
                        <X size={18} />
                    </button>
                </div>

                {/* Status Dashboard Row */}
                <div className="grid grid-cols-2 gap-3 px-5 pb-5">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_rgba(255,255,255,0.1),_0_4px_20px_-5px_rgba(16,185,129,0.2)]">
                        <div className="text-3xl font-black text-emerald-400 leading-none drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] tabular-nums tracking-[-0.05em]">{answeredCount}</div>
                        <div className="text-[10px] uppercase font-bold text-emerald-500/80 mt-1.5 tracking-widest">Answered</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_rgba(255,255,255,0.05)]">
                        <div className="text-3xl font-black text-white leading-none tabular-nums tracking-[-0.05em]">{questions.length - answeredCount}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mt-1.5 tracking-widest">Left</div>
                    </div>
                </div>
            </div>

            {/* 2. MIDDLE ZONE (Scrollable Grid Body) */}
            <div className="flex-1 overflow-y-auto bg-black/40 custom-scrollbar shadow-[inset_0_10px_20px_-10px_rgba(0,0,0,0.5)] relative">
                <div className="flex flex-col h-full">
                    {/* Sticky Section Title */}
                    <div className="py-2 text-center shrink-0 z-10 bg-gradient-to-b from-[#0a0a0a]/90 to-transparent sticky top-0 backdrop-blur-md pb-4 pt-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Question Grid</span>
                    </div>

                    {/* Clean CSS Grid without Virtualization */}
                    <div className="grid grid-cols-5 gap-3 md:gap-4 px-5 pb-8 justify-items-center w-full">
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
            </div>
        </aside>
    );
}
