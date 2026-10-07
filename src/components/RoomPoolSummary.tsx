import React from 'react';
import { Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { filterQuestionsForRoom } from '../utils/questionMeta';

type Eligible = ReturnType<typeof filterQuestionsForRoom>;

interface RoomPoolSummaryProps {
  eligible: Eligible;
  unitName: string;
  counts: { at: number; qt: number; nq: number; ttd: number; ax: number };
}

/**
 * Hiển thị "Kho đề tương ứng" của phòng thi: bộ phận + bậc đã chọn sẽ bốc được bao nhiêu câu
 * ở từng nhóm và so với số câu yêu cầu.
 */
export const RoomPoolSummary: React.FC<RoomPoolSummaryProps> = ({ eligible, unitName, counts }) => {
  const rows: { label: string; need: number; have: number; hint: string }[] = [
    { label: 'AT', need: counts.at, have: eligible.atPool.length, hint: 'An toàn' },
    { label: 'QT', need: counts.qt, have: eligible.qtPool.length, hint: 'Quy trình' },
    { label: 'NQ', need: counts.nq, have: eligible.nqPool.length, hint: 'Nội quy' },
    { label: 'TTD', need: counts.ttd, have: eligible.ttdPool.length, hint: 'Điều độ' },
    { label: 'AX', need: counts.ax, have: eligible.axAllEligiblePool.length, hint: 'Chuyên môn' },
  ];
  const short = rows.filter((r) => r.need > r.have);
  const levels: number[] = [];
  for (let lv = 1; lv <= eligible.targetLevel; lv++) levels.push(lv);

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <Database className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-bold text-blue-300">Kho đề tương ứng:</span>
        <span className="text-slate-200">
          Kho {eligible.targetUnit} – {unitName}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
          Bậc thi {eligible.targetLevel}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {rows.map((r) => {
          const bad = r.need > r.have;
          return (
            <div
              key={r.label}
              title={r.hint}
              className={`rounded-lg border px-1 py-1 text-center ${
                bad ? 'border-rose-500/50 bg-rose-500/10' : 'border-slate-700 bg-slate-900/70'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400">{r.label}</div>
              <div className={`text-xs font-mono font-bold ${bad ? 'text-rose-300' : 'text-emerald-300'}`}>
                {r.have}
              </div>
              <div className="text-[9px] text-slate-500">cần {r.need}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
        <span>Chuyên môn theo bậc:</span>
        {levels.map((lv) => (
          <span
            key={lv}
            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-slate-300"
          >
            B{lv}: {(eligible.axPoolByLevel[lv] || []).length}
          </span>
        ))}
      </div>

      {short.length > 0 ? (
        <div className="flex items-start gap-1.5 text-[11px] text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Kho chưa đủ câu cho: {short.map((r) => `${r.label} (cần ${r.need}, có ${r.have})`).join('; ')}. Đề thi sẽ ít
            câu hơn dự kiến - hãy nhập thêm câu vào kho {eligible.targetUnit} hoặc giảm số câu.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Kho đủ câu cho cấu hình hiện tại.</span>
        </div>
      )}
    </div>
  );
};
