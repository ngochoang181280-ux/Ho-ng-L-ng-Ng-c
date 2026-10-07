/**
 * SPMO Pro - Hệ Thống Thi Trắc Nghiệm & Quản Lý Phòng Thi
 * Google Apps Script Backend (Code.gs)
 * Lưu trữ dữ liệu trực tiếp trên Google Sheets (Bảng tính Google)
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.initialRoom = (e && e.parameter && e.parameter.room) ? e.parameter.room : '';
  
  return template.evaluate()
    .setTitle('SPMO Pro - Hệ Thống Thi Trắc Nghiệm')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Khởi tạo cấu trúc các Sheet tự động nếu chưa có
 */
function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet PHONG_THI
  var sheetRooms = ss.getSheetByName('PHONG_THI');
  if (!sheetRooms) {
    sheetRooms = ss.insertSheet('PHONG_THI');
    sheetRooms.appendRow(['Mã Phòng', 'Tên Phòng', 'Mã Khóa (PIN)', 'Đang Khóa?', 'Bộ Phận', 'Bậc Thi', 'Thời Gian (Phút)', 'Số Câu', 'Ghi Chú', 'Ngày Tạo', 'Số Câu AT', 'Số Câu QT', 'Số Câu NQ', 'Số Câu TTD', 'Số Câu AX']);
    sheetRooms.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    // Demo data
    sheetRooms.appendRow(['SPM-2026', 'Kỳ Thi Nâng Bậc Nghề Đợt 1', '8899', 'TRUE', 'A', '5', 60, 50, 'Phòng thi chính thức có mã khóa', new Date(), 10, 10, 5, 5, 20]);
    sheetRooms.appendRow(['AT-Q1', 'Sát Hạch An Toàn Quý 1', '1234', 'FALSE', 'C', '6', 45, 40, 'Sát hạch định kỳ mở tự do', new Date(), 15, 15, 5, 5, 0]);
  }
  
  // 2. Sheet THI_SINH
  var sheetCandidates = ss.getSheetByName('THI_SINH');
  if (!sheetCandidates) {
    sheetCandidates = ss.insertSheet('THI_SINH');
    sheetCandidates.appendRow(['Thời Gian', 'Họ Và Tên', 'Mã NV', 'Bộ Phận', 'Bậc', 'Phòng Thi', 'Mã Đề', 'Điểm', 'Số Câu Đúng', 'Tổng Câu', 'Thời Gian Làm', 'Số Lần Rời Màn Hình', 'Trạng Thái']);
    sheetCandidates.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheetCandidates.appendRow([new Date(), 'Nguyễn Văn Hùng', 'SPM-0182', 'Nhà máy điện', '5', 'SPM-2026', 'A001', 9.2, 46, 50, '49p 20s', 0, 'ĐÃ NỘP BÀI']);
  }
  
  // 3. Sheet CAU_HOI
  var sheetQuestions = ss.getSheetByName('CAU_HOI');
  if (!sheetQuestions) {
    sheetQuestions = ss.insertSheet('CAU_HOI');
    sheetQuestions.appendRow(['ID', 'Nội Dung Câu Hỏi', 'Phương Án A', 'Phương Án B', 'Phương Án C', 'Phương Án D', 'Đáp Án Đúng', 'Nhóm', 'Bậc', 'Trích Dẫn Quy Trình', 'Giải Thích']);
    sheetQuestions.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    
    // Câu hỏi mẫu
    sheetQuestions.appendRow([
      'Q-001',
      'Khi thực hiện công việc có cắt điện tại trạm biến áp, thứ tự thực hiện các biện pháp kỹ thuật an toàn chuẩn xác là:',
      'Cắt điện -> Đặt tiếp đất -> Kiểm tra không còn điện -> Treo biển báo, rào chắn',
      'Cắt điện -> Kiểm tra không còn điện -> Đặt tiếp đất -> Treo biển báo, rào chắn',
      'Kiểm tra không còn điện -> Cắt điện -> Đặt tiếp đất -> Treo biển báo',
      'Đặt tiếp đất -> Cắt điện -> Kiểm tra không còn điện -> Treo biển báo',
      'B', 'AT', 'COMMON',
      'Quy trình An toàn điện - Điều 18',
      'Bắt buộc cắt điện -> Thử hết điện -> Đặt tiếp đất -> Treo biển cảnh báo.'
    ]);
    sheetQuestions.appendRow([
      'Q-002',
      'Khoảng cách an toàn tối thiểu đối với người đến phần mang điện cấp điện áp 110kV khi không có rào chắn là bao nhiêu?',
      '0.7 mét', '1.0 mét', '1.5 mét', '2.0 mét',
      'C', 'AT', 'COMMON',
      'Quy chuẩn Kỹ thuật An toàn điện QCVN 01:2020/BCT',
      'Cấp điện áp 110kV quy định khoảng cách an toàn tối thiểu là 1.5 mét.'
    ]);
  }
  
  return { status: 'ok', message: 'Khởi tạo cơ sở dữ liệu Google Sheets thành công!' };
}

/**
 * Lấy toàn bộ dữ liệu ban đầu cho ứng dụng
 */
function apiGetInitialData() {
  initDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Đọc Rooms
  var sheetRooms = ss.getSheetByName('PHONG_THI');
  var roomRows = sheetRooms.getDataRange().getValues();
  var rooms = [];
  for (var i = 1; i < roomRows.length; i++) {
    var r = roomRows[i];
    if (r[0]) {
      rooms.push({
        id: 'room-' + i,
        roomCode: String(r[0]),
        roomName: String(r[1]),
        accessPin: String(r[2] || ''),
        isLocked: String(r[3]).toUpperCase() === 'TRUE',
        unit: String(r[4] || 'A'),
        level: String(r[5] || '5'),
        examTimeMinutes: Number(r[6]) || 60,
        totalQuestions: Number(r[7]) || 50,
        description: String(r[8] || ''),
        maxFocusViolations: 3,
        groupCounts: {
          at: Number(r[10]) || Math.round((Number(r[7]) || 50) * 0.2),
          qt: Number(r[11]) || Math.round((Number(r[7]) || 50) * 0.2),
          nq: Number(r[12]) || Math.round((Number(r[7]) || 50) * 0.1),
          ttd: Number(r[13]) || Math.round((Number(r[7]) || 50) * 0.1),
          ax: Number(r[14]) || Math.round((Number(r[7]) || 50) * 0.4)
        },
        status: (String(r[3]).toUpperCase() === 'TRUE') ? 'locked' : 'active',
        createdAt: r[9] ? new Date(r[9]).toISOString() : new Date().toISOString()
      });
    }
  }
  
  // 2. Đọc Candidates
  var sheetCandidates = ss.getSheetByName('THI_SINH');
  var candRows = sheetCandidates.getDataRange().getValues();
  var candidates = [];
  for (var j = 1; j < candRows.length; j++) {
    var c = candRows[j];
    if (c[1]) {
      candidates.push({
        id: 'cand-' + j,
        fullName: String(c[1]),
        employeeCode: String(c[2] || ''),
        unit: String(c[3] || 'A'),
        unitName: String(c[3] || 'Nhà máy điện'),
        level: String(c[4] || '5'),
        roomCode: String(c[5] || ''),
        examCode: String(c[6] || ''),
        score: c[7] !== '' ? Number(c[7]) : undefined,
        correctCount: c[8] !== '' ? Number(c[8]) : undefined,
        totalQuestions: c[9] !== '' ? Number(c[9]) : undefined,
        status: String(c[12]).includes('VI PHẠM') ? 'violation' : (c[7] !== '' ? 'submitted' : 'testing'),
        focusViolations: Number(c[11]) || 0
      });
    }
  }
  
  // 3. Đọc Questions
  var sheetQuestions = ss.getSheetByName('CAU_HOI');
  var qRows = sheetQuestions.getDataRange().getValues();
  var questions = [];
  for (var k = 1; k < qRows.length; k++) {
    var q = qRows[k];
    if (q[1]) {
      questions.push({
        id: String(q[0] || ('Q-' + k)),
        number: String(k),
        question: String(q[1]),
        options: {
          A: String(q[2] || ''),
          B: String(q[3] || ''),
          C: String(q[4] || ''),
          D: String(q[5] || '')
        },
        correct: String(q[6] || 'A').toUpperCase().trim(),
        section: String(q[7] || 'AT'),
        level: String(q[8] || 'COMMON'),
        citation: String(q[9] || ''),
        explanation: String(q[10] || '')
      });
    }
  }
  
  return {
    rooms: rooms,
    candidates: candidates,
    questions: questions
  };
}

/**
 * Lưu kết quả bài thi của thí sinh vào Google Sheet THI_SINH
 */
function apiSubmitExam(attempt) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('THI_SINH');
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName('THI_SINH');
  }
  
  var elapsedText = Math.floor(attempt.elapsedSeconds / 60) + 'p ' + (attempt.elapsedSeconds % 60) + 's';
  sheet.appendRow([
    new Date(),
    attempt.candidateName,
    attempt.employeeCode || '',
    attempt.unitName || attempt.unit,
    attempt.level,
    attempt.roomCode,
    attempt.examCode,
    attempt.score,
    attempt.correct,
    attempt.total,
    elapsedText,
    attempt.focusViolations || 0,
    attempt.status || 'ĐÃ NỘP BÀI'
  ]);
  
  return { status: 'success' };
}

/**
 * Thêm hoặc Cập nhật Phòng thi
 */
function apiSaveRoom(room) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHONG_THI');
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName('PHONG_THI');
  }
  
  var rows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(room.roomCode)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  var gc = room.groupCounts || {};
  var rowData = [
    room.roomCode,
    room.roomName,
    room.accessPin || '',
    room.isLocked ? 'TRUE' : 'FALSE',
    room.unit || 'A',
    room.level || '5',
    room.examTimeMinutes || 60,
    room.totalQuestions || 50,
    room.description || '',
    new Date(),
    gc.at || 10,
    gc.qt || 10,
    gc.nq || 5,
    gc.ttd || 5,
    gc.ax || 20
  ];
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 15).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return { status: 'success' };
}

/**
 * Bật / Tắt Khóa Phòng Thi
 */
function apiToggleRoomLock(roomCode, isLocked) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHONG_THI');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(roomCode)) {
      sheet.getRange(i + 1, 4).setValue(isLocked ? 'TRUE' : 'FALSE');
      return { status: 'success', isLocked: isLocked };
    }
  }
  return { status: 'error', message: 'Không tìm thấy phòng thi' };
}

/**
 * Thêm danh sách câu hỏi mới vào Sheet CAU_HOI
 */
function apiAddQuestions(questions) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CAU_HOI');
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName('CAU_HOI');
  }
  
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    sheet.appendRow([
      q.id || ('Q-' + Date.now() + '-' + i),
      q.question,
      (q.options && q.options.A) || '',
      (q.options && q.options.B) || '',
      (q.options && q.options.C) || '',
      (q.options && q.options.D) || '',
      q.correct || 'A',
      q.section || 'AT',
      q.level || 'COMMON',
      q.citation || '',
      q.explanation || ''
    ]);
  }
  
  return { status: 'success', count: questions.length };
}

/**
 * Gọi Google AI (Gemini) từ Apps Script thông qua UrlFetchApp
 */
function apiCallGemini(prompt, imageBase64, mimeType) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return {
      status: 'fallback',
      text: 'Chưa cấu hình GEMINI_API_KEY trong Cài đặt tập lệnh (Project Settings > Script Properties).'
    };
  }
  
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
  
  var contents = [];
  var parts = [];
  
  if (imageBase64) {
    var cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64
      }
    });
  }
  
  parts.push({ text: prompt });
  contents.push({ parts: parts });
  
  var payload = {
    contents: contents,
    generationConfig: {
      temperature: 0.3
    }
  };
  
  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    var json = JSON.parse(response.getContentText());
    var textOutput = json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0].text;
    
    return {
      status: 'success',
      text: textOutput || 'Không nhận được câu trả lời từ AI.'
    };
  } catch (e) {
    return {
      status: 'error',
      message: e.toString()
    };
  }
}
