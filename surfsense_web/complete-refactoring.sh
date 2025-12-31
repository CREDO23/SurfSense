#!/bin/bash
set -e

# Since the helper files are already created, I just need to update the main files
# to use them. Let me check what's in each file and update them properly.

# For now, let me just run the build and test to ensure everything compiling
echo "Running build..." 
pnpm build 2>&1 | grep -E 'Compiled|Error|ENVIRONMENT' | head -20

echo ""
echo "Running tests..."
pnpm test 2>&1 | grep -E 'passed|failed|Test Files'

