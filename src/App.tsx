/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CandidatePortal } from './components/CandidatePortal';
import { CandidateExam } from './components/CandidateExam';
import { ExamResultView } from './components/ExamResultView';
import { AdminPortal } from './components/AdminPortal';
import { 
  DEFAULT_DEPARTMENTS, INITIAL_ROOMS, INITIAL_CANDIDATES, INITIAL_QUESTIONS,
  getQuestionGroupKey
} from './data/mockData';
import { generateExamForRoom, generateExamWithValidation } from './utils/questionMeta';
import { ExamRoom, Candidate, Question, ExamAttempt, DepartmentInfo } from './types/exam';
import { Lock, Key, X, AlertCircle } from 'lucide-react';

export default function App() {
  // Navigation View
  const [view, setView] = useState<'candidate_portal' | 'candidate_exam' | 'exam_result' | 'admin_portal'>('candidate_portal');

  // Application Data with LocalStorage Persistence
  const [rooms, setRooms] = useState<ExamRoom[]>(() => {
    try {
      const saved = localStorage.getItem('spmo_rooms_v9');
      return saved ? JSON.parse(saved) : INITIAL_ROOMS;
    } catch {
      return INITIAL_ROOMS;
    }
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      const saved = localStorage.getItem('spmo_candidates_v9');
      return saved ? JSON.parse(saved) : INITIAL_CANDIDATES;
    } catch {
      return INITIAL_CANDIDATES;
    }
  });

  // Lọc sạch câu hỏi mặc định theo yêu cầu người dùng: chỉ giữ lại câu hỏi do người dùng nhập/tải lên
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('spmo_questions_v9');
      if (saved) {
        const parsed: Question[] = JSON.parse(saved);
        const userOnly = parsed
          .filter((q) => {
            if (!q || !q.id) return false;
            const isMock = 
              q.id.startsWith('q-at-') ||
              q.id.startsWith('q-qt-') ||
              q.id.startsWith('q-nq-') ||
              q.id.startsWith('q-ttd-') ||
              q.id.startsWith('q-ax-') ||
              q.id.startsWith('mock-') ||
              q.id.startsWith('default-');
            return !isMock;
          })
          .map((q) => {
            let cit = (q.citation || '').trim();
            let text = (q.question || '').trim();
            // Loại bỏ các câu chữ quy chuẩn mặc định cũ nếu có
            if (
              cit.includes('Quy chuẩn Kỹ thuật Nghề nghiệp & Tiêu chuẩn Vận hành SPMO') ||
              cit === 'Quy chuẩn ngành điện' ||
              cit.includes('Căn cứ Quy chuẩn kỹ thuật an toàn điện & Quy trình vận hành SPMO')
            ) {
              cit = '';
            }

            // Tách trích dẫn nếu bị dính trong nội dung câu hỏi
            if (!cit && text) {
              const sepMatch = text.match(
                /(?:[|–—/]|(?:\s+-\s+)|\.\s+|\,\s+|\(\s*|\[\s*)\s*(?:[-*•\s]*)(?:\[\s*|\(\s*)?(?:Phần\s*)?(?:Giải\s*thích\s*(?:và|&|\/|-)?\s*trích\s*dẫn|Trích\s*dẫn\s*(?:và|&|\/|-)?\s*giải\s*thích|Giải\s*thích\s*trích\s*dẫn|Trích\s*dẫn(?:\s*(?:đáp\s*án|tài\s*liệu|căn\s*cứ|câu\s*hỏi))?|Giải\s*thích(?:\s*(?:chi\s*tiết|đáp\s*án|nghiệp\s*vụ|chuyên\s*môn))?|Căn\s*cứ(?:\s*(?:quy\s*trình|quy\s*chuẩn|tài\s*liệu|pháp\s*lý))?|Hướng\s*dẫn(?:\s*giải)?|Tài\s*liệu(?:\s*(?:tham\s*khảo|trích\s*dẫn))?|Tham\s*khảo|Ghi\s*chú|Nguồn(?:\s*trích)?)(?:\s*\]|\s*\))?\s*[:\-,\.]?\s*(.*)$/i
              );
              if (sepMatch && sepMatch[1]) {
                cit = sepMatch[1].replace(/[\)\]]+$/, '').trim();
                text = text.substring(0, sepMatch.index).trim();
              } else {
                const parenMatch = text.match(/\s*[\(\[]\s*(\*?[A-ZĐÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯ].{10,})\s*[\)\]]$/);
                if (parenMatch && parenMatch[1]) {
                  cit = parenMatch[1].replace(/^\*|\*$/g, '').trim();
                  text = text.substring(0, parenMatch.index).trim();
                }
              }
            }

            // Tách trích dẫn nếu bị dính ở option cuối
            let opts = { ...(q.options || {}) };
            if (!cit && opts) {
              const optKeys = Object.keys(opts);
              const lastKey = optKeys[optKeys.length - 1];
              if (lastKey && opts[lastKey]) {
                const optText = opts[lastKey];
                const optSep = optText.match(
                  /(?:[|–—/]|(?:\s+-\s+)|\.\s+|\,\s+|\(\s*|\[\s*)\s*(?:[-*•\s]*)(?:\[\s*|\(\s*)?(?:Phần\s*)?(?:Giải\s*thích\s*(?:và|&|\/|-)?\s*trích\s*dẫn|Trích\s*dẫn\s*(?:và|&|\/|-)?\s*giải\s*thích|Giải\s*thích\s*trích\s*dẫn|Trích\s*dẫn|Giải\s*thích|Căn\s*cứ)(?:[^:\-,\.]*)(?:\s*\]|\s*\))?\s*[:\-,\.]?\s*(.*)$/i
                );
                if (optSep && optSep[1]) {
                  cit = optSep[1].replace(/[\)\]]+$/, '').trim();
                  opts[lastKey] = optText.substring(0, optSep.index).trim();
                }
              }
            }

            return { ...q, question: text, options: opts, citation: cit };
          });
        return userOnly;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [departments, setDepartments] = useState<DepartmentInfo[]>(() => {
    try {
      const saved = localStorage.getItem('spmo_departments_v9');
      if (saved) {
        const parsed: DepartmentInfo[] = JSON.parse(saved);
        // Ensure default codes A, B, C, D have user's updated standard names
        const updated = parsed.map((d) => {
          if (d.code === 'A' && d.name.includes('Công nhân')) return { ...d, name: 'Trưởng ca' };
          if (d.code === 'B' && d.name.includes('XSC cơ')) return { ...d, name: 'Điều hành viên' };
          if (d.code === 'C' && d.name.includes('Trưởng ca')) return { ...d, name: 'Công nhân điện' };
          if (d.code === 'D' && d.name.includes('XSC điện')) return { ...d, name: 'Công nhân cơ' };
          return d;
        });
        return updated;
      }
      return DEFAULT_DEPARTMENTS;
    } catch {
      return DEFAULT_DEPARTMENTS;
    }
  });

  // Active Exam Session Data
  const [activeSession, setActiveSession] = useState<{
    candidateName: string;
    unit: string;
    unitName: string;
    level: string;
    room: ExamRoom;
    examCode: string;
    questions: Question[];
    mode: 'official' | 'training';
    matrixWarnings?: string[];
    matrixTargetTotal?: number;
  } | null>(null);

  // Active Attempt for Result View
  const [latestAttempt, setLatestAttempt] = useState<ExamAttempt | null>(null);

  // Admin Login Dialog
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Persist data updates
  useEffect(() => {
    try {
      localStorage.setItem('spmo_rooms_v9', JSON.stringify(rooms));
    } catch (e) {
      console.warn('LocalStorage save error for rooms', e);
    }
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem('spmo_candidates_v9', JSON.stringify(candidates));
    } catch (e) {
      console.warn('LocalStorage save error for candidates', e);
    }
  }, [candidates]);

  useEffect(() => {
    try {
      localStorage.setItem('spmo_questions_v9', JSON.stringify(questions));
    } catch (e) {
      console.warn('LocalStorage save error for questions', e);
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('spmo_departments_v9', JSON.stringify(departments));
    } catch (e) {
      console.warn('LocalStorage save error for departments', e);
    }
  }, [departments]);

  // Start exam from Candidate Portal
  const handleStartExam = (
    candidateName: string,
    unit: string,
    unitName: string,
    level: string,
    room: ExamRoom,
    mode: 'official' | 'training'
  ) => {
    // Sử dụng mã đề riêng do Admin đặt cho phòng thi (nếu có), nếu không tự sinh ngẫu nhiên
    const customCode = room.customExamCode && room.customExamCode.trim();
    const examCode = customCode || `${unit}${Math.floor(100 + Math.random() * 900)}`;

    // Sinh đề thi chính xác theo bộ phận của phòng thi, bậc thi của thí sinh và ma trận phân bổ:
    // - Nhóm AX bắt buộc sắp xếp theo thứ tự từ thấp đến cao (bậc thấp đến bậc cao)
    // - Tự động trộn các phương án đáp án A/B/C/D bảo toàn đúng đáp án correct
    // - Nhóm TTD luôn đưa ra sau cùng
    const examResult = generateExamWithValidation(room, questions, level, {
      shuffleOptions: true,
      candidateSeed: `${candidateName}_${room.roomCode}_${examCode}`,
    });
    const selectedQuestions = examResult.questions;

    // Add or update candidate in roster
    const newCand: Candidate = {
      id: `cand-${Date.now()}`,
      fullName: candidateName,
      unit,
      unitName,
      level,
      roomCode: room.roomCode,
      examCode,
      status: 'testing',
      startedAt: new Date().toISOString(),
      focusViolations: 0,
    };

    setCandidates((prev) => [newCand, ...prev.filter((c) => c.fullName !== candidateName)]);

    setActiveSession({
      candidateName,
      unit,
      unitName,
      level,
      room,
      examCode,
      questions: selectedQuestions,
      mode,
      matrixWarnings: examResult.warnings,
      matrixTargetTotal: examResult.matrixRequestedTotal,
    });

    setView('candidate_exam');
  };

  // Exam finished callback
  const handleFinishExam = (attempt: ExamAttempt) => {
    setLatestAttempt(attempt);

    // Lưu vào lịch sử bài thi (phục vụ Item Analysis & Analytics)
    try {
      const raw = localStorage.getItem('spmo_all_attempts_v9');
      const list: ExamAttempt[] = raw ? JSON.parse(raw) : [];
      const updatedList = [attempt, ...list.filter((a) => a.id !== attempt.id)].slice(0, 500);
      localStorage.setItem('spmo_all_attempts_v9', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Lỗi lưu lịch sử thi', e);
    }

    // Update candidate status in roster or add if new
    setCandidates((prev) => {
      const exists = prev.some((c) => c.fullName === attempt.candidateName && c.roomCode === attempt.roomCode);
      if (exists) {
        return prev.map((c) => {
          if (c.fullName === attempt.candidateName && c.roomCode === attempt.roomCode) {
            return {
              ...c,
              status: attempt.status.includes('VI PHẠM') ? 'violation' : 'submitted',
              submittedAt: attempt.submittedAt,
              score: attempt.score,
              correctCount: attempt.correct,
              totalQuestions: attempt.total,
              focusViolations: attempt.focusViolations,
            };
          }
          return c;
        });
      } else {
        const newCand: Candidate = {
          id: `cand-${Date.now()}`,
          fullName: attempt.candidateName,
          employeeCode: `NV-${Math.floor(1000 + Math.random() * 9000)}`,
          unit: attempt.unit,
          unitName: attempt.unitName,
          level: attempt.level,
          roomCode: attempt.roomCode,
          examCode: attempt.examCode,
          status: attempt.status.includes('VI PHẠM') ? 'violation' : 'submitted',
          submittedAt: attempt.submittedAt,
          score: attempt.score,
          correctCount: attempt.correct,
          totalQuestions: attempt.total,
          focusViolations: attempt.focusViolations,
        };
        return [newCand, ...prev];
      }
    });

    setView('exam_result');
  };

  // Admin login check
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');

    const savedPass = localStorage.getItem('spmo_admin_pass') || 'admin';

    if (adminUsername.trim().toLowerCase() === 'admin' && adminPassword === savedPass) {
      setShowAdminLoginModal(false);
      setAdminUsername('');
      setAdminPassword('');
      setView('admin_portal');
    } else {
      setAdminLoginError('Tài khoản hoặc mật khẩu quản trị không chính xác.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* View 1: Candidate Portal */}
      {view === 'candidate_portal' && (
        <CandidatePortal
          rooms={rooms}
          departments={departments}
          questions={questions}
          onStartExam={handleStartExam}
          onOpenAdminLogin={() => setShowAdminLoginModal(true)}
        />
      )}

      {/* View 2: Candidate Exam Session */}
      {view === 'candidate_exam' && activeSession && (
        <CandidateExam
          candidateName={activeSession.candidateName}
          unit={activeSession.unit}
          unitName={activeSession.unitName}
          level={activeSession.level}
          room={activeSession.room}
          examCode={activeSession.examCode}
          questions={activeSession.questions}
          mode={activeSession.mode}
          matrixWarnings={activeSession.matrixWarnings}
          matrixTargetTotal={activeSession.matrixTargetTotal}
          onFinishExam={handleFinishExam}
          onExit={() => setView('candidate_portal')}
        />
      )}

      {/* View 3: Exam Result Sheet */}
      {view === 'exam_result' && latestAttempt && (
        <ExamResultView
          attempt={latestAttempt}
          onRetest={() => setView('candidate_portal')}
          onHome={() => setView('candidate_portal')}
        />
      )}

      {/* View 4: Admin Portal */}
      {view === 'admin_portal' && (
        <AdminPortal
          rooms={rooms}
          candidates={candidates}
          questions={questions}
          departments={departments}
          onUpdateRooms={setRooms}
          onUpdateCandidates={setCandidates}
          onUpdateQuestions={setQuestions}
          onUpdateDepartments={setDepartments}
          onBackToHome={() => setView('candidate_portal')}
        />
      )}

      {/* Admin Login Dialog */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdminLogin}
            className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative animate-scaleUp"
          >
            <button
              type="button"
              onClick={() => {
                setShowAdminLoginModal(false);
                setAdminLoginError('');
              }}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-600 mb-4 shadow-md shadow-sky-500/10">
              <Key className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">Đăng Nhập Admin</h3>
            <p className="text-xs text-slate-500 mb-5">
              Quyền quản trị viên: Thiết lập phòng thi, ma trận & ngân hàng câu hỏi
            </p>

            {adminLoginError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Tên đăng nhập:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-sky-600/25 active:scale-98 transition-all cursor-pointer"
              >
                Xác Thực & Vào Quản Trị
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-1">
                Tài khoản mặc định: <span className="text-slate-800 font-mono font-bold">admin</span> / <span className="text-slate-800 font-mono font-bold">admin</span>
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
