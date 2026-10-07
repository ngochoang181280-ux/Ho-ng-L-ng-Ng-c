# HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG TRÊN GOOGLE APPS SCRIPT

Hệ thống thi trắc nghiệm này đã được tối ưu hóa sẵn để chạy **hoàn toàn miễn phí 100% trên Google Apps Script (GAS)** và lưu trữ toàn bộ dữ liệu tự động vào **Google Sheets (Google Trang tính)** của bạn.

---

## 🚀 Các bước cài đặt nhanh (chỉ mất 3 phút)

### Bước 1: Tạo một Google Sheet mới
1. Truy cập [Google Sheets](https://sheets.new) để tạo 1 bảng tính mới.
2. Đặt tên bảng tính (VD: `He_Thong_Thi_Trac_Nghiem_SPMO`).

### Bước 2: Mở trình chỉnh sửa Google Apps Script
1. Trên thanh menu của Google Sheets, chọn: **Tiện ích mở rộng (Extensions)** > **Apps Script**.
2. Một cửa sổ lập trình Apps Script sẽ mở ra.

### Bước 3: Dán mã nguồn
Dự án cần có 2 file:

1. **File `Code.gs`**:
   * Xóa toàn bộ nội dung mặc định trong file `Code.gs`.
   * Mở file `/apps-script/Code.gs` trong thư mục này, sao chép toàn bộ mã nguồn và dán vào.

2. **File `Index.html`**:
   * Tại thanh bên trái của Apps Script, nhấn dấu **`+`** bên cạnh mục *Tệp (Files)* > Chọn **HTML**.
   * Đặt tên tệp là: `Index` (Apps Script sẽ tự thêm đuôi `.html`).
   * Mở file `/apps-script/Index.html` trong thư mục này, sao chép toàn bộ mã nguồn và dán vào.

3. Nhấn biểu tượng **Lưu (Save / Ctrl+S)**.

---

### Bước 4: Khởi tạo bảng dữ liệu tự động
1. Tại thanh công cụ của Apps Script, ở ô chọn hàm, chọn hàm **`initDatabase`**.
2. Nhấn nút **Chạy (Run)**.
3. Khi được hỏi quyền truy cập Google Sheets lần đầu, nhấn **Xem lại quyền (Review permissions)** > Chọn tài khoản Google của bạn > Chọn **Nâng cao (Advanced)** > Nhấn **Đi tới (không an toàn)** > Nhấn **Cho phép (Allow)**.
4. Quay lại Google Sheet, bạn sẽ thấy 3 sheet tự động được tạo với định dạng đẹp mắt:
   * **`PHONG_THI`**: Quản lý danh sách phòng thi, mã PIN khóa phòng, thời gian, trạng thái.
   * **`THI_SINH`**: Bảng điểm và kết quả bài làm tự động lưu sau mỗi lần thí sinh nộp bài.
   * **`CAU_HOI`**: Ngân hàng câu hỏi trắc nghiệm.

---

### Bước 5: Triển khai Ứng dụng Web (Web App)
1. Ở góc trên bên phải màn hình Apps Script, nhấn **Triển khai (Deploy)** > **Tùy chọn triển khai mới (New deployment)**.
2. Nhấn biểu tượng bánh răng ⚙️ bên cạnh *Chọn loại* > Chọn **Ứng dụng web (Web app)**.
3. Cấu hình như sau:
   * **Mô tả (Description)**: `Phần mềm thi nâng bậc v1`
   * **Thực thi dưới dạng (Execute as)**: `Tôi (Me)`
   * **Ai có quyền truy cập (Who has access)**: `Bất kỳ ai (Anyone)` *(để thí sinh không cần đăng nhập tài khoản Google vẫn vào thi được)*.
4. Nhấn **Triển khai (Deploy)**.
5. Sao chép đường link ở mục **Ứng dụng web (Web app URL)**.

---

## 📱 Cách Thí sinh & Quản trị viên sử dụng:

* **Link cho Thí sinh**: Gửi link Web App vừa sao chép cho thí sinh. Thí sinh mở link trên điện thoại hoặc máy tính, điền họ tên, chọn phòng và mã PIN (nếu phòng khóa) để làm bài.
* **Link trực tiếp từng phòng**: Thêm đuôi `?room=MÃ_PHÒNG` vào sau link (VD: `https://script.google.com/.../exec?room=SPM-2026`).
* **Đăng nhập Quản trị (Admin)**: Nhấn nút **`Quản Trị (Admin)`** ở góc trên bên phải trang web (Mật khẩu mặc định: `admin`).

---

## 🤖 (Tùy chọn) Kích hoạt Google AI trên Apps Script:
Nếu bạn muốn sử dụng trợ lý Google AI (Gemini) để giải thích đáp án trên Apps Script:
1. Vào **Cài đặt dự án (Project Settings)** (biểu tượng bánh răng ở thanh bên trái Apps Script).
2. Cuộn xuống mục **Thuộc tính tập lệnh (Script Properties)** > Nhấn **Thêm thuộc tính tập lệnh**.
3. Thuộc tính (Property): `GEMINI_API_KEY`
4. Giá trị (Value): Điền mã API Key Gemini của bạn.
5. Nhấn **Lưu các thuộc tính tập lệnh**.
