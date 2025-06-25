import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import bodyParser from 'body-parser';
const { json } = bodyParser;

import { unsealEventsResponse, DecryptionAlgorithm } from '@fingerprintjs/fingerprintjs-pro-server-api';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json()); // parse JSON body

// Unseal helper
async function fingerprint_backend(sealedData) {
    if (!process.env.BASE64_KEY) {
        console.error('BASE64_KEY environment variable is not set');
        return null;
    }

    const decryptionKey = process.env.BASE64_KEY;

    if (!sealedData || !decryptionKey) {
        console.error('Missing sealedData or decryptionKey');
        return null;
    }

    try {
        const unsealedData = await unsealEventsResponse(
            Buffer.from(sealedData, 'base64'),
            [{
                key: Buffer.from(decryptionKey, 'base64'),
                algorithm: DecryptionAlgorithm.Aes256Gcm
            }]
        );
        return unsealedData;
    } catch (error) {
        console.error('Unseal error:', error);
        return null;
    }
}

// Route to handle fingerprint
app.post('/fingerprint', async (req, res) => {
    const { sealedResult } = req.body;

    if (!sealedResult) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required fields'
        });
    }

    try {
        const unsealedData = await fingerprint_backend(sealedResult);

        if (!unsealedData) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to unseal data'
            });
        }

        return res.status(200).json({
            status: 'success',
            received: {
                sealedResult,
                unsealedData
            }
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// Fallback route
app.get('/', (_req, res) => {
    res.send('Hello from Express.js server!\n');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});