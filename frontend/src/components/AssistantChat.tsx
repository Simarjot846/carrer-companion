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
  'How do I prepare for a technical interview for my matches?',
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
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-200px)] min-h-[520px] animate-fade-in">
      <div className="space-y-3 pb-6">
        <div className="ds-kicker">
          <Bot className="h-4 w-4" />
          <span>Career assistant</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="ds-h1">Career assistant</h1>
            <p className="ds-lead mt-2">Answers grounded in {student.name}'s verified profile.</p>
          </div>
          {history.length > 0 && (
            <button onClick={clearChat} className="ds-btn-secondary !py-3">
              <RefreshCw className="h-4 w-4" />
              New conversation
            </button>
          )}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {/* Welcome state */}
        {history.length === 0 && !loading && (
          <div className="space-y-5">
            <div className="ds-card p-8 space-y-3 text-left">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-forest/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <p className="text-[18px] font-serif font-bold text-ink">Hi {student.name}.</p>
                  <p className="ds-body ds-muted mt-1">Ask about your profile, matches, skill gaps, or interview prep.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STARTER_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  className="text-left p-5 rounded-[16px] ds-card hover:border-forest/40 ds-body text-ink cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {history.map((turn, i) => (
          <div key={i} className={`flex items-start gap-3 ${turn.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white ${
              turn.role === 'user' ? 'bg-forest' : 'bg-ink'
            }`}>
              {turn.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
            </div>
            <div className={`max-w-[78%] px-5 py-4 rounded-[18px] ds-body text-left ${
              turn.role === 'user'
                ? 'bg-forest text-white rounded-tr-md'
                : 'ds-card text-ink rounded-tl-md'
            }`}>
              <p className="whitespace-pre-wrap">{turn.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-ink flex items-center justify-center text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="ds-card rounded-tl-md px-5 py-4">
              <div className="flex space-x-1.5 items-center h-5">
                <div className="h-2 w-2 rounded-full bg-stone animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-stone animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-stone animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ds-alert ds-alert-error">
            <AlertCircle className="ds-alert-icon" />
            <div className="ds-alert-copy">{error}</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="pt-4 border-t border-line">
        <div className="flex items-end gap-3 ds-card px-4 py-3 focus-within:border-forest">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about matches, skill gaps, interview prep…"
            rows={1}
            className="flex-1 resize-none ds-body placeholder:text-stone focus:outline-none bg-transparent"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="h-11 w-11 shrink-0 rounded-[12px] bg-forest hover:bg-forest-deep disabled:opacity-40 text-white flex items-center justify-center cursor-pointer"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="ds-caption mt-3 text-center">
          Enter to send · Shift+Enter for a new line · Grounded in {student.name}'s profile
        </p>
      </div>
    </div>
  );
};
