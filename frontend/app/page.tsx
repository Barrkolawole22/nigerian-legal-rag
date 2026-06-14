import Link from "next/link";
import { FileText, Scale } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-950">
      <div className="max-w-2xl w-full">
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
          Portfolio
        </p>
        <h1 className="text-3xl font-bold text-white mb-1">RAG Projects</h1>
        <p className="text-gray-400 mb-10 text-sm">
          AI-powered document intelligence — built with LangChain, FAISS, and Gemini
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/chat">
            <div className="group p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer h-full">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs text-blue-400 font-mono mb-1">#05</p>
              <h2 className="text-base font-semibold text-white mb-2">
                Document Chat
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Upload any PDF or Word document and chat with it using
                retrieval-augmented generation.
              </p>
            </div>
          </Link>

          <Link href="/legal">
            <div className="group p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-green-500/50 transition-all cursor-pointer h-full">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <Scale className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-xs text-green-400 font-mono mb-1">#01</p>
              <h2 className="text-base font-semibold text-white mb-2">
                Nigerian Legal Research
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Query Nigerian statutes and case law. Cite sections and acts
                with AI-powered retrieval.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
