import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Clock, AlertTriangle, ChevronLeft, ChevronRight, Bookmark, 
  Send, ShieldAlert, CheckCircle2, RotateCcw,
  Sparkles, FileText, Smartphone, Laptop, Database,
  Maximize2, Minimize2, Type, Keyboard, HelpCircle
} from 'lucide-react';
import { Question, ExamRoom, ExamAttempt } from '../types/exam';
import { isTtdQuestion, getQuestionBankInfo, getExamQuestionsBankComposition } from '../utils/questionMeta';
import { getQuestionGroupKey } from '../data/mockData';
import { realtimeExamBus } from '../utils/realtimeProctor';

interface CandidateExamProps {
  candidateName: string;
  unit: string;
  unitName: string;
  level: string;
  room: ExamRoom;
  examCode: string;
  questions: Question[];
  mode: 'official' | 'training';
  matrixWarnings?: string[];
  matrixTargetTotal?: number;
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
  matrixWarnings,
  matrixTargetTotal,
  onFinishExam,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(`exam_current_index_${room.roomCode}_${candidateName}`);
      return saved ? Math.min(Math.max(0, parseInt(saved, 10)), questions.length - 1) : 0;
    } catch {
      return 0;
    }
  });
  const [dismissWarning, setDismissWarning] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHotkeysModal, setShowHotkeysModal] = useState(false);
  const [proctorNotice, setProctorNotice] = useState<string | null>(null);

  // Trích xuất cảnh báo thiếu câu hỏi theo ma trận
  const effectiveWarnings = useMemo(() => {
    if (matrixWarnings && matrixWarnings.length > 0) return matrixWarnings;
    return (questions as any)?.matrixWarnings || [];
  }, [matrixWarnings, questions]);

  const effectiveTargetTotal = matrixTargetTotal || (questions as any)?.matrixTargetTotal || room.totalQuestions || questions.length;
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

  // Lưu vị trí câu hỏi đang làm vào localStorage để khôi phục khi F5
  useEffect(() => {
    try {
      localStorage.setItem(`exam_current_index_${room.roomCode}_${candidateName}`, String(currentIndex));
    } catch {
      // ignore
    }
  }, [currentIndex, room.roomCode, candidateName]);

  // Group questions by distinct sections:
  // 1. AT (An toàn)
  // 2. QT (Quy trình)
  // 3. NQ (Nội quy)
  // 4. AX (Chuyên môn bậc)
  // 5. TTD (Thị trường điện - đưa ra sau cùng)
  const { atQuestions, qtQuestions, nqQuestions, axQuestions, ttdQuestions } = useMemo(() => {
    const at: number[] = [];
    const qt: number[] = [];
    const nq: number[] = [];
    const ax: number[] = [];
    const ttd: number[] = [];

    questions.forEach((q, idx) => {
      if (isTtdQuestion(q)) {
        ttd.push(idx);
      } else {
        const k = getQuestionGroupKey(q);
        if (k === 'at') {
          at.push(idx);
        } else if (k === 'qt') {
          qt.push(idx);
        } else if (k === 'nq') {
          nq.push(idx);
        } else {
          ax.push(idx);
        }
      }
    });

    return { atQuestions: at, qtQuestions: qt, nqQuestions: nq, axQuestions: ax, ttdQuestions: ttd };
  }, [questions]);

  // Current question data
  const currentQ = questions[currentIndex] || questions[0];
  const isMultiChoice = (currentQ?.correct || '').length > 1;
  const currentBankInfo = useMemo(() => getQuestionBankInfo(currentQ), [currentQ]);
  const bankComposition = useMemo(() => getExamQuestionsBankComposition(questions), [questions]);

  // Auto-save answers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`exam_answers_${room.roomCode}_${candidateName}`, JSON.stringify(answers));
    } catch (e) {
      console.warn('Could not auto-save to localStorage', e);
    }
  }, [answers, room.roomCode, candidateName]);

  // Fullscreen controller
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, []);

  // Lắng nghe sự kiện thoát Fullscreen khi thi chính thức
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isOfficial && !isFs && !hasFinishedRef.current) {
        setFocusViolations((prev) => {
          const next = prev + 1;
          setWarningMessage(
            `Cảnh báo: Bạn vừa thoát chế độ Toàn Màn Hình! Lần vi phạm ${next}/${room.maxFocusViolations}. Vui lòng bấm Toàn Màn Hình để tiếp tục làm bài nghiêm túc.`
          );
          setShowWarningModal(true);
          return next;
        });
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isOfficial, room.maxFocusViolations]);

  // Đồng bộ Realtime Heartbeat tới Giám thị
  useEffect(() => {
    if (hasFinishedRef.current) return;
    realtimeExamBus.send({
      type: 'HEARTBEAT',
      candidateName,
      roomCode: room.roomCode,
      currentIndex: currentIndex + 1,
      answeredCount: Object.keys(answers).length,
      totalQuestions: questions.length,
      remainingSeconds,
      focusViolations,
      timestamp: Date.now(),
    });
  }, [currentIndex, answers, remainingSeconds, focusViolations, candidateName, room.roomCode, questions.length]);

  // Lắng nghe lệnh từ Giám thị qua Realtime Bus
  useEffect(() => {
    const unsubscribe = realtimeExamBus.subscribe((msg) => {
      if (msg.roomCode === room.roomCode && msg.candidateName === candidateName) {
        if (msg.type === 'FORCE_SUBMIT') {
          setProctorNotice('⚠️ Giám thị đã kích hoạt lệnh THU BÀI CƯỠNG CHẾ đối với bạn!');
          setTimeout(() => {
            handleFinalSubmit('THU BÀI CƯỠNG CHẾ TỪ GIÁM THỊ');
          }, 500);
        } else if (msg.type === 'ADD_TIME') {
          const extraSecs = msg.extraSeconds || 300;
          setRemainingSeconds((prev) => prev + extraSecs);
          setProctorNotice(`🎉 Giám thị vừa cộng thêm ${Math.round(extraSecs / 60)} phút làm bài cho bạn!`);
          setTimeout(() => setProctorNotice(null), 5000);
        } else if (msg.type === 'PROCTOR_WARNING') {
          setWarningMessage(msg.warningText || 'Cảnh báo nghiêm khắc từ Giám thị!');
          setShowWarningModal(true);
        }
      }
    });
    return () => unsubscribe();
  }, [room.roomCode, candidateName]);

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
      localStorage.removeItem(`exam_current_index_${room.roomCode}_${candidateName}`);
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
      matrixWarnings: effectiveWarnings,
      matrixTargetTotal: effectiveTargetTotal,
    };

    onFinishExam(attempt);
  }, [
    answers, candidateName, examCode, focusViolations, level, mode, onFinishExam,
    questions, remainingSeconds, room.examTimeMinutes, room.roomCode, startTime, unit, unitName
  ]);

  // Navigation helpers
  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Hotkeys listener for keyboard shortcuts (Phím tắt làm bài nhanh: 1..4, A..D, Mũi tên, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitConfirm || showWarningModal || hasFinishedRef.current) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleSelectOption(key);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const mapped = ['A', 'B', 'C', 'D'][parseInt(e.key, 10) - 1];
        if (mapped) handleSelectOption(mapped);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMarkQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOption, handleNext, handlePrev, toggleMarkQuestion, showSubmitConfirm, showWarningModal]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = remainingSeconds < 300; // less than 5 mins

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between selection:bg-sky-500/25">
      {/* EVN Electric Blue Top Bar */}
      <header className="sticky top-0 z-40 evn-header-bg text-white shadow-md border-b border-sky-700/40 px-3 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-black text-white text-base shadow-md">
            {unit}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white">{candidateName}</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                Mã đề: {examCode}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                mode === 'training'
                  ? 'bg-sky-100 text-sky-900 border-sky-200'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {mode === 'training' ? '📖 Thi Luyện (Mở trích dẫn)' : '🛡️ Thi Chính Thức'}
              </span>
            </div>
            <p className="text-xs text-sky-100/90">
              {unitName} • Bậc {level} • Phòng: <span className="text-white font-bold">{room.roomCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Violations Badge */}
          {isOfficial && focusViolations > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-semibold animate-pulse shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Rời màn hình: {focusViolations}/{room.maxFocusViolations}</span>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isFullscreen 
                ? 'bg-emerald-500/30 border-emerald-300 text-emerald-100' 
                : 'bg-white/15 border-white/25 text-white hover:bg-white/25'
            }`}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Bật Toàn Màn Hình (Chống vi phạm)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          {/* Font Size Scaler */}
          <div className="hidden sm:flex items-center rounded-lg bg-white/15 p-0.5 border border-white/25 text-xs">
            <button
              onClick={() => setFontSizeLevel('normal')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                fontSizeLevel === 'normal' ? 'bg-white text-sky-800 shadow-xs' : 'text-white hover:bg-white/10'
              }`}
              title="Cỡ chữ chuẩn (A)"
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel('large')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                fontSizeLevel === 'large' ? 'bg-white text-sky-800 shadow-xs' : 'text-white hover:bg-white/10'
              }`}
              title="Cỡ chữ lớn (A+)"
            >
              A+
            </button>
            <button
              onClick={() => setFontSizeLevel('xlarge')}
              className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                fontSizeLevel === 'xlarge' ? 'bg-white text-sky-800 shadow-xs' : 'text-white hover:bg-white/10'
              }`}
              title="Cỡ chữ cực lớn (A++)"
            >
              A++
            </button>
          </div>

          {/* Hotkeys Button */}
          <button
            onClick={() => setShowHotkeysModal(true)}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-white hover:bg-white/25 text-xs font-semibold transition-all cursor-pointer"
            title="Xem danh sách phím tắt làm bài nhanh"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Phím tắt</span>
          </button>

          {/* Timer Clock */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base transition-colors ${
            isTimeCritical 
              ? 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-md' 
              : 'bg-white/20 border-white/30 text-white'
          }`}>
            <Clock className="w-4 h-4 text-white" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Proctor Live Alert Toast (Nếu giám thị gửi lệnh/cảnh báo) */}
      {proctorNotice && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{proctorNotice}</span>
        </div>
      )}

      {/* Top Question Bank Composition Strip */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-700 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            Nguồn kho câu hỏi:
          </span>
          {bankComposition.map((b) => (
            <span key={b.bankCode} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-medium">
              {b.label}: <strong className="text-sky-700">{b.count}c</strong>
            </span>
          ))}
        </div>
        {effectiveWarnings.length > 0 && (
          <span className="text-amber-800 font-bold text-[11px] shrink-0 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Kho thiếu {effectiveWarnings.length} nhóm (Đã bỏ qua, không bù)
          </span>
        )}
      </div>

      {/* Main Content: Split View for Desktop, Responsive for Mobile */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Question Box */}
        <main className="lg:col-span-8 flex flex-col gap-4">
          {/* Matrix Shortage Warning Banner (Cảnh báo khi ma trận có chọn nhưng kho đề không có) */}
          {effectiveWarnings.length > 0 && !dismissWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-md relative animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-200/80 text-amber-800 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-amber-900 text-sm">
                      ⚠️ CẢNH BÁO MA TRẬN: Kho đề thiếu câu hỏi (Đã bỏ qua phần thiếu)
                    </span>
                    <button
                      type="button"
                      onClick={() => setDismissWarning(true)}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline shrink-0 cursor-pointer"
                    >
                      Ẩn cảnh báo
                    </button>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Ma trận cài đặt yêu cầu <span className="font-bold underline text-amber-950">{effectiveTargetTotal} câu</span>, nhưng ngân hàng câu hỏi hiện chỉ có <span className="font-bold underline text-amber-950">{questions.length} câu</span> phù hợp. Hệ thống đã <span className="font-bold text-amber-900">ra đề bỏ qua phần thiếu</span> và <span className="font-bold text-amber-900">không lấy câu hỏi nhóm khác thay thế vào</span> theo đúng quy định:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 bg-white/70 p-2.5 rounded-xl border border-amber-200">
                    {effectiveWarnings.slice(1).map((w: string, idx: number) => (
                      <li key={idx} className="leading-snug">{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Question Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-xs sm:text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-bold border border-sky-300">
                  Câu {currentIndex + 1} / {questions.length}
                </span>

                {/* Question Bank Origin Badge: Ghi rõ xuất xứ từ kho nào, không nhầm sang kho AT */}
                <span className={`px-2.5 py-1 rounded-lg font-bold text-xs border flex items-center gap-1.5 ${currentBankInfo.badgeBg} ${currentBankInfo.badgeText} ${currentBankInfo.badgeBorder}`}>
                  <Database className="w-3.5 h-3.5" />
                  <span>{currentBankInfo.fullLabel}</span>
                </span>

                {currentQ.section && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-mono text-xs">
                    Mã: {currentQ.section}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMarkQuestion}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    markedIndexes.has(currentIndex)
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{markedIndexes.has(currentIndex) ? 'Đã xem lại ★' : 'Đánh dấu'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <h2 className={`font-bold text-slate-900 leading-relaxed mb-4 ${
              fontSizeLevel === 'large' 
                ? 'text-lg sm:text-xl' 
                : fontSizeLevel === 'xlarge' 
                ? 'text-xl sm:text-2xl' 
                : 'text-base sm:text-lg'
            }`}>
              {currentQ.question}
            </h2>

            {/* Multi-answer notice if applicable */}
            {isMultiChoice && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
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

                const optionBorderClass = isSelected
                  ? 'bg-sky-50 border-sky-500 text-sky-950 font-semibold ring-2 ring-sky-400 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-sky-50/50 hover:border-sky-300 text-slate-800';

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 group relative cursor-pointer active:scale-[0.99] ${optionBorderClass}`}
                  >
                    <div
                      className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border transition-all ${
                        isSelected
                          ? 'bg-sky-600 border-sky-700 text-white font-black shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 group-hover:border-slate-400'
                      }`}
                    >
                      {key}
                    </div>
                    <span className={`pt-0.5 leading-snug font-medium flex-1 ${
                      fontSizeLevel === 'large' 
                        ? 'text-base sm:text-lg' 
                        : fontSizeLevel === 'xlarge' 
                        ? 'text-lg sm:text-xl' 
                        : 'text-sm sm:text-base'
                    }`}>
                      {text}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Prev/Next controls */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setShowNavDrawerMobile(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-100 border border-sky-300 text-sky-800 text-xs font-bold"
            >
              <FileText className="w-4 h-4" />
              <span>Mục lục ({answeredCount}/{questions.length})</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 border border-sky-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-500 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Right: 3-Frame Structured Navigation Grid (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-md sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Bảng Điều Hướng Câu Hỏi</span>
            </h3>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {answeredCount}/{questions.length} câu
            </span>
          </div>

          {/* Section 1: AT (An toàn điện) */}
          {atQuestions.length > 0 && (
            <div className="mb-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Phần I: An Toàn Điện (AT)</span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{atQuestions.length} câu</span>
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
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Phần II: Quy Trình Kỹ Thuật (QT)</span>
                <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{qtQuestions.length} câu</span>
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
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Phần III: Nội Quy Lao Động (NQ)</span>
                <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{nqQuestions.length} câu</span>
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
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Phần IV: Chuyên Môn Bậc {level} (AX)</span>
                <span className="text-[10px] text-sky-700 font-mono font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">{axQuestions.length} câu</span>
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

          {/* Section 5: TTD (Thị trường điện - xếp sau cùng) */}
          {ttdQuestions.length > 0 && (
            <div className="mb-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                <span>Phần V: Thị Trường Điện (TTD)</span>
                <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">{ttdQuestions.length} câu</span>
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
          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
              <span>Đánh dấu xem lại</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></span>
              <span>Chưa làm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-600 border border-sky-700"></span>
              <span>Đang xem</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer Navigation Modal */}
      {showNavDrawerMobile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="bg-white border-l border-slate-200 w-full max-w-sm h-full p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="font-bold text-base text-slate-800">Mục lục câu hỏi</h3>
                <button
                  onClick={() => setShowNavDrawerMobile(false)}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
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

            <div className="pt-4 border-t border-slate-200 mt-6">
              <button
                onClick={() => {
                  setShowNavDrawerMobile(false);
                  setShowSubmitConfirm(true);
                }}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-md shadow-amber-600/30 cursor-pointer"
              >
                Nộp bài thi ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal (Focus Violation) */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto mb-4 text-rose-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cảnh Báo Giám Sát Thi</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {warningMessage}
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Tôi Đã Hiểu Và Quay Lại Làm Bài
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-4 text-amber-600">
              <Send className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xác Nhận Nộp Bài Thi</h3>
            
            <div className="bg-slate-50 rounded-xl p-3 my-4 text-sm text-slate-700 border border-slate-200 text-left space-y-1">
              <p>Tổng số câu hỏi: <strong className="text-slate-900">{questions.length}</strong></p>
              <p>Đã hoàn thành: <strong className="text-emerald-700">{answeredCount}</strong></p>
              <p>Chưa làm: <strong className={questions.length - answeredCount > 0 ? "text-amber-700" : "text-slate-500"}>
                {questions.length - answeredCount} câu
              </strong></p>
            </div>

            {questions.length - answeredCount > 0 && (
              <p className="text-xs text-amber-800 mb-5 font-medium">
                ⚠️ Bạn vẫn còn {questions.length - answeredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleFinalSubmit();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-sm shadow-md shadow-sky-600/25 active:scale-95 transition-all cursor-pointer"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotkeys Guide Modal */}
      {showHotkeysModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scaleUp text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Keyboard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Phím Tắt Làm Bài Nhanh</h3>
              </div>
              <button
                onClick={() => setShowHotkeysModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 my-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Chọn phương án:</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-slate-800 shadow-2xs">1, 2, 3, 4</span>
                  <span className="text-slate-400">hoặc</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-slate-800 shadow-2xs">A, B, C, D</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Câu tiếp theo:</span>
                <span className="px-2.5 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-slate-800 shadow-2xs">Phím →</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Câu trước đó:</span>
                <span className="px-2.5 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-slate-800 shadow-2xs">Phím ←</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Đánh dấu xem lại:</span>
                <span className="px-2.5 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-slate-800 shadow-2xs">Phím M</span>
              </div>
            </div>

            <button
              onClick={() => setShowHotkeysModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0066b2] hover:bg-[#005291] text-white font-bold text-sm shadow-md cursor-pointer transition-all"
            >
              Đã hiểu, quay lại làm bài
            </button>
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
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-200';

  if (isCurrent) {
    styleClasses = 'bg-sky-600 border-sky-700 text-white font-black ring-2 ring-amber-500 ring-offset-2 ring-offset-white shadow-md shadow-sky-600/30';
  } else if (isMarked) {
    styleClasses = 'bg-amber-100 border-amber-300 text-amber-900 font-bold';
  } else if (isAnswered) {
    styleClasses = 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold';
  }

  return (
    <button
      onClick={onClick}
      className={`h-9 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${styleClasses}`}
    >
      <span>{index + 1}</span>
      {isAnswered && !isCurrent && <span className="ml-0.5 text-[9px] text-emerald-700 font-bold">✓</span>}
    </button>
  );
});
