#!/usr/bin/env python3
"""
Screenshot Server Runner
This script starts the screenshot API server on port 8001
"""

import uvicorn

if __name__ == "__main__":
    print("Starting Screenshot API Server...")
    print("Server will be available at: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    
    uvicorn.run(
        "screenshot_server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    ) 