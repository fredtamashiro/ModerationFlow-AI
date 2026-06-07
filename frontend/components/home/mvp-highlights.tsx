import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

const highlights = [
  {
    title: "RAG com fontes",
    description:
      "Cada resposta retorna trechos relevantes, páginas, score e justificativa de relevância.",
  },
  {
    title: "Arquitetura pronta para deploy",
    description:
      "Frontend, API e worker podem operar como serviços independentes no Railway.",
  },
  {
    title: "Auditoria operacional",
    description:
      "Login admin, ingestões, falhas e exclusões são registrados em usage logs.",
  },
];

export function MvpHighlights() {
  return (
    <section className="bg-white py-10">
      <PageContainer>
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((highlight) => (
            <Card
              key={highlight.title}
              className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-6"
            >
              <h3 className="heading-4 text-[#1A1A1A]">{highlight.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#666666]">
                {highlight.description}
              </p>
            </Card>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
