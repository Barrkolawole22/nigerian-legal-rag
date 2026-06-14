import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <ChatInterface
      mode="general"
      title="Document Chat"
      subtitle="#05 — Chat with any PDF or Word document"
      accentColor="blue"
      requiresUpload={true}
    />
  );
}
