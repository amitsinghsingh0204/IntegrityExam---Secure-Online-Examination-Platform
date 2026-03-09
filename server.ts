import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("exams.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    negative_marking INTEGER DEFAULT 0,
    randomize_questions INTEGER DEFAULT 0,
    randomize_options INTEGER DEFAULT 0,
    questions_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    violations_json TEXT NOT NULL,
    score REAL,
    total_possible_score REAL,
    status TEXT NOT NULL,
    device_info_json TEXT NOT NULL,
    FOREIGN KEY(exam_id) REFERENCES exams(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Examiner: Create Exam
  app.post("/api/exams", (req, res) => {
    const { title, durationMinutes, negativeMarking, randomizeQuestions, randomizeOptions, questions } = req.body;
    const id = uuidv4().substring(0, 8); // Short ID for easier sharing
    
    const stmt = db.prepare(`
      INSERT INTO exams (id, title, duration_minutes, negative_marking, randomize_questions, randomize_options, questions_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      title,
      durationMinutes,
      negativeMarking ? 1 : 0,
      randomizeQuestions ? 1 : 0,
      randomizeOptions ? 1 : 0,
      JSON.stringify(questions),
      Date.now()
    );

    res.json({ id });
  });

  // List all exams (for student selection)
  app.get("/api/exams", (req, res) => {
    const exams = db.prepare("SELECT id, title, duration_minutes FROM exams ORDER BY created_at DESC").all() as any[];
    res.json(exams.map(e => ({
      id: e.id,
      title: e.title,
      durationMinutes: e.duration_minutes
    })));
  });

  // Student: Get Exam (Sanitized - no correct answers)
  app.get("/api/exams/:id", (req, res) => {
    const exam = db.prepare("SELECT * FROM exams WHERE id = ?").get(req.params.id) as any;
    
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const questions = JSON.parse(exam.questions_json).map((q: any) => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });

    res.json({
      id: exam.id,
      title: exam.title,
      durationMinutes: exam.duration_minutes,
      negativeMarking: !!exam.negative_marking,
      randomizeQuestions: !!exam.randomize_questions,
      randomizeOptions: !!exam.randomize_options,
      questions
    });
  });

  // Student: Submit Exam
  app.post("/api/submissions", (req, res) => {
    try {
      const { examId, studentName, answers, startTime, endTime, violations, status, deviceInfo } = req.body;
      
      if (!examId || !studentName) {
        return res.status(400).json({ error: "Missing required fields: examId or studentName" });
      }

      const exam = db.prepare("SELECT * FROM exams WHERE id = ?").get(examId) as any;
      if (!exam) {
        console.error(`Submission failed: Exam ${examId} not found`);
        return res.status(404).json({ error: "Exam not found" });
      }

      const questions = JSON.parse(exam.questions_json);
      let score = 0;
      let totalPossibleScore = 0;

      questions.forEach((q: any) => {
        totalPossibleScore += q.marks;
        const studentAnswer = answers[q.id];
        if (studentAnswer !== undefined) {
          if (studentAnswer === q.correctAnswer) {
            score += q.marks;
          } else if (exam.negative_marking) {
            score -= (q.marks * 0.25); // Default 1/4 negative marking
          }
        }
      });

      const submissionId = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO submissions (id, exam_id, student_name, answers_json, start_time, end_time, violations_json, score, total_possible_score, status, device_info_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        submissionId,
        examId,
        studentName,
        JSON.stringify(answers || {}),
        startTime || Date.now(),
        endTime || Date.now(),
        JSON.stringify(violations || []),
        score,
        totalPossibleScore,
        status || 'completed',
        JSON.stringify(deviceInfo || {})
      );

      res.json({ success: true, score, totalPossibleScore, submissionId });
    } catch (error: any) {
      console.error("Database error during submission:", error);
      res.status(500).json({ error: "Internal server error during submission: " + error.message });
    }
  });

  // Examiner: Get Submissions for an Exam
  app.get("/api/exams/:id/submissions", (req, res) => {
    const submissions = db.prepare("SELECT * FROM submissions WHERE exam_id = ?").all(req.params.id) as any[];
    
    res.json(submissions.map(s => ({
      ...s,
      answers: JSON.parse(s.answers_json),
      violations: JSON.parse(s.violations_json),
      deviceInfo: JSON.parse(s.device_info_json)
    })));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
