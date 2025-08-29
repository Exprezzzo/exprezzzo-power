'use client';

import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input, model: "openai/gpt-4" })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let message = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) message += data.content;
            } catch {}
          }
        }
      }
    }

    setMessages(prev => [...prev, message]);
    setLoading(false);
    setInput("");
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Chat</h1>
      
      <div className="space-y-4 mb-8">
        {messages.map((msg, i) => (
          <div key={i} className="p-4 bg-gray-800 rounded-lg">{msg}</div>
        ))}
      </div>
      
      <div className="flex gap-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-4 bg-gray-800 rounded-lg"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-8 py-4 bg-yellow-500 text-black rounded-lg"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}