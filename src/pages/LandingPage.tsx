import { useRef } from 'react';
import { Upload, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';

import { motion } from 'framer-motion';

export function LandingPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const text = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    const content = e.target?.result;
                    if (typeof content === 'string') resolve(content);
                    else reject(new Error("Failed to read file content"));
                };
                reader.onerror = () => reject(new Error("File reading failed"));
                reader.readAsText(file);
            });

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
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-mono p-4 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden opacity-20">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[120px] animate-pulse" />
                </div>

                <div className="relative z-10 w-full max-w-lg text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="inline-block mb-8"
                    >
                        <svg className="w-24 h-24 text-indigo-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
                            <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>

                    <h2 className="text-3xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white">
                        Processing Exam...
                    </h2>
                    <p className="text-slate-400 mb-8 font-medium"> analyzing structure & extracting questions</p>

                    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-2xl text-left font-mono text-xs overflow-hidden h-48 flex flex-col-reverse relative">
                        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-800/90 to-transparent pointer-events-none" />
                        {processingLog.map((l, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-emerald-400/90 mb-1"
                            >
                                <span className="opacity-50 mr-2 opacity-50 text-slate-500">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                {'>'} {l}
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-center gap-2">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className="w-2 h-2 rounded-full bg-indigo-500"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30 pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] min-w-[300px] min-h-[300px] rounded-full bg-indigo-200 blur-[80px] md:blur-[120px] mix-blend-multiply filter animate-blob"></div>
                <div className="absolute top-[20%] -left-[10%] w-[40vw] h-[40vw] min-w-[250px] min-h-[250px] rounded-full bg-purple-200 blur-[80px] md:blur-[120px] mix-blend-multiply filter animate-blob animation-delay-2000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 mb-12"
            >
                <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl shadow-2xl mb-8 text-white skew-y-3 cursor-default"
                >
                    <BrainCircuit size={40} className="md:w-12 md:h-12" />
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter drop-shadow-sm">
                    NEURO<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">EXAM</span>
                </h1>
                <p className="text-lg md:text-2xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
                    The Ultimate Text-to-Exam Engine. <br />
                    <span className="text-sm md:text-lg font-bold text-indigo-600 mt-4 block uppercase tracking-widest">
                        Architected by Shahid Aktar Mir
                    </span>
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                whileTap={{ scale: 0.98 }}
                className="relative z-10 w-full max-w-lg bg-white/80 backdrop-blur-xl p-8 md:p-16 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 cursor-pointer transition-colors group flex flex-col items-center"
            >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept=".txt" />
                <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-600 transition-transform duration-300">
                    <Upload size={32} className="md:w-10 md:h-10" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Upload Exam File</h3>
                <p className="text-slate-400 font-mono text-xs md:text-sm group-hover:text-indigo-500 transition-colors">Supported: .txt (Q1... Format)</p>
            </motion.div>
        </div>
    );
}
