import { useExamStore } from './store';
import { cn } from '../../shared/lib/utils';
import { memo, useState } from 'react';
import { X } from 'lucide-react';

const PaletteItem = memo(({ index, status, active, onClick }: { index: number, status: string, active: boolean, onClick: () => void }) => {
    let bgClass = "bg-white border-slate-200 text-slate-500 hover:bg-slate-50";
    if (status === 'NOT_ANSWERED') bgClass = "bg-red-500 text-white border-red-600 shadow-sm shadow-red-200";
    if (status === 'ANSWERED') bgClass = "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-200";
    if (status === 'MARKED') bgClass = "bg-purple-600 text-white border-purple-700 shadow-sm shadow-purple-200";
    if (status === 'MARKED_ANSWERED') bgClass = "bg-purple-600 text-white border-purple-700 relative after:content-['✓'] after:absolute after:-top-1 after:-right-1 after:text-emerald-500 after:text-xs after:bg-white after:rounded-full after:w-3.5 after:h-3.5 after:flex after:items-center after:justify-center after:shadow-sm";
    if (status === 'NOT_VISITED') bgClass = "bg-slate-50 border-slate-200 text-slate-300";

    return (
        <button
            onClick={onClick}
            className={cn(
                "h-10 w-10 border-2 rounded-xl flex items-center justify-center font-bold text-sm transition-all active:scale-95",
                bgClass,
                active && "ring-2 ring-indigo-500 ring-offset-2 z-10 scale-110 shadow-lg"
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
    const GAP = 8; // gap-2
    const ROW_HEIGHT = ITEM_HEIGHT + GAP;
    const ITEMS_PER_ROW = 5;
    const CONTAINER_HEIGHT = 600; // Approximate height, or dynamic. 
    // Ideally we measure ref, but fixed Viewport estimation is faster for Phase 3.

    // Virtualization State
    const [scrollTop, setScrollTop] = useState(0);

    const totalRows = Math.ceil(questions.length / ITEMS_PER_ROW);
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2); // Buffer of 2 rows
    const endIndex = Math.min(totalRows, Math.ceil((scrollTop + CONTAINER_HEIGHT) / ROW_HEIGHT) + 2);

    const visibleQuestions = questions.slice(startIndex * ITEMS_PER_ROW, endIndex * ITEMS_PER_ROW);

    return (
        <aside className={cn(
            "bg-slate-50 border-l border-slate-200 shadow-xl shadow-slate-200/50 z-30 flex flex-col h-full transition-transform duration-300 ease-in-out",
            "fixed inset-y-0 right-0 w-80 md:relative md:translate-x-0 md:w-80", // Mobile: Fixed drawer; Desktop: Relative
            isOpen ? "translate-x-0" : "translate-x-full", // Toggle logic
            className
        )}>
            {/* Mobile Header */}
            <div className="md:hidden p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800">Question Palette</h3>
                <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <X size={20} />
                </button>
            </div>

            {/* Stats Header */}
            <div className="p-5 bg-white border-b border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider hidden md:block">Overview</h3>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center gap-2 text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {answeredCount} Answered
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> {questions.length - answeredCount} Left
                    </div>
                </div>
            </div>

            <div className="bg-slate-100/50 p-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-200">
                Question Palette
            </div>

            {/* Grid */}
            {/* Grid - Virtualized for Infinite Performance */}
            <div
                className="flex-1 overflow-y-auto p-4 custom-scrollbar relative"
                onScroll={(e) => {
                    // Simple debounce/throttle could be added here if needed, 
                    // but React's reconciler is usually fast enough for simple math.
                    const target = e.currentTarget;
                    // Force update logic if state was local, but here we can just query DOM or use state
                    // We need a local state for scroll position to trigger re-render of window
                    target.dataset.scrollTop = target.scrollTop.toString();
                    setScrollTop(target.scrollTop);
                }}
            >
                <div style={{ height: `${totalRows * ROW_HEIGHT}px`, position: 'relative', width: '100%' }}>
                    <div
                        className="grid grid-cols-5 gap-2 content-start absolute w-full justify-items-center" // Center items in grid
                        style={{ top: `${startIndex * ROW_HEIGHT}px` }}
                    >
                        {visibleQuestions.map((q, i) => {
                            const realIndex = startIndex * ITEMS_PER_ROW + i;

                            // Use 'q' directly, it is the question object
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

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200">
                <button
                    onClick={finishExam}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                >
                    Submit Exam
                </button>
            </div>
        </aside>
    );
}
