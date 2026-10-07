export interface Question {
  id: string;
  key?: string;
  number?: string;
  question: string;
  options: Record<string, string>;
  correct: string; // e.g. "B" or "AC" for multi-answer
  section: string; // "AT", "QT", "NQ", "TTD.5", or "A3.1", "B4.2"
  unit?: string; // "COMMON" or "A", "B", "C", "D"
  level: string; // "COMMON", "2", "3", "4", "5", "6", "7", "8"
  subGroup?: string; // "1", "2", "3"
  sourceSection?: string;
  citation?: string;
  explanation?: string;
  images?: string[];
}

export interface GroupQuestionCounts {
  at?: number;
  qt?: number;
  nq?: number;
  ttd?: number;
  ax?: number;
  [key: string]: number | undefined;
}

export interface LevelDistribution {
  mode: 'auto' | 'manual'; // 'auto': tự động phân bổ tích lũy theo bậc | 'manual': tùy chỉnh từng bậc
  preset?: 'ladder' | 'even' | 'focus_target'; // Lũy tiến | Chia đều | Tập trung bậc thi
  counts: Record<string, number>; // ví dụ { "1": 2, "2": 3, "3": 5, "4": 10 }
}

export interface GroupSummary {
  key: string;
  code: string;
  name: string;
  shortName: string;
  availableCount: number;
  selectedCount: number;
  color: string;
  badgeClass: string;
  desc: string;
}

export interface ExamRoom {
  id: string;
  roomCode: string; // e.g. "SPM-2026"
  roomName: string;
  isLocked: boolean; // Khoá phòng thi
  accessPin: string; // Mã khoá phòng thi (PIN)
  unit: string; // "A", "B", "C", "D"
  level: string; // "2", "3", "4", "5", "6", "7", "8"
  examTimeMinutes: number;
  totalQuestions: number;
  groupCounts?: GroupQuestionCounts;
  levelDistribution?: LevelDistribution; // Cấu hình chi tiết số câu cho từng bậc chuyên môn (Bậc 2..Bậc thi)
  maxFocusViolations: number;
  activeCandidatesCount: number;
  status: 'active' | 'locked' | 'ended';
  createdAt: string;
  description?: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  employeeCode?: string;
  unit: string;
  unitName: string;
  level: string;
  roomCode: string;
  examCode: string; // e.g. "A001" or "C-R003"
  status: 'not_started' | 'testing' | 'submitted' | 'violation';
  startedAt?: string;
  submittedAt?: string;
  score?: number;
  correctCount?: number;
  totalQuestions?: number;
  focusViolations: number;
}

export interface ExamAttempt {
  id: string;
  candidateName: string;
  unit: string;
  unitName: string;
  level: string;
  examCode: string;
  roomCode: string;
  mode: 'official' | 'training';
  startedAt: string;
  submittedAt?: string;
  durationLimitSeconds: number;
  elapsedSeconds: number;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  percent: number;
  status: string;
  focusViolations: number;
  answers: Record<number, string>;
  questions: Question[];
  groupBreakdown?: Record<string, { total: number; correct: number; percent: number }>;
  safetyPassed?: boolean;
  isPassed?: boolean;
  passNote?: string;
}

export interface DepartmentInfo {
  code: string;
  name: string;
}

export interface MatrixConfig {
  atCount: number;
  qtCount: number;
  nqCount: number;
  ttdCount: number;
  totalQuestions: number;
  examTimeMinutes: number;
  noDuplicateBetweenCodes: boolean;
  maxOverlapPercent: number;
  shuffleAnswers: boolean;
  axMode: 'auto' | 'manual';
  axLevelPercents: Record<string, Record<string, number>>;
  axSectionCounts: Record<string, Record<string, number>>;
}
