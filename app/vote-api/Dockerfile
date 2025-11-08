# Stage 1: Build - Install dependencies
FROM python:3.11-slim as builder

WORKDIR /app

# Set non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install build tools and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends gcc curl

# Create a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime - Create the final image
FROM python:3.11-slim

WORKDIR /app

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Set path to use venv
ENV PATH="/opt/venv/bin:$PATH"

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY main.py .

# Set non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

# Expose port and run the application
EXPOSE 80
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
