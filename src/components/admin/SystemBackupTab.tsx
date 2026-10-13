import React, { useState, useRef } from 'react';
import { 
  Database, Download, Upload, CheckCircle2, AlertTriangle, 
  RefreshCw, ShieldCheck, FileJson, Layers, Server 
} from 'lucide-react';
import { ExamRoom, Candidate, Question, DepartmentInfo, OrganizationConfig, SystemBackupData } from '../../types/exam';
import { 
  createSystemBackupData, 
  downloadSystemBackupFile, 
  parseAndValidateBackupJson, 
  applyRestoredBackup 
} from '../../utils/systemBackup';

interface SystemBackupTabProps {
  rooms: ExamRoom[];
  candidates: Candidate[];
  questions: Question[];
  departments: DepartmentInfo[];
  onRestoreComplete: (restored: {
    rooms: ExamRoom[];
    candidates: Candidate[];
    questions: Question[];
    departments: DepartmentInfo[];
    orgConfig: OrganizationConfig;
  }) => void;
}

export const SystemBackupTab: React.FC<SystemBackupTabProps> = ({
  rooms,
  candidates,
  questions,
  departments,
  onRestoreComplete,
}) => {
  const [backupToast, setBackupToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedBackupData, setSelectedBackupData] = useState<SystemBackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Xuất file sao lưu toàn bộ hệ thống
  const handleExportBackup = () => {
    try {
      const backupData = createSystemBackupData(rooms, candidates, questions, departments);
      downloadSystemBackupFile(backupData);
      setBackupToast({
        type: 'success',
        message: `Đã xuất file sao lưu hệ thống JSON thành công! (${backupData.questions.length} câu hỏi, ${backupData.rooms.length} phòng, ${backupData.candidates.length} thí sinh)`,
      });
      setTimeout(() => setBackupToast(null), 5000);
    } catch (err: any) {
      setBackupToast({
        type: 'error',
        message: `Lỗi khi xuất sao lưu: ${err?.message || 'Không xác định'}`,
      });
    }
  };

  // 2. Chọn và phân tích file JSON sao lưu
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = parseAndValidateBackupJson(text);
      if (res.success && res.data) {
        setSelectedBackupData(res.data);
        setBackupToast({
          type: 'success',
          message: `Đã đọc thành công file sao lưu! Vui lòng xem trước thông tin bên dưới và bấm "Xác Nhận Khôi Phục".`,
        });
      } else {
        setSelectedBackupData(null);
        setBackupToast({
          type: 'error',
          message: `File không hợp lệ: ${res.error}`,
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 3. Tiến hành khôi phục
  const handleExecuteRestore = () => {
    if (!selectedBackupData) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const result = applyRestoredBackup(selectedBackupData, restoreMode, {
          rooms,
          candidates,
          questions,
          departments,
        });

        onRestoreComplete(result);
        setSelectedBackupData(null);
        setBackupToast({
          type: 'success',
          message: `Khôi phục dữ liệu hệ thống thành công theo chế độ [${restoreMode === 'overwrite' ? 'Ghi đè hoàn toàn' : 'Hợp nhất dữ liệu'}]!`,
        });
      } catch (err: any) {
        setBackupToast({
          type: 'error',
          message: `Lỗi khi khôi phục dữ liệu: ${err?.message}`,
        });
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-[#0066b2] flex items-center justify-center shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Sao Lưu & Phục Hồi Dữ Liệu Hệ Thống</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Toàn vẹn 100%
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Xuất toàn bộ cơ sở dữ liệu hệ thống ra file .JSON an toàn và khôi phục khi chuyển máy hoặc phòng ngừa sự cố.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportBackup}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066b2] hover:bg-[#005291] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Tải Xuất File Sao Lưu (.JSON)</span>
        </button>
      </div>

      {/* Notification Toast */}
      {backupToast && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn ${
            backupToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {backupToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{backupToast.message}</span>
        </div>
      )}

      {/* Grid: Current System Snapshot vs Restore Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Snapshot hiện tại của hệ thống */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-base text-slate-900">
              Dữ Liệu Hiện Tại Đang Lưu Trữ
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Ngân hàng câu hỏi:</span>
              <span className="text-xl font-black text-slate-900">{questions.length} câu</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Số phòng thi:</span>
              <span className="text-xl font-black text-slate-900">{rooms.length} phòng</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Danh sách thí sinh:</span>
              <span className="text-xl font-black text-slate-900">{candidates.length} người</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Bộ phận chuyên môn:</span>
              <span className="text-xl font-black text-slate-900">{departments.length} nhóm</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-sky-950">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              Khuyến nghị an toàn:
            </p>
            Trước khi tiến hành sát hạch chính thức hoặc sau khi hoàn thành đợt thi, quản trị viên nên bấm <strong>"Tải Xuất File Sao Lưu"</strong> để lưu trữ một bản sao tại ổ đĩa an toàn.
          </div>
        </div>

        {/* Right: Khu vực Nhập file khôi phục */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">
              Nhập File Khôi Phục Dữ Liệu (.JSON)
            </h3>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-sky-50/30"
          >
            <FileJson className="w-10 h-10 mx-auto mb-2 text-sky-600" />
            <p className="font-bold text-sm text-slate-800">
              Bấm vào đây để chọn file sao lưu (.JSON)
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Hỗ trợ file xuất từ hệ thống SPMO Pro
            </p>
          </div>

          {/* Preview Backup Data Before Applying */}
          {selectedBackupData && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Thông tin gói sao lưu:</span>
                <span className="font-mono text-slate-500">
                  {new Date(selectedBackupData.exportedAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>Câu hỏi: <strong>{selectedBackupData.questions?.length || 0}</strong></div>
                <div>Phòng thi: <strong>{selectedBackupData.rooms?.length || 0}</strong></div>
                <div>Thí sinh: <strong>{selectedBackupData.candidates?.length || 0}</strong></div>
                <div>Bộ phận: <strong>{selectedBackupData.departments?.length || 0}</strong></div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">Chế độ khôi phục:</span>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="restore_mode"
                      checked={restoreMode === 'overwrite'}
                      onChange={() => setRestoreMode('overwrite')}
                      className="text-sky-600"
                    />
                    <span className="font-semibold text-slate-800">Ghi đè hoàn toàn (Khuyên dùng)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="restore_mode"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="text-sky-600"
                    />
                    <span className="font-semibold text-slate-800">Gộp với dữ liệu hiện có</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleExecuteRestore}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang khôi phục...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Khôi Phục Dữ Liệu Ngay</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
