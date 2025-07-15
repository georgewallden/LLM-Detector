# main.py
from fastapi import FastAPI, Request, HTTPException, status
from pydantic import BaseModel
from transformers import pipeline
import torch

# Our custom manager classes
from watchdog import IdleWatchdog
from request_limiter import RequestLimiter

# --- 1. Create the App and Load the Model ---

# Create the FastAPI app instance. This is the main point of interaction.
app = FastAPI(title="LLM Detector API", version="1.0.0")

# Start up a timer that will close the container after not being used.
# Defaults to 900s (15 min)
watchdog = IdleWatchdog(timeout_seconds=900)
# watchdog = IdleWatchdog(timeout_seconds=15) <- test value
limiter = RequestLimiter(max_requests=5)



# --- 2. Pydantic Models for API Data Structure ---
class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    label: str
    score: float


# --- 3. Smart Middleware ---
@app.middleware("http")
async def smart_watchdog_middleware(request: Request, call_next):
    """
    Resets the idle timer, but ONLY IF the request limit has not been reached.
    This ensures the server will shut down even if a blocked user keeps sending requests.
    """
    if not limiter.is_limit_reached():
        watchdog.update_last_active_time()
    
    response = await call_next(request)
    return response

# --- 4. Model Loading on Startup ---
@app.on_event("startup")
def startup_event():
    """Load the model when the server starts."""
    global pipe
    device = 0 if torch.cuda.is_available() else -1
    model_id = "George-Wallden/llm-detector"
    print(f"--- Loading model '{model_id}' on device: {'cuda:0' if device == 0 else 'cpu'} ---")
    pipe = pipeline("text-classification", model=model_id, device=device)
    print("--- Model loaded successfully! ---")

# --- 5. API Endpoints ---
@app.get("/")
def root():
    """A simple root endpoint to confirm the server is running."""
    return {"message": "LLM Detector API is running!"}

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    Takes text and predicts if it's from a human or LLM.
    This endpoint is rate-limited.
    """
    # First, check if this request is allowed by the limiter.
    if not limiter.increment_and_check():
        # If not, raise an HTTP exception. FastAPI handles the rest.
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Request limit of {limiter.max_requests} reached. "
                   "This is a demo project. The server will shut down after a period of inactivity."
        )

    # If we are allowed, proceed with the prediction
    prediction = pipe(request.text)[0]
    label_map = {"LABEL_0": "Human", "LABEL_1": "LLM"}
    
    return {
        "label": label_map.get(prediction['label'], 'Unknown'),
        "score": prediction['score']
    }