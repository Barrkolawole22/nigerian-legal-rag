import ChatInterface from "@/components/ChatInterface";

export default function LegalPage() {
  return (
    <ChatInterface
      mode="legal"
      title="Nigerian Legal Research"
      subtitle="#01 — Statutes, case law, and legal principles"
      accentColor="green"
      requiresUpload={false}
    />
  );
}
