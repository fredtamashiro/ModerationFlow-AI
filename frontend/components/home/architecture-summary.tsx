import { ShieldCheck } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { AuthUser } from "@/services/api";

type ArchitectureSummaryProps = {
  adminUser: AuthUser | null;
  isCheckingSession: boolean;
};

export function ArchitectureSummary({
  adminUser,
  isCheckingSession,
}: ArchitectureSummaryProps) {
  return (
    <div className="grid gap-4">
      <Card className="rounded-[20px] border-[#d9dde3] bg-white p-6">
        <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
          <ShieldCheck className="h-5 w-5 text-[#99FF33]" />
          Operação administrativa
        </CardTitle>
        <CardDescription className="text-[#666666]">
          Login via cookie HttpOnly, upload restrito e logs operacionais para
          acompanhar ingestão, falhas e exclusões.
        </CardDescription>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-5">
          <p className="text-sm font-medium text-[#666666]">Status admin</p>
          <p className="mt-2 text-lg font-semibold text-[#1A1A1A]">
            {isCheckingSession
              ? "Verificando..."
              : adminUser
                ? "Autenticado"
                : "Não autenticado"}
          </p>
        </Card>
        <Card className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-5">
          <p className="text-sm font-medium text-[#666666]">Stack</p>
          <p className="mt-2 text-lg font-semibold text-[#1A1A1A]">
            FastAPI, RQ, Redis e pgvector
          </p>
        </Card>
      </div>
    </div>
  );
}
