import React, { useState, useMemo } from 'react';
import { 
  X, Printer, FileText, CheckCircle2, Shuffle, Layers, Download, BookOpen, 
  Check, FileDown, ShieldCheck, Building2, Edit3, Save, RotateCcw, AlertTriangle 
} from 'lucide-react';
import { ExamRoom, Question, DepartmentInfo, OrganizationConfig } from '../types/exam';
import { generateExamForRoom, generateShuffledExamVariants, ShuffledExamVariant, getQuestionBankInfo } from '../utils/questionMeta';
import { getSavedOrgConfig, saveOrgConfig, DEFAULT_ORG_CONFIG } from '../utils/organizationStorage';

interface PrintExamModalProps {
  room: ExamRoom;
  departments: DepartmentInfo[];
  questions: Question[];
  onClose: () => void;
  initialOrgConfig?: OrganizationConfig;
  onUpdateOrgConfig?: (cfg: OrganizationConfig) => void;
}

function downloadHtmlFile(filename: string, title: string, contentHtml: string) {
  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.4; color: #000; background: #fff; margin: 0; padding: 20px; }
    .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .table-head { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .table-head td { vertical-align: top; font-weight: bold; font-size: 11pt; }
    .title { text-align: center; margin: 15px 0; }
    .title h1 { font-size: 16pt; font-weight: bold; margin: 0; text-transform: uppercase; }
    .title p { margin: 4px 0; font-size: 12pt; }
    .meta-box { border: 1px dashed #444; padding: 10px 14px; margin: 12px 0; font-size: 11pt; background: #fafafa; }
    .question { margin-bottom: 14px; page-break-inside: avoid; }
    .question-title { font-weight: bold; margin-bottom: 4px; }
    .options { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; padding-left: 20px; }
    .answer-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .answer-table th, .answer-table td { border: 1px solid #333; padding: 6px; text-align: center; font-size: 11pt; }
    .answer-table th { background: #f0f0f0; }
    .citation-box { background: #f7fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; padding: 8px 12px; margin-bottom: 10px; font-size: 10.5pt; page-break-inside: avoid; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const PrintExamModal: React.FC<PrintExamModalProps> = ({
  room,
  departments,
  questions,
  onClose,
  initialOrgConfig,
  onUpdateOrgConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'paper' | 'bubble_sheet' | 'answer_key'>('paper');
  const [selectedExamCode, setSelectedExamCode] = useState<'101' | '102' | '103' | '104'>('101');
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Config for Company Title and Headers
  const [orgConfig, setOrgConfig] = useState<OrganizationConfig>(() => {
    return initialOrgConfig || getSavedOrgConfig();
  });
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const deptName = useMemo(() => {
    return departments.find((d) => d.code === room.unit)?.name || `Nhóm ${room.unit}`;
  }, [departments, room.unit]);

  // Base pool of questions selected according to room matrix (TTD questions strictly at end)
  const baseQuestions = useMemo(() => {
    return generateExamForRoom(room, questions);
  }, [room, questions]);

  // Generate 4 shuffled versions (with both question order and options shuffled, TTD always at end)
  const examVariants = useMemo(() => {
    return generateShuffledExamVariants(baseQuestions, ['101', '102', '103', '104'], shuffleOptions);
  }, [baseQuestions, shuffleOptions]);

  const currentVariant = examVariants[selectedExamCode] || examVariants['101'];

  const handlePrint = () => {
    window.print();
  };

  const handleSaveConfig = () => {
    saveOrgConfig(orgConfig);
    if (onUpdateOrgConfig) onUpdateOrgConfig(orgConfig);
    setToastMsg('Đã cập nhật tiêu đề Công ty và lưu thành công!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Xuất file Đề thi giấy để lưu trữ hoặc nộp in ấn
  const handleDownloadPaperDoc = () => {
    const qListHtml = currentVariant.questions.map((q, idx) => `
      <div class="question">
        <div class="question-title">Câu ${idx + 1}: ${q.question} <span style="font-size: 9pt; font-weight: normal; color: #444;">[${getQuestionBankInfo(q).fullLabel}]</span></div>
        <div class="options">
          ${Object.entries(q.options || {}).map(([k, val]) => `<div><b>${k}.</b> ${val}</div>`).join('')}
        </div>
      </div>
    `).join('');

    const htmlBody = `
      <div class="header">
        <table class="table-head">
          <tr>
            <td style="width: 50%; text-align: center;">
              ${orgConfig.parentOrg}<br>
              <b style="font-size: 12pt;">${orgConfig.companyName}</b><br>
              <i style="font-size: 10pt;">${orgConfig.documentNumber || 'Số: ..... /HĐSH'}</i>
            </td>
            <td style="width: 50%; text-align: center;">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
              <i style="font-weight: normal;">Độc lập - Tự do - Hạnh phúc</i><br>
              -------------------
            </td>
          </tr>
        </table>
        <div class="title">
          <h1>${orgConfig.examTitle}</h1>
          <p>Nhóm thi: <b>${deptName}</b> &bull; Bậc sát hạch: <b>BẬC ${room.level}</b></p>
          <div style="display: inline-block; padding: 4px 12px; border: 1px solid #000; font-weight: bold; margin-top: 5px;">
            MÃ ĐỀ THI: ${selectedExamCode} &bull; Thời gian làm bài: ${room.examTimeMinutes} phút (Không kể thời gian phát đề)
          </div>
        </div>
        <div class="meta-box">
          <table style="width: 100%;">
            <tr>
              <td>Họ và tên thí sinh: ................................................................</td>
              <td>Mã nhân viên / SBD: .....................................................</td>
            </tr>
            <tr>
              <td>Phòng thi: <b>${room.roomCode}</b> - ${room.roomName}</td>
              <td>Ngày thi: ......./......./2026</td>
            </tr>
            <tr>
              <td>Chữ ký Giám thị 1: .....................................................</td>
              <td>Chữ ký Giám thị 2: .....................................................</td>
            </tr>
            <tr>
              <td colspan="2">Điểm số: ................................................... (Bằng chữ: ........................................................................................)</td>
            </tr>
          </table>
        </div>
        <p style="font-style: italic; font-size: 10.5pt; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
          * Ghi chú: Thí sinh không được sử dụng tài liệu. Hãy chọn 01 phương án đúng nhất và tô vào Phiếu trả lời trắc nghiệm.
        </p>
      </div>
      <div class="content">
        ${qListHtml}
      </div>
      <div style="text-align: center; margin-top: 30px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px;">
        --- HẾT (Đề thi gồm ${currentVariant.questions.length} câu trắc nghiệm) ---
      </div>
    `;

    downloadHtmlFile(`De_Thi_${room.roomCode}_MaDe_${selectedExamCode}.html`, `Đề thi mã ${selectedExamCode} - ${room.roomCode}`, htmlBody);
  };

  // Xuất file Đáp án so sánh & Phiếu chấm điểm cho Ban giám khảo
  const handleDownloadComparisonAnswerKeyDoc = () => {
    const totalQCount = currentVariant.questions.length;
    const tableRows = Array.from({ length: totalQCount }, (_, i) => i + 1).map((qNum) => {
      const q = examVariants['101']?.questions[qNum - 1];
      const citationText = q?.citation ? q.citation : (q?.section ? `Nhóm ${q.section}` : '');
      return `
        <tr>
          <td><b>${qNum}</b></td>
          <td style="font-weight: bold; color: #2563eb;">${examVariants['101']?.answerKey[qNum] || '-'}</td>
          <td style="font-weight: bold; color: #d97706;">${examVariants['102']?.answerKey[qNum] || '-'}</td>
          <td style="font-weight: bold; color: #059669;">${examVariants['103']?.answerKey[qNum] || '-'}</td>
          <td style="font-weight: bold; color: #7c3aed;">${examVariants['104']?.answerKey[qNum] || '-'}</td>
          <td style="text-align: left; font-size: 10pt;">${citationText}</td>
        </tr>
      `;
    }).join('');

    const citationDetails = currentVariant.questions.map((q, idx) => {
      const explainCit = [q.citation, q.explanation].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' - ');
      return `
      <div class="citation-box">
        <b>Câu ${idx + 1} (${q.section}):</b> Đáp án đúng là <b>[${q.correct}]</b>.<br>
        ${explainCit ? `<span>📌 <b>Giải thích trích dẫn:</b> ${explainCit}</span>` : '<i>(Chưa kèm giải thích trích dẫn)</i>'}
      </div>
    `;
    }).join('');

    const htmlBody = `
      <div class="header">
        <table class="table-head">
          <tr>
            <td style="width: 50%; text-align: center;">
              ${orgConfig.parentOrg}<br>
              <b>${orgConfig.companyName}</b><br>
              <i>BAN GIÁM KHẢO & CHẤM THI</i>
            </td>
            <td style="width: 50%; text-align: center;">
              <b>TÀI LIỆU BẢO MẬT PHỤC VỤ CHẤM THI</b><br>
              <i>Phòng thi: ${room.roomCode}</i>
            </td>
          </tr>
        </table>
        <div class="title">
          <h1 style="color: #b91c1c;">BẢNG ĐÁP ÁN ĐỐI CHIẾU SO SÁNH & CHẤM ĐIỂM</h1>
          <p>Kỳ thi sát hạch nâng bậc nghề &bull; Nhóm: <b>${deptName}</b> &bull; Bậc: <b>BẬC ${room.level}</b></p>
          <p>Tổng số câu hỏi: <b>${room.totalQuestions} câu</b> &bull; Chế độ: Đã trộn ngẫu nhiên câu hỏi và đáp án 4 mã đề</p>
        </div>
      </div>

      <h3 style="text-transform: uppercase; margin-top: 20px;">1. Bảng Ma Trận So Sánh Đáp Án Theo 4 Mã Đề (101, 102, 103, 104)</h3>
      <table class="answer-table">
        <thead>
          <tr>
            <th style="width: 60px;">Câu số</th>
            <th style="width: 90px; background: #e0f2fe;">Mã đề 101</th>
            <th style="width: 90px; background: #fef3c7;">Mã đề 102</th>
            <th style="width: 90px; background: #d1fae5;">Mã đề 103</th>
            <th style="width: 90px; background: #ede9fe;">Mã đề 104</th>
            <th>Phần giải thích trích dẫn</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <h3 style="text-transform: uppercase; margin-top: 30px;">2. Phần Giải Thích Trích Dẫn Chi Tiết (Phục vụ phúc khảo & giải trình)</h3>
      ${citationDetails}

      <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 33%; text-align: center; border: none;">
              <b>CHỦ TỊCH HỘI ĐỒNG</b><br><br><br><br>
              <b>${orgConfig.councilPresident}</b>
            </td>
            <td style="width: 33%; text-align: center; border: none;">
              <b>CÁN BỘ GIÁM THỊ 1</b><br><br><br><br>
              <b>${orgConfig.supervisor1}</b>
            </td>
            <td style="width: 33%; text-align: center; border: none;">
              <b>CÁN BỘ GIÁM THỊ 2</b><br><br><br><br>
              <b>${orgConfig.supervisor2}</b>
            </td>
          </tr>
        </table>
      </div>
    `;

    downloadHtmlFile(`Bang_Dap_An_So_Sanh_${room.roomCode}_4MaDe.html`, `Bảng đáp án so sánh chấm điểm - ${room.roomCode}`, htmlBody);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header - Not Printed */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/25">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>In Ấn & Xuất Bản Đề Thi Giấy</span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {room.roomCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {deptName} &bull; Bậc {room.level} &bull; {room.totalQuestions} câu &bull; Trộn 4 mã đề &bull; Nhóm TTD luôn xếp sau cùng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Config Editor */}
            <button
              onClick={() => setShowConfigEditor(!showConfigEditor)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                showConfigEditor
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Tùy chỉnh tiêu đề Công ty, đơn vị tổ chức trên đề thi"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{showConfigEditor ? 'Ẩn Cấu Hình' : 'Tùy Chỉnh Tiêu Đề Đơn Vị'}</span>
            </button>

            {/* Download Action Buttons */}
            {activeTab === 'paper' && (
              <button
                onClick={handleDownloadPaperDoc}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 text-xs font-bold transition-all shadow-sm"
                title="Tải file đề thi để mở trong Word hoặc gửi in ấn"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Tải Đề Thi (.html/Word)</span>
              </button>
            )}

            {activeTab === 'answer_key' && (
              <button
                onClick={handleDownloadComparisonAnswerKeyDoc}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold transition-all shadow-sm"
                title="Tải bảng so sánh đáp án đối chiếu để chấm điểm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Tải Đáp Án So Sánh (.html)</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>In Tài Liệu (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs font-semibold flex items-center justify-between animate-fadeIn print:hidden">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {toastMsg}
            </span>
          </div>
        )}

        {/* Matrix Shortage Warning for Paper Print */}
        {(baseQuestions as any)?.matrixWarnings?.length > 0 && (
          <div className="bg-amber-500/15 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between animate-fadeIn print:hidden">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Cảnh báo ma trận:</strong> Đề thi thực tế có {baseQuestions.length} câu (cấu hình phòng yêu cầu {room.totalQuestions} câu). Hệ thống đã bỏ qua phần thiếu do kho đề chưa có và không lấy câu hỏi khác thay thế vào.</span>
            </div>
          </div>
        )}

        {/* Collapsible Config Editor for Organization Title */}
        {showConfigEditor && (
          <div className="bg-slate-950/95 border-b border-slate-800 p-4 space-y-3 text-xs print:hidden animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Tùy Chỉnh Tiêu Đề Công Ty & Đơn Vị Tổ Chức (Áp Dụng Cho Bản In)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tên Tập đoàn / Cơ quan cấp trên:</label>
                <input
                  type="text"
                  value={orgConfig.parentOrg}
                  onChange={(e) => setOrgConfig({ ...orgConfig, parentOrg: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tên Công ty / Hội đồng thi:</label>
                <input
                  type="text"
                  value={orgConfig.companyName}
                  onChange={(e) => setOrgConfig({ ...orgConfig, companyName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tiêu đề bài thi:</label>
                <input
                  type="text"
                  value={orgConfig.examTitle}
                  onChange={(e) => setOrgConfig({ ...orgConfig, examTitle: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Tiêu Đề</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Selector & Exam Code Selector - Not Printed */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('paper')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'paper' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Đề Thi Bằng Giấy (Mã {selectedExamCode})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('answer_key')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'answer_key' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2. File Đáp Án So Sánh Chấm Điểm</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bubble_sheet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'bubble_sheet' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3. Phiếu Trả Lời Trắc Nghiệm</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Option shuffle toggle */}
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="rounded accent-blue-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-medium">Trộn đáp án A/B/C/D</span>
            </label>

            {/* Exam Code Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                <Shuffle className="w-3.5 h-3.5 text-blue-400" />
                <span>Mã đề:</span>
              </span>
              {(['101', '102', '103', '104'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedExamCode(code)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-all text-xs ${
                    selectedExamCode === code
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Printable Paper Content Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-950/50 print:p-0 print:bg-white print:text-black">
          
          {/* TAB 1: ĐỀ THI IN ẤN A4 */}
          {activeTab === 'paper' && (
            <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 print:max-w-none text-sm font-serif">
              {/* Header EVN / Company */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-center font-bold text-xs uppercase leading-tight w-[48%]">
                    <p className="text-[11px]">{orgConfig.parentOrg}</p>
                    <p className="font-extrabold text-xs sm:text-sm mt-0.5">{orgConfig.companyName}</p>
                    <p className="text-[11px] font-normal italic mt-0.5">{orgConfig.documentNumber || 'Số: ...... /HĐSH'}</p>
                  </div>

                  <div className="text-center font-bold text-xs uppercase leading-tight w-[48%]">
                    <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-normal italic normal-case text-[11px] mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">-------o0o-------</p>
                  </div>
                </div>

                <div className="text-center mt-4 font-sans">
                  <h1 className="text-lg font-black uppercase tracking-wide">
                    {orgConfig.examTitle}
                  </h1>
                  <p className="text-xs font-semibold mt-1">
                    Nhóm thi: <span className="uppercase">{deptName}</span> &bull; Bậc sát hạch: <span className="font-bold">BẬC {room.level}</span>
                  </p>
                  <div className="inline-block px-3 py-1 mt-2 border border-slate-900 rounded font-mono font-bold text-xs bg-slate-50">
                    MÃ ĐỀ THI: {selectedExamCode} &bull; Thời gian làm bài: {room.examTimeMinutes} phút (Không kể phát đề)
                  </div>
                </div>

                {/* Candidate Info Box on Paper */}
                <div className="mt-4 pt-3 border-t border-dashed border-slate-400 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-sans">
                  <div>Họ và tên thí sinh: ................................................................</div>
                  <div>Mã nhân viên / SBD: .....................................................</div>
                  <div>Phòng sát hạch: <strong className="font-mono">{room.roomCode}</strong></div>
                  <div>Chữ ký Giám thị 1: ..................... Giám thị 2: .....................</div>
                  <div className="col-span-2">Điểm số: ................................... (Bằng chữ: ....................................................................)</div>
                </div>
              </div>

              {/* Notice */}
              <p className="text-[11px] italic text-slate-600 mb-4 pb-2 border-b border-slate-200 font-sans">
                * Thí sinh không được sử dụng tài liệu. Hãy chọn 01 phương án đúng nhất và tô vào Phiếu trả lời trắc nghiệm. Các câu hỏi nhóm Thị trường điện (TTD) được bố trí ở phần sau cùng.
              </p>

              {/* Questions List */}
              <div className="space-y-5 font-sans">
                {currentVariant.questions.map((q, idx) => (
                  <div key={q.id || idx} className="text-xs leading-relaxed break-inside-avoid">
                    <p className="font-bold text-slate-900 mb-1.5 flex items-start gap-1.5">
                      <span className="font-mono text-sm shrink-0">Câu {idx + 1}:</span>
                      <span>{q.question}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-normal ml-auto">[{q.section}]</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-6">
                      {Object.entries(q.options || {}).map(([optKey, optVal]) => (
                        <div key={optKey} className="flex items-start gap-1.5 text-slate-800">
                          <span className="font-bold font-mono">{optKey}.</span>
                          <span>{optVal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t-2 border-slate-900 text-center text-xs italic font-semibold font-sans">
                --- HẾT (Đề thi gồm {currentVariant.questions.length} câu trắc nghiệm) ---
              </div>
            </div>
          )}

          {/* TAB 2: BẢNG ĐÁP ÁN ĐỐI CHIẾU SO SÁNH CHẤM ĐIỂM */}
          {activeTab === 'answer_key' && (
            <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 print:max-w-none text-xs font-sans">
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-center font-bold text-xs uppercase leading-tight w-[48%]">
                    <p className="text-[11px]">{orgConfig.parentOrg}</p>
                    <p className="font-extrabold text-xs sm:text-sm mt-0.5">{orgConfig.companyName}</p>
                    <p className="text-[10px] italic text-slate-600 mt-0.5">BAN GIÁM KHẢO & COI CHẤM THI</p>
                  </div>
                  <div className="text-center font-bold text-xs uppercase leading-tight w-[48%]">
                    <p className="text-rose-700">TÀI LIỆU MẬT PHỤC VỤ CHẤM THI</p>
                    <p className="font-normal italic normal-case text-[11px]">Kỳ sát hạch chuyên môn nghề</p>
                    <p className="text-[11px] font-mono mt-0.5">Phòng thi: {room.roomCode}</p>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-rose-800">
                    BẢNG ĐÁP ÁN ĐỐI CHIẾU SO SÁNH & CĂN CỨ PHÁP LÝ (4 MÃ ĐỀ)
                  </h1>
                  <p className="text-xs font-semibold mt-1">
                    Nhóm thi: <strong className="uppercase">{deptName}</strong> &bull; Bậc sát hạch: <strong className="font-bold">BẬC {room.level}</strong> &bull; Số lượng: {room.totalQuestions} câu
                  </p>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="mb-6">
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                        <th className="p-2 border-r border-slate-300 w-12">Câu số</th>
                        <th className="p-2 border-r border-slate-300 bg-blue-50 text-blue-800 w-20">Mã đề 101</th>
                        <th className="p-2 border-r border-slate-300 bg-amber-50 text-amber-800 w-20">Mã đề 102</th>
                        <th className="p-2 border-r border-slate-300 bg-emerald-50 text-emerald-800 w-20">Mã đề 103</th>
                        <th className="p-2 border-r border-slate-300 bg-purple-50 text-purple-800 w-20">Mã đề 104</th>
                        <th className="p-2 text-left">Phần giải thích trích dẫn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: currentVariant.questions.length }, (_, i) => i + 1).map((qNum) => {
                        const q101 = examVariants['101']?.questions[qNum - 1];
                        const citationText = q101?.citation ? q101.citation : (q101?.section ? `Nhóm ${q101.section}` : '');

                        return (
                          <tr key={qNum} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-1.5 font-bold font-mono border-r border-slate-300">{qNum}</td>
                            <td className="p-1.5 font-bold font-mono border-r border-slate-300 text-blue-700 bg-blue-50/30">
                              {examVariants['101']?.answerKey[qNum] || '-'}
                            </td>
                            <td className="p-1.5 font-bold font-mono border-r border-slate-300 text-amber-700 bg-amber-50/30">
                              {examVariants['102']?.answerKey[qNum] || '-'}
                            </td>
                            <td className="p-1.5 font-bold font-mono border-r border-slate-300 text-emerald-700 bg-emerald-50/30">
                              {examVariants['103']?.answerKey[qNum] || '-'}
                            </td>
                            <td className="p-1.5 font-bold font-mono border-r border-slate-300 text-purple-700 bg-purple-50/30">
                              {examVariants['104']?.answerKey[qNum] || '-'}
                            </td>
                            <td className="p-1.5 text-left text-slate-700 text-[10.5px]">
                              {citationText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 text-center font-bold text-xs pt-4 border-t border-slate-300">
                <div>
                  <p>TRƯỞNG BAN CHẤM THI</p>
                  <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                  <div className="h-14"></div>
                  <p>{orgConfig.councilPresident}</p>
                </div>
                <div>
                  <p>CÁN BỘ CHẤM THI 1</p>
                  <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                  <div className="h-14"></div>
                  <p>{orgConfig.supervisor1}</p>
                </div>
                <div>
                  <p>CÁN BỘ CHẤM THI 2</p>
                  <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                  <div className="h-14"></div>
                  <p>{orgConfig.supervisor2}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHIẾU TRẢ LỜI TRẮC NGHIỆM */}
          {activeTab === 'bubble_sheet' && (
            <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 print:max-w-none text-xs font-sans">
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-center font-bold text-xs uppercase leading-tight w-[48%]">
                    <p className="text-[11px]">{orgConfig.parentOrg}</p>
                    <p className="font-extrabold text-xs mt-0.5">{orgConfig.companyName}</p>
                  </div>
                  <div className="text-center font-bold text-xs uppercase leading-tight w-[48%]">
                    <p>HỘI ĐỒNG SÁT HẠCH KỸ THUẬT</p>
                    <p className="font-normal italic normal-case text-[11px]">Năm 2026</p>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-wide">
                    PHIẾU TRẢ LỜI TRẮC NGHIỆM BÀI THI LÝ THUYẾT
                  </h1>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    (Dùng cho chấm thi bằng tay hoặc máy chấm quang học)
                  </p>
                </div>

                {/* Candidate Info Grid on Bubble Sheet */}
                <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-2 gap-3 text-xs">
                  <div>1. Họ và tên thí sinh: ................................................................</div>
                  <div>2. Mã nhân viên / SBD: .....................................................</div>
                  <div>3. Bộ phận: <strong>{deptName}</strong></div>
                  <div>4. Bậc sát hạch: <strong>BẬC {room.level}</strong></div>
                  <div>5. Phòng thi: <strong>{room.roomCode}</strong></div>
                  <div>6. Mã đề thi: [ &nbsp; &nbsp; &nbsp; &nbsp; ] (Ghi mã 101/102/103/104)</div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px] mb-5 leading-relaxed italic text-slate-700">
                <strong>Hướng dẫn tô phiếu:</strong> Dùng bút chì hoặc bút bi tô kín vào ô tròn tương ứng với phương án lựa chọn [A] [B] [C] [D]. Không được đánh dấu chéo (X) hoặc gạch xiên.
              </div>

              {/* 50 / 60 Bubble Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, colIdx) => {
                  const startQ = colIdx * 15 + 1;
                  const endQ = Math.min((colIdx + 1) * 15, room.totalQuestions);
                  if (startQ > room.totalQuestions) return null;

                  return (
                    <div key={colIdx} className="border border-slate-300 rounded p-2 bg-white">
                      <div className="text-[10px] font-bold text-center text-slate-500 mb-1.5 border-b border-slate-200 pb-1">
                        Câu {startQ} - {endQ}
                      </div>
                      <div className="space-y-1">
                        {Array.from({ length: endQ - startQ + 1 }).map((_, qOffset) => {
                          const qNum = startQ + qOffset;
                          return (
                            <div key={qNum} className="flex items-center justify-between text-[11px]">
                              <span className="font-bold font-mono w-6 text-slate-700">{qNum}.</span>
                              <div className="flex gap-1">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                  <div
                                    key={opt}
                                    className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center font-bold text-[9px] hover:bg-slate-200 cursor-pointer"
                                  >
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Signatures */}
              <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 text-center font-bold text-xs">
                <div>
                  <p>CHỮ KÝ CỦA THÍ SINH</p>
                  <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                  <div className="h-14"></div>
                </div>
                <div>
                  <p>CHỮ KÝ CÁN BỘ COI THI</p>
                  <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                  <div className="h-14"></div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
