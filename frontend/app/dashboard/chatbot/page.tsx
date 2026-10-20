"use client";

import { useState } from "react";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Activity,
  RotateCcw,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  isSuggestion?: boolean;
  intent?: string;
}

const QUICK_SUGGESTIONS = [
  "What is paracetamol?",
  "First aid for burns",
  "I have a fever",
  "How to do CPR?",
  "How to get a prescription?"
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      sender: "bot",
      text: "Hi, what would you like to understand? I can share prepared information about general health topics. I cannot diagnose conditions or check whether medicines are safe for you.",
      time: "",
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const lastMessage = messages.at(-1);
  const { messagesRef, onMessagesScroll } = useChatScroll(lastMessage?.id, lastMessage?.sender === "user");

  const handleSend = async (textToSend: string) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText || loading) return;

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: trimmedText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // API call proxy
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response.");
      }

      // Add bot response
      const botMsg: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
      };

      setMessages((prev) => [...prev, botMsg]);

      // If confidence was low (resulting in fallback intent), suggest the symptom checker
      if (data.intent === "fallback") {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "bot",
            text: "",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSuggestion: true,
          }
        ]);
      }
    } catch (err: unknown) {
      console.error(err);

      const errorMsg: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: (err instanceof Error ? err.message : "") || "I'm having trouble connecting to my service right now. Please try again later.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "initial",
        sender: "bot",
        text: "Hi, what would you like to understand? I can share prepared information about general health topics. I cannot diagnose conditions or check whether medicines are safe for you.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[450px] flex flex-col space-y-4 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Health assistant</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Chat with our clinical intent classifier for immediate guidelines on medicines, emergency support, or first aid.
        </p>
      </div>

      {/* Main Chat Box Container */}
      <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {/* Chat Box Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">MedAI health assistant</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">General information</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors text-xs font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear History
          </button>
        </div>

        {/* Message Log */}
        <div ref={messagesRef} onScroll={onMessagesScroll} className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          {messages.map((msg) => {
            if (msg.isSuggestion) {
              return (
                <div key={msg.id} className="flex gap-3 max-w-lg animate-in slide-in-from-bottom-2 duration-300">
                  <div className="p-2 h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 space-y-3 shadow-sm">
                    <div>
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Alternative Screening Option</h4>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                        I do not have a reliable answer for that question. You could try describing it differently, use the symptom checker, or discuss it with a doctor.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/symptom-checker"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <Activity className="w-3.5 h-3.5" /> Open Symptom Checker
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            }

            const isBot = msg.sender === "bot";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] md:max-w-[70%] animate-in fade-in duration-300 ${
                  isBot ? "" : "ml-auto flex-row-reverse"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`p-2 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    isBot
                      ? "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                      isBot
                        ? "bg-neutral-50 dark:bg-neutral-950 border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
                        : "bg-teal-700 border-teal-800 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <div className={`text-[11px] text-neutral-400 dark:text-neutral-500 font-medium ${!isBot && "text-right"}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-sm animate-in fade-in duration-200">
              <div className="p-2 h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 shadow-sm min-w-[70px]">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input & suggestions footer */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-950 space-y-3">
          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mr-1">Suggestions:</span>
            {QUICK_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                onClick={() => {
                  setInputText(sug);
                  handleSend(sug);
                }}
                disabled={loading}
                className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-teal-400 dark:hover:border-teal-600 text-xs text-neutral-700 dark:text-neutral-400 bg-white dark:bg-neutral-900 font-semibold hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              maxLength={2000}
              aria-label="Your question for the health assistant"
              placeholder="What would you like to understand?"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Send question"
              disabled={loading || !inputText.trim()}
              className={`p-3 rounded-xl shadow-md flex items-center justify-center transition-all ${
                inputText.trim() && !loading
                  ? "bg-teal-700 hover:bg-teal-800 text-white shadow-teal-600/10 cursor-pointer"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 shadow-none cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
