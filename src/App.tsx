import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ExaminerDashboard from "./components/ExaminerDashboard";
import StudentPortal from "./components/StudentPortal";
import ExamInterface from "./components/ExamInterface";
import { Shield, GraduationCap, ClipboardList } from "lucide-react";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
        <nav className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-[#141414] p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">IntegrityExam</span>
              </Link>
              <div className="flex gap-6">
                <Link to="/examiner" className="flex items-center gap-2 text-sm font-medium hover:text-[#141414]/70 transition-colors">
                  <ClipboardList className="w-4 h-4" />
                  Examiner
                </Link>
                <Link to="/student" className="flex items-center gap-2 text-sm font-medium hover:text-[#141414]/70 transition-colors">
                  <GraduationCap className="w-4 h-4" />
                  Student
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/examiner" element={<ExaminerDashboard />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/exam/:examId" element={<ExamInterface />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="max-w-3xl">
        <h1 className="text-6xl font-bold tracking-tighter mb-6 leading-tight">
          The Gold Standard for <br />
          <span className="italic font-serif text-[#5A5A40]">Academic Integrity</span>
        </h1>
        <p className="text-xl text-[#141414]/60 mb-10 max-w-xl mx-auto">
          A professional-grade examination platform designed for institutions that value precision, security, and automated excellence.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            to="/examiner" 
            className="bg-[#141414] text-white px-8 py-4 rounded-full font-medium hover:bg-[#141414]/90 transition-all hover:scale-105"
          >
            Create an Exam
          </Link>
          <Link 
            to="/student" 
            className="border border-[#141414] px-8 py-4 rounded-full font-medium hover:bg-[#141414]/5 transition-all hover:scale-105"
          >
            Take an Exam
          </Link>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl">
        <div className="p-8 bg-white rounded-3xl border border-[#141414]/5 shadow-sm">
          <div className="w-10 h-10 bg-[#5A5A40]/10 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-5 h-5 text-[#5A5A40]" />
          </div>
          <h3 className="font-bold text-lg mb-2">Anti-Malpractice</h3>
          <p className="text-sm text-[#141414]/60">Real-time monitoring of tab switches, window blurs, and prohibited shortcuts.</p>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-[#141414]/5 shadow-sm">
          <div className="w-10 h-10 bg-[#5A5A40]/10 rounded-xl flex items-center justify-center mb-4">
            <ClipboardList className="w-5 h-5 text-[#5A5A40]" />
          </div>
          <h3 className="font-bold text-lg mb-2">Auto-Grading</h3>
          <p className="text-sm text-[#141414]/60">Instant validation and score computation with detailed breakdown for examiners.</p>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-[#141414]/5 shadow-sm">
          <div className="w-10 h-10 bg-[#5A5A40]/10 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5 text-[#5A5A40]" />
          </div>
          <h3 className="font-bold text-lg mb-2">Detailed Reports</h3>
          <p className="text-sm text-[#141414]/60">Comprehensive student performance data including device and integrity logs.</p>
        </div>
      </div>
    </div>
  );
}
