import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Unlock, Key, Users, BookOpen, Settings, Plus, Search, 
  Trash2, Edit3, Sparkles, CheckCircle2, ShieldAlert, ArrowLeft,
  Download, Printer, RefreshCw, Layers, Sliders, Eye, Camera, FileText,
  Copy, QrCode, ExternalLink, Share2, Info, X, FileCode, Check,
  AlertTriangle, AlertCircle, Minus, CheckSquare, BarChart3, Shuffle, Award, Trophy
} from 'lucide-react';
import { ExamRoom, Candidate, Question, DepartmentInfo, GroupQuestionCounts, LevelDistribution } from '../types/exam';
import { GROUP_DEFINITIONS, getQuestionGroupKey } from '../data/mockData';
import { 
  filterQuestionsForRoom,
  autoDistributeLevelCounts,
  generateExamForRoom,
  parseQuestionCode,
  getQuestionDepartment,
  getQuestionLevelNumber
} from '../utils/questionMeta';
import { WordImportModal } from './WordImportModal';
import { RoomPoolSummary } from './RoomPoolSummary';
import { AiCameraDocumentModal } from './AiCameraDocumentModal';
import { PrintExamModal } from './PrintExamModal';
import { OfficialProtocolModal } from './OfficialProtocolModal';
import { LiveProctoringModal } from './LiveProctoringModal';

interface AdminPortalProps {
  rooms: ExamRoom[];
  candidates: Candidate[];
  questions: Question[];
  departments: DepartmentInfo[];
  onUpdateRooms: (rooms: ExamRoom[]) => void;
  onUpdateCandidates: (candidates: Candidate[]) => void;
  onUpdateQuestions: (questions: Question[]) => void;
  onBackToHome: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  rooms,
  candidates,
  questions,
  departments,
  onUpdateRooms,
  onUpdateCandidates,
  onUpdateQuestions,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'candidates' | 'questions' | 'matrix' | 'ai_gen'>('rooms');
  
  // Room Creation state
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomPin, setNewRoomPin] = useState('');
  const [newRoomUnit, setNewRoomUnit] = useState('A');
  const [newRoomLevel, setNewRoomLevel] = useState('5');
  const [newRoomTime, setNewRoomTime] = useState(60);
  const [newRoomTotalQ, setNewRoomTotalQ] = useState(50);
  const [newRoomLock, setNewRoomLock] = useState(true);

  // Room group question counts (AT, QT, NQ, TTD, AX)
  const [newRoomAtCount, setNewRoomAtCount] = useState(10);
  const [newRoomQtCount, setNewRoomQtCount] = useState(10);
  const [newRoomNqCount, setNewRoomNqCount] = useState(5);
  const [newRoomTtdCount, setNewRoomTtdCount] = useState(5);
  const [newRoomAxCount, setNewRoomAxCount] = useState(20);

  // Edit room state
  const [editingRoom, setEditingRoom] = useState<ExamRoom | null>(null);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);

  // Level distribution states for Room Creation & Editing modal
  const [newRoomLevelMode, setNewRoomLevelMode] = useState<'auto' | 'manual'>('auto');
  const [newRoomLevelPreset, setNewRoomLevelPreset] = useState<'ladder' | 'even' | 'focus_target'>('ladder');
  const [newRoomLevelCounts, setNewRoomLevelCounts] = useState<Record<string, number>>({});

  // Matrix Tab states
  const [selectedMatrixRoomId, setSelectedMatrixRoomId] = useState<string>(() => rooms[0]?.id || '');
  const [showPreviewExamModal, setShowPreviewExamModal] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  // Matrix Tab level distribution states
  const [matrixLevelMode, setMatrixLevelMode] = useState<'auto' | 'manual'>('auto');
  const [matrixLevelPreset, setMatrixLevelPreset] = useState<'ladder' | 'even' | 'focus_target'>('ladder');
  const [matrixLevelCounts, setMatrixLevelCounts] = useState<Record<string, number>>({});

  // System Matrix Settings
  const [matrixAtCount, setMatrixAtCount] = useState(10);
  const [matrixQtCount, setMatrixQtCount] = useState(10);
  const [matrixNqCount, setMatrixNqCount] = useState(5);
  const [matrixTtdCount, setMatrixTtdCount] = useState(5);
  const [matrixAxCount, setMatrixAxCount] = useState(20);

  // Question Filter & Search
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionSectionFilter, setQuestionSectionFilter] = useState('ALL');
  const [questionDepartmentFilter, setQuestionDepartmentFilter] = useState('ALL');
  const [questionLevelFilter, setQuestionLevelFilter] = useState('ALL');

  // Selected room for Matrix tab
  const selectedMatrixRoom = useMemo(() => {
    return rooms.find((rm) => rm.id === selectedMatrixRoomId) || rooms[0] || null;
  }, [rooms, selectedMatrixRoomId]);

  // Eligible question breakdown for selected matrix room
  const matrixEligible = useMemo(() => {
    if (!selectedMatrixRoom) {
      return {
        targetUnit: 'A',
        targetLevel: 5,
        atPool: [],
        nqPool: [],
        qtPool: [],
        ttdPool: [],
        axPoolByLevel: {},
        axAllEligiblePool: [],
      };
    }
    return filterQuestionsForRoom(questions, selectedMatrixRoom);
  }, [questions, selectedMatrixRoom]);

  // Eligible question breakdown for new room / room being edited
  const newRoomEligible = useMemo(() => {
    const dummyRoom: ExamRoom = {
      id: 'dummy',
      roomCode: newRoomCode || 'TEMP',
      roomName: newRoomName || 'TEMP',
      isLocked: false,
      accessPin: '',
      unit: newRoomUnit,
      level: newRoomLevel,
      examTimeMinutes: 60,
      totalQuestions: 50,
      maxFocusViolations: 3,
      activeCandidatesCount: 0,
      status: 'active',
      createdAt: '',
    };
    return filterQuestionsForRoom(questions, dummyRoom);
  }, [questions, newRoomUnit, newRoomLevel, newRoomCode, newRoomName]);

  // Số câu kho đề TƯƠNG ỨNG với bộ phận + bậc của phòng đang tạo / sửa
  const newRoomAvail = useMemo(() => ({
    at: newRoomEligible.atPool.length,
    qt: newRoomEligible.qtPool.length,
    nq: newRoomEligible.nqPool.length,
    ttd: newRoomEligible.ttdPool.length,
    ax: newRoomEligible.axAllEligiblePool.length,
  }), [newRoomEligible]);

  // Thống kê kho đề theo bộ phận (hiển thị ở tab Ngân hàng câu hỏi)
  const bankStats = useMemo(() => {
    const rows: Record<string, { at: number; qt: number; nq: number; ttd: number; ax: number }> = {};
    const bump = (unit: string, k: 'at' | 'qt' | 'nq' | 'ttd' | 'ax') => {
      if (!rows[unit]) rows[unit] = { at: 0, qt: 0, nq: 0, ttd: 0, ax: 0 };
      rows[unit][k] += 1;
    };
    questions.forEach((q) => {
      const meta = parseQuestionCode(q.section, q.level, q.unit);
      const unit = meta.unit === 'CNVH' ? 'A' : meta.unit;
      const k = meta.groupType === 'AT' ? 'at'
        : meta.groupType === 'QT' ? 'qt'
        : meta.groupType === 'NQ' ? 'nq'
        : meta.groupType === 'TTD' ? 'ttd' : 'ax';
      bump(unit, k);
    });
    return rows;
  }, [questions]);

  // Tính lại số câu theo bậc (chế độ tự động) khi đổi bộ phận / bậc của phòng
  const recomputeRoomLevelCounts = (unit: string, levelStr: string, axTotal: number, preset: 'ladder' | 'even' | 'focus_target') => {
    const dummy: ExamRoom = {
      id: 'dummy', roomCode: 'TEMP', roomName: 'TEMP', isLocked: false, accessPin: '',
      unit, level: levelStr, examTimeMinutes: 60, totalQuestions: 50, maxFocusViolations: 3,
      activeCandidatesCount: 0, status: 'active', createdAt: '',
    };
    const el = filterQuestionsForRoom(questions, dummy);
    const availByLvl: Record<number, number> = {};
    for (let lv = 1; lv <= el.targetLevel; lv++) availByLvl[lv] = (el.axPoolByLevel[lv] || []).length;
    const auto = autoDistributeLevelCounts(axTotal, el.targetLevel, availByLvl, preset);
    const out: Record<string, number> = {};
    Object.keys(auto).forEach((k) => { out[k] = auto[Number(k)]; });
    return out;
  };

  const handleRoomUnitChange = (unit: string) => {
    setNewRoomUnit(unit);
    if (newRoomLevelMode === 'auto') {
      setNewRoomLevelCounts(recomputeRoomLevelCounts(unit, newRoomLevel, newRoomAxCount, newRoomLevelPreset));
    }
  };

  const handleRoomLevelChange = (levelStr: string) => {
    setNewRoomLevel(levelStr);
    if (newRoomLevelMode === 'auto') {
      setNewRoomLevelCounts(recomputeRoomLevelCounts(newRoomUnit, levelStr, newRoomAxCount, newRoomLevelPreset));
    } else {
      // chế độ tùy chỉnh: bỏ số câu của các bậc cao hơn bậc thi mới
      const max = parseInt(levelStr, 10) || 5;
      const kept: Record<string, number> = {};
      Object.keys(newRoomLevelCounts).forEach((k) => { if (Number(k) <= max) kept[k] = newRoomLevelCounts[k]; });
      setNewRoomLevelCounts(kept);
    }
  };

  // Available questions inventory count per group
  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = { at: 0, qt: 0, nq: 0, ttd: 0, ax: 0 };
    questions.forEach((q) => {
      const k = getQuestionGroupKey(q);
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [questions]);

  // Synchronize matrix tab with selected room
  useEffect(() => {
    if (selectedMatrixRoom) {
      const gc = selectedMatrixRoom.groupCounts || {
        at: Math.round(selectedMatrixRoom.totalQuestions * 0.2),
        qt: Math.round(selectedMatrixRoom.totalQuestions * 0.2),
        nq: Math.round(selectedMatrixRoom.totalQuestions * 0.1),
        ttd: Math.round(selectedMatrixRoom.totalQuestions * 0.1),
        ax: Math.round(selectedMatrixRoom.totalQuestions * 0.4),
      };
      setMatrixAtCount(gc.at ?? 10);
      setMatrixQtCount(gc.qt ?? 10);
      setMatrixNqCount(gc.nq ?? 5);
      setMatrixTtdCount(gc.ttd ?? 5);
      setMatrixAxCount(gc.ax ?? 20);

      const ld = selectedMatrixRoom.levelDistribution;
      const targetLvl = parseInt(String(selectedMatrixRoom.level || '5').replace(/\D/g, ''), 10) || 5;
      if (ld && ld.counts && Object.keys(ld.counts).length > 0) {
        setMatrixLevelMode(ld.mode || 'auto');
        setMatrixLevelPreset(ld.preset || 'ladder');
        setMatrixLevelCounts(ld.counts);
      } else {
        setMatrixLevelMode('auto');
        setMatrixLevelPreset('ladder');
        const availByLvl: Record<number, number> = {};
        for (let lv = 1; lv <= targetLvl; lv++) {
          availByLvl[lv] = (matrixEligible.axPoolByLevel[lv] || []).length;
        }
        const autoCounts = autoDistributeLevelCounts(gc.ax ?? 20, targetLvl, availByLvl, 'ladder');
        const countsStr: Record<string, number> = {};
        Object.keys(autoCounts).forEach((k) => { countsStr[k] = autoCounts[Number(k)]; });
        setMatrixLevelCounts(countsStr);
      }
    }
  }, [selectedMatrixRoomId, rooms]);

  // Auto-distribute matrix level counts when total AX or preset changes
  const updateMatrixLevelAuto = (axTotal: number, preset: 'ladder' | 'even' | 'focus_target') => {
    const targetLvl = matrixEligible.targetLevel || 5;
    const availByLvl: Record<number, number> = {};
    for (let lv = 1; lv <= targetLvl; lv++) {
      availByLvl[lv] = (matrixEligible.axPoolByLevel[lv] || []).length;
    }
    const autoCounts = autoDistributeLevelCounts(axTotal, targetLvl, availByLvl, preset);
    const countsStr: Record<string, number> = {};
    Object.keys(autoCounts).forEach((k) => { countsStr[k] = autoCounts[Number(k)]; });
    setMatrixLevelCounts(countsStr);
  };

  const handleMatrixLevelCountChange = (lv: number, count: number) => {
    const nextCounts = { ...matrixLevelCounts, [String(lv)]: Math.max(0, count) };
    setMatrixLevelCounts(nextCounts);
    const totalAx = Object.values(nextCounts).reduce((a, b) => a + b, 0);
    setMatrixAxCount(totalAx);
  };

  const applyMatrixPreset = (preset: 'spmo50' | 'at40' | 'ax50' | 'ttd45' | 'quick25' | 'even') => {
    let nextAx = 20;
    if (preset === 'spmo50') {
      setMatrixAtCount(10);
      setMatrixQtCount(10);
      setMatrixNqCount(5);
      setMatrixTtdCount(5);
      setMatrixAxCount(20);
      nextAx = 20;
    } else if (preset === 'at40') {
      setMatrixAtCount(20);
      setMatrixQtCount(15);
      setMatrixNqCount(5);
      setMatrixTtdCount(0);
      setMatrixAxCount(0);
      nextAx = 0;
    } else if (preset === 'ax50') {
      setMatrixAtCount(5);
      setMatrixQtCount(5);
      setMatrixNqCount(5);
      setMatrixTtdCount(5);
      setMatrixAxCount(30);
      nextAx = 30;
    } else if (preset === 'ttd45') {
      setMatrixAtCount(10);
      setMatrixQtCount(10);
      setMatrixNqCount(5);
      setMatrixTtdCount(12);
      setMatrixAxCount(8);
      nextAx = 8;
    } else if (preset === 'quick25') {
      setMatrixAtCount(5);
      setMatrixQtCount(5);
      setMatrixNqCount(5);
      setMatrixTtdCount(2);
      setMatrixAxCount(8);
      nextAx = 8;
    } else if (preset === 'even') {
      setMatrixAtCount(8);
      setMatrixQtCount(8);
      setMatrixNqCount(8);
      setMatrixTtdCount(8);
      setMatrixAxCount(8);
      nextAx = 8;
    }
    if (matrixLevelMode === 'auto') {
      updateMatrixLevelAuto(nextAx, matrixLevelPreset);
    }
  };

  const handleSaveMatrixConfig = () => {
    const totalCalc = matrixAtCount + matrixQtCount + matrixNqCount + matrixTtdCount + matrixAxCount;
    if (!selectedMatrixRoom) return;

    const updated = rooms.map((r) => {
      if (r.id === selectedMatrixRoom.id) {
        return {
          ...r,
          totalQuestions: totalCalc > 0 ? totalCalc : r.totalQuestions,
          groupCounts: {
            at: matrixAtCount,
            qt: matrixQtCount,
            nq: matrixNqCount,
            ttd: matrixTtdCount,
            ax: matrixAxCount,
          },
          levelDistribution: {
            mode: matrixLevelMode,
            preset: matrixLevelPreset,
            counts: matrixLevelCounts,
          },
        };
      }
      return r;
    });

    onUpdateRooms(updated);
    setImportNotification(`Đã lưu ma trận thành công cho phòng [${selectedMatrixRoom.roomCode}]: Tổng ${totalCalc} câu (${matrixAtCount} AT, ${matrixQtCount} QT, ${matrixNqCount} NQ, ${matrixTtdCount} TTD, ${matrixAxCount} AX) theo chế độ ${matrixLevelMode === 'auto' ? 'Tự động' : 'Tùy chỉnh'} theo bậc!`);
    setTimeout(() => setImportNotification(null), 5000);
  };

  const handlePreviewExam = () => {
    if (!selectedMatrixRoom) return;
    const tempRoom: ExamRoom = {
      ...selectedMatrixRoom,
      groupCounts: {
        at: matrixAtCount,
        qt: matrixQtCount,
        nq: matrixNqCount,
        ttd: matrixTtdCount,
        ax: matrixAxCount,
      },
      levelDistribution: {
        mode: matrixLevelMode,
        preset: matrixLevelPreset,
        counts: matrixLevelCounts,
      },
      totalQuestions: matrixAtCount + matrixQtCount + matrixNqCount + matrixTtdCount + matrixAxCount,
    };

    const generated = generateExamForRoom(tempRoom, questions);
    setPreviewQuestions(generated);
    setShowPreviewExamModal(true);
  };

  // Candidate Filter & Management
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('ALL');
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [newCandName, setNewCandName] = useState('');
  const [newCandCode, setNewCandCode] = useState('');
  const [newCandUnit, setNewCandUnit] = useState('A');
  const [newCandLevel, setNewCandLevel] = useState('5');
  const [newCandRoom, setNewCandRoom] = useState(rooms[0]?.roomCode || 'SPM-2026');

  // Add Question Modal state
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQOptA, setNewQOptA] = useState('');
  const [newQOptB, setNewQOptB] = useState('');
  const [newQOptC, setNewQOptC] = useState('');
  const [newQOptD, setNewQOptD] = useState('');
  const [newQCorrect, setNewQCorrect] = useState('A');
  const [newQType, setNewQType] = useState<'AT' | 'QT' | 'NQ' | 'TTD' | 'AX'>('AX');
  const [newQUnit, setNewQUnit] = useState('A');
  const [newQLevel, setNewQLevel] = useState('4');
  const [newQSubGroup, setNewQSubGroup] = useState('1');
  const [newQSection, setNewQSection] = useState('A4.1');
  const [newQCitation, setNewQCitation] = useState('');

  // AI Generator state
  const [aiTopic, setAiTopic] = useState('Vận hành an toàn máy biến áp lực 110kV và rơ le bảo vệ');
  const [aiDept, setAiDept] = useState('Nhà máy điện');
  const [aiLevel, setAiLevel] = useState('5');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedSuccess, setAiGeneratedSuccess] = useState(false);

  // Modals for Word import and AI Camera/Document
  const [showWordImportModal, setShowWordImportModal] = useState(false);
  const [showAiCameraModal, setShowAiCameraModal] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const handleImportWordQuestions = (imported: Question[]) => {
    onUpdateQuestions([...imported, ...questions]);
    setImportNotification(`Đã nhập thành công ${imported.length} câu hỏi từ file Word vào ngân hàng!`);
    setTimeout(() => setImportNotification(null), 5000);
  };

  const handleAddAiCameraQuestions = (imported: Question[]) => {
    onUpdateQuestions([...imported, ...questions]);
    setImportNotification(`Đã tạo và thêm thành công ${imported.length} câu hỏi bằng Google AI Vision!`);
    setTimeout(() => setImportNotification(null), 5000);
  };

  // Print Exam, Official Protocol & Live Proctoring Modal states
  const [printModalRoom, setPrintModalRoom] = useState<ExamRoom | null>(null);
  const [protocolModalRoom, setProtocolModalRoom] = useState<ExamRoom | null>(null);
  const [proctorModalRoom, setProctorModalRoom] = useState<ExamRoom | null>(null);

  // QR Code & Room Link states
  const [qrModalRoom, setQrModalRoom] = useState<ExamRoom | null>(null);
  const [copiedRoomCode, setCopiedRoomCode] = useState<string | null>(null);

  const handleCopyRoomLink = (room: ExamRoom) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room.roomCode)}`;
      navigator.clipboard.writeText(url);
      setCopiedRoomCode(room.roomCode);
      setTimeout(() => setCopiedRoomCode(null), 3000);
    }
  };

  const handleCopyGeneralLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}`;
      navigator.clipboard.writeText(url);
      setCopiedRoomCode('GENERAL');
      setTimeout(() => setCopiedRoomCode(null), 3000);
    }
  };

  // Google Apps Script Modal states
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [appsScriptTab, setAppsScriptTab] = useState<'guide' | 'code_gs' | 'index_html'>('guide');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  // Helper to generate random PIN code
  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewRoomPin(pin);
  };

  // Helper to generate random Room Code
  const generateRandomRoomCode = () => {
    const letters = ['SPM', 'TEST', 'THI', 'NB'];
    const randLetter = letters[Math.floor(Math.random() * letters.length)];
    const randNum = Math.floor(100 + Math.random() * 900);
    setNewRoomCode(`${randLetter}-${randNum}`);
  };

  // Toggle Room Lock
  const toggleRoomLock = (roomId: string) => {
    const updated = rooms.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          isLocked: !r.isLocked,
          status: (!r.isLocked ? 'locked' : 'active') as 'locked' | 'active',
        };
      }
      return r;
    });
    onUpdateRooms(updated);
  };

  // Create Room
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomCode.trim()) return;

    const totalCalc = newRoomAtCount + newRoomQtCount + newRoomNqCount + newRoomTtdCount + newRoomAxCount;
    const newRoom: ExamRoom = {
      id: `room-${Date.now()}`,
      roomName: newRoomName.trim(),
      roomCode: newRoomCode.trim().toUpperCase(),
      accessPin: newRoomPin.trim(),
      isLocked: newRoomLock,
      unit: newRoomUnit,
      level: newRoomLevel,
      examTimeMinutes: Number(newRoomTime) || 60,
      totalQuestions: totalCalc > 0 ? totalCalc : (Number(newRoomTotalQ) || 50),
      groupCounts: {
        at: newRoomAtCount,
        qt: newRoomQtCount,
        nq: newRoomNqCount,
        ttd: newRoomTtdCount,
        ax: newRoomAxCount,
      },
      levelDistribution: {
        mode: newRoomLevelMode,
        preset: newRoomLevelPreset,
        counts: newRoomLevelMode === 'auto'
          ? recomputeRoomLevelCounts(newRoomUnit, newRoomLevel, newRoomAxCount, newRoomLevelPreset)
          : newRoomLevelCounts,
      },
      maxFocusViolations: 3,
      activeCandidatesCount: 0,
      status: newRoomLock ? 'locked' : 'active',
      createdAt: new Date().toISOString(),
    };

    onUpdateRooms([newRoom, ...rooms]);
    setShowCreateRoomModal(false);
    setNewRoomName('');
    setNewRoomCode('');
    setNewRoomPin('');
  };

  // Open Edit Room Modal
  const handleOpenEditRoom = (room: ExamRoom) => {
    setEditingRoom(room);
    setShowEditRoomModal(true);
    setNewRoomName(room.roomName);
    setNewRoomCode(room.roomCode);
    setNewRoomPin(room.accessPin || '');
    setNewRoomUnit(room.unit || 'A');
    setNewRoomLevel(room.level || '5');
    setNewRoomTime(room.examTimeMinutes || 60);
    setNewRoomLock(room.isLocked);
    const gc = room.groupCounts || {
      at: Math.round(room.totalQuestions * 0.2),
      qt: Math.round(room.totalQuestions * 0.2),
      nq: Math.round(room.totalQuestions * 0.1),
      ttd: Math.round(room.totalQuestions * 0.1),
      ax: Math.round(room.totalQuestions * 0.4),
    };
    setNewRoomAtCount(gc.at ?? 10);
    setNewRoomQtCount(gc.qt ?? 10);
    setNewRoomNqCount(gc.nq ?? 5);
    setNewRoomTtdCount(gc.ttd ?? 5);
    setNewRoomAxCount(gc.ax ?? 20);
    setNewRoomTotalQ(room.totalQuestions);

    const ld = room.levelDistribution;
    const targetLvl = parseInt(String(room.level || '5').replace(/\D/g, ''), 10) || 5;
    if (ld && ld.counts && Object.keys(ld.counts).length > 0) {
      setNewRoomLevelMode(ld.mode || 'auto');
      setNewRoomLevelPreset(ld.preset || 'ladder');
      setNewRoomLevelCounts(ld.counts);
    } else {
      setNewRoomLevelMode('auto');
      setNewRoomLevelPreset('ladder');
      const dummyRoom: ExamRoom = { ...room };
      const el = filterQuestionsForRoom(questions, dummyRoom);
      const availByLvl: Record<number, number> = {};
      for (let lv = 1; lv <= targetLvl; lv++) {
        availByLvl[lv] = (el.axPoolByLevel[lv] || []).length;
      }
      const autoCounts = autoDistributeLevelCounts(gc.ax ?? 20, targetLvl, availByLvl, 'ladder');
      const countsStr: Record<string, number> = {};
      Object.keys(autoCounts).forEach((k) => { countsStr[k] = autoCounts[Number(k)]; });
      setNewRoomLevelCounts(countsStr);
    }
  };

  // Save Edited Room
  const handleSaveEditRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !newRoomName.trim()) return;

    const totalCalc = newRoomAtCount + newRoomQtCount + newRoomNqCount + newRoomTtdCount + newRoomAxCount;
    const updated = rooms.map((r) => {
      if (r.id === editingRoom.id) {
        return {
          ...r,
          roomName: newRoomName.trim(),
          accessPin: newRoomPin.trim(),
          isLocked: newRoomLock,
          unit: newRoomUnit,
          level: newRoomLevel,
          examTimeMinutes: Number(newRoomTime) || 60,
          totalQuestions: totalCalc > 0 ? totalCalc : r.totalQuestions,
          groupCounts: {
            at: newRoomAtCount,
            qt: newRoomQtCount,
            nq: newRoomNqCount,
            ttd: newRoomTtdCount,
            ax: newRoomAxCount,
          },
          levelDistribution: {
            mode: newRoomLevelMode,
            preset: newRoomLevelPreset,
            counts: newRoomLevelMode === 'auto'
              ? recomputeRoomLevelCounts(newRoomUnit, newRoomLevel, newRoomAxCount, newRoomLevelPreset)
              : newRoomLevelCounts,
          },
          status: (newRoomLock ? 'locked' : 'active') as 'locked' | 'active',
        };
      }
      return r;
    });

    onUpdateRooms(updated);
    setEditingRoom(null);
    setShowEditRoomModal(false);
    setImportNotification(`Đã cập nhật cấu hình phòng thi [${editingRoom.roomCode}] thành công!`);
    setTimeout(() => setImportNotification(null), 4000);
  };

  // Delete Room
  const handleDeleteRoom = (roomId: string) => {
    if (confirm('Bạn có chắc muốn xóa phòng thi này?')) {
      onUpdateRooms(rooms.filter((r) => r.id !== roomId));
    }
  };

  // Add Candidate to roster
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandName.trim()) return;

    const unitObj = departments.find((d) => d.code === newCandUnit);
    const newCand: Candidate = {
      id: `cand-${Date.now()}`,
      fullName: newCandName.trim(),
      employeeCode: newCandCode.trim() || `NV-${Math.floor(1000 + Math.random() * 9000)}`,
      unit: newCandUnit,
      unitName: unitObj ? unitObj.name : newCandUnit,
      level: newCandLevel,
      roomCode: newCandRoom,
      examCode: `${newCandUnit}${Math.floor(100 + Math.random() * 900)}`,
      status: 'not_started',
      focusViolations: 0,
    };

    onUpdateCandidates([newCand, ...candidates]);
    setShowAddCandidateModal(false);
    setNewCandName('');
    setNewCandCode('');
  };

  // Delete candidate
  const handleDeleteCandidate = (candId: string) => {
    if (confirm('Xóa thí sinh này khỏi danh sách?')) {
      onUpdateCandidates(candidates.filter((c) => c.id !== candId));
    }
  };

  // Add Question manually
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newQOptA || !newQOptB) return;

    let finalSection = newQSection.trim();
    if (newQType === 'AT') finalSection = 'AT';
    else if (newQType === 'QT') finalSection = 'QT';
    else if (newQType === 'NQ') finalSection = 'NQ';
    else if (newQType === 'TTD') finalSection = `TTD.${newQLevel}`;
    else if (newQType === 'AX') finalSection = `${newQUnit}${newQLevel}.${newQSubGroup || '1'}`;

    const newQ: Question = {
      id: `q-${Date.now()}`,
      question: newQText.trim(),
      options: {
        A: newQOptA.trim(),
        B: newQOptB.trim(),
        C: newQOptC.trim() || 'Phương án C',
        D: newQOptD.trim() || 'Phương án D',
      },
      correct: newQCorrect,
      section: finalSection,
      unit: newQType === 'AX' ? newQUnit : 'COMMON',
      level: newQType === 'AX' || newQType === 'TTD' ? newQLevel : 'COMMON',
      subGroup: newQSubGroup,
      citation: newQCitation.trim() || 'Quy chuẩn ngành điện',
    };

    onUpdateQuestions([newQ, ...questions]);
    setShowAddQuestionModal(false);
    setNewQText('');
    setNewQOptA('');
    setNewQOptB('');
    setNewQOptC('');
    setNewQOptD('');
    setNewQCitation('');
  };

  // Generate question using Google AI
  const handleGenerateQuestionByAI = async () => {
    setAiLoading(true);
    setAiGeneratedSuccess(false);

    try {
      const res = await fetch('/api/ai/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          department: aiDept,
          level: aiLevel,
        }),
      });

      const data = await res.json();
      if (data.question) {
        const generatedQ: Question = {
          id: `q-ai-${Date.now()}`,
          question: data.question.question,
          options: data.question.options,
          correct: data.question.correct,
          section: data.question.section || 'AT',
          level: `A${aiLevel}`,
          citation: data.question.citation,
          explanation: data.question.explanation,
        };

        onUpdateQuestions([generatedQ, ...questions]);
        setAiGeneratedSuccess(true);
      } else {
        alert('Không thể tạo câu hỏi: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (err: any) {
      alert('Lỗi gọi Google AI: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Filtered Candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchName = c.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      (c.employeeCode && c.employeeCode.toLowerCase().includes(candidateSearch.toLowerCase()));
    const matchRoom = selectedRoomFilter === 'ALL' || c.roomCode === selectedRoomFilter;
    return matchName && matchRoom;
  });

  // Filtered Questions with Department and Level filters
  const filteredQuestions = questions.filter((q) => {
    const matchText = q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
      (q.section && q.section.toLowerCase().includes(questionSearch.toLowerCase())) ||
      (q.citation && q.citation.toLowerCase().includes(questionSearch.toLowerCase()));
    const matchSec = questionSectionFilter === 'ALL' || q.section === questionSectionFilter ||
      (questionSectionFilter === 'AT' && (q.section === 'AT' || q.section.startsWith('AT'))) ||
      (questionSectionFilter === 'QT' && (q.section === 'QT' || q.section.startsWith('QT'))) ||
      (questionSectionFilter === 'NQ' && (q.section === 'NQ' || q.section.startsWith('NQ'))) ||
      (questionSectionFilter === 'TTD' && (q.section.startsWith('TTD') || q.section.startsWith('DD'))) ||
      (questionSectionFilter === 'AX' && /^[A-Za-z]+\d/.test(q.section));

    const meta = parseQuestionCode(q.section, q.level, q.unit);
    const qDept = meta.unit;
    const isSharedUnit = qDept === 'COMMON';
    const matchDept = questionDepartmentFilter === 'ALL' ||
      qDept === questionDepartmentFilter ||
      (questionDepartmentFilter === 'A' && qDept === 'CNVH') ||
      // Câu dùng chung (AT/QT/NQ/TTD) cũng nằm trong kho của mọi bộ phận
      (isSharedUnit && meta.groupType !== 'CHUYEN_MON' && questionDepartmentFilter !== 'COMMON');

    const matchLevel = questionLevelFilter === 'ALL' ||
      (questionLevelFilter === 'COMMON' && meta.levelNumber === null) ||
      (meta.levelNumber !== null && String(meta.levelNumber) === questionLevelFilter);

    return matchText && matchSec && matchDept && matchLevel;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Quay về màn hình thí sinh"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-slate-100">Bảng Điều Khiển Quản Trị (Admin)</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO V8
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Quản lý mã khóa phòng thi • Danh sách thí sinh • Ngân hàng câu hỏi • Google AI
            </p>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'rooms'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Khóa Phòng Thi</span>
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'candidates'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Danh Sách Thí Sinh ({candidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'questions'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Ngân Hàng Đề ({questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'matrix'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Ma Trận Đề</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_gen')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'ai_gen'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800/80 text-purple-300 border border-purple-500/30 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Google AI</span>
          </button>

          <button
            onClick={() => setShowAppsScriptModal(true)}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all shadow-sm"
            title="Xem mã nguồn và hướng dẫn chạy trên Google Apps Script"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">📦 Apps Script</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        
        {/* TAB 1: PHÒNG THI & TẠO MÃ KHÓA PHÒNG */}
        {activeTab === 'rooms' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <Key className="w-6 h-6 text-cyan-400" />
                  <span>Quản Lý Phòng Thi & Tạo Mã Khóa Bảo Mật</span>
                </h2>
                <p className="text-sm text-slate-400">
                  Tạo mã PIN khóa phòng thi, bật/tắt quyền thí sinh tham gia và cấu hình thời gian thi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintModalRoom(rooms[0])}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs shadow transition-all active:scale-95"
                  title="Xuất bản đề thi giấy in ấn A4 kèm phiếu trả lời và đáp án 4 mã đề hoán vị"
                >
                  <Printer className="w-4 h-4" />
                  <span>📄 Xuất Đề Giấy A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProtocolModalRoom(rooms[0])}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 font-bold text-xs shadow transition-all active:scale-95"
                  title="Biên bản tổng hợp kết quả họp Hội đồng sát hạch nâng bậc nghề chuẩn EVN"
                >
                  <Trophy className="w-4 h-4" />
                  <span>📋 Biên Bản Hội Đồng</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProctorModalRoom(rooms[0])}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 font-bold text-xs shadow transition-all active:scale-95"
                  title="Bảng giám sát trực tiếp thí sinh thời gian thực & chống gian lận"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>🛡️ Giám Sát Live</span>
                </button>

                <button
                  onClick={() => {
                    generateRandomPin();
                    generateRandomRoomCode();
                    setNewRoomUnit(departments[0]?.code || 'A');
                    setNewRoomLevel('5');
                    setNewRoomLevelMode('auto');
                    setNewRoomLevelPreset('ladder');
                    setNewRoomLevelCounts({});
                    setShowCreateRoomModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Phòng Thi Mới</span>
                </button>
              </div>
            </div>

            {/* Instruction banner for links & candidate entry */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <Info className="w-4 h-4" />
                    <span>Hướng Dẫn Link Đăng Nhập & Cách Thí Sinh Vào Thi</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    • <strong>Link chung cho thí sinh</strong>: Thí sinh mở link trên điện thoại hoặc máy tính, nhập Họ tên, chọn Phòng thi và nhập Mã khóa (PIN).<br />
                    • <strong>Link riêng từng phòng</strong>: Bấm <em>"Sao chép link gửi thí sinh"</em> tại mỗi phòng để gửi qua Zalo/Email. Thí sinh bấm vào là tự chọn đúng phòng thi!
                  </p>
                </div>

                <button
                  onClick={handleCopyGeneralLink}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shrink-0 active:scale-95 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{copiedRoomCode === 'GENERAL' ? '✓ Đã sao chép link chung!' : 'Sao chép link trang chủ'}</span>
                </button>
              </div>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map((room) => {
                const candidateCount = candidates.filter((c) => c.roomCode === room.roomCode).length;

                return (
                  <div
                    key={room.id}
                    className={`bg-slate-900/80 border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                      room.isLocked
                        ? 'border-cyan-500/40 shadow-cyan-950/20'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-sm">
                          {room.roomCode}
                        </span>

                        {/* Lock / Unlock Toggle Button */}
                        <button
                          onClick={() => toggleRoomLock(room.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            room.isLocked
                              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                          }`}
                        >
                          {room.isLocked ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>ĐANG KHÓA</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>MỞ TỰ DO</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h3 className="font-bold text-base text-slate-100 mb-1">
                        {room.roomName}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {room.description || 'Chưa có ghi chú phòng thi.'}
                      </p>

                      {/* Room Details */}
                      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Mã Khóa (PIN):</span>
                          <span className="font-mono font-bold text-amber-300 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            {room.accessPin || 'Không yêu cầu'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Thời gian làm bài:</span>
                          <span className="font-semibold text-slate-200">{room.examTimeMinutes} phút</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Quy mô đề thi:</span>
                          <span className="font-semibold text-slate-200">{room.totalQuestions} câu hỏi</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Số thí sinh trong phòng:</span>
                          <span className="font-semibold text-cyan-400">{candidateCount} thí sinh</span>
                        </div>

                        {/* Breakdown of questions per group */}
                        <div className="pt-2 border-t border-slate-700/60 mt-1">
                          <div className="flex justify-between items-center text-[11px] mb-1.5">
                            <span className="text-slate-400 font-medium">Số câu trong mỗi nhóm:</span>
                            <span className="text-cyan-400 font-bold font-mono">{room.totalQuestions} câu</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-mono font-bold">
                            <div className="bg-slate-900/90 py-1 rounded border border-slate-700 text-cyan-300">
                              <span className="block text-[8px] text-slate-500 font-sans">AT</span>
                              {room.groupCounts?.at ?? 10}
                            </div>
                            <div className="bg-slate-900/90 py-1 rounded border border-slate-700 text-teal-300">
                              <span className="block text-[8px] text-slate-500 font-sans">QT</span>
                              {room.groupCounts?.qt ?? 10}
                            </div>
                            <div className="bg-slate-900/90 py-1 rounded border border-slate-700 text-amber-300">
                              <span className="block text-[8px] text-slate-500 font-sans">NQ</span>
                              {room.groupCounts?.nq ?? 5}
                            </div>
                            <div className="bg-slate-900/90 py-1 rounded border border-slate-700 text-indigo-300">
                              <span className="block text-[8px] text-slate-500 font-sans">TTD</span>
                              {room.groupCounts?.ttd ?? 5}
                            </div>
                            <div className="bg-slate-900/90 py-1 rounded border border-slate-700 text-purple-300">
                              <span className="block text-[8px] text-slate-500 font-sans">AX</span>
                              {room.groupCounts?.ax ?? 20}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Direct Link & QR share action buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                        <button
                          onClick={() => handleCopyRoomLink(room)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all"
                          title="Sao chép link trực tiếp phòng thi này"
                        >
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{copiedRoomCode === room.roomCode ? '✓ Đã chép' : 'Sao chép link'}</span>
                        </button>

                        <button
                          onClick={() => setQrModalRoom(room)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all"
                          title="Hiển thị mã QR quét bằng camera điện thoại"
                        >
                          <QrCode className="w-3.5 h-3.5 text-purple-400" />
                          <span>Mã QR</span>
                        </button>
                      </div>

                      {/* Paper Print, Protocol & Proctoring actions */}
                      <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                        <button
                          type="button"
                          onClick={() => setPrintModalRoom(room)}
                          className="py-1.5 px-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all text-center active:scale-95"
                          title="In đề thi giấy A4 kèm phiếu trả lời và 4 mã đề hoán vị"
                        >
                          📄 Đề giấy
                        </button>
                        <button
                          type="button"
                          onClick={() => setProtocolModalRoom(room)}
                          className="py-1.5 px-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition-all text-center active:scale-95"
                          title="Biên bản tổng hợp kết quả Hội đồng sát hạch nâng bậc EVN"
                        >
                          📋 Biên bản
                        </button>
                        <button
                          type="button"
                          onClick={() => setProctorModalRoom(room)}
                          className="py-1.5 px-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all text-center active:scale-95"
                          title="Bảng giám sát thi thời gian thực và chống gian lận"
                        >
                          🛡️ Giám sát
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs">
                      <button
                        onClick={() => handleOpenEditRoom(room)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa ma trận</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa phòng</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DANH SÁCH THÍ SINH */}
        {activeTab === 'candidates' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <Users className="w-6 h-6 text-cyan-400" />
                  <span>Danh Sách Thí Sinh & Giám Sát Trực Tiếp</span>
                </h2>
                <p className="text-sm text-slate-400">
                  Theo dõi tiến độ làm bài, số lần vi phạm rời màn hình, điểm số và kết quả bài thi.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowAddCandidateModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Thí Sinh Mới</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc mã nhân viên..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-slate-400 whitespace-nowrap">Lọc phòng:</span>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Tất cả phòng thi</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.roomCode}>
                      {r.roomCode} - {r.roomName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidate Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Họ Và Tên</th>
                      <th className="py-3.5 px-4">Bộ Phận / Bậc</th>
                      <th className="py-3.5 px-4">Phòng Thi</th>
                      <th className="py-3.5 px-4">Trạng Thái</th>
                      <th className="py-3.5 px-4">Điểm / Tỷ Lệ</th>
                      <th className="py-3.5 px-4">Rời Màn Hình</th>
                      <th className="py-3.5 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Chưa có thí sinh nào khớp với tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((cand) => (
                        <tr key={cand.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-100">{cand.fullName}</span>
                            <span className="block text-[11px] text-slate-500 font-mono">
                              {cand.employeeCode || 'Không có mã'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-slate-200">{cand.unitName}</span>
                            <span className="block text-[11px] text-cyan-400 font-semibold">
                              Bậc {cand.level}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold text-xs border border-slate-700">
                              {cand.roomCode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {cand.status === 'submitted' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã nộp bài
                              </span>
                            )}
                            {cand.status === 'testing' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse">
                                Đang thi
                              </span>
                            )}
                            {cand.status === 'not_started' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                Chưa vào thi
                              </span>
                            )}
                            {cand.status === 'violation' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                Vi phạm
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {cand.score !== undefined ? (
                              <span className="font-bold text-emerald-400 text-base">
                                {cand.score}/10
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-semibold ${cand.focusViolations > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {cand.focusViolations} lần
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteCandidate(cand.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              title="Xóa thí sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NGÂN HÀNG CÂU HỎI */}
        {activeTab === 'questions' && (
          <div className="flex flex-col gap-6">
            {/* Success notification banner */}
            {importNotification && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{importNotification}</span>
              </div>
            )}

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-cyan-400" />
                  <span>Ngân Hàng Câu Hỏi Trắc Nghiệm ({questions.length} câu)</span>
                </h2>
                <p className="text-sm text-slate-400">
                  Phân nhóm theo An toàn (AT), Quy trình (QT), Nội quy (NQ), Điều độ (TTD) và Chuyên môn bậc (AX).
                </p>
              </div>

              {/* Action Buttons for Word, AI Camera & Manual */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <button
                  onClick={() => setShowAiCameraModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 active:scale-95 transition-all"
                  title="Chụp ảnh tài liệu/trang sách bằng máy ảnh để AI tự tạo câu hỏi"
                >
                  <Camera className="w-4 h-4" />
                  <span>📸 Máy Ảnh / Tài Liệu (AI)</span>
                </button>

                <button
                  onClick={() => setShowWordImportModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
                  title="Nhập câu hỏi tự động từ file Word .docx"
                >
                  <FileText className="w-4 h-4" />
                  <span>📄 Nhập File Word (.docx)</span>
                </button>

                <button
                  onClick={() => setShowAddQuestionModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Thủ Công</span>
                </button>
              </div>
            </div>

            {/* Thống kê kho đề theo bộ phận */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Thống kê kho đề theo bộ phận (số câu hiện có)</span>
              </div>
              <table className="w-full text-xs text-center">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-1 pr-2 font-semibold">Kho</th>
                    <th className="px-2 font-semibold">AT</th>
                    <th className="px-2 font-semibold">QT</th>
                    <th className="px-2 font-semibold">NQ</th>
                    <th className="px-2 font-semibold">TTD</th>
                    <th className="px-2 font-semibold">Chuyên môn</th>
                    <th className="px-2 font-semibold">Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: 'COMMON', label: 'Dùng chung mọi bộ phận' },
                    ...departments.map((d) => ({ code: d.code, label: `${d.code} - ${d.name}` })),
                    ...Object.keys(bankStats)
                      .filter((c) => c !== 'COMMON' && !departments.some((d) => d.code === c))
                      .map((c) => ({ code: c, label: `Kho ${c} (chưa khai báo bộ phận)` })),
                  ].map((row) => {
                    const r = bankStats[row.code] || { at: 0, qt: 0, nq: 0, ttd: 0, ax: 0 };
                    const total = r.at + r.qt + r.nq + r.ttd + r.ax;
                    return (
                      <tr key={row.code} className="border-t border-slate-800 text-slate-200">
                        <td className="text-left py-1.5 pr-2 font-medium">{row.label}</td>
                        <td className="font-mono">{r.at}</td>
                        <td className="font-mono">{r.qt}</td>
                        <td className="font-mono">{r.nq}</td>
                        <td className="font-mono">{r.ttd}</td>
                        <td className={`font-mono ${row.code !== 'COMMON' && r.ax === 0 ? 'text-rose-400 font-bold' : ''}`}>{r.ax}</td>
                        <td className="font-mono font-bold text-cyan-300">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-500 mt-2">
                Phòng thi của bộ phận X bốc: câu chuyên môn của kho X (bậc 1 → bậc thi) + câu dùng chung + câu riêng của kho X.
                Kho bộ phận có chuyên môn = 0 (màu đỏ) sẽ không đủ câu để tạo đề.
              </p>
            </div>

            {/* Filter */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo nội dung câu hỏi, điều luật, trích dẫn, mã quy định (VD: A4.1, TTD.6, AT)..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-400 font-mono">
                  <span>Hiển thị:</span>
                  <span className="font-bold text-cyan-300">{filteredQuestions.length}</span>
                  <span>/</span>
                  <span>{questions.length} câu</span>
                </div>
              </div>

              {/* Multi-Filter Bar: Department, Level, Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
                {/* 1. Kho đề theo bộ phận */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Kho đề bộ phận:</span>
                  </label>
                  <select
                    value={questionDepartmentFilter}
                    onChange={(e) => setQuestionDepartmentFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="ALL">Tất cả kho đề (Toàn bộ)</option>
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        Kho Bộ phận {d.code}: {d.name}
                      </option>
                    ))}
                    <option value="COMMON">Dùng chung (An toàn AT & Nội quy NQ)</option>
                  </select>
                </div>

                {/* 2. Bậc thi */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bậc câu hỏi:</span>
                  </label>
                  <select
                    value={questionLevelFilter}
                    onChange={(e) => setQuestionLevelFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="ALL">Tất cả bậc (1 - 8 & Chung)</option>
                    <option value="1">Bậc 1 (Sơ cấp, A1.x, TTD.1)</option>
                    <option value="2">Bậc 2 (A2.x, TTD.2)</option>
                    <option value="3">Bậc 3 (A3.x, TTD.3)</option>
                    <option value="4">Bậc 4 (A4.x, TTD.4)</option>
                    <option value="5">Bậc 5 (A5.x, TTD.5)</option>
                    <option value="6">Bậc 6 (A6.x, TTD.6)</option>
                    <option value="7">Bậc 7 (A7.x)</option>
                    <option value="8">Bậc 8</option>
                    <option value="COMMON">Dùng chung (Không chia bậc)</option>
                  </select>
                </div>

                {/* 3. Phân nhóm quy chuẩn */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>Phân nhóm quy định:</span>
                  </label>
                  <select
                    value={questionSectionFilter}
                    onChange={(e) => setQuestionSectionFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="ALL">Tất cả phân loại</option>
                    <option value="AT">Mức I: An toàn (AT - Dùng chung mọi bậc)</option>
                    <option value="QT">Mức II: Quy trình kỹ thuật (QT)</option>
                    <option value="NQ">Mức III: Nội quy lao động (NQ)</option>
                    <option value="TTD">Mức IV: Thị trường điện / Điều độ (TTD.X)</option>
                    <option value="AX">Mức V: Chuyên môn theo bậc (AX.n)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Question List */}
            <div className="flex flex-col gap-3">
              {filteredQuestions.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                  Không tìm thấy câu hỏi nào phù hợp với bộ lọc đã chọn.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const meta = parseQuestionCode(q.section, q.level, q.unit);
                  const deptInfo = departments.find((d) => d.code === meta.unit);
                  const deptDisplay = meta.unit === 'COMMON' 
                    ? 'Dùng chung' 
                    : (deptInfo ? `${deptInfo.name} (${deptInfo.code})` : `Kho ${meta.unit}`);

                  return (
                    <div
                      key={q.id || idx}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Mã quy chuẩn */}
                          <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs shrink-0">
                            {q.section}
                          </span>

                          {/* Bộ phận / Kho đề */}
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border shrink-0 ${
                            meta.unit === 'COMMON'
                              ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                              : meta.unit === 'A'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : meta.unit === 'B'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : meta.unit === 'C'
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}>
                            Kho: {deptDisplay}
                          </span>

                          {/* Bậc thi */}
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border shrink-0 ${
                            meta.levelNumber !== null
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700'
                          }`}>
                            {meta.levelNumber !== null ? `Bậc ${meta.levelNumber}` : 'Chung mọi bậc'}
                          </span>

                          {/* Nhóm quy định */}
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            {meta.groupType === 'AT' ? 'An toàn lao động' :
                             meta.groupType === 'NQ' ? 'Nội quy đơn vị' :
                             meta.groupType === 'QT' ? 'Quy trình kỹ thuật' :
                             meta.groupType === 'TTD' ? 'Thị trường điện' : 'Chuyên môn'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm('Xóa câu hỏi này khỏi ngân hàng?')) {
                              onUpdateQuestions(questions.filter((item) => item.id !== q.id));
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="font-semibold text-sm sm:text-base text-slate-100 leading-snug">
                        {q.question}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {Object.entries(q.options || {}).map(([key, optText]) => {
                          const isCorrect = q.correct.includes(key);
                          return (
                            <div
                              key={key}
                              className={`p-2.5 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-bold'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="mr-1.5 font-bold font-mono text-cyan-400">{key}.</span>
                              <span>{optText}</span>
                            </div>
                          );
                        })}
                      </div>

                      {q.citation && (
                        <div className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Căn cứ quy trình / pháp lý: {q.citation}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MA TRẬN ĐỀ THI & CHỌN SỐ CÂU TRONG MỖI NHÓM */}
        {activeTab === 'matrix' && (
          <div className="flex flex-col gap-6">
            {/* Success notification banner */}
            {importNotification && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{importNotification}</span>
              </div>
            )}

            {/* Header banner */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-cyan-400" />
                  <span>Ma Trận Đề Thi & Chọn Số Câu Trong Mỗi Nhóm</span>
                </h2>
                <p className="text-sm text-slate-400">
                  Thiết lập chính xác số lượng câu hỏi cần bốc từ mỗi nhóm (AT, QT, NQ, TTD, AX) cho từng phòng thi.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={handlePreviewExam}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md"
                  title="Bốc thử ngẫu nhiên một đề thi theo ma trận này để kiểm tra"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Bốc Thử Đề (Preview)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveMatrixConfig}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Ma Trận Phòng Thi</span>
                </button>
              </div>
            </div>

            {/* Room selection & Global stats */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Áp dụng cho phòng:</span>
                  <select
                    value={selectedMatrixRoomId}
                    onChange={(e) => setSelectedMatrixRoomId(e.target.value)}
                    className="flex-1 md:w-80 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.roomCode}] {r.roomName} ({r.totalQuestions} câu - {r.examTimeMinutes}p)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metrics Cards */}
                <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto justify-between md:justify-end">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                    <span className="text-slate-400">Tổng số câu đề thi:</span>
                    <span className="font-mono font-black text-cyan-300 text-sm">
                      {matrixAtCount + matrixQtCount + matrixNqCount + matrixTtdCount + matrixAxCount} câu
                    </span>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                    <span className="text-slate-400">Có sẵn trong kho:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {questions.length} câu
                    </span>
                  </div>

                  {/* Stock validation badge */}
                  {(matrixAtCount > (availableCounts.at || 0) ||
                    matrixQtCount > (availableCounts.qt || 0) ||
                    matrixNqCount > (availableCounts.nq || 0) ||
                    matrixTtdCount > (availableCounts.ttd || 0) ||
                    matrixAxCount > (availableCounts.ax || 0)) ? (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Số câu chọn vượt quá số câu có sẵn trong kho!</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Kho đủ câu hỏi đáp ứng ma trận</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click Matrix Presets */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mẫu Ma Trận Đề Chuẩn (1-Click Presets):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => applyMatrixPreset('spmo50')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all active:scale-95 group"
                  >
                    <span className="block font-bold text-xs text-slate-200 group-hover:text-cyan-300">
                      Chuẩn SPMO 50c
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      10 AT • 10 QT • 5 NQ • 5 TTD • 20 AX
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyMatrixPreset('at40')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all active:scale-95 group"
                  >
                    <span className="block font-bold text-xs text-slate-200 group-hover:text-cyan-300">
                      Sát Hạch An Toàn 40c
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      20 AT • 15 QT • 5 NQ (Chuyên AT)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyMatrixPreset('ax50')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-left transition-all active:scale-95 group"
                  >
                    <span className="block font-bold text-xs text-slate-200 group-hover:text-purple-300">
                      Chuyên Môn Sâu 50c
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      5 AT • 5 QT • 5 NQ • 5 TTD • 30 AX
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyMatrixPreset('ttd45')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition-all active:scale-95 group"
                  >
                    <span className="block font-bold text-xs text-slate-200 group-hover:text-indigo-300">
                      Trưởng Ca / Điều Độ 45c
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      10 AT • 10 QT • 5 NQ • 12 TTD • 8 AX
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyMatrixPreset('quick25')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-left transition-all active:scale-95 group"
                  >
                    <span className="block font-bold text-xs text-slate-200 group-hover:text-teal-300">
                      Ôn Luyện Nhanh 25c
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      5 AT • 5 QT • 5 NQ • 2 TTD • 8 AX
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyMatrixPreset('even')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all active:scale-95 group"
                  >
                    <span className="block font-bold text-xs text-slate-200 group-hover:text-amber-300">
                      Chia Đều Các Nhóm
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      8 câu mỗi nhóm (Đều nhau)
                    </span>
                  </button>
                </div>
              </div>

              {/* Segmented Percentage Progress Bar */}
              {(() => {
                const total = Math.max(1, matrixAtCount + matrixQtCount + matrixNqCount + matrixTtdCount + matrixAxCount);
                const pAt = ((matrixAtCount / total) * 100).toFixed(1);
                const pQt = ((matrixQtCount / total) * 100).toFixed(1);
                const pNq = ((matrixNqCount / total) * 100).toFixed(1);
                const pTtd = ((matrixTtdCount / total) * 100).toFixed(1);
                const pAx = ((matrixAxCount / total) * 100).toFixed(1);

                return (
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-medium">
                      <span>Tỷ lệ cơ cấu phân bổ đề thi (%):</span>
                      <span>100% (Tổng {total} câu)</span>
                    </div>

                    <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
                      {matrixAtCount > 0 && (
                        <div
                          style={{ width: `${pAt}%` }}
                          className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                          title={`AT: ${matrixAtCount} câu (${pAt}%)`}
                        />
                      )}
                      {matrixQtCount > 0 && (
                        <div
                          style={{ width: `${pQt}%` }}
                          className="bg-teal-400 h-full rounded-full transition-all duration-300"
                          title={`QT: ${matrixQtCount} câu (${pQt}%)`}
                        />
                      )}
                      {matrixNqCount > 0 && (
                        <div
                          style={{ width: `${pNq}%` }}
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          title={`NQ: ${matrixNqCount} câu (${pNq}%)`}
                        />
                      )}
                      {matrixTtdCount > 0 && (
                        <div
                          style={{ width: `${pTtd}%` }}
                          className="bg-indigo-400 h-full rounded-full transition-all duration-300"
                          title={`TTD: ${matrixTtdCount} câu (${pTtd}%)`}
                        />
                      )}
                      {matrixAxCount > 0 && (
                        <div
                          style={{ width: `${pAx}%` }}
                          className="bg-purple-500 h-full rounded-full transition-all duration-300"
                          title={`AX: ${matrixAxCount} câu (${pAx}%)`}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                        AT: {matrixAtCount}c ({pAt}%)
                      </span>
                      <span className="flex items-center gap-1.5 text-teal-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                        QT: {matrixQtCount}c ({pQt}%)
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        NQ: {matrixNqCount}c ({pNq}%)
                      </span>
                      <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                        TTD: {matrixTtdCount}c ({pTtd}%)
                      </span>
                      <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        AX: {matrixAxCount}c ({pAx}%)
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Individual Group Matrix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* GROUP 1: AT */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                      MỨC I: AN TOÀN (AT)
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      matrixAtCount > (availableCounts.at || 0)
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}>
                      Kho: {availableCounts.at || 0} câu
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base mb-1">
                    Kỹ Thuật An Toàn & Bảo Hộ Lao Động
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Quy chuẩn an toàn điện QCVN 01:2020/BCT, khoảng cách an toàn điện cao áp, tiếp đất di động, cấp cứu điện giật.
                  </p>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Số câu bốc vào đề:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMatrixAtCount(Math.max(0, matrixAtCount - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={availableCounts.at || 100}
                        value={matrixAtCount}
                        onChange={(e) => setMatrixAtCount(Math.max(0, Number(e.target.value)))}
                        className="w-16 py-1 text-center bg-slate-900 border border-cyan-500/50 rounded-lg text-cyan-300 font-mono font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setMatrixAtCount(matrixAtCount + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={Math.max(availableCounts.at || 15, 30)}
                    value={matrixAtCount}
                    onChange={(e) => setMatrixAtCount(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />

                  {matrixAtCount > (availableCounts.at || 0) && (
                    <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Vượt quá kho ({availableCounts.at || 0} câu). </span>
                      <button
                        type="button"
                        onClick={() => setMatrixAtCount(availableCounts.at || 0)}
                        className="underline font-bold hover:text-rose-300"
                      >
                        Đặt về {availableCounts.at || 0}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* GROUP 2: QT */}
              <div className="bg-slate-900/90 border border-teal-500/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
                      MỨC II: QUY TRÌNH (QT)
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      matrixQtCount > (availableCounts.qt || 0)
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}>
                      Kho: {availableCounts.qt || 0} câu
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base mb-1">
                    Quy Trình Kỹ Thuật & Vận Hành Thiết Bị
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Phiếu công tác, phiếu thao tác, quy trình vận hành máy biến áp, máy cắt cao thế, nguồn tự dùng và ắc quy trạm.
                  </p>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Số câu bốc vào đề:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMatrixQtCount(Math.max(0, matrixQtCount - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={availableCounts.qt || 100}
                        value={matrixQtCount}
                        onChange={(e) => setMatrixQtCount(Math.max(0, Number(e.target.value)))}
                        className="w-16 py-1 text-center bg-slate-900 border border-teal-500/50 rounded-lg text-teal-300 font-mono font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setMatrixQtCount(matrixQtCount + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={Math.max(availableCounts.qt || 15, 30)}
                    value={matrixQtCount}
                    onChange={(e) => setMatrixQtCount(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />

                  {matrixQtCount > (availableCounts.qt || 0) && (
                    <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Vượt quá kho ({availableCounts.qt || 0} câu). </span>
                      <button
                        type="button"
                        onClick={() => setMatrixQtCount(availableCounts.qt || 0)}
                        className="underline font-bold hover:text-rose-300"
                      >
                        Đặt về {availableCounts.qt || 0}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* GROUP 3: NQ */}
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                      MỨC III: NỘI QUY (NQ)
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      matrixNqCount > (availableCounts.nq || 0)
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}>
                      Kho: {availableCounts.nq || 0} câu
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base mb-1">
                    Nội Quy & Kỷ Luật Vận Hành
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Nội quy lao động ngành điện, văn hóa an toàn doanh nghiệp, chế độ giao nhận ca trực và quy định xử lý sự cố.
                  </p>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Số câu bốc vào đề:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMatrixNqCount(Math.max(0, matrixNqCount - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={availableCounts.nq || 100}
                        value={matrixNqCount}
                        onChange={(e) => setMatrixNqCount(Math.max(0, Number(e.target.value)))}
                        className="w-16 py-1 text-center bg-slate-900 border border-amber-500/50 rounded-lg text-amber-300 font-mono font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setMatrixNqCount(matrixNqCount + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={Math.max(availableCounts.nq || 10, 20)}
                    value={matrixNqCount}
                    onChange={(e) => setMatrixNqCount(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  {matrixNqCount > (availableCounts.nq || 0) && (
                    <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Vượt quá kho ({availableCounts.nq || 0} câu). </span>
                      <button
                        type="button"
                        onClick={() => setMatrixNqCount(availableCounts.nq || 0)}
                        className="underline font-bold hover:text-rose-300"
                      >
                        Đặt về {availableCounts.nq || 0}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* GROUP 4: TTD */}
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
                      MỨC IV: ĐIỀU ĐỘ (TTD)
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      matrixTtdCount > (availableCounts.ttd || 0)
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}>
                      Kho: {availableCounts.ttd || 0} câu
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base mb-1">
                    Quy Trình Thao Tác Điều Độ
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Quy định đàm thoại mệnh lệnh điều độ, xử lý sự cố rã lưới khu vực, quyền hạn Trưởng ca và điều khiển điện áp.
                  </p>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Số câu bốc vào đề:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMatrixTtdCount(Math.max(0, matrixTtdCount - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={availableCounts.ttd || 100}
                        value={matrixTtdCount}
                        onChange={(e) => setMatrixTtdCount(Math.max(0, Number(e.target.value)))}
                        className="w-16 py-1 text-center bg-slate-900 border border-indigo-500/50 rounded-lg text-indigo-300 font-mono font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setMatrixTtdCount(matrixTtdCount + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={Math.max(availableCounts.ttd || 10, 20)}
                    value={matrixTtdCount}
                    onChange={(e) => setMatrixTtdCount(Number(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />

                  {matrixTtdCount > (availableCounts.ttd || 0) && (
                    <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Vượt quá kho ({availableCounts.ttd || 0} câu). </span>
                      <button
                        type="button"
                        onClick={() => setMatrixTtdCount(availableCounts.ttd || 0)}
                        className="underline font-bold hover:text-rose-300"
                      >
                        Đặt về {availableCounts.ttd || 0}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* GROUP 5: AX */}
              <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                      CHUYÊN MÔN (AX)
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      matrixAxCount > (availableCounts.ax || 0)
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}>
                      Kho: {availableCounts.ax || 0} câu
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base mb-1">
                    Chuyên Môn Bậc Thợ & Vị Trí Công Tác
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Kiến thức chuyên sâu theo bậc thợ (Bậc 2 - 8) và vị trí công tác (Nhà máy điện A, Cơ khí B, Điện D, Trưởng ca C).
                  </p>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Số câu bốc vào đề:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMatrixAxCount(Math.max(0, matrixAxCount - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={availableCounts.ax || 100}
                        value={matrixAxCount}
                        onChange={(e) => setMatrixAxCount(Math.max(0, Number(e.target.value)))}
                        className="w-16 py-1 text-center bg-slate-900 border border-purple-500/50 rounded-lg text-purple-300 font-mono font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setMatrixAxCount(matrixAxCount + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={Math.max(availableCounts.ax || 25, 40)}
                    value={matrixAxCount}
                    onChange={(e) => setMatrixAxCount(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />

                  {matrixAxCount > (availableCounts.ax || 0) && (
                    <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Vượt quá kho ({availableCounts.ax || 0} câu). </span>
                      <button
                        type="button"
                        onClick={() => setMatrixAxCount(availableCounts.ax || 0)}
                        className="underline font-bold hover:text-rose-300"
                      >
                        Đặt về {availableCounts.ax || 0}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DEDICATED SECTION: QUẢN LÝ PHÂN BỔ BẬC THI TÍCH LŨY (LẤY TỪ BẬC THẤP ĐẾN BẬC THI) */}
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Cơ Cấu Phân Bổ Bậc Thi Tích Lũy (Chuyên Môn AX)</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-300 font-bold text-xs border border-blue-500/30">
                      Kho Đề: {departments.find((d) => d.code === matrixEligible.targetUnit)?.name || 'Bộ phận ' + matrixEligible.targetUnit} (Kho {matrixEligible.targetUnit})
                    </span>

                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 font-bold text-xs border border-amber-500/30">
                      Bậc Thi Phòng: Bậc {matrixEligible.targetLevel}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Nguyên tắc quy chuẩn: Bốc câu hỏi tích lũy từ bậc thấp nhất (Bậc 1) đến bậc thi của phòng (Bậc {matrixEligible.targetLevel}). Câu hỏi của các bộ phận khác và câu hỏi có bậc cao hơn (&gt; Bậc {matrixEligible.targetLevel}) bị loại bỏ hoàn toàn.
                  </p>
                </div>

                {/* Mode Selector Toggle: Tự Động vs Tùy Chỉnh */}
                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setMatrixLevelMode('auto');
                      updateMatrixLevelAuto(matrixAxCount, matrixLevelPreset);
                    }}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      matrixLevelMode === 'auto'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Tự Động Phân Bổ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatrixLevelMode('manual')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      matrixLevelMode === 'manual'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-cyan-300" />
                    <span>🛠️ Tùy Chỉnh Từng Bậc</span>
                  </button>
                </div>
              </div>

              {/* CHẾ ĐỘ 1: TỰ ĐỘNG PHÂN BỔ */}
              {matrixLevelMode === 'auto' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Chọn Quy Tắc Tự Động Phân Bổ:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setMatrixLevelPreset('ladder');
                          updateMatrixLevelAuto(matrixAxCount, 'ladder');
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                          matrixLevelPreset === 'ladder'
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <span className="font-extrabold text-slate-200">📈 Lũy Tiến Bậc Thang</span>
                        <span className="text-[10px] text-slate-400">Bậc thấp ít câu, bậc cao nhiều câu hơn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMatrixLevelPreset('even');
                          updateMatrixLevelAuto(matrixAxCount, 'even');
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                          matrixLevelPreset === 'even'
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <span className="font-extrabold text-slate-200">⚖️ Chia Đều Các Bậc</span>
                        <span className="text-[10px] text-slate-400">Chia đều số câu từ Bậc 1 đến Bậc {matrixEligible.targetLevel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMatrixLevelPreset('focus_target');
                          updateMatrixLevelAuto(matrixAxCount, 'focus_target');
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                          matrixLevelPreset === 'focus_target'
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <span className="font-extrabold text-slate-200">🎯 Tập Trung Bậc Thi</span>
                        <span className="text-[10px] text-slate-400">60% câu hỏi ở Bậc {matrixEligible.targetLevel}, 40% bậc dưới</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Level Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                    {Array.from({ length: matrixEligible.targetLevel }, (_, i) => i + 1).map((lv) => {
                      const count = matrixLevelCounts[String(lv)] || 0;
                      const avail = (matrixEligible.axPoolByLevel[lv] || []).length;
                      const isTarget = lv === matrixEligible.targetLevel;

                      return (
                        <div
                          key={lv}
                          className={`p-4 rounded-2xl border transition-all ${
                            isTarget
                              ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/40'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-slate-200">
                              {isTarget ? `⭐ BẬC ${lv} (BẬC THI)` : `BẬC ${lv}`}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold border ${
                              count > avail
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              Kho: {avail}c
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-black font-mono text-purple-300">
                              {count}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">câu hỏi</span>
                            <span className="text-[11px] text-slate-500 ml-auto font-mono">
                              ({matrixAxCount > 0 ? ((count / matrixAxCount) * 100).toFixed(0) : 0}%)
                            </span>
                          </div>

                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${matrixAxCount > 0 ? Math.min(100, (count / matrixAxCount) * 100) : 0}%` }}
                              className={`h-full rounded-full ${isTarget ? 'bg-amber-400' : 'bg-purple-500'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CHẾ ĐỘ 2: TÙY CHỈNH CHỌN SỐ CÂU TRONG MỖI BẬC */}
              {matrixLevelMode === 'manual' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Tùy Chỉnh Chọn Số Câu Trong Mỗi Bậc (Từ Bậc 1 Đến Bậc {matrixEligible.targetLevel}):
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Điều chỉnh số lượng câu hỏi cần bốc cho từng bậc thợ theo ý muốn
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const perLvl = Math.floor(matrixAxCount / matrixEligible.targetLevel);
                          const rem = matrixAxCount % matrixEligible.targetLevel;
                          const nextCounts: Record<string, number> = {};
                          for (let lv = 1; lv <= matrixEligible.targetLevel; lv++) {
                            nextCounts[String(lv)] = perLvl + (lv === matrixEligible.targetLevel ? rem : 0);
                          }
                          setMatrixLevelCounts(nextCounts);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
                      >
                        ⚖️ Chia Đều
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateMatrixLevelAuto(matrixAxCount, 'ladder');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold border border-purple-500/40 transition-colors"
                      >
                        📈 Đặt Lũy Tiến
                      </button>
                    </div>
                  </div>

                  {/* Manual Stepper Cards for each level 1..targetLevel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: matrixEligible.targetLevel }, (_, i) => i + 1).map((lv) => {
                      const count = matrixLevelCounts[String(lv)] || 0;
                      const avail = (matrixEligible.axPoolByLevel[lv] || []).length;
                      const isTarget = lv === matrixEligible.targetLevel;

                      return (
                        <div
                          key={lv}
                          className={`p-4 rounded-2xl border transition-all ${
                            isTarget
                              ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/30'
                              : 'bg-slate-950/70 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                              {isTarget && <span className="text-amber-400">⭐</span>}
                              <span>{isTarget ? `Bậc ${lv} (Bậc Thi Chính)` : `Bậc ${lv} (Bậc Lũy Tiến)`}</span>
                            </span>

                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold border ${
                              count > avail
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              Kho có: {avail} câu
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 mt-3">
                            <span className="text-xs text-slate-400">Số câu bốc:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleMatrixLevelCountChange(lv, count - 1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={Math.max(avail, 50)}
                                value={count}
                                onChange={(e) => handleMatrixLevelCountChange(lv, Number(e.target.value))}
                                className="w-14 py-1 text-center bg-slate-900 border border-purple-500/50 rounded-lg text-purple-300 font-mono font-bold text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => handleMatrixLevelCountChange(lv, count + 1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-90"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max={Math.max(avail || 15, 30)}
                            value={count}
                            onChange={(e) => handleMatrixLevelCountChange(lv, Number(e.target.value))}
                            className="w-full mt-3 accent-purple-400 cursor-pointer"
                          />

                          {count > avail && (
                            <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Vượt quá kho ({avail} câu). </span>
                              <button
                                type="button"
                                onClick={() => handleMatrixLevelCountChange(lv, avail)}
                                className="underline font-bold hover:text-rose-300"
                              >
                                Đặt về {avail}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Locked higher levels (targetLevel + 1 .. 7) */}
                    {Array.from({ length: Math.max(0, 7 - matrixEligible.targetLevel) }, (_, i) => matrixEligible.targetLevel + 1 + i).map((higherLv) => (
                      <div
                        key={higherLv}
                        className="p-4 rounded-2xl border border-slate-800/60 bg-slate-950/30 opacity-50 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-400 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Bậc {higherLv}</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 font-mono">
                            Đã khóa
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          Không bốc (Vượt quá Bậc {matrixEligible.targetLevel} của phòng thi này).
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Summary row for manual mode */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Tổng số câu chuyên môn AX đã cấu hình:</span>
                      <span className="font-mono font-black text-purple-300 text-sm">
                        {Object.values(matrixLevelCounts).reduce((a, b) => a + b, 0)} câu
                      </span>
                    </div>

                    <span className="text-slate-400 italic text-[11px]">
                      * Tổng số câu chuyên môn AX tự động đồng bộ lên ma trận chung của phòng thi.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TRỢ LÝ GOOGLE AI */}
        {activeTab === 'ai_gen' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {/* Quick-action AI Cards for Camera and Word */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => setShowAiCameraModal(true)}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 hover:border-purple-400 cursor-pointer transition-all shadow-xl hover:shadow-purple-950/50 group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-100 group-hover:text-purple-300 transition-colors">
                  📸 Máy Ảnh & Quét Tài Liệu
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Chụp ảnh trang sách, đề thi in giấy bằng máy ảnh điện thoại/webcam để Google AI trích xuất câu hỏi tự động.
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-purple-400 group-hover:underline">
                  Mở máy ảnh quét ngay →
                </span>
              </div>

              <div 
                onClick={() => setShowWordImportModal(true)}
                className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 cursor-pointer transition-all shadow-xl hover:shadow-cyan-950/50 group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                  📄 Nhập File Word (.docx)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tải file ngân hàng câu hỏi định dạng Word, tự nhận diện A/B/C/D, in đậm đáp án và trích dẫn quy trình.
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-cyan-400 group-hover:underline">
                  Tải lên file Word →
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-100">
                    Soạn Thảo Câu Hỏi Chuyên Môn Bằng Google AI
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-300">
                    Nhập chủ đề kỹ thuật để AI tự động soạn câu hỏi 4 phương án, đáp án và trích dẫn chuẩn xác.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-purple-500/20">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Chủ đề câu hỏi hoặc tình huống vận hành:
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="VD: Sự cố chạm đất cuộn stator, Thao tác dao cách ly khi có điện thoại..."
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Bộ phận áp dụng:
                    </label>
                    <select
                      value={aiDept}
                      onChange={(e) => setAiDept(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-400"
                    >
                      <option value="Nhà máy điện">A - Nhà máy điện</option>
                      <option value="XSC cơ">B - XSC cơ</option>
                      <option value="Trưởng ca">C - Trưởng ca vận hành</option>
                      <option value="XSC điện">D - XSC điện</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Bậc thi:
                    </label>
                    <select
                      value={aiLevel}
                      onChange={(e) => setAiLevel(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-400"
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
                </div>

                <button
                  onClick={handleGenerateQuestionByAI}
                  disabled={aiLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Google AI Đang Soạn Câu Hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Sinh Câu Hỏi Mới Và Lưu Vào Ngân Hàng</span>
                    </>
                  )}
                </button>

                {aiGeneratedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã tạo câu hỏi thành công và tự động thêm vào Ngân hàng đề thi!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create Room */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateRoom} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp my-auto max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              <span>Tạo Phòng Thi Mới & Mã Khóa</span>
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tên phòng thi:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thi Nâng Bậc Thợ Đợt 2"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Mã phòng:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SPM-88"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-cyan-300 uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-medium">Mã Khóa (PIN):</label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-cyan-400 text-[11px] hover:underline"
                    >
                      Sinh ngẫu nhiên
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="VD: 8899"
                    value={newRoomPin}
                    onChange={(e) => setNewRoomPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-amber-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bộ phận / Kho đề:</label>
                  <select
                    value={newRoomUnit}
                    onChange={(e) => handleRoomUnitChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bậc thi:</label>
                  <select
                    value={newRoomLevel}
                    onChange={(e) => handleRoomLevelChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={String(n)}>Bậc {n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Thời gian (phút):</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={newRoomTime}
                    onChange={(e) => setNewRoomTime(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold text-xs">
                      Phân bổ số câu trong mỗi nhóm:
                    </label>
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Tổng: {newRoomAtCount + newRoomQtCount + newRoomNqCount + newRoomTtdCount + newRoomAxCount} câu
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 p-2 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-cyan-400">AT</span>
                      <input
                        type="number"
                        min="0"
                        value={newRoomAtCount}
                        onChange={(e) => setNewRoomAtCount(Math.max(0, Number(e.target.value)))}
                        className="w-full text-center py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono font-bold"
                      />
                      <span className="text-[9px] text-slate-500 mt-0.5">Kho: {newRoomAvail.at}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-teal-400">QT</span>
                      <input
                        type="number"
                        min="0"
                        value={newRoomQtCount}
                        onChange={(e) => setNewRoomQtCount(Math.max(0, Number(e.target.value)))}
                        className="w-full text-center py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono font-bold"
                      />
                      <span className="text-[9px] text-slate-500 mt-0.5">Kho: {newRoomAvail.qt}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-amber-400">NQ</span>
                      <input
                        type="number"
                        min="0"
                        value={newRoomNqCount}
                        onChange={(e) => setNewRoomNqCount(Math.max(0, Number(e.target.value)))}
                        className="w-full text-center py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono font-bold"
                      />
                      <span className="text-[9px] text-slate-500 mt-0.5">Kho: {newRoomAvail.nq}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-indigo-400">TTD</span>
                      <input
                        type="number"
                        min="0"
                        value={newRoomTtdCount}
                        onChange={(e) => setNewRoomTtdCount(Math.max(0, Number(e.target.value)))}
                        className="w-full text-center py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono font-bold"
                      />
                      <span className="text-[9px] text-slate-500 mt-0.5">Kho: {newRoomAvail.ttd}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-purple-400">AX</span>
                      <input
                        type="number"
                        min="0"
                        value={newRoomAxCount}
                        onChange={(e) => setNewRoomAxCount(Math.max(0, Number(e.target.value)))}
                        className="w-full text-center py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono font-bold"
                      />
                      <span className="text-[9px] text-slate-500 mt-0.5">Kho: {newRoomAvail.ax}</span>
                    </div>
                  </div>

                  {/* Quick preset chips */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => { setNewRoomAtCount(10); setNewRoomQtCount(10); setNewRoomNqCount(5); setNewRoomTtdCount(5); setNewRoomAxCount(20); }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium"
                    >
                      Chuẩn 50c
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewRoomAtCount(20); setNewRoomQtCount(15); setNewRoomNqCount(5); setNewRoomTtdCount(0); setNewRoomAxCount(0); }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium"
                    >
                      An toàn 40c
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewRoomAtCount(5); setNewRoomQtCount(5); setNewRoomNqCount(5); setNewRoomTtdCount(2); setNewRoomAxCount(8); }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium"
                    >
                      Luyện 25c
                    </button>
                  </div>
                </div>
              </div>

              <RoomPoolSummary
                eligible={newRoomEligible}
                unitName={departments.find((d) => d.code === newRoomUnit)?.name || 'Bộ phận ' + newRoomUnit}
                counts={{ at: newRoomAtCount, qt: newRoomQtCount, nq: newRoomNqCount, ttd: newRoomTtdCount, ax: newRoomAxCount }}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="lockCheckbox"
                  checked={newRoomLock}
                  onChange={(e) => setNewRoomLock(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700"
                />
                <label htmlFor="lockCheckbox" className="text-slate-300 text-xs font-semibold cursor-pointer">
                  Khóa phòng thi ngay khi tạo (Yêu cầu nhập mã PIN)
                </label>
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateRoomModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                Tạo Phòng Thi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Room & Matrix Configuration */}
      {showEditRoomModal && editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveEditRoom} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>Sửa Phòng Thi & Ma Trận Đề</span>
              </h3>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {editingRoom.roomCode}
              </span>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tên phòng thi:</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Mã phòng:</label>
                  <input
                    type="text"
                    disabled
                    value={editingRoom.roomCode}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-400 uppercase cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Mã Khóa (PIN):</label>
                  <input
                    type="text"
                    placeholder="VD: 8899"
                    value={newRoomPin}
                    onChange={(e) => setNewRoomPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-amber-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Thời gian (phút):</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={newRoomTime}
                    onChange={(e) => setNewRoomTime(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bộ phận / Ban:</label>
                  <select
                    value={newRoomUnit}
                    onChange={(e) => handleRoomUnitChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Bậc thi của phòng:</label>
                <select
                  value={newRoomLevel}
                  onChange={(e) => handleRoomLevelChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={String(n)}>Bậc {n}</option>
                  ))}
                </select>
              </div>

              {/* Group Counts Section in Edit Modal */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Số câu bốc trong mỗi nhóm (Ma trận):</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                    Tổng: {newRoomAtCount + newRoomQtCount + newRoomNqCount + newRoomTtdCount + newRoomAxCount} câu
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-cyan-400">AT</span>
                    <input
                      type="number"
                      min="0"
                      value={newRoomAtCount}
                      onChange={(e) => setNewRoomAtCount(Math.max(0, Number(e.target.value)))}
                      className="w-full text-center py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-500 mt-1">Kho: {newRoomAvail.at}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-teal-400">QT</span>
                    <input
                      type="number"
                      min="0"
                      value={newRoomQtCount}
                      onChange={(e) => setNewRoomQtCount(Math.max(0, Number(e.target.value)))}
                      className="w-full text-center py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-500 mt-1">Kho: {newRoomAvail.qt}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-amber-400">NQ</span>
                    <input
                      type="number"
                      min="0"
                      value={newRoomNqCount}
                      onChange={(e) => setNewRoomNqCount(Math.max(0, Number(e.target.value)))}
                      className="w-full text-center py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-500 mt-1">Kho: {newRoomAvail.nq}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-indigo-400">TTD</span>
                    <input
                      type="number"
                      min="0"
                      value={newRoomTtdCount}
                      onChange={(e) => setNewRoomTtdCount(Math.max(0, Number(e.target.value)))}
                      className="w-full text-center py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-500 mt-1">Kho: {newRoomAvail.ttd}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-purple-400">AX</span>
                    <input
                      type="number"
                      min="0"
                      value={newRoomAxCount}
                      onChange={(e) => setNewRoomAxCount(Math.max(0, Number(e.target.value)))}
                      className="w-full text-center py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-500 mt-1">Kho: {newRoomAvail.ax}</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => { setNewRoomAtCount(10); setNewRoomQtCount(10); setNewRoomNqCount(5); setNewRoomTtdCount(5); setNewRoomAxCount(20); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium"
                  >
                    Chuẩn 50c
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewRoomAtCount(20); setNewRoomQtCount(15); setNewRoomNqCount(5); setNewRoomTtdCount(0); setNewRoomAxCount(0); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium"
                  >
                    An toàn 40c
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewRoomAtCount(5); setNewRoomQtCount(5); setNewRoomNqCount(5); setNewRoomTtdCount(5); setNewRoomAxCount(30); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium"
                  >
                    Chuyên môn 50c
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewRoomAtCount(5); setNewRoomQtCount(5); setNewRoomNqCount(5); setNewRoomTtdCount(2); setNewRoomAxCount(8); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium"
                  >
                    Luyện 25c
                  </button>
                </div>
              </div>

              <RoomPoolSummary
                eligible={newRoomEligible}
                unitName={departments.find((d) => d.code === newRoomUnit)?.name || 'Bộ phận ' + newRoomUnit}
                counts={{ at: newRoomAtCount, qt: newRoomQtCount, nq: newRoomNqCount, ttd: newRoomTtdCount, ax: newRoomAxCount }}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editLockCheckbox"
                  checked={newRoomLock}
                  onChange={(e) => setNewRoomLock(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700"
                />
                <label htmlFor="editLockCheckbox" className="text-slate-300 text-xs font-semibold cursor-pointer">
                  Khóa phòng thi (Yêu cầu thí sinh nhập mã PIN khi vào thi)
                </label>
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEditRoomModal(false);
                  setEditingRoom(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Preview Exam Sample */}
      {showPreviewExamModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>Xem Trước Đề Thi Mẫu (Bốc Theo Ma Trận)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      {previewQuestions.length} câu
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phân bổ: {matrixAtCount} AT • {matrixQtCount} QT • {matrixNqCount} NQ • {matrixTtdCount} TTD • {matrixAxCount} AX
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPreviewExamModal(false)}
                className="p-1 text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions preview list */}
            <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2 my-4 space-y-3.5">
              {previewQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[11px] shrink-0 border border-cyan-500/30">
                        Câu {idx + 1} ({q.section})
                      </span>
                      <p className="font-semibold text-slate-100 text-sm leading-snug">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 pt-1">
                    {Object.entries(q.options || {}).map(([key, opt]) => {
                      const isCorrect = q.correct.includes(key);
                      return (
                        <div
                          key={key}
                          className={`p-1.5 rounded-lg border text-[11px] ${
                            isCorrect
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="mr-1">{key}.</span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.citation && (
                    <p className="text-[10px] text-slate-500 italic pl-2">
                      Căn cứ: {q.citation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handlePreviewExam}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Bốc ngẫu nhiên đề khác</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewExamModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Candidate */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddCandidate} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Thêm Thí Sinh Vào Danh Sách</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Họ và tên thí sinh:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trần Văn Nam"
                  value={newCandName}
                  onChange={(e) => setNewCandName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Mã nhân viên (tùy chọn):</label>
                <input
                  type="text"
                  placeholder="VD: SPM-0284"
                  value={newCandCode}
                  onChange={(e) => setNewCandCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bộ phận:</label>
                  <select
                    value={newCandUnit}
                    onChange={(e) => setNewCandUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bậc thi:</label>
                  <select
                    value={newCandLevel}
                    onChange={(e) => setNewCandLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {['2', '3', '4', '5', '6', '7', '8'].map((lv) => (
                      <option key={lv} value={lv}>
                        Bậc {lv}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Phòng thi chỉ định:</label>
                <select
                  value={newCandRoom}
                  onChange={(e) => setNewCandRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.roomCode}>
                      {r.roomCode} - {r.roomName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowAddCandidateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                Thêm Vào Danh Sách
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Question */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateQuestion} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Thêm Câu Hỏi Trắc Nghiệm Mới</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nội dung câu hỏi:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập câu hỏi..."
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Phương án A:</label>
                <input
                  type="text"
                  required
                  value={newQOptA}
                  onChange={(e) => setNewQOptA(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Phương án B:</label>
                <input
                  type="text"
                  required
                  value={newQOptB}
                  onChange={(e) => setNewQOptB(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Phương án C:</label>
                <input
                  type="text"
                  value={newQOptC}
                  onChange={(e) => setNewQOptC(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Phương án D:</label>
                <input
                  type="text"
                  value={newQOptD}
                  onChange={(e) => setNewQOptD(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Đáp án đúng:</label>
                  <select
                    value={newQCorrect}
                    onChange={(e) => setNewQCorrect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-bold text-cyan-300"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="AB">AB (Nhiều đáp án)</option>
                    <option value="AC">AC (Nhiều đáp án)</option>
                    <option value="ABD">ABD (Nhiều đáp án)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Nhóm:</label>
                  <select
                    value={newQSection}
                    onChange={(e) => setNewQSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                  >
                    <option value="AT">Mức I (AT - An toàn)</option>
                    <option value="QT">Mức II (QT - Quy trình)</option>
                    <option value="NQ">Mức III (NQ - Nội quy)</option>
                    <option value="TTD">Mức IV (TTD - Điều độ)</option>
                    <option value="A5.1">Chuyên môn A5.1</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Căn cứ quy trình / trích dẫn:</label>
                <input
                  type="text"
                  placeholder="VD: Điều 12, Quy chuẩn QCVN 01:2020/BCT"
                  value={newQCitation}
                  onChange={(e) => setNewQCitation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowAddQuestionModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                Lưu Câu Hỏi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Word .docx Question Import */}
      <WordImportModal
        isOpen={showWordImportModal}
        onClose={() => setShowWordImportModal(false)}
        onImportQuestions={handleImportWordQuestions}
        departments={departments}
        existingQuestions={questions}
      />

      {/* Modal: AI Camera & Document Question Generator */}
      <AiCameraDocumentModal
        isOpen={showAiCameraModal}
        onClose={() => setShowAiCameraModal(false)}
        onAddQuestions={handleAddAiCameraQuestions}
      />

      {/* Modal: Room QR Code Display */}
      {qrModalRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setQrModalRoom(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="font-black text-base text-slate-100">
              Quét Mã Vào Phòng Thi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Dùng camera điện thoại để quét mã và vào phòng ngay lập tức
            </p>

            <div className="p-3 bg-white rounded-2xl shadow-xl inline-block mx-auto mb-4 border-4 border-slate-800">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  typeof window !== 'undefined'
                    ? `${window.location.origin}${window.location.pathname}?room=${qrModalRoom.roomCode}`
                    : ''
                )}`}
                alt="Room QR Code"
                className="w-48 h-48 rounded-lg"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Phòng:</span>
                <span className="font-bold text-cyan-400 font-mono">{qrModalRoom.roomCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tên:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[180px]">{qrModalRoom.roomName}</span>
              </div>
              {qrModalRoom.isLocked && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã Khóa (PIN):</span>
                  <span className="font-bold text-amber-300 font-mono">{qrModalRoom.accessPin}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                handleCopyRoomLink(qrModalRoom);
                setQrModalRoom(null);
              }}
              className="w-full mt-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>Sao chép link & đóng</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Google Apps Script Deployment Guide & Source Code */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative animate-scaleUp my-auto max-h-[92vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>Triển Khai Lên Google Apps Script</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Tự động lưu Google Sheets
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chạy hoàn toàn miễn phí trên Google Drive, tự động tạo 3 sheet: PHONG_THI, THI_SINH, CAU_HOI
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="p-1 text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-2 my-3">
              <button
                onClick={() => setAppsScriptTab('guide')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  appsScriptTab === 'guide'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Hướng Dẫn Cài Đặt (3 phút)
              </button>
              <button
                onClick={() => setAppsScriptTab('code_gs')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  appsScriptTab === 'code_gs'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Mã Nguồn Code.gs
              </button>
              <button
                onClick={() => setAppsScriptTab('index_html')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  appsScriptTab === 'index_html'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Mã Nguồn Index.html
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto max-h-80 pr-1 text-xs sm:text-sm text-slate-300">
              {appsScriptTab === 'guide' && (
                <div className="space-y-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                    <p>
                      <strong>Tạo Google Sheet mới:</strong> Vào <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-bold">sheets.new</a> để tạo 1 bảng tính Google Trang tính mới.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                    <p>
                      <strong>Mở Apps Script:</strong> Trên menu của Google Sheet, bấm <em>Tiện ích mở rộng (Extensions)</em> &gt; <em>Apps Script</em>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                    <p>
                      <strong>Dán mã nguồn:</strong><br />
                      • Dán tab <em>Code.gs</em> vào file <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">Code.gs</code>.<br />
                      • Bấm dấu <strong>+</strong> &gt; Chọn <strong>HTML</strong> &gt; Đặt tên là <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">Index</code> &gt; Dán toàn bộ nội dung từ tab <em>Index.html</em>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">4</span>
                    <p>
                      <strong>Chạy khởi tạo Sheet:</strong> Chọn hàm <code className="text-emerald-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">initDatabase</code> &gt; Bấm nút <strong>Chạy (Run)</strong> và cấp quyền Google Drive lần đầu. Sheet sẽ tự động sinh 3 tab: <strong className="text-slate-100">PHONG_THI, THI_SINH, CAU_HOI</strong>!
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">5</span>
                    <p>
                      <strong>Triển khai Web App:</strong> Bấm <em>Triển khai (Deploy)</em> &gt; <em>Tùy chọn triển khai mới</em> &gt; Chọn <strong>Ứng dụng web (Web app)</strong> &gt; Chọn <strong>Ai có quyền truy cập: Bất kỳ ai (Anyone)</strong> &gt; Bấm Triển khai và nhận link Web App cho thí sinh!
                    </p>
                  </div>
                </div>
              )}

              {appsScriptTab === 'code_gs' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Dán vào file <code className="text-cyan-300">Code.gs</code> trong Google Apps Script:</span>
                    <button
                      onClick={() => {
                        const code = `/**
 * SPMO Pro - Google Apps Script Backend (Code.gs)
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.initialRoom = (e && e.parameter && e.parameter.room) ? e.parameter.room : '';
  return template.evaluate()
    .setTitle('SPMO Pro - Hệ Thống Thi Trắc Nghiệm')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRooms = ss.getSheetByName('PHONG_THI') || ss.insertSheet('PHONG_THI');
  if (sheetRooms.getLastRow() === 0) {
    sheetRooms.appendRow(['Mã Phòng', 'Tên Phòng', 'Mã Khóa (PIN)', 'Đang Khóa?', 'Bộ Phận', 'Bậc Thi', 'Thời Gian (Phút)', 'Số Câu', 'Ghi Chú', 'Ngày Tạo']);
    sheetRooms.appendRow(['SPM-2026', 'Kỳ Thi Nâng Bậc Nghề Đợt 1', '8899', 'TRUE', 'A', '5', 60, 50, 'Phòng thi chính thức có mã khóa', new Date()]);
  }
  var sheetCandidates = ss.getSheetByName('THI_SINH') || ss.insertSheet('THI_SINH');
  if (sheetCandidates.getLastRow() === 0) {
    sheetCandidates.appendRow(['Thời Gian', 'Họ Và Tên', 'Mã NV', 'Bộ Phận', 'Bậc', 'Phòng Thi', 'Mã Đề', 'Điểm', 'Số Câu Đúng', 'Tổng Câu', 'Thời Gian Làm', 'Số Lần Rời Màn Hình', 'Trạng Thái']);
  }
  var sheetQuestions = ss.getSheetByName('CAU_HOI') || ss.insertSheet('CAU_HOI');
  if (sheetQuestions.getLastRow() === 0) {
    sheetQuestions.appendRow(['ID', 'Nội Dung Câu Hỏi', 'Phương Án A', 'Phương Án B', 'Phương Án C', 'Phương Án D', 'Đáp Án Đúng', 'Nhóm', 'Bậc', 'Trích Dẫn Quy Trình', 'Giải Thích']);
  }
  return { status: 'ok' };
}

function apiGetInitialData() {
  initDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rRows = ss.getSheetByName('PHONG_THI').getDataRange().getValues();
  var rooms = [];
  for (var i = 1; i < rRows.length; i++) {
    if (rRows[i][0]) {
      rooms.push({
        roomCode: String(rRows[i][0]),
        roomName: String(rRows[i][1]),
        accessPin: String(rRows[i][2] || ''),
        isLocked: String(rRows[i][3]).toUpperCase() === 'TRUE',
        unit: String(rRows[i][4] || 'A'),
        level: String(rRows[i][5] || '5'),
        examTimeMinutes: Number(rRows[i][6]) || 60,
        totalQuestions: Number(rRows[i][7]) || 50
      });
    }
  }
  var cRows = ss.getSheetByName('THI_SINH').getDataRange().getValues();
  var candidates = [];
  for (var j = 1; j < cRows.length; j++) {
    if (cRows[j][1]) {
      candidates.push({
        fullName: String(cRows[j][1]),
        unitName: String(cRows[j][3] || ''),
        level: String(cRows[j][4] || ''),
        roomCode: String(cRows[j][5] || ''),
        score: cRows[j][7] !== '' ? Number(cRows[j][7]) : undefined,
        status: String(cRows[j][12] || '')
      });
    }
  }
  var qRows = ss.getSheetByName('CAU_HOI').getDataRange().getValues();
  var questions = [];
  for (var k = 1; k < qRows.length; k++) {
    if (qRows[k][1]) {
      questions.push({
        id: 'Q-' + k,
        question: String(qRows[k][1]),
        options: { A: String(qRows[k][2]||''), B: String(qRows[k][3]||''), C: String(qRows[k][4]||''), D: String(qRows[k][5]||'') },
        correct: String(qRows[k][6] || 'A'),
        section: String(qRows[k][7] || 'AT'),
        citation: String(qRows[k][9] || '')
      });
    }
  }
  return { rooms: rooms, candidates: candidates, questions: questions };
}

function apiSubmitExam(attempt) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('THI_SINH') || ss.insertSheet('THI_SINH');
  var elapsedText = Math.floor(attempt.elapsedSeconds / 60) + 'p ' + (attempt.elapsedSeconds % 60) + 's';
  sheet.appendRow([
    new Date(), attempt.candidateName, '', attempt.unitName, attempt.level,
    attempt.roomCode, attempt.examCode, attempt.score, attempt.correct, attempt.total,
    elapsedText, attempt.focusViolations || 0, attempt.status || 'ĐÃ NỘP BÀI'
  ]);
  return { status: 'success' };
}`;
                        navigator.clipboard.writeText(code);
                        setCopiedScript('CODE_GS');
                        setTimeout(() => setCopiedScript(null), 3000);
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedScript === 'CODE_GS' ? '✓ Đã sao chép!' : 'Sao chép Code.gs'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-60 leading-relaxed">
{`function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.initialRoom = (e && e.parameter && e.parameter.room) ? e.parameter.room : '';
  return template.evaluate()
    .setTitle('SPMO Pro - Hệ Thống Thi Trắc Nghiệm')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Tự động tạo 3 sheet: PHONG_THI, THI_SINH, CAU_HOI
}`}
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    File đầy đủ đã được lưu tại <code className="text-cyan-400">/apps-script/Code.gs</code> trong dự án.
                  </p>
                </div>
              )}

              {appsScriptTab === 'index_html' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">File giao diện web hoàn chỉnh cho Apps Script:</span>
                    <button
                      onClick={() => {
                        alert('Nội dung file Index.html hoàn chỉnh đã được tạo sẵn tại thư mục /apps-script/Index.html trong dự án. Bạn có thể mở file này và sao chép toàn bộ.');
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Xem file /apps-script/Index.html</span>
                    </button>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                    <p className="font-semibold text-slate-200">
                      File <code className="text-emerald-400 font-mono">/apps-script/Index.html</code> đã được đóng gói sẵn 100%:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
                      <li>Giao diện Dark Mode Tailwind CSS chạy mượt trên cả mobile và desktop.</li>
                      <li>Tích hợp đầy đủ chức năng Thí sinh làm bài thi (hẹn giờ, điều hướng, khóa phòng thi).</li>
                      <li>Tự động kết nối với hàm <code className="text-cyan-300 font-mono">google.script.run.apiSubmitExam()</code> để ghi ngay bài thi vào Google Sheet.</li>
                      <li>Bảng quản trị Admin đồng bộ 2 chiều với Google Sheets.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-3">
              <span className="text-[11px] text-slate-500">
                Tài liệu chi tiết tại: <code className="text-slate-400 font-mono">/apps-script/HUONG_DAN_CAI_DAT_APPS_SCRIPT.md</code>
              </span>
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: In Đề Thi Giấy A4 & Đáp Án */}
      {printModalRoom && (
        <PrintExamModal
          room={printModalRoom}
          departments={departments}
          questions={questions}
          onClose={() => setPrintModalRoom(null)}
        />
      )}

      {/* Modal: Biên Bản Họp Hội Đồng Sát Hạch EVN */}
      {protocolModalRoom && (
        <OfficialProtocolModal
          room={protocolModalRoom}
          candidates={candidates}
          departments={departments}
          onClose={() => setProtocolModalRoom(null)}
        />
      )}

      {/* Modal: Bảng Giám Sát Trực Tiếp Phòng Thi Live */}
      {proctorModalRoom && (
        <LiveProctoringModal
          room={proctorModalRoom}
          candidates={candidates}
          onUpdateCandidates={onUpdateCandidates}
          onClose={() => setProctorModalRoom(null)}
        />
      )}
    </div>
  );
};
