import React, { useState } from 'react';
import { 
  FileText, Upload, CheckCircle2, AlertCircle, X, 
  Sparkles, Eye, ArrowRight, BookOpen, Layers
} from 'lucide-react';
import { Question } from '../types/exam';
import { parseDocxFile, parseRawTextQuestions } from '../utils/wordParser';

interface WordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: Question[]) => void;
}

export const WordImportModal: React.FC<WordImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [targetSection, setTargetSection] = useState('AT');
  const [targetLevel, setTargetLevel] = useState('COMMON');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResults, setParsedResults] = useState<Question[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [aiFallbackLoading, setAiFallbackLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Word file upload and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setWarnings([]);

    try {
      if (file.name.endsWith('.docx')) {
        const { questions, warnings: parseWarnings } = await parseDocxFile(
          file,
          targetSection,
          targetLevel
        );
        setParsedResults(questions);
        setWarnings(parseWarnings);
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text();
        const questions = parseRawTextQuestions(text, targetSection, targetLevel);
        setParsedResults(questions);
      } else {
        setWarnings(['Vui lòng chọn file định dạng .docx hoặc .txt']);
      }
    } catch (err: any) {
      console.error('File parsing error', err);
      setWarnings(['Lỗi đọc file: ' + err.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle pasted text parsing
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    try {
      const questions = parseRawTextQuestions(pastedText, targetSection, targetLevel);
      setParsedResults(questions);
      if (questions.length === 0) {
        setWarnings(['Không tìm thấy câu hỏi nào. Hãy đảm bảo định dạng: Câu 1: ... A. ... B. ...']);
      } else {
        setWarnings([]);
      }
    } catch (err: any) {
      setWarnings(['Lỗi xử lý văn bản: ' + err.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  // If local parser found 0 questions, use Google AI to parse irregular Word documents
  const handleAiFallbackParse = async () => {
    if (!pastedText.trim() && !selectedFile) {
      alert('Vui lòng chọn file Word hoặc dán văn bản trước.');
      return;
    }

    setAiFallbackLoading(true);

    try {
      let content = pastedText;
      if (selectedFile && !content) {
        content = await selectedFile.text();
      }

      const res = await fetch('/api/ai/extract-from-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: content,
          department: 'Nhà máy điện',
          level: targetLevel.replace('A', '') || '5',
          customPrompt: 'Phân tích văn bản Word này và trích xuất thành danh sách câu hỏi trắc nghiệm A, B, C, D.',
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        const formatted: Question[] = data.questions.map((q: any, i: number) => ({
          id: `ai-word-${Date.now()}-${i}`,
          number: `${i + 1}`,
          question: q.question,
          options: q.options,
          correct: q.correct || 'A',
          section: targetSection,
          level: targetLevel,
          citation: q.citation || selectedFile?.name || 'File Word',
          explanation: q.explanation || '',
        }));
        setParsedResults(formatted);
        setWarnings([]);
      } else {
        alert('Google AI không tìm thấy câu hỏi hợp lệ trong văn bản: ' + (data.error || ''));
      }
    } catch (e: any) {
      alert('Lỗi gọi Google AI: ' + e.message);
    } finally {
      setAiFallbackLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedResults.length === 0) return;
    onImportQuestions(parsedResults);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative animate-scaleUp my-auto max-h-[92vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Thêm Ngân Hàng Đề Thi Từ File Word (.docx)
              </h3>
              <p className="text-xs text-slate-400">
                Tự động nhận diện câu hỏi, 4 phương án A/B/C/D, đáp án đúng (in đậm hoặc "Đáp án: B")
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-2 gap-3 py-3 my-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Gán vào nhóm câu hỏi:</label>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
            >
              <option value="AT">Mức I (AT - An toàn)</option>
              <option value="QT">Mức II (QT - Quy trình)</option>
              <option value="NQ">Mức III (NQ - Nội quy)</option>
              <option value="TTD">Mức IV (TTD - Điều độ)</option>
              <option value="A5.1">Chuyên môn A5.1</option>
              <option value="A6.1">Chuyên môn A6.1</option>
              <option value="A4.1">Chuyên môn A4.1</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Bậc áp dụng:</label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
            >
              <option value="COMMON">Dùng chung (Mọi bậc)</option>
              <option value="A2">Bậc 2 (A2)</option>
              <option value="A3">Bậc 3 (A3)</option>
              <option value="A4">Bậc 4 (A4)</option>
              <option value="A5">Bậc 5 (A5)</option>
              <option value="A6">Bậc 6 (A6)</option>
              <option value="A7">Bậc 7 (A7)</option>
              <option value="A8">Bậc 8 (A8)</option>
            </select>
          </div>
        </div>

        {/* Tabs: Upload File vs Paste Text */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setImportMode('file')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              importMode === 'file'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Chọn file Word (.docx)
          </button>
          <button
            onClick={() => setImportMode('paste')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              importMode === 'paste'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Dán văn bản câu hỏi
          </button>
        </div>

        {/* Body content based on mode */}
        <div className="flex-1 overflow-y-auto max-h-72 pr-1">
          {importMode === 'file' ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/50 hover:border-cyan-500/50 transition-colors cursor-pointer text-center relative">
              <input
                type="file"
                accept=".docx,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-10 h-10 text-cyan-400 mb-2" />
              <p className="text-sm font-bold text-slate-200">
                {selectedFile ? selectedFile.name : 'Nhấp để chọn hoặc kéo thả file Word (.docx)'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hỗ trợ file đề thi trắc nghiệm của Nhà máy điện, XSC cơ, XSC điện, Trưởng ca
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={6}
                placeholder="Dán nội dung câu hỏi vào đây...
VD:
Câu 1: Khoảng cách an toàn điện áp 110kV là bao nhiêu?
A. 0.7m
B. 1.0m
C. 1.5m
D. 2.0m
Đáp án: C
Trích dẫn: Quy chuẩn QCVN 01:2020"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={handleParsePastedText}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                Nhận diện câu hỏi
              </button>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-4 text-xs text-cyan-400 font-semibold animate-pulse">
              Đang phân tích cấu trúc tài liệu...
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              {warnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}

              <div className="pt-2 mt-2 border-t border-amber-500/20 flex items-center justify-between">
                <span>Định dạng không khớp? Bạn có thể dùng Google AI đọc hiểu:</span>
                <button
                  onClick={handleAiFallbackParse}
                  disabled={aiFallbackLoading}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Dùng Google AI phân tích</span>
                </button>
              </div>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedResults.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã nhận diện thành công: {parsedResults.length} câu hỏi
                </span>
                <span className="text-[11px] text-slate-500">Xem trước 2 câu đầu</span>
              </div>

              <div className="space-y-2">
                {parsedResults.slice(0, 2).map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                    <p className="font-semibold text-slate-200">
                      Câu {idx + 1}: {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-1 mt-1.5 text-slate-400 text-[11px]">
                      {Object.entries(q.options).map(([k, val]) => (
                        <span key={k} className={q.correct.includes(k) ? 'text-emerald-400 font-bold' : ''}>
                          {k}. {val}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-cyan-400 mt-1">Đáp án: {q.correct}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Đóng
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedResults.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>Nhập {parsedResults.length} Câu Vào Ngân Hàng</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
