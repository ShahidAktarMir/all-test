import { useRef } from 'react';
import { Upload, BrainCircuit, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../features/exam/store';
import { ParsingEngine } from '../shared/lib/utils';
import { motion } from 'framer-motion';

export function LandingPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setQuestions, addLog, processingLog, status, setStatus } = useExamStore();

    const handleFile = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        setStatus('PARSING');
        addLog(`Reading ${file.name}...`);

        try {
            const text = await new Promise<string>(r => {
                const reader = new FileReader();
                reader.onload = e => r(e.target?.result as string);
                reader.readAsText(file);
            });

            addLog("Analyzing Block Structure...");
            const questions = await ParsingEngine.parse(text);

            if (questions.length > 0) {
                addLog(`Success: ${questions.length} Questions Found.`);
                setTimeout(() => {
                    setQuestions(questions);
                    navigate('/review');
                }, 800);
            } else {
                throw new Error("No valid question blocks found.");
            }

        } catch (err: any) {
            console.error(err);
            alert("Parsing Failed: " + err.message);
            setStatus('IDLE');
        }
    };

    if (status === 'PARSING') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-mono p-4">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-8" />
                <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">Processing Exam File...</h2>
                <div className="w-full max-w-md h-64 bg-slate-800 rounded-xl p-4 font-mono text-xs text-green-400 overflow-hidden flex flex-col-reverse shadow-2xl border border-slate-700">
                    {processingLog.map((l, i) => <div key={i}>{'>'} {l}</div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30 pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full bg-indigo-200 blur-3xl mix-blend-multiply filter animate-blob"></div>
                <div className="absolute top-[20%] -left-[10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] rounded-full bg-purple-200 blur-3xl mix-blend-multiply filter animate-blob animation-delay-2000"></div>
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
