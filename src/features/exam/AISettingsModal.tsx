import { useState } from 'react';
import { X, Key, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useExamStore } from './store';
import { Button } from '../../shared/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { GeminiService } from '../../shared/lib/gemini';

export function AISettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { apiKey, setApiKey } = useExamStore();
    const [inputKey, setInputKey] = useState(apiKey || '');
    const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleVerify = async () => {
        const cleanKey = inputKey.trim();
        if (!cleanKey) return;

        setStatus('VERIFYING');
        setErrorMessage('');

        const service = new GeminiService(cleanKey);
        const result = await service.verifyKey();

        if (result.valid) {
            setStatus('SUCCESS');
            setApiKey(cleanKey);
            setTimeout(() => {
                onClose();
                setStatus('IDLE');
            }, 1000);
        } else {
            setStatus('ERROR');
            setErrorMessage(result.error || 'Invalid API Key');
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
                        <div className="bg-white pointer-events-auto rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-indigo-100">
                            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <Sparkles size={100} />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-black tracking-tight mb-2">Connect AI</h2>
                                    <p className="text-indigo-100 font-medium text-sm">Enter your Gemini API Key to enable super-powers.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-white/70 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Gemini API Key
                                        <a
                                            href="https://aistudio.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 text-xs font-normal text-indigo-600 hover:text-indigo-800 underline"
                                        >
                                            (Get a new key here)
                                        </a>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Key size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            value={inputKey}
                                            onChange={(e) => setInputKey(e.target.value)}
                                            placeholder="AIzaSy..."
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        Your key is stored locally in your browser. We never see it.
                                    </p>
                                </div>

                                {status === 'ERROR' && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-start gap-2 animate-in slide-in-from-top-2 break-all">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>{errorMessage || "Invalid API Key. Please try again."}</span>
                                    </div>
                                )}
                                {status === 'SUCCESS' && (
                                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                                        <CheckCircle size={16} /> Connected Successfully!
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                                        onClick={handleVerify}
                                        disabled={status === 'VERIFYING' || !inputKey}
                                    >
                                        {status === 'VERIFYING' ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                                        ) : (
                                            "Save & Connect"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
