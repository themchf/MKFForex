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
async function runPredictionEngine() {
    const output = document.getElementById('prediction-output');
    output.innerText = "Analyzing Geopolitics...";

    const price = await fetchGoldPrice();
    if (!price) return;

    const sentiment = await getPoliticalSentiment();

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
