# Aegis Prime TEE Risk Engine
# Dockerfile for iExec SGX-compatible application

FROM iexechub/python-sgx:1.0.0

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./

# Create output directory
RUN mkdir -p /iexec_out

# Set environment variables for iExec
ENV IEXEC_IN=/iexec_in
ENV IEXEC_OUT=/iexec_out

# Run the application
ENTRYPOINT ["python", "app.py"]
