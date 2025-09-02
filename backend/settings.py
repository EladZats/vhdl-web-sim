import os

# Detect environment: "dev" (default) or "prod"
ENV = os.getenv("APP_ENV", "dev")

if ENV == "prod":
    # In production, allow only your deployed frontend
    ALLOWED_ORIGINS = [
        "https://netlistsimulator.netlify.app",   # Frontend prod
    ]
else:
    # In development, allow localhost (React dev server)
    ALLOWED_ORIGINS = [
        "http://localhost:5173"
    ]
