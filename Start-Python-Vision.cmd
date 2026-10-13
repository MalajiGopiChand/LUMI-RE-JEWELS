@echo off
cd /d "%~dp0"
if not exist ".venv-vision\Scripts\python.exe" python -m venv .venv-vision
".venv-vision\Scripts\python.exe" -c "import mediapipe, numpy, PIL" 2>nul
if errorlevel 1 ".venv-vision\Scripts\python.exe" -m pip install -r python\requirements.txt
".venv-vision\Scripts\python.exe" python\vision_server.py
