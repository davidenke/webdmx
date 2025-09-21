#!/usr/bin/env bash

# Assuming having fnm installed from HEAD
# brew unlink fnm
# brew install fnm --HEAD
# eval "$(fnm env --use-on-cd --shell zsh)"

# Update node to latest version and update .nvmrc files
# > this requires fnm to be installed from HEAD, as the last stable
# > release is from 11/2024 not containing this flag yet
echo "> Updating Node.js to current LTS version"
fnm install --lts --use
node -v > .nvmrc

echo "> Updating Node.js in all packages, too"
pnpm -r --parallel --aggregate-output --no-reporter-hide-prefix --shell-mode exec 'node -v > .nvmrc'

# Update all dependencies to latest version in all packages
echo "> Checking for latest versions of dependencies"
pnpm -r --parallel --aggregate-output --no-reporter-hide-prefix exec pnpx npm-check-updates -ux @types/node

# Align node types to installed node lts version
echo "> Aligning @types/node to installed Node LTS version"
NODE_VERSION=$(node -v) # → v.22.18.0
NODE_MAJOR_VERSION=${NODE_VERSION:1:2} # → 22
pnpm -r --parallel --aggregate-output --no-reporter-hide-prefix exec pnpm install --lockfile-only --save-dev --save-exact @types/node@${NODE_MAJOR_VERSION} # → 22.17.2

# Install updated dependencies
echo "> Installing updated dependencies"
pnpm install
