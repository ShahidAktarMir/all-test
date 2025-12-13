import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';
import { QuestionCard } from '../entities/question/QuestionCard';
import { QuestionPalette } from '../features/exam/QuestionPalette';
import { ExamTimer } from '../features/exam/ExamTimer';
import { Bookmark, Eraser, ChevronRight, Pause, PlayCircle, Menu } from 'lucide-react';
import { Button } from '../shared/ui/Button';

export function ExamPage() {
    const navigate = useNavigate();
    const [isPaletteOpen, setIsPaletteOpen] = useState(false); // Mobile Palette State
    const {
        questions, currentIndex, answers, marked,
        answerQuestion, toggleMark, clearResponse, navigate: navToQuestion,
        isPaused, togglePause, status
    } = useExamStore();

    useEffect(() => {
        if (status === 'RESULT') navigate('/result');
        if (questions.length === 0) navigate('/');
    }, [status, questions, navigate]);

    const currentQ = questions[currentIndex];

    if (!currentQ) return null;

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden font-sans select-none relative">

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

            {/* HEADER */}
            <header className="h-16 px-4 md:px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold hidden md:flex">N</div>
                    <span className="font-bold text-slate-700 tracking-tight text-sm md:text-base">NEURO EXAM</span>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <ExamTimer />
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
                <main className="flex-1 flex flex-col relative bg-slate-50/50 w-full">
                    {/* Question Header */}
                    <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shadow-sm">
                        <span className="font-bold text-slate-700 text-sm md:text-lg">Question {currentIndex + 1} of {questions.length}</span>
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
                            className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 mb-24 md:mb-0" // mb-24 for mobile footer space
                        />
                    </div>

                    {/* Footer Controls */}
                    <footer className="h-auto md:h-24 py-4 md:py-0 bg-white border-t border-slate-200 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-20 fixed bottom-0 left-0 right-0 md:relative">
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleMark(currentQ.id)}
                                className={`flex-1 md:flex-none ${marked[currentQ.id] ? "border-purple-500 text-purple-600 bg-purple-50" : ""}`}
                            >
                                <Bookmark size={16} className="mr-2" />
                                <span className="md:inline hidden">{marked[currentQ.id] ? "Unmark" : "Mark for Review"}</span>
                                <span className="md:hidden inline">{marked[currentQ.id] ? "Unmark" : "Mark"}</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => clearResponse(currentQ.id)} className="flex-1 md:flex-none">
                                <Eraser size={16} className="mr-2" /> Clear
                            </Button>
                        </div>

                        <Button
                            size="lg"
                            onClick={() => navToQuestion(Math.min(questions.length - 1, currentIndex + 1))}
                            className="w-full md:w-auto px-8 md:px-12 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                        >
                            Save & Next <ChevronRight size={20} className="ml-2" />
                        </Button>
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
