import { Pause, Clock } from 'lucide-react';
import { useExamStore } from './store';
import { cn } from '../../shared/lib/utils';
import { useEffect, useRef } from 'react';

export function ExamTimer() {
    // Nano-Store Optimization: Subscribe ONLY to timer-related state
    const timeLeft = useExamStore(state => state.timeLeft);
    const isPaused = useExamStore(state => state.isPaused);
    const status = useExamStore(state => state.status);

    // Actions
    const togglePause = useExamStore(state => state.togglePause);
    const tick = useExamStore(state => state.tick);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (status === 'EXAM' && !isPaused && timeLeft > 0) {
            timerRef.current = setInterval(tick, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [status, isPaused, timeLeft, tick]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isCritical = timeLeft < 300; // Last 5 mins

    return (
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Clock size={16} />
                <span>Time Left</span>
            </div>

            <div className={cn(
                "font-mono text-xl font-bold tabular-nums min-w-[80px] text-center rounded px-2 transition-colors",
                isCritical ? "text-red-600 bg-red-50 animate-pulse" : "text-slate-900"
            )}>
                {minutes}:{String(seconds).padStart(2, '0')}
            </div>

            <button
                onClick={togglePause}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                title={isPaused ? "Resume" : "Pause"}
            >
                <Pause size={20} fill={isPaused ? "currentColor" : "none"} />
            </button>
        </div>
    );
}
