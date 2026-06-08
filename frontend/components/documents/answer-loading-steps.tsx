"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

type AnswerLoadingStepsProps = {
  isLoading: boolean;
};

const LOADING_STEPS = [
  { label: "Preparando sua pergunta", startsAtMs: 0 },
  { label: "Buscando trechos relevantes", startsAtMs: 1500 },
  { label: "Avaliando fontes do documento", startsAtMs: 4000 },
  { label: "Gerando resposta final", startsAtMs: 8000 },
] as const;

function getActiveStepIndex(elapsedMs: number): number {
  let activeStepIndex = 0;

  for (let index = 0; index < LOADING_STEPS.length; index += 1) {
    if (elapsedMs >= LOADING_STEPS[index].startsAtMs) {
      activeStepIndex = index;
    }
  }

  return activeStepIndex;
}

export function AnswerLoadingSteps({
  isLoading,
}: AnswerLoadingStepsProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setActiveStepIndex(getActiveStepIndex(Date.now() - startedAt));
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoading]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#d9dde3] bg-[#FCFDF8] px-4 py-4">
      <div className="space-y-3">
        {LOADING_STEPS.map((step, index) => {
          const isCompleted = index < activeStepIndex;
          const isActive = index === activeStepIndex;
          const isFuture = index > activeStepIndex;

          return (
            <div
              key={step.label}
              className={[
                "flex items-center gap-3 rounded-xl px-2 py-1.5 transition",
                isFuture ? "opacity-45" : "opacity-100",
                isActive ? "bg-[#efffdd]" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  isCompleted
                    ? "border-[#99FF33] bg-[#99FF33] text-[#1A1A1A]"
                    : isActive
                      ? "border-[#2F6F6D] bg-white text-[#2F6F6D]"
                      : "border-[#d9dde3] bg-white text-[#8A8F98]",
                ].join(" ")}
                aria-hidden="true"
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current" />
                )}
              </span>

              <p
                className={[
                  "text-sm leading-6",
                  isActive ? "text-[#1A1A1A]" : "text-[#666666]",
                ].join(" ")}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
