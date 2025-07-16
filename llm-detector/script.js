// llm-detector/script.js

// --- 1. GET REFERENCES --- ///
const detectorUI = document.getElementById('detector-ui');
const serverAsleepUI = document.getElementById('server-asleep-ui');
const wakeupBtn = document.getElementById('wakeup-btn');
const textInput = document.getElementById('text-input');
const submitBtn = document.getElementById('submit-btn');
const resultContainer = document.getElementById('result-container');
const resultDisplay = document.getElementById('result-display');
const corgiImage = document.getElementById('corgi-img');

// --- 2. CONFIGURATION ---
// These constants are now provided by 'config.js', which is loaded before this script.
// We just define the corgi photos here.
const corgiPhotos = ['corgi-photos/corgi_couch.jpeg', 'corgi-photos/corgi_grass.jpeg'];

// --- 3. UI HELPERS ---
function setRandomCorgi() {
    const randomIndex = Math.floor(Math.random() * corgiPhotos.length);
    corgiImage.src = corgiPhotos[randomIndex];
}

function showAsleepUI() {
    setRandomCorgi();
    detectorUI.classList.add('hidden');
    serverAsleepUI.classList.remove('hidden');
}

function showAwakeUI() {
    serverAsleepUI.classList.add('hidden');
    detectorUI.classList.remove('hidden');
}

// --- 4. CORE LOGIC ---

// NEW: This function now pings the permanent ALB address.
async function isServerAwake() {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000); // 5-second timeout

        const response = await fetch(`${API_BASE_URL}/`, { method: 'GET', signal: controller.signal });

        // The ALB returns 503 if the service is starting but not yet healthy.
        // This is a good sign that things are in progress!
        if (response.status === 503) {
            console.log("Server is starting (ALB returned 503)... still waiting.");
            return false;
        }

        // For any other successful response, we consider the server awake.
        return response.ok;
    } catch (error) {
        // This will catch network errors (e.g., DNS not found yet) or timeouts.
        console.log("Server ping failed:", error.name);
        return false;
    }
}

// NEW: This function is now much simpler. It just sends the signal and starts polling.
async function handleWakeUp() {
    wakeupBtn.disabled = true;
    wakeupBtn.textContent = 'Sending wake-up signal...';

    try {
        // Use the constant from config.js
        const response = await fetch(WAKEUP_LAMBDA_URL, { method: 'POST' });
        if (!response.ok) throw new Error(`Wake-up call failed with status: ${response.status}`);
        
        console.log("Wake up signal sent successfully!");
        
        // No more prompt! We know the address. Immediately start polling.
        pollServerStatus();

    } catch (error) {
        console.error('Error during wake-up:', error);
        wakeupBtn.textContent = 'Error! Please refresh and try again.';
    }
}

// NEW: This function no longer depends on user input.
function pollServerStatus() {
    wakeupBtn.textContent = 'Waiting for server to respond...';
    
    const intervalId = setInterval(async () => {
        if (await isServerAwake()) {
            clearInterval(intervalId);
            console.log("Server is awake!");
            showAwakeUI();
        } else {
            // isServerAwake() already provides detailed logs
            console.log("Polling again in 15s.");
        }
    }, 15000); // Poll every 15 seconds
}

// NEW: This function now uses the permanent API_BASE_URL constant.
async function handleSubmit() {
    const textToAnalyze = textInput.value;
    if (!textToAnalyze.trim()) {
        alert('Please enter some text to analyze.');
        return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing...';
    resultContainer.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToAnalyze })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const prediction = await response.json();
        displayResult(prediction);

    } catch (error) {
        console.error('Error during analysis:', error);
        resultDisplay.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        resultContainer.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Analyze Text';
    }
}

function displayResult(prediction) {
    // This function remains exactly the same
    resultDisplay.innerHTML = '';
    const labelEl = document.createElement('p');
    const scoreEl = document.createElement('p');
    const confidence = (prediction.score * 100).toFixed(2);

    labelEl.textContent = `Predicted Label: ${prediction.label}`;
    scoreEl.textContent = `Confidence: ${confidence}%`;

    resultDisplay.appendChild(labelEl);
    resultDisplay.appendChild(scoreEl);
    resultContainer.classList.remove('hidden');
}

// --- 5. INITIALIZATION ---
function initializeApp() {
    showAsleepUI();
}

wakeupBtn.addEventListener('click', handleWakeUp);
submitBtn.addEventListener('click', handleSubmit);

initializeApp();