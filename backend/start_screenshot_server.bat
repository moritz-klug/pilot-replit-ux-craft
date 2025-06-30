@echo off
echo Starting Screenshot API Server...
echo.
echo Make sure you have installed the dependencies:
echo pip install -r requirements.txt
echo.
echo The server will be available at: http://localhost:8001
echo API Documentation: http://localhost:8001/docs
echo.
python run_screenshot_server.py
pause 