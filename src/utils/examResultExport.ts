import { ExamAttempt, OrganizationConfig } from '../types/exam';
import { getSavedOrgConfig } from './organizationStorage';
import { isTtdQuestion } from './questionMeta';
import { getQuestionGroupKey } from '../data/mockData';

/**
 * Tạo nội dung HTML tương thích hoàn hảo với Microsoft Word (.doc)
 * Chứa đầy đủ:
 * 1. Quốc hiệu tiêu ngữ, thông tin Đơn vị và Hội đồng sát hạch
 * 2. Thông tin thí sinh, điểm số, kết quả xếp loại
 * 3. Bảng tổng hợp đối chiếu nhanh đáp án
 * 4. Chi tiết từng câu hỏi: Lựa chọn của thí sinh, Đáp án đúng của đề thi, Kết quả Đúng/Sai
 * 5. PHẦN TRÍCH DẪN ĐÁP ÁN TRONG ĐỀ THI (Căn cứ quy chuẩn kỹ thuật)
 * 6. Chữ ký xác nhận của Thí sinh, Giám thị, Thư ký và Chủ tịch Hội đồng
 */
export function generateExamResultWordDocHtml(
  attempt: ExamAttempt,
  customOrgConfig?: OrganizationConfig
): string {
  const orgConfig = customOrgConfig || getSavedOrgConfig();

  // Tính toán group stats nếu chưa có
  const stats: Record<string, { total: number; correct: number; percent: number }> = {
    at: { total: 0, correct: 0, percent: 0 },
    qt: { total: 0, correct: 0, percent: 0 },
    nq: { total: 0, correct: 0, percent: 0 },
    ttd: { total: 0, correct: 0, percent: 0 },
    ax: { total: 0, correct: 0, percent: 0 },
  };

  attempt.questions.forEach((q, idx) => {
    let grpKey = 'ax';
    if (isTtdQuestion(q)) {
      grpKey = 'ttd';
    } else {
      grpKey = getQuestionGroupKey(q);
    }
    if (!stats[grpKey]) stats[grpKey] = { total: 0, correct: 0, percent: 0 };
    stats[grpKey].total++;
    if (attempt.answers[idx] === q.correct) {
      stats[grpKey].correct++;
    }
  });

  Object.keys(stats).forEach((k) => {
    const g = stats[k];
    g.percent = g.total > 0 ? Number(((g.correct / g.total) * 100).toFixed(1)) : 100;
  });

  const atStat = stats.at || { total: 0, correct: 0, percent: 100 };
  const safetyPassed = atStat.total === 0 || atStat.percent >= 80;
  const isPassed = attempt.percent >= 70 && safetyPassed;

  const now = new Date();
  const dateFormatted = `${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  const timeFormatted = now.toLocaleString('vi-VN');

  // Render từng câu hỏi chi tiết
  const questionsDetailHtml = attempt.questions
    .map((q, idx) => {
      const userChoice = attempt.answers[idx] || '';
      const isCorrect = userChoice === q.correct;

      const rawCit = (q.citation || '').trim();
      const rawExp = (q.explanation || '').trim();
      const isGeneric =
        rawCit.includes('Quy chuẩn Kỹ thuật Nghề nghiệp & Tiêu chuẩn Vận hành SPMO') ||
        rawCit === 'Quy chuẩn ngành điện' ||
        rawCit.includes('Căn cứ Quy chuẩn kỹ thuật an toàn điện & Quy trình vận hành SPMO');
      const validCit = isGeneric ? '' : rawCit;
      const combinedExplain = [validCit, rawExp]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(' - ') || '(Chưa có phần giải thích trích dẫn trong đề thi)';

      const optionsHtml = Object.entries(q.options || {})
        .map(([key, optText]) => {
          const isRight = q.correct.includes(key);
          const isUser = userChoice.includes(key);

          let style = 'padding: 4pt 8pt; margin: 2pt 0; font-size: 11pt;';
          let mark = '';

          if (isRight && isUser) {
            style += ' background-color: #dcfce7; border-left: 3pt solid #16a34a; font-weight: bold; color: #166534;';
            mark = ' <span style="color: #16a34a; font-weight: bold;">[ĐÁP ÁN ĐÚNG &amp; THÍ SINH ĐÃ CHỌN]</span>';
          } else if (isRight) {
            style += ' background-color: #f0fdf4; border-left: 3pt solid #22c55e; font-weight: bold; color: #15803d;';
            mark = ' <span style="color: #15803d; font-weight: bold;">[ĐÁP ÁN ĐÚNG CỦA ĐỀ]</span>';
          } else if (isUser) {
            style += ' background-color: #fee2e2; border-left: 3pt solid #ef4444; color: #991b1b;';
            mark = ' <span style="color: #b91c1c; font-weight: bold;">[THÍ SINH ĐÃ CHỌN - SAI]</span>';
          } else {
            style += ' color: #1e293b;';
          }

          return `<div style="${style}"><strong>${key}.</strong> ${optText}${mark}</div>`;
        })
        .join('');

      return `
      <div style="margin-bottom: 14pt; padding: 10pt; border: 1pt solid #cbd5e1; background-color: #ffffff; page-break-inside: avoid;">
        <div style="margin-bottom: 6pt;">
          <strong style="font-size: 11.5pt; color: #0f172a;">
            Câu ${idx + 1} (${q.section || 'Chuyên môn'} - Bậc ${q.level || attempt.level}):
          </strong>
          <span style="font-size: 11.5pt; color: #1e293b; line-height: 1.4;">
            ${q.question}
          </span>
        </div>

        <!-- Danh sách các phương án lựa chọn -->
        <div style="margin-left: 10pt; margin-bottom: 8pt;">
          ${optionsHtml}
        </div>

        <!-- Bảng đối chiếu đáp án câu hỏi -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6pt; font-size: 10.5pt;">
          <tr style="background-color: #f1f5f9;">
            <td style="border: 1pt solid #94a3b8; padding: 4pt 8pt; width: 33%;">
              Đáp án thí sinh chọn: 
              <strong style="color: ${isCorrect ? '#166534' : userChoice ? '#991b1b' : '#64748b'}; font-size: 11.5pt;">
                ${userChoice || 'Chưa trả lời'}
              </strong>
            </td>
            <td style="border: 1pt solid #94a3b8; padding: 4pt 8pt; width: 33%;">
              Đáp án đúng của đề: 
              <strong style="color: #166534; font-size: 11.5pt;">
                ${q.correct}
              </strong>
            </td>
            <td style="border: 1pt solid #94a3b8; padding: 4pt 8pt; width: 34%; font-weight: bold; color: ${isCorrect ? '#166534' : userChoice ? '#991b1b' : '#d97706'};">
              Kết quả: ${isCorrect ? '✓ ĐÚNG (+1 điểm)' : userChoice ? '✗ SAI (0 điểm)' : '⚠ CHƯA TRẢ LỜI'}
            </td>
          </tr>
        </table>

        <!-- PHẦN GIẢI THÍCH TRÍCH DẪN ĐÁP ÁN TRONG ĐỀ THI -->
        <div style="background-color: #f0fdf4; border-left: 3.5pt solid #16a34a; border-top: 1pt solid #bbf7d0; border-right: 1pt solid #bbf7d0; border-bottom: 1pt solid #bbf7d0; padding: 6pt 10pt; margin-top: 6pt;">
          <div style="font-weight: bold; font-size: 10.5pt; color: #166534; margin-bottom: 2pt;">
            ➜ ĐÁP ÁN ĐÚNG: ${q.correct} | PHẦN GIẢI THÍCH TRÍCH DẪN:
          </div>
          <div style="font-size: 10.5pt; color: #14532d; line-height: 1.4; font-style: italic;">
            ${combinedExplain}
          </div>
        </div>
      </div>
      `;
    })
    .join('');

  // Render bảng ma trận đối chiếu nhanh
  const quickTableRows = attempt.questions
    .map((q, idx) => {
      const userChoice = attempt.answers[idx] || '';
      const isCorrect = userChoice === q.correct;
      const rawCit = (q.citation || '').trim();
      const rawExp = (q.explanation || '').trim();
      const isGeneric =
        rawCit.includes('Quy chuẩn Kỹ thuật Nghề nghiệp & Tiêu chuẩn Vận hành SPMO') ||
        rawCit === 'Quy chuẩn ngành điện' ||
        rawCit.includes('Căn cứ Quy chuẩn kỹ thuật an toàn điện & Quy trình vận hành SPMO');
      const validCit = isGeneric ? '' : rawCit;
      const combinedExplain = [validCit, rawExp]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(' - ') || '-';
      const citationShort = combinedExplain.slice(0, 100) + (combinedExplain.length > 100 ? '...' : '');

      return `
      <tr>
        <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${idx + 1}</td>
        <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${q.section || 'AX'}</td>
        <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold; color: ${isCorrect ? '#166534' : userChoice ? '#991b1b' : '#64748b'};">
          ${userChoice || '-'}
        </td>
        <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold; color: #166534; background-color: #f0fdf4;">
          ${q.correct}
        </td>
        <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold; color: ${isCorrect ? '#166534' : '#991b1b'};">
          ${isCorrect ? 'ĐÚNG' : 'SAI'}
        </td>
        <td style="border: 1pt solid #000; padding: 4pt; font-size: 9.5pt; color: #334155;">
          ${citationShort}
        </td>
      </tr>
      `;
    })
    .join('');

  return `
    <!-- HEADER QUỐC HIỆU & ĐƠN VỊ -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; border: none;">
      <tr style="border: none;">
        <td style="width: 50%; text-align: center; vertical-align: top; border: none; font-size: 11pt; padding: 0;">
          <strong>${orgConfig.parentOrg || 'TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM'}</strong><br />
          <strong>${orgConfig.companyName || 'CÔNG TY DỊCH VỤ NHÀ MÁY ĐIỆN (SPMO)'}</strong><br />
          <strong>HỘI ĐỒNG THI SÁT HẠCH NGHỀ</strong><br />
          <span style="display: inline-block; width: 140px; border-bottom: 1px solid #000; margin-top: 3px;"></span><br />
          <span style="font-size: 10pt; font-style: italic;">${orgConfig.documentNumber || 'Số: ..... /KQSH-HĐSH'}</span>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; border: none; font-size: 11pt; padding: 0;">
          <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
          <strong>Độc lập - Tự do - Hạnh phúc</strong><br />
          <span style="display: inline-block; width: 160px; border-bottom: 1px solid #000; margin-top: 3px;"></span><br />
          <span style="font-size: 10pt; font-style: italic;">Ngày ${dateFormatted}</span>
        </td>
      </tr>
    </table>

    <!-- TIÊU ĐỀ BÁO CÁO -->
    <div style="text-align: center; margin: 15pt 0 12pt 0;">
      <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4pt 0; color: #000000;">
        BẢNG TỔNG HỢP KẾT QUẢ SÁT HẠCH NGHỀ TRỰC TUYẾN
      </h1>
      <h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4pt 0; color: #003366;">
        ĐÁP ÁN THÍ SINH, ĐÁP ÁN ĐÚNG & CĂN CỨ TRÍCH DẪN ĐỀ THI
      </h2>
      <p style="font-size: 11pt; font-style: italic; margin: 0;">
        (Chế độ thi: ${attempt.mode === 'official' ? 'SÁT HẠCH CHÍNH THỨC' : 'LUYỆN THI / ÔN TẬP TỰ ĐỘNG'} - Xuất từ Hệ thống Sát hạch Trực tuyến SPMO Pro)
      </p>
      <div style="width: 280px; margin: 6pt auto 0 auto; border-bottom: 1.5px solid #003366;"></div>
    </div>

    <!-- PHẦN I: THÔNG TIN THÍ SINH & KẾT QUẢ TỔNG QUAN -->
    <div style="margin-bottom: 12pt;">
      <h3 style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 10pt 0 4pt 0; color: #1e3a8a;">
        I. THÔNG TIN THÍ SINH &amp; KẾT QUẢ SÁT HẠCH
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8pt; font-size: 11pt;">
        <tr>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; width: 25%; background-color: #f8fafc;"><strong>Họ và tên thí sinh:</strong></td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; width: 35%; font-weight: bold; font-size: 12pt; text-transform: uppercase; color: #0f172a;">${attempt.candidateName}</td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; width: 20%; background-color: #f8fafc;"><strong>Bậc sát hạch:</strong></td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; width: 20%; font-weight: bold; color: #003366;">BẬC ${attempt.level}</td>
        </tr>
        <tr>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; background-color: #f8fafc;"><strong>Bộ phận / Vị trí:</strong></td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt;">${attempt.unitName} (Kho ${attempt.unit})</td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; background-color: #f8fafc;"><strong>Phòng thi:</strong></td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; font-weight: bold;">${attempt.roomCode}</td>
        </tr>
        <tr>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; background-color: #f8fafc;"><strong>Mã đề thi:</strong></td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; font-family: 'Courier New', monospace; font-weight: bold;">${attempt.examCode}</td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; background-color: #f8fafc;"><strong>Thời gian làm bài:</strong></td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt;">${Math.floor(attempt.elapsedSeconds / 60)} phút ${attempt.elapsedSeconds % 60} giây</td>
        </tr>
        <tr>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; background-color: #f8fafc;"><strong>Thời điểm nộp bài:</strong></td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt;" colspan="3">${timeFormatted}</td>
        </tr>
        <tr style="background-color: ${isPassed ? '#f0fdf4' : '#fef2f2'};">
          <td style="border: 1pt solid #000; padding: 6pt 8pt;"><strong>Điểm số đạt được:</strong></td>
          <td style="border: 1pt solid #000; padding: 6pt 8pt; font-size: 13pt; font-weight: bold; color: ${isPassed ? '#166534' : '#991b1b'};">
            ${attempt.score} / 10 điểm (${attempt.percent}%)
          </td>
          <td style="border: 1pt solid #000; padding: 6pt 8pt;"><strong>Xếp loại kết quả:</strong></td>
          <td style="border: 1pt solid #000; padding: 6pt 8pt; font-size: 12pt; font-weight: bold; color: ${isPassed ? '#166534' : '#991b1b'};">
            ${isPassed ? '✓ ĐẠT TIÊU CHUẨN' : '✗ KHÔNG ĐẠT'}
          </td>
        </tr>
        <tr>
          <td style="border: 1pt solid #000; padding: 5pt 8pt; background-color: #f8fafc;"><strong>Số câu trả lời:</strong></td>
          <td style="border: 1pt solid #000; padding: 5pt 8pt;" colspan="3">
            Đúng: <strong>${attempt.correct} / ${attempt.total}</strong> câu &nbsp;|&nbsp; 
            Sai: <strong>${attempt.wrong}</strong> câu &nbsp;|&nbsp; 
            Chưa trả lời: <strong>${attempt.unanswered}</strong> câu &nbsp;|&nbsp; 
            Rời màn hình: <strong>${attempt.focusViolations}</strong> lần
          </td>
        </tr>
      </table>
    </div>

    <!-- ĐÁNH GIÁ PHÂN BỔ 5 NHÓM NGHIỆP VỤ -->
    <div style="margin-bottom: 14pt;">
      <h3 style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 10pt 0 4pt 0; color: #1e3a8a;">
        II. KẾT QUẢ ĐÁNH GIÁ THEO 5 NHÓM NGHIỆP VỤ
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8pt; font-size: 10.5pt; text-align: center;">
        <thead>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th style="border: 1pt solid #000; padding: 5pt;">Nhóm Chuyên Môn</th>
            <th style="border: 1pt solid #000; padding: 5pt;">Mô Tả Nghiệp Vụ</th>
            <th style="border: 1pt solid #000; padding: 5pt;">Số Câu Trong Đề</th>
            <th style="border: 1pt solid #000; padding: 5pt;">Số Câu Đúng</th>
            <th style="border: 1pt solid #000; padding: 5pt;">Tỷ Lệ (%)</th>
            <th style="border: 1pt solid #000; padding: 5pt;">Kết Luận Sàn</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold; color: #0891b2;">An toàn (AT)</td>
            <td style="border: 1pt solid #000; padding: 4pt; text-align: left;">Quy trình Kỹ thuật An toàn điện</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.at?.total || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.at?.correct || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold; color: ${(stats.at?.percent || 0) >= 80 ? '#166534' : '#991b1b'};">
              ${stats.at?.percent || 0}%
            </td>
            <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold; color: ${(stats.at?.percent || 0) >= 80 ? '#166534' : '#991b1b'};">
              ${(stats.at?.percent || 0) >= 80 ? 'ĐẠT (≥80%)' : 'KHÔNG ĐẠT (<80%)'}
            </td>
          </tr>
          <tr>
            <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold; color: #0d9488;">Quy trình (QT)</td>
            <td style="border: 1pt solid #000; padding: 4pt; text-align: left;">Quy trình Kỹ thuật Vận hành & Thiết bị</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.qt?.total || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.qt?.correct || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.qt?.percent || 0}%</td>
            <td style="border: 1pt solid #000; padding: 4pt;">-</td>
          </tr>
          <tr>
            <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold; color: #d97706;">Nội quy (NQ)</td>
            <td style="border: 1pt solid #000; padding: 4pt; text-align: left;">Nội quy Lao động & Kỷ luật Điều hành</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.nq?.total || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.nq?.correct || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.nq?.percent || 0}%</td>
            <td style="border: 1pt solid #000; padding: 4pt;">-</td>
          </tr>
          <tr>
            <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold; color: #4f46e5;">Điều độ (TTD)</td>
            <td style="border: 1pt solid #000; padding: 4pt; text-align: left;">Quy định Thao tác Điều độ Hệ thống điện</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.ttd?.total || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.ttd?.correct || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.ttd?.percent || 0}%</td>
            <td style="border: 1pt solid #000; padding: 4pt;">(Đưa sau cùng)</td>
          </tr>
          <tr>
            <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold; color: #9333ea;">Chuyên môn (AX)</td>
            <td style="border: 1pt solid #000; padding: 4pt; text-align: left;">Chuyên môn tích lũy (Bậc 1 đến Bậc ${attempt.level})</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.ax?.total || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.ax?.correct || 0}</td>
            <td style="border: 1pt solid #000; padding: 4pt;">${stats.ax?.percent || 0}%</td>
            <td style="border: 1pt solid #000; padding: 4pt;">-</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- BẢNG 1: BẢNG MA TRẬN ĐỐI CHIẾU NHANH ĐÁP ÁN & PHẦN GIẢI THÍCH TRÍCH DẪN -->
    <div style="margin-bottom: 14pt; page-break-after: always;">
      <h3 style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 10pt 0 4pt 0; color: #1e3a8a;">
        III. BẢNG TỔNG HỢP NHANH ĐÁP ÁN &amp; PHẦN GIẢI THÍCH TRÍCH DẪN
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
        <thead>
          <tr style="background-color: #e2e8f0; font-weight: bold;">
            <th style="border: 1pt solid #000; padding: 4pt; width: 6%;">STT</th>
            <th style="border: 1pt solid #000; padding: 4pt; width: 10%;">Nhóm</th>
            <th style="border: 1pt solid #000; padding: 4pt; width: 14%;">Thí sinh chọn</th>
            <th style="border: 1pt solid #000; padding: 4pt; width: 14%;">Đáp án chuẩn</th>
            <th style="border: 1pt solid #000; padding: 4pt; width: 12%;">Kết quả</th>
            <th style="border: 1pt solid #000; padding: 4pt; width: 44%;">Phần giải thích trích dẫn</th>
          </tr>
        </thead>
        <tbody>
          ${quickTableRows}
        </tbody>
      </table>
    </div>

    <!-- BẢNG 2: CHI TIẾT TỪNG CÂU HỎI SÁT HẠCH, LỰA CHỌN CỦA THÍ SINH & PHẦN GIẢI THÍCH TRÍCH DẪN -->
    <div style="margin-bottom: 20pt;">
      <h3 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 10pt 0 6pt 0; color: #1e3a8a;">
        IV. CHI TIẾT CÂU HỎI, ĐÁP ÁN THÍ SINH &amp; PHẦN GIẢI THÍCH TRÍCH DẪN
      </h3>
      <p style="font-size: 10.5pt; font-style: italic; color: #475569; margin-bottom: 10pt;">
        (Dưới đây là toàn bộ nội dung đề thi, các phương án lựa chọn của thí sinh, đáp án chính xác và phần giải thích trích dẫn có sẵn trong đề thi)
      </p>

      ${questionsDetailHtml}
    </div>

    <!-- PHẦN CHỮ KÝ XÁC NHẬN CỦA HỘI ĐỒNG VÀ THÍ SINH -->
    <div style="margin-top: 25pt; page-break-inside: avoid;">
      <table style="width: 100%; border-collapse: collapse; border: none; font-size: 11pt; text-align: center;">
        <tr style="border: none;">
          <td style="width: 25%; border: none; vertical-align: top;">
            <strong>THÍ SINH DỰ THI</strong><br />
            <span style="font-size: 9.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            <div style="height: 60pt;"></div>
            <strong>${attempt.candidateName}</strong>
          </td>
          <td style="width: 25%; border: none; vertical-align: top;">
            <strong>CÁN BỘ GIÁM THỊ</strong><br />
            <span style="font-size: 9.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            <div style="height: 60pt;"></div>
            <strong>${orgConfig.supervisor1 || 'Cán bộ Giám thị'}</strong>
          </td>
          <td style="width: 25%; border: none; vertical-align: top;">
            <strong>THƯ KÝ HỘI ĐỒNG</strong><br />
            <span style="font-size: 9.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            <div style="height: 60pt;"></div>
            <strong>${orgConfig.councilSecretary || 'Thư ký Hội đồng'}</strong>
          </td>
          <td style="width: 25%; border: none; vertical-align: top;">
            <strong>CHỦ TỊCH HỘI ĐỒNG</strong><br />
            <span style="font-size: 9.5pt; font-style: italic;">(Ký, đóng dấu và ghi rõ họ tên)</span>
            <div style="height: 60pt;"></div>
            <strong>${orgConfig.councilPresident || 'Chủ tịch Hội đồng'}</strong>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Tải xuống trực tiếp file Word (.doc) hoàn chỉnh
 */
export function downloadExamResultDoc(
  filename: string,
  attempt: ExamAttempt,
  customOrgConfig?: OrganizationConfig
) {
  const contentHtml = generateExamResultWordDocHtml(attempt, customOrgConfig);

  const fullDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>KẾT QUẢ SÁT HẠCH NGHỀ - ${attempt.candidateName}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.35;
          color: #000000;
          background-color: #ffffff;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 6pt 0;
        }
        th, td {
          font-family: 'Times New Roman', Times, serif;
        }
        h1, h2, h3, h4 {
          font-family: 'Times New Roman', Times, serif;
        }
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
  const cleanName = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
