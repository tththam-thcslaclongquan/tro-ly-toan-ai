import React, { useState, useCallback, useEffect, useRef } from 'react';
import { InputPanel } from './components/InputPanel';
import { ChatPanel } from './components/ChatPanel';
import { classifyProblem, getGuidance } from './services/geminiService';
import { checkCompliance, roughDetectTags, detectFormulaIntent } from './services/curriculumService';
import { useTheme } from './hooks/useTheme';
// Fix: Import `GeneralFeedbackCategory` type to resolve multiple 'Cannot find name' errors.
import type { Message, Grade, HintLevel, Mode, ComplianceResult, FeedbackStatus, GuidanceContext, FeedbackEvent, GeneralFeedback, Session, ChangeGradeSuggestion, GeneralFeedbackCategory, FontSize } from './types';
import { ChartBar, ListChecks, MessageSquareWarning, History, Trash2, Download, AssistantIcon, SunIcon, MoonIcon, FontSizeIcon } from './components/icons';
import Lightbox from './components/Lightbox';

const WELCOME_MESSAGE: Message = {
  id: 'welcome-0',
  role: 'assistant',
  content: `👋 Chào em!
Hãy làm theo các bước sau để bắt đầu học cùng Trợ lý Tư duy Toán học nhé:

1️⃣ Chọn khối lớp (6, 7, 8 hoặc 9) cho đúng với mình.
2️⃣ Nhập đề bài Toán hoặc tải ảnh chụp đề lên.
3️⃣ Nhấn “Lấy gợi ý”, hệ thống sẽ gợi mở cách suy nghĩ và hướng làm, giúp em tự tìm ra lời giải.

💡 Lưu ý: Ứng dụng không cho đáp án sẵn, mà chỉ hỏi – gợi ý – dẫn dắt để em tự hiểu, tự làm và yêu thích môn Toán hơn!`,
};

const AnalyticsPanel: React.FC<{ log: FeedbackEvent[]; onClose: () => void }> = ({ log, onClose }) => {
    const stats = log.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {} as Record<FeedbackStatus, number>);

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="moet-header p-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-lg font-bold">Bảng phân tích phản hồi</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="p-4 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-lg"><div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.understood || 0}</div><div className="text-sm text-green-600 dark:text-green-500">Hiểu rồi</div></div>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg"><div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.needs_more || 0}</div><div className="text-sm text-yellow-600 dark:text-yellow-500">Cần gợi ý</div></div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/50 rounded-lg"><div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.too_hard || 0}</div><div className="text-sm text-red-600 dark:text-red-500">Khó quá</div></div>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th className="p-2 text-slate-800 dark:text-slate-200">Thời gian</th>
                                <th className="p-2 text-slate-800 dark:text-slate-200">Lớp</th>
                                <th className="p-2 text-slate-800 dark:text-slate-200">Đề bài (tóm tắt)</th>
                                <th className="p-2 text-slate-800 dark:text-slate-200">Phản hồi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {log.slice().reverse().map(item => (
                                <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="p-2 text-xs text-slate-500 dark:text-slate-400">{new Date(item.timestamp).toLocaleString()}</td>
                                    <td className="p-2 dark:text-slate-300">{item.grade}</td>
                                    <td className="p-2 italic text-slate-600 dark:text-slate-400">"{item.problem.substring(0, 50)}..."</td>
                                    <td className="p-2 font-semibold" style={{ color: item.status === 'understood' ? '#22c55e' : item.status === 'needs_more' ? '#f59e0b' : '#ef4444' }}>
                                        {item.status === 'understood' ? 'Hiểu rồi' : item.status === 'needs_more' ? 'Cần gợi ý' : 'Khó quá'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const FeedbackModal: React.FC<{
  onClose: () => void;
  onSubmit: (category: GeneralFeedbackCategory, content: string) => void;
}> = ({ onClose, onSubmit }) => {
  const [category, setCategory] = useState<GeneralFeedbackCategory>('bug');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 10) {
      alert('Vui lòng nhập nội dung phản hồi dài hơn 10 ký tự.');
      return;
    }
    setIsSubmitting(true);
    onSubmit(category, content);
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <header className="moet-header p-5 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold">Gửi phản hồi</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="feedback-category" className="block text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Phân loại phản hồi</label>
              <select
                id="feedback-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GeneralFeedbackCategory)}
                className="w-full p-3 text-base border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="bug">Báo lỗi</option>
                <option value="suggestion">Góp ý tính năng</option>
                <option value="content">Nội dung không phù hợp</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label htmlFor="feedback-content" className="block text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Nội dung chi tiết</label>
              <textarea
                id="feedback-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả lỗi bạn gặp, hoặc ý tưởng của bạn để cải thiện ứng dụng..."
                rows={6}
                required
                minLength={10}
                className="w-full p-3 text-base border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-200 min-h-[160px] focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <footer className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-base text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600">
              Huỷ
            </button>
            <button type="submit" disabled={isSubmitting || content.trim().length < 10} className="px-5 py-2.5 rounded-xl font-semibold text-base text-white bg-blue-600 dark:bg-blue-900 hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

const categoryMap: Record<GeneralFeedbackCategory, string> = {
    bug: 'Báo lỗi',
    suggestion: 'Góp ý',
    content: 'Nội dung',
    other: 'Khác',
};

const categoryColorMap: Record<GeneralFeedbackCategory, string> = {
    bug: 'text-red-600 bg-red-50 dark:bg-red-900/50 dark:text-red-400',
    suggestion: 'text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-400',
    content: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/50 dark:text-yellow-400',
    other: 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300',
};

const FeedbackLogPanel: React.FC<{ log: GeneralFeedback[]; onClose: () => void }> = ({ log, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="moet-header p-5 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-lg font-bold">Lịch sử phản hồi</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="p-5 overflow-y-auto">
                    {log.length === 0 ? (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-12 text-lg">Chưa có phản hồi nào được gửi.</p>
                    ) : (
                        <table className="w-full text-base text-left">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="p-3 w-1/4 text-slate-800 dark:text-slate-200">Thời gian</th>
                                    <th className="p-3 w-1/6 text-slate-800 dark:text-slate-200">Phân loại</th>
                                    <th className="p-3 text-slate-800 dark:text-slate-200">Nội dung</th>
                                </tr>
                            </thead>
                            <tbody>
                                {log.slice().reverse().map(item => (
                                    <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="p-3 text-sm text-slate-500 dark:text-slate-400 align-top">{new Date(item.timestamp).toLocaleString()}</td>
                                        <td className="p-3 align-top">
                                            <span className={`px-2.5 py-1 rounded-full font-semibold text-xs ${categoryColorMap[item.category]}`}>
                                                {categoryMap[item.category]}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{item.content}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const HistoryPanel: React.FC<{
    sessions: Session[];
    onClose: () => void;
    onLoad: (sessionId: string) => void;
    onDelete: (sessionId: string) => void;
}> = ({ sessions, onClose, onLoad, onDelete }) => {
    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="moet-header p-5 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-lg font-bold">Lịch sử 5 phiên gần nhất</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="p-5 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-12 text-lg">Chưa có phiên nào được lưu.</p>
                    ) : (
                        <ul className="space-y-3">
                            {sessions.map(session => (
                                <li key={session.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(session.timestamp).toLocaleString()}</p>
                                        <p className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
                                            Lớp {session.grade}: {session.problem.substring(0, 80) || '(Bài toán hình ảnh)'}...
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 flex gap-2">
                                        <button onClick={() => onLoad(session.id)} className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400" title="Tải lại phiên này">
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => onDelete(session.id)} className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-red-600 dark:hover:text-red-500" title="Xóa phiên này">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};


const AppHeader: React.FC<{
    onShowFeedbackLog: () => void;
    onShowAnalytics: () => void;
    onShowHistory: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}> = ({ onShowFeedbackLog, onShowAnalytics, onShowHistory, theme, setTheme, fontSize, setFontSize }) => {
    const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
    const fontMenuRef = useRef<HTMLDivElement>(null);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fontMenuRef.current && !fontMenuRef.current.contains(event.target as Node)) {
                setIsFontMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    return (
        <header className="moet-header sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                    <AssistantIcon className="w-12 h-12" />
                    <div>
                        <h1 className="text-base sm:text-lg font-bold">TRỢ LÝ TƯ DUY TOÁN HỌC – KHỐI TRUNG HỌC CƠ SỞ</h1>
                        <p className="moet-subtle hidden sm:block">Cùng hiểu – cùng nghĩ – cùng khám phá</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <button
                            onClick={() => setIsFontMenuOpen(prev => !prev)}
                            className="p-2 text-white/80 hover:text-white hover:bg-black/10 rounded-full"
                            aria-label="Thay đổi cỡ chữ"
                            title="Thay đổi cỡ chữ"
                        >
                            <FontSizeIcon className="w-5 h-5" />
                        </button>
                        {isFontMenuOpen && (
                            <div ref={fontMenuRef} className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-10">
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-2 py-1 mb-1">Cỡ chữ</p>
                                <button onClick={() => { setFontSize('sm'); setIsFontMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 ${fontSize === 'sm' ? 'font-bold bg-slate-100 dark:bg-slate-700' : ''}`}>Nhỏ</button>
                                <button onClick={() => { setFontSize('base'); setIsFontMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 ${fontSize === 'base' ? 'font-bold bg-slate-100 dark:bg-slate-700' : ''}`}>Vừa</button>
                                <button onClick={() => { setFontSize('lg'); setIsFontMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 ${fontSize === 'lg' ? 'font-bold bg-slate-100 dark:bg-slate-700' : ''}`}>Lớn</button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-white/80 hover:text-white hover:bg-black/10 rounded-full"
                        aria-label="Chuyển đổi chế độ sáng/tối"
                        title="Chuyển đổi chế độ sáng/tối"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={onShowHistory}
                        className="p-2 text-white/80 hover:text-white hover:bg-black/10 rounded-full"
                        aria-label="Xem lịch sử phiên"
                        title="Xem lịch sử phiên học"
                    >
                        <History className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onShowFeedbackLog}
                        className="p-2 text-white/80 hover:text-white hover:bg-black/10 rounded-full"
                        aria-label="Xem lịch sử phản hồi"
                        title="Xem lịch sử phản hồi"
                    >
                        <ListChecks className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onShowAnalytics}
                        className="p-2 text-white/80 hover:text-white hover:bg-black/10 rounded-full"
                        aria-label="Xem phân tích"
                        title="Xem phân tích gợi ý"
                    >
                        <ChartBar className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};

const App: React.FC = () => {
  const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
      try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
      } catch (error) {
        console.error("Error reading from localStorage", error);
        return defaultValue;
      }
    });
  
    useEffect(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }
    }, [key, state]);
  
    return [state, setState];
  };

  const [grade, setGrade] = usePersistentState<Grade>('math-app-grade', '6');
  const [level, setLevel] = usePersistentState<HintLevel>('math-app-level', 'light');
  const [mode, setMode] = usePersistentState<Mode>('math-app-mode', 'guide');
  const [problem, setProblem] = usePersistentState<string>('math-app-problem', '');
  const [studentStep, setStudentStep] = usePersistentState<string>('math-app-studentStep', '');
  const [images, setImages] = usePersistentState<string[]>('math-app-images', []);
  const [imageMimeTypes, setImageMimeTypes] = usePersistentState<string[]>('math-app-imageMimeTypes', []);
  const [studentImages, setStudentImages] = usePersistentState<string[]>('math-app-studentImages', []);
  const [studentImageMimeTypes, setStudentImageMimeTypes] = usePersistentState<string[]>('math-app-studentImageMimeTypes', []);
  const [conversation, setConversation] = usePersistentState<Message[]>('math-app-conversation', [WELCOME_MESSAGE]);
  const [feedbackLog, setFeedbackLog] = usePersistentState<FeedbackEvent[]>('math-app-feedback-log', []);
  const [isProblemActive, setIsProblemActive] = usePersistentState<boolean>('math-app-isProblemActive', false);
  const [generalFeedbackLog, setGeneralFeedbackLog] = usePersistentState<GeneralFeedback[]>('math-app-general-feedback-log', []);
  const [sessionHistory, setSessionHistory] = usePersistentState<Session[]>('math-app-session-history', []);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showFeedbackLog, setShowFeedbackLog] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [lightboxImageSrc, setLightboxImageSrc] = useState<string | null>(null);
  const [theme, setTheme] = useTheme();
  const [fontSize, setFontSize] = usePersistentState<FontSize>('math-app-fontSize', 'base');

  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.classList.remove('font-size-sm', 'font-size-base', 'font-size-lg');
    htmlElement.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  // Per user request, re-render KaTeX globally on conversation updates
  // to ensure all math expressions are displayed correctly.
  useEffect(() => {
    const renderMathInElement = (window as any)?.renderMathInElement;
    if (typeof renderMathInElement === "function") {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$",  right: "$",  display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    }
  }, [conversation]);

  // Use a ref to get the latest state inside callbacks without re-creating them
  const stateRef = useRef({ grade, level, mode, problem, studentStep, images, imageMimeTypes, studentImages, studentImageMimeTypes, conversation });
  useEffect(() => {
    stateRef.current = { grade, level, mode, problem, studentStep, images, imageMimeTypes, studentImages, studentImageMimeTypes, conversation };
  }, [grade, level, mode, problem, studentStep, images, imageMimeTypes, studentImages, studentImageMimeTypes, conversation]);

  
  interface AddMessageOptions {
    suggestion?: Message['suggestion'];
    images?: string[];
    imageMimeTypes?: string[];
    isGuidance?: boolean;
    guidanceContext?: GuidanceContext;
  }

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, options: AddMessageOptions = {}) => {
    setConversation(prev => [...prev, {
      id: crypto.randomUUID(),
      role,
      content,
      suggestion: options.suggestion,
      images: options.images,
      imageMimeTypes: options.imageMimeTypes,
      isGuidance: options.isGuidance,
      feedback: options.isGuidance ? 'unanswered' : undefined,
      guidanceContext: options.isGuidance ? options.guidanceContext : undefined,
    }]);
  }, [setConversation]);

  const handleApiError = useCallback((e: any) => {
    console.error("Gemini API Error:", e);
    let errorMessage = "Rất tiếc, đã có sự cố xảy ra khi xử lý yêu cầu của em. Vui lòng thử lại sau nhé.";
    if (e && e.message) {
        const lowerCaseMessage = String(e.message).toLowerCase();
        if (lowerCaseMessage.includes('429') || lowerCaseMessage.includes('rate limit')) {
            errorMessage = "Hệ thống đang hơi quá tải một chút. Em vui lòng đợi vài phút rồi thử lại nhé.";
        }
    }
    addMessage('assistant', errorMessage);
  }, [addMessage]);

  const handleClear = useCallback(() => {
    const confirmationMessage = 'Bạn có chắc chắn muốn bắt đầu lại không? Phiên làm việc hiện tại sẽ được lưu vào lịch sử (nếu có nội dung), và toàn bộ màn hình sẽ được xoá.';
    if (window.confirm(confirmationMessage)) {
      if (isProblemActive && (problem.trim().length > 0 || images.length > 0) && conversation.length > 2) {
          const currentSession: Session = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              grade, level, mode, problem, studentStep, images, imageMimeTypes,
              studentImages, studentImageMimeTypes, conversation, feedbackLog, isProblemActive
          };
          
          setSessionHistory(prev => {
              const updatedHistory = [currentSession, ...prev];
              if (updatedHistory.length > 5) {
                  return updatedHistory.slice(0, 5);
              }
              return updatedHistory;
          });
      }

      setIsLoading(false);
      setGrade('6');
      setLevel('light');
      setMode('guide');
      setProblem('');
      setStudentStep('');
      setImages([]);
      setImageMimeTypes([]);
      setStudentImages([]);
      setStudentImageMimeTypes([]);
      setConversation([WELCOME_MESSAGE]);
      setFeedbackLog([]);
      setIsProblemActive(false);
    }
  }, [isProblemActive, problem, images, conversation, grade, level, mode, studentStep, imageMimeTypes, studentImages, studentImageMimeTypes, feedbackLog, setSessionHistory, setGrade, setLevel, setMode, setProblem, setStudentStep, setImages, setImageMimeTypes, setStudentImages, setStudentImageMimeTypes, setConversation, setFeedbackLog, setIsProblemActive]);
  
  const handleAsk = useCallback(async () => {
    const currentState = stateRef.current;
    const currentGrade = currentState.grade;

    // Check for empty problem only if studentStep is also empty
    if (!currentState.problem && currentState.images.length === 0 && !currentState.studentStep && currentState.studentImages.length === 0) {
        alert("Nhập đề bài hoặc câu trả lời của em để bắt đầu.");
        return;
    }
    
    setIsLoading(true);
    
    // Add user message to conversation
    const userPromptParts = [];
    if (!isProblemActive) {
      userPromptParts.push(`**Lớp ${currentGrade}** | ${currentState.level.toUpperCase()} | ${currentState.mode.toUpperCase()}`);
    }
    if (currentState.problem && !isProblemActive) userPromptParts.push(`**Đề:** ${currentState.problem}`);
    else if (currentState.images.length > 0 && !isProblemActive) userPromptParts.push(`**Đề:**`);

    if (currentState.studentStep) userPromptParts.push(isProblemActive ? currentState.studentStep : `**Câu trả lời của em:** ${currentState.studentStep}`);
    else if (currentState.studentImages.length > 0) userPromptParts.push(isProblemActive ? "" : `**Câu trả lời của em:**`);

    const userPrompt = userPromptParts.filter(p => p).join("\n\n");
    const allImages = [...(isProblemActive ? [] : currentState.images), ...currentState.studentImages];
    const allMimeTypes = [...(isProblemActive ? [] : currentState.imageMimeTypes), ...currentState.studentImageMimeTypes];
    addMessage('user', userPrompt, { images: allImages, imageMimeTypes: allMimeTypes });
    
    // Client-side formula intent detection
    if (currentState.studentStep) {
        const formulaHint = detectFormulaIntent(currentState.studentStep);
        if (formulaHint) {
            setTimeout(() => {
                addMessage('assistant', formulaHint);
                setIsLoading(false);
            }, 500); // Simulate a quick response
            setStudentStep('');
            setStudentImages([]);
            setStudentImageMimeTypes([]);
            return;
        }
    }

    if (!isProblemActive) {
        setIsProblemActive(true);
    }
    
    // Clear student input fields after submission
    setStudentStep('');
    setStudentImages([]);
    setStudentImageMimeTypes([]);

    try {
        let tags = roughDetectTags(currentState.problem);
        if (tags.length === 0 && (currentState.problem || currentState.images.length > 0)) {
            tags = await classifyProblem(currentState.problem, currentState.images, currentState.imageMimeTypes);
        }
        const compliance: ComplianceResult = checkCompliance(currentGrade, tags);
        
        if (!compliance.ok) {
            const messageContent = `⚠️ **Cô thấy bài này có kiến thức của lớp cao hơn** (cụ thể là về **${compliance.reason}**), không thuộc chương trình lớp ${currentGrade} em nhé.`;
            if (compliance.suggestedGrades && compliance.suggestedGrades.length > 0) {
              addMessage(
                'assistant',
                `${messageContent} Em có muốn tự động chuyển sang lớp phù hợp để cô hướng dẫn không?`,
                { suggestion: { type: 'CHANGE_GRADE', suggestedGrades: compliance.suggestedGrades } }
              );
            } else {
              addMessage('assistant', `${messageContent} Em vui lòng kiểm tra lại đề bài hoặc chọn lại lớp cho đúng nhé.`);
            }
            setIsLoading(false);
            return;
        }

        const baseParams = {
            grade: currentGrade,
            level: currentState.level,
            mode: currentState.mode,
            problem: currentState.problem,
            studentStep: stateRef.current.studentStep, // Use the latest from ref just in case, though it was just cleared
            image: currentState.images,
            imageMimeType: currentState.imageMimeTypes,
            studentImages: stateRef.current.studentImages,
            studentImageMimeTypes: stateRef.current.studentImageMimeTypes,
            tags,
            compliance
        };

        const response = await getGuidance(baseParams);

        const guidanceContext: GuidanceContext = {
            problem: currentState.problem,
            image: currentState.images,
            imageMimeType: currentState.imageMimeTypes,
            grade: currentGrade,
            tags
        };
        
        let isActualGuidance = (currentState.mode === 'guide' || currentState.mode === 'check') && compliance.ok;

        const rejectionKeywords = ["chưa phù hợp", "lớp cao hơn", "lớp trên", "không thuộc chương trình", "chọn lại khối lớp", "kiến thức của lớp"];
        if (isActualGuidance && rejectionKeywords.some(keyword => response.toLowerCase().includes(keyword))) {
            isActualGuidance = false;
        }

        addMessage('assistant', response, {
            isGuidance: isActualGuidance,
            guidanceContext: isActualGuidance ? guidanceContext : undefined,
        });

    } catch (e) {
        handleApiError(e);
    } finally {
        setIsLoading(false);
    }
  }, [addMessage, setIsProblemActive, setStudentStep, setStudentImages, setStudentImageMimeTypes, handleApiError, isProblemActive]);
  
  const handleSuggestionAction = useCallback((grade: Grade) => {
    setGrade(grade);
    addMessage('assistant', `✅ Đã chuyển sang Lớp ${grade}. Em hãy nhấn "Lấy gợi ý" lại nhé.`);
  }, [setGrade, addMessage]);

  const handleFeedback = useCallback(async (messageId: string, status: FeedbackStatus) => {
    const originalMessage = stateRef.current.conversation.find(msg => msg.id === messageId);
    if (!originalMessage || !originalMessage.guidanceContext) return;

    setFeedbackLog(prev => [...prev, {
        id: crypto.randomUUID(),
        messageId,
        timestamp: Date.now(),
        grade: originalMessage.guidanceContext?.grade || 'N/A',
        problem: originalMessage.guidanceContext?.problem || '(ảnh)',
        status,
    }]);

    setConversation(prev =>
        prev.map(msg =>
            msg.id === messageId ? { ...msg, feedback: status } : msg
        )
    );
    
    if ((status === 'needs_more' || status === 'too_hard')) {
        setIsLoading(true);
        const userMessage = status === 'needs_more' ? '🤔 Em vẫn chưa hiểu, cần thêm gợi ý ạ.' : '😥 Khó quá, cô có thể giải thích đơn giản hơn không?';
        addMessage('user', userMessage);
        
        try {
            const response = await getGuidance({
                ...originalMessage.guidanceContext,
                studentImages: [],
                studentImageMimeTypes: [],
                level: 'light', 
                mode: 'guide',
                studentStep: '',
                compliance: { ok: true, reason: '' },
                feedback: status,
            });
            
            addMessage('assistant', response, {
                isGuidance: true,
                guidanceContext: originalMessage.guidanceContext,
            });

        } catch (e) {
            handleApiError(e);
        } finally {
            setIsLoading(false);
        }
    }
  }, [addMessage, setConversation, setFeedbackLog, handleApiError]);

  const handleRequestSimilar = useCallback(async (context: GuidanceContext) => {
    if (!context) return;

    const compliance = checkCompliance(context.grade, context.tags);
    if (!compliance.ok) {
        addMessage('assistant', `Bài toán gốc thuộc chủ đề ${context.tags.join(', ')}, không phù hợp với Lớp ${context.grade}. Vì vậy, cô không thể tạo bài tương tự. Em hãy bắt đầu lại với một bài toán khác nhé.`);
        return;
    }

    setIsLoading(true);
    addMessage('user', "💡 Em muốn luyện thêm bài tương tự.");

    try {
        const response = await getGuidance({
            ...context,
            studentImages: [],
            studentImageMimeTypes: [],
            level: 'light', 
            mode: 'similar',
            studentStep: '',
            compliance: compliance,
        });
        addMessage('assistant', response);
    } catch (e) {
        handleApiError(e);
    } finally {
        setIsLoading(false);
    }
  }, [addMessage, handleApiError]);
  
  const handleSendGeneralFeedback = useCallback((category: GeneralFeedbackCategory, content: string) => {
    const newFeedback: GeneralFeedback = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        category,
        content,
    };
    setGeneralFeedbackLog(prev => [...prev, newFeedback]);
    setShowFeedbackModal(false);
  }, [setGeneralFeedbackLog]);

  const handleLoadSession = useCallback((sessionId: string) => {
      const sessionToLoad = sessionHistory.find(s => s.id === sessionId);
      if (sessionToLoad) {
          setGrade(sessionToLoad.grade);
          setLevel(sessionToLoad.level);
          setMode(sessionToLoad.mode);
          setProblem(sessionToLoad.problem);
          setStudentStep(sessionToLoad.studentStep);
          setImages(sessionToLoad.images);
          setImageMimeTypes(sessionToLoad.imageMimeTypes);
          setStudentImages(sessionToLoad.studentImages);
          setStudentImageMimeTypes(sessionToLoad.studentImageMimeTypes);
          setConversation(sessionToLoad.conversation);
          setFeedbackLog(sessionToLoad.feedbackLog);
          setIsProblemActive(sessionToLoad.isProblemActive);
          setShowHistory(false);
      }
  }, [sessionHistory, setGrade, setLevel, setMode, setProblem, setStudentStep, setImages, setImageMimeTypes, setStudentImages, setStudentImageMimeTypes, setConversation, setFeedbackLog, setIsProblemActive]);

  const handleDeleteSession = useCallback((sessionId: string) => {
      if (window.confirm('Bạn có chắc chắn muốn xóa phiên học này không?')) {
          setSessionHistory(prev => prev.filter(s => s.id !== sessionId));
      }
  }, [setSessionHistory]);
  
  const handleImageClick = (src: string) => {
    setLightboxImageSrc(src);
  };

  return (
    <div className="min-h-screen flex flex-col">
       <AppHeader 
        onShowFeedbackLog={() => setShowFeedbackLog(true)}
        onShowAnalytics={() => setShowAnalytics(true)}
        onShowHistory={() => setShowHistory(true)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />
      
      <div className="max-w-4xl w-full mx-auto px-4 pt-8">
        <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-md mb-8">
            <div className="text-base text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed text-justify">
                <p>
                    Ứng dụng được sáng tạo bởi <strong>Cô Tăng Thị Hồng Thắm</strong>.
                </p>
                <p>
                    Giáo viên Toán THCS với hơn 20 năm kinh nghiệm giảng dạy và nghiên cứu đổi mới phương pháp học Toán, đồng hành cùng học sinh rèn luyện tư duy logic, khả năng suy luận và tự học thông qua những câu hỏi gợi mở, thay vì chỉ ghi nhớ lời giải có sẵn.
                </p>
                <p>
                    "<strong>TRỢ LÝ TƯ DUY TOÁN HỌC – KHỐI TRUNG HỌC CƠ SỞ</strong>" là người bạn đồng hành, giúp các em hiểu bản chất, tự tin và tìm thấy niềm vui trong Toán học nơi mỗi bài tập là một hành trình khám phá tri thức. Nội dung kiến thức được thiết kế theo chuẩn chương trình GDPT 2018.
                </p>
            </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        <InputPanel
          grade={grade}
          setGrade={setGrade}
          level={level}
          setLevel={setLevel}
          mode={mode}
          setMode={setMode}
          problem={problem}
          setProblem={setProblem}
          studentStep={studentStep}
          setStudentStep={setStudentStep}
          images={images}
          setImages={setImages}
          setImageMimeTypes={setImageMimeTypes}
          imageMimeTypes={imageMimeTypes}
          studentImages={studentImages}
          setStudentImages={setStudentImages}
          studentImageMimeTypes={studentImageMimeTypes}
          setStudentImageMimeTypes={setStudentImageMimeTypes}
          onAsk={handleAsk}
          onClear={handleClear}
          isLoading={isLoading}
          isProblemActive={isProblemActive}
        />
        <ChatPanel 
          conversation={conversation} 
          isLoading={isLoading} 
          onSuggestionAction={handleSuggestionAction}
          onFeedback={handleFeedback}
          onRequestSimilar={handleRequestSimilar}
          onImageClick={handleImageClick}
        />
      </main>
      
      <footer className="moet-footer mt-8">
          <p>© TĂNG THỊ HỒNG THẮM – 2025 | VER 1.0 | ALL RIGHTS RESERVED</p>
          <p>Trường THCS Lạc Long Quân | 1014/88/9 Tân Kỳ Tân Quý, phường Bình Hưng Hòa, TP. Hồ Chí Minh</p>
          <p>Ứng dụng thuộc cuộc thi “Nhà giáo sáng tạo với công nghệ số và trí tuệ nhân tạo”.</p>
      </footer>

      <button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-4 right-4 bg-blue-600 dark:bg-blue-900 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-40 transition-colors duration-200"
        aria-label="Gửi phản hồi"
        title="Gửi phản hồi, báo lỗi hoặc góp ý"
    >
        <MessageSquareWarning className="w-6 h-6" />
    </button>
      
      {showHistory && <HistoryPanel sessions={sessionHistory} onClose={() => setShowHistory(false)} onLoad={handleLoadSession} onDelete={handleDeleteSession} />}
      {showAnalytics && <AnalyticsPanel log={feedbackLog} onClose={() => setShowAnalytics(false)} />}
      {showFeedbackLog && <FeedbackLogPanel log={generalFeedbackLog} onClose={() => setShowFeedbackLog(false)} />}
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} onSubmit={handleSendGeneralFeedback} />}
      {lightboxImageSrc && <Lightbox src={lightboxImageSrc} onClose={() => setLightboxImageSrc(null)} />}
    </div>
  );
};

export default App;