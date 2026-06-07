import { Database, ShieldCheck, Workflow } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const items = [
  {
    title: "Smart Ingest",
    description:
      "Upload, fila Redis, worker separado, enriquecimento com IA e atualização de status por job.",
    icon: Workflow,
  },
  {
    title: "Base consultável",
    description:
      "Chunks, embeddings e documentos registrados em PostgreSQL com busca vetorial via pgvector.",
    icon: Database,
  },
  {
    title: "Controle operacional",
    description:
      "Rate limit no chat público, autenticação admin e usage logs para auditoria de eventos.",
    icon: ShieldCheck,
  },
];

export function CapabilityCards() {
  return (
    <section id="fluxo" className="scroll-mt-28 bg-white py-10">
      <PageContainer>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-6"
              >
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-[#99FF33]" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </Card>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}
