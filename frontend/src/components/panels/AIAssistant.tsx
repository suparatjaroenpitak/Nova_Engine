import { useState, useRef, useEffect, useMemo } from 'react';
import { aiApi } from '@/api/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  code?: string;
  language?: string;
}

type AIProvider = 'openai' | 'ollama' | 'builtin';

interface AIProviderConfig {
  id: AIProvider;
  name: string;
  icon: string;
  models: string[];
  description: string;
}

const PROVIDERS: AIProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', icon: '🤖', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'], description: 'Cloud-based AI (requires API key)' },
  { id: 'ollama', name: 'Ollama (Local)', icon: '💻', models: ['llama3', 'codellama', 'mistral', 'mixtral'], description: 'Local AI models (free, private)' },
  { id: 'builtin', name: 'Built-in', icon: '⚡', models: ['nova-assist'], description: 'Nova Engine built-in AI' },
];

const SYSTEM_PROMPT = `You are Nova AI, an expert game development assistant integrated into the Nova Game Engine. You can help with:

1. **C# Scripting**: Create MonoBehaviour scripts, editor tools, systems
2. **Shader Programming**: HLSL/GLSL shaders, ShaderLab
3. **Scene Setup**: Create scenes with proper lighting, cameras, objects
4. **UI Design**: Canvas-based UI with proper layout
5. **Animation**: Animation clips, state machines, blend trees
6. **Physics**: Rigidbodies, colliders, joints, constraints
7. **AI/NPC**: Behavior trees, state machines, pathfinding
8. **Terrain**: Terrain generation, texturing, foliage
9. **Performance**: Optimization tips, profiling, draw call batching
10. **Best Practices**: Code organization, patterns, component design

Provide complete, working code examples. Use Unity-style C# APIs.`;

const QUICK_ACTIONS = [
  { icon: '📄', label: 'Create Script', prompt: 'Create a player movement script with WASD controls, jumping, and camera follow' },
  { icon: '🎨', label: 'Create Material', prompt: 'Create a PBR material for a rocky terrain surface' },
  { icon: '💡', label: 'Create Lighting', prompt: 'Set up a scene with directional light, ambient light, and fog' },
  { icon: '⚙', label: 'Create Component', prompt: 'Create a reusable health system component with events' },
  { icon: '🧠', label: 'Create Enemy AI', prompt: 'Create an enemy AI with patrol, chase, and attack states' },
  { icon: '🎬', label: 'Create Animation', prompt: 'Create a simple idle-to-walk animation state machine' },
  { icon: '🔧', label: 'Debug', prompt: 'How do I debug a NullReferenceException in Unity?' },
  { icon: '📊', label: 'Optimize', prompt: 'How can I optimize my game for 60 FPS?' },
];

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="my-1 rounded-lg overflow-hidden border border-[#2a2a4a]">
      <div className="flex items-center justify-between px-2 py-1 bg-[#1a1a35] border-b border-[#2a2a4a]">
        <span className="text-[9px] text-[#6a6a8a]">{language || 'code'}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-[9px] text-[#6a6a8a] hover:text-white transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-2 text-[10px] text-[#e8e8f0] font-mono overflow-x-auto bg-[#0a0a1a] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function extractCodeBlocks(content: string): { text: string; blocks: { code: string; language: string }[] } {
  const blocks: { code: string; language: string }[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  let lastIndex = 0;
  let text = '';

  while ((match = regex.exec(content)) !== null) {
    text += content.slice(lastIndex, match.index);
    blocks.push({ code: match[2].trim(), language: match[1] || 'csharp' });
    lastIndex = match.index + match[0].length;
  }
  text += content.slice(lastIndex);

  return { text, blocks };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: "Hi! I'm Nova AI Assistant. I can help you create scripts, materials, animations, and more. Select a quick action below or type your request.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('builtin');
  const [model, setModel] = useState('nova-assist');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [showSettings, setShowSettings] = useState(false);
  const [contextSize, setContextSize] = useState(4000);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentProvider = PROVIDERS.find((p) => p.id === provider);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentProvider) setModel(currentProvider.models[0]);
  }, [provider]);

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
      let response = '';
      const history = messages.slice(-contextSize > 0 ? 10 : 5).map((m) => ({ role: m.role, content: m.content }));

      if (provider === 'ollama') {
        const res = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: message.trim() }],
            stream: false,
          }),
        });
        const data = await res.json();
        response = data.message?.content || 'No response from Ollama';
      } else if (provider === 'openai' && apiKey) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: message.trim() }],
          }),
        });
        const data = await res.json();
        response = data.choices?.[0]?.message?.content || 'No response from OpenAI';
      } else {
        // Built-in AI
        const { data } = await aiApi.execute({
          capability: 'script-generation',
          prompt: `${SYSTEM_PROMPT}\n\nUser: ${message.trim()}`,
        });
        response = data?.content || 'I processed your request. Here is what I found...\n\n```csharp\n// Generated code\npublic class Example : MonoBehaviour {\n    void Start() {\n        Debug.Log("Hello from Nova AI!");\n    }\n}\n```';
      }

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response || 'I processed your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠ Error: ${err?.message || 'AI service unavailable'}. ${provider === 'ollama' ? 'Make sure Ollama is running on ' + ollamaUrl : provider === 'openai' ? 'Check your API key' : 'Built-in AI failed'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome', role: 'system',
      content: "Conversation cleared. How can I help you?", timestamp: new Date(),
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      {/* Header */}
      <div className="flex items-center h-7 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
        <span className="text-xs font-medium text-[#e8e8f0]">🤖 AI Assistant</span>
        <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-[#e94560]/20 text-[#e94560]">{provider === 'ollama' ? 'Local' : provider === 'openai' ? 'OpenAI' : 'Built-in'}</span>
        <div className="flex-1" />
        <button onClick={clearConversation} className="text-[9px] text-[#6a6a8a] hover:text-white px-1">Clear</button>
        <button onClick={() => setShowSettings(!showSettings)} className="text-[9px] text-[#6a6a8a] hover:text-white px-1">⚙</button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-2 bg-[#0f0f25] border-b border-[#2a2a4a] space-y-1.5">
          <div className="flex gap-1">
            {PROVIDERS.map((p) => (
              <button key={p.id} onClick={() => setProvider(p.id)}
                className={`flex-1 px-2 py-1 rounded text-[9px] text-center transition-all ${
                  provider === p.id ? 'bg-[#e94560] text-white' : 'bg-[#1a1a35] text-[#6a6a8a] hover:text-white border border-[#2a2a4a]'
                }`}
              >
                <div className="text-xs">{p.icon}</div>
                <div className="font-medium">{p.name}</div>
              </button>
            ))}
          </div>

          {currentProvider && (
            <div className="text-[9px] text-[#6a6a8a]">{currentProvider.description}</div>
          )}

          {currentProvider && currentProvider.models.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-[#6a6a8a]">Model:</span>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="flex-1 px-1.5 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]">
                {currentProvider.models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          {provider === 'openai' && (
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="OpenAI API Key (sk-...)"
              className="w-full px-2 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0] placeholder-[#3a3a5a]"
            />
          )}

          {provider === 'ollama' && (
            <input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} placeholder="Ollama URL (http://localhost:11434)"
              className="w-full px-2 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0] placeholder-[#3a3a5a]"
            />
          )}

          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#6a6a8a]">Context:</span>
            <input type="range" min={1000} max={8000} step={1000} value={contextSize} onChange={(e) => setContextSize(parseInt(e.target.value))} className="flex-1 h-1 accent-[#e94560]" />
            <span className="text-[9px] text-[#6a6a8a] w-8 text-right">{contextSize}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg) => {
          const { text, blocks } = extractCodeBlocks(msg.content);
          return (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role !== 'user' && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#e94560] to-[#d6304a] flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
                  AI
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[10px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#e94560]/20 border border-[#e94560]/30 text-[#e8e8f0]'
                  : msg.role === 'system'
                    ? 'bg-[#4488ff]/10 border border-[#4488ff]/20 text-[#6a6a8a] italic'
                    : 'bg-[#1a1a35]/80 border border-[#2a2a4a] text-[#e8e8f0]'
              }`}>
                {text && <div className="whitespace-pre-wrap">{text}</div>}
                {blocks.map((block, i) => (
                  <CodeBlock key={i} code={block.code} language={block.language} />
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-[#1a1a35] border border-[#2a2a4a] flex items-center justify-center text-[9px] font-bold text-[#6a6a8a] shrink-0 mt-0.5">
                  U
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#e94560] to-[#d6304a] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              AI
            </div>
            <div className="bg-[#1a1a35]/80 border border-[#2a2a4a] rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="px-2 pb-1">
          <div className="grid grid-cols-4 gap-1">
            {QUICK_ACTIONS.map((action) => (
              <button key={action.label} onClick={() => handleSend(action.prompt)}
                className="flex items-center gap-1 px-1.5 py-1 rounded text-[9px] bg-[#1a1a35] border border-[#2a2a4a] text-[#6a6a8a] hover:text-white hover:border-[#e94560]/50 transition-all truncate"
              >
                <span>{action.icon}</span>
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-2 border-t border-[#2a2a4a]">
        <div className="flex gap-1.5">
          <textarea
            ref={inputRef as any}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to write code, generate content..."
            className="flex-1 px-2 py-1.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded-lg text-[10px] text-[#e8e8f0] placeholder-[#6a6a8a]/50 resize-none h-8 leading-tight focus:border-[#e94560] focus:ring-2 focus:ring-[#e94560]/20 transition-all"
            disabled={loading}
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-2.5 py-1 bg-[#e94560] text-white text-[10px] rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
