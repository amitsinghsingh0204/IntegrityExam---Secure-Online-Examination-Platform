export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number; // Only for examiner/grading
  marks: number;
}

export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  negativeMarking: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  questions: Question[];
  createdAt: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentName: string;
  answers: Record<string, number>; // questionId -> optionIndex
  startTime: number;
  endTime: number;
  violations: Violation[];
  score?: number;
  totalPossibleScore?: number;
  status: 'completed' | 'terminated' | 'timed-out';
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
}

export interface Violation {
  type: 'tab-switch' | 'blur' | 'refresh' | 'shortcut';
  timestamp: number;
  details?: string;
}
