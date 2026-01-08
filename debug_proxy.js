const https = require('https');

const symbol = 'ASTERUSDT';
// Add timestamp to prevent caching
const targetUrl = `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}&_t=${Date.now()}`;
const encodedUrl = encodeURIComponent(targetUrl);

const proxies = [
    { name: 'CodeTabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}` },
    { name: 'AllOrigins', url: `https://api.allorigins.win/get?url=${encodedUrl}` }
];

const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        // 10s timeout
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
};

(async () => {
    console.log(`Debug Script: Testing proxies for ${symbol}...`);

    for (const proxy of proxies) {
        console.log(`\n================================`);
        console.log(`Testing: ${proxy.name}`);
        console.log(`URL: ${proxy.url}`);

        try {
            const start = Date.now();
            const result = await fetchUrl(proxy.url);
            const latency = Date.now() - start;

            console.log(`Latency: ${latency}ms`);
            console.log(`Status: ${result.status}`);
            console.log(`Body Sample (First 200 chars): ${result.body.substring(0, 200)}`);

            let json = null;
            try {
                json = JSON.parse(result.body);
            } catch (e) {
                console.log('❌ Failed to parse JSON');
            }

            if (json) {
                if (proxy.name === 'AllOrigins') {
                    if (json.contents) {
                        try {
                            const innerData = typeof json.contents === 'string' ? JSON.parse(json.contents) : json.contents;
                            console.log('✅ AllOrigins Inner Data:', innerData);
                        } catch (e) {
                            console.log('❌ AllOrigins contents is not JSON:', json.contents);
                        }
                    } else {
                        console.log('⚠️ AllOrigins: No contents field');
                    }
                } else {
                    console.log('✅ Response:', json);
                }
            }

        } catch (e) {
            console.error('❌ Fetch Error:', e.message);
        }
    }
})();
