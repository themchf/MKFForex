const fs = require('fs');

// These pull from your secure GitHub Secrets
const GOLD_KEY = process.env.GOLD_API_KEY;
const NEWS_KEY = process.env.NEWS_API_KEY;

async function runDataPipeline() {
    try {
        console.log("Starting data pipeline...");

        // 1. Fetch Gold Price (Twelve Data)
        const goldRes = await fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${GOLD_KEY}`);
        const goldData = await goldRes.json();
        
        if (!goldData.price) throw new Error("API Limit hit or invalid key.");
        const price = parseFloat(goldData.price);

        // 2. Fetch News Sentiment (GNews)
        const newsRes = await fetch(`https://gnews.io/api/v4/search?q="geopolitics" OR "inflation" OR "central bank"&lang=en&apikey=${NEWS_KEY}`);
        const newsData = await newsRes.json();
        
        let sentiment = 0;
        const bullish = ['war', 'conflict', 'crisis', 'inflation', 'recession', 'debt', 'sanctions'];
        const bearish = ['growth', 'recovery', 'stable', 'peace', 'deal', 'strong dollar'];

        if (newsData.articles) {
            newsData.articles.forEach(article => {
                const content = (article.title + article.description).toLowerCase();
                bullish.forEach(w => { if(content.includes(w)) sentiment += 2; });
                bearish.forEach(w => { if(content.includes(w)) sentiment -= 2; });
            });
        }

        // 3. Save to a static file
        const output = {
            price: price,
            sentiment: sentiment,
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync('market-data.json', JSON.stringify(output, null, 2));
        console.log("Successfully wrote market-data.json:", output);

    } catch (error) {
        console.error("Pipeline Failed:", error.message);
        // We do not crash; we leave the old market-data.json in place so the site stays online!
    }
}

runDataPipeline();
