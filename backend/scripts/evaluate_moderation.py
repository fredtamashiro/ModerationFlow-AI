from __future__ import annotations

import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.evaluation.runner import format_report, run_evaluation


DEFAULT_DATASET = (
    BACKEND_ROOT / "app" / "evaluation" / "datasets" / "moderation_eval.json"
)


def main() -> int:
    dataset_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_DATASET

    try:
        summary = run_evaluation(dataset_path)
    except Exception as error:
        print(f"Falha ao executar avaliacao: {error}", file=sys.stderr)
        return 1

    print(format_report(summary))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
