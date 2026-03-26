// Step 1: Fetch Free Financial Data
// Note: You will replace 'demo' with a free API key from Alpha Vantage
const API_KEY = 'ZN0GN6HHMFPNAOZI'; 
const API_URL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=GLD&apikey=${API_KEY}`;

async function fetchMarketData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        const price = data['Global Quote']['05. price'];
        document.getElementById('current-price').innerText = `$${parseFloat(price).toFixed(2)}`;
        return parseFloat(price);
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('current-price').innerText = "Error";
        return null;
    }
}

// Step 2: The Client-Side Neural Network
async function runPredictionEngine() {
    document.getElementById('prediction-output').innerText = "Training Model...";
    
    // 1. Get the latest data
    const currentPrice = await fetchMarketData();
    if (!currentPrice) return;

    // 2. Define a simple Sequential Model in TensorFlow.js
    const model = tf.sequential();
    model.add(tf.layers.dense({units: 1, inputShape: [1]}));
    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

    // 3. Mock Historical Training Data (Time, Price adjustments)
    // In a full build, you would fetch an array of the last 100 days of prices here.
    const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]); // Time steps
    const ys = tf.tensor2d([currentPrice - 3, currentPrice - 2, currentPrice - 1, currentPrice], [4, 1]); // Price trend

    // 4. Train the model quickly in the browser
    await model.fit(xs, ys, {epochs: 50});

    // 5. Predict the next time step (Day 5)
    const prediction = model.predict(tf.tensor2d([5], [1, 1]));
    const predictedValue = prediction.dataSync()[0];

    // Update the UI
    const outputElement = document.getElementById('prediction-output');
    outputElement.innerText = `$${predictedValue.toFixed(2)}`;
    
    if (predictedValue > currentPrice) {
        outputElement.style.color = "#00e676"; // Bullish (Green)
    } else {
        outputElement.style.color = "#ff5252"; // Bearish (Red)
    }
}

// Initialize data on load
window.onload = fetchMarketData;
