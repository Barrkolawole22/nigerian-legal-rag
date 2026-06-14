const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ChatMode = "general" | "legal";

export interface ChatResponse {
  answer: string;
  sources: string[];
  mode: ChatMode;
}

export interface UploadResponse {
  session_id: string;
  filename: string;
  chunks: number;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/api/documents/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}

export async function sendMessage(
  session_id: string,
  message: string,
  mode: ChatMode
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, message, mode }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}
