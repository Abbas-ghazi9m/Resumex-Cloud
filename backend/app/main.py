import time
from collections import defaultdict
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine
from app.core.seed import seed_database
from app.api.auth_routes import router as auth_router
from app.api.resume_routes import router as resume_router
from app.api.job_routes import router as job_router
from app.api.analysis_routes import router as analysis_router
from app.api.report_routes import router as report_router
from app.api.recruiter_routes import router as recruiter_router
from app.api.cloud_routes import router as cloud_router
from app.api.health_routes import router as health_router

# Initialize database schemas
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield

app = FastAPI(
    title="Resumex-Cloud API",
    description="Cloud-Native AI Resume Intelligence & ATS Platform Engine",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lightweight rate limiter middleware (protects upload & analysis endpoints)
RATE_LIMIT_BUCKET = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Only rate limit mutation endpoints
    path = request.url.path
    if request.method in ["POST", "PUT"] and ("/resumes/upload" in path or "/analysis" in path):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        # Clean older than 60s
        RATE_LIMIT_BUCKET[client_ip] = [t for t in RATE_LIMIT_BUCKET[client_ip] if now - t < 60]
        if len(RATE_LIMIT_BUCKET[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Please wait a minute before submitting further analysis."}
            )
        RATE_LIMIT_BUCKET[client_ip].append(now)

    response = await call_next(request)
    # Add Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Include routers under /api prefix
app.include_router(health_router)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(resume_router, prefix=settings.API_V1_STR)
app.include_router(job_router, prefix=settings.API_V1_STR)
app.include_router(analysis_router, prefix=settings.API_V1_STR)
app.include_router(report_router, prefix=settings.API_V1_STR)
app.include_router(recruiter_router, prefix=settings.API_V1_STR)
app.include_router(cloud_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
