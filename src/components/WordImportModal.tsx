import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, Upload, CheckCircle2, AlertCircle, X,
  Sparkles, ArrowRight, Info, Copy
} from 'lucide-react';
import { Question, DepartmentInfo } from '../types/exam';
import {
  DocxContent,
  ParsedQuestionDraft,
  parsePlainText,
  parseWordContent,
  readDocxContent,
} from '../utils/wordParser';
import { normalizeImportedMeta } from '../utils/questionMeta';

interface WordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: Question[]) => void;
  /** Danh sách bộ phận (kho đề) hiện có */
  departments?: DepartmentInfo[];
  /** Ngân hàng câu hỏi hiện tại - dùng để phát hiện câu trùng */
  existingQuestions?: Question[];
}

type GroupType = 'AT' | 'QT' | 'NQ' | 'TTD' | 'AX';

const GROUP_OPTIONS: { value: GroupType; label: string }[] = [
  { value: 'AT', label: 'An toàn (AT)' },
  { value: 'QT', label: 'Quy trình (QT)' },
  { value: 'NQ', label: 'Nội quy (NQ)' },
  { value: 'TTD', label: 'Điều độ / Thị trường điện (TTD)' },
  { value: 'AX', label: 'Chuyên môn theo bậc (AX)' },
];

const FALLBACK_DEPARTMENTS: DepartmentInfo[] = [
  { code: 'A', name: 'Công nhân vận hành' },
  { code: 'B', name: 'XSC cơ' },
  { code: 'C', name: 'Trưởng ca' },
  { code: 'D', name: 'XSC điện' },
];

function normText(s: string): string {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function dupKey(q: { question: string; section: string; unit?: string }): string {
  return `${normText(q.question)}|${q.section}|${q.unit || 'COMMON'}`;
}

/** Gợi ý nhóm/bộ phận/bậc từ tên file: "A5.1 - Van hanh.docx", "TTD6.docx", "AT.docx"... */
function suggestFromFileName(name: string): Partial<{ group: GroupType; unit: string; level: number; sub: string }> {
  const up = name.toUpperCase().replace(/[–—]/g, '-');
  const ax = up.match(/(?:^|[^A-Z0-9])([A-D])([1-8])(?:[.\-_](\d+))?(?![0-9])/);
  if (ax) return { group: 'AX', unit: ax[1], level: parseInt(ax[2], 10), sub: ax[3] || '1' };
  const ttd = up.match(/TTD[.\-_ ]?([1-8])?/);
  if (ttd) return { group: 'TTD', level: ttd[1] ? parseInt(ttd[1], 10) : undefined };
  if (/(^|[^A-Z])AT([^A-Z]|$)/.test(up) || up.includes('AN TOAN')) return { group: 'AT' };
  if (/(^|[^A-Z])QT([^A-Z]|$)/.test(up) || up.includes('QUY TRINH')) return { group: 'QT' };
  if (/(^|[^A-Z])NQ([^A-Z]|$)/.test(up) || up.includes('NOI QUY')) return { group: 'NQ' };
  return {};
}

export const WordImportModal: React.FC<WordImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
  departments,
  existingQuestions = [],
}) => {
  const depts = departments && departments.length > 0 ? departments : FALLBACK_DEPARTMENTS;

  // --- Cấu hình nơi lưu câu hỏi (một nguồn duy nhất cho mã nhóm / bộ phận / bậc) ---
  const [group, setGroup] = useState<GroupType>('AX');
  const [axUnit, setAxUnit] = useState<string>(depts[0]?.code || 'A');
  const [sharedUnit, setSharedUnit] = useState<string>('COMMON'); // AT/QT/NQ/TTD: dùng chung hoặc riêng bộ phận
  const [level, setLevel] = useState<number>(5);
  const [sub, setSub] = useState<string>('1');

  // --- Nguồn dữ liệu ---
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [content, setContent] = useState<DocxContent | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [readError, setReadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Kết quả AI (khi định dạng không chuẩn) ---
  const [aiDrafts, setAiDrafts] = useState<ParsedQuestionDraft[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const sectionCode = useMemo(() => {
    if (group === 'AX') return `${axUnit}${level}.${sub || '1'}`;
    if (group === 'TTD') return `TTD.${level}`;
    return group;
  }, [group, axUnit, level, sub]);

  const effectiveSharedUnit = group === 'AX' ? axUnit : sharedUnit;
  const levelLabel = group === 'AX' || group === 'TTD' ? `Bậc ${level}` : 'Dùng chung mọi bậc';
  const unitLabel =
    effectiveSharedUnit === 'COMMON'
      ? 'Dùng chung mọi bộ phận'
      : `Kho ${effectiveSharedUnit}${
          depts.find((d) => d.code === effectiveSharedUnit) ? ` – ${depts.find((d) => d.code === effectiveSharedUnit)!.name}` : ''
        }`;

  // Đổi cấu hình hoặc nguồn thì bỏ kết quả AI cũ
  useEffect(() => {
    setAiDrafts(null);
    setAiError(null);
  }, [sectionCode, content, pastedText, importMode]);

  // Phân tích lại ngay khi người dùng đổi nhóm / bộ phận / bậc (không cần chọn lại file)
  const parsed = useMemo(() => {
    try {
      if (importMode === 'file' && content) {
        return parseWordContent(content, sectionCode, group === 'AX' || group === 'TTD' ? String(level) : 'COMMON');
      }
      if (importMode === 'paste' && pastedText.trim()) {
        return parsePlainText(pastedText, sectionCode, group === 'AX' || group === 'TTD' ? String(level) : 'COMMON');
      }
    } catch (e) {
      console.error('Parse error', e);
    }
    return { questions: [] as ParsedQuestionDraft[], warnings: [] as string[] };
  }, [importMode, content, pastedText, sectionCode, group, level]);

  const drafts = aiDrafts ?? parsed.questions;

  // Chuẩn hóa đúng cấu trúc kho đề + loại bỏ câu trùng
  const { finalQuestions, duplicateCount, bySection } = useMemo(() => {
    const existingKeys = new Set(
      existingQuestions.map((q) => {
        const m = normalizeImportedMeta(q.section, q.unit || 'COMMON');
        return dupKey({ question: q.question, section: m.section, unit: m.unit });
      })
    );
    const seen = new Set<string>();
    const out: Question[] = [];
    let dup = 0;
    const counts: Record<string, number> = {};

    drafts.forEach((d) => {
      const m = normalizeImportedMeta(d.section, effectiveSharedUnit);
      const key = dupKey({ question: d.question, section: m.section, unit: m.unit });
      if (existingKeys.has(key) || seen.has(key)) {
        dup += 1;
        return;
      }
      seen.add(key);
      counts[m.section] = (counts[m.section] || 0) + 1;
      out.push({
        ...d,
        section: m.section,
        unit: m.unit,
        level: m.level,
        subGroup: m.subGroup,
      });
    });
    return { finalQuestions: out, duplicateCount: dup, bySection: counts };
  }, [drafts, existingQuestions, effectiveSharedUnit]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setReadError(null);
    setContent(null);
    setIsProcessing(true);

    // Gợi ý cấu hình từ tên file (người dùng vẫn đổi lại được)
    const hint = suggestFromFileName(file.name);
    if (hint.group) setGroup(hint.group);
    if (hint.unit) setAxUnit(hint.unit);
    if (hint.level) setLevel(hint.level);
    if (hint.sub) setSub(hint.sub);

    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.docx')) {
        setContent(await readDocxContent(file));
      } else if (lower.endsWith('.txt')) {
        const text = await file.text();
        setContent({ html: '', text });
      } else if (lower.endsWith('.doc')) {
        setReadError('File .doc (Word cũ) chưa được hỗ trợ. Hãy mở bằng Word và Lưu thành .docx rồi chọn lại.');
      } else {
        setReadError('Vui lòng chọn file định dạng .docx hoặc .txt');
      }
    } catch (err: any) {
      console.error('File parsing error', err);
      setReadError('Lỗi đọc file: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleAiFallbackParse = async () => {
    const text = importMode === 'file' ? content?.text || '' : pastedText;
    if (!text.trim()) {
      setAiError('Chưa có nội dung văn bản để phân tích.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const deptName = depts.find((d) => d.code === axUnit)?.name || 'Nhà máy điện';
      const res = await fetch('/api/ai/extract-from-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: text,
          department: deptName,
          level: String(level),
          customPrompt: 'Phân tích văn bản Word này và trích xuất thành danh sách câu hỏi trắc nghiệm A, B, C, D.',
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        const stamp = Date.now().toString(36);
        const list: ParsedQuestionDraft[] = data.questions
          .filter((q: any) => q && q.question && q.options && q.correct)
          .map((q: any, i: number) => ({
            id: `ai-word-${stamp}-${i}`,
            number: `${i + 1}`,
            question: q.question,
            options: q.options,
            correct: q.correct,
            section: sectionCode,
            level: group === 'AX' || group === 'TTD' ? String(level) : 'COMMON',
            citation: q.citation || selectedFile?.name || 'File Word',
            explanation: q.explanation || '',
          }));
        setAiDrafts(list);
      } else {
        setAiError(
          'Google AI không tìm thấy câu hỏi hợp lệ.' +
            (data.error ? ` ${data.error}` : '') +
            ' (Tính năng AI cần máy chủ có GEMINI_API_KEY - không chạy trên GitHub Pages.)'
        );
      }
    } catch (e: any) {
      setAiError('Không gọi được Google AI: ' + (e?.message || e) + '. (Tính năng AI không chạy trên GitHub Pages.)');
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (finalQuestions.length === 0) return;
    onImportQuestions(finalQuestions);
    // reset để lần nhập sau không dính dữ liệu cũ
    setContent(null);
    setSelectedFile(null);
    setPastedText('');
    setAiDrafts(null);
    onClose();
  };

  const hasSource = (importMode === 'file' && content !== null) || (importMode === 'paste' && pastedText.trim().length > 0);
  const nothingFound = hasSource && drafts.length === 0;
  const warnings = [...(readError ? [readError] : []), ...(aiDrafts ? [] : parsed.warnings)];

  const selectCls =
    'w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative animate-scaleUp my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Nhập Câu Hỏi Từ File Word (.docx)</h3>
              <p className="text-xs text-slate-400">
                Nhận diện câu hỏi, phương án A/B/C/D và đáp án đúng (in đậm hoặc dòng "Đáp án: B")
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3">
          {/* Cấu hình kho đề */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-xs space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-400 font-bold mb-1">Nhóm câu hỏi:</label>
                <select value={group} onChange={(e) => setGroup(e.target.value as GroupType)} className={selectCls}>
                  {GROUP_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Kho bộ phận:</label>
                {group === 'AX' ? (
                  <select value={axUnit} onChange={(e) => setAxUnit(e.target.value)} className={selectCls}>
                    {depts.map((d) => (
                      <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                ) : (
                  <select value={sharedUnit} onChange={(e) => setSharedUnit(e.target.value)} className={selectCls}>
                    <option value="COMMON">Dùng chung mọi bộ phận</option>
                    {depts.map((d) => (
                      <option key={d.code} value={d.code}>Riêng {d.code} - {d.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Bậc:</label>
                <select
                  value={level}
                  disabled={group !== 'AX' && group !== 'TTD'}
                  onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                  className={`${selectCls} disabled:opacity-40`}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>Bậc {n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Nhóm con:</label>
                <input
                  type="number"
                  min={1}
                  disabled={group !== 'AX'}
                  value={sub}
                  onChange={(e) => setSub(e.target.value.replace(/\D/g, '') || '1')}
                  className={`${selectCls} disabled:opacity-40`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-400">Câu hỏi sẽ được lưu với mã</span>
              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
                {sectionCode}
              </span>
              <span className="text-slate-500">→</span>
              <span className="text-slate-300">{unitLabel} · {levelLabel}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(['file', 'paste'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setImportMode(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  importMode === m
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'file' ? 'Chọn file Word (.docx)' : 'Dán văn bản câu hỏi'}
              </button>
            ))}
          </div>

          {importMode === 'file' ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/50 hover:border-cyan-500/50 transition-colors cursor-pointer text-center relative">
              <input
                type="file"
                accept=".docx,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-9 h-9 text-cyan-400 mb-2" />
              <p className="text-sm font-bold text-slate-200">
                {selectedFile ? selectedFile.name : 'Nhấp để chọn hoặc kéo thả file Word (.docx)'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Có thể đổi Nhóm / Bộ phận / Bậc sau khi chọn file - hệ thống tự phân tích lại
              </p>
            </div>
          ) : (
            <textarea
              rows={7}
              placeholder={'Dán nội dung câu hỏi vào đây...\nVD:\nCâu 1: Khoảng cách an toàn điện áp 110kV là bao nhiêu?\nA. 0.7m\nB. 1.0m\nC. 1.5m\nD. 2.0m\nĐáp án: C\nTrích dẫn: QCVN 01:2020'}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          )}

          {/* Hướng dẫn định dạng */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              Mỗi câu gồm <b className="text-slate-300">Câu n: ...</b>, các dòng <b className="text-slate-300">A. B. C. D.</b>, rồi
              {' '}<b className="text-slate-300">Đáp án: X</b> hoặc in đậm phương án đúng. Câu không xác định được đáp án sẽ bị bỏ qua và báo lại.
              Một file chứa nhiều nhóm: chèn dòng riêng <code className="text-cyan-300">[A5.1]</code>,{' '}
              <code className="text-cyan-300">[AT]</code>, <code className="text-cyan-300">[TTD.6]</code> trước nhóm câu hỏi tương ứng.
            </div>
          </div>

          {isProcessing && (
            <div className="text-center py-2 text-xs text-cyan-400 font-semibold animate-pulse">
              Đang đọc file...
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              {warnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {nothingFound && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Không nhận diện được câu hỏi nào theo chuẩn "Câu 1: ... A. ... B. ...".</span>
              </div>
              <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2">
                <span>Định dạng không chuẩn? Có thể nhờ Google AI đọc hiểu (cần máy chủ có khóa Gemini):</span>
                <button
                  onClick={handleAiFallbackParse}
                  disabled={aiLoading}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{aiLoading ? 'Đang phân tích...' : 'Dùng Google AI phân tích'}</span>
                </button>
              </div>
              {aiError && <div className="text-rose-300">{aiError}</div>}
            </div>
          )}

          {/* Kết quả */}
          {drafts.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Sẽ nhập {finalQuestions.length} câu
                  {Object.keys(bySection).length > 0 && (
                    <span className="text-slate-400 font-mono font-normal">
                      ({Object.entries(bySection).map(([k, v]) => `${k}: ${v}`).join(' · ')})
                    </span>
                  )}
                </span>
                {duplicateCount > 0 && (
                  <span className="text-[11px] text-amber-300 flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5" />
                    Bỏ qua {duplicateCount} câu đã có trong kho
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {finalQuestions.slice(0, 3).map((q, idx) => (
                  <div key={q.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                    <p className="font-semibold text-slate-200">
                      <span className="font-mono text-cyan-400 mr-1.5">[{q.section}]</span>
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
                {finalQuestions.length > 3 && (
                  <p className="text-[11px] text-slate-500 text-center">... và {finalQuestions.length - 3} câu khác</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Đóng
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={finalQuestions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>Nhập {finalQuestions.length} Câu Vào Kho {sectionCode}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
