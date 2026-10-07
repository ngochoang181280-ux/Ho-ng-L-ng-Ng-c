import React, { useState } from 'react';
import { 
  X, ShieldAlert, Users, Clock, AlertTriangle, 
  CheckCircle2, RefreshCw, Send, Lock, Unlock, Eye, Sparkles 
} from 'lucide-react';
import { Candidate, ExamRoom } from '../types/exam';

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

  const roomCandidates = candidates.filter((c) => c.roomCode === room.roomCode);

  const handleWarnCandidate = (candId: string, candName: string) => {
    const updated = candidates.map((c) => {
      if (c.id === candId) {
        return { ...c, focusViolations: c.focusViolations + 1 };
      }
      return c;
    });
    onUpdateCandidates(updated);
    setProctorNotice(`Đã gửi cảnh báo giám thị nghiêm khắc tới thí sinh [${candName}]!`);
    setTimeout(() => setProctorNotice(null), 4000);
  };

  const handleForceSubmit = (candId: string, candName: string) => {
    if (confirm(`Bạn có chắc chắn muốn THU BÀI CƯỠNG CHẾ của thí sinh [${candName}] do vi phạm quy chế?`)) {
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
      setProctorNotice(`Đã thu bài cưỡng chế của thí sinh [${candName}] thành công!`);
      setTimeout(() => setProctorNotice(null), 4000);
    }
  };

  const handleResetAttempts = (candId: string, candName: string) => {
    if (confirm(`Cho phép thí sinh [${candName}] xóa vi phạm và tiếp tục làm bài?`)) {
      const updated = candidates.map((c) => {
        if (c.id === candId) {
          return { ...c, focusViolations: 0, status: 'testing' as const };
        }
        return c;
      });
      onUpdateCandidates(updated);
      setProctorNotice(`Đã xóa vi phạm cho thí sinh [${candName}].`);
      setTimeout(() => setProctorNotice(null), 4000);
    }
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
                          {isSubmitted ? `${(cand.score || 0).toFixed(1)} / 10đ` : 'Đang xử lý...'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      {!isSubmitted && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleWarnCandidate(cand.id, cand.fullName)}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold transition-colors text-center"
                          >
                            ⚠️ Cảnh cáo
                          </button>

                          <button
                            type="button"
                            onClick={() => handleForceSubmit(cand.id, cand.fullName)}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold transition-colors text-center"
                          >
                            ⛔ Thu bài
                          </button>
                        </>
                      )}

                      {isSubmitted && (
                        <button
                          type="button"
                          onClick={() => handleResetAttempts(cand.id, cand.fullName)}
                          className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors text-center"
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
      </div>
    </div>
  );
};
