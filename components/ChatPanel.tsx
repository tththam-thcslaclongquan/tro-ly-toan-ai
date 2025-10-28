import React, { useEffect, useRef } from 'react';
import type { Message as MessageType, FeedbackStatus, GuidanceContext, Grade } from '../types';
import { Message } from './Message';
import { LoadingSpinner } from './icons';

interface ChatPanelProps {
  conversation: MessageType[];
  isLoading: boolean;
  onSuggestionAction?: (grade: Grade) => void;
  onFeedback?: (messageId: string, status: FeedbackStatus) => void;
  onRequestSimilar?: (context: NonNullable<MessageType['guidanceContext']>) => void;
  onImageClick?: (src: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ conversation, isLoading, onSuggestionAction, onFeedback, onRequestSimilar, onImageClick }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  return (
    <section className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col">
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Hỏi – đáp định hướng</h2>
      <div className="flex-grow h-0 overflow-y-auto pr-2">
        <div className="flex flex-col gap-4">
          {conversation.map((msg, index) => (
            <Message 
              key={msg.id || index} 
              message={msg} 
              onSuggestionAction={onSuggestionAction}
              onFeedback={onFeedback}
              onRequestSimilar={onRequestSimilar}
              onImageClick={onImageClick}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center items-center p-4">
              <LoadingSpinner className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    </section>
  );
};
