import React, { useState, useEffect } from "react";
import { Plus, Upload, FileJson, FileSpreadsheet, Trash2, ExternalLink, ChevronRight, Users, AlertCircle } from "lucide-react";
import { Question } from "../types";
import { v4 as uuidv4 } from "uuid";

export default function ExaminerDashboard() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [createdExamTitle, setCreatedExamTitle] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [allExams, setAllExams] = useState<any[]>([]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      text: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          setQuestions(data.map((q: any) => ({ ...q, id: q.id || uuidv4() })));
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parser: text,opt1,opt2,opt3,opt4,correctIndex,marks
          const lines = content.split('\n').filter(l => l.trim());
          const parsed = lines.map(line => {
            const [text, o1, o2, o3, o4, correct, marks] = line.split(',');
            return {
              id: uuidv4(),
              text,
              options: [o1, o2, o3, o4],
              correctAnswer: parseInt(correct),
              marks: parseInt(marks) || 1
            };
          });
          setQuestions(parsed);
        }
      } catch (err) {
        alert("Error parsing file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) return alert("Please add at least one question.");

    const response = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        durationMinutes: duration,
        negativeMarking,
        randomizeQuestions,
        randomizeOptions,
        questions
      })
    });

    const data = await response.json();
    setCreatedExamTitle(title);
    setActiveTab('list');
    fetchAllExams();
    // Reset form
    setTitle("");
    setQuestions([]);
  };

  const fetchAllExams = async () => {
    const response = await fetch("/api/exams");
    const data = await response.json();
    setAllExams(data);
  };

  const fetchSubmissions = async (examId: string) => {
    const response = await fetch(`/api/exams/${examId}/submissions`);
    const data = await response.json();
    setSubmissions(data);
    setSelectedExamId(examId);
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchAllExams();
    }
  }, [activeTab]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-4 mb-8 border-b border-[#141414]/10 pb-4">
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-[#141414] text-white' : 'hover:bg-[#141414]/5'}`}
        >
          Create New Exam
        </button>
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-[#141414] text-white' : 'hover:bg-[#141414]/5'}`}
        >
          View Reports
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Exam Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#141414]/50">Exam Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Mathematics Final"
                  className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:outline-none focus:ring-2 focus:ring-[#141414]/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#141414]/50">Duration (Minutes)</label>
                <input 
                  type="number" 
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:outline-none focus:ring-2 focus:ring-[#141414]/5"
                />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 rounded-2xl border border-[#141414]/5 hover:bg-[#141414]/5 cursor-pointer transition-colors">
                <input type="checkbox" checked={negativeMarking} onChange={(e) => setNegativeMarking(e.target.checked)} className="w-4 h-4 accent-[#141414]" />
                <span className="text-sm font-medium">Negative Marking</span>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-2xl border border-[#141414]/5 hover:bg-[#141414]/5 cursor-pointer transition-colors">
                <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} className="w-4 h-4 accent-[#141414]" />
                <span className="text-sm font-medium">Randomize Questions</span>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-2xl border border-[#141414]/5 hover:bg-[#141414]/5 cursor-pointer transition-colors">
                <input type="checkbox" checked={randomizeOptions} onChange={(e) => setRandomizeOptions(e.target.checked)} className="w-4 h-4 accent-[#141414]" />
                <span className="text-sm font-medium">Randomize Options</span>
              </label>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Questions ({questions.length})</h2>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#141414]/10 text-sm font-medium hover:bg-[#141414]/5 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Bulk Upload
                  <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
                </label>
                <button 
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141414] text-white text-sm font-medium hover:bg-[#141414]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={q.id} className="p-6 rounded-2xl border border-[#141414]/10 space-y-4 relative group">
                  <button 
                    onClick={() => removeQuestion(qIndex)}
                    className="absolute top-4 right-4 text-[#141414]/30 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mt-1">Question {qIndex + 1}</label>
                    <textarea 
                      value={q.text}
                      onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                      placeholder="Enter question text..."
                      className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:outline-none focus:ring-2 focus:ring-[#141414]/5 min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          className="w-4 h-4 accent-[#141414]"
                        />
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="w-full px-3 py-2 rounded-lg border border-[#141414]/10 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]/10"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#141414]/40 uppercase">Marks:</span>
                      <input 
                        type="number" 
                        value={q.marks}
                        onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg border border-[#141414]/10 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {questions.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[#141414]/5 flex justify-end">
                <button 
                  onClick={handleSubmit}
                  className="bg-[#141414] text-white px-10 py-4 rounded-full font-bold hover:bg-[#141414]/90 transition-all hover:scale-105 shadow-xl shadow-[#141414]/10"
                >
                  Publish Question Paper
                </button>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {createdExamTitle && (
            <div className="bg-[#5A5A40]/10 p-6 rounded-3xl border border-[#5A5A40]/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#5A5A40]">Exam Published Successfully!</h3>
                <p className="text-sm text-[#5A5A40]/70">The exam "{createdExamTitle}" is now available for students.</p>
              </div>
            </div>
          )}

          <section className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Exam Reports</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Select Exam</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {allExams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => fetchSubmissions(exam.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedExamId === exam.id
                          ? 'border-[#141414] bg-[#141414] text-white shadow-lg'
                          : 'border-[#141414]/10 hover:border-[#141414]/30 hover:bg-[#141414]/[0.02]'
                      }`}
                    >
                      <div className="font-bold text-sm">{exam.title}</div>
                      <div className={`text-[10px] uppercase tracking-wider ${selectedExamId === exam.id ? 'text-white/60' : 'text-[#141414]/40'}`}>
                        {exam.durationMinutes} Minutes
                      </div>
                    </button>
                  ))}
                  {allExams.length === 0 && (
                    <p className="text-sm text-[#141414]/40 italic">No exams created yet.</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                {!selectedExamId ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center text-[#141414]/40 border border-dashed border-[#141414]/10 rounded-3xl">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Select an exam to view student submissions and integrity logs.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#141414]/5">
                          <th className="pb-4 font-bold text-xs uppercase tracking-wider text-[#141414]/40">Student Name</th>
                          <th className="pb-4 font-bold text-xs uppercase tracking-wider text-[#141414]/40">Score</th>
                          <th className="pb-4 font-bold text-xs uppercase tracking-wider text-[#141414]/40">Status</th>
                          <th className="pb-4 font-bold text-xs uppercase tracking-wider text-[#141414]/40">Violations</th>
                          <th className="pb-4 font-bold text-xs uppercase tracking-wider text-[#141414]/40">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/5">
                        {submissions.map((s) => (
                          <tr key={s.id} className="group hover:bg-[#141414]/[0.02] transition-colors">
                            <td className="py-4 font-medium">{s.student_name}</td>
                            <td className="py-4">
                              <span className="font-mono font-bold">{s.score}</span>
                              <span className="text-[#141414]/40 text-xs ml-1">/ {s.total_possible_score}</span>
                            </td>
                            <td className="py-4">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                                s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="py-4">
                              {s.violations.length > 0 ? (
                                <div className="flex items-center gap-1 text-red-500 font-bold text-xs">
                                  <AlertCircle className="w-3 h-3" />
                                  {s.violations.length} Flags
                                </div>
                              ) : (
                                <span className="text-green-600 text-xs font-medium">Clean</span>
                              )}
                            </td>
                            <td className="py-4">
                              <button 
                                onClick={() => alert(JSON.stringify(s, null, 2))}
                                className="text-[#141414]/40 hover:text-[#141414] transition-colors"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {submissions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-[#141414]/40 text-sm italic">
                              No submissions found for this exam.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
