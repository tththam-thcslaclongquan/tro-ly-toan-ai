import React, { useEffect, useRef, useState } from 'react';
import type { Message as MessageType, FeedbackStatus, Grade } from '../types';
import { User, Bot, Lightbulb, RefreshCw } from './icons';

declare global {
  interface Window {
    renderMathInElement?: (element: HTMLElement, options: any) => void;
  }
}

interface MessageProps {
  message: MessageType;
  onSuggestionAction?: (grade: Grade) => void;
  onFeedback?: (messageId: string, status: FeedbackStatus) => void;
  onRequestSimilar?: (context: NonNullable<MessageType['guidanceContext']>) => void;
  onImageClick?: (src: string) => void;
}

export const Message: React.FC<MessageProps> = ({ message, onSuggestionAction, onFeedback, onRequestSimilar, onImageClick }) => {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatMessageContent = (text: string) => {
    let formattedText = text;
    // Sanitize to prevent basic XSS if needed, though here we trust the source.
    // Let's replace markdown-like bold and newlines.
    return formattedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  useEffect(() => {
    if (contentRef.current && window.renderMathInElement) {
      window.renderMathInElement(contentRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }, [message.content, isExpanded]);

  const isSimilarProblems = message.role === 'assistant' && message.content.trim().startsWith('**Bài tương tự**');
  
  const renderMessageContent = () => {
    const isUserMessageWithProblem = isUser && message.content.includes('**Đề:**');
    if (isUserMessageWithProblem) {
        const parts = message.content.split('**Đề:**');
        const header = parts[0];
        const problemText = parts[1]?.trim() || '';
        const isLongProblem = problemText.length > 200 || problemText.split('\n').length > 5;

        if (isLongProblem) {
            return (
                <div ref={contentRef}>
                    <div dangerouslySetInnerHTML={{ __html: formatMessageContent(header) }} />
                    <details className="mt-2" onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}>
                        <summary className="font-bold text-blue-600 dark:text-blue-400 cursor-pointer select-none">**Đề:** (Nhấn để xem đầy đủ)</summary>
                        <div className="mt-2 pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                           <div dangerouslySetInnerHTML={{ __html: formatMessageContent(problemText) }} />
                        </div>
                    </details>
                </div>
            );
        }
    }

    if (isSimilarProblems) {
      const lines = message.content.split('\n').filter(line => line.trim() !== '');
      const title = lines[0] || '';
      const problems = lines.slice(1);

      return (
        <div ref={contentRef}>
          <strong dangerouslySetInnerHTML={{ __html: formatMessageContent(title).replace(/<br \/>/g, '') }}></strong>
          <ol className="list-decimal list-inside mt-2 space-y-2">
            {problems.map((problem, index) => (
              <li key={index} dangerouslySetInnerHTML={{ __html: formatMessageContent(problem.replace(/^\s*\d+\.\s*/, '')).replace(/<br \/>/g, '') }}></li>
            ))}
          </ol>
        </div>
      );
    }
    return <div ref={contentRef} dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />;
  };

  const showFeedbackOptions = !isUser && message.isGuidance && message.feedback === 'unanswered' && !message.suggestion;

  return (
    <div className="animate-fade-in">
      <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300' : 'bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-blue-400'}`}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
        <div className={`p-3 rounded-xl border max-w-xl ${isUser ? 'bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600' : 'bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-700'}`}>
          <div className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            {renderMessageContent()}
          </div>
          
          {message.images && message.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {message.images.map((img, index) => {
                const src = `data:${message.imageMimeTypes?.[index] || 'image/jpeg'};base64,${img}`;
                return (
                  <div key={index} className="relative">
                    <img 
                      src={src}
                      alt={`Đính kèm ${index + 1}`} 
                      className="w-full h-auto object-cover aspect-square rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer" 
                      onClick={() => onImageClick && onImageClick(src)}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {message.suggestion?.type === 'CHANGE_GRADE' && onSuggestionAction && (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.suggestion.suggestedGrades.map(grade => (
                <button
                  key={grade}
                  onClick={() => onSuggestionAction(grade)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Chọn Lớp {grade}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2 pl-11">
          {showFeedbackOptions && onFeedback && (
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 w-fit">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Em thấy gợi ý vừa rồi thế nào?</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onFeedback(message.id, 'understood')}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-green-500 hover:bg-green-600 border border-transparent transition-colors duration-200"
                >
                  ✅ Hiểu rồi
                </button>
                <button
                  onClick={() => onFeedback(message.id, 'needs_more')}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 border border-transparent transition-colors duration-200"
                >
                  🤔 Cần thêm gợi ý
                </button>
                <button
                  onClick={() => onFeedback(message.id, 'too_hard')}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 border border-transparent transition-colors duration-200"
                >
                  😥 Khó quá
                </button>
              </div>
            </div>
          )}
          {message.feedback === 'understood' && onRequestSimilar && message.guidanceContext && (
            <div className="mt-2">
              <button
                onClick={() => onRequestSimilar(message.guidanceContext)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-base text-white bg-blue-600 dark:bg-blue-900 hover:bg-blue-700 dark:hover:bg-blue-800 border border-transparent transition-colors duration-200"
              >
                <Lightbulb className="w-4 h-4" />
                Gợi bài tương tự để luyện thêm
              </button>
            </div>
          )}
        </div>
    </div>
  );
};
