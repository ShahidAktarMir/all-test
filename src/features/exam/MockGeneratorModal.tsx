import { useState } from 'react';
import { X, Sparkles, Loader2, Bot, Target, Layers } from 'lucide-react';
import { useExamStore } from './store';
import { Button } from '../../shared/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { GeminiService } from '../../shared/lib/gemini';
import { useNavigate } from 'react-router-dom';

export function MockGeneratorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { apiKey, setQuestions, addLog } = useExamStore();
    const navigate = useNavigate();

    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(10);
    const [difficulty, setDifficulty] = useState('God-Tier (Rank Decider)');
    const [format, setFormat] = useState('Multiple Choice');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!apiKey) {
            setError("Please connect your AI Key first.");
            return;
        }
        if (!subject.trim() || !topic.trim()) {
            setError("Please enter Subject and Topic.");
            return;
        }

        setIsGenerating(true);
        setError('');
        addLog(`Initiating AI generation... Subject: ${subject}, Topic: ${topic}`);

        try {
            const service = new GeminiService(apiKey);
            const questions = await service.generateQuestions(subject, topic, count, difficulty, format);

            if (questions.length === 0) {
                throw new Error("AI returned 0 questions.");
            }

            setQuestions(questions);
            addLog(`Successfully generated ${questions.length} questions.`);
            onClose();
            navigate('/review');
            // Assuming LandingPage listens to status changes or we manually navigate if needed
            // But setQuestions usually sets status to REVIEW.
            // If we are on LandingPage, we might need to verify if it detects status change.
            // Actually LandingPage doesn't auto-redirect on status change usually unless we added that effect.
            // Let's check LandingPage logic. In previous steps, I didn't see auto-redirect in LandingPage
            // but ReviewPage is where questions are viewed. 
            // setQuestions sets status to 'REVIEW'. 
            // LandingPage usually just renders. 
            // We should navigate to /review manually to be safe.
            // But wait, standard flow is: Parse -> setQuestions -> Status=REVIEW -> User sees "Review" page or similar?
            // Actually the router usually handles this. 
            // Let's check router. NO router file visible in my recent edits.
            // However, usually we handle navigation manually. 
            // I'll add onGenerateSuccess callback or just check store status.

            // For now, I'll close modal. The LandingPage logic usually checks `status`.
            // Let's adding explicit navigation if we are in LandingPage context.
            // Since this modal is inside LandingPage, I can navigate here or let parent handle.
            // I'll assume usage inside LandingPage.
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-all"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="bg-white pointer-events-auto rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-indigo-100">
                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Bot size={120} />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-black tracking-tight mb-1 flex items-center gap-2">
                                        <Sparkles size={24} className="text-yellow-400" /> Chief Examiner AI
                                    </h2>
                                    <p className="text-indigo-200 font-medium text-sm">Generating "Rank-Decider" Mock Exams.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-white/70 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Target size={14} /> Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="e.g. English Grammar"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Layers size={14} /> Topic
                                        </label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g. Relative Pronouns"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            Format
                                        </label>
                                        <select
                                            value={format}
                                            onChange={(e) => setFormat(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-sm"
                                        >
                                            <option value="Error Detection">Error Detection</option>
                                            <option value="Sentence Improvement">Sentence Improvement</option>
                                            <option value="Statement Based">Statement Based</option>
                                            <option value="Match the Column">Match the Column</option>
                                            <option value="Multiple Choice">Standard MCQ</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            Questions
                                        </label>
                                        <input
                                            type="number"
                                            value={count}
                                            onChange={(e) => setCount(Number(e.target.value))}
                                            min={1}
                                            max={50}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        Difficulty Profile
                                    </label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-sm"
                                    >
                                        <option value="God-Tier (Rank Decider)">God-Tier / Rank Decider (Hard)</option>
                                        <option value="Exam Topper Level">Topper Level (Medium-Hard)</option>
                                        <option value="Standard Competitive">Standard Competitive (Medium)</option>
                                    </select>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    variant="primary"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 py-4 text-base"
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Setter is thinking...</>
                                    ) : (
                                        "Generate Mock Exam"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
