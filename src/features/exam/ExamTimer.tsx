import { Pause } from 'lucide-react';
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
        if (status === 'EXAM' && !isPaused) {
            timerRef.current = setInterval(tick, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [status, isPaused, tick]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isCritical = timeLeft < 300; // Last 5 mins

    // Ring Logic
    // We'll just animate the pulse, not the ring progress for simplicity unless we have total duration.
    // Actually, let's use a static glowing ring that pulses red when critical.

    return (
        <div className={cn(
            "flex items-center gap-4 px-5 py-2.5 rounded-full border transition-all duration-500",
            isCritical
                ? "bg-red-500/10 border-red-500/50 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] animate-pulse"
                : "bg-white/5 border-white/10 shadow-lg"
        )}>
            {/* Glowing Ring Icon */}
            <div className="relative w-8 h-8 flex items-center justify-center">
                <div className={cn(
                    "absolute inset-0 rounded-full border-2 opacity-20",
                    isCritical ? "border-red-500" : "border-emerald-500"
                )} />
                <div className={cn(
                    "w-2 h-2 rounded-full shadow-[0_0_10px_2px_currentColor]",
                    isCritical ? "bg-red-500 text-red-500" : "bg-emerald-500 text-emerald-500"
                )} />
                <svg className={cn("absolute inset-0 w-full h-full rotate-[-90deg]", isCritical ? "text-red-500" : "text-emerald-500")} viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="125" strokeDashoffset="20" strokeLinecap="round" className="opacity-80" />
                </svg>
            </div>

            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">Time Remaining</span>
                <span className={cn(
                    "font-mono text-xl font-bold leading-none tracking-tight tabular-nums relative",
                    isCritical ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                )}>
                    {minutes}:{String(seconds).padStart(2, '0')}
                </span>
            </div>

            <button
                onClick={togglePause}
                className="p-2 ml-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title={isPaused ? "Resume" : "Pause"}
            >
                <Pause size={18} fill={isPaused ? "currentColor" : "none"} />
            </button>
        </div>
    );
}
