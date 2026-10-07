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
import { generateExamForRoom } from './utils/questionMeta';
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

  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('spmo_questions_v9');
      return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });

  const [departments] = useState<DepartmentInfo[]>(DEFAULT_DEPARTMENTS);

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

  // Start exam from Candidate Portal
  const handleStartExam = (
    candidateName: string,
    unit: string,
    unitName: string,
    level: string,
    room: ExamRoom,
    mode: 'official' | 'training'
  ) => {
    // Sinh đề thi chính xác theo bộ phận của phòng thi, bậc thi và ma trận phân bổ
    const selectedQuestions = generateExamForRoom(room, questions);

    const examCode = `${unit}${Math.floor(100 + Math.random() * 900)}`;

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
    });

    setView('candidate_exam');
  };

  // Exam finished callback
  const handleFinishExam = (attempt: ExamAttempt) => {
    setLatestAttempt(attempt);

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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
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
          onBackToHome={() => setView('candidate_portal')}
        />
      )}

      {/* Admin Login Dialog */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleAdminLogin}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative animate-scaleUp"
          >
            <button
              type="button"
              onClick={() => {
                setShowAdminLoginModal(false);
                setAdminLoginError('');
              }}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/20">
              <Key className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-100 mb-1">Đăng Nhập Admin</h3>
            <p className="text-xs text-slate-400 mb-5">
              Quyền quản trị viên: Thiết lập phòng thi, khóa đề & giám sát
            </p>

            {adminLoginError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Tên đăng nhập:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-98 transition-all"
              >
                Xác Thực & Vào Quản Trị
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                Tài khoản mặc định: <span className="text-slate-300 font-mono">admin</span> / <span className="text-slate-300 font-mono">admin</span>
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
