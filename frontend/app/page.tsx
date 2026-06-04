import { DocumentsPanel } from "@/components/documents-panel";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <DocumentsPanel />
      </div>
    </main>
  );
}
