import React, { useState, useEffect, useRef, useReducer } from 'react';
import { 
  Upload, FileText, CheckCircle, AlertCircle, Play, 
  Clock, ChevronRight, ChevronLeft, Flag, BarChart2, 
  Save, X, Cpu, FileSpreadsheet, File as FileIcon,
  Award, Target, Zap, Menu, Edit2, Check, Maximize2, Minimize2,
  Clipboard, RefreshCw, Moon, Sun, Shield, Database, Infinity, Image as ImageIcon,
  Loader2, Trophy, BrainCircuit, Sparkles, Activity
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

/**
 * ------------------------------------------------------------------
 * NEUROEXAM QUANTUM - V15.0 (ANALYZED & TAILORED FIX)
 * Architect: Senior System Designer
 * ------------------------------------------------------------------
 */

// --- CONFIGURATION ---
const GEMINI_API_KEY = "AIzaSyDdC7Ai73adw-p2XLlaX9Jou1i3xpCZ7_Q"; 

// --- DYNAMIC SCRIPT LOADERS ---
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadPDFJS = async () => {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return window.pdfjsLib;
};

const loadMammoth = async () => {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
  return window.mammoth;
};

const loadTesseract = async () => {
  await loadScript('https://unpkg.com/tesseract.js@v4.0.3/dist/tesseract.min.js');
  return window.Tesseract;
};

// --- GEMINI INTELLIGENCE ENGINE (The "Judge") ---
const callGeminiStructurer = async (rawText) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are an expert exam parser. Convert this raw text into a strict JSON array of question objects.
                        
                        Schema: 
                        [
                          { 
                            "id": number, 
                            "question": string, 
                            "options": [string, string, string, string], 
                            "correctAnswer": number (0 for A, 1 for B, 2 for C, 3 for D), 
                            "explanation": string (extract logic/reasoning if present, else empty) 
                          }
                        ]

                        Rules:
                        1. Extract ALL questions found (1 to 50+).
                        2. Support Bengali text and special characters.
                        3. If options are missing (e.g. One Word Substitution), generate 3 plausible distractors.
                        4. Identify correct answer from context or set to 0 if unknown.
                        5. Handle complex key formats like "1. A (Reason...)" or "A (Reason... 1)".
                        
                        Raw Text to Process:
                        ${rawText.substring(0, 30000)}` 
                    }]
                }]
            })
        });
        
        const data = await response.json();
        if (!data.candidates || !data.candidates[0].content) throw new Error("Gemini returned invalid structure");
        
        const jsonText = data.candidates[0].content.parts[0].text;
        const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Gemini Parsing Failed:", e);
        return [];
    }
};

// --- INTELLIGENT PARSING ENGINE V15 (TAILORED FOR YOUR DOCS) ---
class ParsingEngine {
  static cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\u00A0/g, ' ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();
  }

  static async parse(rawText, fileName = "") {
    const text = this.cleanText(rawText);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // 1. Detect Format
    const isCSV = fileName.toLowerCase().endsWith('.csv') || (lines[0] && lines[0].includes(','));
    
    if (isCSV) return this.parseCSV(lines);

    // 2. Try Tailored Heuristic Parsing (Standard & Coding formats)
    let questions = this.parseMCQ(lines);

    // 3. Intelligent Fallback (ONLY if extraction fails)
    if ((questions.length < 5 && text.length > 500) || questions.some(q => q.options.length < 2)) {
      console.log("Local parsing insufficient. Escalating to Gemini Core...");
      const aiQuestions = await callGeminiStructurer(text);
      if (aiQuestions && aiQuestions.length > 0) return aiQuestions;
    }

    return questions;
  }

  static parseCSV(lines) {
    const questions = [];
    const allAnswers = [];

    // Harvest Answers for Distractors (Specifically for "One Word" column)
    lines.forEach(line => {
       const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
       // Heuristic: Column 3 (Index 2) is "One Word" based on your file
       if (cols.length >= 3 && !cols[0].toLowerCase().includes('phrase')) {
           const ans = cols[2].replace(/"/g, '').trim();
           // Only keep clean answers
           if (ans && ans.length > 2 && !ans.toLowerCase().includes('one word')) allAnswers.push(ans);
       }
    });

    // Build Questions
    lines.forEach((line, idx) => {
        if (idx === 0) return; 
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (cols.length >= 3) {
            const questionText = cols[1].replace(/"/g, '').trim(); // Phrase
            const correctAns = cols[2].replace(/"/g, '').trim();   // One Word
            const explanation = cols[5] ? cols[5].replace(/"/g, '').trim() : ""; // Example Sentence

            if (!questionText || !correctAns) return;

            // Generate 3 Random Distractors from the pool we harvested
            const distractors = [];
            let attempts = 0;
            while(distractors.length < 3 && attempts < 50) {
                const rand = allAnswers[Math.floor(Math.random() * allAnswers.length)];
                if (rand && rand !== correctAns && !distractors.includes(rand)) distractors.push(rand);
                attempts++;
            }
            while(distractors.length < 3) distractors.push("N/A"); 
            
            const options = [correctAns, ...distractors].sort(() => 0.5 - Math.random());

            questions.push({
                id: questions.length + 1,
                question: `Substitute one word for: "${questionText}"`,
                options: options,
                correctAnswer: options.indexOf(correctAns),
                explanation: explanation
            });
        }
    });
    return questions;
  }

  static parseMCQ(lines) {
    let questions = [];
    let currentQ = null;
    let answerMap = {}; 
    let explanationMap = {};
    
    // --- TAILORED REGEX FOR YOUR FILE ---
    // Matches "Q1.", "Q2." but NOT "2." if it's part of an answer key later
    // Your doc uses "Q1.", "Q2." for questions.
    const qStartRegex = /^(?:Q|Question)\s*(\d+)[\.:\)\s]\s+(.+)/i;
    // Fallback for just "1." start (common in pasting)
    const qStartSimpleRegex = /^(\d+)[\.:\)]\s+(.+)/;

    const optStartRegex = /^[\(\[]?([A-D]|[a-d])[\)\.\]]\s+(.+)/;
    const inlineOptRegex = /([A-D]|[a-d])[\)\.\]]\s+([^A-D\n]+)/g;

    // YOUR SPECIFIC ANSWER KEY PATTERNS
    // Pattern 1: "35. A (His - 'Everyone' takes...)" -> Key + Explanation
    // Pattern 2: "36. B (Subjective 32)" -> Key + Explanation
    const keyPattern = /^(\d+)[\.:\s]*([A-D])\s*(\(.*\))?/i;

    // Scan for Answer Keys FIRST (Since they are at the end)
    lines.forEach(line => {
        let m = line.match(keyPattern);
        if (m) {
            const id = parseInt(m[1]);
            const char = m[2].toUpperCase();
            answerMap[id] = char.charCodeAt(0) - 65;
            if (m[3]) {
                explanationMap[id] = m[3].replace(/[\(\)]/g, '').trim();
            }
        }
    });

    lines.forEach(line => {
      // Ignore page headers
      if (line.includes('--- PAGE') || line.includes('ULTIMATE MOCK TEST')) return;

      // 1. Detect Questions
      let qMatch = line.match(qStartRegex) || line.match(qStartSimpleRegex);
      
      // Heuristic: Avoid matching the Answer Key lines as Questions!
      // If a line matches "35. A (His...)", it's a key, not a question.
      // So if the line starts with a number but immediately follows with A/B/C/D, skip it here.
      if (qMatch && !line.match(/^\d+[\.:\s]*[A-D]\s/)) { 
          if (qMatch[2].length > 5) { // Must have some text length
              if (currentQ) {
                this.finalizeQuestion(currentQ);
                questions.push(currentQ);
              }
              currentQ = {
                id: parseInt(qMatch[1]),
                question: qMatch[2],
                options: [],
                correctAnswer: 0, 
                explanation: ""
              };
              return;
          }
      }

      // 2. Detect Options
      if (currentQ) {
        // Inline options
        const inlineMatches = [...line.matchAll(inlineOptRegex)];
        if (inlineMatches.length > 1) {
           inlineMatches.forEach(m => currentQ.options.push(m[2].trim()));
           return;
        }
        // Line options
        const optMatch = line.match(optStartRegex);
        if (optMatch) {
          currentQ.options.push(optMatch[2].trim());
        } else {
          // Contextual Append
          if (currentQ.options.length > 0) {
            currentQ.options[currentQ.options.length - 1] += " " + line;
          } else {
            currentQ.question += " " + line;
          }
        }
      }
    });

    if (currentQ) {
      this.finalizeQuestion(currentQ);
      questions.push(currentQ);
    }

    // Merge Extracted Keys
    questions.forEach(q => {
      if (answerMap[q.id] !== undefined) q.correctAnswer = answerMap[q.id];
      if (explanationMap[q.id] !== undefined) q.explanation = explanationMap[q.id];
    });

    return questions;
  }

  static finalizeQuestion(q) {
    if (q.options.length === 0) {
       q.options = ["Option A", "Option B", "Option C", "Option D"];
    }
  }
}

// --- STATE MANAGEMENT ---
const initialState = {
  appState: 'LANDING',
  questions: [],
  processingLog: [],
  rawInput: "",
  isPasteMode: false,
  isLoading: false,
  exam: { currentIndex: 0, answers: {}, flags: {}, timeLeft: 0, startTime: null, endTime: null }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE': return { ...state, appState: action.payload };
    case 'SET_QUESTIONS': return { ...state, questions: action.payload };
    case 'ADD_LOG': return { ...state, processingLog: [...state.processingLog, action.payload] };
    case 'CLEAR_LOGS': return { ...state, processingLog: [] };
    case 'SET_INPUT': return { ...state, rawInput: action.payload };
    case 'TOGGLE_PASTE': return { ...state, isPasteMode: action.payload };
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'START_EXAM': 
      return { 
        ...state, 
        appState: 'EXAM', 
        exam: { ...initialState.exam, timeLeft: state.questions.length * 60, startTime: Date.now() } 
      };
    case 'ANSWER':
      return { ...state, exam: { ...state.exam, answers: { ...state.exam.answers, [action.payload.id]: action.payload.option } } };
    case 'FLAG':
      return { ...state, exam: { ...state.exam, flags: { ...state.exam.flags, [action.payload]: !state.exam.flags[action.payload] } } };
    case 'NAVIGATE':
      return { ...state, exam: { ...state.exam, currentIndex: action.payload } };
    case 'TICK':
      return { ...state, exam: { ...state.exam, timeLeft: Math.max(0, state.exam.timeLeft - 1) } };
    case 'FINISH':
      return { ...state, appState: 'RESULT', exam: { ...state.exam, endTime: Date.now() } };
    case 'RESET': return initialState;
    default: return state;
  }
}

// --- MAIN COMPONENT ---
export default function NeuroExamApp() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const fileInputRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- ACTIONS ---
  const handleFile = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      dispatch({ type: 'SET_STATE', payload: 'PARSING' });
      dispatch({ type: 'CLEAR_LOGS' });
      const log = msg => dispatch({ type: 'ADD_LOG', payload: msg });
      
      log(`Initializing Quantum Core...`);
      log(`Detected: ${file.name}`);
      
      try {
          let text = "";
          // PDF
          if (file.name.endsWith('.pdf')) {
              log("Loading PDF Engine...");
              await loadPDFJS();
              const buffer = await file.arrayBuffer();
              const pdf = await window.pdfjsLib.getDocument(buffer).promise;
              for(let i=1; i<=pdf.numPages; i++) {
                  log(`Scanning Page ${i}...`);
                  const page = await pdf.getPage(i);
                  const content = await page.getTextContent();
                  text += content.items.map(item => item.str).join('\n') + '\n';
              }
          } 
          // DOCX
          else if (file.name.endsWith('.docx')) {
              log("Loading Word Engine...");
              await loadMammoth();
              const buffer = await file.arrayBuffer();
              const res = await window.mammoth.extractRawText({ arrayBuffer: buffer });
              text = res.value;
          }
          // IMAGE
          else if (file.name.match(/\.(jpg|png|jpeg)$/i)) {
              log("Activating Vision Core (OCR)...");
              await loadTesseract();
              const { data } = await window.Tesseract.recognize(file, 'eng+ben', {
                  logger: m => m.status === 'recognizing text' && log(`OCR: ${Math.round(m.progress * 100)}%`)
              });
              text = data.text;
          }
          // TEXT/CSV
          else {
              text = await new Promise(r => {
                  const reader = new FileReader();
                  reader.onload = e => r(e.target.result);
                  reader.readAsText(file);
              });
          }

          log("Applying Heuristic Extraction...");
          const questions = await ParsingEngine.parse(text, file.name);
          
          if (questions.length > 0) {
              log(`Success! ${questions.length} Items Extracted.`);
              setTimeout(() => {
                  dispatch({ type: 'SET_QUESTIONS', payload: questions });
                  dispatch({ type: 'SET_STATE', payload: 'REVIEW' });
              }, 1000);
          } else {
              throw new Error("Extraction failed. Try Magic Paste.");
          }

      } catch (err) {
          log("Error: " + err.message);
          setTimeout(() => {
              alert("Processing failed. Please use 'Magic Paste'.");
              dispatch({ type: 'SET_STATE', payload: 'LANDING' });
          }, 2000);
      }
  };

  const handlePasteAnalyze = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const questions = await ParsingEngine.parse(state.rawInput);
      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (questions.length > 0) {
          dispatch({ type: 'SET_QUESTIONS', payload: questions });
          dispatch({ type: 'SET_STATE', payload: 'REVIEW' });
          dispatch({ type: 'TOGGLE_PASTE', payload: false });
      } else {
          alert("Parsing failed. Please ensure text is structured.");
      }
  };

  useEffect(() => {
    let timer;
    if (state.appState === 'EXAM' && state.exam.timeLeft > 0) {
      timer = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    } else if (state.exam.timeLeft === 0 && state.appState === 'EXAM') {
      dispatch({ type: 'FINISH' });
    }
    return () => clearInterval(timer);
  }, [state.appState, state.exam.timeLeft]);

  // --- RENDERERS ---

  if (state.appState === 'LANDING') {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
              <div className="mb-12 animate-fade-in-up">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl shadow-xl mb-6 text-white">
                      <BrainCircuit size={40} />
                  </div>
                  <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">
                      NEURO<span className="text-indigo-600">EXAM</span>
                  </h1>
                  <p className="text-xl text-slate-500 max-w-xl mx-auto">
                      Drop any file. Get a perfect exam instantly.
                  </p>
              </div>

              <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="flex-1 bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-indigo-500 cursor-pointer transition-all group hover:-translate-y-1"
                  >
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept=".pdf,.docx,.txt,.csv,.xlsx,.jpg,.png" />
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform mx-auto">
                          <Upload size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Smart Upload</h3>
                      <p className="text-slate-400 text-sm mt-2">PDF, DOCX, CSV, Image</p>
                  </div>

                  <div 
                    onClick={() => dispatch({ type: 'TOGGLE_PASTE', payload: true })}
                    className="flex-1 bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-violet-500 cursor-pointer transition-all group hover:-translate-y-1"
                  >
                      <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 text-violet-600 group-hover:scale-110 transition-transform mx-auto">
                          <Zap size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Magic Paste</h3>
                      <p className="text-slate-400 text-sm mt-2">Paste Text Directly</p>
                  </div>
              </div>

              {state.isPasteMode && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                  <Clipboard className="text-indigo-600"/> Paste Content
                              </h2>
                              <button onClick={() => dispatch({ type: 'TOGGLE_PASTE', payload: false })}><X className="text-slate-400"/></button>
                          </div>
                          <textarea 
                              className="flex-1 p-6 resize-none outline-none font-mono text-sm bg-slate-50"
                              placeholder="Paste your questions here..."
                              value={state.rawInput}
                              onChange={e => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
                          />
                          <div className="p-6 border-t border-slate-100 flex justify-end gap-4">
                              <button 
                                onClick={handlePasteAnalyze} 
                                disabled={state.isLoading}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                              >
                                  {state.isLoading ? <Loader2 className="animate-spin"/> : <Play size={18}/>} Analyze
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )
  }

  if (state.appState === 'PARSING') {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-mono">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-8" />
              <h2 className="text-2xl font-bold mb-4">Processing Document...</h2>
              <div className="w-96 h-64 bg-slate-800 rounded-xl p-4 font-mono text-xs text-green-400 overflow-hidden flex flex-col-reverse">
                  {state.processingLog.map((l, i) => <div key={i}>{'>'} {l}</div>)}
              </div>
          </div>
      )
  }

  if (state.appState === 'REVIEW') {
      return (
          <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
              <div className="max-w-5xl mx-auto">
                  <header className="flex justify-between items-center mb-8">
                      <h1 className="text-3xl font-bold text-slate-900">Review ({state.questions.length} Questions)</h1>
                      <div className="flex gap-4">
                          <button onClick={() => dispatch({ type: 'SET_STATE', payload: 'LANDING' })} className="px-6 py-2 text-slate-500 font-bold">Discard</button>
                          <button onClick={() => dispatch({ type: 'START_EXAM' })} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-200 hover:-translate-y-1 transition-all">Start Exam</button>
                      </div>
                  </header>
                  <div className="grid gap-4">
                      {state.questions.map((q, i) => (
                          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                              <div className="flex justify-between mb-4">
                                  <span className="font-bold text-slate-400 text-xs">Q{i+1}</span>
                                  {q.explanation && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Logic Found</span>}
                              </div>
                              <p className="text-lg font-medium text-slate-800 mb-4">{q.question}</p>
                              <div className="grid grid-cols-2 gap-3">
                                  {q.options.map((opt, oi) => (
                                      <div key={oi} className={`p-3 rounded-lg border text-sm ${oi === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100'}`}>
                                          {opt}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )
  }

  if (state.appState === 'EXAM') {
      const q = state.questions[state.exam.currentIndex];
      return (
          <div className="h-screen bg-slate-50 flex flex-col font-sans">
              <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                  <span className="font-black text-xl text-slate-900">NEURO<span className="text-indigo-600">EXAM</span></span>
                  <div className="flex items-center gap-4">
                      <div className="font-mono font-bold text-lg text-indigo-600">
                          {Math.floor(state.exam.timeLeft / 60)}:{String(state.exam.timeLeft % 60).padStart(2, '0')}
                      </div>
                      <button onClick={() => dispatch({ type: 'FINISH' })} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm">Finish</button>
                  </div>
              </header>
              <div className="flex flex-1 overflow-hidden">
                  <main className="flex-1 p-8 overflow-y-auto">
                      <div className="max-w-3xl mx-auto pb-20">
                          <div className="mb-8">
                              <span className="text-xs font-bold text-slate-400 uppercase">Question {state.exam.currentIndex + 1}</span>
                              <h2 className="text-2xl font-bold text-slate-800 mt-2">{q.question}</h2>
                          </div>
                          <div className="grid gap-3">
                              {q.options.map((opt, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => dispatch({ type: 'ANSWER', payload: { id: q.id, option: i } })}
                                    className={`p-5 rounded-xl border-2 text-left transition-all ${state.exam.answers[q.id] === i ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 hover:border-indigo-300'}`}
                                  >
                                      {opt}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </main>
                  <aside className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto hidden lg:block">
                      <div className="grid grid-cols-5 gap-2">
                          {state.questions.map((_, i) => (
                              <button 
                                key={i}
                                onClick={() => dispatch({ type: 'NAVIGATE', payload: i })}
                                className={`aspect-square rounded-lg font-bold text-xs ${i === state.exam.currentIndex ? 'bg-slate-900 text-white' : state.exam.answers[state.questions[i].id] !== undefined ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                              >
                                  {i + 1}
                              </button>
                          ))}
                      </div>
                  </aside>
              </div>
              <footer className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-8">
                  <button onClick={() => dispatch({ type: 'NAVIGATE', payload: Math.max(0, state.exam.currentIndex - 1) })} disabled={state.exam.currentIndex===0} className="px-6 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 disabled:opacity-50">Prev</button>
                  <button onClick={() => dispatch({ type: 'NAVIGATE', payload: Math.min(state.questions.length-1, state.exam.currentIndex + 1) })} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200">Next</button>
              </footer>
          </div>
      )
  }

  if (state.appState === 'RESULT') {
      const correct = state.questions.filter(q => state.exam.answers[q.id] === q.correctAnswer).length;
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
              <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full">
                  <Trophy size={64} className="text-yellow-500 mx-auto mb-6" />
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Exam Complete</h1>
                  <div className="text-6xl font-black text-indigo-600 my-8">{correct} <span className="text-2xl text-slate-300">/ {state.questions.length}</span></div>
                  <button onClick={() => dispatch({ type: 'RESET' })} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg">New Assessment</button>
              </div>
          </div>
      )
  }

  return null;
}