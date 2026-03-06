import { useRef, useState } from 'react';
import { Upload, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';
import { OCREngine } from '../shared/lib/ocr_engine';
import { DocumentExtractor } from '../shared/lib/doc_extractor';

import { motion } from 'framer-motion';

export function LandingPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [rawText, setRawText] = useState<string>(""); // Store raw extracted text
    const [showRaw, setShowRaw] = useState(false);

    const { setQuestions, addLog, processingLog, status, setStatus } = useExamStore();

    // In case we handle navigation manually or check status
    if (status === 'REVIEW') {
        // Logic if needed
    }


    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('PARSING');
        addLog(`Reading ${file.name}...`);

        try {
            let text = "";
            const name = file.name.toLowerCase();

            // 1. Extract Text based on File Type
            if (name.endsWith('.pdf') || name.match(/\.(jpg|jpeg|png|webp)$/)) {
                addLog("Document Detected. Initializing Neural OCR Engine...");
                setStatus('PARSING'); // Correct state
                const arrayBuffer = await file.arrayBuffer();

                const result = await OCREngine.extract(arrayBuffer, (statusMsg) => {
                    addLog("[OCR] " + statusMsg);
                });
                text = result.text;

            } else if (name.endsWith('.docx')) {
                addLog("Word Document Detected. Extracting text...");
                const arrayBuffer = await file.arrayBuffer();
                text = await DocumentExtractor.extractDocx(arrayBuffer);

            } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
                addLog("Excel Spreadsheet Detected. Extracting data...");
                const arrayBuffer = await file.arrayBuffer();
                text = DocumentExtractor.extractExcel(arrayBuffer);

            } else {
                // Text file
                addLog("Text File Detected. Reading content...");
                text = await file.text();
            }

            if (!text || text.trim().length === 0) {
                alert("Extraction Failed: No text found in document.");
                setStatus('IDLE');
                return;
            }

            setRawText(text); // Save for debugging

            // 2. Parse Text
            addLog("Offloading to Worker Thread...");

            const worker = new Worker(new URL('../shared/workers/parser.worker.ts', import.meta.url), { type: 'module' });

            worker.postMessage({ text });

            worker.onmessage = (e) => {
                const { status, questions, error } = e.data;
                if (status === 'success') {
                    if (questions.length > 0) {
                        addLog(`Success: ${questions.length} Questions Found.`);
                        setTimeout(() => {
                            setQuestions(questions);
                            navigate('/review');
                        }, 800);
                    } else {
                        alert("No valid question blocks found.");
                        setStatus('IDLE');
                    }
                } else {
                    console.error(error);
                    alert("Parsing Failed: " + error);
                    setStatus('IDLE');
                }
                worker.terminate();
            };

            worker.onerror = (err) => {
                console.error(err);
                alert("Worker Error: " + err.message);
                setStatus('IDLE');
                worker.terminate();
            };

        } catch (err: unknown) {
            console.error(err);
            alert("Parsing Failed: " + (err instanceof Error ? err.message : String(err)));
            setStatus('IDLE');
        }
    };

    if (status === 'PARSING') {
        return (
            <div className="min-h-screen bg-[var(--bg-deep)] flex flex-col items-center justify-center text-white font-mono p-4 relative overflow-hidden">
                {/* Immersive Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] saturate-[2] animate-pulse" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay saturate-[1.5]"></div>
                </div>

                <div className="relative z-10 w-full max-w-lg text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="inline-block mb-8 relative"
                    >
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                        <svg className="w-24 h-24 text-indigo-400 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
                            <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>

                    <h2 className="text-3xl font-black mb-2 tracking-[0.05em] bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        PROCESSING CORE
                    </h2>
                    <p className="text-indigo-400/60 mb-8 font-medium text-sm tracking-widest uppercase"> Analyzing Structure & Extracting Data</p>

                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl text-left font-mono text-xs overflow-hidden h-48 flex flex-col-reverse relative group">
                        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
                        <div className="absolute inset-0 border border-indigo-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        {processingLog.map((l, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-emerald-400/90 mb-1 border-l-2 border-emerald-500/20 pl-2"
                            >
                                <span className="opacity-50 mr-2 text-slate-500">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                {'>'} {l}
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-center gap-3">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3], backgroundColor: ["#6366f1", "#10b981", "#6366f1"] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                className="w-1.5 h-1.5 rounded-full"
                            />
                        ))}
                    </div>

                    {/* Debug: Raw Text View */}
                    {rawText && (
                        <div className="mt-8 w-full max-w-2xl">
                            <button
                                onClick={() => setShowRaw(!showRaw)}
                                className="text-xs text-slate-500 hover:text-indigo-400 transition-colors underline mb-2 tracking-wider uppercase"
                            >
                                {showRaw ? "Hide Raw OCR Output" : "Show Raw OCR Output (Debug)"}
                            </button>
                            {showRaw && (
                                <div className="p-4 bg-black/50 text-emerald-400 font-mono text-xs rounded-lg max-h-60 overflow-auto whitespace-pre-wrap border border-white/10 shadow-inner">
                                    {rawText}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-deep)] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden text-white">
            {/* Ambient Void Background - Hyper Materiality */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[140px] saturate-[2]" />
                <div className="absolute top-[20%] -left-[10%] w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[140px] saturate-[2]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay saturate-[1.5]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 mb-16"
            >
                <motion.div
                    whileHover={{ scale: 1.05, rotate: 3, boxShadow: "0 0 80px -10px rgba(99,102,241,0.6)" }}
                    className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-3xl shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)] mb-8 text-white border border-white/10 backdrop-blur-md transition-shadow duration-500"
                >
                    <BrainCircuit size={48} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                </motion.div>

                <h1 className="font-black mb-6 tracking-[-0.03em] drop-shadow-2xl text-5xl sm:text-7xl md:text-8xl lg:text-9xl" style={{ lineHeight: 1 }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">NEURO</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 animate-gradient-x">EXAM</span>
                </h1>
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-slate-400 max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto font-light leading-relaxed tracking-[0.02em] px-4 opacity-80">
                    The Ultimate Text-to-Exam Engine. <br />
                    <span className="text-sm md:text-base font-bold text-indigo-500/90 mt-6 block uppercase tracking-[0.25em] border-t border-white/10 pt-6 mx-auto w-32 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                        System v2.0
                    </span>
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(79, 70, 229, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)" }}
                whileTap={{ scale: 0.96 }}
                className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-white/[0.03] backdrop-blur-[40px] backdrop-saturate-[1.5] p-6 sm:p-10 md:p-16 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.05] cursor-pointer transition-all ease-spring duration-500 group flex flex-col items-center mx-4 sm:mx-0 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] to-purple-500/[0.05] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Laser Scanning Beam */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_15px_rgba(99,102,241,0.8)] pointer-events-none" />

                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept=".txt,.pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.xls" />

                <div className="w-24 h-24 bg-black/20 rounded-full flex items-center justify-center mb-8 text-indigo-400 group-hover:text-white group-hover:scale-110 group-hover:bg-indigo-500 transition-all duration-500 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] border border-white/5 relative z-10 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    <Upload size={32} />
                </div>

                <h3 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 relative z-10 tracking-tight text-center">Upload Protocol</h3>
                <p className="text-slate-500 font-mono text-[10px] sm:text-xs md:text-sm group-hover:text-indigo-300 transition-colors relative z-10 uppercase tracking-widest text-center px-2">
                    Target: .txt, .pdf, Office, Images
                </p>
            </motion.div>

            {/* Optimized for very small screens */}
            <footer className="absolute bottom-4 md:bottom-6 text-white/10 text-[10px] md:text-xs font-mono tracking-widest uppercase text-center w-full px-4">
                Designed by Shahid Aktar Mir • God-Mode Active
            </footer>
        </div>
    );
}

export default LandingPage;
