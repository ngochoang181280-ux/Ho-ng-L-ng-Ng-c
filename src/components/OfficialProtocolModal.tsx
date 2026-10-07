import React, { useMemo } from 'react';
import { X, Printer, Trophy, CheckCircle2, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { Candidate, ExamRoom, DepartmentInfo } from '../types/exam';

interface OfficialProtocolModalProps {
  room: ExamRoom;
  candidates: Candidate[];
  departments: DepartmentInfo[];
  onClose: () => void;
}

export const OfficialProtocolModal: React.FC<OfficialProtocolModalProps> = ({
  room,
  candidates,
  departments,
  onClose,
}) => {
  const deptName = useMemo(() => {
    return departments.find((d) => d.code === room.unit)?.name || `Bộ phận ${room.unit}`;
  }, [departments, room.unit]);

  const roomCandidates = useMemo(() => {
    return candidates.filter((c) => c.roomCode === room.roomCode);
  }, [candidates, room.roomCode]);

  const stats = useMemo(() => {
    const total = roomCandidates.length;
    const submitted = roomCandidates.filter((c) => c.status === 'submitted');
    const passed = submitted.filter((c) => (c.score || 0) >= 7.0);
    const failed = submitted.filter((c) => (c.score || 0) < 7.0);

    return {
      total,
      submittedCount: submitted.length,
      passedCount: passed.length,
      failedCount: failed.length,
      passRate: submitted.length > 0 ? ((passed.length / submitted.length) * 100).toFixed(1) : '0',
    };
  }, [roomCandidates]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header - Not Printed */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                <span>Biên Bản Họp Hội Đồng Sát Hạch Nâng Bậc Nghề</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {room.roomCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {deptName} • Bậc {room.level} • {stats.submittedCount}/{stats.total} thí sinh đã hoàn thành
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>In Biên Bản (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Protocol Paper Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/40 print:p-0 print:bg-white print:text-black">
          <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 print:max-w-none text-xs font-sans leading-relaxed">
            
            {/* National Header */}
            <div className="flex justify-between items-start gap-4 pb-4 border-b-2 border-slate-900">
              <div className="text-center font-bold text-xs uppercase leading-tight">
                <p>TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM</p>
                <p className="font-extrabold text-sm mt-0.5">HỘI ĐỒNG THI NÂNG BẬC NGHỀ SPMO</p>
                <p className="text-[11px] font-normal italic mt-0.5">Số: ...... /BB-HĐSH</p>
              </div>

              <div className="text-center font-bold text-xs uppercase leading-tight">
                <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-normal italic normal-case text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-[10px] text-slate-500 mt-1">-------o0o-------</p>
              </div>
            </div>

            {/* Protocol Title */}
            <div className="text-center my-6">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wide">
                BIÊN BẢN TỔNG HỢP KẾT QUẢ SÁT HẠCH NÂNG BẬC NGHỀ KỸ THUẬT
              </h1>
              <p className="text-xs font-semibold mt-1">
                Kỳ sát hạch định kỳ năm 2026 • Bộ phận: <strong className="uppercase">{deptName}</strong>
              </p>
              <p className="text-[11px] text-slate-600 italic">
                Phòng thi: <strong>{room.roomCode}</strong> ({room.roomName}) • Bậc sát hạch: <strong>BẬC {room.level}</strong>
              </p>
            </div>

            {/* Meeting Information */}
            <div className="space-y-1.5 mb-6 text-xs">
              <p>Hôm nay, ngày {new Date().toLocaleDateString('vi-VN')}, Hội đồng sát hạch nâng bậc nghề kỹ thuật đã tiến hành họp và tổng hợp kết quả kiểm tra sát hạch lý thuyết trắc nghiệm trực tuyến.</p>
              <p><strong>1. Thành phần Hội đồng gồm có:</strong></p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Ông/Bà: .................................................... - Chức vụ: Giám đốc / Phó Giám đốc - Chủ tịch Hội đồng</li>
                <li>Ông/Bà: .................................................... - Chức vụ: Trưởng phòng Kỹ thuật - Phó Chủ tịch Hội đồng</li>
                <li>Ông/Bà: .................................................... - Chức vụ: Kỹ sư an toàn chuyên trách - Ủy viên</li>
                <li>Ông/Bà: .................................................... - Chức vụ: Chuyên viên Nhân sự & Đào tạo - Thư ký Hội đồng</li>
              </ul>
              <p className="mt-2"><strong>2. Tiêu chuẩn xét đạt:</strong></p>
              <p className="italic pl-3 text-slate-700">
                - Điểm thi tổng thể: Đạt từ <strong>7.0 / 10 điểm</strong> (&ge; 70%) trở lên.<br />
                - Điều kiện an toàn điện: Điểm bài thi phần Kỹ thuật an toàn (AT) bắt buộc đạt từ <strong>80%</strong> trở lên.
              </p>
            </div>

            {/* Results Table */}
            <div className="mb-6">
              <p className="font-bold text-xs uppercase mb-2">3. Bảng điểm chi tiết và kết luận sát hạch:</p>
              
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-center border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 w-8">STT</th>
                      <th className="p-2 border-r border-slate-300 text-left">Họ và tên thí sinh</th>
                      <th className="p-2 border-r border-slate-300">Mã NV</th>
                      <th className="p-2 border-r border-slate-300">Bậc thi</th>
                      <th className="p-2 border-r border-slate-300">Mã đề</th>
                      <th className="p-2 border-r border-slate-300">Điểm (10)</th>
                      <th className="p-2 border-r border-slate-300">Tỷ lệ (%)</th>
                      <th className="p-2 border-r border-slate-300">Kết luận</th>
                      <th className="p-2 text-left">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-slate-500 italic">
                          Chưa có thí sinh nào đăng ký vào phòng thi này.
                        </td>
                      </tr>
                    ) : (
                      roomCandidates.map((c, idx) => {
                        const isSubmitted = c.status === 'submitted';
                        const score = c.score || 0;
                        const isPassed = isSubmitted && score >= 7.0;

                        return (
                          <tr key={c.id || idx} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-2 font-mono border-r border-slate-300">{idx + 1}</td>
                            <td className="p-2 text-left font-bold border-r border-slate-300">{c.fullName}</td>
                            <td className="p-2 font-mono border-r border-slate-300">{c.employeeCode || '-'}</td>
                            <td className="p-2 font-mono font-bold border-r border-slate-300">Bậc {c.level || room.level}</td>
                            <td className="p-2 font-mono border-r border-slate-300">{c.examCode || '-'}</td>
                            <td className="p-2 font-bold font-mono border-r border-slate-300 text-slate-900">
                              {isSubmitted ? score.toFixed(1) : '-'}
                            </td>
                            <td className="p-2 font-mono border-r border-slate-300">
                              {isSubmitted ? `${((score / 10) * 100).toFixed(0)}%` : '-'}
                            </td>
                            <td className="p-2 font-bold border-r border-slate-300">
                              {isSubmitted ? (
                                <span className={isPassed ? 'text-emerald-700 font-black' : 'text-rose-700'}>
                                  {isPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Chưa nộp bài</span>
                              )}
                            </td>
                            <td className="p-2 text-left text-slate-600 text-[10px]">
                              {isSubmitted 
                                ? (isPassed ? 'Đủ điều kiện nâng bậc' : 'Cần bồi huấn lại lý thuyết')
                                : 'Vắng / Đang làm bài'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statistics Summary */}
            <div className="mb-6 p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-1">
              <p><strong>4. Tổng kết đánh giá:</strong></p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-semibold">
                <div>- Tổng thí sinh: <strong>{stats.total}</strong> người</div>
                <div>- Đã hoàn thành: <strong>{stats.submittedCount}</strong> người</div>
                <div>- Đạt tiêu chuẩn: <strong className="text-emerald-700">{stats.passedCount}</strong> người ({stats.passRate}%)</div>
                <div>- Không đạt: <strong className="text-rose-700">{stats.failedCount}</strong> người</div>
              </div>
            </div>

            {/* Conclusion Statement */}
            <p className="mb-8 text-xs italic">
              Biên bản được lập xong vào lúc ..... giờ ..... cùng ngày, đã được các thành viên trong Hội đồng thông qua và nhất trí 100%. Biên bản được lập thành 03 bản có giá trị như nhau để lưu hồ sơ cán bộ và báo cáo Lãnh đạo cấp trên.
            </p>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 text-center font-bold text-xs pt-4 border-t border-slate-300">
              <div>
                <p>THƯ KÝ HỘI ĐỒNG</p>
                <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                <div className="h-16"></div>
              </div>

              <div>
                <p>ỦY VIÊN HỘI ĐỒNG</p>
                <p className="text-[10px] font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                <div className="h-16"></div>
              </div>

              <div>
                <p>CHỦ TỊCH HỘI ĐỒNG</p>
                <p className="text-[10px] font-normal italic mt-1">(Ký, đóng dấu và ghi rõ họ tên)</p>
                <div className="h-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
