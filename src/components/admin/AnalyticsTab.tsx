import React, { useState, useMemo } from 'react';
import { 
  BarChart3, AlertTriangle, CheckCircle2, TrendingUp, Users, 
  ShieldCheck, HelpCircle, ArrowUpRight, Award, PieChart, Filter
} from 'lucide-react';
import { Candidate, Question, ExamAttempt, ExamRoom } from '../../types/exam';
import { getQuestionBankInfo } from '../../utils/questionMeta';

interface AnalyticsTabProps {
  questions: Question[];
  candidates: Candidate[];
  rooms: ExamRoom[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  questions,
  candidates,
  rooms,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');

  // Lấy danh sách kết quả bài thi từ localStorage nếu có
  const attempts: ExamAttempt[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('spmo_all_attempts_v9');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const filteredCandidates = useMemo(() => {
    if (selectedRoom === 'ALL') return candidates;
    return candidates.filter((c) => c.roomCode === selectedRoom);
  }, [candidates, selectedRoom]);

  const submittedCandidates = useMemo(() => {
    return filteredCandidates.filter((c) => c.status === 'submitted' || c.status === 'violation');
  }, [filteredCandidates]);

  // 1. Phân tích thống kê kết quả tổng thể
  const totalSubmissions = submittedCandidates.length;
  const passedCandidates = submittedCandidates.filter((c) => (c.score || 0) >= 7.0);
  const passRate = totalSubmissions > 0 ? Math.round((passedCandidates.length / totalSubmissions) * 100) : 0;
  const avgScore = totalSubmissions > 0 
    ? Number((submittedCandidates.reduce((acc, c) => acc + (c.score || 0), 0) / totalSubmissions).toFixed(1)) 
    : 0;

  // 2. Skill Gap Analysis (Lỗ hổng kiến thức theo nhóm chuyên môn & an toàn)
  const skillBreakdown = useMemo(() => {
    const stats: Record<string, { label: string; correct: number; total: number; percent: number; color: string }> = {
      at: { label: 'An Toàn Lao Động (AT)', correct: 0, total: 0, percent: 0, color: 'bg-emerald-500' },
      qt: { label: 'Quy Trình Vận Hành (QT)', correct: 0, total: 0, percent: 0, color: 'bg-teal-500' },
      nq: { label: 'Nội Quy Kỷ Luật (NQ)', correct: 0, total: 0, percent: 0, color: 'bg-amber-500' },
      ax: { label: 'Chuyên Môn Bậc Thợ (AX)', correct: 0, total: 0, percent: 0, color: 'bg-sky-500' },
      ttd: { label: 'Thị Trường Điện (TTD)', correct: 0, total: 0, percent: 0, color: 'bg-purple-500' },
    };

    attempts.forEach((att) => {
      if (att.groupBreakdown) {
        Object.entries(att.groupBreakdown).forEach(([key, val]) => {
          if (stats[key]) {
            stats[key].correct += val.correct;
            stats[key].total += val.total;
          }
        });
      }
    });

    Object.values(stats).forEach((item) => {
      item.percent = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 85;
    });

    return stats;
  }, [attempts]);

  // 3. Item Analysis: Thống kê độ khó và các câu hỏi có tỷ lệ làm sai cao nhất
  const difficultQuestions = useMemo(() => {
    const questionStats = new Map<string, { totalAttempts: number; wrongCount: number }>();

    attempts.forEach((att) => {
      if (att.questions && att.answers) {
        att.questions.forEach((q, idx) => {
          const userAns = att.answers[idx];
          if (!questionStats.has(q.id)) {
            questionStats.set(q.id, { totalAttempts: 0, wrongCount: 0 });
          }
          const s = questionStats.get(q.id)!;
          s.totalAttempts++;
          if (!userAns || userAns !== q.correct) {
            s.wrongCount++;
          }
        });
      }
    });

    const list: Array<{
      question: Question;
      wrongRate: number;
      totalAttempts: number;
      wrongCount: number;
    }> = [];

    questions.forEach((q) => {
      const s = questionStats.get(q.id);
      if (s && s.totalAttempts >= 1) {
        const rate = Math.round((s.wrongCount / s.totalAttempts) * 100);
        list.push({
          question: q,
          wrongRate: rate,
          totalAttempts: s.totalAttempts,
          wrongCount: s.wrongCount,
        });
      }
    });

    // Sắp xếp các câu có tỷ lệ sai từ cao xuống thấp
    return list.sort((a, b) => b.wrongRate - a.wrongRate).slice(0, 10);
  }, [attempts, questions]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-[#0066b2] flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Phân Tích Đào Tạo & Chỉ Số Chất Lượng Câu Hỏi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Item Analysis (Độ khó câu hỏi) & Skill Gap Analysis (Phát hiện lỗ hổng kiến thức để tái huấn luyện)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Lọc theo phòng:</span>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả các phòng ({rooms.length})</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.roomCode}>
                Phòng {r.roomCode} - {r.roomName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Tổng lượt thí sinh dự thi</span>
          <p className="text-2xl font-black text-slate-900 mt-1 flex items-center justify-between">
            <span>{totalSubmissions} thí sinh</span>
            <Users className="w-5 h-5 text-sky-600" />
          </p>
          <span className="text-[11px] text-slate-400">Đã hoàn thành hoặc nộp bài</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Tỷ lệ Đạt Sát Hạch</span>
          <p className="text-2xl font-black text-emerald-600 mt-1 flex items-center justify-between">
            <span>{passRate}%</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </p>
          <span className="text-[11px] text-slate-400">{passedCandidates.length} / {totalSubmissions || 1} đạt chuẩn</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Điểm số trung bình</span>
          <p className="text-2xl font-black text-[#0066b2] mt-1 flex items-center justify-between">
            <span>{avgScore} / 10</span>
            <Award className="w-5 h-5 text-amber-500" />
          </p>
          <span className="text-[11px] text-slate-400">Điểm sàn quy định: 7.0/10</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Độ khó ngân hàng đề</span>
          <p className="text-2xl font-black text-slate-800 mt-1 flex items-center justify-between">
            <span>Chuẩn hóa</span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </p>
          <span className="text-[11px] text-slate-400">{questions.length} câu trong ngân hàng</span>
        </div>
      </div>

      {/* Skill Gap Analysis Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Phân Tích Lỗ Hổng Kiến Thức Theo Khối Nghiệp Vụ (Skill Gap Analysis)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ lệ trả lời chính xác theo từng kho kiến thức, giúp ban lãnh đạo xác định mảng cần đào tạo bù đắp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {Object.entries(skillBreakdown).map(([key, item]) => {
            const isWeak = item.percent < 75;
            return (
              <div
                key={key}
                className={`p-4 rounded-2xl border transition-all ${
                  isWeak ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-800">{item.label}</span>
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                    isWeak ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.percent}% đúng
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                  <span>Tổng số lượt hỏi: {item.total} lượt</span>
                  {isWeak ? (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Cần huấn luyện bổ sung
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Đạt chuẩn năng lực</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Analysis: Câu hỏi có tỷ lệ làm sai cao nhất */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Chỉ Số Chất Lượng Câu Hỏi (Item Analysis - Top Câu Hỏi Có Tỷ Lệ Sai Cao)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các câu hỏi có tỷ lệ thí sinh chọn sai trên 50% cần được Hội đồng rà soát lại về tính rõ ràng, đáp án hoặc phương pháp đào tạo.
            </p>
          </div>
        </div>

        {difficultQuestions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs">
            Chưa có đủ dữ liệu lịch sử thi để phân tích độ khó chi tiết cho từng câu hỏi.
          </div>
        ) : (
          <div className="space-y-3">
            {difficultQuestions.map(({ question, wrongRate, totalAttempts, wrongCount }) => {
              const info = getQuestionBankInfo(question);
              return (
                <div
                  key={question.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className={`px-2 py-0.5 rounded font-bold border text-[11px] ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}>
                        {info.fullLabel}
                      </span>
                      {question.section && (
                        <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-mono text-[11px] border border-slate-200">
                          Mã: {question.section}
                        </span>
                      )}
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                        Tỷ lệ sai: {wrongRate}% ({wrongCount}/{totalAttempts} lượt)
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {question.question}
                    </p>

                    <p className="text-xs text-slate-500">
                      Đáp án đúng chuẩn: <strong className="text-emerald-700 font-bold">{question.correct}</strong> • {question.options[question.correct]}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700">
                      Độ khó: {wrongRate > 70 ? 'Rất cao (Kiểm tra lại đề)' : wrongRate > 40 ? 'Khó' : 'Trung bình'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
