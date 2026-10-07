import { Question, ExamRoom, DepartmentInfo } from '../types/exam';

export interface ParsedQuestionMeta {
  groupType: 'AT' | 'NQ' | 'QT' | 'TTD' | 'CHUYEN_MON';
  unit: string; // 'COMMON' or 'A', 'B', 'C', 'D'
  levelNumber: number | null; // 1, 2, 3, 4, 5, 6, 7, 8 or null for COMMON
  subGroup?: string; // '1', '2', '3'
  rawCode: string; // e.g. 'A1.1', 'A5.1', 'TTD.5', 'AT', 'NQ'
}

/**
 * Bộ phận của câu hỏi dùng chung (AT/QT/NQ/TTD): mặc định 'COMMON' (mọi bộ phận dùng chung),
 * nhưng nếu câu hỏi được gán riêng cho một bộ phận (unit = 'A', 'B'...) thì chỉ phòng thi của bộ phận đó mới bốc.
 */
function sharedGroupUnit(questionUnit?: string): string {
  const u = (questionUnit || '').toUpperCase().trim();
  return u && u !== 'COMMON' ? u : 'COMMON';
}

/** So khớp bộ phận câu hỏi với bộ phận phòng thi (A tương thích mã cũ CNVH) */
export function unitMatches(qUnit: string, targetUnit: string): boolean {
  const q = (qUnit || '').toUpperCase();
  const t = (targetUnit || '').toUpperCase();
  return q === t || (t === 'A' && q === 'CNVH');
}

/**
 * Phân tích mã câu hỏi theo quy tắc:
 * - AT: Kỹ thuật an toàn điện & BHLĐ (Chung các bậc)
 * - NQ: Nội quy lao động (Chung các bậc)
 * - QT: Quy trình kỹ thuật (Chung các bậc)
 * - TTD.X: Thị trường điện / Điều độ (X là bậc)
 * - AX.1: A là bộ câu hỏi bộ phận (A: Vận hành, B: XSC cơ, C: Trưởng ca, D: XSC điện), X là bậc, 1..n là số thứ tự
 */
export function parseQuestionCode(
  section: string,
  questionLevel?: string,
  questionUnit?: string
): ParsedQuestionMeta {
  const code = (section || '').trim().toUpperCase();

  // 1. AT: An toàn chung cho các bậc
  if (code === 'AT' || code.startsWith('AT.') || code.startsWith('AT-') || code.startsWith('AT_')) {
    return { groupType: 'AT', unit: sharedGroupUnit(questionUnit), levelNumber: null, rawCode: 'AT' };
  }

  // 2. NQ: Nội quy chung cho các bậc
  if (code === 'NQ' || code.startsWith('NQ.') || code.startsWith('NQ-') || code.startsWith('NQ_')) {
    return { groupType: 'NQ', unit: sharedGroupUnit(questionUnit), levelNumber: null, rawCode: 'NQ' };
  }

  // 3. QT: Quy trình chung cho các bậc
  if (code === 'QT' || code.startsWith('QT.') || code.startsWith('QT-') || code.startsWith('QT_')) {
    return { groupType: 'QT', unit: sharedGroupUnit(questionUnit), levelNumber: null, rawCode: 'QT' };
  }

  // 4. TTD.X: Thị trường điện / Điều độ theo bậc (X là bậc 1..8)
  const ttdMatch = code.match(/^TTD(?:[.\-_](\d+))?/i);
  if (ttdMatch) {
    let lvl: number | null = null;
    if (ttdMatch[1]) {
      lvl = parseInt(ttdMatch[1], 10);
    } else if (questionLevel && !isNaN(parseInt(questionLevel.replace(/\D/g, ''), 10))) {
      lvl = parseInt(questionLevel.replace(/\D/g, ''), 10);
    }
    return {
      groupType: 'TTD',
      unit: sharedGroupUnit(questionUnit),
      levelNumber: lvl,
      rawCode: lvl ? `TTD.${lvl}` : 'TTD',
    };
  }

  // 5. AX.n (ví dụ A1.1, A2.1, A5.1, B4.2, C6.1, D3.1...)
  const axMatch = code.match(/^([A-Za-z]+)(\d+)(?:[.\-_](\d+))?/);
  if (axMatch) {
    const dept = axMatch[1].toUpperCase();
    const lvl = parseInt(axMatch[2], 10);
    const sub = axMatch[3] || '1';
    return {
      groupType: 'CHUYEN_MON',
      unit: dept,
      levelNumber: lvl,
      subGroup: sub,
      rawCode: `${dept}${lvl}.${sub}`,
    };
  }

  // Fallback: nếu questionLevel hoặc questionUnit được cung cấp
  let inferredLvl: number | null = null;
  if (questionLevel) {
    const num = questionLevel.replace(/\D/g, '');
    if (num) inferredLvl = parseInt(num, 10);
  }

  const inferredUnit = (questionUnit || (code.length === 1 ? code : 'A')).toUpperCase();
  return {
    groupType: 'CHUYEN_MON',
    unit: inferredUnit,
    levelNumber: inferredLvl,
    rawCode: code || 'CM',
  };
}

/**
 * Trích xuất cấp bậc dạng số (1..8) của câu hỏi
 */
export function getQuestionLevelNumber(q: Question): number | null {
  const meta = parseQuestionCode(q.section, q.level, q.unit);
  return meta.levelNumber;
}

/**
 * Trích xuất bộ phận ('A', 'B', 'C', 'D' hoặc 'COMMON') của câu hỏi
 */
export function getQuestionDepartment(q: Question): string {
  const meta = parseQuestionCode(q.section, q.level, q.unit);
  return meta.unit;
}

/**
 * Lọc danh sách câu hỏi hợp lệ cho một phòng thi:
 * - Kho đề riêng biệt theo Bộ phận (room.unit):
 *   + AT, NQ, QT: Chung cho các bậc và các bộ phận
 *   + TTD.X: Lấy nếu bậc của câu hỏi <= bậc thi (hoặc TTD chung)
 *   + Chuyên môn (AX.n): CHỈ LẤY các câu hỏi thuộc bộ phận room.unit VÀ có bậc từ 1 đến bậc thi!
 *   + Câu hỏi của bộ phận khác (B, D...) hoặc bậc > bậc thi TUYỆT ĐỐI BỊ LOẠI BỎ.
 */
export function filterQuestionsForRoom(questions: Question[], room: ExamRoom) {
  const targetUnit = (room.unit || 'A').toUpperCase();
  const targetLevel = parseInt(String(room.level || '5').replace(/\D/g, ''), 10) || 5;

  const atPool: Question[] = [];
  const nqPool: Question[] = [];
  const qtPool: Question[] = [];
  const ttdPool: Question[] = [];
  // Pool chuyên môn được phân loại theo từng bậc (1..targetLevel)
  const axPoolByLevel: Record<number, Question[]> = {};
  const axAllEligiblePool: Question[] = [];

  for (let lv = 1; lv <= targetLevel; lv++) {
    axPoolByLevel[lv] = [];
  }

  questions.forEach((q) => {
    const meta = parseQuestionCode(q.section, q.level, q.unit);

    // Câu AT/QT/NQ/TTD gán riêng cho bộ phận khác thì không đưa vào phòng này
    if (meta.groupType !== 'CHUYEN_MON' && meta.unit !== 'COMMON' && !unitMatches(meta.unit, targetUnit)) {
      return;
    }

    if (meta.groupType === 'AT') {
      atPool.push(q);
    } else if (meta.groupType === 'NQ') {
      nqPool.push(q);
    } else if (meta.groupType === 'QT') {
      qtPool.push(q);
    } else if (meta.groupType === 'TTD') {
      // TTD.X: chỉ lấy nếu không có bậc (chung) HOẶC bậc <= bậc thi
      if (meta.levelNumber === null || meta.levelNumber <= targetLevel) {
        ttdPool.push(q);
      }
    } else {
      // Chuyên môn (AX.n):
      // 1. Phải đúng bộ phận của phòng thi (ví dụ A chỉ lấy A, không lấy B, C, D)
      const qUnit = (meta.unit || q.unit || 'A').toUpperCase();
      const isMatchingUnit = qUnit === 'COMMON' || unitMatches(qUnit, targetUnit);

      if (isMatchingUnit) {
        const qLvl = meta.levelNumber;
        // 2. Nguyên tắc lấy câu hỏi ở bậc thi: lấy từ bậc thấp nhất (1) đến bậc thi (<= targetLevel)
        if (qLvl === null) {
          // Câu chung chuyên môn: cho vào bậc thi hiện tại
          axAllEligiblePool.push(q);
          if (axPoolByLevel[targetLevel]) axPoolByLevel[targetLevel].push(q);
        } else if (qLvl >= 1 && qLvl <= targetLevel) {
          axAllEligiblePool.push(q);
          if (axPoolByLevel[qLvl]) {
            axPoolByLevel[qLvl].push(q);
          } else {
            axPoolByLevel[qLvl] = [q];
          }
        }
        // Ghi chú: Nếu qLvl > targetLevel (ví dụ thi bậc 4 nhưng câu hỏi bậc 5, 6, 7) thì BỎ QUA!
      }
    }
  });

  return {
    targetUnit,
    targetLevel,
    atPool,
    nqPool,
    qtPool,
    ttdPool,
    axPoolByLevel,
    axAllEligiblePool,
  };
}

/**
 * Tự động phân bổ số câu chuyên môn (totalAx) cho các bậc từ 1 đến targetLevel:
 * Nguyên tắc lấy câu hỏi ở bậc thi: Lấy các câu hỏi từ bậc thấp nhất (1) đến bậc thi.
 * Hỗ trợ preset:
 * - 'ladder' (Lũy tiến): Bậc cao có tỷ lệ câu hỏi tăng dần
 * - 'even' (Chia đều): Số câu xấp xỉ bằng nhau ở các bậc
 * - 'focus_target' (Tập trung bậc thi): ~50% cho bậc thi, 50% chia đều cho các bậc dưới
 */
export function autoDistributeLevelCounts(
  totalAx: number,
  targetLevel: number,
  availableByLevel: Record<number, number>,
  preset: 'ladder' | 'even' | 'focus_target' = 'ladder'
): Record<number, number> {
  const result: Record<number, number> = {};
  const levels: number[] = [];
  for (let lv = 1; lv <= targetLevel; lv++) {
    levels.push(lv);
    result[lv] = 0;
  }

  if (levels.length === 0 || totalAx <= 0) return result;

  // Tính trọng số phân bổ
  const weights: Record<number, number> = {};
  let totalWeight = 0;

  if (preset === 'even') {
    levels.forEach((lv) => {
      weights[lv] = 1;
      totalWeight += 1;
    });
  } else if (preset === 'focus_target') {
    levels.forEach((lv) => {
      const w = lv === targetLevel ? Math.max(levels.length, 3) : 1;
      weights[lv] = w;
      totalWeight += w;
    });
  } else {
    // 'ladder' (Lũy tiến: 1, 2, 3, 4, 5...)
    levels.forEach((lv, idx) => {
      const w = idx + 1;
      weights[lv] = w;
      totalWeight += w;
    });
  }

  let allocated = 0;
  levels.forEach((lv) => {
    const raw = Math.round((weights[lv] / totalWeight) * totalAx);
    const avail = availableByLevel[lv] || 0;
    const capped = avail > 0 ? Math.min(raw, avail) : raw;
    result[lv] = capped;
    allocated += capped;
  });

  // Điều chỉnh chênh lệch sao cho tổng đúng bằng totalAx
  let diff = totalAx - allocated;
  if (diff > 0) {
    for (let i = levels.length - 1; i >= 0 && diff > 0; i--) {
      const lv = levels[i];
      const avail = availableByLevel[lv] || 0;
      const canAdd = avail > result[lv] ? avail - result[lv] : diff;
      const add = Math.min(diff, canAdd);
      result[lv] += add;
      diff -= add;
    }
    // Nếu kho không đủ, cộng vào bậc thi cao nhất
    if (diff > 0) {
      result[targetLevel] = (result[targetLevel] || 0) + diff;
    }
  } else if (diff < 0) {
    for (let i = 0; i < levels.length && diff < 0; i++) {
      const lv = levels[i];
      if (result[lv] > 0) {
        const sub = Math.min(result[lv], Math.abs(diff));
        result[lv] -= sub;
        diff += sub;
      }
    }
  }

  return result;
}

/**
 * Trộn ngẫu nhiên mảng
 */
export function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * Hàm sinh đề thi chuẩn xác cho một phòng thi:
 * - Đúng bộ phận (Kho đề riêng của bộ phận + AT, NQ)
 * - Đúng nguyên tắc bậc thi (Chỉ lấy câu hỏi từ bậc thấp nhất 1 đến bậc thi)
 * - Đúng số câu của từng bậc theo cấu hình Tự động hoặc Tùy chỉnh
 */
export function generateExamForRoom(room: ExamRoom, allQuestions: Question[]): Question[] {
  const {
    targetLevel,
    atPool,
    nqPool,
    qtPool,
    ttdPool,
    axPoolByLevel,
    axAllEligiblePool,
  } = filterQuestionsForRoom(allQuestions, room);

  const counts = room.groupCounts || {
    at: Math.round(room.totalQuestions * 0.2),
    qt: Math.round(room.totalQuestions * 0.2),
    nq: Math.round(room.totalQuestions * 0.1),
    ttd: Math.round(room.totalQuestions * 0.1),
    ax: Math.round(room.totalQuestions * 0.4),
  };

  const selectedQuestions: Question[] = [];
  const selectedIds = new Set<string>();

  const pickFromPool = (pool: Question[], needed: number) => {
    const available = shuffleArray(pool.filter((q) => !selectedIds.has(q.id)));
    const picked = available.slice(0, needed);
    picked.forEach((q) => {
      selectedIds.add(q.id);
      selectedQuestions.push(q);
    });
    return picked.length;
  };

  // 1. An Toàn (AT)
  pickFromPool(atPool, counts.at || 0);

  // 2. Nội Quy (NQ)
  pickFromPool(nqPool, counts.nq || 0);

  // 3. Quy Trình (QT)
  pickFromPool(qtPool, counts.qt || 0);

  // 4. Thị Trường Điện (TTD - đã lọc <= targetLevel)
  pickFromPool(ttdPool, counts.ttd || 0);

  // 5. Chuyên môn (AX.n) theo Bậc thi tích lũy (Bậc 1..targetLevel)
  const totalAxNeeded = counts.ax || 0;
  if (totalAxNeeded > 0) {
    const levelDist = room.levelDistribution;
    let allocatedLevelCounts: Record<number, number> = {};

    if (levelDist && levelDist.mode === 'manual' && levelDist.counts) {
      // Chế độ Tùy chỉnh (Manual): lấy theo cấu hình người dùng đã đặt cho từng bậc
      for (let lv = 1; lv <= targetLevel; lv++) {
        allocatedLevelCounts[lv] = levelDist.counts[String(lv)] || 0;
      }
    } else {
      // Chế độ Tự động (Auto): phân bổ tích lũy theo bậc thang từ 1..targetLevel
      const availByLvl: Record<number, number> = {};
      for (let lv = 1; lv <= targetLevel; lv++) {
        availByLvl[lv] = (axPoolByLevel[lv] || []).length;
      }
      allocatedLevelCounts = autoDistributeLevelCounts(
        totalAxNeeded,
        targetLevel,
        availByLvl,
        levelDist?.preset || 'ladder'
      );
    }

    // Bốc câu hỏi cho từng bậc từ 1..targetLevel
    for (let lv = 1; lv <= targetLevel; lv++) {
      const neededForLvl = allocatedLevelCounts[lv] || 0;
      if (neededForLvl > 0) {
        pickFromPool(axPoolByLevel[lv] || [], neededForLvl);
      }
    }

    // Nếu bậc nào đó thiếu trong kho, bù từ các câu chuyên môn hợp lệ khác của bộ phận (1..targetLevel)
    const currentAxCount = selectedQuestions.filter((q) => {
      const meta = parseQuestionCode(q.section, q.level, q.unit);
      return meta.groupType === 'CHUYEN_MON';
    }).length;

    if (currentAxCount < totalAxNeeded) {
      pickFromPool(axAllEligiblePool, totalAxNeeded - currentAxCount);
    }
  }

  // Backfill nếu chưa đủ tổng số câu:
  // CHỈ lấy từ kho câu hỏi hợp lệ của bộ phận này và <= targetLevel, hoặc AT, NQ!
  // Tuyệt đối không lấy từ bộ phận khác hoặc câu có bậc > targetLevel!
  if (selectedQuestions.length < room.totalQuestions) {
    const remainingEligiblePool = [
      ...atPool,
      ...nqPool,
      ...qtPool,
      ...ttdPool,
      ...axAllEligiblePool,
    ].filter((q) => !selectedIds.has(q.id));

    pickFromPool(remainingEligiblePool, room.totalQuestions - selectedQuestions.length);
  }

  return selectedQuestions.slice(0, room.totalQuestions);
}



/**
 * Chuẩn hóa mã nhóm / bộ phận / bậc cho câu hỏi nhập từ Word, AI, thủ công
 * để mọi nguồn nhập đều cho cùng một cấu trúc dữ liệu:
 *  - AT / QT / NQ : section 'AT'..., level 'COMMON', unit = 'COMMON' hoặc bộ phận được chọn
 *  - TTD          : section 'TTD.<bậc>', level '<bậc>'
 *  - Chuyên môn   : section '<Bộ phận><bậc>.<nhóm con>' (VD A5.1), unit '<Bộ phận>', level '<bậc>'
 */
export function normalizeImportedMeta(
  sectionCode: string,
  sharedUnit: string = 'COMMON'
): { section: string; unit: string; level: string; subGroup?: string } {
  const meta = parseQuestionCode(sectionCode);
  const shared = sharedGroupUnit(sharedUnit);
  if (meta.groupType === 'AT' || meta.groupType === 'QT' || meta.groupType === 'NQ') {
    return { section: meta.groupType, unit: shared, level: 'COMMON' };
  }
  if (meta.groupType === 'TTD') {
    return {
      section: meta.levelNumber ? `TTD.${meta.levelNumber}` : 'TTD',
      unit: shared,
      level: meta.levelNumber ? String(meta.levelNumber) : 'COMMON',
    };
  }
  return {
    section: meta.rawCode,
    unit: meta.unit,
    level: meta.levelNumber ? String(meta.levelNumber) : 'COMMON',
    subGroup: meta.subGroup,
  };
}

/** Kiểm tra kho đề có đủ câu cho cấu hình phòng thi hay không (trả về danh sách cảnh báo) */
export function getRoomShortages(
  room: ExamRoom,
  questions: Question[],
  counts: { at?: number; qt?: number; nq?: number; ttd?: number; ax?: number }
): string[] {
  const el = filterQuestionsForRoom(questions, room);
  const out: string[] = [];
  const chk = (label: string, need: number | undefined, have: number) => {
    if ((need || 0) > have) out.push(`${label}: cần ${need} câu, kho chỉ có ${have}`);
  };
  chk('An toàn (AT)', counts.at, el.atPool.length);
  chk('Quy trình (QT)', counts.qt, el.qtPool.length);
  chk('Nội quy (NQ)', counts.nq, el.nqPool.length);
  chk('Điều độ (TTD)', counts.ttd, el.ttdPool.length);
  chk('Chuyên môn (AX)', counts.ax, el.axAllEligiblePool.length);
  return out;
}
