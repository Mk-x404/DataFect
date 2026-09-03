FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PORT=8000
ENV ENVIRONMENT=production
ENV ALLOW_DEMO_MODE=true
ENV ALLOWED_ORIGINS="https://frontend-vert-ten-27.vercel.app,https://frontend-mk-x404s-projects.vercel.app"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
