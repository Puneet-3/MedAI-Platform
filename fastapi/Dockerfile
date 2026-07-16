# Keeps the docker image size small and optimized.
FROM python:3.11-slim

#  Sets the working directory inside the container
WORKDIR /code

# Installs build-essential (needed to compile some python dependencies if necessary)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install python packages
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# 5. Copy all our local files to the container's working directory
COPY . /code

# 6. Set up permissions for Hugging Face Spaces (runs as User ID 1000)
# This allows our app to write to files (like retraining models and saving intents)
RUN useradd -m -u 1000 user && chown -R user:user /code
USER user

# 7. Start the FastAPI server on port 7860 (Hugging Face default port)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
