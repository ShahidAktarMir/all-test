import { useState, useEffect, useRef, useReducer } from 'react';
import {
  Upload, X, Check, RefreshCw, Loader2, Trophy, BrainCircuit, Sparkles, Activity, Pause, PlayCircle, Target
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

/**
 * ------------------------------------------------------------------
 * NEUROEXAM QUANTUM - TEXT-ONLY EDITION (BLOCK PARSER V2)
 * Architect: Senior System Designer
 * ------------------------------------------------------------------
 */

// --- INTELLIGENT PARSING ENGINE (BLOCK PARSER V2) ---
class ParsingEngine {
  static cleanText(text: string) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\u00A0/g, ' ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();
  }

  static async parse(rawText: string) {
    const text = this.cleanText(rawText);

    // Try JSON Parse first (in case user uploads a JSON export)
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) return json;
    } catch (e) {
      // Not JSON, proceed to Text Parsing
    }

    // BLOCK PARSER V2: Targets Q... A)... Correct Answer... Explanation...
    // We split by "Q" followed by a number to identify blocks
    const questions: any[] = [];

    // Split text into potential question blocks based on "Q" followed by number
    // Regex lookahead: split when we see a newline followed by Q and a number
    const blocks = text.split(/\n(?=Q\d+[\.:\)\s])/i);

    blocks.forEach((block: string) => {
      if (!block.trim()) return;

      const q = this.parseBlock(block);
      if (q) questions.push(q);
    });

    return questions;
  }

  static parseBlock(blockText: string) {
    const lines = blockText.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 3) return null;

    const questionObj: any = {
      id: 0,
      question: "",
      options: [],
      correctAnswer: 0,
      explanation: ""
    };

    // 1. Extract Question Text
    // Matches "Q1. Text..." or "Q1: Text..."
    const qMatch = lines[0].match(/^Q(\d+)[\.:\)\s]\s*(.+)/i);
    if (!qMatch) return null; // Not a valid question block

    questionObj.id = parseInt(qMatch[1]);
    questionObj.question = qMatch[2];

    // 2. Scan lines for Options, Answer, Explanation
    let mode: string = 'OPTIONS'; // OPTIONS | ANSWER | EXPLANATION

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Detect "Correct Answer:"
      if (line.match(/^Correct Answer:/i)) {
        const ansChar = line.split(':')[1].trim().charAt(0).toUpperCase();
        questionObj.correctAnswer = ansChar.charCodeAt(0) - 65; // A=0, B=1...
        mode = 'ANSWER_FOUND';
        continue;
      }

      // Detect "Explanation:"
      if (line.match(/^Explanation:/i)) {
        questionObj.explanation = line.replace(/^Explanation:\s*/i, '');
        mode = 'EXPLANATION';
        continue;
      }

      // Capture Options (A) ... B) ...)
      if ((mode as string) === 'OPTIONS' || (mode as string) === 'ANSWER_FOUND') { // sometimes options continue
        const optMatch = line.match(/^([A-D])[\)\.]\s+(.+)/i);
        if (optMatch) {
          questionObj.options.push(optMatch[2]);
        } else if (mode === 'EXPLANATION') {
          // Append to explanation
          questionObj.explanation += " " + line;
        } else if (questionObj.options.length > 0) {
          // Append to last option
          questionObj.options[questionObj.options.length - 1] += " " + line;
        } else {
          // Append to question text
          questionObj.question += " " + line;
        }
      } else if (mode === 'EXPLANATION') {
        questionObj.explanation += " " + line;
      }
    }

    // Validation
    if (questionObj.options.length < 2) return null; // Need at least 2 options
    if (questionObj.correctAnswer < 0 || questionObj.correctAnswer > 3) questionObj.correctAnswer = 0; // Default

    return questionObj;
  }
}

// --- STATE MANAGEMENT ---
const initialState = {
  appState: 'LANDING',
  questions: [],
  processingLog: [],
  isLoading: false,
  exam: {
    currentIndex: 0,
    answers: {},
    flags: {},
    visited: {},
    marked: {},
    timeLeft: 0,
    startTime: null,
    endTime: null,
    isPaused: false // Added pause state
  }
};

function appReducer(state: any, action: any) {
  switch (action.type) {
    case 'SET_STATE': return { ...state, appState: action.payload };
    case 'SET_QUESTIONS': return { ...state, questions: action.payload };
    case 'ADD_LOG': return { ...state, processingLog: [...state.processingLog, action.payload] };
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'START_EXAM':
      return {
        ...state,
        appState: 'EXAM',
        exam: {
          ...initialState.exam,
          timeLeft: state.questions.length * 60,
          startTime: Date.now(),
          visited: { 0: true }
        }
      };
    case 'ANSWER':
      return {
        ...state,
        exam: {
          ...state.exam,
          answers: { ...state.exam.answers, [action.payload.id]: action.payload.option },
          visited: { ...state.exam.visited, [state.exam.currentIndex]: true }
        }
      };
    case 'CLEAR_RESPONSE':
      const newAnswers = { ...state.exam.answers };
      delete newAnswers[action.payload];
      return {
        ...state,
        exam: {
          ...state.exam,
          answers: newAnswers
        }
      };
    case 'MARK_REVIEW':
      return {
        ...state,
        exam: {
          ...state.exam,
          marked: { ...state.exam.marked, [action.payload]: !state.exam.marked[action.payload] }
        }
      };
    case 'NAVIGATE':
      return {
        ...state,
        exam: {
          ...state.exam,
          currentIndex: action.payload,
          visited: { ...state.exam.visited, [action.payload]: true }
        }
      };
    case 'TICK':
      if (state.exam.isPaused) return state; // Do not tick if paused
      return { ...state, exam: { ...state.exam, timeLeft: Math.max(0, state.exam.timeLeft - 1) } };
    case 'TOGGLE_PAUSE': // Added toggle pause
      return { ...state, exam: { ...state.exam, isPaused: !state.exam.isPaused } };
    case 'FINISH':
      return { ...state, appState: 'RESULT', exam: { ...state.exam, endTime: Date.now() } };
    case 'RESET': return initialState;
    default: return state;
  }
}

// --- MAIN COMPONENT ---
export default function NeuroExamApp() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_mobileMenuOpen, _setMobileMenuOpen] = useState(false);
  const [resultFilter, setResultFilter] = useState('ALL'); // ALL, CORRECT, INCORRECT, SKIPPED

  // --- ACTIONS ---
  const handleFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    dispatch({ type: 'SET_STATE', payload: 'PARSING' });
    dispatch({ type: 'ADD_LOG', payload: `Reading ${file.name}...` });

    try {
      const text = await new Promise<string>(r => {
        const reader = new FileReader();
        reader.onload = e => r(e.target?.result as string);
        reader.readAsText(file);
      });

      dispatch({ type: 'ADD_LOG', payload: "Analyzing Block Structure..." });
      const questions = await ParsingEngine.parse(text);

      if (questions.length > 0) {
        dispatch({ type: 'ADD_LOG', payload: `Success: ${questions.length} Questions Found.` });
        setTimeout(() => {
          dispatch({ type: 'SET_QUESTIONS', payload: questions });
          dispatch({ type: 'SET_STATE', payload: 'REVIEW' });
        }, 800);
      } else {
        throw new Error("No valid question blocks found (Format: Q1... A)... Correct Answer:)");
      }

    } catch (err) {
      console.error(err);
      alert("Parsing Failed: Ensure your TXT file follows the format: Q1... A)... Correct Answer:...");
      dispatch({ type: 'SET_STATE', payload: 'LANDING' });
    }
  };

  useEffect(() => {
    let timer: any;
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
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl shadow-xl mb-6 text-white">
            <BrainCircuit size={40} />
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">
            NEURO<span className="text-indigo-600">EXAM</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-xl mx-auto">
            Text-Only Edition. <br />
            <span className="text-sm font-bold text-indigo-500 mt-2 block">Upload .TXT &rarr; Get Exam</span>
          </p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-md bg-white p-12 rounded-[2rem] shadow-2xl border-2 border-dashed border-slate-200 hover:border-indigo-500 cursor-pointer transition-all group hover:-translate-y-2 flex flex-col items-center"
        >
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept=".txt" />
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
            <Upload size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Upload Exam File</h3>
          <p className="text-slate-400 mt-2 font-mono text-sm">Format: .txt only</p>
        </div>
      </div>
    )
  }

  if (state.appState === 'PARSING') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-mono">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-8" />
        <h2 className="text-2xl font-bold mb-4">Parsing Text Blocks...</h2>
        <div className="w-96 h-64 bg-slate-800 rounded-xl p-4 font-mono text-xs text-green-400 overflow-hidden flex flex-col-reverse">
          {state.processingLog.map((l: string, i: number) => <div key={i}>{'>'} {l}</div>)}
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
            {state.questions.map((q: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-slate-400 text-xs">Q{i + 1}</span>
                </div>
                <p className="text-lg font-medium text-slate-800 mb-4">{q.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt: string, oi: number) => (
                    <div key={oi} className={`p-3 rounded-lg border text-sm ${oi === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100'}`}>
                      {opt}      </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-indigo-600 font-medium">
                    Explanation: {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- EXAM (TCS REPLICA UI) ---
  if (state.appState === 'EXAM') {
    const q = state.questions[state.exam.currentIndex];
    // const isAnswered = state.exam.answers[q.id] !== undefined;
    const isMarked = state.exam.marked[q.id];
    const isPaused = state.exam.isPaused;

    // Pause Overlay
    if (isPaused) {
      return (
        <div className="h-screen bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 fixed inset-0">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md animate-in zoom-in duration-300">
            <Pause size={48} className="text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Exam Paused</h2>
            <p className="text-slate-500 mb-6">Take a break. Your time is stopped.</p>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <PlayCircle size={20} /> Resume Exam
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen bg-white flex flex-col font-sans text-sm select-none">
        {/* HEADER */}
        <header className="h-14 bg-white border-b border-gray-300 flex items-center justify-between px-4 shadow-sm z-20">
          <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm">SSC CGL</span> Exam
          </div>
          <div className="flex items-center gap-4">
            <div className="text-gray-600 font-medium text-xs uppercase tracking-wider">Time Left</div>
            <div className={`px-4 py-1.5 rounded font-mono font-bold text-lg ${state.exam.timeLeft < 300 ? 'bg-red-600 text-white animate-pulse' : 'bg-black text-white'}`}>
              {Math.floor(state.exam.timeLeft / 60)}:{String(state.exam.timeLeft % 60).padStart(2, '0')}
            </div>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Pause Exam"
            >
              <Pause size={20} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* MAIN QUESTION AREA */}
          <main className="flex-1 flex flex-col h-full border-r border-gray-300 relative">
            {/* Question Header */}
            <div className="bg-blue-50 border-b border-gray-300 p-3 px-6 flex justify-between items-center font-bold text-gray-700 shadow-sm">
              <span>Question No. {state.exam.currentIndex + 1}</span>
              <div className="flex gap-4 text-xs">
                <span className="text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200">+2.0 Marks</span>
                <span className="text-red-700 bg-red-100 px-2 py-1 rounded border border-red-200">-0.5 Negative</span>
              </div>
            </div>

            {/* Scrollable Question Content */}
            <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
              <div className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">
                {q.question}
              </div>
              <div className="space-y-4">
                {q.options.map((opt: string, i: number) => {
                  const isSelected = state.exam.answers[q.id] === i;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                      onClick={() => dispatch({ type: 'ANSWER', payload: { id: q.id, option: i } })}
                    >
                      <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-600' : 'border-gray-400'}`}>
                        {isSelected && <div className="h-2.5 w-2.5 bg-blue-600 rounded-full" />}
                      </div>
                      <div className="text-gray-800 text-lg">
                        <span className="font-bold text-gray-500 mr-3">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <footer className="h-20 border-t border-gray-300 bg-white px-6 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <div className="flex gap-3">
                <button
                  onClick={() => dispatch({ type: 'MARK_REVIEW', payload: q.id })}
                  className="px-6 py-2.5 border-2 border-purple-600 text-purple-700 rounded-lg hover:bg-purple-50 font-bold transition-colors"
                >
                  {isMarked ? 'Unmark Review' : 'Mark for Review'}
                </button>
                <button
                  onClick={() => dispatch({ type: 'CLEAR_RESPONSE', payload: q.id })}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 font-bold transition-colors"
                >
                  Clear Response
                </button>
              </div>
              <button
                onClick={() => dispatch({ type: 'NAVIGATE', payload: Math.min(state.questions.length - 1, state.exam.currentIndex + 1) })}
                className="px-10 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition-transform active:scale-95"
              >
                Save & Next
              </button>
            </footer>
          </main>

          {/* SIDEBAR PALETTE */}
          <aside className="w-80 bg-blue-50 flex flex-col h-full shadow-inner border-l border-gray-300">
            <div className="p-4 border-b border-gray-300 bg-white">
              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <div className="flex items-center gap-2"><span className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-lg shadow-sm">{Object.keys(state.exam.answers).length}</span> Answered</div>
                <div className="flex items-center gap-2"><span className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg shadow-sm">{Object.keys(state.exam.visited).length - Object.keys(state.exam.answers).length}</span> Not Answered</div>
                <div className="flex items-center gap-2"><span className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 border border-gray-300 rounded-lg"> {state.questions.length - Object.keys(state.exam.visited).length} </span> Not Visited</div>
                <div className="flex items-center gap-2"><span className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-lg shadow-sm">{Object.values(state.exam.marked).filter(Boolean).length}</span> Marked</div>
              </div>
            </div>

            <div className="bg-blue-100/50 p-3 font-bold text-gray-700 border-b border-blue-200 text-sm uppercase tracking-wide">
              Question Palette
            </div>

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <div className="grid grid-cols-4 gap-2.5">
                {state.questions.map((_: any, i: number) => {
                  const qId = state.questions[i].id;
                  const ans = state.exam.answers[qId] !== undefined;
                  const mark = state.exam.marked[qId];
                  const visit = state.exam.visited[i];
                  const current = i === state.exam.currentIndex;

                  // TCS Logic Colors
                  let bgClass = "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"; // Not Visited
                  if (visit && !ans) bgClass = "bg-red-500 text-white border-red-600"; // Not Answered (Red)
                  if (ans) bgClass = "bg-green-500 text-white border-green-600"; // Answered (Green)
                  if (mark && !ans) bgClass = "bg-purple-600 text-white border-purple-700"; // Marked (Purple)
                  if (mark && ans) bgClass = "bg-purple-600 text-white border-purple-700 relative after:content-['✓'] after:absolute after:-top-1 after:-right-1 after:text-green-400 after:text-sm after:bg-white after:rounded-full after:w-3 after:h-3 after:flex after:items-center after:justify-center"; // Ans & Marked

                  if (!visit) bgClass = "bg-gray-100 border-gray-200 text-gray-400"; // Pure Not Visited

                  return (
                    <button
                      key={i}
                      onClick={() => dispatch({ type: 'NAVIGATE', payload: i })}
                      className={`h-11 w-11 border-2 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${bgClass} ${current ? 'ring-2 ring-blue-500 ring-offset-2 z-10 scale-105' : ''}`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300 bg-white">
              <button
                onClick={() => dispatch({ type: 'FINISH' })}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                Submit Test
              </button>
            </div>
          </aside>
        </div>
      </div>
    )
  }

  // --- RESULT SECTION (ULTIMATE) ---
  if (state.appState === 'RESULT') {
    const correct = state.questions.filter((q: any) => state.exam.answers[q.id] === q.correctAnswer).length;
    const skipped = state.questions.length - Object.keys(state.exam.answers).length;
    const wrong = state.questions.length - correct - skipped;
    // const accuracy = Math.round((correct / (correct + wrong)) * 100) || 0;
    const percentage = Math.round((correct / state.questions.length) * 100);

    // Filter Logic
    const filteredQuestions = state.questions.filter((q: any) => {
      if (resultFilter === 'CORRECT') return state.exam.answers[q.id] === q.correctAnswer;
      if (resultFilter === 'INCORRECT') return state.exam.answers[q.id] !== undefined && state.exam.answers[q.id] !== q.correctAnswer;
      if (resultFilter === 'SKIPPED') return state.exam.answers[q.id] === undefined;
      return true;
    });

    const pieData = [
      { name: 'Correct', value: correct, color: '#10b981' },
      { name: 'Wrong', value: wrong, color: '#ef4444' },
      { name: 'Skipped', value: skipped, color: '#94a3b8' }
    ];

    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-7xl mx-auto pb-20">
          <header className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-2">Result Analysis</h1>
              <p className="text-slate-500 font-medium">Test ID: #QTM-{Math.floor(Math.random() * 10000)}</p>
            </div>
            <div className="text-right mt-4 md:mt-0">
              <div className="text-5xl font-black text-indigo-600">{percentage}%</div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Overall Score</span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Score Card */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
              <Trophy size={64} className="text-yellow-500 mb-4 drop-shadow-md" />
              <div className="text-6xl font-black text-slate-800 mb-2">{correct}</div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Marks Obtained</span>
            </div>

            {/* Accuracy Chart */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-center">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Target size={20} className="text-emerald-500" /> Accuracy</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-rows-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl flex items-center justify-between border border-emerald-100">
                <span className="font-bold text-emerald-800">Correct</span>
                <span className="text-2xl font-black text-emerald-600">{correct}</span>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl flex items-center justify-between border border-red-100">
                <span className="font-bold text-red-800">Incorrect</span>
                <span className="text-2xl font-black text-red-600">{wrong}</span>
              </div>
              <div className="bg-slate-100 p-4 rounded-2xl flex items-center justify-between border border-slate-200">
                <span className="font-bold text-slate-700">Skipped</span>
                <span className="text-2xl font-black text-slate-500">{skipped}</span>
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Activity className="text-indigo-600" /> Question Analysis
              </h2>
              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                {['ALL', 'CORRECT', 'INCORRECT', 'SKIPPED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setResultFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${resultFilter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredQuestions.map((q: any, i: number) => {
                const userAnswer = state.exam.answers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;
                const isSkipped = userAnswer === undefined;

                return (
                  <div key={i} className="p-8 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <span className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-emerald-100 text-emerald-700' : isSkipped ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700'}`}>
                        Q{q.id}
                      </span>
                      <div className="flex-1">
                        <p className="text-lg font-medium text-slate-800 mb-4">{q.question}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {q.options.map((opt: string, oi: number) => {
                            let style = "bg-white border-slate-200 text-slate-500";
                            if (oi === q.correctAnswer) style = "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold ring-1 ring-emerald-500";
                            else if (oi === userAnswer && !isCorrect) style = "bg-red-50 border-red-500 text-red-700 font-bold";

                            return (
                              <div key={oi} className={`p-3 rounded-lg border text-sm flex justify-between items-center ${style}`}>
                                <span><span className="mr-2 opacity-50">{String.fromCharCode(65 + oi)}.</span> {opt}</span>
                                {oi === q.correctAnswer && <Check size={16} />}
                                {oi === userAnswer && !isCorrect && <X size={16} />}
                              </div>
                            )
                          })}
                        </div>

                        {q.explanation && (
                          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-800 text-sm flex gap-3">
                            <Sparkles size={18} className="flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block mb-1 uppercase tracking-wider text-[10px] text-indigo-400">Explanation</span>
                              {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredQuestions.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  No questions found for this filter.
                </div>
              )}
            </div>
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => window.location.reload()}
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto"
            >
              <RefreshCw /> Start New Assessment
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null;
}
