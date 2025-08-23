@echo off
echo 🚀 Starting backend...
cd backend
start cmd /k "uvicorn app:app --reload --port 8000"
cd ..

echo 🎨 Starting frontend...
cd frontend
start cmd /k "npm run dev"
cd ..

REM המתנה קטנה כדי שהשרתים יעלו
timeout /t 3 > nul

echo 🌐 Opening browser...
start http://localhost:5173

echo ✅ All running! Close the windows to stop servers.
pause
