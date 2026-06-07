import { PageContainer } from "@/components/layout/page-container";

export function DeploySection() {
  return (
    <section id="deploy" className="scroll-mt-28 bg-[#F7F8FA] py-10">
      <PageContainer>
        <div className="max-w-3xl">
          <h2 className="heading-2 text-[#1A1A1A]">Deploy e operação</h2>
          <p className="mt-3 text-sm leading-7 text-[#666666]">
            A arquitetura foi preparada para separar frontend, API e worker em
            serviços independentes, com bootstrap de banco, checklist de
            pre-deploy e guia de deploy para Railway.
          </p>
        </div>
      </PageContainer>
    </section>
  );
}
