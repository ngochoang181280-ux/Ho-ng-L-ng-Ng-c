import React, { useState, useMemo } from 'react';
import { X, Printer, FileText, CheckCircle2, Shuffle, Layers, Download, BookOpen } from 'lucide-react';
import { ExamRoom, Question, DepartmentInfo } from '../types/exam';
import { generateExamForRoom } from '../utils/questionMeta';

interface PrintExamModalProps {
  room: ExamRoom;
  departments: DepartmentInfo[];
  questions: Question[];
  onClose: () => void;
}

export const PrintExamModal: React.FC<PrintExamModalProps> = ({
  room,
  departments,
  questions,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'paper' | 'bubble_sheet' | 'answer_key'>('paper');
  const [selectedExamCode, setSelectedExamCode] = useState<'101' | '102' | '103' | '104'>('101');

  const deptName = useMemo(() => {
    return departments.find((d) => d.code === room.unit)?.name || `Bộ phận ${room.unit}`;
  }, [departments, room.unit]);

  // Base pool of questions selected according to room matrix
  const baseQuestions = useMemo(() => {
    return generateExamForRoom(room, questions);
  }, [room, questions]);

  // Generate 4 shuffled versions with deterministic seed
  const examVariants = useMemo(() => {
    const codes = ['101', '102', '103', '104'] as const;
    const variants: Record<string, { questions: Question[]; answerKey: Record<number, string> }> = {};

    codes.forEach((code, codeIdx) => {
      // Deterministic permutation based on code
      const shuffledQ = [...baseQuestions].sort((a, b) => {
        const hashA = (a.id.charCodeAt(a.id.length - 1) * 31 + codeIdx * 17) % 100;
        const hashB = (b.id.charCodeAt(b.id.length - 1) * 31 + codeIdx * 17) % 100;
        return hashA - hashB;
      });

      const keyMap: Record<number, string> = {};
      shuffledQ.forEach((q, i) => {
        keyMap[i + 1] = q.correct;
      });

      variants[code] = {
        questions: shuffledQ,
        answerKey: keyMap,
      };
    });

    return variants;
  }, [baseQuestions]);

  const currentVariant = examVariants[selectedExamCode] || examVariants['101'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header - Not Printed */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                <span>Xuất Bản Đề Thi Giấy & Bảng Đáp Án (A4 Print Ready)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {room.roomCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {deptName} • Bậc {room.level} • Tổng {room.totalQuestions} câu • {room.examTimeMinutes} phút
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
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

        {/* Tab Selector & Exam Code Selector - Not Printed */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('paper')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'paper' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Đề Thi In Ấn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bubble_sheet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'bubble_sheet' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>2. Phiếu Trả Lời Trắc Nghiệm</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('answer_key')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'answer_key' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>3. Bảng Đáp Án Đối Chiếu (Key Master)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mã đề hoán vị:</span>
            </span>
            {(['101', '102', '103', '104'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedExamCode(code)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-all ${
                  selectedExamCode === code
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Mã {code}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Paper Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/40 print:p-0 print:bg-white print:text-black">
          
          {/* TAB 1: ĐỀ THI IN ẤN A4 */}
          {activeTab === 'paper' && (
            <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 print:max-w-none text-sm font-sans">
              {/* Header EVN / SPMO */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-center font-bold text-xs uppercase leading-tight">
                    <p>TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM</p>
                    <p className="font-extrabold text-sm mt-0.5">HỘI ĐỒNG SÁT HẠCH NGHỀ SPMO</p>
                    <p className="text-[11px] font-normal italic mt-0.5">Số: ...... /HĐSH-SPMO</p>
                  </div>

                  <div className="text-center font-bold text-xs uppercase leading-tight">
                    <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-normal italic normal-case text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-[10px] text-slate-500 mt-1">-------o0o-------</p>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <h1 className="text-lg font-black uppercase tracking-wide">
                    ĐỀ THI SÁT HẠCH NÂNG BẬC NGHỀ KỸ THUẬT
                  </h1>
                  <p className="text-xs font-semibold mt-1">
                    Bộ phận: <span className="uppercase">{deptName}</span> • Bậc sát hạch: <span className="font-bold">BẬC {room.level}</span>
                  </p>
                  <div className="inline-block px-3 py-1 mt-2 border border-slate-900 rounded font-mono font-bold text-xs bg-slate-50">
                    MÃ ĐỀ THI: {selectedExamCode} • Thời gian làm bài: {room.examTimeMinutes} phút (Không kể phát đề)
                  </div>
                </div>

                {/* Candidate Info Box on Paper */}
                <div className="mt-4 pt-3 border-t border-dashed border-slate-400 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>Họ và tên thí sinh: ................................................................</div>
                  <div>Mã nhân viên / SBD: .....................................................</div>
                  <div>Phòng sát hạch: <strong className="font-mono">{room.roomCode}</strong></div>
                  <div>Chữ ký Giám thị 1: ..................... Giám thị 2: .....................</div>
                </div>
              </div>

              {/* Notice */}
              <p className="text-[11px] italic text-slate-600 mb-4 pb-2 border-b border-slate-200">
                * Thí sinh không được sử dụng tài liệu. Hãy chọn 01 phương án đúng nhất và tô vào Phiếu trả lời trắc nghiệm.
              </p>

              {/* Questions List */}
              <div className="space-y-5">
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
              <div className="mt-8 pt-4 border-t-2 border-slate-900 text-center text-xs italic font-semibold">
                --- HẾT (Đề thi gồm {currentVariant.questions.length} câu trắc nghiệm) ---
              </div>
            </div>
          )}

          {/* TAB 2: PHIẾU TRẢ LỜI TRẮC NGHIỆM */}
          {activeTab === 'bubble_sheet' && (
            <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 print:max-w-none text-xs font-sans">
              <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
                <h2 className="text-base font-black uppercase">PHIẾU TRẢ LỜI TRẮC NGHIỆM SÁT HẠCH NGHỀ</h2>
                <p className="text-[11px] text-slate-600 mt-1">Hội đồng thi SPMO • Phòng thi: {room.roomCode}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-300 mb-6 text-xs">
                <div>Họ và tên thí sinh: ................................................................</div>
                <div>Số báo danh: [  ][  ][  ][  ]</div>
                <div>Ngày sinh: ...../...../......... Đơn vị: {deptName}</div>
                <div>Mã đề thi: [  ][  ][  ] (Tô đúng mã đề)</div>
              </div>

              <div className="mb-4 text-[11px] italic bg-slate-50 p-2.5 rounded border border-slate-300">
                Hướng dẫn: Dùng bút chì 2B hoặc bút bi tô đen tròn vào ô phương án lựa chọn: [A] [B] [C] [D]
              </div>

              {/* Bubbles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                {Array.from({ length: room.totalQuestions }, (_, i) => i + 1).map((num) => (
                  <div key={num} className="p-1.5 border border-slate-200 rounded flex items-center justify-between text-[11px]">
                    <span className="font-bold w-6 text-slate-700">{num}.</span>
                    <div className="flex items-center gap-1 font-bold text-slate-600">
                      <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">A</span>
                      <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">B</span>
                      <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">C</span>
                      <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">D</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between text-center text-xs font-semibold">
                <div>
                  <p>GIÁM THỊ 1</p>
                  <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                  <p>GIÁM THỊ 2</p>
                  <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                  <p>THÍ SINH</p>
                  <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BẢNG ĐÁP ÁN ĐỐI CHIẾU (ANSWER KEY MASTER) */}
          {activeTab === 'answer_key' && (
            <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:max-w-none text-xs font-sans">
              <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
                <h2 className="text-base font-black uppercase text-rose-700">BẢNG ĐÁP ÁN ĐỐI CHIẾU CHẤM THI (ANSWER KEY MASTER)</h2>
                <p className="text-xs font-semibold mt-1">Phòng thi: {room.roomCode} • Bộ phận: {deptName} • Bậc {room.level}</p>
                <p className="text-[11px] text-slate-500 italic mt-0.5">Tài liệu bảo mật - Dành riêng cho Ban Giám Khảo & Hội Đồng Chấm Thi</p>
              </div>

              {/* 4-Code Quick Matrix */}
              <div className="mb-6">
                <h4 className="font-bold text-xs uppercase mb-2 text-slate-800">
                  Bảng Tra Cứu Đáp Án Nhanh Theo 4 Mã Đề (101, 102, 103, 104):
                </h4>
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300">
                        <th className="p-1.5 border-r border-slate-300">Câu</th>
                        <th className="p-1.5 border-r border-slate-300 bg-cyan-50">Mã 101</th>
                        <th className="p-1.5 border-r border-slate-300 bg-amber-50">Mã 102</th>
                        <th className="p-1.5 border-r border-slate-300 bg-emerald-50">Mã 103</th>
                        <th className="p-1.5 bg-purple-50">Mã 104</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {Array.from({ length: room.totalQuestions }, (_, i) => i + 1).map((qNum) => (
                        <tr key={qNum} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-1 font-bold text-slate-600 border-r border-slate-300">{qNum}</td>
                          <td className="p-1 font-black text-cyan-700 border-r border-slate-300">{examVariants['101']?.answerKey[qNum] || '-'}</td>
                          <td className="p-1 font-black text-amber-700 border-r border-slate-300">{examVariants['102']?.answerKey[qNum] || '-'}</td>
                          <td className="p-1 font-black text-emerald-700 border-r border-slate-300">{examVariants['103']?.answerKey[qNum] || '-'}</td>
                          <td className="p-1 font-black text-purple-700">{examVariants['104']?.answerKey[qNum] || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Citations & Explanations Details for Dispute Resolution */}
              <div className="space-y-3 pt-4 border-t border-slate-300">
                <h4 className="font-bold text-xs uppercase text-slate-800">
                  Căn Cứ Pháp Lý & Trích Dẫn Quy Chuẩn Chi Tiết (Giải Quyết Khiếu Nại):
                </h4>
                {currentVariant.questions.map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] leading-relaxed">
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Câu {idx + 1} ({q.section}): Đáp án đúng là [{q.correct}]</span>
                    </div>
                    {q.citation && (
                      <p className="text-slate-700">📌 <strong>Căn cứ:</strong> {q.citation}</p>
                    )}
                    {q.explanation && (
                      <p className="text-slate-600 mt-0.5">💡 <strong>Giải thích:</strong> {q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
