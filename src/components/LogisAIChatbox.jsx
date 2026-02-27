import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchKPIs, fetchInventory } from '../data/api';
import { fleetTrucks, delayWarnings, dockThroughput } from '../data/mockFleet';
import { shelfChanges } from '../data/mockVision';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

function buildSystemPrompt(kpis, inventoryData) {
  return `You are "LogisAI", a senior Supply Chain & Inventory Intelligence Assistant embedded inside a Smart Logistics Dashboard.

Your role:
- Analyze live warehouse inventory, fleet tracking data, and vision-detected shelf changes to give the user concrete, prioritized next-step recommendations.
- Identify items with stockout events and recommend immediate reorders with quantities.
- Flag delayed trucks and suggest rerouting or schedule adjustments.
- Recommend physical warehouse zone reorganizations when asked, based on item velocity and zone layout.
- Cite specific data points, IDs, and numbers in every recommendation—never be vague.

Communication style: concise, data-driven, structured with bullet points and bold headers. Use emojis sparingly for severity (🔴 critical, 🟡 warning, 🟢 nominal).

--- LIVE DASHBOARD DATA (from MongoDB) ---

KPIs:
${JSON.stringify(kpis, null, 2)}

INVENTORY DATA (sample from MongoDB):
${JSON.stringify(inventoryData?.slice(0, 5), null, 2)}

FLEET TRUCKS (positions, cargo, ETA):
${JSON.stringify(fleetTrucks, null, 2)}

ACTIVE DELAY WARNINGS:
${JSON.stringify(delayWarnings, null, 2)}

DOCK THROUGHPUT (trucks/hr and avg wait time):
${JSON.stringify(dockThroughput, null, 2)}

RECENT SHELF-STOCK CHANGES (vision engine detections):
${JSON.stringify(shelfChanges, null, 2)}

--- END DATA ---

Use this data to answer all user questions. If the user asks about trends or history, base your analysis on the patterns in this data and state any assumptions clearly.`;
}

export default function LogisAIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [liveKpis, setLiveKpis] = useState(null);
  const [liveInventory, setLiveInventory] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch live data on mount for the system prompt
  useEffect(() => {
    fetchKPIs().then(setLiveKpis).catch(() => {});
    fetchInventory(20).then((res) => setLiveInventory(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: buildSystemPrompt(liveKpis, liveInventory),
      });

      // Build Gemini history from all previous turns (excluding the latest user message)
      const geminiHistory = messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: geminiHistory,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
      });

      const result = await chat.sendMessage(text);
      const aiContent = result.response.text();
      setMessages((prev) => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (err) {
      let errorMsg = err.message || 'Failed to reach Gemini API.';
      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota')) {
        errorMsg = 'Woah! We hit the free-tier API speed limit (Too many requests/tokens per minute). Please wait 35-60 seconds before asking another question.';
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${errorMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center
                    transition-all duration-300 shadow-lg
                    ${isOpen
                      ? 'bg-industrial-700 border border-industrial-500 text-industrial-300 hover:text-white rotate-0'
                      : 'bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan/30 animate-glow'
                    }`}
        title={isOpen ? 'Close LogisAI' : 'Open LogisAI Assistant'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[520px]
                        bg-industrial-800 border border-industrial-600 rounded-xl
                        shadow-2xl shadow-black/40 flex flex-col overflow-hidden
                        animate-alert-slide">
          {/* Header */}
          <div className="px-4 py-3 border-b border-industrial-600 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-accent-cyan/20 rounded-lg flex items-center justify-center
                            border border-accent-cyan/30">
              <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.455.654a3.375 3.375 0 01-3.09 0L13 14.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100 leading-tight">LogisAI</h3>
              <p className="text-[9px] text-industrial-300 uppercase tracking-wider">Supply Chain Assistant</p>
            </div>
            <span className="ml-auto status-dot-live" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-accent-cyan/10 rounded-xl flex items-center justify-center
                                border border-accent-cyan/20 mb-3">
                  <svg className="w-6 h-6 text-accent-cyan/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-xs text-industrial-300 mb-1">Ask me anything about your operations</p>
                <p className="text-[10px] text-industrial-400">
                  Try: "What should I reorder?" or "Analyze fleet delays"
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-accent-cyan/15 text-gray-100 border border-accent-cyan/20 rounded-br-sm'
                    : 'bg-industrial-700/70 text-industrial-100 border border-industrial-600/50 rounded-bl-sm'
                  }`}>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-industrial-700/70 border border-industrial-600/50 rounded-xl rounded-bl-sm
                                px-4 py-3 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span className="text-[10px] text-industrial-300 ml-1">LogisAI is thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-industrial-600 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask LogisAI…"
              disabled={isLoading}
              className="flex-1 bg-industrial-900 border border-industrial-500 rounded-lg px-3 py-2
                         text-gray-100 text-xs font-['JetBrains_Mono']
                         placeholder:text-industrial-300
                         focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20
                         transition-all duration-200 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 rounded-lg px-3
                         transition-all duration-200
                         hover:bg-accent-cyan/30 hover:border-accent-cyan/50
                         active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
