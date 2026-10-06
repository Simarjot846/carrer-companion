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
  'How should I prepare for a technical interview?',
];

export const AssistantChat: React.FC<AssistantChatProps> = ({ student }) => {
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const send = async (message: string) => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setInput('');
    setError(null);
    setLoading(true);
    const optimistic: ChatTurn[] = [...history, { role: 'user', content: userMsg }];
    setHistory(optimistic);
    try {
      const res = await sendAssistantMessage(student.id, userMsg, history);
      setHistory(res.updated_history);
    } catch (err: any) {
      setError(err.message || 'Assistant failed to respond. Please try again.');
      setHistory(history);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: '760px', margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 200px)', minHeight: '560px',
      }}
    >
      {/* Header */}
      <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--color-line)', marginBottom: '24px' }}>
        <div className="ds-kicker" style={{ marginBottom: '16px' }}>
          <Bot style={{ width: '16px', height: '16px' }} />
          Career assistant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="ds-h2" style={{ color: 'var(--color-ink)', marginBottom: '6px' }}>Career assistant</h1>
            <p className="ds-body" style={{ color: 'var(--color-stone)' }}>Answers grounded in {student.name}'s verified profile.</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => { setHistory([]); setError(null); setInput(''); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '11px',
                background: 'white', border: '1.5px solid var(--color-line)',
                fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)', cursor: 'pointer',
                transition: 'all .15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-sage)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; }}
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              New conversation
            </button>
          )}
        </div>
      </div>

      {/* Message area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px', paddingBottom: '16px' }}>

        {/* Welcome state */}
        {history.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="ds-card" style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-leaf-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles style={{ width: '24px', height: '24px', color: 'var(--color-gold)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '4px' }}>
                    Hi {student.name}.
                  </p>
                  <p style={{ fontSize: '16px', color: 'var(--color-stone)', lineHeight: '1.5' }}>
                    Ask about your profile, matches, skill gaps, or interview prep.
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {STARTER_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  style={{
                    textAlign: 'left', padding: '18px 20px', borderRadius: '14px',
                    background: 'white', border: '1.5px solid var(--color-line)',
                    fontSize: '16px', color: 'var(--color-charcoal)', lineHeight: '1.5',
                    cursor: 'pointer', transition: 'all .15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-sage)'; e.currentTarget.style.background = 'var(--color-leaf-bg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.background = 'white'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {history.map((turn, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexDirection: turn.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
              background: turn.role === 'user' ? 'var(--color-forest)' : 'var(--color-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              {turn.role === 'user'
                ? <User style={{ width: '18px', height: '18px' }} />
                : <Bot style={{ width: '18px', height: '18px' }} />}
            </div>
            <div style={{
              maxWidth: '78%', padding: '16px 20px', borderRadius: '16px',
              fontSize: '16px', lineHeight: '1.65',
              ...(turn.role === 'user'
                ? { background: 'var(--color-forest)', color: 'white', borderTopRightRadius: '4px' }
                : { background: 'white', color: 'var(--color-charcoal)', border: '1px solid var(--color-line)', borderTopLeftRadius: '4px' }),
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{turn.content}</p>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--color-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <Bot style={{ width: '18px', height: '18px' }} />
            </div>
            <div style={{
              padding: '18px 22px', borderRadius: '16px', borderTopLeftRadius: '4px',
              background: 'white', border: '1px solid var(--color-line)',
            }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '18px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="typing-dot" style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--color-stone)',
                    animationDelay: `${i * 0.18}s`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ds-alert ds-alert-error" style={{ marginTop: '8px' }}>
            <AlertCircle className="ds-alert-icon" />
            <div className="ds-alert-copy">{error}</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-line)' }}>
        <div
          className="ds-card"
          style={{
            display: 'flex', alignItems: 'flex-end', gap: '12px',
            padding: '14px 16px',
            transition: 'border-color .15s',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about matches, skill gaps, interview prep…"
            rows={1}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              fontSize: '16px', lineHeight: '1.5', color: 'var(--color-ink)',
              background: 'transparent', fontFamily: 'var(--font-sans)',
              maxHeight: '120px',
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: !input.trim() || loading ? 'var(--color-mist)' : 'var(--color-forest)',
              color: !input.trim() || loading ? 'var(--color-stone)' : 'white',
              border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s ease',
            }}
          >
            <Send style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-stone)', textAlign: 'center', marginTop: '10px' }}>
          Enter to send · Shift+Enter for new line · Grounded in {student.name}'s profile
        </p>
      </div>
    </div>
  );
};
