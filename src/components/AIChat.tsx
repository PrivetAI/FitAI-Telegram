import { useState, useRef, useEffect } from 'react';
import { Card } from './Card';
import { SendIcon, LoaderIcon, XIcon, AlertIcon } from '../icons';
import type { ChatMessage } from '../services/ai/types';
import { isConfigured } from '../services/ai';

interface AIChatProps {
  title: string;
  onSend: (messages: ChatMessage[]) => Promise<string>;
  onClose: () => void;
  placeholder?: string;
}

export function AIChat({ title, onSend, onClose, placeholder = 'Ask a question...' }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!isConfigured()) {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{title}</h1>
          <button onClick={onClose} className="p-2 rounded-lg active:bg-surface-lighter"><XIcon size={20} /></button>
        </div>
        <Card className="py-10 text-center">
          <AlertIcon size={32} color="#FFD740" className="mx-auto mb-3" />
          <div className="text-sm font-medium mb-1">API Key Required</div>
          <div className="text-text-muted text-xs">Go to Profile &gt; AI Settings to configure your API key.</div>
        </Card>
      </div>
    );
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError('');

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    // Keep last 10 messages
    const trimmed = newMessages.slice(-10);
    setMessages(trimmed);
    setLoading(true);

    try {
      const response = await onSend(trimmed);
      setMessages(prev => [...prev, { role: 'assistant' as const, content: response }].slice(-10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-fade-in">
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <h1 className="text-xl font-bold">{title}</h1>
        <button onClick={onClose} className="p-2 rounded-lg active:bg-surface-lighter"><XIcon size={20} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="text-text-muted text-sm">Ask me anything</div>
            <div className="text-text-muted text-xs mt-1">I have context about your profile and progress</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent text-black rounded-br-md'
                : 'bg-surface-lighter text-text-primary rounded-bl-md'
            }`}>
              {msg.content.split('\n').map((line, li) => (
                <span key={li}>{line}{li < msg.content.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-lighter rounded-2xl rounded-bl-md px-4 py-3">
              <LoaderIcon size={18} color="#9E9E9E" />
            </div>
          </div>
        )}
        {error && (
          <Card className="bg-danger/10 border-danger/20">
            <div className="text-danger text-xs">{error}</div>
          </Card>
        )}
      </div>

      <div className="px-5 py-3 pb-6">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={placeholder}
            className="flex-1 !py-3"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform disabled:opacity-40"
          >
            <SendIcon size={18} color="#000" />
          </button>
        </div>
      </div>
    </div>
  );
}
