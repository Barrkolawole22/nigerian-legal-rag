"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Upload,
  FileText,
  X,
  ArrowLeft,
  Loader2,
  Scale,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { uploadDocument, sendMessage, ChatMode } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

interface ChatInterfaceProps {
  mode: ChatMode;
  title: string;
  subtitle: string;
  accentColor: "blue" | "green";
  requiresUpload?: boolean;
}

const ACCENT = {
  blue: {
    dot: "bg-blue-400",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    button: "bg-blue-600 hover:bg-blue-500",
    badge: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
    dragBorder: "border-blue-500",
    dragBg: "bg-blue-500/5",
  },
  green: {
    dot: "bg-green-400",
    text: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    button: "bg-green-700 hover:bg-green-600",
    badge: "bg-green-500/10 text-green-300 border border-green-500/20",
    dragBorder: "border-green-500",
    dragBg: "bg-green-500/5",
  },
};

export default function ChatInterface({
  mode,
  title,
  subtitle,
  accentColor,
  requiresUpload = false,
}: ChatInterfaceProps) {
  const a = ACCENT[accentColor];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!requiresUpload && !sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, [requiresUpload, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await uploadDocument(file);
      setSessionId(res.session_id);
      setFilename(res.filename);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || loading) return;

    const question = input.trim();
    setInput("");
    setError(null);

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: question },
    ]);

    setLoading(true);
    try {
      const res = await sendMessage(sessionId, question, mode);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.answer,
          sources: res.sources,
        },
      ]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const canChat = requiresUpload ? !!sessionId : !!sessionId;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800/60 px-4 py-3 flex items-center gap-3 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <Link
          href="/"
          className="text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-px h-4 bg-gray-800" />
        <div className={`w-2 h-2 rounded-full ${a.dot}`} />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white">{title}</h1>
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        </div>
        {filename && (
          <div
            className={`flex items-center gap-1.5 text-xs ${a.text} ${a.bg} border ${a.border} px-2 py-1 rounded-md max-w-[180px] truncate shrink-0`}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">{filename}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6 gap-4">
        {/* Upload zone */}
        {requiresUpload && !sessionId && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-xl p-14 text-center transition-all ${
              dragOver
                ? `${a.dragBorder} ${a.dragBg}`
                : "border-gray-800 hover:border-gray-700"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
                <p className="text-gray-400 text-sm">Processing document...</p>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Upload className="w-7 h-7 text-gray-600 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">
                  Drop your document here
                </p>
                <p className="text-gray-500 text-sm">
                  PDF or DOCX, up to 20MB
                </p>
                <p className={`text-xs ${a.text} mt-3 underline underline-offset-2`}>
                  or click to browse
                </p>
              </label>
            )}
          </div>
        )}

        {/* Legal mode welcome */}
        {mode === "legal" && messages.length === 0 && (
          <div
            className={`${a.bg} border ${a.border} rounded-xl p-4 flex gap-3`}
          >
            <Scale className={`w-4 h-4 ${a.text} shrink-0 mt-0.5`} />
            <div>
              <p className={`text-sm ${a.text} font-medium mb-1`}>
                Nigerian Legal Research
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ask about Nigerian statutes, case law, or legal principles.
                Relevant sections and acts will be cited in each response.
              </p>
              <p className="text-gray-600 text-xs mt-2 italic">
                e.g. &quot;What does the Evidence Act say about hearsay?&quot;
                or &quot;Requirements for a valid contract under Nigerian law&quot;
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[82%]">
                <div
                  className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-800 text-white whitespace-pre-wrap"
                      : "bg-gray-900 text-gray-100 border border-gray-800/80"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-white">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-5 mb-2 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5 mb-2 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => <li>{children}</li>,
                        code: ({ children }) => (
                          <code className="bg-gray-800 rounded px-1 py-0.5 text-xs">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.sources.map((src, i) => (
                      <span key={i} className={`text-xs rounded-md px-2 py-0.5 ${a.badge}`}>
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border border-gray-800/80 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between gap-2">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {canChat && (
          <div className="mt-auto pt-4 border-t border-gray-800/60">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
                placeholder={
                  mode === "legal"
                    ? "Ask about Nigerian law..."
                    : "Ask about your document..."
                }
                className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`${a.button} disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 transition-colors`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}