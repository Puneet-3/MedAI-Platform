# Keeps the docker image size small and optimized.
FROM python:3.11-slim

# Sets the working directory inside the container
WORKDIR /code

# Installs build-essential (needed to compile some python dependencies if necessary)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install python packages
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# Copy all our local files to the container's working directory
COPY . /code

# --- GENERATE MODELS DURING BUILD ---
# This runs the training scripts so the models are compiled and ready inside the container!
RUN python train.py && python train_chatbot.py && python train_cnn.py

# Set up permissions for Hugging Face/Render running environment
RUN useradd -m -u 1000 user && chown -R user:user /code
USER user

# Start the FastAPI server on port 7860 (Hugging Face / Render default port)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
