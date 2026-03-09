import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, ChevronRight, ChevronLeft, Send } from "lucide-react";
import { Exam, Violation } from "../types";

export default function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [status, setStatus] = useState<'loading' | 'active' | 'submitting' | 'finished' | 'terminated'>('loading');
  const [warning, setWarning] = useState<string | null>(null);
  const startTime = useRef(Date.now());
  const studentName = useRef(sessionStorage.getItem("studentName") || "Anonymous Student");

  // Prevent default behaviors
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    const preventShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 't' || e.key === 'n' || e.key === 'r')) ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'F5' ||
        (e.metaKey && e.key === 'r')
      ) {
        e.preventDefault();
        addViolation('shortcut', `Attempted shortcut: ${e.key}`);
      }
    };

    window.addEventListener('contextmenu', preventDefault);
    window.addEventListener('keydown', preventShortcuts);
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      e.returnValue = '';
    });

    return () => {
      window.removeEventListener('contextmenu', preventDefault);
      window.removeEventListener('keydown', preventShortcuts);
    };
  }, []);

  // Monitor tab switching and window blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        addViolation('tab-switch', 'Tab switched or browser minimized');
      }
    };

    const handleBlur = () => {
      addViolation('blur', 'Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const addViolation = (type: Violation['type'], details: string) => {
    const newViolation: Violation = { type, details, timestamp: Date.now() };
    setViolations(prev => {
      const updated = [...prev, newViolation];
      if (updated.length >= 3) {
        setStatus('terminated');
        submitExam('terminated', updated);
      } else {
        setWarning(`Warning: ${details}. Integrity violation logged (${updated.length}/3)`);
        setTimeout(() => setWarning(null), 5000);
      }
      return updated;
    });
  };

  const handleTermination = (reason: string) => {
    // This is now handled inside addViolation to ensure fresh state
  };

  const fetchExam = useCallback(async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) throw new Error("Exam not found");
      const data = await response.json();
      
      // Randomize if needed
      let questions = [...data.questions];
      if (data.randomizeQuestions) {
        questions = questions.sort(() => Math.random() - 0.5);
      }
      if (data.randomizeOptions) {
        questions = questions.map(q => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5)
        }));
      }

      setExam({ ...data, questions });
      setTimeLeft(data.durationMinutes * 60);
      setStatus('active');
    } catch (err) {
      navigate('/student');
    }
  }, [examId, navigate]);

  useEffect(() => {
    if (!sessionStorage.getItem("studentName")) {
      navigate('/student');
      return;
    }
    fetchExam();
  }, [fetchExam, navigate]);

  // Timer logic
  useEffect(() => {
    if (status !== 'active' || timeLeft === null) return;

    if (timeLeft <= 0) {
      submitExam('timed-out', violations);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft, violations]);

  const submitExam = async (
    finalStatus: 'completed' | 'terminated' | 'timed-out' = 'completed',
    currentViolations: Violation[] = violations
  ) => {
    if (status === 'submitting' || status === 'finished') return;
    
    setStatus('submitting');
    
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          studentName: studentName.current,
          answers,
          startTime: startTime.current,
          endTime: Date.now(),
          violations: currentViolations,
          status: finalStatus,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit exam");
      }

      setStatus('finished');
    } catch (err: any) {
      console.error("Submission failed", err);
      setStatus('active'); // Allow retry
      alert(`Submission failed: ${err.message}. Please try again.`);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#141414]/10 border-t-[#141414] rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#141414]/50">Initializing Secure Environment...</p>
      </div>
    );
  }

  if (status === 'finished' || status === 'terminated') {
    return (
      <div className="max-w-md mx-auto py-20 text-center animate-in zoom-in-95 duration-500">
        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-8 ${
          status === 'finished' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {status === 'finished' ? <CheckCircle2 className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
        </div>
        <h1 className="text-3xl font-bold mb-4">
          {status === 'finished' ? "Examination Completed" : "Session Terminated"}
        </h1>
        <p className="text-[#141414]/60 mb-10">
          {status === 'finished' 
            ? "Your responses have been securely submitted and recorded. You may now close this window."
            : "The examination was terminated due to multiple integrity violations. Your partial responses have been logged."}
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#141414] text-white px-8 py-3 rounded-full font-medium hover:scale-105 transition-transform"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (!exam) return null;

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto pb-20 select-none">
      {/* Header / Timer */}
      <div className="sticky top-20 z-40 mb-8">
        <div className="bg-white/80 backdrop-blur-xl border border-[#141414]/5 rounded-3xl p-4 flex items-center justify-between shadow-lg shadow-[#141414]/5">
          <div className="flex items-center gap-4">
            <div className="bg-[#141414] text-white px-3 py-1 rounded-lg text-xs font-bold tracking-widest uppercase">
              Live Session
            </div>
            <h2 className="font-bold text-sm truncate max-w-[200px]">{exam.title}</h2>
          </div>
          
          <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl transition-colors ${
            timeLeft && timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-[#141414]/5 text-[#141414]'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-lg">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
          </div>
        </div>

        {warning && (
          <div className="mt-4 bg-red-500 text-white px-6 py-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 shadow-xl shadow-red-500/20">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{warning}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Question Navigation */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white rounded-3xl border border-[#141414]/5 p-6 sticky top-44">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Question Map</h3>
            <div className="grid grid-cols-4 gap-2">
              {exam.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`aspect-square rounded-xl text-xs font-bold transition-all ${
                    currentQuestionIndex === idx 
                      ? 'bg-[#141414] text-white scale-110 shadow-lg shadow-[#141414]/20' 
                      : answers[exam.questions[idx].id] !== undefined
                        ? 'bg-[#5A5A40] text-white'
                        : 'bg-[#141414]/5 text-[#141414]/40 hover:bg-[#141414]/10'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-[#141414]/5 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#141414]/40">
                <div className="w-2 h-2 rounded-full bg-[#5A5A40]" />
                Answered
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#141414]/40">
                <div className="w-2 h-2 rounded-full bg-[#141414]/5" />
                Unanswered
              </div>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-white rounded-[2.5rem] border border-[#141414]/5 p-10 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] bg-[#5A5A40]/5 px-3 py-1 rounded-lg">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span className="text-xs font-bold text-[#141414]/40">
                {currentQuestion.marks} Marks
              </span>
            </div>

            <h1 className="text-2xl font-medium leading-relaxed mb-10">
              {currentQuestion.text}
            </h1>

            <div className="space-y-4 flex-grow">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnswers({ ...answers, [currentQuestion.id]: idx })}
                  className={`w-full text-left p-6 rounded-2xl border transition-all flex items-center gap-4 group ${
                    answers[currentQuestion.id] === idx
                      ? 'border-[#141414] bg-[#141414] text-white shadow-xl shadow-[#141414]/10'
                      : 'border-[#141414]/10 hover:border-[#141414]/30 hover:bg-[#141414]/[0.02]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    answers[currentQuestion.id] === idx
                      ? 'border-white/40 bg-white/20'
                      : 'border-[#141414]/20 group-hover:border-[#141414]/40'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-lg">{option}</span>
                </button>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-[#141414]/5 flex justify-between items-center">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest disabled:opacity-20 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to submit your examination?")) {
                      submitExam('completed', violations);
                    }
                  }}
                  disabled={status === 'submitting'}
                  className={`bg-[#141414] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-[#141414]/20 ${
                    status === 'submitting' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {status === 'submitting' ? 'Submitting...' : 'Submit Exam'}
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:translate-x-1 transition-transform"
                >
                  Next Question
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
