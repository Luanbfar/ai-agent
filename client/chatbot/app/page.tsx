"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([{ role: "assitant", content: "Hello! How can I assist you today?" }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/chat";

  const sendMessage = async () => {
    setIsLoading(true);
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatInput: input }),
    });
    const data = await response.json();
    setMessages([...newMessages, { role: "assitant", content: data.response }]);
    setIsLoading(false);
  };

  return (
    <main className="flex h-screen w-full flex-col rounded-2xl border-gray-200 bg-white shadow-lg">
      <header className="flex items-center justify-center border-b border-gray-200 bg-blue-600 p-4 text-white text-lg font-semibold">
        Chatbot
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-1 rounded-xl bg-gray-200 px-3 py-2">
              <span className="dot bg-gray-600"></span>
              <span className="dot bg-gray-600"></span>
              <span className="dot bg-gray-600"></span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center border-t border-gray-200 bg-gray-50 p-3">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 placeholder-gray-400 text-gray-800"
        />
        <button
          onClick={sendMessage}
          className="ml-3 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </main>
  );
}
