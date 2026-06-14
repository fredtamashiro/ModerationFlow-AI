from __future__ import annotations

import argparse
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.evaluation.runner import format_report, run_evaluation


DEFAULT_DATASET = (
    BACKEND_ROOT / "app" / "evaluation" / "datasets" / "moderation_eval.json"
)
HOLDOUT_DATASET = (
    BACKEND_ROOT / "app" / "evaluation" / "datasets" / "moderation_holdout_eval.json"
)
BLIND_DATASET = (
    BACKEND_ROOT / "app" / "evaluation" / "datasets" / "moderation_blind_eval.json"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Executa a avaliacao do grafo de moderacao em memoria."
    )
    parser.add_argument(
        "--dataset",
        choices=("main", "holdout", "blind"),
        default="main",
        help="Seleciona um dataset predefinido. Default: main.",
    )
    parser.add_argument(
        "--dataset-path",
        help="Caminho explicito para um arquivo JSON de dataset de avaliacao.",
    )
    return parser.parse_args()


def resolve_dataset_path(args: argparse.Namespace) -> Path:
    if args.dataset_path:
        dataset_path = (BACKEND_ROOT / args.dataset_path).resolve()
        if not dataset_path.exists():
            raise FileNotFoundError(
                f"Dataset de avaliacao nao encontrado em --dataset-path: {dataset_path}"
            )
        return dataset_path

    if args.dataset == "holdout":
        return HOLDOUT_DATASET
    if args.dataset == "blind":
        return BLIND_DATASET
    return DEFAULT_DATASET


def main() -> int:
    args = parse_args()

    try:
        dataset_path = resolve_dataset_path(args)
        summary = run_evaluation(dataset_path)
    except Exception as error:
        print(f"Falha ao executar avaliacao: {error}", file=sys.stderr)
        return 1

    print(format_report(summary))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
