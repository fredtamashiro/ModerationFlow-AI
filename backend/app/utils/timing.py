from collections.abc import Iterator
from contextlib import contextmanager
from time import perf_counter


class RequestTimer:
    """Mede duracao total e de etapas nomeadas em milissegundos."""

    def __init__(self) -> None:
        self.started_at = perf_counter()
        self.timings: dict[str, int] = {}

    def elapsed_ms(self) -> int:
        return int((perf_counter() - self.started_at) * 1000)

    @contextmanager
    def track(self, name: str) -> Iterator[None]:
        started_at = perf_counter()
        try:
            yield
        finally:
            duration_ms = int((perf_counter() - started_at) * 1000)
            self.timings[name] = self.timings.get(name, 0) + duration_ms

    def to_dict(self) -> dict[str, object]:
        return {
            "duration_ms": self.elapsed_ms(),
            "timings": dict(self.timings),
        }
