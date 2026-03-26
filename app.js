let aiModel;

async function initAI() {
    aiModel = tf.sequential();
    aiModel.add(tf.layers.dense({units: 8, inputShape: [2], activation: 'relu'}));
    aiModel.add(tf.layers.dense({units: 1}));
    aiModel.compile({loss: 'meanSquaredError', optimizer: tf.train.adam(0.01)});
}

// Fetch the statically generated file from our GitHub Action
async function fetchMarketData() {
    try {
        // Cache-busting parameter to ensure we get the latest file
        const response = await fetch(`market-data.json?v=${new Date().getTime()}`);
        return await response.json();
    } catch (e) {
        console.error("Failed to load local data. Is the GitHub Action running?", e);
        return null;
    }
}

async function runPredictionEngine() {
    const output = document.getElementById('prediction-output');
    output.innerText = "Running AI Core...";

    const data = await fetchMarketData();
    if (!data) {
        output.innerText = "Awaiting initial data pipeline run...";
        return;
    }

    const price = data.price;
    const sentiment = data.sentiment;

    document.getElementById('current-price').innerText = `$${price.toLocaleString()}`;

    // Train the AI on established parameters
    const xs = tf.tensor2d([[price, 0], [price, 10], [price, -10]]);
    const ys = tf.tensor2d([[price + 0.5], [price + 12.0], [price - 8.0]]);

    await aiModel.fit(xs, ys, {epochs: 20});

    // Predict
    const live_input = tf.tensor2d([[price, sentiment]]);
    const prediction = aiModel.predict(live_input);
    const predictedValue = prediction.dataSync()[0];

    const change = predictedValue - price;
    
    if (Math.abs(change) < 0.20) {
        output.innerText = `STABLE ($${predictedValue.toFixed(2)})`;
        output.style.color = "#ffd700"; 
    } else if (change > 0) {
        output.innerText = `BULLISH (+$${change.toFixed(2)})`;
        output.style.color = "#00e676";
    } else {
        output.innerText = `BEARISH (-$${Math.abs(change).toFixed(2)})`;
        output.style.color = "#ff5252";
    }
}

window.onload = async () => {
    await initAI();
    runPredictionEngine();
};
