import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, ShieldCheck, Lock, Unlock, Play, Sparkles, UserCheck, 
  HelpCircle, BookOpen, AlertCircle, ArrowRight, Building2, Download
} from 'lucide-react';
import { ExamRoom, DepartmentInfo, Question } from '../types/exam';
import { getSavedOrgConfig } from '../utils/organizationStorage';
import { filterQuestionsForRoom } from '../utils/questionMeta';
import { UserGuideModal } from './UserGuideModal';
import { downloadUserGuideWordDoc } from '../utils/userGuideExport';

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
  const orgConfig = useMemo(() => getSavedOrgConfig(), []);
  const [candidateName, setCandidateName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(departments[0]?.code || 'A');
  const [selectedLevel, setSelectedLevel] = useState('5');
  const [showUserGuide, setShowUserGuide] = useState(false);
  
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

  // Kiểm tra khả năng đáp ứng câu hỏi của kho đề so với ma trận phòng thi
  const roomStockInfo = useMemo(() => {
    if (!currentRoom || questions.length === 0) return null;
    const filtered = filterQuestionsForRoom(questions, currentRoom, selectedLevel);
    const totalEligible = filtered.atPool.length + filtered.nqPool.length + filtered.qtPool.length + filtered.ttdPool.length + filtered.axAllEligiblePool.length;
    const targetQ = currentRoom.totalQuestions || 50;
    return {
      totalEligible,
      targetQ,
      hasShortage: totalEligible < targetQ,
    };
  }, [currentRoom, questions, selectedLevel]);

  // Auto-align candidate's department and level with selected room's department and level
  useEffect(() => {
    if (currentRoom) {
      if (currentRoom.unit) {
        setSelectedUnit(currentRoom.unit);
      }
      // Nếu phòng thi cố định một bậc cụ thể (khác ALL), đồng bộ bậc thi của thí sinh
      if (currentRoom.level && currentRoom.level !== 'ALL' && !currentRoom.allowAnyLevel) {
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

    // Check if questions bank is empty
    if (questions.length === 0) {
      setErrorMessage('Ngân hàng đề thi hiện chưa có câu hỏi nào. Quản trị viên vui lòng vào mục "Quản trị hệ thống" để nạp câu hỏi từ file Word (.docx) trước khi tổ chức thi.');
      return;
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

    if (questions.length === 0) {
      setErrorMessage('Ngân hàng đề thi hiện chưa có câu hỏi nào để luyện thi. Quản trị viên vui lòng nạp câu hỏi từ file Word vào hệ thống.');
      return;
    }

    let defaultAdminTotalQ = 50;
    try {
      const savedDefault = typeof localStorage !== 'undefined' ? localStorage.getItem('spmo_default_matrix_v9') : null;
      if (savedDefault) {
        const parsed = JSON.parse(savedDefault);
        if (parsed.totalQuestions && parsed.totalQuestions > 0) {
          defaultAdminTotalQ = parsed.totalQuestions;
        }
      }
    } catch {}

    const targetRoom: ExamRoom = currentRoom ? {
      ...currentRoom,
      totalQuestions: currentRoom.totalQuestions || defaultAdminTotalQ,
    } : {
      id: 'training-room',
      roomCode: 'LUYEN-FREE',
      roomName: 'Phòng Thi Luyện Tự Do',
      isLocked: false,
      accessPin: '',
      unit: selectedUnit,
      level: selectedLevel,
      examTimeMinutes: 45,
      totalQuestions: defaultAdminTotalQ,
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
      targetRoom,
      'training'
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between selection:bg-sky-500/25">
      {/* EVN Electric Blue Header */}
      <header className="evn-header-bg text-white shadow-md border-b border-sky-700/40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center font-black text-white text-base shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight uppercase">
                {orgConfig.companyName}
              </span>
            </div>
            <p className="text-[11px] text-sky-100/90 hidden sm:block">
              {orgConfig.parentOrg} &bull; Hệ thống thi trắc nghiệm nâng bậc nghề trực tuyến
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUserGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Xem hướng dẫn dành cho thí sinh"
          >
            <BookOpen className="w-3.5 h-3.5 text-white" />
            <span>Hướng Dẫn Thi</span>
          </button>

          <button
            type="button"
            onClick={() => downloadUserGuideWordDoc()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Tải cẩm nang hướng dẫn sử dụng file Word (.doc)"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Tải File Word (.doc)</span>
          </button>

          <button
            onClick={onOpenAdminLogin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer active:scale-95"
          >
            <Key className="w-3.5 h-3.5 text-white" />
            <span>Quản Trị (Admin)</span>
          </button>
        </div>
      </header>

      {/* Main Candidate Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              CỔNG DỰ THI DÀNH CHO THÍ SINH
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              Đăng Ký & Vào Phòng Thi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Điền thông tin và chọn phòng thi do Hội đồng sát hạch công bố
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleStartOfficialExam} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                HỌ VÀ TÊN THÍ SINH: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập họ và tên đầy đủ..."
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Department & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  BỘ PHẬN CÔNG TÁC:
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                >
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  BẬC DỰ THI:
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
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
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="font-semibold">
                  Kho đề phòng thi: <strong className="text-sky-900">{departments.find(d => d.code === currentRoom.unit)?.name || 'Bộ phận ' + currentRoom.unit}</strong>
                  {currentRoom.customExamCode && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-sky-200/80 text-sky-900 font-mono text-[10px] font-bold border border-sky-300">
                      Mã đề: {currentRoom.customExamCode}
                    </span>
                  )}
                </span>
                <span className="text-sky-700 font-mono text-[11px] font-bold">
                  {currentRoom.level === 'ALL' || currentRoom.allowAnyLevel
                    ? `⭐ Ma trận: Bậc 1 → ${selectedLevel} của bạn`
                    : `Bốc tích lũy Bậc 1 → Bậc ${currentRoom.level || selectedLevel}`}
                </span>
              </div>
            )}

            {/* Exam Room Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>CHỌN PHÒNG THI:</span>
                {currentRoom?.isLocked ? (
                  <span className="text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                    <Lock className="w-3 h-3 text-amber-600" />
                    Phòng có mã khóa
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                    <Unlock className="w-3 h-3 text-emerald-600" />
                    Mở tự do
                  </span>
                )}
              </label>
              <select
                value={selectedRoomCode}
                onChange={(e) => setSelectedRoomCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-sky-500"
              >
                {rooms.map((r) => {
                  const dept = departments.find((d) => d.code === r.unit);
                  const isAllLevels = r.level === 'ALL' || r.allowAnyLevel;
                  return (
                    <option key={r.id} value={r.roomCode}>
                      [{r.roomCode}] {r.roomName} — Nhóm {dept ? dept.name : r.unit} ({isAllLevels ? 'Mọi Bậc 1-8' : `Bậc ${r.level}`}) {r.customExamCode ? `[Mã: ${r.customExamCode}]` : ''} {r.isLocked ? '🔒' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Group question counts breakdown of selected room */}
              {currentRoom && (
                <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Cơ cấu số câu theo từng nhóm:</span>
                    <span className="font-mono font-bold text-sky-700">
                      {currentRoom.totalQuestions} câu • {currentRoom.examTimeMinutes} phút
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-[10px] text-center font-mono font-bold">
                    <div className="bg-white py-1.5 rounded-lg border border-emerald-300 text-emerald-700 shadow-2xs">
                      <span className="block text-[8px] text-slate-500 font-sans">AT</span>
                      {currentRoom.groupCounts?.at ?? 10}c
                    </div>
                    <div className="bg-white py-1.5 rounded-lg border border-sky-300 text-sky-700 shadow-2xs">
                      <span className="block text-[8px] text-slate-500 font-sans">QT</span>
                      {currentRoom.groupCounts?.qt ?? 10}c
                    </div>
                    <div className="bg-white py-1.5 rounded-lg border border-amber-300 text-amber-700 shadow-2xs">
                      <span className="block text-[8px] text-slate-500 font-sans">NQ</span>
                      {currentRoom.groupCounts?.nq ?? 5}c
                    </div>
                    <div className="bg-white py-1.5 rounded-lg border border-purple-300 text-purple-700 shadow-2xs" title="Nhóm câu hỏi TTD luôn đưa ra sau cùng">
                      <span className="block text-[8px] text-slate-500 font-sans">TTD (Cuối)</span>
                      {currentRoom.groupCounts?.ttd ?? 5}c
                    </div>
                    <div className="bg-white py-1.5 rounded-lg border border-indigo-300 text-indigo-700 shadow-2xs">
                      <span className="block text-[8px] text-slate-500 font-sans">Chuyên môn</span>
                      {currentRoom.groupCounts?.ax ?? 20}c
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Room Lock Code / PIN Input (Active when room is locked) */}
            {currentRoom?.isLocked && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 animate-scaleUp">
                <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Yêu Cầu Mã Khóa Phòng Thi (PIN)</span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2">
                  Phòng thi này đã được quản trị viên khóa bảo mật. Hãy nhập mã PIN được cấp để tham gia.
                </p>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Nhập mã khóa phòng thi..."
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-400 rounded-xl text-sm font-mono text-amber-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons: Rõ ràng giữa Luyện Thi (hiện trích dẫn) và Thi Thật */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleStartTraining}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-white hover:bg-sky-50 text-sky-800 font-bold text-xs sm:text-sm border-2 border-sky-300 shadow-md active:scale-98 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                title="Bắt đầu thi luyện tập: Sau khi nộp bài sẽ hiển thị đầy đủ đáp án đúng và Căn cứ trích dẫn của từng câu hỏi"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span className="font-extrabold text-sky-900 text-sm">THI LUYỆN TẬP (ÔN TẬP)</span>
                </div>
                <span className="text-[10.5px] text-sky-700 font-semibold">
                  {roomStockInfo?.hasShortage
                    ? `⚠️ Ma trận ${roomStockInfo.targetQ}c (Kho có ${roomStockInfo.totalEligible}c - Sẽ bỏ qua phần thiếu)`
                    : `✓ Chuẩn ${currentRoom?.totalQuestions || 50} câu • Mở trích dẫn & giải thích`}
                </span>
              </button>

              <button
                type="submit"
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-sky-600/25 active:scale-98 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                title="Vào thi sát hạch chính thức: Màn hình bảo mật điểm số, cho phép xuất file Word đối chiếu"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-sm">VÀO THI CHÍNH THỨC</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10.5px] text-sky-100 font-semibold">
                  {roomStockInfo?.hasShortage
                    ? `⚠️ Ma trận ${roomStockInfo.targetQ}c (Kho có ${roomStockInfo.totalEligible}c - Sẽ bỏ qua phần thiếu)`
                    : `🔒 Chuẩn ${currentRoom?.totalQuestions || 50} câu • Giám sát bảo mật`}
                </span>
              </button>
            </div>
          </form>

          {/* Quick Info Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Đề chuẩn ma trận: AT • QT • NQ • AX</span>
            <span className="text-sky-600 font-bold">Bảo vệ tính toàn vẹn</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        SPMO Pro © 2026 - Bản quyền phần mềm thi trắc nghiệm nâng bậc nghề & sát hạch kỹ thuật an toàn.
      </footer>

      {/* Modal: Hướng Dẫn Dành Cho Thí Sinh */}
      {showUserGuide && (
        <UserGuideModal
          initialTab="candidate"
          onClose={() => setShowUserGuide(false)}
        />
      )}
    </div>
  );
};
