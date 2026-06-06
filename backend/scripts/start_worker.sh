#!/bin/sh
set -e

rq worker smart_ingest --url "${REDIS_URL}"
