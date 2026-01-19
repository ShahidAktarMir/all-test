import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { ArrowLeft, PlayCircle, Download, Layers } from 'lucide-react';
import { QuestionCard } from '../entities/question/QuestionCard';
import { motion } from 'framer-motion';
import { PDFGenerator } from '../shared/lib/pdf-generator';
import { useVirtualWindow } from '../shared/hooks/useVirtualWindow';
import { useRef } from 'react';

export function ReviewPage() {
    const questions = useExamStore(state => state.questions);
    const startExam = useExamStore(state => state.startExam);
    const resetExam = useExamStore(state => state.resetExam);
    const navigate = useNavigate();

    // Virtualization Config
    // Fixed height assumption for stable O(1) rendering
    const ITEM_HEIGHT = 480; // Increased for comfortable spacing
    const containerRef = useRef<HTMLDivElement>(null);

    const { virtualItems, totalHeight, onScroll } = useVirtualWindow(questions, {
        itemHeight: ITEM_HEIGHT,
        containerHeight: typeof window !== 'undefined' ? window.innerHeight : 900,
        overscan: 2
    });

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
        <div className="h-screen bg-[var(--bg-deep)] font-sans flex flex-col overflow-hidden text-white relative selection:bg-indigo-500/30">
            {/* Ambient Background - The Void */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Neural Header - Command Deck */}
            <div className="flex-none p-6 md:p-8 bg-black/20 backdrop-blur-2xl border-b border-white/5 relative z-20 shadow-2xl">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="w-14 h-14 bg-black/50 rounded-2xl flex items-center justify-center border border-white/10 relative z-10 backdrop-blur-md">
                                <Layers className="text-indigo-400" size={24} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="font-black tracking-tighter text-white leading-none" style={{ fontSize: 'var(--font-h2)' }}>
                                    EXAM <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">MANIFEST</span>
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest hidden md:block">
                                    Classified
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    <span>{questions.length} Units Ready</span>
                                </div>
                                <div className="w-px h-3 bg-white/10" />
                                <span className="text-indigo-400/60">Virtualizer: <span className="text-indigo-400">Online</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-black/20 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                        <Button variant="ghost" size="sm" onClick={handleDownload} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border-transparent">
                            <Download size={16} className="mr-2" /> Export
                        </Button>
                        <div className="w-px h-6 bg-white/10" />
                        <Button variant="ghost" size="sm" onClick={handleBack} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl border-transparent">
                            <ArrowLeft size={16} className="mr-2" /> Abort
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleStart}
                            className="px-8 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)] bg-emerald-500 text-black border-none font-black tracking-widest hover:scale-105 active:scale-95 transition-all rounded-xl"
                        >
                            <PlayCircle size={18} className="mr-2 fill-black/20" /> INITIATE
                        </Button>
                    </div>
                </div>
            </div>

            {/* Virtual Scrollport - Data Stream */}
            <div
                className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar"
                onScroll={onScroll}
                ref={containerRef}
            >
                <div className="relative w-full max-w-5xl mx-auto" style={{ height: totalHeight }}>
                    {virtualItems.map(({ item, index, offsetTop }) => (
                        <div
                            key={item.id}
                            className="absolute top-0 left-0 w-full px-4 md:px-0 flex justify-center"
                            style={{
                                transform: `translateY(${offsetTop}px)`,
                                height: ITEM_HEIGHT,
                                paddingBottom: '2rem'
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full h-full relative group"
                            >
                                {/* Holographic Connection Line */}
                                <div className="absolute -left-4 md:-left-8 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block" />
                                <div className="absolute -left-4 md:-left-[35px] top-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 hidden md:block" />

                                <Card className="h-full p-8 md:p-10 border-white/5 bg-black/40 hover:bg-black/60 hover:border-indigo-500/30 transition-all duration-500 group relative overflow-auto shadow-2xl backdrop-blur-xl">

                                    {/* Scanline Effect */}
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(99,102,241,0.03)_50%,transparent_100%)] bg-[length:100%_4px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    {/* Active Glow Border */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="flex justify-between items-start mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-3 font-mono text-xs tracking-widest uppercase text-indigo-300">
                                            <span className="w-6 h-6 rounded flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <span className="text-slate-500">Node ID: {String(item.id).substring(0, 6)}</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <QuestionCard question={item} className="bg-transparent border-0 shadow-none p-0 min-h-0 scale-100" />
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ReviewPage;
