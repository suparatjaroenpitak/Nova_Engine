import { useState, useRef, useEffect } from 'react';
import { aiApi } from '@/api/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'Create a player movement script',
  'Add a scoring system',
  'Make an enemy AI that patrols',
  'Create a health bar UI',
  'Add a day/night cycle',
  'Explain this error: NullReferenceException',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: "Hi! I'm Nova AI Assistant. I can help you write scripts, generate materials, create animations, and more. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    aiApi.capabilities().then(({ data }) => setCapabilities(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = text || input;
    if (!message.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiApi.execute({
        capability: 'script-generation',
        prompt: message.trim(),
      });
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data?.content || data?.error || 'I processed your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err?.response?.data?.title || err?.message || 'AI service unavailable'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border shrink-0">
        <span className="text-xs font-medium text-nova-muted uppercase tracking-wider">AI Assistant</span>
        {capabilities.length > 0 && (
          <span className="ml-2 text-xs text-nova-accent/60">{capabilities.length} capabilities</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role !== 'user' && (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-nova-accent to-[#d6304a] flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                AI
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-nova-accent/20 border border-nova-accent/30 text-nova-text'
                  : msg.role === 'system'
                    ? 'bg-nova-accent/10 border border-nova-accent/20 text-nova-muted'
                    : 'bg-nova-surface2/50 border border-nova-border text-nova-text'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-nova-hover border border-nova-border flex items-center justify-center text-xs font-bold text-nova-muted shrink-0 mt-0.5">
                U
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-nova-accent to-[#d6304a] flex items-center justify-center text-xs font-bold text-white shrink-0">
              AI
            </div>
            <div className="bg-nova-surface2/50 border border-nova-border rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-nova-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-nova-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-nova-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-2 py-1 rounded-full bg-nova-hover border border-nova-border text-nova-muted hover:text-nova-text hover:border-nova-accent/50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-nova-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to write code, generate content..."
            className="flex-1 px-3 py-2 bg-nova-bg border border-nova-border rounded-lg text-xs text-nova-text placeholder-nova-muted/50 focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-nova-accent text-white text-xs rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
