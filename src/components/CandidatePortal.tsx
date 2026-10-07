import React, { useState, useEffect } from 'react';
import { 
  Key, ShieldCheck, Lock, Unlock, Play, Sparkles, UserCheck, 
  HelpCircle, BookOpen, AlertCircle, ArrowRight
} from 'lucide-react';
import { ExamRoom, DepartmentInfo, Question } from '../types/exam';

interface CandidatePortalProps {
  rooms: ExamRoom[];
  departments: DepartmentInfo[];
  questions: Question[];
  onStartExam: (
    candidateName: string,
    unit: string,
    unitName: string,
    level: string,
    room: ExamRoom,
    mode: 'official' | 'training'
  ) => void;
  onOpenAdminLogin: () => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  rooms,
  departments,
  questions,
  onStartExam,
  onOpenAdminLogin,
}) => {
  const [candidateName, setCandidateName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(departments[0]?.code || 'A');
  const [selectedLevel, setSelectedLevel] = useState('5');
  
  // Read room from URL query parameter (e.g. ?room=SPM-2026)
  const [selectedRoomCode, setSelectedRoomCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        const found = rooms.find((r) => r.roomCode.toUpperCase() === roomParam.toUpperCase());
        if (found) return found.roomCode;
      }
    }
    return rooms[0]?.roomCode || '';
  });

  const [enteredPin, setEnteredPin] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('pin') || '';
    }
    return '';
  });
  
  const [errorMessage, setErrorMessage] = useState('');

  // Selected room object
  const currentRoom = rooms.find((r) => r.roomCode === selectedRoomCode) || rooms[0];

  // Auto-align candidate's department and level with selected room's department and level
  useEffect(() => {
    if (currentRoom) {
      if (currentRoom.unit) {
        setSelectedUnit(currentRoom.unit);
      }
      if (currentRoom.level) {
        setSelectedLevel(String(currentRoom.level));
      }
    }
  }, [currentRoom?.id, currentRoom?.roomCode]);

  const handleStartOfficialExam = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!candidateName.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Họ và tên thí sinh.');
      return;
    }

    if (!currentRoom) {
      setErrorMessage('Chưa có phòng thi nào được chọn.');
      return;
    }

    // Check room lock and access PIN
    if (currentRoom.isLocked) {
      if (!enteredPin.trim()) {
        setErrorMessage('Phòng thi này đang bị KHÓA. Vui lòng nhập mã khóa phòng thi (PIN) do giám thị cung cấp.');
        return;
      }

      if (enteredPin.trim() !== currentRoom.accessPin.trim()) {
        setErrorMessage('Mã khóa phòng thi (PIN) không chính xác. Vui lòng kiểm tra lại!');
        return;
      }
    }

    const unitObj = departments.find((d) => d.code === selectedUnit);
    onStartExam(
      candidateName.trim(),
      selectedUnit,
      unitObj ? unitObj.name : selectedUnit,
      selectedLevel,
      currentRoom,
      'official'
    );
  };

  const handleStartTraining = () => {
    setErrorMessage('');
    if (!candidateName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên để bắt đầu thi luyện.');
      return;
    }

    const fallbackRoom: ExamRoom = currentRoom || {
      id: 'training-room',
      roomCode: 'LUYEN-FREE',
      roomName: 'Phòng Thi Luyện Tự Do',
      isLocked: false,
      accessPin: '',
      unit: selectedUnit,
      level: selectedLevel,
      examTimeMinutes: 45,
      totalQuestions: Math.min(questions.length, 30),
      maxFocusViolations: 10,
      activeCandidatesCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const unitObj = departments.find((d) => d.code === selectedUnit);
    onStartExam(
      candidateName.trim(),
      selectedUnit,
      unitObj ? unitObj.name : selectedUnit,
      selectedLevel,
      fallbackRoom,
      'training'
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-cyan-500/25">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight">
                SPMO Pro
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                DARK MODE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Hệ thống thi trắc nghiệm nâng bậc nghề & quản lý phòng thi trực tuyến
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAdminLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all shadow-sm"
        >
          <Key className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quản Trị (Admin)</span>
        </button>
      </header>

      {/* Main Candidate Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-lg w-full bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-2">
              CỔNG THI DÀNH CHO THÍ SINH
            </span>
            <h1 className="text-2xl font-black text-slate-100">
              Đăng Ký & Vào Phòng Thi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Điền thông tin và nhập mã khóa phòng thi do hội đồng thi cấp
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleStartOfficialExam} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                HỌ VÀ TÊN THÍ SINH: <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập họ và tên đầy đủ..."
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Department & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  BỘ PHẬN CÔNG TÁC:
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  BẬC DỰ THI:
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map((lv) => (
                    <option key={lv} value={lv}>
                      Bậc {lv} {lv === '1' ? '(Sơ cấp)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department Question Bank & Ladder Rule notice */}
            {currentRoom && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] flex items-center justify-between">
                <span className="font-semibold">
                  Kho đề phòng thi: <strong className="text-white">{departments.find(d => d.code === currentRoom.unit)?.name || 'Bộ phận ' + currentRoom.unit}</strong>
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  Bốc tích lũy Bậc 1 → Bậc {currentRoom.level || selectedLevel}
                </span>
              </div>
            )}

            {/* Exam Room Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>CHỌN PHÒNG THI:</span>
                {currentRoom?.isLocked ? (
                  <span className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                    <Lock className="w-3 h-3" />
                    Phòng có mã khóa
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <Unlock className="w-3 h-3" />
                    Mở tự do
                  </span>
                )}
              </label>
              <select
                value={selectedRoomCode}
                onChange={(e) => setSelectedRoomCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.roomCode}>
                    [{r.roomCode}] {r.roomName} ({r.examTimeMinutes} phút - {r.totalQuestions} câu) {r.isLocked ? '🔒' : ''}
                  </option>
                ))}
              </select>

              {/* Group question counts breakdown of selected room */}
              {currentRoom && (
                <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">Cơ cấu số câu theo từng nhóm:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {currentRoom.totalQuestions} câu • {currentRoom.examTimeMinutes} phút
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-mono font-bold">
                    <div className="bg-slate-900 py-1 rounded border border-cyan-500/30 text-cyan-300">
                      <span className="block text-[8px] text-slate-500 font-sans">AT</span>
                      {currentRoom.groupCounts?.at ?? 10}c
                    </div>
                    <div className="bg-slate-900 py-1 rounded border border-teal-500/30 text-teal-300">
                      <span className="block text-[8px] text-slate-500 font-sans">QT</span>
                      {currentRoom.groupCounts?.qt ?? 10}c
                    </div>
                    <div className="bg-slate-900 py-1 rounded border border-amber-500/30 text-amber-300">
                      <span className="block text-[8px] text-slate-500 font-sans">NQ</span>
                      {currentRoom.groupCounts?.nq ?? 5}c
                    </div>
                    <div className="bg-slate-900 py-1 rounded border border-indigo-500/30 text-indigo-300">
                      <span className="block text-[8px] text-slate-500 font-sans">TTD</span>
                      {currentRoom.groupCounts?.ttd ?? 5}c
                    </div>
                    <div className="bg-slate-900 py-1 rounded border border-purple-500/30 text-purple-300">
                      <span className="block text-[8px] text-slate-500 font-sans">AX</span>
                      {currentRoom.groupCounts?.ax ?? 20}c
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Room Lock Code / PIN Input (Active when room is locked) */}
            {currentRoom?.isLocked && (
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 animate-scaleUp">
                <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Yêu Cầu Mã Khóa Phòng Thi (PIN)</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Phòng thi này đã được quản trị viên khóa bảo mật. Hãy nhập mã PIN được cấp để tham gia.
                </p>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Nhập mã khóa phòng thi..."
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-sm font-mono text-amber-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleStartTraining}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Thi Luyện Tự Do</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>VÀO THI CHÍNH THỨC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Info Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Đề chuẩn ma trận: AT • QT • NQ • AX</span>
            <span className="text-cyan-400 font-medium">Bảo vệ chống gian lận</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 text-center text-xs text-slate-400 border-t border-slate-900">
        SPMO Pro © 2026 - Bản quyền phần mềm thi trắc nghiệm nâng bậc nghề & sát hạch kỹ thuật an toàn.
      </footer>
    </div>
  );
};
