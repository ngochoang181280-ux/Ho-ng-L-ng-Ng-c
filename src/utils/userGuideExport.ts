/**
 * Utility to generate and download the Comprehensive User Manual as a Microsoft Word document (.doc)
 * Styled with official Vietnamese administrative standard typography (Times New Roman, A4, tables, headers).
 */

export function generateUserGuideDocHtml(): string {
  const dateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `
  <div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.4; color: #000000;">
    <!-- QUỐC HIỆU & TIÊU NGỮ / CƠ QUAN BAN HÀNH -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20pt; border: none;">
      <tr style="border: none;">
        <td style="width: 50%; text-align: center; vertical-align: top; border: none; font-size: 11pt; padding: 0;">
          <strong>TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM</strong><br />
          <strong>HỘI ĐỒNG THI SÁT HẠCH NGHỀ</strong><br />
          <span style="display: inline-block; width: 120px; border-bottom: 1px solid #000; margin-top: 3px;"></span><br />
          <span style="font-size: 10pt; font-style: italic;">Số: 01/HD-HĐSH</span>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; border: none; font-size: 11pt; padding: 0;">
          <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
          <strong>Độc lập - Tự do - Hạnh phúc</strong><br />
          <span style="display: inline-block; width: 160px; border-bottom: 1px solid #000; margin-top: 3px;"></span><br />
          <span style="font-size: 10pt; font-style: italic;">Ngày ${dateStr}</span>
        </td>
      </tr>
    </table>

    <!-- TIÊU ĐỀ TÀI LIỆU -->
    <div style="text-align: center; margin: 25pt 0 15pt 0;">
      <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0 0 6pt 0;">
        TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHI TIẾT
      </h1>
      <h2 style="font-size: 14pt; font-weight: bold; color: #003366; margin: 0 0 6pt 0;">
        HỆ THỐNG THI SÁT HẠCH NÂNG BẬC NGHỀ & QUẢN TRỊ TRẮC NGHIỆM TRỰC TUYẾN
      </h2>
      <p style="font-size: 11.5pt; font-style: italic; margin: 0;">
        (Áp dụng cho Ban Tổ Chức, Hội Đồng Sát Hạch, Cán Bộ Giám Thị và Thí Sinh)
      </p>
      <div style="width: 250px; margin: 10pt auto 0 auto; border-bottom: 1.5px solid #003366;"></div>
    </div>

    <!-- MỤC LỤC TỔNG QUÁT -->
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12pt 15pt; margin: 15pt 0 25pt 0; border-radius: 4pt;">
      <h3 style="font-size: 12.5pt; font-weight: bold; margin: 0 0 8pt 0; text-transform: uppercase; color: #1e3a8a;">
        MỤC LỤC NỘI DUNG TÀI LIỆU
      </h3>
      <table style="width: 100%; border-collapse: collapse; border: none; font-size: 11.5pt;">
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN I.</strong> TỔNG QUAN HỆ THỐNG VÀ QUY TRÌNH 5 BƯỚC VẬN HÀNH</td><td style="border: none; text-align: right;">Trang 1</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN II.</strong> HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN & HỘI ĐỒNG THI</td><td style="border: none; text-align: right;">Trang 2</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN III.</strong> QUY CHUẨN NẠP ĐỀ TỪ FILE WORD & MẪU CÂU HỎI CHUẨN</td><td style="border: none; text-align: right;">Trang 4</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN IV.</strong> CẤU HÌNH MA TRẬN ĐỀ THI & PHÂN BỔ NHÓM CHỨC DANH</td><td style="border: none; text-align: right;">Trang 6</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN V.</strong> GIÁM SÁT TRỰC TIẾP (LIVE PROCTORING) & CHỐNG GIAN LẬN</td><td style="border: none; text-align: right;">Trang 7</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN VI.</strong> HƯỚNG DẪN THAO TÁC DÀNH CHO THÍ SINH DỰ THI</td><td style="border: none; text-align: right;">Trang 8</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN VII.</strong> IN ĐỀ THI GIẤY A4, PHIẾU TÔ & BẢNG ĐÁP ÁN HOÁN VỊ</td><td style="border: none; text-align: right;">Trang 9</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN VIII.</strong> XUẤT BIÊN BẢN HỘI ĐỒNG SÁT HẠCH & TÙY BIẾN TIÊU ĐỀ</td><td style="border: none; text-align: right;">Trang 10</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 2pt 0;"><strong>PHẦN IX.</strong> CÂU HỎI THƯỜNG GẶP (FAQ) & XỬ LÝ SỰ CỐ PHÒNG THI</td><td style="border: none; text-align: right;">Trang 11</td></tr>
      </table>
    </div>

    <!-- NỘI DUNG CHI TIẾT -->

    <!-- PHẦN 1 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN I. TỔNG QUAN HỆ THỐNG VÀ QUY TRÌNH 5 BƯỚC VẬN HÀNH
      </h2>
      <p style="text-align: justify; text-indent: 20pt; margin: 8pt 0;">
        Hệ thống Thi Sát hạch Nâng bậc nghề & Quản trị trắc nghiệm trực tuyến được phát triển chuyên biệt theo đặc thù kỹ thuật và cơ cấu tổ chức của các đơn vị thành viên trực thuộc Tập đoàn Điện lực Việt Nam (EVN). Hệ thống cho phép tổ chức kỳ thi sát hạch lý thuyết nâng bậc thợ, thi giữ bậc hàng năm, thi an toàn điện và quy trình vận hành với độ chính xác cao, bảo mật tuyệt đối và tự động hóa toàn diện từ khâu nạp đề đến in ấn biên bản tổng kết.
      </p>

      <h3 style="font-size: 12.5pt; font-weight: bold; margin: 10pt 0 6pt 0;">
        1. Quy trình 5 bước tổ chức kỳ thi sát hạch tiêu chuẩn:
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin: 8pt 0;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #334155; padding: 6pt; width: 8%; text-align: center;">Bước</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 27%; text-align: left;">Nội dung công việc</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 40%; text-align: left;">Mô tả thao tác chi tiết</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 25%; text-align: left;">Người thực hiện</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">1</td>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Nạp ngân hàng câu hỏi</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Kéo thả file Word (.docx) chứa câu hỏi trắc nghiệm theo quy ước tên file (A5.1, B4.1, AT, QT...).</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Ban ra đề / Quản trị viên</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">2</td>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Khởi tạo phòng thi</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Bấm <em>"Tạo phòng thi"</em> hoặc dùng tính năng <em>"⚡ Tạo đồng loạt phòng cho từng nhóm"</em> (A, B, C, D).</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Hội đồng thi / Thư ký</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">3</td>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Cấp quyền & Khóa PIN</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Cung cấp mã phòng thi, link làm bài hoặc mã khóa bảo mật PIN cho thí sinh từng ca thi.</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Cán bộ coi thi (Giám thị)</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">4</td>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Giám sát & Chấm điểm</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Theo dõi trực tiếp thí sinh qua Live Proctoring; hệ thống tự động chấm điểm và xếp loại ngay khi nộp bài.</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Hệ thống & Giám thị</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">5</td>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Xuất biên bản & Lưu trữ</td>
            <td style="border: 1px solid #334155; padding: 6pt;">In Biên bản họp Hội đồng sát hạch chuẩn A4 hoặc tải file Word (.doc) để lưu hồ sơ nâng lương/bậc.</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Chủ tịch / Thư ký Hội đồng</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PHẦN 2 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN II. HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN & HỘI ĐỒNG THI
      </h2>
      <h3 style="font-size: 12.5pt; font-weight: bold; margin: 10pt 0 6pt 0;">
        1. Đăng nhập trang quản trị (Admin Portal):
      </h3>
      <p style="text-align: justify; text-indent: 20pt; margin: 6pt 0;">
        Tại góc trên bên phải màn hình chính của ứng dụng, nhấn vào nút <strong>"Quản Trị Hệ Thống"</strong>. Đăng nhập với thông tin mặc định:
      </p>
      <ul style="margin: 6pt 0 10pt 25pt;">
        <li><strong>Tên đăng nhập (Username):</strong> <code>admin</code></li>
        <li><strong>Mật khẩu (Password):</strong> <code>admin</code></li>
        <li><em>Lưu ý: Quản trị viên có thể đổi mật khẩu bất kỳ lúc nào tại mục Cài đặt hệ thống.</em></li>
      </ul>

      <h3 style="font-size: 12.5pt; font-weight: bold; margin: 10pt 0 6pt 0;">
        2. Thao tác quản lý phòng thi & Xóa phòng thi:
      </h3>
      <ul style="margin: 6pt 0 10pt 25pt; line-height: 1.5;">
        <li>
          <strong>Tạo phòng lẻ:</strong> Bấm <em>"Tạo Phòng Thi Mới"</em>, chọn Bộ phận/Nhóm công tác (Trưởng ca, Điều hành viên, Điện, Cơ...), chọn Bậc thi (từ bậc 1 đến bậc 8), nhập tên phòng, thời gian làm bài (mặc định 45 phút), ngưỡng điểm đạt (7.0/10) và mã bảo vệ PIN.
        </li>
        <li>
          <strong>Tạo đồng loạt cho từng nhóm (Khuyên dùng):</strong> Bấm <em>"⚡ Tạo Phòng Cho Từng Nhóm"</em>. Hệ thống sẽ tự động tạo cùng lúc 4 phòng thi chuyên biệt tương ứng cho 4 nhóm: Nhóm A (Trưởng ca Bậc 5), Nhóm B (Điều hành viên Bậc 4), Nhóm C (Công nhân điện Bậc 3), Nhóm D (Công nhân cơ Bậc 3) với ma trận đề đã được cấu hình tối ưu.
        </li>
        <li>
          <strong>Xóa phòng thi đơn lẻ:</strong> Tại mỗi thẻ phòng thi, bấm nút <em>"🗑️ Xóa"</em> (màu đỏ). Hệ thống sẽ mở hộp thoại xác nhận chuyên nghiệp, hỏi rõ người dùng muốn xóa vĩnh viễn phòng thi này hay không. Khi xác nhận, phòng thi được xóa sạch sẽ khỏi hệ thống và bộ nhớ lưu trữ mà không bao giờ bị lỗi do trình duyệt chặn.
        </li>
        <li>
          <strong>Xóa tất cả các phòng thi:</strong> Tại thanh công cụ quản lý phòng, bấm nút <em>"🗑️ Xóa Tất Cả Phòng"</em>. Sau khi xác nhận trong hộp thoại, toàn bộ các phòng thi cũ sẽ được làm sạch để chuẩn bị cho đợt thi mới.
        </li>
        <li>
          <strong>Khóa phòng bằng mã PIN:</strong> Nhấp vào nút trạng thái <em>"MỞ TỰ DO" / "ĐANG KHÓA"</em>. Khi phòng ở trạng thái khóa, thí sinh truy cập bắt buộc phải nhập đúng mã PIN (VD: 123456) mới được bấm bắt đầu làm bài.
        </li>
      </ul>

      <h3 style="font-size: 12.5pt; font-weight: bold; margin: 10pt 0 6pt 0;">
        3. Quản lý ngân hàng câu hỏi & Xóa sạch câu hỏi mặc định:
      </h3>
      <p style="text-align: justify; text-indent: 20pt; margin: 6pt 0;">
        Hệ thống được thiết kế theo nguyên tắc: <strong>Ưu tiên tuyệt đối câu hỏi do người dùng thực tế nhập vào</strong>, không ép buộc sử dụng câu hỏi mẫu.
      </p>
      <ul style="margin: 6pt 0 10pt 25pt; line-height: 1.5;">
        <li>
          <strong>Xóa câu hỏi mặc định:</strong> Khi vào tab <em>"Ngân Hàng Câu Hỏi"</em>, nếu hệ thống phát hiện có câu hỏi mẫu, một nút bấm màu đỏ cam nổi bật: <em>"🗑️ Xóa Câu Hỏi Mặc Định"</em> sẽ hiển thị. Nhấn vào nút này sẽ dọn dẹp sạch toàn bộ các câu hỏi mẫu khởi tạo, chỉ giữ lại câu hỏi người dùng đã nạp vào.
        </li>
        <li>
          <strong>Xóa tất cả câu hỏi:</strong> Nút <em>"🗑️ Xóa Toàn Bộ Đề"</em> cho phép xóa trắng ngân hàng đề thi về 0 câu hỏi để nạp lại từ đầu.
        </li>
        <li>
          <strong>Xóa nhiều câu hỏi tùy chọn (Multi-select):</strong> Có thể tích chọn các ô vuông trước mỗi câu hỏi cần xóa, thanh tác vụ sẽ hiển thị số lượng đã chọn kèm nút <em>"Xóa X câu đã chọn"</em> để loại bỏ hàng loạt nhanh chóng.
        </li>
        <li>
          <strong>Nạp câu hỏi mẫu minh họa (Tùy chọn):</strong> Nếu muốn trải nghiệm thử cấu trúc đề thi EVN, bấm nút <em>"✨ Nạp 18 Câu Mẫu EVN Minh Họa"</em>.
        </li>
      </ul>
    </div>

    <!-- PHẦN 3 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN III. QUY CHUẨN NẠP ĐỀ TỪ FILE WORD & MẪU CÂU HỎI CHUẨN
      </h2>
      <h3 style="font-size: 12.5pt; font-weight: bold; margin: 10pt 0 6pt 0;">
        1. Quy tắc đặt tên file Word (.docx) để phân loại tự động:
      </h3>
      <p style="text-align: justify; text-indent: 20pt; margin: 6pt 0;">
        Hệ thống trang bị bộ phân tích ngữ nghĩa thông minh, tự động nhận diện nhóm nghề và bậc thợ từ tên file Word bạn tải lên mà không cần phải chỉnh tay từng câu:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 8pt 0;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #334155; padding: 6pt; width: 28%; text-align: left;">Mẫu tên file Word (.docx)</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 30%; text-align: left;">Nhóm chuyên môn</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 17%; text-align: center;">Bậc thợ</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 25%; text-align: left;">Phân loại ngân hàng</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-family: 'Courier New', monospace; font-weight: bold;">A5.1.docx, A5.2.docx</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Nhóm A: Trưởng ca</td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">Bậc 5</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Chuyên môn Nhóm A</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-family: 'Courier New', monospace; font-weight: bold;">B4.1.docx, B4.2.docx</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Nhóm B: Điều hành viên</td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">Bậc 4</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Chuyên môn Nhóm B</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-family: 'Courier New', monospace; font-weight: bold;">C3.1.docx, C4.1.docx</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Nhóm C: Công nhân điện</td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">Bậc 3 / Bậc 4</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Chuyên môn Nhóm C</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-family: 'Courier New', monospace; font-weight: bold;">D3.1.docx, D4.1.docx</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Nhóm D: Công nhân cơ</td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">Bậc 3 / Bậc 4</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Chuyên môn Nhóm D</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-family: 'Courier New', monospace; font-weight: bold;">ATTD5.1.docx, BTTD4.1.docx</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Trưởng ca / ĐHV tham gia TTD</td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center; font-weight: bold;">Bậc 5 / Bậc 4</td>
            <td style="border: 1px solid #334155; padding: 6pt;"><strong>Thị trường điện (TTD)</strong></td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-family: 'Courier New', monospace; font-weight: bold;">AT.docx, AT.1.docx</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Dùng chung toàn bộ các nhóm</td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center;">Chung</td>
            <td style="border: 1px solid #334155; padding: 6pt;"><strong>An toàn điện & BHLĐ</strong></td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-family: 'Courier New', monospace; font-weight: bold;">QT.docx, NQ.docx</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Dùng chung toàn bộ các nhóm</td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center;">Chung</td>
            <td style="border: 1px solid #334155; padding: 6pt;"><strong>Quy trình / Nội quy</strong></td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 12.5pt; font-weight: bold; margin: 12pt 0 6pt 0;">
        2. Cấu trúc câu hỏi chuẩn trong file Word:
      </h3>
      <p style="text-align: justify; text-indent: 20pt; margin: 6pt 0;">
        Hệ thống hỗ trợ 3 cách đánh dấu đáp án đúng linh hoạt:
      </p>
      <div style="background-color: #f8fafc; border-left: 3px solid #0284c7; padding: 8pt 12pt; margin: 8pt 0; font-size: 11pt;">
        <strong>Cách 1 (Chuẩn nhất - Gạch chân đáp án đúng):</strong><br />
        Câu 1: Khoảng cách an toàn nhỏ nhất đối với cấp điện áp 110kV khi không có rào chắn là bao nhiêu?<br />
        <u>A. 1,5 mét</u><br />
        B. 2,0 mét<br />
        C. 2,5 mét<br />
        D. 3,0 mét<br />
        <em>(Đáp án A được gạch chân sẽ tự động nhận là đáp án đúng)</em>
      </div>

      <div style="background-color: #f8fafc; border-left: 3px solid #10b981; padding: 8pt 12pt; margin: 8pt 0; font-size: 11pt;">
        <strong>Cách 2 (Ghi dòng Đáp án ở cuối câu):</strong><br />
        Câu 2: Theo quy trình an toàn điện, trước khi trèo lên cột điện phải làm gì?<br />
        A. Kiểm tra tiếp địa an toàn<br />
        B. Kiểm tra độ vững chắc của cột và móng cột<br />
        C. Đeo dây an toàn và kiểm tra thử tải<br />
        D. Cả B và C đều đúng<br />
        Đáp án: D<br />
        Trích dẫn: Điều 42 Quy chuẩn kỹ thuật an toàn điện QCVN 01:2020/BCT
      </div>
    </div>

    <!-- PHẦN 4 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN IV. CẤU HÌNH MA TRẬN ĐỀ THI & PHÂN BỔ NHÓM CHỨC DANH
      </h2>
      <p style="text-align: justify; text-indent: 20pt; margin: 6pt 0;">
        Ma trận đề thi quyết định thuật toán bốc đề ngẫu nhiên cho mỗi thí sinh để đảm bảo vừa đúng trọng tâm chuyên môn, vừa công bằng và chống học vẹt:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 8pt 0;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #334155; padding: 6pt; width: 15%; text-align: left;">Nhóm chức danh</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 20%; text-align: left;">Chức danh tiêu chuẩn</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 45%; text-align: left;">Cơ cấu phân bổ ma trận câu hỏi</th>
            <th style="border: 1px solid #334155; padding: 6pt; width: 20%; text-align: center;">Tổng số câu / TG</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Nhóm A</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Trưởng ca Nhà máy</td>
            <td style="border: 1px solid #334155; padding: 6pt;">
              • An toàn (AT): 25%<br />
              • Quy trình vận hành & điều độ (QT): 35%<br />
              • Chuyên môn sâu Trưởng ca (CM): 25%<br />
              • <strong>Thị trường điện (TTD): 15%</strong>
            </td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center;">
              <strong>40 câu</strong><br />(45 phút)
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Nhóm B</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Điều hành viên chính / phụ</td>
            <td style="border: 1px solid #334155; padding: 6pt;">
              • An toàn lao động (AT): 30%<br />
              • Quy trình kỹ thuật (QT): 30%<br />
              • Chuyên môn điều hành (CM): 30%<br />
              • Thị trường điện cơ bản (TTD): 10%
            </td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center;">
              <strong>35 - 40 câu</strong><br />(45 phút)
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Nhóm C</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Công nhân kỹ thuật điện</td>
            <td style="border: 1px solid #334155; padding: 6pt;">
              • An toàn điện & BHLĐ (AT): 40%<br />
              • Quy trình an toàn thiết bị (QT): 30%<br />
              • Tay nghề chuyên môn điện (CM): 30%
            </td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center;">
              <strong>30 câu</strong><br />(35 phút)
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 6pt; font-weight: bold;">Nhóm D</td>
            <td style="border: 1px solid #334155; padding: 6pt;">Công nhân kỹ thuật cơ</td>
            <td style="border: 1px solid #334155; padding: 6pt;">
              • An toàn cơ khí & nhiệt (AT): 40%<br />
              • Quy trình bảo dưỡng cơ (QT): 30%<br />
              • Chuyên môn sửa chữa thiết bị cơ khí (CM): 30%
            </td>
            <td style="border: 1px solid #334155; padding: 6pt; text-align: center;">
              <strong>30 câu</strong><br />(35 phút)
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PHẦN 5 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN V. GIÁM SÁT TRỰC TIẾP (LIVE PROCTORING) & CHỐNG GIAN LẬN
      </h2>
      <p style="text-align: justify; text-indent: 20pt; margin: 6pt 0;">
        Tính năng Live Proctoring cho phép giám thị theo dõi trạng thái của toàn bộ thí sinh trong phòng thi theo thời gian thực:
      </p>
      <ul style="margin: 6pt 0 10pt 25pt; line-height: 1.5;">
        <li>
          <strong>Tự động phát hiện chuyển Tab / Rời màn hình:</strong> Nếu thí sinh chuyển sang tab khác để tra cứu Google hoặc mở tài liệu, hệ thống lập tức ghi nhận số lần vi phạm và hiện cảnh báo đỏ trên máy thí sinh.
        </li>
        <li>
          <strong>Cảnh báo trực tiếp:</strong> Giám thị bấm nút <em>"Cảnh cáo"</em> để gửi thông điệp nhắc nhở trực tiếp lên màn hình của thí sinh vi phạm mà không làm phiền thí sinh khác.
        </li>
        <li>
          <strong>Thu bài cưỡng chế (Force Submit):</strong> Trong trường hợp thí sinh cố tình vi phạm quy chế hoặc hết giờ nhưng chưa bấm nộp bài, giám thị có thể bấm <em>"Thu bài cưỡng chế"</em> để chốt điểm tại thời điểm đó.
        </li>
        <li>
          <strong>Hỗ trợ thí sinh gặp sự cố mạng (Reset/Re-attempt):</strong> Nếu thí sinh bị sập nguồn máy tính hoặc mất kết nối mạng đột ngột, giám thị bấm <em>"Cho phép thi lại"</em> để mở khóa phiên làm bài cho thí sinh.
        </li>
      </ul>
    </div>

    <!-- PHẦN 6 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN VI. HƯỚNG DẪN THAO TÁC DÀNH CHO THÍ SINH DỰ THI
      </h2>
      <ol style="margin: 6pt 0 10pt 25pt; line-height: 1.5;">
        <li>
          <strong>Bước 1 - Đăng nhập phòng thi:</strong>
          Thí sinh truy cập vào cổng thi, nhập chính xác <strong>Họ và tên</strong>, chọn <strong>Bộ phận công tác</strong>, chọn <strong>Bậc thợ đăng ký thi</strong> và chọn <strong>Phòng thi</strong> tương ứng. Nếu phòng có mã PIN, nhập mã PIN do giám thị cung cấp.
        </li>
        <li>
          <strong>Bước 2 - Kiểm tra thông tin & Bắt đầu làm bài:</strong>
          Đọc kỹ quy chế thi và thời gian làm bài, sau đó bấm nút <em>"Bắt Đầu Làm Bài Thi"</em>. Đồng hồ đếm ngược sẽ bắt đầu chạy.
        </li>
        <li>
          <strong>Bước 3 - Thao tác trả lời câu hỏi:</strong>
          <br />• Dùng chuột nhấp chọn vào đáp án A, B, C hoặc D.
          <br />• <strong>Sử dụng phím tắt nhanh:</strong> Bấm phím <code>A</code>, <code>B</code>, <code>C</code>, <code>D</code> trên bàn phím để chọn đáp án; bấm phím <code>Mũi tên Trái (←)</code> và <code>Mũi tên Phải (→)</code> để chuyển câu tiếp theo mà không cần dùng chuột.
          <br />• Bấm nút <em>"🚩 Đánh dấu xem lại"</em> đối với câu hỏi chưa chắc chắn để quay lại kiểm tra trước khi nộp bài.
        </li>
        <li>
          <strong>Bước 4 - Nộp bài & Xem kết quả tức thì:</strong>
          Khi làm xong hoặc hết giờ, bấm nút <em>"Nộp Bài Thi"</em>. Hệ thống sẽ hiển thị điểm số (thang điểm 10), số câu đúng, xếp loại <strong>ĐẠT</strong> hoặc <strong>KHÔNG ĐẠT</strong>, và phân tích chi tiết từng câu.
        </li>
        <li>
          <strong>Bước 5 - In Giấy Xác Nhận Kết Quả:</strong>
          Thí sinh bấm nút <em>"🖨️ In Giấy Xác Nhận Kết Quả"</em> để in trực tiếp hoặc lưu file PDF gửi về phòng Tổ chức và Cán bộ làm căn cứ xét nâng bậc lương.
        </li>
      </ol>
    </div>

    <!-- PHẦN 7 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN VII. IN ĐỀ THI GIẤY A4, PHIẾU TÔ & BẢNG ĐÁP ÁN HOÁN VỊ
      </h2>
      <p style="text-align: justify; text-indent: 20pt; margin: 6pt 0;">
        Phục vụ cho các đơn vị cần tổ chức thi viết trên giấy hoặc lưu trữ hồ sơ thanh tra:
      </p>
      <ul style="margin: 6pt 0 10pt 25pt; line-height: 1.5;">
        <li>Tại thẻ phòng thi, bấm nút <strong>"📄 Đề giấy"</strong>.</li>
        <li>Hệ thống tự động hoán vị xáo trộn ngẫu nhiên tạo ra <strong>4 mã đề thi khác nhau</strong> (Mã 101, Mã 102, Mã 103, Mã 104) với cấu trúc trang in chuẩn A4, tiêu đề chính thức của đơn vị và khung phách rọc bài.</li>
        <li>Kèm theo <strong>Phiếu trả lời trắc nghiệm chuẩn tô tròn A, B, C, D</strong> theo quy định chấm thi.</li>
        <li>Kèm theo <strong>Bảng ma trận đáp án đúng</strong> cho cả 4 mã đề giúp hội đồng chấm bài nhanh chóng trong vòng vài phút.</li>
      </ul>
    </div>

    <!-- PHẦN 8 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN VIII. XUẤT BIÊN BẢN HỘI ĐỒNG SÁT HẠCH & TÙY BIẾN TIÊU ĐỀ
      </h2>
      <p style="text-align: justify; text-indent: 20pt; margin: 6pt 0;">
        Hệ thống hỗ trợ xuất Biên bản kết luận của Hội đồng sát hạch đầy đủ giá trị pháp lý hành chính:
      </p>
      <ul style="margin: 6pt 0 10pt 25pt; line-height: 1.5;">
        <li>
          <strong>Tùy biến tiêu đề cơ quan:</strong> Tại mục Quản trị, chọn tab <em>"Tiêu Đề & Biên Bản"</em>. Quản trị viên có thể nhập tên Tập đoàn/Tổng công ty (EVN, EVNNPT, EVNGENCO, EVNCPC...), tên Nhà máy, số hiệu văn bản, thành phần Hội đồng (Chủ tịch, Thư ký, Ủy viên) và phần trăm ngưỡng điểm đạt.
        </li>
        <li>
          <strong>Xuất file Word (.doc) Biên bản:</strong> Tại phòng thi, bấm nút <em>"📋 Biên bản"</em> và chọn <em>"📥 Tải File Word (.doc)"</em>. File Word biên bản sẽ được tải về máy với bảng thống kê điểm số, danh sách thí sinh Đạt/Không đạt và chữ ký các thành viên Hội đồng.
        </li>
        <li>
          <strong>In trực tiếp chuẩn A4:</strong> Bấm nút <em>"🖨️ In Biên Bản A4"</em> để in ra giấy hoặc lưu thành file PDF ký duyệt.
        </li>
      </ul>
    </div>

    <!-- PHẦN 9 -->
    <div style="margin-bottom: 25pt;">
      <h2 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4pt; margin-top: 15pt;">
        PHẦN IX. CÂU HỎI THƯỜNG GẶP (FAQ) & XỬ LÝ SỰ CỐ PHÒNG THI
      </h2>
      <div style="margin: 10pt 0;">
        <p style="font-weight: bold; color: #1e3a8a; margin: 4pt 0;">
          Hỏi: Tại sao tôi nạp file Word nhưng hệ thống báo 0 câu hỏi?
        </p>
        <p style="text-indent: 15pt; margin: 0 0 8pt 0;">
          <strong>Trả lời:</strong> Kiểm tra lại định dạng file Word. Mỗi câu hỏi cần bắt đầu bằng từ <em>"Câu 1:", "Câu 2:"</em> và các lựa chọn bắt đầu bằng <em>"A.", "B.", "C.", "D."</em> trên các dòng riêng biệt. Đảm bảo đáp án đúng được gạch chân hoặc có dòng <em>"Đáp án: X"</em> ở cuối câu.
        </p>

        <p style="font-weight: bold; color: #1e3a8a; margin: 4pt 0;">
          Hỏi: Có thể tổ chức thi trên điện thoại di động thông minh (Smartphone) hoặc máy tính bảng không?
        </p>
        <p style="text-indent: 15pt; margin: 0 0 8pt 0;">
          <strong>Trả lời:</strong> Hoàn toàn được. Giao diện thi đã được tối ưu hóa hiển thị đáp ứng (Responsive) 100% trên cả iPhone, Android, iPad và máy tính để bàn.
        </p>

        <p style="font-weight: bold; color: #1e3a8a; margin: 4pt 0;">
          Hỏi: Tôi muốn xóa toàn bộ câu hỏi mẫu mặc định thì làm thế nào?
        </p>
        <p style="text-indent: 15pt; margin: 0 0 8pt 0;">
          <strong>Trả lời:</strong> Đăng nhập Quản trị viên, vào tab <em>"Ngân Hàng Câu Hỏi"</em>, bấm nút màu đỏ cam <em>"🗑️ Xóa Câu Hỏi Mặc Định"</em> hoặc <em>"🗑️ Xóa Toàn Bộ Đề"</em>. Hệ thống sẽ làm sạch ngay lập tức và lưu trạng thái vào trình duyệt.
        </p>
      </div>

      <!-- KÝ TÊN PHÊ DUYỆT CỦA HỘI ĐỒNG -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 30pt; border: none;">
        <tr style="border: none;">
          <td style="width: 50%; text-align: center; vertical-align: top; border: none; font-size: 11pt; padding: 0;">
            <strong>THƯ KÝ HỘI ĐỒNG</strong><br />
            <span style="font-style: italic; font-size: 10pt;">(Ký và ghi rõ họ tên)</span><br /><br /><br /><br /><br />
            <strong>Ban Tổ Chức & Nhân Sự</strong>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top; border: none; font-size: 11pt; padding: 0;">
            <strong>CHỦ TỊCH HỘI ĐỒNG SÁT HẠCH</strong><br />
            <span style="font-style: italic; font-size: 10pt;">(Ký tên và đóng dấu)</span><br /><br /><br /><br /><br />
            <strong>Giám Đốc / Phó Giám Đốc</strong>
          </td>
        </tr>
      </table>
    </div>
  </div>
  `;
}

/**
 * Trigger download of the User Guide as a Microsoft Word document (.doc)
 */
export function downloadUserGuideWordDoc(filename: string = 'Huong_Dan_Su_Dung_He_Thong_Sat_Hach_EVN.doc'): void {
  const contentHtml = generateUserGuideDocHtml();
  
  const fullDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>HƯỚNG DẪN SỬ DỤNG HỆ THỐNG SÁT HẠCH EVN</title>
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
          margin: 20mm 15mm 20mm 20mm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.4;
          color: #000000;
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
  a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
