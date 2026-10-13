import React, { useState, useMemo } from 'react';
import { 
  Trophy, CheckCircle, XCircle, Clock, AlertCircle, 
  RotateCcw, Sparkles, Printer, ChevronDown, ChevronUp,
  BookOpen, ShieldCheck, Share2, HelpCircle, Layers, Award,
  CheckCircle2, Filter, FileDown, Download, Check, Database
} from 'lucide-react';
import { ExamAttempt, Question } from '../types/exam';
import { isTtdQuestion, getQuestionBankInfo } from '../utils/questionMeta';
import { getQuestionGroupKey } from '../data/mockData';
import { getSavedOrgConfig } from '../utils/organizationStorage';
import { downloadExamResultDoc } from '../utils/examResultExport';
import { CertificateModal } from './CertificateModal';

interface ExamResultViewProps {
  attempt: ExamAttempt;
  onRetest: () => void;
  onHome: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  attempt,
  onRetest,
  onHome,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'WRONG' | 'CORRECT' | 'UNANSWERED'>('ALL');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<number, boolean>>({});
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [showOfficialReview, setShowOfficialReview] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const orgConfig = useMemo(() => getSavedOrgConfig(), []);

  const handleExportWordDoc = () => {
    setIsExportingWord(true);
    try {
      const cleanCandidateName = (attempt.candidateName || 'ThiSinh').replace(/\s+/g, '_');
      const filename = `Bang_DapAn_TrichDan_${cleanCandidateName}_${attempt.examCode || 'De'}_Bac${attempt.level}.doc`;
      downloadExamResultDoc(filename, attempt, orgConfig);
    } catch (err) {
      console.error('Lỗi xuất file Word', err);
    } finally {
      setTimeout(() => setIsExportingWord(false), 1200);
    }
  };

  // Compute or read group breakdown (AT, QT, NQ, TTD, AX)
  const groupStats = useMemo(() => {
    if (attempt.groupBreakdown && Object.keys(attempt.groupBreakdown).length > 0) {
      return attempt.groupBreakdown;
    }

    const stats: Record<string, { total: number; correct: number; percent: number }> = {
      at: { total: 0, correct: 0, percent: 0 },
      qt: { total: 0, correct: 0, percent: 0 },
      nq: { total: 0, correct: 0, percent: 0 },
      ttd: { total: 0, correct: 0, percent: 0 },
      ax: { total: 0, correct: 0, percent: 0 },
    };

    attempt.questions.forEach((q, idx) => {
      let grpKey = 'ax';
      if (isTtdQuestion(q)) {
        grpKey = 'ttd';
      } else {
        grpKey = getQuestionGroupKey(q);
      }

      if (!stats[grpKey]) stats[grpKey] = { total: 0, correct: 0, percent: 0 };
      stats[grpKey].total++;
      if (attempt.answers[idx] === q.correct) {
        stats[grpKey].correct++;
      }
    });

    Object.keys(stats).forEach((k) => {
      const g = stats[k];
      g.percent = g.total > 0 ? Number(((g.correct / g.total) * 100).toFixed(1)) : 100;
    });

    return stats;
  }, [attempt]);

  const atStat = groupStats.at || { total: 0, correct: 0, percent: 100 };
  const safetyPassed = atStat.total === 0 || atStat.percent >= 80;
  const isPassed = attempt.percent >= 70 && safetyPassed;

  // Filter questions according to user selection
  const filteredQuestions = useMemo(() => {
    return attempt.questions.map((q, idx) => ({ q, idx })).filter(({ q, idx }) => {
      const userChoice = attempt.answers[idx];
      const isCorrect = userChoice === q.correct;
      const isUnanswered = !userChoice;

      if (filterType === 'WRONG') return !isCorrect && !isUnanswered;
      if (filterType === 'CORRECT') return isCorrect;
      if (filterType === 'UNANSWERED') return isUnanswered;
      return true;
    });
  }, [attempt.questions, attempt.answers, filterType]);

  // Request free Google AI explanation from backend
  const handleRequestAiExplanation = async (qIndex: number, question: Question) => {
    if (aiExplanations[qIndex]) {
      setExpandedIndex((prev) => (prev === qIndex ? null : qIndex));
      return;
    }

    setExpandedIndex(qIndex);
    setLoadingAi((prev) => ({ ...prev, [qIndex]: true }));

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          chosenAnswer: attempt.answers[qIndex] || 'Chưa trả lời',
          correctAnswer: question.correct,
          options: question.options,
          citation: question.citation,
        }),
      });

      const data = await res.json();
      setAiExplanations((prev) => ({
        ...prev,
        [qIndex]: data.explanation || 'Không có giải thích chi tiết.',
      }));
    } catch (err) {
      console.error('AI explanation failed', err);
      setAiExplanations((prev) => ({
        ...prev,
        [qIndex]: question.explanation || 'Đáp án chính xác dựa trên quy trình kỹ thuật an toàn ngành điện.',
      }));
    } finally {
      setLoadingAi((prev) => ({ ...prev, [qIndex]: false }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-6 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Top Summary Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                isPassed 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20' 
                  : 'bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-rose-500/20'
              }`}>
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-sky-700">
                    {orgConfig.companyName}
                  </span>
                  <span className="text-slate-400 text-xs">&bull;</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {attempt.mode === 'official' ? 'Sát Hạch Chính Thức' : 'Bài Luyện Ôn Tập'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Kết Quả: {attempt.candidateName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {attempt.unitName} • Bậc {attempt.level} • Phòng: <span className="text-sky-700 font-bold">{attempt.roomCode}</span> • Mã đề: <span className="text-slate-800 font-mono font-bold">{attempt.examCode}</span>
                </p>
              </div>
            </div>

            {/* Score Pill & Pass Conclusion */}
            <div className="flex flex-col items-center sm:items-end">
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl sm:text-5xl font-black ${
                  isPassed ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {attempt.score}
                </span>
                <span className="text-lg font-bold text-slate-400">/ 10</span>
              </div>

              <div className="mt-2 text-right">
                <span className={`inline-block px-3.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm ${
                  isPassed 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {isPassed ? '✓ ĐẠT TIÊU CHUẨN SÁT HẠCH' : '✗ CHƯA ĐẠT TIÊU CHUẨN'}
                </span>

                {!safetyPassed && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    * Không đạt điều kiện sàn An toàn điện (&ge; 80%)
                  </p>
                )}
                {safetyPassed && attempt.percent < 70 && (
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">
                    * Điểm tổng chưa đạt mức tối thiểu 70% (7.0 điểm)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Core Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-500 font-medium">Số câu đúng</span>
              <p className="text-xl font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-5 h-5" />
                <span>{attempt.correct}/{attempt.total}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-500 font-medium">Số câu sai</span>
              <p className="text-xl font-bold text-rose-600 mt-1 flex items-center justify-center gap-1.5">
                <XCircle className="w-5 h-5" />
                <span>{attempt.wrong}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-500 font-medium">Thời gian làm bài</span>
              <p className="text-xl font-bold text-sky-700 mt-1 flex items-center justify-center gap-1.5">
                <Clock className="w-5 h-5" />
                <span>{Math.floor(attempt.elapsedSeconds / 60)}p {attempt.elapsedSeconds % 60}s</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-500 font-medium">Rời màn hình</span>
              <p className="text-xl font-bold text-slate-700 mt-1 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span>{attempt.focusViolations} lần</span>
              </p>
            </div>
          </div>

          {/* Matrix Shortage Note in Results */}
          {attempt.matrixWarnings && attempt.matrixWarnings.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-amber-900">
                    LƯU Ý VỀ MA TRẬN ĐỀ THI: Đã ra đề bỏ qua các phần thiếu trong kho câu hỏi
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Đề thi thực tế có <strong className="text-amber-950 font-bold">{attempt.total} câu</strong> (cấu hình ma trận yêu cầu {attempt.matrixTargetTotal || attempt.total} câu). Hệ thống đã bỏ qua các phần thiếu và không lấy câu hỏi từ nhóm khác thay thế vào:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-200/80 pt-1">
                    {attempt.matrixWarnings.slice(1).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 5-GROUP PERFORMANCE BREAKDOWN (AT, QT, NQ, TTD, AX) */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Đánh Giá Năng Lực Theo Từng Nhóm Nghiệp Vụ:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                (Điều kiện: Phần An toàn AT bắt buộc &ge; 80%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              {/* AT */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">An toàn (AT)</span>
                  <span className={`font-mono font-bold text-[11px] ${
                    (groupStats.at?.percent || 0) >= 80 ? 'text-emerald-400' : 'text-rose-400 font-black'
                  }`}>
                    {groupStats.at?.percent || 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${groupStats.at?.percent || 0}%` }}
                    className={`h-full rounded-full ${(groupStats.at?.percent || 0) >= 80 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>{groupStats.at?.correct || 0}/{groupStats.at?.total || 0} câu</span>
                  <span>{(groupStats.at?.percent || 0) >= 80 ? '✓ Đạt sàn' : '✗ Dưới 80%'}</span>
                </div>
              </div>

              {/* QT */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-teal-300">Quy trình (QT)</span>
                  <span className="font-mono font-bold text-[11px] text-teal-400">
                    {groupStats.qt?.percent || 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${groupStats.qt?.percent || 0}%` }}
                    className="h-full bg-teal-400 rounded-full"
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  {groupStats.qt?.correct || 0}/{groupStats.qt?.total || 0} câu
                </div>
              </div>

              {/* NQ */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">Nội quy (NQ)</span>
                  <span className="font-mono font-bold text-[11px] text-amber-400">
                    {groupStats.nq?.percent || 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${groupStats.nq?.percent || 0}%` }}
                    className="h-full bg-amber-400 rounded-full"
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  {groupStats.nq?.correct || 0}/{groupStats.nq?.total || 0} câu
                </div>
              </div>

              {/* TTD */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300">Điều độ (TTD)</span>
                  <span className="font-mono font-bold text-[11px] text-indigo-400">
                    {groupStats.ttd?.percent || 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${groupStats.ttd?.percent || 0}%` }}
                    className="h-full bg-indigo-400 rounded-full"
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  {groupStats.ttd?.correct || 0}/{groupStats.ttd?.total || 0} câu
                </div>
              </div>

              {/* AX */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300">Chuyên môn (AX)</span>
                  <span className="font-mono font-bold text-[11px] text-purple-400">
                    {groupStats.ax?.percent || 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${groupStats.ax?.percent || 0}%` }}
                    className="h-full bg-purple-400 rounded-full"
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  {groupStats.ax?.correct || 0}/{groupStats.ax?.total || 0} câu
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-800/80 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={onHome}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
              >
                Về trang chủ
              </button>
              <button
                onClick={onRetest}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-600/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm đề khác</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPassed && (
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                  title="In hoặc tải Giấy Chứng Nhận Đạt Sát Hạch chính thức"
                >
                  <Award className="w-4 h-4 text-amber-100" />
                  <span>🎓 Cấp Giấy Chứng Nhận</span>
                </button>
              )}

              <button
                onClick={handleExportWordDoc}
                disabled={isExportingWord}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
                title="Xuất file Word (.doc) chứa đáp án thí sinh, đáp án đúng và phần trích dẫn căn cứ"
              >
                <FileDown className="w-4 h-4 text-cyan-200" />
                <span>{isExportingWord ? 'Đang xuất Word...' : '📄 Xuất File Word (.doc)'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu điểm & Biên bản</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: THI THẬT (OFFICIAL) VS LUYỆN THI (TRAINING)
            - KHI THI THẬT: Chỉ hiện kết quả, không hiển thị lại phần đã thi và trích dẫn trên giao diện, 
              nhưng cung cấp nút xuất file Word (.doc) chứa đáp án của thí sinh, đáp án đúng và phần trích dẫn.
            - KHI LUYỆN THI: Hiển thị đầy đủ danh sách câu hỏi, đáp án đúng và phần trích dẫn để thí sinh ôn tập. */}
        {attempt.mode === 'official' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    Quy Chế Bảo Mật Đề Thi Sát Hạch Chính Thức (EVN SPMO)
                  </h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Chế độ Thi Thật
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Theo Quy chế thi sát hạch nâng bậc kỹ thuật, màn hình thí sinh <strong>chỉ công bố kết quả và điểm số tổng hợp</strong>, không hiển thị lại toàn bộ đề thi và phần trích dẫn trực tiếp trên màn hình nhằm bảo mật ngân hàng đề thi chung.
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Hội đồng sát hạch và thí sinh có thể tải về file Word (.doc) chính thức chứa đầy đủ <strong>bảng đối chiếu đáp án của thí sinh, đáp án chính xác của đề thi và toàn bộ phần trích dẫn quy chuẩn có sẵn trong đề</strong> để lưu trữ hồ sơ đánh giá.
                </p>
              </div>
            </div>

            {/* Card Xuất File Word Nổi Bật Cho Thi Thật */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm sm:text-base font-bold text-slate-100">
                    Bảng Đối Chiếu Đáp Án Thí Sinh, Đáp Án Chuẩn &amp; Phần Trích Dẫn Chi Tiết
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  Tải ngay file Word (.doc) chuẩn văn bản EVN gồm: Tổng kết điểm số, Bảng ma trận đối chiếu nhanh đáp án, Chi tiết từng câu hỏi, và <strong>Căn cứ trích dẫn quy trình kỹ thuật</strong>.
                </p>
              </div>

              <button
                onClick={handleExportWordDoc}
                disabled={isExportingWord}
                className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
              >
                <FileDown className="w-5 h-5 text-cyan-200" />
                <span>{isExportingWord ? 'Đang tạo file Word...' : '📥 Xuất File Word Chi Tiết Đáp Án & Trích Dẫn'}</span>
              </button>
            </div>

            {/* Thông Tin Tóm Tắt Biên Bản */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Thí sinh sát hạch:</span>
                <p className="font-bold text-slate-100 uppercase mt-0.5 truncate">{attempt.candidateName}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Bộ phận & Bậc:</span>
                <p className="font-bold text-slate-100 mt-0.5 truncate">{attempt.unitName} • Bậc {attempt.level}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Mã đề & Phòng thi:</span>
                <p className="font-bold text-cyan-300 font-mono mt-0.5 truncate">{attempt.examCode} ({attempt.roomCode})</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Kết quả công nhận:</span>
                <p className={`font-black mt-0.5 ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPassed ? '✓ ĐẠT SÁT HẠCH' : '✗ CHƯA ĐẠT'}
                </p>
              </div>
            </div>

            {/* Nút Xem Lại Chi Tiết Trực Tiếp Trên Màn Hình */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowOfficialReview(!showOfficialReview)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs sm:text-sm border border-cyan-500/30 flex items-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>
                  {showOfficialReview
                    ? '▲ Thu Gọn Danh Sách Câu Hỏi'
                    : '▼ Xem Lại Chi Tiết Toàn Bộ Câu Hỏi, Đáp Án Chuẩn & Phần Giải Thích Trích Dẫn'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* CHẾ ĐỘ LUYỆN THI HOẶC BẬT XEM LẠI: HIỂN THỊ ĐẦY ĐỦ CÂU HỎI, ĐÁP ÁN ĐÚNG VÀ PHẦN TRÍCH DẪN */}
        {(attempt.mode === 'training' || showOfficialReview) && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <span>Xem Lại Đáp Án &amp; Phần Giải Thích Trích Dẫn ({attempt.mode === 'training' ? 'Ôn Luyện' : 'Sát Hạch'})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mỗi câu hỏi đều hiển thị rõ phương án đúng/sai kèm <strong>phần giải thích trích dẫn có sẵn trong đề</strong> để đối chiếu và ôn tập.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterType === 'ALL'
                      ? 'bg-slate-800 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tất cả ({attempt.total})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('WRONG')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterType === 'WRONG'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  Câu sai ({attempt.wrong})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('CORRECT')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterType === 'CORRECT'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  Câu đúng ({attempt.correct})
                </button>

                {attempt.unanswered > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterType('UNANSWERED')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterType === 'UNANSWERED'
                        ? 'bg-slate-800 text-amber-300 font-bold'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    Chưa làm ({attempt.unanswered})
                  </button>
                )}
              </div>
            </div>

            {/* Banner Luyện Thi & Nút Xuất Word */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-xl shrink-0">📖</span>
                <div>
                  <span className="font-bold text-cyan-100 block sm:inline mr-2">
                    Chế độ Luyện Thi (Ôn Tập):
                  </span>
                  <span className="text-slate-300 text-xs">
                    Hệ thống tự động hiển thị đầy đủ <strong>Đáp án đúng</strong> và <strong>Phần giải thích trích dẫn có sẵn trong đề</strong> dưới mỗi câu hỏi để bạn đối chiếu và củng cố kiến thức.
                  </span>
                </div>
              </div>

              <button
                onClick={handleExportWordDoc}
                disabled={isExportingWord}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Xuất file Word</span>
              </button>
            </div>

            {/* Question List */}
            <div className="flex flex-col gap-3">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                Không có câu hỏi nào trong mục này.
              </div>
            ) : (
              filteredQuestions.map(({ q, idx }) => {
                const userChoice = attempt.answers[idx] || '';
                const isCorrect = userChoice === q.correct;
                const isExpanded = expandedIndex === idx;
                const isLoading = loadingAi[idx];
                const aiText = aiExplanations[idx];

                return (
                  <div
                    key={q.id || idx}
                    className={`bg-slate-900/80 border rounded-2xl p-4 sm:p-5 transition-all ${
                      isCorrect
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : userChoice
                        ? 'border-rose-500/30 bg-rose-950/10'
                        : 'border-slate-800 bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : userChoice
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-slate-100 leading-snug">
                            {q.question}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                            {(() => {
                              const bankInfo = getQuestionBankInfo(q);
                              return (
                                <>
                                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs border flex items-center gap-1 ${bankInfo.badgeBg} ${bankInfo.badgeText} ${bankInfo.badgeBorder}`}>
                                    <Database className="w-3 h-3" />
                                    <span>{bankInfo.fullLabel}</span>
                                  </span>
                                  {q.section && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold border border-slate-300">
                                      Mã: {q.section}
                                    </span>
                                  )}
                                </>
                              );
                            })()}

                            <span className="text-slate-400">
                              Bạn đã chọn:{' '}
                              <strong className={isCorrect ? 'text-emerald-400 font-bold' : userChoice ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                                {userChoice || 'Chưa trả lời'}
                              </strong>
                            </span>

                            <span className="text-slate-400">
                              Đáp án chính xác:{' '}
                              <strong className="text-emerald-400 font-bold font-mono text-sm px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                                {q.correct}
                              </strong>
                            </span>

                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ml-auto ${
                              isCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : userChoice
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {isCorrect ? '✓ ĐÚNG' : userChoice ? '✗ SAI' : 'CHƯA TRẢ LỜI'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Explain Button */}
                      <button
                        onClick={() => handleRequestAiExplanation(idx, q)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-semibold shrink-0 active:scale-95 transition-all"
                        title="Hỏi thêm tình huống với Google AI"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Phân tích AI</span>
                      </button>
                    </div>

                    {/* Options List Preview with Color-Coding */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                      {Object.entries(q.options || {}).map(([key, optText]) => {
                        const isRightOption = q.correct.includes(key);
                        const isCandidateChoice = userChoice.includes(key);

                        return (
                          <div
                            key={key}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              isRightOption
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-bold'
                                : isCandidateChoice
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`font-mono font-bold shrink-0 ${isRightOption ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {key}.
                              </span>
                              <span className="truncate">{optText}</span>
                            </div>

                            {isRightOption && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0 border border-emerald-500/30">
                                Đáp án đúng
                              </span>
                            )}
                            {isCandidateChoice && !isRightOption && (
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold shrink-0 border border-rose-500/30">
                                Lựa chọn của bạn
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* PHẦN GIẢI THÍCH TRÍCH DẪN ĐÁP ÁN (THEO ĐÚNG MẪU NHƯ TRONG FILE WORD / HÌNH ẢNH) */}
                    {(attempt.mode === 'training' || showOfficialReview) && (() => {
                      const rawCitation = (q.citation || '').trim();
                      const rawExplanation = (q.explanation || '').trim();
                      // Loại bỏ các câu chữ quy chuẩn mặc định cũ nếu có
                      const isGeneric =
                        rawCitation.includes('Quy chuẩn Kỹ thuật Nghề nghiệp & Tiêu chuẩn Vận hành SPMO') ||
                        rawCitation === 'Quy chuẩn ngành điện' ||
                        rawCitation.includes('Căn cứ Quy chuẩn kỹ thuật an toàn điện & Quy trình vận hành SPMO');
                      const validCitation = isGeneric ? '' : rawCitation;
                      const combinedExplain = [validCitation, rawExplanation]
                        .filter(Boolean)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(' - ');

                      return (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/35 text-xs sm:text-sm leading-relaxed font-sans shadow-lg">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-cyan-400 font-bold font-mono text-base leading-none">➜</span>
                              <strong className="text-emerald-400 font-extrabold text-sm sm:text-base">
                                Đáp án đúng: {q.correct}
                              </strong>
                              <span className="text-slate-500 font-light mx-1">|</span>
                              <span className="text-cyan-300 font-bold">
                                Giải thích trích dẫn:
                              </span>
                            </div>

                            <div className="pl-5 text-slate-200">
                              {combinedExplain ? (
                                <div className="text-amber-100 font-medium leading-relaxed bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-500/20 italic">
                                  {combinedExplain}
                                </div>
                              ) : (
                                <div className="text-slate-400 italic text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                  <span>(Câu hỏi này trong đề chưa kèm phần giải thích trích dẫn)</span>
                                  <span className="text-[11px] text-cyan-400 not-italic font-normal">
                                    💡 Bạn có thể nạp lại file Word để cập nhật phần giải thích trích dẫn
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* AI Explanation Drawer (If toggled) */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-950/90 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-2xl animate-fadeIn">
                        <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" />
                          <span>Phân Tích Chuyên Sâu Tình Huống Kỹ Thuật (Google AI)</span>
                        </div>

                        {isLoading ? (
                          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                            <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                            <span>Đang kết nối Google AI để phân tích câu hỏi...</span>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-normal">
                            {aiText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {/* Printable Official Result Certificate / Slip - Visible ONLY when printing */}
        <div className="hidden print:block bg-white text-slate-900 p-8 font-serif text-xs leading-relaxed">
          <div className="flex justify-between items-start gap-4 pb-3 border-b-2 border-slate-900">
            <div className="text-center font-bold text-[11px] uppercase leading-tight w-[48%]">
              <p>{orgConfig.parentOrg}</p>
              <p className="font-extrabold text-xs mt-0.5">{orgConfig.companyName}</p>
              <p className="text-[10px] font-normal italic normal-case text-slate-700 mt-0.5">
                {orgConfig.documentNumber || 'Số: ..... /KQSH'}
              </p>
            </div>
            <div className="text-center font-bold text-[11px] uppercase leading-tight w-[48%]">
              <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="font-normal italic normal-case text-[10.5px]">Độc lập - Tự do - Hạnh phúc</p>
              <p className="text-[9px] text-slate-500">-------o0o-------</p>
            </div>
          </div>

          <div className="text-right italic text-[11px] text-slate-600 mt-2 mb-4">
            {orgConfig.locationDate || `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`}
          </div>

          <div className="text-center my-4 font-sans">
            <h2 className="text-base font-black uppercase tracking-wide">
              PHIẾU XÁC NHẬN KẾT QUẢ SÁT HẠCH NGHỀ TRỰC TUYẾN
            </h2>
            <p className="text-xs font-semibold mt-1">
              Họ và tên thí sinh: <strong className="uppercase text-sm">{attempt.candidateName}</strong>
            </p>
          </div>

          <div className="border border-slate-300 rounded p-4 mb-4 font-sans text-xs space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>Bộ phận công tác: <strong>{attempt.unitName}</strong></div>
              <div>Bậc sát hạch: <strong>BẬC {attempt.level}</strong></div>
              <div>Phòng thi: <strong>{attempt.roomCode}</strong></div>
              <div>Mã đề thi: <strong>{attempt.examCode}</strong></div>
              <div>Thời gian làm bài: <strong>{Math.floor(attempt.elapsedSeconds / 60)} phút</strong></div>
              <div>Thời điểm nộp bài: <strong>{new Date().toLocaleString('vi-VN')}</strong></div>
            </div>
            <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2">
              <div>Số câu đúng: <strong>{attempt.correct}/{attempt.total}</strong> ({attempt.percent}%)</div>
              <div>Điểm số: <strong className="text-sm">{attempt.score}/10</strong></div>
              <div>Xếp loại: <strong className={isPassed ? 'text-emerald-700' : 'text-rose-700'}>{isPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'}</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center font-bold text-xs pt-8 border-t border-slate-300 font-sans">
            <div>
              <p>THƯ KÝ HỘI ĐỒNG</p>
              <p className="text-[10px] font-normal italic text-slate-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p>{orgConfig.councilSecretary}</p>
            </div>
            <div>
              <p>CHỦ TỊCH HỘI ĐỒNG</p>
              <p className="text-[10px] font-normal italic text-slate-500 mt-0.5">(Ký, đóng dấu và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p>{orgConfig.councilPresident}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && (
        <CertificateModal
          attempt={attempt}
          orgConfig={orgConfig}
          onClose={() => setShowCertificateModal(false)}
        />
      )}
    </div>
  );
};

