# Dockerfile

# --- Stage 1: Base Image ---
FROM python:3.11-slim

# --- Stage 2: Setup Environment ---
WORKDIR /app

# --- Stage 3: Grab Dependencies ---
COPY requirements.txt .

# Now, install the dependencies from the requirements file.
RUN pip install --no-cache-dir -r requirements.txt

# --- Stage 4: Copy Application Code ---
COPY . .

# --- Stage 5: Expose Port and Define Run Command ---
EXPOSE 8000

# run initial startup
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]