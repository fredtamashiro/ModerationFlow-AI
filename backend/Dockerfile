FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts
COPY alembic.ini ./alembic.ini
COPY migrations ./migrations

CMD ["sh", "scripts/start_api.sh"]
