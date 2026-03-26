// --- CONFIGURATION ---
const GOLD_API_KEY = '6d5182dc3f0442efa625221f3c350233'; // Get at twelvedata.com
const NEWS_API_KEY = 'cdd1b7b064eef56e8369f619696196c6';      // Get at gnews.io

// --- SMART CACHING LOGIC ---
function getCachedPrice() {
    const cached = localStorage.getItem('gold_price');
    const time = localStorage.getItem('gold_price_time');
    if (cached && (Date.now() - time < 60000)) return parseFloat(cached);
    return null;
}

// --- FETCH GOLD PRICE (XAU/USD) ---
async function fetchGoldPrice() {
    const cachedPrice = getCachedPrice();
    if (cachedPrice) {
        document.getElementById('current-price').innerText = `$${cachedPrice.toLocaleString()}`;
        return cachedPrice;
    }

    const url = `https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${GOLD_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 429) {
            document.getElementById('current-price').innerText = "Cooldown...";
            return null;
        }

        const price = parseFloat(data.price);
        // Save to cache
        localStorage.setItem('gold_price', price);
        localStorage.setItem('gold_price_time', Date.now());
        
        document.getElementById('current-price').innerText = `$${price.toLocaleString()}`;
        return price;
    } catch (error) {
        document.getElementById('current-price').innerText = "Offline";
        return null;
    }
}

// --- FETCH POLITICAL NEWS & SENTIMENT ---
async function getPoliticalSentiment() {
    // We target "War", "Central Banks", and "Inflation" - the 3 things that move Gold
    const url = `https://gnews.io/api/v4/search?q="geopolitics" OR "inflation" OR "central bank"&lang=en&apikey=${NEWS_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        let score = 0;

        const bullish = ['war', 'conflict', 'crisis', 'inflation', 'recession', 'debt', 'sanctions'];
        const bearish = ['growth', 'recovery', 'stable', 'peace', 'deal', 'strong dollar'];

        data.articles.forEach(article => {
            const content = (article.title + article.description).toLowerCase();
            bullish.forEach(w => { if(content.includes(w)) score += 2; });
            bearish.forEach(w => { if(content.includes(w)) score -= 2; });
        });
        return score;
    } catch (e) { return 0; }
}

// --- THE AI PREDICTION BRAIN ---
// --- GLOBAL AI BRAIN ---
let aiModel;

// 1. INITIALIZE THE BRAIN ONCE
async function initAI() {
    aiModel = tf.sequential();
    aiModel.add(tf.layers.dense({units: 8, inputShape: [2], activation: 'relu'}));
    aiModel.add(tf.layers.dense({units: 1}));
    aiModel.compile({loss: 'meanSquaredError', optimizer: tf.train.adam(0.01)});
    console.log("AI Brain Initialized");
}

// 2. STABILIZED PREDICTION LOGIC
async function runPredictionEngine() {
    const output = document.getElementById('prediction-output');
    output.innerText = "Analyzing Market...";

    const price = await fetchGoldPrice();
    if (!price) return;

    const sentiment = await getPoliticalSentiment();

    // Instead of random training, we use a "Pattern-Based" weight
    // This ensures the AI understands: High Sentiment = Upward Pressure
    const xs = tf.tensor2d([
        [price, 0],    // Neutral
        [price, 10],   // High Crisis
        [price, -10]   // High Stability
    ]);
    
    // We define a logical "Future" for the AI to learn from
    const ys = tf.tensor2d([
        [price + 0.5],    // Neutral: Slight natural growth
        [price + 12.0],   // Crisis: Gold jumps
        [price - 8.0]     // Stability: Gold drops
    ]);

    // Train the existing brain (This makes it smarter over time instead of resetting)
    await aiModel.fit(xs, ys, {epochs: 20});

    // Run the prediction
    const live_input = tf.tensor2d([[price, sentiment]]);
    const prediction = aiModel.predict(live_input);
    const predictedValue = prediction.dataSync()[0];

    // --- DISPLAY LOGIC ---
    const change = predictedValue - price;
    
    // We add a "Confidence" check: if the change is tiny, we call it "STABLE"
    if (Math.abs(change) < 0.20) {
        output.innerText = `STABLE ($${predictedValue.toFixed(2)})`;
        output.style.color = "#ffd700"; // Gold color
    } else if (change > 0) {
        output.innerText = `BULLISH (+$${change.toFixed(2)})`;
        output.style.color = "#00e676";
    } else {
        output.innerText = `BEARISH (-$${Math.abs(change).toFixed(2)})`;
        output.style.color = "#ff5252";
    }
}

// Initialize everything when the window loads
window.onload = async () => {
    await initAI();
    fetchGoldPrice();
}
    // Neural Network Architecture
    const model = tf.sequential();
    model.add(tf.layers.dense({units: 16, inputShape: [2], activation: 'relu'}));
    model.add(tf.layers.dense({units: 1}));
    model.compile({loss: 'meanSquaredError', optimizer: 'adam'});

    // Training Data: The AI learns that High Sentiment (Crisis) = Higher Gold Price
    const training_in = tf.tensor2d([[price, 0], [price, 10], [price, -10]]);
    const training_out = tf.tensor2d([[price], [price + 15], [price - 15]]);

    await model.fit(training_in, training_out, {epochs: 100});

    const live_input = tf.tensor2d([[price, sentiment]]);
    const prediction = model.predict(live_input);
    const result = prediction.dataSync()[0];

    // UI Output
    const diff = result - price;
    output.innerText = diff > 0 ? `BULLISH (+$${diff.toFixed(2)})` : `BEARISH (-$${Math.abs(diff).toFixed(2)})`;
    output.style.color = diff > 0 ? "#00e676" : "#ff5252";
}

window.onload = fetchGoldPrice;
