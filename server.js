const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { url } = req;
        const urlParts = url.split('?');
        const path = urlParts[0].replace('/api/server', '');
        const query = urlParts[1];
        
        if (!query) {
            return res.status(400).json({ error: 'Missing query parameters' });
        }
        
        // Direct API call without third-party proxy
        const targetUrl = `https://www.googleapis.com/youtube/v3${path}?${query}`;
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
        };
        
        console.log('Fetching:', targetUrl);
        
        const response = await fetch(targetUrl, { 
            headers,
            timeout: 30000
        });
        
        const text = await response.text();
        
        // Check if response is JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Non-JSON response:', text.substring(0, 200));
            return res.status(500).json({ 
                error: 'Invalid API response',
                details: 'The YouTube API returned non-JSON data. Please use your own YouTube API key.'
            });
        }
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.json(data);
        
    } catch (error) {
        console.error('API Request failed:', error.message);
        res.status(500).json({ 
            error: 'Service temporarily unavailable',
            message: 'The third-party API is not accessible. Please use your own YouTube Data API key.',
            code: 'PROXY_ERROR'
        });
    }
};
