import { OrganizationConfig } from '../types/exam';

export const DEFAULT_ORG_CONFIG: OrganizationConfig = {
  parentOrg: 'TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM',
  companyName: 'HỘI ĐỒNG SÁT HẠCH NÂNG BẬC NGHỀ KỸ THUẬT',
  subTitle: 'BAN TỔ CHỨC & COI THI SÁT HẠCH SPMO',
  documentNumber: 'Số: ...... /BB-HĐSH',
  protocolTitle: 'BIÊN BẢN TỔNG HỢP KẾT QUẢ SÁT HẠCH NÂNG BẬC NGHỀ KỸ THUẬT',
  examTitle: 'ĐỀ THI SÁT HẠCH NÂNG BẬC NGHỀ KỸ THUẬT',
  locationDate: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
  councilPresident: 'Giám đốc / Trưởng ban tổ chức',
  councilVicePresident: 'Phó Giám đốc / Trưởng phòng Kỹ thuật',
  councilSecretary: 'Chuyên viên Nhân sự & Đào tạo',
  councilMember: 'Kỹ sư Kỹ thuật an toàn chuyên trách',
  supervisor1: 'Cán bộ giám thị coi thi 1',
  supervisor2: 'Cán bộ giám thị coi thi 2',
  passScoreThreshold: 7.0,
  safetyPassPercent: 80,
  customNotes: 'Kỳ sát hạch diễn ra nghiêm túc, khách quan, đúng quy chế quản trị nội bộ. Toàn bộ thí sinh tuân thủ nội quy phòng thi và thực hiện nghiêm túc quy định an toàn.',
};

const STORAGE_KEY = 'spmo_org_config_v1';

export function getSavedOrgConfig(): OrganizationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ORG_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse saved organization config', e);
  }
  return DEFAULT_ORG_CONFIG;
}

export function saveOrgConfig(config: OrganizationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save organization config', e);
  }
}

/**
 * Xuất file Word (.doc) cho Biên bản nghiệm thu kỳ thi sát hạch
 */
export function exportProtocolToWordDoc(
  filename: string,
  contentHtml: string,
  title: string = 'Biên bản sát hạch'
): void {
  const fullDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 15mm 20mm 20mm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10pt 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 5pt 7pt;
          font-size: 11pt;
        }
        .no-border td, .no-border th {
          border: none;
          padding: 3pt;
        }
        .header-table td {
          border: none;
          text-align: center;
          vertical-align: top;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .italic { font-style: italic; }
        .uppercase { text-transform: uppercase; }
        h1, h2, h3 { text-align: center; margin: 8pt 0; }
        h1 { font-size: 15pt; }
        h2 { font-size: 13pt; }
      </style>
    </head>
    <body>
      ${contentHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + fullDocumentHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
