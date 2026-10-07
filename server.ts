import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support up to 25MB for high-resolution camera photo uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI on server-side only
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// AI Explanation endpoint for candidates & teachers
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { question, chosenAnswer, correctAnswer, options, citation } = req.body;
    
    if (!aiClient) {
      // High-quality contextual fallback explanation if API key is not yet set
      const optText = options?.[correctAnswer] || '';
      return res.json({
        explanation: `📌 **Phân tích đáp án chuẩn**: Đáp án chính xác là **${correctAnswer}. ${optText}**.\n\n` +
          `• **Căn cứ kỹ thuật**: ${citation || 'Theo Quy chuẩn Kỹ thuật An toàn điện Quốc gia và Quy trình Điều độ'}.\n` +
          `• **Ghi nhớ**: Khi thực hiện thao tác hoặc sát hạch nâng bậc, luôn tuân thủ nguyên tắc an toàn cao nhất để tránh sự cố chập nổ và bảo vệ thiết bị.`,
        source: 'system-fallback',
      });
    }

    const prompt = `Bạn là chuyên gia giảng dạy và giám khảo kỳ thi nâng bậc nghề ngành Điện lực & Kỹ thuật công nghiệp. 
Hãy giải thích ngắn gọn, súc tích và dễ hiểu bằng tiếng Việt cho câu hỏi sau:
- Câu hỏi: ${question}
- Các lựa chọn: ${JSON.stringify(options || {})}
- Thí sinh chọn: ${chosenAnswer || 'Chưa trả lời'}
- Đáp án đúng: ${correctAnswer}
- Trích dẫn gốc: ${citation || 'Quy chuẩn an toàn ngành'}

Yêu cầu trả về bài giảng dạng Markdown ngắn gọn:
1. Vì sao đáp án ${correctAnswer} là đúng (nguyên lý hoặc quy chuẩn cụ thể)?
2. Nếu thí sinh chọn sai, phân tích nhược điểm hoặc nguy cơ của lựa chọn sai đó.
3. Bài học thực tế cần nhớ trong ca trực.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là chuyên gia huấn luyện an toàn và kỹ thuật điện lực. Luôn trả lời mạch lạc bằng tiếng Việt với các gạch đầu dòng rõ ràng.',
        temperature: 0.3,
      },
    });

    res.json({
      explanation: response.text || 'Không có giải thích chi tiết.',
      source: 'google-ai',
    });
  } catch (error: any) {
    console.error('Error generating AI explanation:', error);
    res.json({
      explanation: 'Không thể tải giải thích từ Google AI lúc này. Vui lòng đối chiếu với trích dẫn quy trình kỹ thuật.',
      source: 'error-fallback',
    });
  }
});

// AI Question Generator for Admin
app.post('/api/ai/generate-question', async (req, res) => {
  try {
    const { topic, department, level } = req.body;

    if (!aiClient) {
      return res.status(400).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.',
      });
    }

    const prompt = `Tạo 1 câu hỏi trắc nghiệm kỹ thuật chất lượng cao cho kỳ thi nâng bậc:
- Chủ đề: ${topic || 'An toàn điện và quy trình thao tác máy biến áp'}
- Bộ phận: ${department || 'Nhà máy điện'}
- Bậc thi: Bậc ${level || '5'}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: 'Nội dung câu hỏi tình huống hoặc quy chuẩn' },
            options: {
              type: Type.OBJECT,
              properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
              },
              required: ['A', 'B', 'C', 'D'],
            },
            correct: { type: Type.STRING, description: 'Một ký tự A, B, C, hoặc D' },
            section: { type: Type.STRING, description: 'Mã nhóm như AT, QT, NQ, TTD hoặc AX' },
            citation: { type: Type.STRING, description: 'Điều khoản quy chuẩn trích dẫn' },
            explanation: { type: Type.STRING, description: 'Lý do đáp án đúng' },
          },
          required: ['question', 'options', 'correct', 'section', 'citation', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ question: parsed });
  } catch (error: any) {
    console.error('Error in AI question generator:', error);
    res.status(500).json({ error: error.message || 'Lỗi sinh câu hỏi từ AI.' });
  }
});

// AI Extract Questions from Document / Camera Photo (Multimodal)
app.post('/api/ai/extract-from-document', async (req, res) => {
  try {
    const { imageBase64, mimeType, textContent, department, level, customPrompt } = req.body;

    if (!aiClient) {
      return res.status(400).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Hãy thêm khóa trong cài đặt.',
      });
    }

    if (!imageBase64 && !textContent) {
      return res.status(400).json({
        error: 'Vui lòng cung cấp hình ảnh chụp từ máy ảnh hoặc nội dung văn bản tài liệu.',
      });
    }

    let contentsPayload: any;

    const basePrompt = `Bạn là chuyên gia giám khảo và sư phạm ngành Điện lực & Kỹ thuật công nghiệp.
Nhiệm vụ của bạn:
1. Đọc kỹ hình ảnh trang tài liệu/sách/đề thi hoặc văn bản được cung cấp.
2. Trích xuất hoặc tổng hợp các câu hỏi trắc nghiệm chất lượng cao phục vụ thi sát hạch nâng bậc nghề.
3. Nếu tài liệu đã có sẵn câu hỏi trắc nghiệm: nhận diện đầy đủ câu hỏi, các phương án A, B, C, D và đáp án đúng.
4. Nếu tài liệu là giáo trình lý thuyết hoặc quy trình: tạo từ 2 đến 6 câu hỏi trắc nghiệm trọng tâm nhất kiểm tra kiến thức thực tế.
- Bộ phận áp dụng: ${department || 'Nhà máy điện'}
- Bậc thi: Bậc ${level || '5'}
${customPrompt ? `- Yêu cầu thêm: ${customPrompt}` : ''}

Mỗi câu hỏi phải có:
- question: Nội dung câu hỏi rõ ràng
- options: Object { A, B, C, D }
- correct: Một hoặc nhiều chữ cái đáp án đúng (VD: "B" hoặc "AC")
- section: Mã nhóm phù hợp (AT, QT, NQ, TTD, hoặc AX)
- citation: Điều khoản hoặc nguồn trích dẫn tài liệu
- explanation: Giải thích ngắn gọn vì sao đáp án đúng`;

    if (imageBase64) {
      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const validMime = mimeType || 'image/jpeg';

      contentsPayload = [
        {
          inlineData: {
            mimeType: validMime,
            data: cleanBase64,
          },
        },
        { text: basePrompt },
      ];
    } else {
      contentsPayload = `${basePrompt}\n\n--- NỘI DUNG TÀI LIỆU ---\n${textContent}`;
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                },
                required: ['A', 'B', 'C', 'D'],
              },
              correct: { type: Type.STRING },
              section: { type: Type.STRING },
              citation: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'options', 'correct', 'section'],
          },
        },
      },
    });

    const parsedQuestions = JSON.parse(response.text || '[]');
    res.json({ questions: parsedQuestions });
  } catch (error: any) {
    console.error('Error extracting questions from document:', error);
    res.status(500).json({
      error: error.message || 'Lỗi phân tích tài liệu bằng Google AI.',
    });
  }
});

// Integrate with Vite
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SPMO PRO] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
