#!/usr/bin/env bash
# render-build.sh

# Install system dependencies required for pcsclite
apt-get update && apt-get install -y libpcsclite-dev pcscd

# Proceed with npm build
npm install
npm run build
