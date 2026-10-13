import { ExamRoom, Candidate, Question, DepartmentInfo, OrganizationConfig, RecycleBinItem, ExamAttempt, SystemBackupData } from '../types/exam';
import { getSavedOrgConfig, saveOrgConfig } from './organizationStorage';

export const SYSTEM_BACKUP_VERSION = '1.0.0';

/**
 * Thu thập và xuất toàn bộ dữ liệu hệ thống ra đối tượng SystemBackupData
 */
export function createSystemBackupData(
  rooms: ExamRoom[],
  candidates: Candidate[],
  questions: Question[],
  departments: DepartmentInfo[]
): SystemBackupData {
  let recycleBin: RecycleBinItem[] = [];
  try {
    const rawRecycle = localStorage.getItem('spmo_recycle_bin_questions');
    if (rawRecycle) recycleBin = JSON.parse(rawRecycle);
  } catch {
    // ignore
  }

  let attempts: ExamAttempt[] = [];
  try {
    const rawAttempts = localStorage.getItem('spmo_all_attempts_v9');
    if (rawAttempts) attempts = JSON.parse(rawAttempts);
  } catch {
    // ignore
  }

  const orgConfig = getSavedOrgConfig();

  return {
    version: SYSTEM_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    systemName: 'SPMO Pro - Hệ Thống Thi Trắc Nghiệm EVN',
    questions: questions || [],
    rooms: rooms || [],
    candidates: candidates || [],
    departments: departments || [],
    orgConfig,
    recycleBin,
    attempts,
  };
}

/**
 * Tải file JSON sao lưu về máy tính của người dùng
 */
export function downloadSystemBackupFile(backupData: SystemBackupData) {
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  link.href = url;
  link.download = `SPMO_PRO_BACKUP_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Kiểm tra tính hợp lệ của file backup JSON
 */
export function parseAndValidateBackupJson(jsonString: string): {
  success: boolean;
  data?: SystemBackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Định dạng file không phải JSON hợp lệ' };
    }

    if (!Array.isArray(parsed.questions)) {
      return { success: false, error: 'Dữ liệu câu hỏi (questions) không hợp lệ hoặc bị thiếu' };
    }

    if (!Array.isArray(parsed.rooms)) {
      return { success: false, error: 'Dữ liệu phòng thi (rooms) không hợp lệ hoặc bị thiếu' };
    }

    return { success: true, data: parsed as SystemBackupData };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Không thể giải mã file JSON' };
  }
}

/**
 * Áp dụng khôi phục dữ liệu vào localStorage
 */
export function applyRestoredBackup(
  backupData: SystemBackupData,
  mode: 'overwrite' | 'merge',
  currentData: {
    rooms: ExamRoom[];
    candidates: Candidate[];
    questions: Question[];
    departments: DepartmentInfo[];
  }
) {
  let finalQuestions = backupData.questions || [];
  let finalRooms = backupData.rooms || [];
  let finalCandidates = backupData.candidates || [];
  let finalDepartments = backupData.departments || [];

  if (mode === 'merge') {
    // Gộp câu hỏi theo ID
    const qMap = new Map<string, Question>();
    currentData.questions.forEach((q) => qMap.set(q.id, q));
    finalQuestions.forEach((q) => qMap.set(q.id, q));
    finalQuestions = Array.from(qMap.values());

    // Gộp phòng thi theo ID / roomCode
    const rMap = new Map<string, ExamRoom>();
    currentData.rooms.forEach((r) => rMap.set(r.id || r.roomCode, r));
    finalRooms.forEach((r) => rMap.set(r.id || r.roomCode, r));
    finalRooms = Array.from(rMap.values());

    // Gộp thí sinh theo ID / fullName+roomCode
    const cMap = new Map<string, Candidate>();
    currentData.candidates.forEach((c) => cMap.set(c.id || `${c.fullName}_${c.roomCode}`, c));
    finalCandidates.forEach((c) => cMap.set(c.id || `${c.fullName}_${c.roomCode}`, c));
    finalCandidates = Array.from(cMap.values());

    // Gộp bộ phận
    const dMap = new Map<string, DepartmentInfo>();
    currentData.departments.forEach((d) => dMap.set(d.code, d));
    finalDepartments.forEach((d) => dMap.set(d.code, d));
    finalDepartments = Array.from(dMap.values());
  }

  // Lưu vào localStorage
  try {
    localStorage.setItem('spmo_questions_v9', JSON.stringify(finalQuestions));
    localStorage.setItem('spmo_rooms_v9', JSON.stringify(finalRooms));
    localStorage.setItem('spmo_candidates_v9', JSON.stringify(finalCandidates));
    localStorage.setItem('spmo_departments_v9', JSON.stringify(finalDepartments));

    if (backupData.orgConfig) {
      saveOrgConfig(backupData.orgConfig);
    }

    if (backupData.recycleBin) {
      localStorage.setItem('spmo_recycle_bin_questions', JSON.stringify(backupData.recycleBin));
    }

    if (backupData.attempts) {
      localStorage.setItem('spmo_all_attempts_v9', JSON.stringify(backupData.attempts));
    }
  } catch (e) {
    console.error('Lỗi khi lưu backup vào LocalStorage', e);
  }

  return {
    questions: finalQuestions,
    rooms: finalRooms,
    candidates: finalCandidates,
    departments: finalDepartments,
    orgConfig: backupData.orgConfig || getSavedOrgConfig(),
  };
}
