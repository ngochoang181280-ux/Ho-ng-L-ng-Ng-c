import React, { useState, useEffect } from 'react';
import { 
  X, ShieldAlert, Users, Clock, AlertTriangle, 
  CheckCircle2, RefreshCw, Send, Lock, Unlock, Eye, Sparkles, PlusCircle 
} from 'lucide-react';
import { Candidate, ExamRoom } from '../types/exam';
import { realtimeExamBus } from '../utils/realtimeProctor';

interface LiveProctoringModalProps {
  room: ExamRoom;
  candidates: Candidate[];
  onUpdateCandidates: (updated: Candidate[]) => void;
  onClose: () => void;
}

export const LiveProctoringModal: React.FC<LiveProctoringModalProps> = ({
  room,
  candidates,
  onUpdateCandidates,
  onClose,
}) => {
  const [proctorNotice, setProctorNotice] = useState<string | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{
    candId: string;
    candName: string;
    type: 'force_submit' | 'reset';
  } | null>(null);

  // Lưu trạng thái trực tiếp của thí sinh từ Realtime Bus
  const [liveCandidateStats, setLiveCandidateStats] = useState<Record<string, {
    currentIndex?: number;
    answeredCount?: number;
    totalQuestions?: number;
    remainingSeconds?: number;
    focusViolations?: number;
    lastPing: number;
  }>>({});

  useEffect(() => {
    const unsubscribe = realtimeExamBus.subscribe((msg) => {
      if (msg.roomCode === room.roomCode) {
        setLiveCandidateStats((prev) => ({
          ...prev,
          [msg.candidateName]: {
            currentIndex: msg.currentIndex,
            answeredCount: msg.answeredCount,
            totalQuestions: msg.totalQuestions,
            remainingSeconds: msg.remainingSeconds,
            focusViolations: msg.focusViolations,
            lastPing: Date.now(),
          },
        }));

        // Đồng bộ số lần vi phạm nếu thí sinh gửi lên
        if (msg.focusViolations !== undefined) {
          onUpdateCandidates(
            candidates.map((c) => {
              if (c.fullName === msg.candidateName && c.focusViolations !== msg.focusViolations) {
                return { ...c, focusViolations: msg.focusViolations || 0 };
              }
              return c;
            })
          );
        }
      }
    });

    return () => unsubscribe();
  }, [room.roomCode, candidates, onUpdateCandidates]);

  const roomCandidates = candidates.filter((c) => c.roomCode === room.roomCode);

  const handleWarnCandidate = (candId: string, candName: string) => {
    const updated = candidates.map((c) => {
      if (c.id === candId) {
        return { ...c, focusViolations: c.focusViolations + 1 };
      }
      return c;
    });
    onUpdateCandidates(updated);

    // Gửi cảnh báo thời gian thực tới tab của thí sinh
    realtimeExamBus.send({
      type: 'PROCTOR_WARNING',
      candidateName: candName,
      roomCode: room.roomCode,
      warningText: `CẢNH BÁO TỪ GIÁM THỊ: Bạn vừa có hành vi bất thường/rời màn hình thi. Hãy tập trung làm bài theo quy chế sát hạch!`,
      timestamp: Date.now(),
    });

    setProctorNotice(`Đã gửi cảnh báo giám thị trực tiếp tới màn hình của thí sinh [${candName}]!`);
    setTimeout(() => setProctorNotice(null), 4000);
  };

  const handleAddTimeCandidate = (candName: string, extraMinutes: number = 5) => {
    const extraSeconds = extraMinutes * 60;
    realtimeExamBus.send({
      type: 'ADD_TIME',
      candidateName: candName,
      roomCode: room.roomCode,
      extraSeconds,
      timestamp: Date.now(),
    });

    setProctorNotice(`Đã cộng thêm ${extraMinutes} phút làm bài cho thí sinh [${candName}] thành công!`);
    setTimeout(() => setProctorNotice(null), 4000);
  };

  const handleForceSubmit = (candId: string, candName: string) => {
    setActionConfirm({
      candId,
      candName,
      type: 'force_submit',
    });
  };

  const executeForceSubmit = (candId: string, candName: string) => {
    // Phát lệnh thu bài cưỡng chế tới tab thí sinh
    realtimeExamBus.send({
      type: 'FORCE_SUBMIT',
      candidateName: candName,
      roomCode: room.roomCode,
      timestamp: Date.now(),
    });

    const updated = candidates.map((c) => {
      if (c.id === candId) {
        return { 
          ...c, 
          status: 'submitted' as const, 
          score: Math.min(c.score || 0, 4.0), // Điểm phạt vi phạm
          submittedAt: new Date().toISOString() 
        };
      }
      return c;
    });
    onUpdateCandidates(updated);
    setActionConfirm(null);
    setProctorNotice(`Đã kích hoạt thu bài cưỡng chế cho thí sinh [${candName}]!`);
    setTimeout(() => setProctorNotice(null), 4000);
  };

  const handleResetAttempts = (candId: string, candName: string) => {
    setActionConfirm({
      candId,
      candName,
      type: 'reset',
    });
  };

  const executeResetAttempts = (candId: string, candName: string) => {
    const updated = candidates.map((c) => {
      if (c.id === candId) {
        return { ...c, focusViolations: 0, status: 'testing' as const };
      }
      return c;
    });
    onUpdateCandidates(updated);
    setActionConfirm(null);
    setProctorNotice(`Đã xóa vi phạm cho thí sinh [${candName}].`);
    setTimeout(() => setProctorNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-100">
                  Bảng Giám Sát Phòng Thi Thời Gian Thực (Live Proctoring)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>ĐANG GIÁM SÁT</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Phòng [{room.roomCode}]: {room.roomName} • {roomCandidates.length} thí sinh trong danh sách
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        {proctorNotice && (
          <div className="px-5 py-3 bg-cyan-500/20 border-b border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{proctorNotice}</span>
          </div>
        )}

        {/* Real-time Candidate Monitoring Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Danh sách giám sát thiết bị & hành vi thí sinh trong phòng:</span>
            <span>Tự động cập nhật mỗi 5 giây</span>
          </div>

          {roomCandidates.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-400 text-sm">
              Chưa có thí sinh nào đăng ký vào phòng thi này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomCandidates.map((cand) => {
                const isViolated = cand.focusViolations > 0;
                const isCritical = cand.focusViolations >= room.maxFocusViolations;
                const isSubmitted = cand.status === 'submitted';

                return (
                  <div
                    key={cand.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCritical
                        ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/30'
                        : isViolated
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : isSubmitted
                        ? 'bg-slate-950/40 border-slate-800 opacity-90'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                          <span>{cand.fullName}</span>
                          {isCritical && <span className="text-xs">🚨</span>}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {cand.employeeCode || 'SBD-00'} • {cand.unitName}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                        isSubmitted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : cand.status === 'testing'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isSubmitted ? 'ĐÃ NỘP BÀI' : cand.status === 'testing' ? 'ĐANG LÀM BÀI' : 'CHƯA VÀO'}
                      </span>
                    </div>

                    {/* Violations & Progress */}
                    <div className="space-y-2 py-2 border-y border-slate-800/80 my-2 text-xs">
                      {/* Live progress box if candidate is sending heartbeats */}
                      {liveCandidateStats[cand.fullName] && (
                        <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-800/50 text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                              <span>Đang làm:</span>
                            </span>
                            <span className="font-mono font-bold text-sky-300">
                              Câu {liveCandidateStats[cand.fullName].currentIndex || 1}/{liveCandidateStats[cand.fullName].totalQuestions || '?'}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Đã chọn:</span>
                            <span className="font-mono font-bold text-emerald-300">
                              {liveCandidateStats[cand.fullName].answeredCount || 0} câu
                            </span>
                          </div>
                          {liveCandidateStats[cand.fullName].remainingSeconds !== undefined && (
                            <div className="flex justify-between text-slate-300">
                              <span>Thời gian còn:</span>
                              <span className="font-mono font-bold text-amber-300">
                                {Math.floor((liveCandidateStats[cand.fullName].remainingSeconds || 0) / 60)}p {(liveCandidateStats[cand.fullName].remainingSeconds || 0) % 60}s
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Rời màn hình:</span>
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          isCritical
                            ? 'bg-rose-500 text-white animate-pulse'
                            : isViolated
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-300'
                        }`}>
                          {cand.focusViolations}/{room.maxFocusViolations} lần
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Điểm số / Kết quả:</span>
                        <span className="font-mono font-bold text-cyan-300">
                          {isSubmitted ? `${(cand.score || 0).toFixed(1)} / 10đ` : 'Đang thi trực tiếp...'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-1 text-xs flex-wrap">
                      {!isSubmitted && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleWarnCandidate(cand.id, cand.fullName)}
                            className="flex-1 min-w-[70px] py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold transition-colors text-center cursor-pointer"
                            title="Gửi cảnh báo trực tiếp tới màn hình thí sinh"
                          >
                            ⚠️ Cảnh cáo
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddTimeCandidate(cand.fullName, 5)}
                            className="flex-1 min-w-[70px] py-1.5 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-semibold transition-colors text-center cursor-pointer"
                            title="Cộng thêm 5 phút thời gian làm bài"
                          >
                            +5 Phút
                          </button>

                          <button
                            type="button"
                            onClick={() => handleForceSubmit(cand.id, cand.fullName)}
                            className="flex-1 min-w-[70px] py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold transition-colors text-center cursor-pointer"
                            title="Thu bài cưỡng chế ngay lập tức"
                          >
                            ⛔ Thu bài
                          </button>
                        </>
                      )}

                      {isSubmitted && (
                        <button
                          type="button"
                          onClick={() => handleResetAttempts(cand.id, cand.fullName)}
                          className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors text-center cursor-pointer"
                        >
                          🔄 Cho thi lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {actionConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${actionConfirm.type === 'force_submit' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-100">
                  {actionConfirm.type === 'force_submit' ? 'Xác nhận thu bài cưỡng chế' : 'Xác nhận cho thi lại'}
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {actionConfirm.type === 'force_submit'
                  ? `Bạn có chắc chắn muốn THU BÀI CƯỠNG CHẾ thí sinh [${actionConfirm.candName}] do vi phạm quy chế thi?`
                  : `Bạn có chắc muốn xóa vi phạm và cho phép thí sinh [${actionConfirm.candName}] tiếp tục làm bài?`}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionConfirm(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (actionConfirm.type === 'force_submit') {
                      executeForceSubmit(actionConfirm.candId, actionConfirm.candName);
                    } else {
                      executeResetAttempts(actionConfirm.candId, actionConfirm.candName);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold ${
                    actionConfirm.type === 'force_submit'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {actionConfirm.type === 'force_submit' ? 'Thu bài ngay' : 'Đồng ý cho thi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
