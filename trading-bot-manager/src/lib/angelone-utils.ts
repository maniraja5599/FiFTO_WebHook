/**
 * Simple Base32 decoder for TOTP secrets
 */
function base32ToUint8Array(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = base32.replace(/=+$/, '').toUpperCase();
    const bits: string = Array.from(clean)
        .map(char => {
            const val = alphabet.indexOf(char);
            if (val === -1) throw new Error('Invalid Base32 character');
            return val.toString(2).padStart(5, '0');
        })
        .join('');

    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }
    return bytes;
}

/**
 * Hex string decoder for UUID-format secrets
 */
function hexToUint8Array(hex: string): Uint8Array {
    const clean = hex.replace(/-/g, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
}

/**
 * Detect secret format and decode accordingly
 */
function decodeSecret(secret: string): Uint8Array {
    // UUID/hex format: contains dashes or only hex chars
    const stripped = secret.replace(/-/g, '');
    if (/^[0-9a-fA-F]+$/.test(stripped) && stripped.length >= 16) {
        return hexToUint8Array(secret);
    }
    // Otherwise treat as Base32
    return base32ToUint8Array(secret);
}

/**
 * Native TOTP implementation using Web Crypto API
 * Supports both Base32 and hex/UUID-format secrets
 */
export async function generateTOTP(secret: string): Promise<string> {
    const keyBytes = decodeSecret(secret);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes.buffer as ArrayBuffer,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30);

    // Convert time to 8-byte big-endian
    const msg = new Uint8Array(8);
    let t = timeStep;
    for (let i = 7; i >= 0; i--) {
        msg[i] = t & 0xff;
        t = Math.floor(t / 256);
    }

    // Ensure we pass a clean ArrayBuffer to sign
    const msgBuffer = msg.buffer.slice(0);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBuffer);
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0xf;

    const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, '0');
}

/**
 * Minimal Angel One SmartAPI Client
 */
export class AngelOneClient {
    private static BASE_URL = 'https://apiconnect.angelone.in';
    private static MSL_URL = 'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';

    constructor(
        private apiKey: string,
        private clientCode: string,
        private password: string,
        private totpSecret: string
    ) { }

    async login() {
        const totp = await generateTOTP(this.totpSecret);
        const response = await fetch(`${AngelOneClient.BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-UserType': 'USER',
                'X-SourceID': 'WEB',
                'X-ClientLocalIP': '127.0.0.1',
                'X-ClientPublicIP': '127.0.0.1',
                'X-MACAddress': '00-00-00-00-00-00',
                'X-PrivateKey': this.apiKey
            },
            body: JSON.stringify({
                clientcode: this.clientCode,
                password: this.password,
                totp: totp
            })
        });

        const data = await response.json();
        if (!data.status) throw new Error(data.message || 'Login failed');
        return data.data; // Includes jwtToken, refreshToken, feedToken
    }

    async getMasterSymbols() {
        const response = await fetch(AngelOneClient.MSL_URL);
        if (!response.ok) throw new Error('Failed to fetch instrument list');
        return await response.json();
    }

    async getLTP(jwtToken: string, symbol: string, token: string, exchange: string = 'NFO') {
        const response = await fetch(`${AngelOneClient.BASE_URL}/rest/secure/angelbroking/market/v1/quote/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-UserType': 'USER',
                'X-SourceID': 'WEB',
                'X-PrivateKey': this.apiKey,
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({
                mode: 'FULL',
                exchangeTokens: {
                    [exchange]: [token]
                }
            })
        });

        const data = await response.json();
        if (!data.status) throw new Error(data.message || 'LTP fetch failed');
        return data.data;
    }
}
