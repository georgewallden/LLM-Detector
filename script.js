// script.js

// --- 1. GET REFERENCES TO OUR HTML ELEMENTS ---
const textInput = document.getElementById('text-input');
const submitBtn = document.getElementById('submit-btn');
const resultContainer = document.getElementById('result-container');
const resultDisplay = document.getElementById('result-display');

// This is the URL where our FastAPI backend will be running.
// For local testing, it's localhost:8000.
const API_ENDPOINT = 'http://localhost:8000/predict';


// --- 2. DEFINE THE FUNCTION TO HANDLE FORM SUBMISSION ---
async function handleSubmit() {
    // Get the text from the textarea
    const textToAnalyze = textInput.value;

    // Basic validation
    if (!textToAnalyze.trim()) {
        alert('Please enter some text to analyze.');
        return;
    }

    // --- NEW: Add loading state to the UI ---
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing...';
    resultContainer.classList.add('hidden'); // Hide old results

    try {
        // --- NEW: The fetch() API call ---
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: textToAnalyze }), // Convert JS object to JSON string
        });

        // Check if the response was successful (e.g., not a 429 or 500 error)
        if (!response.ok) {
            // Try to get the error message from the API's response body
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        // Parse the JSON response from the API
        const prediction = await response.json();

        // Display the result we got from the API
        displayResult(prediction);

    } catch (error) {
        // --- NEW: Error handling ---
        console.error('Error during analysis:', error);
        // Display a user-friendly error message
        resultDisplay.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        resultContainer.classList.remove('hidden');

    } finally {
        // --- NEW: Reset the button regardless of success or failure ---
        submitBtn.disabled = false;
        submitBtn.textContent = 'Analyze Text';
    }
}


// --- 3. DEFINE A HELPER FUNCTION TO DISPLAY THE RESULT ---
function displayResult(prediction) {
    // Clear any previous results
    resultDisplay.innerHTML = '';

    // Create elements to display the label and score
    const labelEl = document.createElement('p');
    const scoreEl = document.createElement('p');

    const confidence = (prediction.score * 100).toFixed(2);

    labelEl.textContent = `Predicted Label: ${prediction.label}`;
    scoreEl.textContent = `Confidence: ${confidence}%`;

    // Add the new elements to the result display area
    resultDisplay.appendChild(labelEl);
    resultDisplay.appendChild(scoreEl);

    // Make the result container visible by removing the 'hidden' class
    resultContainer.classList.remove('hidden');
}


// --- 4. ATTACH THE EVENT LISTENER TO THE BUTTON ---
// This tells the browser to call our handleSubmit function whenever the button is clicked.
submitBtn.addEventListener('click', handleSubmit);