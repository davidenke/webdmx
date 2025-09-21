#!/usr/bin/env bash

# Update node to latest version and update .nvmrc files
echo "> Updating Node.js to latest LTS version"
echo "  --------------------------------------"
fnm install --lts
echo $(node -v) > .nvmrc

echo "> Updating Node.js in all packages, too"
echo "  -------------------------------------"
pnpm -r exec fnm install --lts
pnpm -rc exec 'echo $(node -v) > .nvmrc'

# Update all dependencies to latest version in all packages
echo "> Checking for latest versions of dependencies"
echo "  --------------------------------------------"
pnpm -r exec pnpx npm-check-updates -ux @types/node

# Align node types to installed node lts version
echo "> Aligning @types/node to installed Node LTS version"
echo "  -------------------------------------------------"
NODE_VERSION=$(node -v) # → v.22.18.0
NODE_MAJOR_VERSION=${NODE_VERSION:1:2} # → 22
pnpm -r exec pnpm install --lockfile-only --save-dev --save-exact @types/node@${NODE_MAJOR_VERSION} # → 22.17.2

# Install updated dependencies
echo "> Installing updated dependencies"
echo "  -------------------------------"
pnpm install
