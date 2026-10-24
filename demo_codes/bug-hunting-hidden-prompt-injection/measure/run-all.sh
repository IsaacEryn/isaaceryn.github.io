#!/bin/sh
# 글에 실은 실험 전체: Haiku 5.5는 두 도구로, Sonnet 5.5는 Playwright MCP로 페이지마다 5번씩
set -e
cd "$(dirname "$0")"
node run-agents.mjs --model claude-haiku-5-5 --tool playwright --runs 5 --concurrency 4
node run-agents.mjs --model claude-haiku-5-5 --tool devtools --runs 5 --concurrency 4
node run-agents.mjs --model claude-sonnet-5-5 --tool playwright --runs 5 --concurrency 4
