#!/bin/bash

# Stop and remove existing test container if it exists
docker stop routine-reality-test-db || true
docker rm routine-reality-test-db || true

# Create new PostgreSQL container for testing
docker run --name routine-reality-test-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=test_routine_reality \
  -p 5432:5432 \
  -d postgres:16

# Wait for PostgreSQL to start
echo "Waiting for PostgreSQL to start..."
sleep 5

echo "Test database is ready. Connection string:"
echo "postgres://postgres:postgres@localhost:5432/test_routine_reality" 