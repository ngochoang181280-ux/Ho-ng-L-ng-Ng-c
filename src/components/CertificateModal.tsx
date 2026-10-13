import React from 'react';
import { X, Printer, Award, ShieldCheck, CheckCircle2, Download, Building2 } from 'lucide-react';
import { ExamAttempt, OrganizationConfig } from '../types/exam';

interface CertificateModalProps {
  attempt: ExamAttempt;
  orgConfig: OrganizationConfig;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  attempt,
  orgConfig,
  onClose,
}) => {
  const certNumber = `EVN-SH-${attempt.roomCode || 'ROOM'}-${(attempt.candidateName || 'TS').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const issueDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-4xl overflow-hidden my-auto text-slate-900 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Modal Toolbar - Hidden in Print */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Giấy Chứng Nhận Hoàn Thành Sát Hạch
              </h3>
              <p className="text-xs text-slate-400">
                Chứng nhận chính thức của Hội đồng Sát hạch Chuyên môn & An toàn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066b2] hover:bg-[#005291] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>In Giấy Chứng Nhận</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Styled for Luxury Paper Certificate) */}
        <div className="p-6 sm:p-10 bg-[#faf8f5] relative print:p-8 print:bg-white">
          {/* Certificate Border Frame */}
          <div className="border-4 border-double border-amber-700/60 p-6 sm:p-8 rounded-2xl relative bg-white shadow-inner">
            
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-800 pointer-events-none"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-800 pointer-events-none"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-800 pointer-events-none"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-800 pointer-events-none"></div>

            {/* Header: Organization & National Motto */}
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-amber-200/80 text-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {orgConfig.parentOrg || 'TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM'}
                </p>
                <p className="text-xs sm:text-sm font-extrabold uppercase text-[#0066b2] mt-0.5">
                  {orgConfig.companyName || 'HỘI ĐỒNG SÁT HẠCH NGHỀ ĐỊNH KỲ'}
                </p>
                <div className="w-16 h-0.5 bg-[#0066b2] mx-auto mt-1.5"></div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-[11px] sm:text-xs font-medium text-slate-600 italic">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="w-20 h-0.5 bg-amber-700 mx-auto mt-1.5"></div>
              </div>
            </div>

            {/* Main Title */}
            <div className="text-center my-6">
              <div className="inline-flex items-center justify-center gap-2 mb-2">
                <Award className="w-7 h-7 text-amber-600 print:text-amber-800" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-widest text-[#0066b2] uppercase drop-shadow-xs">
                GIẤY CHỨNG NHẬN
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-900 mt-1">
                KẾT QUẢ SÁT HẠCH KỸ THUẬT & AN TOÀN ĐIỆN
              </p>
            </div>

            {/* Candidate Details */}
            <div className="max-w-2xl mx-auto text-center space-y-4 my-6">
              <p className="text-sm text-slate-600 italic">
                Hội đồng Sát hạch trân trọng chứng nhận:
              </p>

              <div className="border-b-2 border-dashed border-amber-400 pb-2 inline-block px-8">
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-wide">
                  {attempt.candidateName}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700 pt-2 text-left sm:text-center">
                <p>
                  Đơn vị công tác: <strong className="text-slate-900">{attempt.unitName || `Nhóm ${attempt.unit}`}</strong>
                </p>
                <p>
                  Bậc thợ sát hạch: <strong className="text-slate-900">Bậc {attempt.level}</strong>
                </p>
                <p>
                  Phòng thi: <strong className="text-slate-900">{attempt.roomCode}</strong>
                </p>
                <p>
                  Mã đề thi: <strong className="text-slate-900">{attempt.examCode}</strong>
                </p>
              </div>

              {/* Score & Result Box */}
              <div className="my-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-around text-center max-w-lg mx-auto">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Điểm Sát Hạch</p>
                  <p className="text-2xl sm:text-3xl font-black text-[#0066b2]">
                    {(attempt.score || 0).toFixed(1)}/10
                  </p>
                </div>
                <div className="h-10 w-px bg-amber-200"></div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Số Câu Đúng</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">
                    {attempt.correct}/{attempt.total}
                  </p>
                </div>
                <div className="h-10 w-px bg-amber-200"></div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Xếp Loại</p>
                  <span className="inline-flex items-center gap-1 text-base sm:text-lg font-black text-emerald-700 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ĐẠT CHUẨN
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic px-4 leading-relaxed">
                Đã đạt tiêu chuẩn sát hạch theo Quy định của Tập đoàn Điện lực Việt Nam và Quy trình An toàn điện hiện hành.
              </p>
            </div>

            {/* Signatures & Seal Section */}
            <div className="pt-8 border-t border-amber-200 flex items-end justify-between text-center px-4 sm:px-8 text-xs sm:text-sm">
              <div className="w-48">
                <p className="font-bold text-slate-700 uppercase">Thư Ký Hội Đồng</p>
                <p className="text-[11px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="font-serif italic text-slate-600">{orgConfig.councilSecretary || 'Vũ Thị Minh'}</span>
                </div>
                <p className="font-bold text-slate-800">{orgConfig.councilSecretary || 'Vũ Thị Minh'}</p>
              </div>

              <div className="hidden sm:flex flex-col items-center">
                {/* Simulated Red Stamp */}
                <div className="w-20 h-20 rounded-full border-2 border-rose-600/70 text-rose-700 flex flex-col items-center justify-center text-[9px] font-bold p-1 text-center rotate-[-12deg] shadow-xs">
                  <span>HỘI ĐỒNG</span>
                  <span className="text-[8px] font-black uppercase">SÁT HẠCH NGHỀ</span>
                  <span className="text-[7px]">★ EVN ★</span>
                </div>
              </div>

              <div className="w-56">
                <p className="text-[11px] text-slate-500 italic">
                  {orgConfig.locationDate || `Ngày ${issueDate}`}
                </p>
                <p className="font-bold text-slate-800 uppercase mt-0.5">Chủ Tịch Hội Đồng</p>
                <p className="text-[11px] text-slate-500 italic mt-0.5">(Ký tên và đóng dấu)</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="font-serif italic text-slate-700 font-bold text-base">
                    {orgConfig.councilPresident || 'Nguyễn Văn An'}
                  </span>
                </div>
                <p className="font-bold text-slate-900">{orgConfig.councilPresident || 'Nguyễn Văn An'}</p>
              </div>
            </div>

            {/* Certificate Footer Identifier */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <span>Số hiệu: <strong className="font-mono text-slate-700">{certNumber}</strong></span>
              <span>Hệ thống SPMO Pro • Bản cấp điện tử chính thức</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
