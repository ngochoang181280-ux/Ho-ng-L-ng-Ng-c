import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Search, CheckCircle2, Database, ShieldAlert } from 'lucide-react';
import { Question, RecycleBinItem } from '../../types/exam';
import { getQuestionBankInfo } from '../../utils/questionMeta';

interface RecycleBinTabProps {
  recycleBin: RecycleBinItem[];
  onRestoreQuestion: (item: RecycleBinItem) => void;
  onRestoreAll: () => void;
  onPermanentDelete: (itemId: string) => void;
  onClearRecycleBin: () => void;
}

export const RecycleBinTab: React.FC<RecycleBinTabProps> = ({
  recycleBin,
  onRestoreQuestion,
  onRestoreAll,
  onPermanentDelete,
  onClearRecycleBin,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredItems = recycleBin.filter((item) => {
    const q = item.question;
    const matchSearch =
      search.trim() === '' ||
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      (q.section && q.section.toLowerCase().includes(search.toLowerCase())) ||
      q.id.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (filterType === 'ALL') return true;
    const info = getQuestionBankInfo(q);
    return info.bankKey === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Thùng Rác Câu Hỏi</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {recycleBin.length} câu đã xóa
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Các câu hỏi bị xóa sẽ được tạm lưu tại đây. Bạn có thể khôi phục lại bất kỳ lúc nào hoặc xóa vĩnh viễn.
            </p>
          </div>
        </div>

        {recycleBin.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onRestoreAll}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi Phục Tất Cả</span>
            </button>
            <button
              onClick={onClearRecycleBin}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Dọn Sạch Thùng Rác</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm câu hỏi trong thùng rác theo nội dung, mã nhóm..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-sky-500 outline-none"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium text-slate-700 outline-none w-full sm:w-auto cursor-pointer"
        >
          <option value="ALL">Mọi nhóm kho</option>
          <option value="at">An toàn (AT)</option>
          <option value="qt">Quy trình (QT)</option>
          <option value="nq">Nội quy (NQ)</option>
          <option value="ax">Chuyên môn (AX)</option>
          <option value="ttd">Thị trường điện (TTD)</option>
        </select>
      </div>

      {/* Questions List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <Trash2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">Thùng rác hiện đang trống.</p>
          <p className="text-xs text-slate-400 mt-1">Khi bạn xóa câu hỏi ở tab Ngân Hàng Đề, câu hỏi sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => {
            const q = item.question;
            const bankInfo = getQuestionBankInfo(q);

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${bankInfo.badgeBg} ${bankInfo.badgeText} ${bankInfo.badgeBorder}`}>
                      {bankInfo.fullLabel}
                    </span>
                    {q.section && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-semibold border border-slate-200">
                        Mã: {q.section}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Xóa lúc: {new Date(item.deletedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <p className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                    {q.question}
                  </p>

                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Số phương án: <strong>{Object.keys(q.options || {}).length}</strong></span>
                    <span>Đáp án đúng: <strong className="text-emerald-700">{q.correct}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => onRestoreQuestion(item)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs transition-colors cursor-pointer"
                    title="Khôi phục câu hỏi này về ngân hàng đề"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục</span>
                  </button>

                  <button
                    onClick={() => onPermanentDelete(item.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 hover:border-rose-300 font-bold text-xs transition-colors cursor-pointer"
                    title="Xóa vĩnh viễn câu hỏi này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa hẳn</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
