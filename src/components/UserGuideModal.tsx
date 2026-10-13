import React, { useState } from 'react';
import { 
  X, BookOpen, Layers, FileText, CheckCircle2, ShieldAlert, 
  Printer, Trophy, Key, Users, Sparkles, HelpCircle,
  Copy, Check, ChevronRight, AlertTriangle, Building2, Sliders, Download
} from 'lucide-react';
import { downloadUserGuideWordDoc } from '../utils/userGuideExport';

interface UserGuideModalProps {
  onClose: () => void;
  initialTab?: 'overview' | 'admin' | 'word_import' | 'matrix' | 'candidate' | 'protocol';
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ 
  onClose,
  initialTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'admin' | 'word_import' | 'matrix' | 'candidate' | 'protocol'>(initialTab);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleDownloadWord = () => {
    downloadUserGuideWordDoc();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] flex flex-col justify-between text-slate-100 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                <span>Cẩm Nang Hướng Dẫn Sử Dụng Chi Tiết</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Hệ Thống Sát Hạch Nghề EVN
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Hướng dẫn vận hành kỳ thi sát hạch nâng bậc thợ, nạp đề từ Word, cấu hình ma trận và xuất biên bản
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadWord}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
              title="Tải toàn bộ cẩm nang hướng dẫn sử dụng về máy dưới định dạng file Word (.doc)"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Đã Tải File Word!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-blue-100" />
                  <span>Tải File Word (.doc)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Đóng hướng dẫn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 my-3.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Quy Trình Tổng Quan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>2. Quản Trị & Giám Thị</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('word_import')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'word_import'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Nạp Đề Từ File Word</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'matrix'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>4. Ma Trận Đề & Nhóm TTD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('candidate')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'candidate'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>5. Dành Cho Thí Sinh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('protocol')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'protocol'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>6. Tiêu Đề & Biên Bản</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto max-h-[62vh] pr-2 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
                <h3 className="font-bold text-cyan-300 text-base mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Quy Trình 5 Bước Vận Hành Kỳ Thi Sát Hạch Nâng Bậc</span>
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Hệ thống được thiết kế chuyên biệt cho công tác kiểm tra, sát hạch nâng bậc nghề và thi giữ bậc hàng năm của các đơn vị trực thuộc Tập đoàn Điện lực Việt Nam (EVN).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">1</span>
                    <h4 className="font-bold text-slate-100 text-xs">Nạp Ngân Hàng Câu Hỏi</h4>
                    <p className="text-[11px] text-slate-400">
                      Tải lên các file Word đề thi theo bộ phận (Trưởng ca, Điều hành viên, Công nhân điện, Công nhân cơ...).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">2</span>
                    <h4 className="font-bold text-slate-100 text-xs">Tạo Phòng Thi Từng Nhóm</h4>
                    <p className="text-[11px] text-slate-400">
                      Tạo phòng thi riêng cho từng nhóm hoặc bấm &quot;Tạo Đồng Loạt&quot; cho tất cả nhóm A, B, C, D...
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">3</span>
                    <h4 className="font-bold text-slate-100 text-xs">Gửi Link / Mã PIN Cho Thí Sinh</h4>
                    <p className="text-[11px] text-slate-400">
                      Sao chép link trực tiếp phòng thi hoặc cung cấp mã khóa PIN để thí sinh đăng nhập trên điện thoại/máy tính.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 font-bold flex items-center justify-center text-xs">4</span>
                    <h4 className="font-bold text-slate-100 text-xs">Giám Sát Thi Thời Gian Thực</h4>
                    <p className="text-[11px] text-slate-400">
                      Theo dõi tiến độ làm bài, cảnh báo chống rời màn hình gian lận và thu bài tự động.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">5</span>
                    <h4 className="font-bold text-slate-100 text-xs">Xuất Biên Bản & Đề In A4</h4>
                    <p className="text-[11px] text-slate-400">
                      In Biên bản họp Hội đồng sát hạch EVN hoặc in đề giấy A4 kèm đáp án 4 mã đề hoán vị.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Tài Khoản Đăng Nhập Quản Trị Hệ Thống:</span>
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300">
                    Tên đăng nhập: <strong>admin</strong>
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-300">
                    Mật khẩu: <strong>admin</strong>
                  </span>
                  <span className="text-slate-400 font-sans text-[11px]">
                    (Có thể đổi mật khẩu bất kỳ lúc nào tại giao diện quản trị)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN TRỊ & GIÁM THỊ */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>1. Quản Lý Phòng Thi & Tạo Phòng Cho Từng Nhóm</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300 pl-4 list-disc">
                  <li>
                    <strong>Tạo phòng riêng lẻ</strong>: Bấm <em>&quot;Tạo Phòng Thi Mới&quot;</em>, chọn Nhóm thi (Trưởng ca, Điều hành viên, Công nhân điện, Công nhân cơ...), chọn Bậc thi (1 đến 8), đặt thời gian thi (phút) và mã PIN.
                  </li>
                  <li>
                    <strong>⚡ Tạo đồng loạt phòng thi cho từng nhóm</strong>: Bấm <em>&quot;⚡ Tạo Phòng Cho Từng Nhóm&quot;</em>. Hệ thống sẽ tự động khởi tạo đồng thời 4 phòng riêng biệt cho từng nhóm A, B, C, D với cấu hình chuẩn chỉ trong 1 lần nhấn.
                  </li>
                  <li>
                    <strong>Khóa / Mở phòng thi</strong>: Nhấp vào nút <em>&quot;ĐANG KHÓA&quot; / &quot;MỞ TỰ DO&quot;</em> trên thẻ phòng thi. Nếu khóa, thí sinh bắt buộc phải nhập mã PIN mới vào được bài thi.
                  </li>
                  <li>
                    <strong>Xóa phòng thi</strong>: Bấm <em>&quot;Xóa phòng&quot;</em> tại góc dưới thẻ phòng hoặc trong Modal Sửa ma trận. Hệ thống hiển thị hộp thoại xác nhận nội bộ rõ ràng, không bị trình duyệt chặn.
                  </li>
                  <li>
                    <strong>Xóa toàn bộ phòng</strong>: Bấm <em>&quot;Xóa Tất Cả Phòng&quot;</em> trên thanh công cụ để làm sạch danh sách phòng khi tổ chức đợt thi mới.
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>2. Bảng Giám Sát Trực Tiếp (Live Proctoring) & Chống Gian Lận</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Tại thẻ phòng thi, bấm <strong>&quot;🛡️ Giám sát&quot;</strong> để mở màn hình giám sát thí sinh trong phòng:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-amber-300 block mb-1">⚠️ Cảnh cáo vi phạm</span>
                    <p className="text-slate-400 text-[11px]">
                      Gửi thông báo cảnh cáo giám thị trực tiếp lên màn hình thí sinh khi phát hiện dấu hiệu bất thường.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-rose-400 block mb-1">⛔ Thu bài cưỡng chế</span>
                    <p className="text-slate-400 text-[11px]">
                      Dừng bài thi ngay lập tức đối với thí sinh cố tình gian lận hoặc vi phạm quy chế quá số lần cho phép.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-300 block mb-1">🔄 Cho phép thi lại</span>
                    <p className="text-slate-400 text-[11px]">
                      Xóa vi phạm và kích hoạt lại phiên làm bài trong trường hợp thí sinh gặp sự cố mạng hoặc thiết bị.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>3. Xuất Bản Đề Thi Giấy A4 & Phiếu Trả Lời Trắc Nghiệm</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bấm <strong>&quot;📄 Đề giấy&quot;</strong> tại phòng thi để xem trước và in trực tiếp bộ đề A4 phục vụ thi viết truyền thống:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
                  <li>Tự động sinh <strong>4 mã đề hoán vị ngẫu nhiên</strong> (VD: Mã 101, 102, 103, 104) từ ngân hàng câu hỏi của phòng.</li>
                  <li>Kèm theo <strong>Phiếu trả lời trắc nghiệm chuẩn tô tròn A, B, C, D</strong> theo mẫu Hội đồng chấm thi.</li>
                  <li>Kèm theo <strong>Bảng đáp án đúng đối chiếu</strong> cho cả 4 mã đề để giám thị chấm bài nhanh chóng.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: NẠP ĐỀ TỪ FILE WORD */}
          {activeTab === 'word_import' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                <h3 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Quy Chuẩn Đặt Tên File Word Đề Thi Để Tự Động Phân Kho</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Hệ thống hỗ trợ kéo thả cùng lúc hàng chục file Word (định dạng <code>.docx</code>). Tên file sẽ quyết định câu hỏi được nạp vào nhóm nào và bậc nào:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/80">
                      <th className="p-2.5">Quy ước tên file</th>
                      <th className="p-2.5">Nhóm thi</th>
                      <th className="p-2.5">Bậc thi</th>
                      <th className="p-2.5">Phân loại kho đề</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-cyan-300 font-bold">A5.1.docx, A5.2.docx</td>
                      <td className="p-2.5 font-sans">Nhóm A: Trưởng ca</td>
                      <td className="p-2.5 text-purple-300">Bậc 5</td>
                      <td className="p-2.5 font-sans text-slate-300">Chuyên môn nhóm A</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-cyan-300 font-bold">B4.1.docx, B4.2.docx</td>
                      <td className="p-2.5 font-sans">Nhóm B: Điều hành viên</td>
                      <td className="p-2.5 text-purple-300">Bậc 4</td>
                      <td className="p-2.5 font-sans text-slate-300">Chuyên môn nhóm B</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-cyan-300 font-bold">C3.1.docx, D4.1.docx</td>
                      <td className="p-2.5 font-sans">Nhóm C (Điện) / Nhóm D (Cơ)</td>
                      <td className="p-2.5 text-purple-300">Bậc 3 / Bậc 4</td>
                      <td className="p-2.5 font-sans text-slate-300">Chuyên môn công nhân</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-300 font-bold">ATTD5.1.docx, BTTD4.1.docx</td>
                      <td className="p-2.5 font-sans">Nhóm A (Trưởng ca) / Nhóm B</td>
                      <td className="p-2.5 text-purple-300">Bậc 5 / Bậc 4</td>
                      <td className="p-2.5 font-sans text-indigo-300 font-bold">Thị trường điện (TTD)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-emerald-300 font-bold">AT.docx, AT.1.docx</td>
                      <td className="p-2.5 font-sans">Chung tất cả nhóm</td>
                      <td className="p-2.5 text-slate-400">Dùng chung</td>
                      <td className="p-2.5 font-sans text-emerald-300">An toàn điện & BHLĐ</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-amber-300 font-bold">QT.docx, NQ.docx</td>
                      <td className="p-2.5 font-sans">Chung tất cả nhóm</td>
                      <td className="p-2.5 text-slate-400">Dùng chung</td>
                      <td className="p-2.5 font-sans text-amber-300">Quy trình (QT) / Nội quy (NQ)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Định Dạng Trình Bày Chuẩn Trong File Word (.docx):</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(`Câu 1: Khi phát hiện sự cố đe dọa trực tiếp đến tính mạng con người, người vận hành phải làm gì?
A. Báo cáo lãnh đạo xin ý kiến
B. Ngay lập tức cắt nguồn điện cô lập thiết bị sự cố
C. Chờ lệnh từ điều độ viên cấp trên
D. Ghi nhận vào sổ nhật ký vận hành
-> Đáp án đúng: B | Giải thích trích dẫn: Quy trình kỹ thuật an toàn điện - Điều 12`, 'sample_question')}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedText === 'sample_question' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'sample_question' ? 'Đã chép mẫu!' : 'Chép mẫu câu hỏi'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11.5px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`Câu 1: Khi phát hiện sự cố đe dọa trực tiếp đến tính mạng con người, người vận hành phải làm gì?
A. Báo cáo lãnh đạo xin ý kiến
B. Ngay lập tức cắt nguồn điện cô lập thiết bị sự cố
C. Chờ lệnh từ điều độ viên cấp trên
D. Ghi nhận vào sổ nhật ký vận hành
-> Đáp án đúng: B | Giải thích trích dẫn: Quy trình an toàn điện - Điều 12

(Hệ thống cũng hỗ trợ viết riêng dòng "Giải thích trích dẫn: ..." hoặc "Trích dẫn: ...")`}
                </pre>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                <p className="font-bold text-slate-200">💡 Mẹo thao tác nhanh trên kho đề:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                  <li>Dùng nút <strong>&quot;Xóa Câu Hỏi Mặc Định&quot;</strong> để dọn sạch toàn bộ các câu hỏi mẫu không phải do bạn tải lên.</li>
                  <li>Dùng nút <strong>&quot;Xóa Toàn Bộ&quot;</strong> để làm trống hoàn toàn kho đề trước khi nạp bộ đề chính thức mới.</li>
                  <li>Có thể chọn ô checkbox của nhiều câu hỏi và bấm <strong>&quot;Xóa các câu đã chọn&quot;</strong> để xóa hàng loạt.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: MA TRẬN ĐỀ & NHÓM TTD */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <h3 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Quy Tắc Sinh Đề Thi Ma Trận Tích Lũy Bậc Thang</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Đề thi sát hạch nâng bậc EVN không chỉ lấy câu hỏi ở bậc hiện tại mà bốc tích lũy từ bậc thấp nhất (Bậc 1) đến Bậc thi của thí sinh.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-cyan-300 text-xs">Phân Bổ Số Câu Chuẩn (Đề 50 Câu):</h4>
                  <ul className="space-y-1.5 text-slate-300 pl-4 list-disc text-[11.5px]">
                    <li><strong>An toàn (AT)</strong>: 10 câu (20%) - Dùng chung mọi bậc.</li>
                    <li><strong>Quy trình (QT)</strong>: 10 câu (20%) - Kỹ thuật vận hành.</li>
                    <li><strong>Nội quy (NQ)</strong>: 5 câu (10%) - Kỷ luật lao động.</li>
                    <li><strong>Chuyên môn (AX)</strong>: 20 câu (40%) - Bốc tích lũy Bậc 1 đến Bậc thi.</li>
                    <li><strong>Thị trường điện (TTD)</strong>: 5 câu (10%) - Đưa ra sau cùng.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-purple-300 text-xs">Phân Bổ Tích Lũy Bậc Thang (Ví dụ Bậc 5):</h4>
                  <ul className="space-y-1 text-slate-300 text-[11px] font-mono">
                    <li>• Bậc 1: 2 câu chuyên môn</li>
                    <li>• Bậc 2: 3 câu chuyên môn</li>
                    <li>• Bậc 3: 4 câu chuyên môn</li>
                    <li>• Bậc 4: 5 câu chuyên môn</li>
                    <li>• Bậc 5 (Trọng tâm): 6 câu chuyên môn</li>
                    <li className="text-cyan-400 font-sans font-bold pt-1">
                      ➔ Tổng cộng: 20 câu chuyên môn tích lũy
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/40 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Quy Tắc Đặc Biệt: Nhóm Câu Hỏi Thị Trường Điện (TTD) Luôn Ở Sau Cùng</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Theo yêu cầu của đơn vị, nhóm câu hỏi <strong>Thị trường điện (TTD)</strong> luôn được hệ thống tự động sắp xếp xuất hiện ở <strong>các câu hỏi cuối cùng của đề thi</strong> (ví dụ: từ câu 46 đến câu 50 trong đề 50 câu).
                </p>
                <p className="text-[11px] text-slate-400">
                  Điều này giúp thí sinh làm các phần An toàn, Quy trình và Chuyên môn kỹ thuật trước, sau đó hoàn tất phần Thị trường điện ở phần cuối bài thi.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DÀNH CHO THÍ SINH */}
          {activeTab === 'candidate' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Cách Thí Sinh Đăng Nhập & Vào Phòng Thi</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-cyan-300 text-xs">Cách 1: Nhập link trực tiếp phòng thi</span>
                    <p className="text-slate-400 text-[11px]">
                      Giám thị gửi link qua Zalo/Email. Thí sinh bấm vào link là hệ thống tự động chọn đúng phòng thi. Thí sinh chỉ cần nhập <strong>Họ và tên</strong> và <strong>Mã khóa PIN</strong> rồi bấm &quot;BẮT ĐẦU THI&quot;.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-purple-300 text-xs">Cách 2: Quét mã QR</span>
                    <p className="text-slate-400 text-[11px]">
                      Thí sinh dùng camera điện thoại quét mã QR do giám thị chiếu trên màn hình máy chiếu hoặc in tại cửa phòng thi để vào thi ngay trên smartphone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Quy Định Chống Gian Lận Rời Màn Hình Trong Khi Thi:</span>
                </h4>
                <ul className="space-y-1.5 text-slate-300 pl-4 list-disc text-[11.5px]">
                  <li>Không được chuyển tab trình duyệt, mở ứng dụng khác hoặc thu nhỏ màn hình trong suốt thời gian làm bài.</li>
                  <li>Mỗi lần rời khỏi màn hình thi, hệ thống sẽ <strong>ghi nhận 1 lần vi phạm</strong> và hiện cảnh báo màu đỏ.</li>
                  <li>Nếu vi phạm vượt quá số lần cho phép (mặc định 3 lần), bài thi sẽ bị đình chỉ và chuyển trạng thái <strong>&quot;VI PHẠM QUY CHẾ&quot;</strong>.</li>
                  <li>Thí sinh có thể đánh dấu câu hỏi cần xem lại bằng biểu tượng <strong>Bookmark 🔖</strong> để quay lại kiểm tra trước khi bấm nộp bài.</li>
                </ul>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>Xem Kết Quả & In Giấy Xác Nhận:</span>
                </h4>
                <p className="text-slate-300 text-[11.5px]">
                  Ngay sau khi bấm nộp bài, hệ thống chấm điểm tự động tức thì. Thí sinh xem được điểm số, xếp loại ĐẠT/KHÔNG ĐẠT, xem lại đáp án chi tiết và bấm <strong>&quot;In Giấy Xác Nhận Kết Quả&quot;</strong> để lưu hồ sơ.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: TIÊU ĐỀ & BIÊN BẢN */}
          {activeTab === 'protocol' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Tùy Chọn Nhập Ngoài Tiêu Đề Công Ty & Mẫu Biên Bản Hội Đồng</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hệ thống <strong>không cố định cứng</strong> tiêu đề hay tên đơn vị. Bạn hoàn toàn có thể nhập tùy ý theo đúng tên Tổng công ty, Công ty hoặc Nhà máy của mình tại Tab <strong>&quot;Tiêu Đề & Biên Bản&quot;</strong> trong Bảng quản trị.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-cyan-300 text-xs">Các Trường Thông Tin Tự Nhập:</h4>
                  <ul className="space-y-1.5 text-slate-300 pl-4 list-disc text-[11.5px]">
                    <li><strong>Tên cơ quan cấp trên</strong>: VD &quot;TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM&quot;, &quot;TỔNG CÔNG TY TRUYỀN TẢI ĐIỆN QUỐC GIA&quot;...</li>
                    <li><strong>Tên Công ty / Đơn vị tổ chức</strong>: VD &quot;CÔNG TY THỦY ĐIỆN SƠN LA&quot;, &quot;BAN QUẢN LÝ DỰ ÁN ĐIỆN 2&quot;...</li>
                    <li><strong>Số văn bản / Số biên bản</strong>: VD &quot;Số: 125/BB-HĐSH&quot;.</li>
                    <li><strong>Tiêu đề kỳ thi & Địa danh ngày tháng</strong>: Tự động điền theo ngày tổ chức thực tế.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-amber-300 text-xs">Thành Phần Hội Đồng Sát Hạch:</h4>
                  <ul className="space-y-1.5 text-slate-300 pl-4 list-disc text-[11.5px]">
                    <li><strong>Chủ tịch Hội đồng</strong>: Họ tên và chức vụ (Giám đốc / Phó Giám đốc).</li>
                    <li><strong>Thư ký Hội đồng</strong>: Trưởng phòng Tổ chức & Nhân sự / Chuyên viên.</li>
                    <li><strong>Các Ủy viên Hội đồng</strong>: Quản đốc phân xưởng, Kỹ sư an toàn, Giám thị...</li>
                    <li><strong>Nhận xét & Kết luận của Hội đồng</strong>: Tự nhập nhận xét chung về kỳ thi.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-purple-400" />
                  <span>Cách Xuất Biên Bản & Tải Về Máy:</span>
                </h4>
                <p className="text-slate-300 text-[11.5px]">
                  Tại giao diện quản trị, bấm vào nút <strong>&quot;📋 Biên Bản&quot;</strong> tại phòng thi. Bạn có thể:
                </p>
                <ul className="space-y-1 text-slate-400 text-[11px] pl-4 list-disc">
                  <li>Xem trước trực tiếp bản in A4 đã được định dạng chuẩn hành chính nhà nước.</li>
                  <li>Bấm <strong>&quot;Tải file Word (.doc)&quot;</strong> để lưu file về máy tính và chỉnh sửa thêm trên Microsoft Word.</li>
                  <li>Bấm <strong>&quot;In Biên Bản A4&quot;</strong> để in trực tiếp ra máy in hoặc xuất file PDF.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadWord}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95 border border-blue-400/40"
            >
              <Download className="w-4 h-4" />
              <span>📥 Tải Cẩm Nang File Word (.doc)</span>
            </button>
            <span className="text-slate-500 hidden md:inline">
              Bản quyền EVN SPMO • Định dạng chuẩn Nghị định 30/2020/NĐ-CP
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all ml-auto active:scale-95"
          >
            Đã Hiểu & Đóng Hướng Dẫn
          </button>
        </div>

      </div>
    </div>
  );
};
