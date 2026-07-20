"use client";

import { useState } from "react";
import { X, Send, MessageSquare, Bot, Loader2 } from "lucide-react";

export function FloatingAIChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hi there! 👋 I am your SynArc AI Companion. Ask me anything about Creator DAOs, USDC nanopayments, milestone escrows, or our SDK!' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMessage = { role: 'user' as const, content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setSendingChat(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage]
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I had trouble formulating a response. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: "Network error. Please make sure you are connected and try again." }]);
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isChatOpen && (
        <div className="w-80 sm:w-96 h-[450px] rounded-2xl border border-primary/20 bg-background/90 backdrop-blur-lg shadow-2xl flex flex-col overflow-hidden mb-4 glass-card">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-primary/30 to-accent/30 border-b border-border-thin flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">SynArc AI Companion</h4>
                <span className="text-[9px] text-muted block">Online · Powered by Groq</span>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-none text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-accent-purple text-white-keep rounded-tr-none'
                      : 'bg-surface border border-border-thin text-text-secondary rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sendingChat && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border-thin text-text-secondary p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-border-thin flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about SynArc..."
              disabled={sendingChat}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border-thin text-xs text-white placeholder-muted focus:border-primary outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={sendingChat || !chatInput.trim()}
              className="p-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white shadow-lg flex items-center justify-center cursor-pointer border border-white/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all"
      >
        {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
