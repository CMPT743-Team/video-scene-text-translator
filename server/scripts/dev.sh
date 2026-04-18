#!/usr/bin/env bash
# Dev convenience: runs the FastAPI backend (uvicorn --reload :8000) and the
# Vite frontend dev server (:5173) in parallel. Browse http://localhost:5173.
# Vite proxies /api/* to :8000 so CORS isn't a concern (plan.md D9).
#
# Ctrl+C stops both.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$( cd "${SCRIPT_DIR}/../.." && pwd )"

# Activate conda env if available
if [[ -z "${CONDA_DEFAULT_ENV:-}" ]]; then
  if [[ -f /opt/miniforge3/bin/conda ]]; then
    # shellcheck disable=SC1091
    eval "$(/opt/miniforge3/bin/conda shell.bash hook)"
    conda activate vc_final
  elif [[ -f /opt/miniconda3/bin/conda ]]; then
    # shellcheck disable=SC1091
    eval "$(/opt/miniconda3/bin/conda shell.bash hook)"
    conda activate vc_final
  fi
fi

# Activate nvm if available (Node)
if [[ -f /opt/nvm/nvm.sh ]]; then
  export NVM_DIR=/opt/nvm
  # shellcheck disable=SC1091
  source "${NVM_DIR}/nvm.sh"
fi

# Trap SIGINT/SIGTERM → kill both children
pids=()
cleanup() {
  for pid in "${pids[@]}"; do
    kill "${pid}" 2>/dev/null || true
  done
  wait
}
trap cleanup INT TERM EXIT

echo "==> starting FastAPI (uvicorn :8000)"
(cd "${REPO_ROOT}" && python -m uvicorn server.app.main:app --host 0.0.0.0 --port 8000 --reload) &
pids+=($!)

echo "==> starting Vite (:5173)"
(cd "${REPO_ROOT}/web" && npm run dev -- --host) &
pids+=($!)

wait
