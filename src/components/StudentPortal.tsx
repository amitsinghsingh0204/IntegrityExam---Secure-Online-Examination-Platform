import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, ShieldCheck, Clock, ChevronRight } from "lucide-react";

interface ExamSummary {
  id: string;
  title: string;
  durationMinutes: number;
}

export default function StudentPortal() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingExams, setFetchingExams] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/exams");
      if (!response.ok) throw new Error("Failed to fetch exams");
      const data = await response.json();
      setExams(data);
    } catch (err) {
      console.error(err);
      setError("Could not load available exams.");
    } finally {
      setFetchingExams(false);
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !studentName) return;

    setLoading(true);
    setError("");

    try {
      // Store student name in session storage for the exam session
      sessionStorage.setItem("studentName", studentName);
      navigate(`/exam/${selectedExamId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-10 rounded-[2.5rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#141414]/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Student Portal</h1>
          <p className="text-[#141414]/50 text-sm">Enter your name and select an exam to begin.</p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Full Name</label>
            <input 
              type="text" 
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-5 py-4 rounded-2xl border border-[#141414]/10 focus:outline-none focus:ring-4 focus:ring-[#141414]/5 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Select Examination</label>
            {fetchingExams ? (
              <div className="h-14 bg-[#141414]/5 rounded-2xl animate-pulse" />
            ) : exams.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs italic">
                No examinations are currently available.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {exams.map((exam) => (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => setSelectedExamId(exam.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      selectedExamId === exam.id
                        ? 'border-[#141414] bg-[#141414] text-white shadow-lg'
                        : 'border-[#141414]/10 hover:border-[#141414]/30 hover:bg-[#141414]/[0.02]'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{exam.title}</span>
                      <span className={`text-[10px] uppercase tracking-wider ${selectedExamId === exam.id ? 'text-white/60' : 'text-[#141414]/40'}`}>
                        {exam.durationMinutes} Minutes
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedExamId === exam.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || !selectedExamId || !studentName}
            className="w-full bg-[#141414] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#141414]/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Start Examination"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#141414]/5 grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center text-center">
            <ShieldCheck className="w-5 h-5 text-[#5A5A40] mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-tighter text-[#141414]/40">Secure Session</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Clock className="w-5 h-5 text-[#5A5A40] mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-tighter text-[#141414]/40">Timed Exam</span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-[#5A5A40]/5 rounded-3xl border border-[#5A5A40]/10">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3">Integrity Notice</h4>
        <ul className="text-[11px] text-[#5A5A40]/70 space-y-2">
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            Tab switching or window minimization will be flagged.
          </li>
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            Copy-pasting and right-clicking are disabled.
          </li>
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            The exam will auto-submit when the timer expires.
          </li>
        </ul>
      </div>
    </div>
  );
}
