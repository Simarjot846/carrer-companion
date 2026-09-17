import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import type { Student, ChatTurn } from '../types';
import { sendAssistantMessage } from '../services/api';

interface AssistantChatProps {
  student: Student;
}

const STARTER_PROMPTS = [
  'What are my strongest skills for software engineering roles?',
  'Which job types match my background best?',
  'What should I work on to improve my profile?',
  'How do I prepare for a technical interview?',
];

export const AssistantChat: React.FC<AssistantChatProps> = ({ student }) => {
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const send = async (message: string) => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setInput('');
    setError(null);
    setLoading(true);

    // Optimistically add user message
    const optimistic: ChatTurn[] = [...history, { role: 'user', content: userMsg }];
    setHistory(optimistic);

    try {
      const res = await sendAssistantMessage(student.id, userMsg, history);
      setHistory(res.updated_history);
    } catch (err: any) {
      setError(err.message || 'Assistant failed to respond. Please try again.');
      // Remove the optimistic user message on failure
      setHistory(history);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setHistory([]);
    setError(null);
    setInput('');
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-220px)] min-h-[500px] animate-fade-in font-sans">
      {/* Header */}
      <div className="space-y-1 pb-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] text-xs font-semibold">
          <Bot className="h-3.5 w-3.5" />
          <span>M3.4 · AI Career Assistant</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#171B16]">Career Assistant</h2>
            <p className="text-xs text-slate-500">Answering based on {student.name}'s actual profile data.</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E2E0D5] cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>New conversation</span>
            </button>
          )}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {/* Welcome state */}
        {history.length === 0 && !loading && (
          <div className="space-y-5">
            <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-[#2C5F2D]/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#C9A63B]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#171B16]">Hi {student.name}! I'm your AI Career Assistant.</p>
                  <p className="text-xs text-slate-500">Ask me anything about your profile, job matches, or interview prep.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  className="text-left p-3.5 rounded-xl bg-white border border-[#E2E0D5] hover:border-[#2C5F2D]/40 hover:bg-[#FAF9F5] text-xs text-slate-700 font-medium transition-all cursor-pointer shadow-xs"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {history.map((turn, i) => (
          <div key={i} className={`flex items-start space-x-3 ${turn.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              turn.role === 'user' ? 'bg-[#2C5F2D]' : 'bg-[#171B16]'
            }`}>
              {turn.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              turn.role === 'user'
                ? 'bg-[#2C5F2D] text-white rounded-tr-sm'
                : 'bg-white border border-[#E2E0D5] text-[#171B16] rounded-tl-sm shadow-xs'
            }`}>
              <p className="whitespace-pre-wrap">{turn.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#171B16] flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-[#E2E0D5] rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
              <div className="flex space-x-1.5 items-center h-5">
                <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start space-x-2 text-xs text-rose-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="pt-3 border-t border-[#E2E0D5]">
        <div className="flex items-end space-x-2 bg-white border border-[#D5D3C5] rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#2C5F2D] focus-within:border-[#2C5F2D] transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your matches, skill gaps, interview prep..."
            rows={1}
            className="flex-1 resize-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none leading-relaxed bg-transparent"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="h-9 w-9 shrink-0 rounded-xl bg-[#2C5F2D] hover:bg-[#234E25] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line · Answers grounded in {student.name}'s profile only
        </p>
      </div>
    </div>
  );
};
