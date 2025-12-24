import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';
import { QuestionCard } from '../entities/question/QuestionCard';
import { QuestionPalette } from '../features/exam/QuestionPalette';
import { ExamTimer } from '../features/exam/ExamTimer';
import { Bookmark, Eraser, ChevronRight, ChevronLeft, Pause, PlayCircle, Menu } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { cn } from '../shared/lib/utils';

export function ExamPage() {
    const navigate = useNavigate();
    const [isPaletteOpen, setIsPaletteOpen] = useState(false); // Mobile Palette State
    // Nano-Store Optimization: Selective Subscription to prevent re-renders on 'timeLeft' updates
    const questions = useExamStore(state => state.questions);
    const currentIndex = useExamStore(state => state.currentIndex);
    const answers = useExamStore(state => state.answers);
    const marked = useExamStore(state => state.marked);
    const isPaused = useExamStore(state => state.isPaused);
    const status = useExamStore(state => state.status);

    // Actions (Stable references, rarely change)
    const answerQuestion = useExamStore(state => state.answerQuestion);
    const nextQuestion = useExamStore(state => state.nextQuestion);
    const prevQuestion = useExamStore(state => state.prevQuestion);
    const toggleMark = useExamStore(state => state.toggleMark);
    const clearResponse = useExamStore(state => state.clearResponse);
    const togglePause = useExamStore(state => state.togglePause);

    // Zen Mode & Voiceover State
    const [isZenMode, setIsZenMode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (status === 'RESULT') navigate('/result');
        if (questions.length === 0) navigate('/');
    }, [status, questions, navigate]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                nextQuestion();
            } else if (e.key === 'ArrowLeft') {
                prevQuestion();
            } else if (e.key === 'm' || e.key === 'M') {
                if (questions[currentIndex]) {
                    toggleMark(questions[currentIndex].id);
                }
            } else if (e.key === 'z' || e.key === 'Z') {
                setIsZenMode(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextQuestion, prevQuestion, currentIndex, questions, toggleMark]);

    // Text to Speech
    const speakQuestion = (text: string) => {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setIsSpeaking(false);
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    // Stop speaking when unmounting or changing questions (optional, but good UX)
    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, [currentIndex]);


    const currentQ = questions[currentIndex];
    if (!currentQ) return null;

    return (
        <div className={cn("h-screen flex flex-col bg-white overflow-hidden font-sans select-none relative transition-colors duration-500", isZenMode ? "bg-slate-900" : "bg-white")}>

            {/* PAUSE OVERLAY */}
            {isPaused && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white p-12 rounded-[2rem] shadow-2xl text-center max-w-md animate-in zoom-in-95 duration-300 mx-4">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Pause size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Exam Paused</h2>
                        <p className="text-slate-500 mb-8 font-medium">Take a breath. Timer is stopped.</p>
                        <Button size="lg" onClick={togglePause} className="w-full gap-2">
                            <PlayCircle size={20} /> Resume Now
                        </Button>
                    </div>
                </div>
            )}

            {/* HEADER - Hidden in Zen Mode */}
            <header className={cn("h-16 px-4 md:px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-20 transition-all duration-500", isZenMode ? "-mt-16 opacity-0" : "opacity-100")}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                        title="Back to Home"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold hidden md:flex">N</div>
                    <span className="font-bold text-slate-700 tracking-tight text-sm md:text-base">NEURO EXAM</span>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <ExamTimer />
                    <button
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        onClick={() => setIsZenMode(true)}
                        title="Enter Zen Mode (Z)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" /></svg>
                    </button>
                    <button
                        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        onClick={() => setIsPaletteOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            {/* BODY */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* MAIN CONTENT */}
                <main className={cn("flex-1 flex flex-col relative w-full transition-colors duration-500", isZenMode ? "bg-slate-900" : "bg-slate-50/50")}>

                    {/* Zen Mode Exit Button */}
                    {isZenMode && (
                        <button
                            onClick={() => setIsZenMode(false)}
                            className="absolute top-4 right-4 z-30 p-2 bg-white/10 text-white/50 hover:text-white hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
                        </button>
                    )}

                    {/* Question Header */}
                    <div className={cn("border-b px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shadow-sm transition-colors duration-500", isZenMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700")}>
                        <div className="flex items-center gap-4">
                            <span className={cn("font-bold text-sm md:text-lg", isZenMode ? "text-slate-200" : "text-slate-700")}>Question {currentIndex + 1} of {questions.length}</span>
                            <button
                                onClick={() => speakQuestion(currentQ.question)}
                                className={cn("p-1.5 rounded-full transition-colors flex items-center gap-2 text-xs font-bold", isSpeaking ? "bg-indigo-100 text-indigo-600 animate-pulse" : "hover:bg-slate-100 text-slate-400")}
                            >
                                {isSpeaking ? <span onClick={(e) => { e.stopPropagation(); speakQuestion(''); }}>Stop Reading</span> : <span>Read Aloud</span>}
                            </button>
                        </div>
                        <div className="flex gap-2 md:gap-4 text-[10px] md:text-xs font-bold w-full md:w-auto overflow-x-auto">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 whitespace-nowrap">+2.0 Marks</span>
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full border border-red-200 whitespace-nowrap">-0.5 Neg</span>
                        </div>
                    </div>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center">
                        <QuestionCard
                            question={currentQ}
                            index={currentIndex}
                            selectedOption={answers[currentQ.id]}
                            onSelectOption={(opt) => answerQuestion(currentQ.id, opt)}
                            className={cn(
                                "p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border mb-32 md:mb-0 transition-colors duration-500",
                                isZenMode ? "bg-slate-800 border-slate-700 text-slate-100 shadow-xl shadow-black/50" : "bg-white border-slate-200 shadow-sm"
                            )}
                        />
                    </div>

                    {/* Footer Controls */}
                    <footer className={cn("h-auto md:h-24 py-3 md:py-0 border-t px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 z-20 fixed bottom-0 left-0 right-0 md:relative transition-colors duration-500 pb-safe", isZenMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]")}>
                        {/* Mobile: Grid Layout for better space usage */}
                        <div className="grid grid-cols-4 md:flex gap-2 w-full md:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleMark(currentQ.id)}
                                className={cn(
                                    "col-span-1 md:w-auto transition-colors p-0 md:px-4", // Icon only on very small? No, keep text but small.
                                    marked[currentQ.id] && "border-purple-500 text-purple-600 bg-purple-50"
                                )}
                                title="Mark for Review"
                            >
                                <Bookmark size={16} className={cn("md:mr-2", marked[currentQ.id] && "fill-current")} />
                                <span className="hidden md:inline">{marked[currentQ.id] ? "Unmark" : "Mark"}</span>
                            </Button>

                            <Button variant="ghost" size="sm" onClick={() => clearResponse(currentQ.id)} className="col-span-1 md:w-auto p-0 md:px-4 text-slate-400 hover:text-slate-600">
                                <Eraser size={18} />
                            </Button>

                            <div className="col-span-2 md:w-auto flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={prevQuestion}
                                    disabled={currentIndex === 0}
                                    className="flex-1 border-slate-300 text-slate-600"
                                >
                                    <ChevronLeft size={16} className="mr-1" /> Previous
                                </Button>

                                <Button
                                    size="sm"
                                    onClick={nextQuestion}
                                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white"
                                >
                                    Next <ChevronRight size={16} className="ml-1" />
                                </Button>
                            </div>
                        </div>
                    </footer>
                </main>

                {/* SIDEBAR (Responsive Drawer) */}
                {/* Overlay for mobile */}
                {isPaletteOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm animate-in fade-in"
                        onClick={() => setIsPaletteOpen(false)}
                    />
                )}
                <QuestionPalette
                    isOpen={isPaletteOpen}
                    onClose={() => setIsPaletteOpen(false)}
                />
            </div>
        </div>
    );
}
