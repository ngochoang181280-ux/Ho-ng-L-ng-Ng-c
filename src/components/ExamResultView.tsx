import React, { useState, useMemo } from 'react';
import { 
  Trophy, CheckCircle, XCircle, Clock, AlertCircle, 
  RotateCcw, Sparkles, Printer, ChevronDown, ChevronUp,
  BookOpen, ShieldCheck, Share2, HelpCircle, Layers, Award,
  CheckCircle2, Filter
} from 'lucide-react';
import { ExamAttempt, Question } from '../types/exam';

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
      const sec = (q.section || '').toUpperCase();
      let grpKey = 'ax';
      if (sec === 'AT' || sec.startsWith('AT')) grpKey = 'at';
      else if (sec === 'QT' || sec.startsWith('QT')) grpKey = 'qt';
      else if (sec === 'NQ' || sec.startsWith('NQ')) grpKey = 'nq';
      else if (sec.startsWith('TTD') || sec.startsWith('DD')) grpKey = 'ttd';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Top Summary Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ${
                isPassed 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20' 
                  : 'bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-rose-500/20'
              }`}>
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                  {attempt.mode === 'official' ? 'Bài Thi Sát Hạch Chính Thức' : 'Bài Thi Luyện Ôn Tập'}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                  Kết Quả: {attempt.candidateName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  {attempt.unitName} • Bậc {attempt.level} • Phòng: <span className="text-cyan-300 font-semibold">{attempt.roomCode}</span> • Mã đề: <span className="text-slate-200 font-mono font-bold">{attempt.examCode}</span>
                </p>
              </div>
            </div>

            {/* Score Pill & Pass Conclusion */}
            <div className="flex flex-col items-center sm:items-end">
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl sm:text-5xl font-black ${
                  isPassed ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {attempt.score}
                </span>
                <span className="text-lg font-bold text-slate-400">/ 10</span>
              </div>

              <div className="mt-2 text-right">
                <span className={`inline-block px-3.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-md ${
                  isPassed 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {isPassed ? '✓ ĐẠT TIÊU CHUẨN SÁT HẠCH' : '✗ CHƯA ĐẠT TIÊU CHUẨN'}
                </span>

                {!safetyPassed && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1">
                    * Không đạt điều kiện sàn An toàn điện (&ge; 80%)
                  </p>
                )}
                {safetyPassed && attempt.percent < 70 && (
                  <p className="text-[11px] text-amber-400 font-semibold mt-1">
                    * Điểm tổng chưa đạt mức tối thiểu 70% (7.0 điểm)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Core Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-400 font-medium">Số câu đúng</span>
              <p className="text-xl font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-5 h-5" />
                <span>{attempt.correct}/{attempt.total}</span>
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-400 font-medium">Số câu sai</span>
              <p className="text-xl font-bold text-rose-400 mt-1 flex items-center justify-center gap-1.5">
                <XCircle className="w-5 h-5" />
                <span>{attempt.wrong}</span>
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-400 font-medium">Thời gian làm bài</span>
              <p className="text-xl font-bold text-cyan-300 mt-1 flex items-center justify-center gap-1.5">
                <Clock className="w-5 h-5" />
                <span>{Math.floor(attempt.elapsedSeconds / 60)}p {attempt.elapsedSeconds % 60}s</span>
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-400 font-medium">Rời màn hình</span>
              <p className="text-xl font-bold text-slate-300 mt-1 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>{attempt.focusViolations} lần</span>
              </p>
            </div>
          </div>

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

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu điểm & Biên bản</span>
            </button>
          </div>
        </div>

        {/* REVIEW FILTER CONTROLS & QUESTION LIST */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Xem Lại Đáp Án & Trích Dẫn Quy Trình Kỹ Thuật</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mỗi câu hỏi đều hiển thị rõ phương án đúng/sai kèm căn cứ quy trình pháp lý để thí sinh ôn tập.
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
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono font-bold border border-slate-700">
                              {q.section}
                            </span>

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

                    {/* TRÍCH DẪN ĐÁP ÁN ĐÚNG & CĂN CỨ QUY TRÌNH KỸ THUẬT (ALWAYS SHOWN) */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                      {/* Citation */}
                      {q.citation ? (
                        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 text-xs leading-relaxed flex items-start gap-2.5">
                          <span className="text-base shrink-0">📌</span>
                          <div>
                            <strong className="text-blue-100 font-bold block mb-0.5">
                              Căn cứ quy trình / Quy chuẩn kỹ thuật:
                            </strong>
                            <span className="text-slate-200">{q.citation}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                          <span>📌</span>
                          <span>Căn cứ quy chuẩn kỹ thuật an toàn điện & Quy trình vận hành SPMO.</span>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs leading-relaxed flex items-start gap-2.5">
                          <span className="text-base shrink-0">💡</span>
                          <div>
                            <strong className="text-amber-300 font-bold block mb-0.5">
                              Giải thích chuyên môn & kiến thức trọng tâm:
                            </strong>
                            <span className="text-slate-300">{q.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>

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
      </div>
    </div>
  );
};

