import React, { useState, useMemo } from 'react';
import { 
  X, Printer, Trophy, CheckCircle2, AlertTriangle, ShieldCheck, Download, 
  Settings, Save, RotateCcw, FileText, Building2, UserCheck, Check, Edit3
} from 'lucide-react';
import { Candidate, ExamRoom, DepartmentInfo, OrganizationConfig } from '../types/exam';
import { 
  getSavedOrgConfig, saveOrgConfig, DEFAULT_ORG_CONFIG, exportProtocolToWordDoc 
} from '../utils/organizationStorage';

interface OfficialProtocolModalProps {
  room: ExamRoom;
  candidates: Candidate[];
  departments: DepartmentInfo[];
  onClose: () => void;
  initialOrgConfig?: OrganizationConfig;
  onUpdateOrgConfig?: (cfg: OrganizationConfig) => void;
}

export const OfficialProtocolModal: React.FC<OfficialProtocolModalProps> = ({
  room,
  candidates,
  departments,
  onClose,
  initialOrgConfig,
  onUpdateOrgConfig,
}) => {
  // Config state for Company Header and Protocol Details
  const [orgConfig, setOrgConfig] = useState<OrganizationConfig>(() => {
    return initialOrgConfig || getSavedOrgConfig();
  });

  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const deptName = useMemo(() => {
    return departments.find((d) => d.code === room.unit)?.name || `Bộ phận ${room.unit}`;
  }, [departments, room.unit]);

  const roomCandidates = useMemo(() => {
    return candidates.filter((c) => c.roomCode === room.roomCode);
  }, [candidates, room.roomCode]);

  const threshold = orgConfig.passScoreThreshold || 7.0;

  const stats = useMemo(() => {
    const total = roomCandidates.length;
    const submitted = roomCandidates.filter((c) => c.status === 'submitted');
    const passed = submitted.filter((c) => (c.score || 0) >= threshold);
    const failed = submitted.filter((c) => (c.score || 0) < threshold);

    return {
      total,
      submittedCount: submitted.length,
      passedCount: passed.length,
      failedCount: failed.length,
      passRate: submitted.length > 0 ? ((passed.length / submitted.length) * 100).toFixed(1) : '0',
    };
  }, [roomCandidates, threshold]);

  const handleSaveConfig = () => {
    saveOrgConfig(orgConfig);
    if (onUpdateOrgConfig) {
      onUpdateOrgConfig(orgConfig);
    }
    setSaveToast('Đã lưu cấu hình tiêu đề và biên bản thành công!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleResetDefaults = () => {
    setOrgConfig(DEFAULT_ORG_CONFIG);
    saveOrgConfig(DEFAULT_ORG_CONFIG);
    if (onUpdateOrgConfig) {
      onUpdateOrgConfig(DEFAULT_ORG_CONFIG);
    }
    setSaveToast('Đã khôi phục tiêu đề mẫu mặc định!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Quick Presets
  const applyPreset = (type: 'evn' | 'npt' | 'genco' | 'hydro') => {
    let updated: Partial<OrganizationConfig> = {};
    if (type === 'evn') {
      updated = {
        parentOrg: 'TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM',
        companyName: 'HỘI ĐỒNG THI SÁT HẠCH NÂNG BẬC NGHỀ KỸ THUẬT',
        subTitle: 'BAN TỔ CHỨC & COI THI SÁT HẠCH SPMO',
      };
    } else if (type === 'npt') {
      updated = {
        parentOrg: 'TỔNG CÔNG TY TRUYỀN TẢI ĐIỆN QUỐC GIA (EVNNPT)',
        companyName: 'HỘI ĐỒNG SÁT HẠCH GIỮ BẬC & NÂNG BẬC NGHỀ',
        subTitle: 'TRUYỀN TẢI ĐIỆN KHU VỰC',
      };
    } else if (type === 'genco') {
      updated = {
        parentOrg: 'TỔNG CÔNG TY PHÁT ĐIỆN (GENCO)',
        companyName: 'HỘI ĐỒNG KIỂM TRA SÁT HẠCH NGHỀ VẬN HÀNH & BẢO DƯỠNG',
        subTitle: 'BAN KỸ THUẬT VẬN HÀNH',
      };
    } else if (type === 'hydro') {
      updated = {
        parentOrg: 'CÔNG TY THỦY ĐIỆN / NHIỆT ĐIỆN',
        companyName: 'HỘI ĐỒNG SÁT HẠCH CHUYÊN MÔN KỸ THUẬT ĐỊNH KỲ',
        subTitle: 'PHÂN XƯỞNG VẬN HÀNH & SỬA CHỮA',
      };
    }
    const newCfg = { ...orgConfig, ...updated };
    setOrgConfig(newCfg);
    saveOrgConfig(newCfg);
    if (onUpdateOrgConfig) onUpdateOrgConfig(newCfg);
  };

  const handlePrint = () => {
    window.print();
  };

  // Xuất file Word .doc
  const handleExportWord = () => {
    const tableRowsHtml = roomCandidates.map((c, idx) => {
      const isSub = c.status === 'submitted';
      const score = c.score || 0;
      const pass = isSub && score >= threshold;
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${c.fullName}</b></td>
          <td class="text-center">${c.employeeCode || '-'}</td>
          <td class="text-center">Bậc ${c.level || room.level}</td>
          <td class="text-center">${c.examCode || '-'}</td>
          <td class="text-center font-bold">${isSub ? score.toFixed(1) : '-'}</td>
          <td class="text-center">${isSub ? `${((score / 10) * 100).toFixed(0)}%` : '-'}</td>
          <td class="text-center font-bold" style="color: ${pass ? '#059669' : '#dc2626'}">
            ${isSub ? (pass ? 'ĐẠT' : 'KHÔNG ĐẠT') : 'Chưa nộp'}
          </td>
          <td>${isSub ? (pass ? 'Đủ điều kiện nâng bậc' : 'Cần bồi huấn lại') : 'Vắng / Đang thi'}</td>
        </tr>
      `;
    }).join('');

    const wordContent = `
      <table class="header-table no-border" style="width: 100%;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <p class="uppercase font-bold" style="margin: 0; font-size: 11pt;">${orgConfig.parentOrg}</p>
            <p class="uppercase font-bold" style="margin: 3pt 0 0 0; font-size: 11pt;">${orgConfig.companyName}</p>
            <p class="italic" style="margin: 3pt 0 0 0; font-size: 10pt;">${orgConfig.documentNumber || 'Số: ..... /BB-HĐSH'}</p>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <p class="uppercase font-bold" style="margin: 0; font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p class="italic" style="margin: 3pt 0 0 0; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</p>
            <p style="margin: 3pt 0 0 0; font-size: 9pt;">---------------</p>
          </td>
        </tr>
      </table>

      <div style="text-align: right; font-style: italic; font-size: 11pt; margin-top: 10pt;">
        ${orgConfig.locationDate || `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`}
      </div>

      <div style="text-align: center; margin: 15pt 0;">
        <h1 class="uppercase font-bold" style="font-size: 15pt; margin: 0;">${orgConfig.protocolTitle}</h1>
        <p style="font-size: 12pt; margin: 5pt 0 0 0;">
          Bộ phận: <b>${deptName}</b> &bull; Bậc sát hạch: <b>BẬC ${room.level}</b>
        </p>
        <p style="font-size: 11pt; font-style: italic; margin: 3pt 0 0 0;">
          Phòng thi: <b>${room.roomCode}</b> (${room.roomName}) &bull; Thời gian: ${room.examTimeMinutes} phút
        </p>
      </div>

      <p style="font-size: 12pt;">
        Hôm nay, ngày ${new Date().toLocaleDateString('vi-VN')}, Hội đồng sát hạch nâng bậc nghề đã tiến hành giám sát, tổng hợp kết quả kiểm tra lý thuyết trắc nghiệm trực tuyến trên hệ thống:
      </p>

      <p style="font-size: 12pt; font-weight: bold; margin-top: 10pt;">1. Thành phần Hội đồng / Ban giám khảo:</p>
      <ul style="font-size: 12pt; margin-top: 5pt;">
        <li>Chủ tịch Hội đồng: <b>${orgConfig.councilPresident}</b></li>
        <li>Phó Chủ tịch Hội đồng: <b>${orgConfig.councilVicePresident}</b></li>
        <li>Thư ký Hội đồng: <b>${orgConfig.councilSecretary}</b></li>
        <li>Ủy viên chuyên môn / Kỹ sư an toàn: <b>${orgConfig.councilMember}</b></li>
        <li>Cán bộ giám thị coi thi: <b>${orgConfig.supervisor1}</b> - <b>${orgConfig.supervisor2}</b></li>
      </ul>

      <p style="font-size: 12pt; font-weight: bold; margin-top: 10pt;">2. Tiêu chuẩn xét công nhận đạt bậc nghề:</p>
      <p style="font-size: 12pt; font-style: italic; margin-left: 15pt;">
        - Điểm tổng thể: Đạt từ <b>${threshold.toFixed(1)} / 10 điểm</b> trở lên.<br />
        - Điều kiện an toàn điện (AT): Bắt buộc đạt từ <b>${orgConfig.safetyPassPercent}%</b> trở lên.
      </p>

      <p style="font-size: 12pt; font-weight: bold; margin-top: 10pt;">3. Bảng điểm chi tiết và kết luận sát hạch:</p>
      <table>
        <thead>
          <tr style="background-color: #f2f2f2; font-weight: bold;">
            <th style="width: 30pt;">STT</th>
            <th>Họ và tên thí sinh</th>
            <th style="width: 60pt;">Mã NV</th>
            <th style="width: 50pt;">Bậc thi</th>
            <th style="width: 50pt;">Mã đề</th>
            <th style="width: 50pt;">Điểm (10)</th>
            <th style="width: 50pt;">Tỷ lệ (%)</th>
            <th style="width: 65pt;">Kết luận</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <p style="font-size: 12pt; font-weight: bold; margin-top: 10pt;">4. Tổng kết đánh giá kết quả:</p>
      <p style="font-size: 12pt; margin-left: 15pt;">
        - Tổng số thí sinh triệu tập: <b>${stats.total}</b> người.<br />
        - Số thí sinh tham gia và nộp bài: <b>${stats.submittedCount}</b> người.<br />
        - Số thí sinh đạt tiêu chuẩn: <b>${stats.passedCount}</b> người (Tỷ lệ: <b>${stats.passRate}%</b>).<br />
        - Số thí sinh không đạt: <b>${stats.failedCount}</b> người.
      </p>

      <p style="font-size: 12pt; font-weight: bold; margin-top: 10pt;">5. Nhận xét & Kết luận của Hội đồng:</p>
      <p style="font-size: 12pt; font-style: italic; margin-left: 15pt;">
        ${orgConfig.customNotes}
      </p>

      <p style="font-size: 11pt; font-style: italic; margin-top: 15pt;">
        Biên bản được thông qua lúc ..... giờ ..... cùng ngày, các thành viên thống nhất 100% kết quả và ký tên xác nhận dưới đây.
      </p>

      <table class="no-border" style="width: 100%; margin-top: 25pt;">
        <tr>
          <td style="width: 33%; text-align: center; vertical-align: top;">
            <b>THƯ KÝ HỘI ĐỒNG</b><br>
            <i style="font-size: 10pt;">(Ký và ghi rõ họ tên)</i>
            <div style="height: 60pt;"></div>
            <b>${orgConfig.councilSecretary}</b>
          </td>
          <td style="width: 33%; text-align: center; vertical-align: top;">
            <b>ỦY VIÊN HỘI ĐỒNG</b><br>
            <i style="font-size: 10pt;">(Ký và ghi rõ họ tên)</i>
            <div style="height: 60pt;"></div>
            <b>${orgConfig.councilMember}</b>
          </td>
          <td style="width: 33%; text-align: center; vertical-align: top;">
            <b>CHỦ TỊCH HỘI ĐỒNG</b><br>
            <i style="font-size: 10pt;">(Ký, đóng dấu và ghi rõ họ tên)</i>
            <div style="height: 60pt;"></div>
            <b>${orgConfig.councilPresident}</b>
          </td>
        </tr>
      </table>
    `;

    exportProtocolToWordDoc(
      `Bien_Ban_Sat_Hach_${room.roomCode}_${room.unit}`,
      wordContent,
      `Biên bản sát hạch phòng ${room.roomCode}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header Toolbar - Not Printed */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/25">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>Biên Bản Hội Đồng Sát Hạch Nghề</span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {room.roomCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {deptName} &bull; Bậc {room.level} &bull; {stats.submittedCount}/{stats.total} thí sinh nộp bài &bull; Đạt {stats.passRate}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Config Editor Button */}
            <button
              onClick={() => setShowConfigEditor(!showConfigEditor)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                showConfigEditor
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border-slate-700'
              }`}
              title="Tùy chọn nhập ngoài tên Công ty, Tập đoàn, Tiêu đề biên bản, Hội đồng..."
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{showConfigEditor ? 'Ẩn Tùy Chỉnh' : 'Tùy Chỉnh Tiêu Đề & Công Ty'}</span>
            </button>

            {/* Export Word */}
            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition-all shadow-sm"
              title="Tải văn bản Word .doc có dấu và định dạng A4 chuẩn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Word (.doc)</span>
            </button>

            {/* Print A4 */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
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

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs font-semibold flex items-center justify-between animate-fadeIn print:hidden">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {saveToast}
            </span>
          </div>
        )}

        {/* Collapsible Config Editor Panel - Not Printed */}
        {showConfigEditor && (
          <div className="bg-slate-950/95 border-b border-slate-800 p-4 max-h-[38vh] overflow-y-auto space-y-4 text-xs print:hidden animate-scaleUp">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Tùy Chỉnh Tiêu Đề Công Ty & Thông Tin Biên Bản (Không Cố Định - Tự Nhập Mọi Trường)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Mẫu nhanh:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('evn')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Tập Đoàn EVN
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('npt')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Truyền Tải NPT
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('genco')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Phát Điện GENCO
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('hydro')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Thủy/Nhiệt Điện
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px]"
                  title="Khôi phục mặc định ban đầu"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Mặc định</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Cơ quan cấp trên / Tập đoàn / Tổng công ty:
                </label>
                <input
                  type="text"
                  value={orgConfig.parentOrg}
                  onChange={(e) => setOrgConfig({ ...orgConfig, parentOrg: e.target.value })}
                  placeholder="VD: TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Đơn vị tổ chức / Tên Công ty / Hội đồng thi:
                </label>
                <input
                  type="text"
                  value={orgConfig.companyName}
                  onChange={(e) => setOrgConfig({ ...orgConfig, companyName: e.target.value })}
                  placeholder="VD: HỘI ĐỒNG THI SÁT HẠCH NGHỀ SPMO"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Số biên bản / Ký hiệu văn bản:
                </label>
                <input
                  type="text"
                  value={orgConfig.documentNumber}
                  onChange={(e) => setOrgConfig({ ...orgConfig, documentNumber: e.target.value })}
                  placeholder="VD: Số: 12/BB-HĐSH-2026"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">
                  Tiêu đề biên bản (In hoa):
                </label>
                <input
                  type="text"
                  value={orgConfig.protocolTitle}
                  onChange={(e) => setOrgConfig({ ...orgConfig, protocolTitle: e.target.value })}
                  placeholder="VD: BIÊN BẢN TỔNG HỢP KẾT QUẢ SÁT HẠCH NÂNG BẬC NGHỀ KỸ THUẬT"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Địa danh, ngày tháng lập:
                </label>
                <input
                  type="text"
                  value={orgConfig.locationDate}
                  onChange={(e) => setOrgConfig({ ...orgConfig, locationDate: e.target.value })}
                  placeholder="VD: Hà Nội, ngày 15 tháng 10 năm 2026"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Chủ tịch Hội đồng:</label>
                <input
                  type="text"
                  value={orgConfig.councilPresident}
                  onChange={(e) => setOrgConfig({ ...orgConfig, councilPresident: e.target.value })}
                  placeholder="VD: Giám đốc / Trưởng ban tổ chức"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Phó Chủ tịch:</label>
                <input
                  type="text"
                  value={orgConfig.councilVicePresident}
                  onChange={(e) => setOrgConfig({ ...orgConfig, councilVicePresident: e.target.value })}
                  placeholder="VD: Trưởng phòng Kỹ thuật"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Thư ký Hội đồng:</label>
                <input
                  type="text"
                  value={orgConfig.councilSecretary}
                  onChange={(e) => setOrgConfig({ ...orgConfig, councilSecretary: e.target.value })}
                  placeholder="VD: Chuyên viên Nhân sự & Đào tạo"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ủy viên chuyên môn:</label>
                <input
                  type="text"
                  value={orgConfig.councilMember}
                  onChange={(e) => setOrgConfig({ ...orgConfig, councilMember: e.target.value })}
                  placeholder="VD: Kỹ sư Kỹ thuật an toàn chuyên trách"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Điểm chuẩn Đạt (/10):</label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="10"
                  value={orgConfig.passScoreThreshold}
                  onChange={(e) => setOrgConfig({ ...orgConfig, passScoreThreshold: Number(e.target.value) || 7.0 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Yêu cầu An toàn điện (%):</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={orgConfig.safetyPassPercent}
                  onChange={(e) => setOrgConfig({ ...orgConfig, safetyPassPercent: Number(e.target.value) || 80 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Cán bộ coi thi (Giám thị 1 - 2):</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={orgConfig.supervisor1}
                    onChange={(e) => setOrgConfig({ ...orgConfig, supervisor1: e.target.value })}
                    placeholder="Giám thị 1"
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-[11px] focus:border-amber-400 outline-none"
                  />
                  <input
                    type="text"
                    value={orgConfig.supervisor2}
                    onChange={(e) => setOrgConfig({ ...orgConfig, supervisor2: e.target.value })}
                    placeholder="Giám thị 2"
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-[11px] focus:border-amber-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Nhận xét & Kết luận của Hội đồng (hiển thị trong biên bản):
              </label>
              <textarea
                rows={2}
                value={orgConfig.customNotes}
                onChange={(e) => setOrgConfig({ ...orgConfig, customNotes: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-amber-400 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 active:scale-95 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Lại Làm Cấu Hình Mặc Định</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Protocol Paper Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-950/50 print:p-0 print:bg-white print:text-black">
          <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl print:shadow-none print:p-0 print:max-w-none text-xs font-serif leading-relaxed">
            
            {/* National & Organization Header */}
            <div className="flex justify-between items-start gap-4 pb-4 border-b-2 border-slate-900">
              <div className="text-center font-bold text-xs uppercase leading-snug w-[48%]">
                <p className="text-[11px] tracking-wide text-slate-800">{orgConfig.parentOrg}</p>
                <p className="font-extrabold text-xs sm:text-sm mt-0.5 text-slate-950">{orgConfig.companyName}</p>
                {orgConfig.subTitle && (
                  <p className="text-[10px] font-semibold text-slate-600 mt-0.5">{orgConfig.subTitle}</p>
                )}
                <p className="text-[11px] font-normal italic normal-case text-slate-700 mt-1">
                  {orgConfig.documentNumber || 'Số: ...... /BB-HĐSH'}
                </p>
              </div>

              <div className="text-center font-bold text-xs uppercase leading-snug w-[48%]">
                <p className="text-xs tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-normal italic normal-case text-[11px] mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-[10px] text-slate-500 mt-0.5">-------o0o-------</p>
              </div>
            </div>

            {/* Location & Date */}
            <div className="text-right italic text-[11px] text-slate-700 mt-3 mb-4">
              {orgConfig.locationDate || `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`}
            </div>

            {/* Protocol Title */}
            <div className="text-center my-6">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-950">
                {orgConfig.protocolTitle}
              </h1>
              <p className="text-xs font-semibold mt-1.5 font-sans">
                Kỳ sát hạch chuyên môn nghề &bull; Nhóm thi: <strong className="uppercase text-slate-950">{deptName}</strong>
              </p>
              <p className="text-[11px] text-slate-600 italic mt-0.5 font-sans">
                Phòng thi: <strong>{room.roomCode}</strong> ({room.roomName}) &bull; Bậc sát hạch: <strong>BẬC {room.level}</strong> &bull; Thời gian: {room.examTimeMinutes} phút
              </p>
            </div>

            {/* Meeting Information */}
            <div className="space-y-2 mb-5 text-xs font-sans">
              <p>
                Hôm nay, ngày {new Date().toLocaleDateString('vi-VN')}, Hội đồng sát hạch nâng bậc nghề đã tiến hành họp và tổng hợp toàn bộ kết quả kiểm tra sát hạch lý thuyết trắc nghiệm trực tuyến của các thí sinh thuộc đối tượng <strong>{deptName} (Bậc {room.level})</strong>.
              </p>

              <div>
                <p className="font-bold text-slate-900">1. Thành phần Hội đồng / Ban giám khảo:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-800 mt-1">
                  <li>Chủ tịch Hội đồng: <strong>{orgConfig.councilPresident}</strong></li>
                  <li>Phó Chủ tịch Hội đồng: <strong>{orgConfig.councilVicePresident}</strong></li>
                  <li>Thư ký Hội đồng: <strong>{orgConfig.councilSecretary}</strong></li>
                  <li>Ủy viên Hội đồng / Chuyên môn: <strong>{orgConfig.councilMember}</strong></li>
                  <li>Cán bộ giám thị coi thi: <strong>{orgConfig.supervisor1}</strong> - <strong>{orgConfig.supervisor2}</strong></li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-slate-900 mt-2">2. Tiêu chuẩn xét công nhận đạt:</p>
                <p className="italic pl-3 text-slate-700">
                  - Điểm thi lý thuyết trắc nghiệm tổng thể: Đạt từ <strong>{threshold.toFixed(1)} / 10 điểm</strong> (&ge; {((threshold / 10) * 100).toFixed(0)}%) trở lên.<br />
                  - Tiêu chuẩn Kỹ thuật an toàn điện (AT): Bắt buộc đạt từ <strong>{orgConfig.safetyPassPercent}%</strong> trở lên.
                </p>
              </div>
            </div>

            {/* Results Table */}
            <div className="mb-6 font-sans">
              <p className="font-bold text-xs uppercase mb-2 text-slate-900">3. Bảng điểm chi tiết và kết luận sát hạch:</p>
              
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-center border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
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
                          Chưa có thí sinh nào đăng ký tham gia phòng thi này.
                        </td>
                      </tr>
                    ) : (
                      roomCandidates.map((c, idx) => {
                        const isSubmitted = c.status === 'submitted';
                        const score = c.score || 0;
                        const isPassed = isSubmitted && score >= threshold;

                        return (
                          <tr key={c.id || idx} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-2 font-mono border-r border-slate-300">{idx + 1}</td>
                            <td className="p-2 text-left font-bold border-r border-slate-300 text-slate-950">{c.fullName}</td>
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
                                <span className={isPassed ? 'text-emerald-700 font-black' : 'text-rose-700 font-bold'}>
                                  {isPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Chưa nộp bài</span>
                              )}
                            </td>
                            <td className="p-2 text-left text-slate-600 text-[10px]">
                              {isSubmitted 
                                ? (isPassed ? 'Đủ điều kiện công nhận bậc' : 'Cần bồi huấn lại lý thuyết')
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
            <div className="mb-5 p-3.5 bg-slate-50 border border-slate-300 rounded text-xs space-y-1 font-sans">
              <p className="font-bold text-slate-900">4. Tổng kết đánh giá kết quả:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-semibold text-slate-800">
                <div>&bull; Tổng thí sinh: <strong>{stats.total}</strong> người</div>
                <div>&bull; Đã hoàn thành: <strong>{stats.submittedCount}</strong> người</div>
                <div>&bull; Đạt tiêu chuẩn: <strong className="text-emerald-700">{stats.passedCount}</strong> người ({stats.passRate}%)</div>
                <div>&bull; Không đạt: <strong className="text-rose-700">{stats.failedCount}</strong> người</div>
              </div>
            </div>

            {/* Council Remarks */}
            <div className="mb-5 text-xs font-sans">
              <p className="font-bold text-slate-900">5. Nhận xét & Kết luận chung của Hội đồng:</p>
              <p className="italic pl-3 text-slate-700 mt-1 leading-relaxed">
                {orgConfig.customNotes}
              </p>
            </div>

            {/* Conclusion Statement */}
            <p className="mb-8 text-xs italic text-slate-600 font-sans">
              Biên bản được lập xong vào lúc ..... giờ ..... cùng ngày, đã được các thành viên trong Hội đồng thông qua và nhất trí 100%. Biên bản được lập thành 03 bản có giá trị như nhau để lưu hồ sơ cán bộ và báo cáo Lãnh đạo cấp trên.
            </p>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 text-center font-bold text-xs pt-4 border-t border-slate-300 font-sans">
              <div>
                <p className="uppercase text-slate-900">THƯ KÝ HỘI ĐỒNG</p>
                <p className="text-[10px] font-normal italic text-slate-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-16"></div>
                <p className="text-slate-900 font-bold">{orgConfig.councilSecretary}</p>
              </div>

              <div>
                <p className="uppercase text-slate-900">ỦY VIÊN HỘI ĐỒNG</p>
                <p className="text-[10px] font-normal italic text-slate-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-16"></div>
                <p className="text-slate-900 font-bold">{orgConfig.councilMember}</p>
              </div>

              <div>
                <p className="uppercase text-slate-900">CHỦ TỊCH HỘI ĐỒNG</p>
                <p className="text-[10px] font-normal italic text-slate-500 mt-0.5">(Ký, đóng dấu và ghi rõ họ tên)</p>
                <div className="h-16"></div>
                <p className="text-slate-900 font-bold">{orgConfig.councilPresident}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
