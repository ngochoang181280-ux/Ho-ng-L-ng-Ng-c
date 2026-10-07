import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Clock, AlertTriangle, ChevronLeft, ChevronRight, Bookmark, 
  Send, ShieldAlert, CheckCircle2, RotateCcw,
  Sparkles, FileText, Smartphone, Laptop
} from 'lucide-react';
import { Question, ExamRoom, ExamAttempt } from '../types/exam';

interface CandidateExamProps {
  candidateName: string;
  unit: string;
  unitName: string;
  level: string;
  room: ExamRoom;
  examCode: string;
  questions: Question[];
  mode: 'official' | 'training';
  onFinishExam: (attempt: ExamAttempt) => void;
  onExit: () => void;
}

export const CandidateExam: React.FC<CandidateExamProps> = ({
  candidateName,
  unit,
  unitName,
  level,
  room,
  examCode,
  questions,
  mode,
  onFinishExam,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(`exam_answers_${room.roomCode}_${candidateName}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [markedIndexes, setMarkedIndexes] = useState<Set<number>>(() => new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(room.examTimeMinutes * 60);
  const [focusViolations, setFocusViolations] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showNavDrawerMobile, setShowNavDrawerMobile] = useState(false);
  const [startTime] = useState<string>(new Date().toISOString());
  const [showHintForIndex, setShowHintForIndex] = useState<Record<number, boolean>>({});
  const [autoShowExplanation, setAutoShowExplanation] = useState<boolean>(true);

  const isOfficial = mode === 'official';
  const hasFinishedRef = useRef(false);

  // Group questions by distinct sections:
  // 1. AT (An toàn điện)
  // 2. QT (Quy trình)
  // 3. NQ (Nội quy)
  // 4. AX (Chuyên môn bậc)
  // 5. TTD (Thao tác điều độ)
  const { atQuestions, qtQuestions, nqQuestions, axQuestions, ttdQuestions } = useMemo(() => {
    const at: number[] = [];
    const qt: number[] = [];
    const nq: number[] = [];
    const ax: number[] = [];
    const ttd: number[] = [];

    questions.forEach((q, idx) => {
      const sec = (q.section || '').toUpperCase();
      if (sec === 'AT') {
        at.push(idx);
      } else if (sec === 'QT') {
        qt.push(idx);
      } else if (sec === 'NQ') {
        nq.push(idx);
      } else if (sec === 'TTD') {
        ttd.push(idx);
      } else {
        ax.push(idx);
      }
    });

    return { atQuestions: at, qtQuestions: qt, nqQuestions: nq, axQuestions: ax, ttdQuestions: ttd };
  }, [questions]);

  // Current question data
  const currentQ = questions[currentIndex] || questions[0];
  const isMultiChoice = (currentQ?.correct || '').length > 1;

  // Auto-save answers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`exam_answers_${room.roomCode}_${candidateName}`, JSON.stringify(answers));
    } catch (e) {
      console.warn('Could not auto-save to localStorage', e);
    }
  }, [answers, room.roomCode, candidateName]);

  // Timer countdown
  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (!hasFinishedRef.current) {
        handleFinalSubmit('TỰ ĐỘNG NỘP - HẾT GIỜ LÀM BÀI');
      }
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Anti-cheat window blur / visibility change listener
  useEffect(() => {
    if (!isOfficial) return;

    let timeoutId: any = null;

    const handleVisibilityOrBlur = () => {
      if (hasFinishedRef.current) return;
      if (document.hidden) {
        timeoutId = setTimeout(() => {
          setFocusViolations((prev) => {
            const nextCount = prev + 1;
            if (nextCount >= room.maxFocusViolations) {
              setWarningMessage(
                `Bạn đã rời màn hình thi ${nextCount} lần (vượt quá mức tối đa ${room.maxFocusViolations} lần). Hệ thống đã tự động nộp bài theo quy chế sát hạch!`
              );
              setShowWarningModal(true);
              handleFinalSubmit('TỰ ĐỘNG NỘP - VI PHẠM QUY CHẾ THI');
            } else {
              setWarningMessage(
                `Cảnh báo: Phát hiện bạn vừa rời khỏi màn hình thi! Lần ${nextCount}/${room.maxFocusViolations}. Nếu vượt quá ${room.maxFocusViolations} lần, bài thi sẽ tự động kết thúc!`
              );
              setShowWarningModal(true);
            }
            return nextCount;
          });
        }, 600);
      } else {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrBlur);
    window.addEventListener('blur', handleVisibilityOrBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrBlur);
      window.removeEventListener('blur', handleVisibilityOrBlur);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOfficial, room.maxFocusViolations]);

  // Select option handler
  const handleSelectOption = useCallback((optionLetter: string) => {
    setAnswers((prev) => {
      if (!isMultiChoice) {
        return { ...prev, [currentIndex]: optionLetter };
      }

      const current = prev[currentIndex] || '';
      let updated: string;
      if (current.includes(optionLetter)) {
        updated = current.replace(optionLetter, '');
      } else {
        updated = (current + optionLetter).split('').sort().join('');
      }

      const next = { ...prev };
      if (updated.length > 0) {
        next[currentIndex] = updated;
      } else {
        delete next[currentIndex];
      }
      return next;
    });
  }, [currentIndex, isMultiChoice]);

  // Toggle review mark
  const toggleMarkQuestion = useCallback(() => {
    setMarkedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  }, [currentIndex]);

  // Submit test
  const handleFinalSubmit = useCallback((forcedStatus?: string) => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    try {
      localStorage.removeItem(`exam_answers_${room.roomCode}_${candidateName}`);
    } catch {}

    const totalQ = questions.length;
    let correct = 0;
    questions.forEach((q, idx) => {
      const userAns = answers[idx];
      if (userAns && userAns === q.correct) {
        correct++;
      }
    });

    const unanswered = totalQ - Object.keys(answers).length;
    const wrong = totalQ - correct - unanswered;
    const score = Number(((correct * 10) / (totalQ || 1)).toFixed(2));
    const percent = Number(((correct * 100) / (totalQ || 1)).toFixed(1));
    const elapsed = room.examTimeMinutes * 60 - remainingSeconds;

    // Breakdown by technical group (AT, QT, NQ, TTD, AX)
    const groupStats: Record<string, { total: number; correct: number; percent: number }> = {
      at: { total: 0, correct: 0, percent: 0 },
      qt: { total: 0, correct: 0, percent: 0 },
      nq: { total: 0, correct: 0, percent: 0 },
      ttd: { total: 0, correct: 0, percent: 0 },
      ax: { total: 0, correct: 0, percent: 0 },
    };

    questions.forEach((q, idx) => {
      const sec = (q.section || '').toUpperCase();
      let grpKey = 'ax';
      if (sec === 'AT' || sec.startsWith('AT')) grpKey = 'at';
      else if (sec === 'QT' || sec.startsWith('QT')) grpKey = 'qt';
      else if (sec === 'NQ' || sec.startsWith('NQ')) grpKey = 'nq';
      else if (sec.startsWith('TTD') || sec.startsWith('DD')) grpKey = 'ttd';

      if (!groupStats[grpKey]) groupStats[grpKey] = { total: 0, correct: 0, percent: 0 };
      groupStats[grpKey].total++;
      if (answers[idx] === q.correct) {
        groupStats[grpKey].correct++;
      }
    });

    Object.keys(groupStats).forEach((k) => {
      const g = groupStats[k];
      g.percent = g.total > 0 ? Number(((g.correct / g.total) * 100).toFixed(1)) : 100;
    });

    const atPercent = groupStats.at.total > 0 ? groupStats.at.percent : 100;
    // Điểm sàn An toàn: An toàn điện phải >= 80%
    const safetyPassed = atPercent >= 80;
    // Điều kiện đỗ sát hạch chuẩn ngành điện: Tổng điểm >= 7.0/10 (>= 70%) VÀ Điểm An toàn >= 80%
    const isExamPassed = percent >= 70 && safetyPassed;
    let passNote = isExamPassed ? 'ĐẠT TIÊU CHUẨN SÁT HẠCH' : '';
    if (!isExamPassed) {
      if (percent < 70 && !safetyPassed) {
        passNote = 'KHÔNG ĐẠT (Điểm tổng < 70% & Dưới 80% điểm An toàn)';
      } else if (!safetyPassed) {
        passNote = 'KHÔNG ĐẠT (Chưa đạt mức tối thiểu 80% điểm An toàn điện)';
      } else {
        passNote = 'KHÔNG ĐẠT (Điểm tổng dưới 70%)';
      }
    }

    const attempt: ExamAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      candidateName,
      unit,
      unitName,
      level,
      examCode,
      roomCode: room.roomCode,
      mode,
      startedAt: startTime,
      submittedAt: new Date().toISOString(),
      durationLimitSeconds: room.examTimeMinutes * 60,
      elapsedSeconds: Math.max(1, elapsed),
      total: totalQ,
      correct,
      wrong,
      unanswered,
      score,
      percent,
      status: forcedStatus || (isExamPassed ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'),
      focusViolations,
      answers,
      questions,
      groupBreakdown: groupStats,
      safetyPassed,
      isPassed: isExamPassed,
      passNote,
    };

    onFinishExam(attempt);
  }, [
    answers, candidateName, examCode, focusViolations, level, mode, onFinishExam,
    questions, remainingSeconds, room.examTimeMinutes, room.roomCode, startTime, unit, unitName
  ]);

  // Navigation helpers
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = remainingSeconds < 300; // less than 5 mins

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-cyan-500/20">
            {unit}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-100">{candidateName}</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-cyan-400 border border-slate-700">
                Mã đề: {examCode}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {unitName} • Bậc {level} • Phòng: <span className="text-cyan-400 font-semibold">{room.roomCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Violations Badge */}
          {isOfficial && focusViolations > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Rời màn hình: {focusViolations}/{room.maxFocusViolations}</span>
            </div>
          )}

          {/* Timer Clock */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base transition-colors ${
            isTimeCritical 
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse' 
              : 'bg-slate-800/80 border-slate-700 text-cyan-300'
          }`}>
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Main Content: Split View for Desktop, Responsive for Mobile */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Question Box */}
        <main className="lg:col-span-8 flex flex-col gap-4">
          {/* Question Header Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                  Câu {currentIndex + 1} / {questions.length}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {currentQ.section || 'Chung'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMarkQuestion}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    markedIndexes.has(currentIndex)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{markedIndexes.has(currentIndex) ? 'Đã xem lại ★' : 'Đánh dấu'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-xl font-bold text-slate-100 leading-relaxed mb-4">
              {currentQ.question}
            </h2>

            {/* Multi-answer notice if applicable */}
            {isMultiChoice && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Câu hỏi có nhiều đáp án đúng. Bạn có thể chọn nhiều lựa chọn.
              </div>
            )}

            {/* Question Options */}
            <div className="flex flex-col gap-2.5 mt-2">
              {Object.entries(currentQ.options || {}).map(([key, text]) => {
                const currentAnswer = answers[currentIndex] || '';
                const isSelected = isMultiChoice
                  ? currentAnswer.includes(key)
                  : currentAnswer === key;

                // In training mode, if answer selected or hint shown, give instant feedback styling
                const isTrainingFeedback = !isOfficial && (Boolean(currentAnswer) || Boolean(showHintForIndex[currentIndex]));
                const isRightOption = currentQ.correct.includes(key);

                let optionBorderClass = 'bg-slate-800/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300';
                if (isSelected) {
                  if (isTrainingFeedback) {
                    optionBorderClass = isRightOption
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-100 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-rose-500/15 border-rose-500/60 text-rose-100 shadow-md ring-1 ring-rose-500/40';
                  } else {
                    optionBorderClass = 'bg-cyan-500/15 border-cyan-500/60 text-cyan-100 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40';
                  }
                } else if (isTrainingFeedback && isRightOption) {
                  optionBorderClass = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300';
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 group relative cursor-pointer active:scale-[0.99] ${optionBorderClass}`}
                  >
                    <div
                      className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border transition-all ${
                        isSelected
                          ? isTrainingFeedback && !isRightOption
                            ? 'bg-rose-500 border-rose-400 text-white font-black'
                            : 'bg-cyan-500 border-cyan-400 text-slate-950 font-black shadow-md'
                          : isTrainingFeedback && isRightOption
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:border-slate-500'
                      }`}
                    >
                      {key}
                    </div>
                    <span className="pt-0.5 text-sm sm:text-base leading-snug font-medium flex-1">
                      {text}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
                        isTrainingFeedback && !isRightOption ? 'text-rose-400' : 'text-cyan-400'
                      }`} />
                    )}
                    {isTrainingFeedback && isRightOption && !isSelected && (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                        Đáp án đúng
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TRAINING / STUDY MODE: CĂN CỨ QUY TRÌNH & GIẢI THÍCH HỌC TẬP */}
            {!isOfficial && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ÔN LUYỆN BỘ ĐỀ & HỌC TẬP</span>
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      (Có trích dẫn quy chuẩn kỹ thuật phục vụ học tập)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowHintForIndex((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition-all"
                  >
                    <span>{showHintForIndex[currentIndex] || answers[currentIndex] ? 'Ẩn trích dẫn' : '💡 Xem trích dẫn & đáp án'}</span>
                  </button>
                </div>

                {/* Show citation and explanation when an answer is chosen or hint button toggled */}
                {(showHintForIndex[currentIndex] || answers[currentIndex]) && (
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-3 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Đáp án chính xác:</span>
                        <span className="px-3 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-black text-sm border border-emerald-500/40">
                          {currentQ.correct}
                        </span>
                      </div>

                      {answers[currentIndex] && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                          answers[currentIndex] === currentQ.correct
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {answers[currentIndex] === currentQ.correct
                            ? '✓ Bạn đã chọn ĐÚNG'
                            : `✗ Bạn chọn ${answers[currentIndex]} (Chưa chính xác)`}
                        </span>
                      )}
                    </div>

                    {/* Căn cứ trích dẫn quy trình kỹ thuật / pháp lý */}
                    {currentQ.citation ? (
                      <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs leading-relaxed flex items-start gap-2.5">
                        <span className="text-base shrink-0">📌</span>
                        <div>
                          <strong className="text-blue-100 font-bold block mb-1">
                            Căn cứ quy trình / Quy chuẩn kỹ thuật:
                          </strong>
                          <span className="text-slate-200">{currentQ.citation}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                        <span>📌 Căn cứ quy trình: Tài liệu đào tạo nội bộ và Quy trình kỹ thuật vận hành SPMO.</span>
                      </div>
                    )}

                    {/* Giải thích chi tiết */}
                    {currentQ.explanation && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs leading-relaxed flex items-start gap-2.5">
                        <span className="text-base shrink-0">💡</span>
                        <div>
                          <strong className="text-amber-300 font-bold block mb-1">
                            Giải thích chuyên môn & kiến thức cốt lõi:
                          </strong>
                          <span className="text-slate-300">{currentQ.explanation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Prev/Next controls */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setShowNavDrawerMobile(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold"
            >
              <FileText className="w-4 h-4" />
              <span>Mục lục ({answeredCount}/{questions.length})</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 active:scale-95 transition-all"
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Right: 3-Frame Structured Navigation Grid (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Bảng Điều Hướng Câu Hỏi</span>
            </h3>
            <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              {answeredCount}/{questions.length} câu
            </span>
          </div>

          {/* Section 1: AT (An toàn điện) */}
          {atQuestions.length > 0 && (
            <div className="mb-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Phần I: An Toàn Điện (AT)</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{atQuestions.length} câu</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {atQuestions.map((qIdx) => (
                  <QuestionGridButton
                    key={qIdx}
                    index={qIdx}
                    isCurrent={currentIndex === qIdx}
                    isAnswered={Boolean(answers[qIdx])}
                    isMarked={markedIndexes.has(qIdx)}
                    onClick={() => setCurrentIndex(qIdx)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: QT (Quy trình) */}
          {qtQuestions.length > 0 && (
            <div className="mb-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Phần II: Quy Trình Kỹ Thuật (QT)</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{qtQuestions.length} câu</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {qtQuestions.map((qIdx) => (
                  <QuestionGridButton
                    key={qIdx}
                    index={qIdx}
                    isCurrent={currentIndex === qIdx}
                    isAnswered={Boolean(answers[qIdx])}
                    isMarked={markedIndexes.has(qIdx)}
                    onClick={() => setCurrentIndex(qIdx)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: NQ (Nội quy) */}
          {nqQuestions.length > 0 && (
            <div className="mb-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Phần III: Nội Quy Lao Động (NQ)</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{nqQuestions.length} câu</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {nqQuestions.map((qIdx) => (
                  <QuestionGridButton
                    key={qIdx}
                    index={qIdx}
                    isCurrent={currentIndex === qIdx}
                    isAnswered={Boolean(answers[qIdx])}
                    isMarked={markedIndexes.has(qIdx)}
                    onClick={() => setCurrentIndex(qIdx)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 4: AX (Chuyên môn) */}
          {axQuestions.length > 0 && (
            <div className="mb-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Phần IV: Chuyên Môn Bậc {level} (AX)</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{axQuestions.length} câu</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {axQuestions.map((qIdx) => (
                  <QuestionGridButton
                    key={qIdx}
                    index={qIdx}
                    isCurrent={currentIndex === qIdx}
                    isAnswered={Boolean(answers[qIdx])}
                    isMarked={markedIndexes.has(qIdx)}
                    onClick={() => setCurrentIndex(qIdx)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 5: TTD (Thao tác Điều độ) */}
          {ttdQuestions.length > 0 && (
            <div className="mb-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Phần V: Thao Tác Điều Độ (TTD)</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{ttdQuestions.length} câu</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ttdQuestions.map((qIdx) => (
                  <QuestionGridButton
                    key={qIdx}
                    index={qIdx}
                    isCurrent={currentIndex === qIdx}
                    isAnswered={Boolean(answers[qIdx])}
                    isMarked={markedIndexes.has(qIdx)}
                    onClick={() => setCurrentIndex(qIdx)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40"></span>
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40"></span>
              <span>Đánh dấu xem lại</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span>
              <span>Chưa làm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500 border border-cyan-400"></span>
              <span>Đang xem</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer Navigation Modal */}
      {showNavDrawerMobile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-sm h-full p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="font-bold text-base text-slate-200">Mục lục câu hỏi</h3>
                <button
                  onClick={() => setShowNavDrawerMobile(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>

              {/* Grid of all questions */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, qIdx) => (
                  <QuestionGridButton
                    key={qIdx}
                    index={qIdx}
                    isCurrent={currentIndex === qIdx}
                    isAnswered={Boolean(answers[qIdx])}
                    isMarked={markedIndexes.has(qIdx)}
                    onClick={() => {
                      setCurrentIndex(qIdx);
                      setShowNavDrawerMobile(false);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-6">
              <button
                onClick={() => {
                  setShowNavDrawerMobile(false);
                  setShowSubmitConfirm(true);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
              >
                Nộp bài thi ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal (Focus Violation) */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl shadow-rose-950/50 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Cảnh Báo Giám Sát Thi</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {warningMessage}
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors"
            >
              Tôi Đã Hiểu Và Quay Lại Làm Bài
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Send className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Xác Nhận Nộp Bài Thi</h3>
            
            <div className="bg-slate-800/60 rounded-xl p-3 my-4 text-sm text-slate-300 border border-slate-800">
              <p>Tổng số câu hỏi: <strong className="text-slate-100">{questions.length}</strong></p>
              <p>Đã hoàn thành: <strong className="text-emerald-400">{answeredCount}</strong></p>
              <p>Chưa làm: <strong className={questions.length - answeredCount > 0 ? "text-amber-400" : "text-slate-400"}>
                {questions.length - answeredCount} câu
              </strong></p>
            </div>

            {questions.length - answeredCount > 0 && (
              <p className="text-xs text-amber-400/90 mb-5 font-medium">
                ⚠️ Bạn vẫn còn {questions.length - answeredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleFinalSubmit();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface QuestionGridButtonProps {
  index: number;
  isCurrent: boolean;
  isAnswered: boolean;
  isMarked: boolean;
  onClick: () => void;
}

const QuestionGridButton: React.FC<QuestionGridButtonProps> = React.memo(({
  index,
  isCurrent,
  isAnswered,
  isMarked,
  onClick,
}) => {
  let styleClasses = 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500';

  if (isCurrent) {
    styleClasses = 'bg-cyan-500 border-cyan-400 text-slate-950 font-black ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/30';
  } else if (isMarked) {
    styleClasses = 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold';
  } else if (isAnswered) {
    styleClasses = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold';
  }

  return (
    <button
      onClick={onClick}
      className={`h-9 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${styleClasses}`}
    >
      <span>{index + 1}</span>
      {isAnswered && !isCurrent && <span className="ml-0.5 text-[9px] text-emerald-400">✓</span>}
    </button>
  );
});
