import mammoth from 'mammoth';
import { Question } from '../types/exam';

/* ------------------------------------------------------------------ *
 *  Đọc file Word / văn bản thành danh sách câu hỏi trắc nghiệm.
 *
 *  Định dạng hỗ trợ:
 *    Câu 1: Nội dung câu hỏi?          (hoặc "1." / "1)" / "Câu 1." / "Câu 1)")
 *    A. Phương án A                    (hoặc "A)" / "A:" / "A-")
 *    B. Phương án B
 *    C. ...   D. ...                   (có thể để cả 4 phương án trên 1 dòng)
 *    Đáp án: B                         (hoặc "ĐA: A, C") - hoặc in đậm đáp án đúng
 *    Giải thích: ...                   (tuỳ chọn)
 *    Trích dẫn: ...                    (tuỳ chọn: Căn cứ / Nguồn)
 *
 *  Một file có thể chứa nhiều nhóm: chèn dòng riêng dạng [A5.1], [AT], [TTD.5]...
 *  để các câu phía sau thuộc nhóm đó.
 * ------------------------------------------------------------------ */

export interface ParsedQuestionDraft extends Question {
  /** Mã nhóm tìm thấy trong file (dòng [A5.1]...) hoặc mã mặc định truyền vào */
  section: string;
}

export interface ParseResult {
  questions: ParsedQuestionDraft[];
  warnings: string[];
}

interface Block {
  text: string;
  /** Độ dài phần chữ in đậm (không tính nhãn A. B. C.) */
  boldLen: number;
  /** Đoạn nằm trong danh sách tự đánh số của Word (mất nhãn "A." "1.") */
  fromList: boolean;
}

function cleanText(s: string): string {
  return (s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const OPTION_LABEL = /^(?:([A-D])\s*[\.\):\-]|([a-d])\s*\))\s*(.*)$/;

function matchOption(text: string): { key: string; body: string; labelLen: number } | null {
  const m = text.match(OPTION_LABEL);
  if (!m) return null;
  const body = m[3] || '';
  return { key: (m[1] || m[2]).toUpperCase(), body, labelLen: text.slice(0, text.length - body.length).trim().length };
}
const QUESTION_START = /^(?:Câu\s*(\d+)\s*[\.\):\-]?\s*|(\d+)\s*[\.\)]\s+)(.*)$/i;
const ANSWER_LINE = /^(?:ĐÁP\s*ÁN(?:\s*ĐÚNG)?|ĐA)\s*[:\-]?\s*([ABCD](?:\s*(?:,|;|\/|&|và)\s*[ABCD])*)(?![A-Za-zÀ-ỹ])/i;
const EXPLAIN_LINE = /^Giải\s*thích\s*[:\-]\s*(.*)$/i;
const CITATION_LINE = /^(?:Trích\s*dẫn|Căn\s*cứ|Nguồn|Ghi\s*chú)\s*[:\-]\s*(.*)$/i;
const SECTION_HEADER = /^[\[\(【]\s*(AT|QT|NQ|TTD(?:[.\-_]\d+)?|[A-Z]{1,4}\d+(?:[.\-_]\d+)?)\s*[\]\)】]$/i;

/** Tách dòng chứa nhiều phương án: "A. xx B. yy C. zz D. tt" */
function splitInlineOptions(text: string): string[] {
  if (!/^A\s*[\.\)]/.test(text)) return [text];
  const parts = text.split(/\s+(?=[B-D]\s*[\.\)]\s)/);
  if (parts.length < 2) return [text];
  return parts;
}

/* ---------------------------- HTML -> Block ----------------------------- */

function boldLength(el: Element): number {
  let total = 0;
  el.querySelectorAll('strong, b').forEach((node) => {
    // bỏ qua thẻ bold lồng bên trong bold khác để không đếm 2 lần
    if (node.parentElement && node.parentElement.closest('strong, b') && el.contains(node.parentElement.closest('strong, b'))) {
      return;
    }
    total += cleanText(node.textContent || '').length;
  });
  return total;
}

function htmlToBlocks(html: string): Block[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  const blocks: Block[] = [];

  const pushEl = (el: Element, fromList: boolean) => {
    const text = cleanText(el.textContent || '');
    if (!text) return;
    blocks.push({ text, boldLen: boldLength(el), fromList });
  };

  const walk = (el: Element, fromList: boolean) => {
    const tag = el.tagName.toUpperCase();
    if (tag === 'OL' || tag === 'UL') {
      Array.from(el.children).forEach((li) => walk(li, true));
    } else if (tag === 'TABLE') {
      el.querySelectorAll('tr').forEach((tr) => {
        Array.from(tr.children).forEach((cell) => {
          const paras = cell.querySelectorAll('p');
          if (paras.length > 0) paras.forEach((p) => pushEl(p, false));
          else pushEl(cell, false);
        });
      });
    } else if (tag === 'LI') {
      // li có thể chứa danh sách con
      const nested = el.querySelector('ol, ul');
      if (nested) {
        const clone = el.cloneNode(true) as Element;
        clone.querySelectorAll('ol, ul').forEach((n) => n.remove());
        pushEl(clone, true);
        Array.from(nested.children).forEach((li) => walk(li, true));
      } else {
        pushEl(el, true);
      }
    } else {
      pushEl(el, fromList);
    }
  };

  Array.from(container.children).forEach((el) => walk(el, false));
  return blocks;
}

function textToBlocks(raw: string): Block[] {
  return raw
    .split(/\r?\n/)
    .map(cleanText)
    .filter(Boolean)
    .map((text) => ({ text, boldLen: 0, fromList: false }));
}

/* ------------------------------ Core parser ----------------------------- */

interface Draft {
  number: string;
  question: string;
  options: Record<string, string>;
  boldKeys: string[];
  explicitCorrect: string;
  citation: string;
  explanation: string;
  section: string;
}

function parseBlocks(blocks: Block[], defaultSection: string, defaultLevel: string): ParseResult {
  const questions: ParsedQuestionDraft[] = [];
  const warnings: string[] = [];
  const skippedNoAnswer: string[] = [];
  const skippedFewOptions: string[] = [];
  let currentSection = defaultSection;
  let current: Draft | null = null;
  let seq = 0;
  const stamp = Date.now().toString(36);

  const finalize = () => {
    if (!current) return;
    const d = current;
    current = null;
    const label = `Câu ${d.number}`;
    const keys = Object.keys(d.options);

    if (!d.question || keys.length < 2) {
      if (d.question) skippedFewOptions.push(label);
      return;
    }

    // Đáp án: ưu tiên "Đáp án: X" ghi rõ; nếu không có thì dùng chữ in đậm
    let correct = d.explicitCorrect;
    if (!correct) {
      // nếu TẤT CẢ phương án đều in đậm thì coi như định dạng chung, không phải đáp án
      const allBold = d.boldKeys.length === keys.length;
      if (!allBold && d.boldKeys.length > 0) {
        correct = Array.from(new Set(d.boldKeys)).sort().join('');
      }
    }
    if (!correct) {
      skippedNoAnswer.push(label);
      return;
    }
    // đáp án phải nằm trong các phương án có thật
    const valid = correct.split('').filter((c) => d.options[c] !== undefined);
    if (valid.length === 0) {
      skippedNoAnswer.push(label);
      return;
    }

    seq += 1;
    questions.push({
      id: `imp-${stamp}-${Math.random().toString(36).slice(2, 6)}-${seq}`,
      number: d.number,
      question: d.question,
      options: d.options,
      correct: valid.join(''),
      section: d.section,
      level: defaultLevel,
      citation: d.citation,
      explanation: d.explanation,
    });
  };

  const addOption = (cur: Draft, key: string, body: string, block: Block, labelLen: number) => {
    cur.options[key] = body;
    const bodyLen = Math.max(body.length, 1);
    // đáp án đúng: phần in đậm vượt qua nhãn "A." và phủ phần lớn nội dung phương án
    if (block.boldLen > labelLen && block.boldLen >= 0.6 * bodyLen) {
      cur.boldKeys.push(key);
    }
  };

  for (const block of blocks) {
    const text = block.text;

    // Dòng đổi nhóm: [A5.1]
    const header = text.match(SECTION_HEADER);
    if (header) {
      finalize();
      currentSection = header[1].toUpperCase().replace(/[\-_]/g, '.');
      continue;
    }

    // Bắt đầu câu hỏi
    const qm = text.match(QUESTION_START);
    if (qm) {
      finalize();
      current = {
        number: qm[1] || qm[2] || String(seq + 1),
        question: cleanText(qm[3] || ''),
        options: {},
        boldKeys: [],
        explicitCorrect: '',
        citation: '',
        explanation: '',
        section: currentSection,
      };
      continue;
    }

    // Đáp án / giải thích / trích dẫn
    const am = text.match(ANSWER_LINE);
    if (am && current) {
      const letters = (am[1].match(/[ABCD]/gi) || []).map((l) => l.toUpperCase());
      current.explicitCorrect = Array.from(new Set(letters)).sort().join('');
      continue;
    }
    const em = text.match(EXPLAIN_LINE);
    if (em && current) {
      current.explanation = cleanText(em[1]);
      continue;
    }
    const cm = text.match(CITATION_LINE);
    if (cm && current) {
      current.citation = cleanText(cm[1]);
      continue;
    }

    // Phương án trả lời (có thể nhiều phương án trên một dòng)
    const pieces = splitInlineOptions(text);
    const firstOpt = matchOption(pieces[0]);
    if (firstOpt) {
      if (!current) continue;
      const cur: Draft = current;
      pieces.forEach((piece, idx) => {
        const m = matchOption(piece);
        if (m) {
          addOption(cur, m.key, cleanText(m.body), idx === 0 && pieces.length === 1 ? block : { ...block, boldLen: 0 }, m.labelLen);
        }
      });
      continue;
    }

    // Đoạn trong danh sách tự đánh số của Word (nhãn "A." / "1." bị Word ẩn)
    if (block.fromList) {
      const optCount = current ? Object.keys((current as Draft).options).length : 0;
      if (current && optCount < 4 && (current as Draft).question) {
        const key = String.fromCharCode(65 + optCount);
        addOption(current as Draft, key, text, block, 0);
        continue;
      }
      finalize();
      current = {
        number: String(seq + 1),
        question: text,
        options: {},
        boldKeys: [],
        explicitCorrect: '',
        citation: '',
        explanation: '',
        section: currentSection,
      };
      continue;
    }

    // Dòng nối tiếp nội dung câu hỏi (khi chưa có phương án nào)
    if (current && Object.keys((current as Draft).options).length === 0) {
      (current as Draft).question = `${(current as Draft).question} ${text}`.trim();
    } else if (current) {
      // dòng nối tiếp của phương án cuối cùng
      const cur: Draft = current;
      const keys = Object.keys(cur.options);
      const last = keys[keys.length - 1];
      if (last && !/^(Câu|Đáp)/i.test(text)) {
        cur.options[last] = `${cur.options[last]} ${text}`.trim();
      }
    }
  }

  finalize();

  if (skippedNoAnswer.length > 0) {
    warnings.push(
      `Bỏ qua ${skippedNoAnswer.length} câu không xác định được đáp án đúng (${skippedNoAnswer
        .slice(0, 15)
        .join(', ')}${skippedNoAnswer.length > 15 ? '...' : ''}). Hãy in đậm phương án đúng hoặc thêm dòng "Đáp án: X".`
    );
  }
  if (skippedFewOptions.length > 0) {
    warnings.push(
      `Bỏ qua ${skippedFewOptions.length} câu có ít hơn 2 phương án (${skippedFewOptions
        .slice(0, 15)
        .join(', ')}${skippedFewOptions.length > 15 ? '...' : ''}).`
    );
  }
  return { questions, warnings };
}

/* ------------------------------ Public API ------------------------------ */

export interface DocxContent {
  html: string;
  text: string;
}

/** Đọc file .docx một lần, trả về cả HTML (giữ chữ in đậm) và văn bản thô */
export async function readDocxContent(file: File): Promise<DocxContent> {
  const arrayBuffer = await file.arrayBuffer();
  const [{ value: html }, { value: text }] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ]);
  return { html, text };
}

/** Phân tích nội dung đã đọc: ưu tiên HTML (có in đậm), nếu không ra câu nào thì thử văn bản thô */
export function parseWordContent(
  content: DocxContent,
  section: string,
  level: string
): ParseResult {
  const fromHtml = parseBlocks(htmlToBlocks(content.html), section, level);
  if (fromHtml.questions.length > 0 || fromHtml.warnings.length > 0) return fromHtml;
  return parseBlocks(textToBlocks(content.text), section, level);
}

export function parsePlainText(text: string, section: string, level: string): ParseResult {
  return parseBlocks(textToBlocks(text), section, level);
}

/* ---- Hàm cũ giữ lại để tương thích với nơi khác trong dự án ---- */

export async function parseDocxFile(
  file: File,
  overrideSection?: string,
  overrideLevel?: string
): Promise<{ questions: Question[]; warnings: string[] }> {
  const content = await readDocxContent(file);
  const result = parseWordContent(content, overrideSection || 'AT', overrideLevel || 'COMMON');
  if (result.questions.length === 0 && result.warnings.length === 0) {
    result.warnings.push(
      `File "${file.name}" không nhận diện được câu hỏi nào theo chuẩn Câu 1: ... A. ... B. ...`
    );
  }
  return result;
}

export function parseHtmlOrTextQuestions(html: string, section: string, level: string): Question[] {
  return parseBlocks(htmlToBlocks(html), section, level).questions;
}

export function parseRawTextQuestions(rawText: string, section: string, level: string): Question[] {
  return parseBlocks(textToBlocks(rawText), section, level).questions;
}
