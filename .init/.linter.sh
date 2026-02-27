#!/bin/bash
cd /home/kavia/workspace/code-generation/web-calculator-326991-327005/calculator_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

