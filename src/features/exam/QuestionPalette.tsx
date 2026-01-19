import { useExamStore } from './store';
import { cn } from '../../shared/lib/utils';
import { memo, useState } from 'react';
import { X } from 'lucide-react';

const PaletteItem = memo(({ index, status, active, onClick }: { index: number, status: string, active: boolean, onClick: () => void }) => {
    // Orb Styles "The Glowing Orbs"
    let orbClass = "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10";
    let glowClass = "";

    if (status === 'NOT_ANSWERED') {
        orbClass = "bg-red-500/20 text-red-500 border-red-500/50";
        glowClass = "shadow-[0_0_10px_rgba(239,68,68,0.4)]";
    }
    if (status === 'ANSWERED') {
        orbClass = "bg-emerald-500 text-black border-emerald-400 font-bold";
        glowClass = "shadow-[0_0_15px_rgba(16,185,129,0.6)]";
    }
    if (status === 'MARKED') {
        orbClass = "bg-purple-500/20 text-purple-400 border-purple-500/50";
        glowClass = "shadow-[0_0_10px_rgba(139,92,246,0.4)]";
    }
    if (status === 'MARKED_ANSWERED') {
        orbClass = "bg-purple-600 text-white border-purple-400 font-bold";
        glowClass = "shadow-[0_0_15px_rgba(139,92,246,0.6)] relative after:content-['✓'] after:absolute after:-top-1 after:-right-1 after:text-emerald-500 after:text-[10px] after:bg-white after:rounded-full after:w-3.5 after:h-3.5 after:flex after:items-center after:justify-center after:shadow-sm";
    }
    if (status === 'NOT_VISITED') {
        orbClass = "bg-transparent border-white/10 text-white/30 hover:border-white/30";
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "h-10 w-10 border rounded-full flex items-center justify-center text-xs transition-all duration-300 active:scale-90 interact-smooth",
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
    const { questions, answers, marked, visited, currentIndex, navigate, finishExam } = useExamStore();
    const answeredCount = Object.keys(answers).length;

    // Virtualization Constants
    const ITEM_HEIGHT = 40; // h-10
    const GAP = 12; // gap-3
    const ROW_HEIGHT = ITEM_HEIGHT + GAP;
    const ITEMS_PER_ROW = 5;
    const CONTAINER_HEIGHT = 600;

    const [scrollTop, setScrollTop] = useState(0);

    const totalRows = Math.ceil(questions.length / ITEMS_PER_ROW);
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
    const endIndex = Math.min(totalRows, Math.ceil((scrollTop + CONTAINER_HEIGHT) / ROW_HEIGHT) + 2);

    const visibleQuestions = questions.slice(startIndex * ITEMS_PER_ROW, endIndex * ITEMS_PER_ROW);

    return (
        <aside className={cn(
            "bg-[#0a0a0a]/90 backdrop-blur-xl border-l border-white/10 shadow-2xl z-30 flex flex-col h-full transition-transform duration-300 ease-in-out",
            "fixed inset-y-0 right-0 w-80 md:relative md:translate-x-0 md:w-80",
            isOpen ? "translate-x-0" : "translate-x-full",
            className
        )}>
            {/* 1. TOP ZONE (Fixed Header) */}
            <div className="shrink-0 flex flex-col border-b border-light-white/5 bg-white/5">
                {/* Title */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg tracking-tight uppercase">Overview</h3>
                    <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Status Row (50/50 Split) */}
                <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-2xl font-black text-white leading-none">{answeredCount}</div>
                        <div className="text-[10px] uppercase font-bold text-emerald-500 mt-1 tracking-wider">Answered</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-2xl font-black text-white leading-none">{questions.length - answeredCount}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-wider">Left</div>
                    </div>
                </div>
            </div>

            {/* 2. MIDDLE ZONE (Scrollable Body) */}
            <div className="flex-1 overflow-hidden relative bg-black/20 flex flex-col">
                <div className="absolute inset-0 flex flex-col">
                    {/* Section Title */}
                    <div className="py-4 text-center shrink-0 z-10 bg-[#0a0a0a]/50 backdrop-blur-sm sticky top-0">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Question Palette</span>
                    </div>

                    {/* The Grid with Right-Edge Scrollbar */}
                    <div
                        className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar"
                        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                    >
                        <div style={{ height: `${totalRows * ROW_HEIGHT}px`, position: 'relative', width: '100%' }}>
                            <div
                                className="grid grid-cols-5 gap-3 content-start absolute w-full justify-items-center"
                                style={{ top: `${startIndex * ROW_HEIGHT}px` }}
                            >
                                {visibleQuestions.map((q, i) => {
                                    const realIndex = startIndex * ITEMS_PER_ROW + i;
                                    const qId = q.id;
                                    const isAns = answers[qId] !== undefined;
                                    const isMark = marked[qId];
                                    const isVisit = visited[realIndex];
                                    const isCurrent = realIndex === currentIndex;

                                    let status = 'NOT_VISITED';
                                    if (isVisit) status = 'NOT_ANSWERED';
                                    if (isAns) status = 'ANSWERED';
                                    if (isMark && !isAns) status = 'MARKED';
                                    if (isMark && isAns) status = 'MARKED_ANSWERED';

                                    return (
                                        <PaletteItem
                                            key={qId}
                                            index={realIndex}
                                            status={status}
                                            active={isCurrent}
                                            onClick={() => {
                                                navigate(realIndex);
                                                if (window.innerWidth < 768) onClose?.();
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM ZONE (Sticky Footer) */}
            <div className="p-4 border-t border-white/10 bg-[#0a0a0a] z-40 shrink-0">
                <button
                    onClick={finishExam}
                    className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)] active:scale-95 transition-all duration-300 uppercase tracking-wider text-sm"
                >
                    Submit Protocol
                </button>
            </div>
        </aside>
    );
}
