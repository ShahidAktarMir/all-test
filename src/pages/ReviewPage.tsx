import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { QuestionCard } from '../entities/question/QuestionCard';

export function ReviewPage() {
    const { questions, startExam, setStatus } = useExamStore();
    const navigate = useNavigate();

    const handleStart = () => {
        startExam();
        navigate('/exam');
    };

    const handleBack = () => {
        setStatus('IDLE');
        navigate('/');
    };

    if (questions.length === 0) {
        // Direct access protection
        setTimeout(() => navigate('/'), 0);
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12 sticky top-6 z-20 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm">REVIEW MODE</span>
                        {questions.length} Questions Loaded
                    </h1>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={handleBack} className="gap-2">
                            <ArrowLeft size={18} /> Discard
                        </Button>
                        <Button variant="primary" size="lg" onClick={handleStart} className="gap-2 shadow-indigo-300">
                            <PlayCircle size={20} /> Start Exam
                        </Button>
                    </div>
                </header>

                <div className="space-y-6">
                    {questions.map((q, i) => (
                        <Card key={i} className="p-8 hover:border-indigo-200 transition-colors">
                            <QuestionCard question={q} index={i} className="max-w-full" />
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
