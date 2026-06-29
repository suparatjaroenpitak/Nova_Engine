#!/bin/bash
# Nova Engine — Render Web Service Start Script
# This runs after the container is built, before the app starts
# Used to run EF Core migrations and seed data

echo "=== Nova Engine — Render Start ==="
echo "Running EF Core migrations..."
dotnet Nova.Api.dll --migrate-only &

# Wait for migration to complete, then start normally
sleep 5
echo "Starting API..."
dotnet Nova.Api.dll
