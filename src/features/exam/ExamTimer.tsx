import { Pause } from 'lucide-react';
import { useExamStore } from './store';
import { cn } from '../../shared/lib/utils';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function ExamTimer() {
    const timeLeft = useExamStore(state => state.timeLeft);
    const isPaused = useExamStore(state => state.isPaused);
    const status = useExamStore(state => state.status);
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
    const isCritical = timeLeft < 60; // Last 60 seconds - URGENT
    const isWarning = timeLeft < 300 && !isCritical; // Last 5 mins - Warning

    return (
        <div className={cn(
            "relative flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-700 backdrop-blur-xl overflow-hidden",
            isCritical
                ? "bg-red-500/15 border-red-500/60"
                : isWarning
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-white/5 border-white/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
        )}>

            {/* CRITICAL: pulsing outer ring */}
            {isCritical && (
                <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-red-500 pointer-events-none"
                    animate={{ opacity: [1, 0.1, 1], scale: [1, 1.04, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                />
            )}

            {/* Critical background sweep */}
            {isCritical && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 pointer-events-none" />
            )}

            {/* Status dot */}
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <div className={cn(
                    "absolute inset-0 rounded-full border opacity-20",
                    isCritical ? "border-red-400" : isWarning ? "border-amber-400" : "border-emerald-500"
                )} />
                <motion.div
                    className={cn(
                        "w-2 h-2 rounded-full",
                        isCritical ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                            : isWarning ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    )}
                    animate={isCritical ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
                <svg className={cn("absolute inset-0 w-full h-full rotate-[-90deg]", isCritical ? "text-red-500" : isWarning ? "text-amber-400" : "text-emerald-500")} viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="125" strokeDashoffset="20" strokeLinecap="round" className="opacity-60" />
                </svg>
            </div>

            {/* Time display */}
            <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-1">
                    {isCritical ? "⚠ CRITICAL" : isWarning ? "TIME LOW" : "Remaining"}
                </span>
                <motion.span
                    key={timeLeft}
                    className={cn(
                        "font-mono text-xl font-black leading-none tracking-tight tabular-nums",
                        isCritical ? "text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]"
                            : isWarning ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                : "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
                    )}
                    animate={isCritical && seconds % 2 === 0 ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.2 }}
                >
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </motion.span>
            </div>

            {/* Pause Button */}
            <button
                onClick={togglePause}
                className={cn(
                    "p-1.5 ml-1 rounded-lg transition-all hover:bg-white/10",
                    isPaused ? "text-indigo-400" : "text-slate-500 hover:text-white"
                )}
                title={isPaused ? "Resume" : "Pause"}
            >
                <Pause size={16} fill={isPaused ? "currentColor" : "none"} />
            </button>
        </div>
    );
}
