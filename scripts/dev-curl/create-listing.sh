#!/bin/bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

curl -sS "http://localhost:3000/listings" --json "@${SCRIPT_DIR}/listing.json"
