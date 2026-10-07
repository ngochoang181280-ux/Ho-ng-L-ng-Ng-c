import mammoth from 'mammoth';
import { Question } from '../types/exam';

function cleanText(s: string): string {
  return (s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSectionFromFileName(filename: string): { section: string; level: string } {
  const up = filename.toUpperCase().replace(/[–—]/g, '-');
  const axMatch = up.match(/\b([ABCD][2-8]\.\d+)\b/);
  if (axMatch) {
    const sec = axMatch[1];
    const lvMatch = sec.match(/[2-8]/);
    return { section: sec, level: lvMatch ? `A${lvMatch[0]}` : 'COMMON' };
  }

  if (up.includes('TTD') || up.includes('THAO TAC') || up.includes('DIEU DO')) {
    const bacMatch = up.match(/TTD[.\-_]?([2-8])/);
    return { section: 'TTD', level: bacMatch ? `A${bacMatch[1]}` : 'A6' };
  }

  if (up.includes('AT') || up.includes('AN TOAN')) {
    return { section: 'AT', level: 'COMMON' };
  }
  if (up.includes('QT') || up.includes('QUY TRINH')) {
    return { section: 'QT', level: 'COMMON' };
  }
  if (up.includes('NQ') || up.includes('NOI QUY')) {
    return { section: 'NQ', level: 'COMMON' };
  }

  return { section: 'AT', level: 'COMMON' };
}

export async function parseDocxFile(
  file: File,
  overrideSection?: string,
  overrideLevel?: string
): Promise<{ questions: Question[]; warnings: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const defaultMeta = detectSectionFromFileName(file.name);
  const targetSection = overrideSection || defaultMeta.section;
  const targetLevel = overrideLevel || defaultMeta.level;

  // Convert docx to HTML using mammoth to retain <strong> tags for bold text
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

  const warnings: string[] = [];
  const parsedQuestions = parseHtmlOrTextQuestions(html, targetSection, targetLevel);

  if (parsedQuestions.length === 0) {
    // Fallback: try raw text
    const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });
    const fallbackQuestions = parseRawTextQuestions(rawText, targetSection, targetLevel);
    if (fallbackQuestions.length > 0) {
      return { questions: fallbackQuestions, warnings };
    }
    warnings.push(`File "${file.name}" không nhận diện được câu hỏi nào theo chuẩn Câu 1: ... A. ... B. ...`);
  }

  return { questions: parsedQuestions, warnings };
}

export function parseHtmlOrTextQuestions(
  html: string,
  section: string,
  level: string
): Question[] {
  const container = document.createElement('div');
  container.innerHTML = html;

  const elements = Array.from(container.children);
  const paragraphs: Array<{ text: string; isBold: boolean; rawHtml: string }> = [];

  elements.forEach((el) => {
    const text = cleanText(el.textContent || '');
    if (!text) return;
    const hasBold = el.querySelector('strong, b') !== null;
    paragraphs.push({ text, isBold: hasBold, rawHtml: el.innerHTML });
  });

  const questions: Question[] = [];
  let current: Partial<Question> & { tempOptions?: Record<string, string> } | null = null;

  const finalizeCurrent = () => {
    if (
      current &&
      current.question &&
      current.tempOptions &&
      Object.keys(current.tempOptions).length >= 2
    ) {
      const correct = current.correct || 'A';
      questions.push({
        id: `docx-${Date.now()}-${questions.length + 1}`,
        number: current.number || `${questions.length + 1}`,
        question: current.question,
        options: current.tempOptions,
        correct,
        section: current.section || section,
        level: current.level || level,
        citation: current.citation || '',
        explanation: current.explanation || '',
      });
    }
    current = null;
  };

  for (let i = 0; i < paragraphs.length; i++) {
    const { text, rawHtml } = paragraphs[i];

    // Check for Question start: "Câu 1:", "Câu 1.", "1.", "1:"
    const qMatch = text.match(/^(?:Câu\s*)?(\d+)[\.:]\s*(.*)$/i);
    if (qMatch && !text.match(/^[ABCD][\.:\)]/i)) {
      finalizeCurrent();
      current = {
        number: qMatch[1],
        question: cleanText(qMatch[2]),
        tempOptions: {},
        correct: '',
        section,
        level,
      };
      continue;
    }

    if (!current) continue;

    // Check for Options: "A. ...", "A) ...", "B: ..."
    const optMatch = text.match(/^([ABCD])[\.\),:\-]\s*(.*)$/i);
    if (optMatch) {
      const optKey = optMatch[1].toUpperCase();
      const optBody = cleanText(optMatch[2]);
      if (!current.tempOptions) current.tempOptions = {};
      current.tempOptions[optKey] = optBody;

      // Detect bold answer in HTML
      if (rawHtml.toLowerCase().includes('<strong>') || rawHtml.toLowerCase().includes('<b>')) {
        current.correct = (current.correct || '') + optKey;
      }
      continue;
    }

    // Check for explicit answer: "Đáp án: B", "-> Đáp án đúng: A, C"
    const ansMatch = text.match(/(?:ĐÁP\s*ÁN(?:\s*ĐÚNG)?|ĐA)\s*[:\-]?\s*([ABCD\s,;/&]+)/i);
    if (ansMatch) {
      const letters = (ansMatch[1].match(/[ABCD]/gi) || []).map((l) => l.toUpperCase());
      const uniqueSorted = Array.from(new Set(letters)).sort().join('');
      if (uniqueSorted) {
        current.correct = uniqueSorted;
      }
      continue;
    }

    // Check for citation: "Trích dẫn: ...", "Căn cứ: ..."
    const citMatch = text.match(/(?:Trích\s*dẫn|Căn\s*cứ|Ghi\s*chú|Nguồn)\s*[:\-]\s*(.*)/i);
    if (citMatch) {
      current.citation = cleanText(citMatch[1]);
      continue;
    }

    // If current question has not yet collected all options, append to question text
    if (current && (!current.tempOptions || Object.keys(current.tempOptions).length === 0)) {
      current.question = `${current.question} ${text}`.trim();
    }
  }

  finalizeCurrent();
  return questions;
}

export function parseRawTextQuestions(
  rawText: string,
  section: string,
  level: string
): Question[] {
  const lines = rawText.split('\n').map(cleanText).filter(Boolean);
  const questions: Question[] = [];
  let current: Partial<Question> & { tempOptions?: Record<string, string> } | null = null;

  const finalizeCurrent = () => {
    if (
      current &&
      current.question &&
      current.tempOptions &&
      Object.keys(current.tempOptions).length >= 2
    ) {
      questions.push({
        id: `raw-${Date.now()}-${questions.length + 1}`,
        number: current.number || `${questions.length + 1}`,
        question: current.question,
        options: current.tempOptions,
        correct: current.correct || 'A',
        section: current.section || section,
        level: current.level || level,
        citation: current.citation || '',
        explanation: current.explanation || '',
      });
    }
    current = null;
  };

  for (const line of lines) {
    const qMatch = line.match(/^(?:Câu\s*)?(\d+)[\.:]\s*(.*)$/i);
    if (qMatch && !line.match(/^[ABCD][\.:\)]/i)) {
      finalizeCurrent();
      current = {
        number: qMatch[1],
        question: cleanText(qMatch[2]),
        tempOptions: {},
        correct: '',
        section,
        level,
      };
      continue;
    }

    if (!current) continue;

    const optMatch = line.match(/^([ABCD])[\.\),:\-]\s*(.*)$/i);
    if (optMatch) {
      const optKey = optMatch[1].toUpperCase();
      const optBody = cleanText(optMatch[2]);
      if (!current.tempOptions) current.tempOptions = {};
      current.tempOptions[optKey] = optBody;
      continue;
    }

    const ansMatch = line.match(/(?:ĐÁP\s*ÁN(?:\s*ĐÚNG)?|ĐA)\s*[:\-]?\s*([ABCD\s,;/&]+)/i);
    if (ansMatch) {
      const letters = (ansMatch[1].match(/[ABCD]/gi) || []).map((l) => l.toUpperCase());
      const uniqueSorted = Array.from(new Set(letters)).sort().join('');
      if (uniqueSorted) {
        current.correct = uniqueSorted;
      }
      continue;
    }

    const citMatch = line.match(/(?:Trích\s*dẫn|Căn\s*cứ|Ghi\s*chú)\s*[:\-]\s*(.*)/i);
    if (citMatch) {
      current.citation = cleanText(citMatch[1]);
      continue;
    }
  }

  finalizeCurrent();
  return questions;
}
