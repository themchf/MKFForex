// --- CONFIGURATION ---
// 1. Get your FREE Key at: https://www.alphavantage.co/support/#api-key
const GOLD_API_KEY = 'ZN0GN6HHMFPNAOZI'; 

// 2. Get your FREE Key at: https://gnews.io/ (Allows GitHub Pages)
const NEWS_API_KEY = '739dc21c92bf475f8e590d305024929d'; 

// --- FETCH GOLD PRICE (XAU/USD) ---
async function fetchGoldPrice() {
    // We use CURRENCY_EXCHANGE_RATE because it's the professional way to get spot Gold
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${GOLD_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Handle Alpha Vantage Rate Limits
        if (data["Note"]) {
            alert("API Limit Reached (25/day). Please wait a minute or use a new key.");
            return null;
        }

        const price = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
        document.getElementById('current-price').innerText = `$${parseFloat(price).toLocaleString()}`;
        return parseFloat(price);
    } catch (error) {
        console.error("Gold Fetch Error:", error);
        document.getElementById('current-price').innerText = "Limit Reached";
        return null;
    }
}

// --- FETCH POLITICAL NEWS & SENTIMENT ---
async function getPoliticalSentiment() {
    const url = `https://gnews.io/api/v4/search?q="gold price" OR "geopolitics"&lang=en&apikey=${NEWS_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.articles) return 0;

        let score = 0;
        // Keywords that usually make Gold (Safe Haven) go UP
        const bullish = ['war', 'inflation', 'crisis', 'conflict', 'uncertainty', 'rates cut', 'debt'];
        const bearish = ['recovery', 'stability', 'growth', 'rates hike', 'peace'];

        data.articles.forEach(article => {
            const text = (article.title + article.description).toLowerCase();
            bullish.forEach(word => { if(text.includes(word)) score += 1.5; });
            bearish.forEach(word => { if(text.includes(word)) score -= 1.5; });
        });

        return score;
    } catch (e) {
        return 0;
    }
}

// --- THE PREDICTION BRAIN ---
async function runPredictionEngine() {
    const output = document.getElementById('prediction-output');
    output.innerText = "Analyzing Geopolitics...";

    const price = await fetchGoldPrice();
    if (!price) return;

    const sentiment = await getPoliticalSentiment();

    // Create a Brain (TensorFlow.js)
    const model = tf.sequential();
    model.add(tf.layers.dense({units: 12, inputShape: [2], activation: 'relu'}));
    model.add(tf.layers.dense({units: 1}));
    model.compile({loss: 'meanSquaredError', optimizer: 'adam'});

    // Teach it: If Sentiment is High, Price usually goes High
    const training_in = tf.tensor2d([[price, 0], [price, 5], [price, -5]]);
    const training_out = tf.tensor2d([[price], [price + 10], [price - 10]]);

    await model.fit(training_in, training_out, {epochs: 150});

    // Run the live prediction
    const live_input = tf.tensor2d([[price, sentiment]]);
    const prediction = model.predict(live_input);
    const finalResult = prediction.dataSync()[0];

    // Update UI
    const change = finalResult - price;
    output.innerText = change > 0 ? `BULLISH (+$${change.toFixed(2)})` : `BEARISH (-$${Math.abs(change).toFixed(2)})`;
    output.style.color = change > 0 ? "#00e676" : "#ff5252";
}

// Start price on load
window.onload = fetchGoldPrice;
