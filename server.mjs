import { unsealEventsResponse, DecryptionAlgorithm } from "@fingerprintjs/fingerprintjs-pro-server-api";

const BASE64_KEY = 'E5riDOQB9Bb6ZssD8NwsbniC9laRlqB4TAtQlcign4I=';

// const AccessControlAllowOrigin = 'ozzy.school';

export async function fingerprint_backend(sealedData) {
    const decryptionKey = BASE64_KEY;

    if (!sealedData || !decryptionKey) {
        console.error('Please set BASE64_KEY and BASE64_SEALED_RESULT environment variables');
    }

    try {
        const unsealedData = await unsealEventsResponse(Buffer.from(sealedData, 'base64'), [{
            key: Buffer.from(decryptionKey, 'base64'),
            algorithm: DecryptionAlgorithm.Aes256Gcm,
        },]);

        return unsealedData;

    } catch (e) {
        console.error(e);
    }
}

// server -------
import http from 'http';

const PORT = process.env.PORT || 3000;

// Helper to send JSON responses with CORS headers
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Handler for /fingerprint POST requests
function handleFingerprint(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk;
    });

    req.on('end', async () => {
        try {
            const data = JSON.parse(body);

            // Validate the required fields
            if (!data || !data.sealedResult) {
                sendJson(res, 400, { status: 'error', message: 'Missing required fields' });
                return;
            }

            try {
                const unsealedData = await fingerprint_backend(data.sealedResult);

                if (unsealedData) {
                    data['unsealedData'] = unsealedData;
                } else {
                    sendJson(res, 500, { status: 'error', message: 'Failed to unseal data' });
                    return;
                }
            } catch (error) {
                console.error('Error unsealing data:', err);
                sendJson(res, 500, { status: 'error', message: 'Internal server error' });
                return;
            }

            sendJson(res, 200, { status: 'success', received: data });
        } catch (err) {
            sendJson(res, 400, { status: 'error', message: 'Invalid JSON' });
        }
    });
}

// Main server logic
const server = http.createServer((req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS' && req.url === '/fingerprint') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/fingerprint') {
        handleFingerprint(req, res);
    } else {
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        res.end('Hello from Node.js server!\n');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});