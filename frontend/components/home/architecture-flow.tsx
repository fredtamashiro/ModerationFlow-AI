import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

const steps = [
  "Upload do PDF por administrador",
  "Persistência temporária do arquivo para processamento",
  "Criação do processing_job e envio para Redis Queue",
  "Consumo pelo worker, extração, chunking e enriquecimento semântico",
  "Geração de embeddings e indexação em PostgreSQL + pgvector",
  "Disponibilização do documento para consulta com respostas e fontes",
];

export function ArchitectureFlow() {
  return (
    <section className="bg-[#fafafa] py-10">
      <PageContainer className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <h2 className="heading-2 text-[#1A1A1A]">Fluxo operacional</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#666666]">
            O projeto separa ingestão, indexação e consulta em etapas claras,
            facilitando observabilidade, deploy independente e evolução da
            arquitetura.
          </p>
        </div>

        <Card className="rounded-[20px] border-[#d9dde3] bg-white p-6">
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#efffdd] text-sm font-semibold text-[#1A1A1A]">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-6 text-[#1A1A1A]">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </PageContainer>
    </section>
  );
}
