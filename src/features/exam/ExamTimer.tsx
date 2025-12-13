import { Pause, Clock } from 'lucide-react';
import { useExamStore } from './store';
import { cn } from '../../shared/lib/utils';
import { useEffect } from 'react';

export function ExamTimer() {
    const { timeLeft, isPaused, togglePause, tick, status } = useExamStore();

    useEffect(() => {
        let interval: any;
        if (status === 'EXAM' && !isPaused && timeLeft > 0) {
            interval = setInterval(tick, 1000);
        }
        return () => clearInterval(interval);
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
