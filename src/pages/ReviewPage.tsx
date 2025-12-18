import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { ArrowLeft, PlayCircle, FileText, Download } from 'lucide-react';
import { QuestionCard } from '../entities/question/QuestionCard';
import { motion } from 'framer-motion';
import { PDFGenerator } from '../shared/lib/pdf-generator';

export function ReviewPage() {
    const { questions, startExam, resetExam } = useExamStore();
    const navigate = useNavigate();

    const handleStart = () => {
        startExam();
        navigate('/exam');
    };

    const handleBack = () => {
        resetExam();
        navigate('/');
    };

    const handleDownload = () => {
        const generator = new PDFGenerator();
        generator.generate(questions, "Exam Review");
    };

    if (questions.length === 0) {
        setTimeout(() => navigate('/'), 0);
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header Background */}
            <div className="h-64 bg-indigo-900 absolute top-0 left-0 right-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="max-w-6xl mx-auto px-6 relative z-10 pt-12">

                {/* Navbar / Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-12 text-white"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                            <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">Preview Mode</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">Exam Review</h1>
                        <p className="text-indigo-200 font-medium">Reviewing {questions.length} questions before starting.</p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            onClick={handleDownload}
                            className="text-white hover:bg-white/10 hover:text-white border border-white/20 gap-2"
                        >
                            <Download size={18} /> Export PDF
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className="text-white hover:bg-white/10 hover:text-white border border-white/20 gap-2"
                        >
                            <ArrowLeft size={18} /> Discard File
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleStart}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-none gap-2 px-8"
                        >
                            <PlayCircle size={20} fill="currentColor" className="text-emerald-800/30" /> Begin Exam
                        </Button>
                    </div>
                </motion.div>

                {/* Content Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6 pb-20"
                >
                    {questions.map((q, i) => (
                        <Card key={i} className="p-8 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 group relative overflow-hidden border-slate-200/60">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                                <FileText size={100} />
                            </div>

                            <div className="relative z-10 pl-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Question {i + 1}</span>
                                <QuestionCard question={q} index={i} className="max-w-full" />
                            </div>
                        </Card>
                    ))}
                </motion.div>

                <div className="h-20" /> {/* Spacer */}
            </div>
        </div>
    );
}
