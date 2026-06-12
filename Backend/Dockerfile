FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install OS-level dependencies required by torch, matplotlib, language_tool_python
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgomp1 \
    default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (layer caching)
COPY requirements.txt .

# Install Python dependencies (no cache to keep image size minimal)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Start server — reads PORT from environment (Railway/Render inject this)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
