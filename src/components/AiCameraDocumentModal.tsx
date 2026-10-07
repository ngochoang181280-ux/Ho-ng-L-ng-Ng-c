import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Sparkles, X, CheckCircle2, AlertCircle, 
  RefreshCw, SwitchCamera, FileText, ArrowRight, Eye, Edit3, Trash2
} from 'lucide-react';
import { Question } from '../types/exam';

interface AiCameraDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Question[]) => void;
}

export const AiCameraDocumentModal: React.FC<AiCameraDocumentModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
}) => {
  const [sourceMode, setSourceMode] = useState<'camera' | 'file'>('camera');
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [documentText, setDocumentText] = useState('');

  // Department and Level target
  const [targetDepartment, setTargetDepartment] = useState('Nhà máy điện');
  const [targetLevel, setTargetLevel] = useState('5');
  const [targetSection, setTargetSection] = useState('AT');
  const [customPrompt, setCustomPrompt] = useState('');

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // AI Generation state
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [aiError, setAiError] = useState('');

  // Stop camera when closing
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  // Start live camera
  const startCamera = async (facing: 'user' | 'environment') => {
    setCameraError('');
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream failed', err);
      setCameraError('Không thể mở máy ảnh trực tiếp. Bạn có thể chọn "Tải ảnh từ máy" hoặc dùng camera trên điện thoại.');
      setIsCameraActive(false);
    }
  };

  // Switch front/back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture snapshot from live camera
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedImageBase64(dataUrl);
    setImageMimeType('image/jpeg');
    stopCamera();
  };

  // Handle file upload (Image / Text / Doc)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setCameraError('');
    setAiError('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImageBase64(event.target?.result as string);
        setImageMimeType(file.type);
        setDocumentText('');
      };
      reader.readAsDataURL(file);
    } else {
      // Text or other document format
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocumentText(event.target?.result as string);
        setCapturedImageBase64(null);
      };
      reader.readAsText(file);
    }
  };

  // Send to Google AI backend
  const handleGenerateQuestions = async () => {
    if (!capturedImageBase64 && !documentText.trim()) {
      alert('Vui lòng chụp ảnh hoặc tải file tài liệu trước.');
      return;
    }

    setIsLoadingAi(true);
    setAiError('');
    setGeneratedQuestions([]);

    try {
      const res = await fetch('/api/ai/extract-from-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: capturedImageBase64,
          mimeType: imageMimeType,
          textContent: documentText,
          department: targetDepartment,
          level: targetLevel,
          customPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Lỗi xử lý từ Google AI');
      }

      if (data.questions && data.questions.length > 0) {
        const formatted: Question[] = data.questions.map((q: any, i: number) => ({
          id: `ai-doc-${Date.now()}-${i}`,
          number: `${i + 1}`,
          question: q.question,
          options: q.options || { A: '', B: '', C: '', D: '' },
          correct: q.correct || 'A',
          section: q.section || targetSection,
          level: `A${targetLevel}`,
          citation: q.citation || selectedFileName || 'Tài liệu / Ảnh chụp',
          explanation: q.explanation || '',
        }));

        setGeneratedQuestions(formatted);
      } else {
        setAiError('Google AI không phát hiện câu hỏi hoặc nội dung kiến thức đủ để tạo câu hỏi.');
      }
    } catch (err: any) {
      console.error('Error in AI extraction:', err);
      setAiError(err.message || 'Lỗi kết nối máy chủ Google AI.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Add all generated questions to main question bank
  const handleConfirmAddQuestions = () => {
    if (generatedQuestions.length === 0) return;
    onAddQuestions(generatedQuestions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative animate-scaleUp my-auto max-h-[92vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Tạo Câu Hỏi Bằng Máy Ảnh & Tài Liệu</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Google AI Vision
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Chụp ảnh trang sách, đề thi in giấy hoặc tài liệu PDF/văn bản để AI trích xuất câu hỏi
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-3 my-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Bộ phận áp dụng:</label>
            <select
              value={targetDepartment}
              onChange={(e) => setTargetDepartment(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
            >
              <option value="Nhà máy điện">A - Nhà máy điện</option>
              <option value="XSC cơ">B - XSC cơ</option>
              <option value="Trưởng ca">C - Trưởng ca vận hành</option>
              <option value="XSC điện">D - XSC điện</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Bậc thi:</label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
            >
              <option value="2">Bậc 2</option>
              <option value="3">Bậc 3</option>
              <option value="4">Bậc 4</option>
              <option value="5">Bậc 5</option>
              <option value="6">Bậc 6</option>
              <option value="7">Bậc 7</option>
              <option value="8">Bậc 8</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Gán nhóm:</label>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
            >
              <option value="AT">Mức I (AT - An toàn)</option>
              <option value="QT">Mức II (QT - Quy trình)</option>
              <option value="NQ">Mức III (NQ - Nội quy)</option>
              <option value="TTD">Mức IV (TTD - Điều độ)</option>
              <option value="AX">Chuyên môn (AX)</option>
            </select>
          </div>
        </div>

        {/* Source Toggle: Live Camera vs File Upload */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              setSourceMode('camera');
              startCamera(facingMode);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
              sourceMode === 'camera'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Máy ảnh (Chụp trực tiếp)</span>
          </button>

          <button
            onClick={() => {
              setSourceMode('file');
              stopCamera();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
              sourceMode === 'file'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Tải file ảnh / tài liệu</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto max-h-72 pr-1 space-y-3">
          {sourceMode === 'camera' && (
            <div className="space-y-3">
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-700">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleToggleFacingMode}
                      className="p-2.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-slate-700 hover:bg-slate-800"
                      title="Đổi camera trước/sau"
                    >
                      <SwitchCamera className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleTakeSnapshot}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Chụp Ảnh Tài Liệu</span>
                    </button>
                  </div>
                </div>
              ) : capturedImageBase64 ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 p-2 text-center">
                  <img
                    src={capturedImageBase64}
                    alt="Captured preview"
                    className="max-h-56 mx-auto rounded-xl object-contain shadow-md"
                  />
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 hover:bg-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Chụp lại</span>
                    </button>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Đã có ảnh sẵn sàng
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/40">
                  <Camera className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-200">Máy ảnh chưa mở</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Nhấp vào nút bên dưới để cấp quyền máy ảnh và chụp tài liệu
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Mở Máy Ảnh Trực Tiếp</span>
                    </button>

                    {/* Mobile native camera capture input */}
                    <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700">
                      Chụp bằng Camera Điện thoại
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {cameraError && (
                    <p className="text-xs text-rose-400 mt-3">{cameraError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {sourceMode === 'file' && (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/50 hover:border-purple-500/50 transition-colors cursor-pointer text-center relative">
                <input
                  type="file"
                  accept="image/*,.pdf,.txt,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-10 h-10 text-purple-400 mb-2" />
                <p className="text-sm font-bold text-slate-200">
                  {selectedFileName || 'Chọn ảnh chụp trang sách hoặc file tài liệu'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ ảnh chụp JPG, PNG, WEBP hoặc file tài liệu văn bản
                </p>
              </div>

              {capturedImageBase64 && (
                <div className="rounded-xl overflow-hidden bg-slate-950 p-2 text-center border border-slate-800">
                  <img
                    src={capturedImageBase64}
                    alt="Uploaded preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                  <span className="text-xs text-emerald-400 font-semibold block mt-1">
                    Đã tải ảnh lên thành công
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Optional Prompt Field */}
          <div className="pt-2">
            <input
              type="text"
              placeholder="Yêu cầu thêm cho AI (VD: Tập trung vào quy định khoảng cách an toàn...)"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* AI Trigger Button */}
          {(capturedImageBase64 || documentText) && (
            <button
              onClick={handleGenerateQuestions}
              disabled={isLoadingAi}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoadingAi ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Google AI Đang Đọc & Tạo Câu Hỏi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Phân Tích & Tạo Câu Hỏi Bằng Google AI</span>
                </>
              )}
            </button>
          )}

          {/* AI Error message */}
          {aiError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Generated Questions List Review */}
          {generatedQuestions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Google AI đã tạo: {generatedQuestions.length} câu hỏi chuẩn
                </span>
                <span className="text-[11px] text-slate-500">Xem và sửa trực tiếp</span>
              </div>

              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-200">
                      Câu {idx + 1}: {q.question}
                    </p>
                    <button
                      onClick={() =>
                        setGeneratedQuestions((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                    {Object.entries(q.options).map(([k, text]) => (
                      <span
                        key={k}
                        className={q.correct.includes(k) ? 'text-emerald-400 font-bold' : ''}
                      >
                        {k}. {text}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                    <span>Đáp án: <strong className="text-cyan-400">{q.correct}</strong></span>
                    {q.explanation && <span>{q.explanation}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-3">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Đóng
          </button>

          <button
            onClick={handleConfirmAddQuestions}
            disabled={generatedQuestions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>Thêm {generatedQuestions.length} Câu Vào Ngân Hàng</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
