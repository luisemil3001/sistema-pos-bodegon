const https = require('https');

/**
 * Servicio para obtener la tasa oficial del Banco Central de Venezuela
 */
const getBcvRate = () => {
    return new Promise((resolve) => {
        console.log('Obteniendo tasa oficial desde BCV (HTTPS)...');
        
        const options = {
            hostname: 'www.bcv.org.ve',
            port: 443,
            path: '/',
            method: 'GET',
            rejectUnauthorized: false, // Ignorar errores de certificado (BCV suele tenerlos)
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000
        };

        const req = https.get(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    // Regex para buscar el contenedor del dólar y su valor en el strong
                    const dolarRegex = /<div [^>]*id="dolar"[^>]*>[\s\S]*?<strong>\s*([\d,.]+)\s*<\/strong>/i;
                    const match = data.match(dolarRegex);

                    if (match && match[1]) {
                        const rawValue = match[1].trim().replace(',', '.');
                        const rate = parseFloat(rawValue);
                        
                        if (!isNaN(rate)) {
                            console.log(`Tasa BCV obtenida exitosamente: ${rate}`);
                            return resolve(rate);
                        }
                    }
                    console.error('No se pudo encontrar la tasa en el HTML del BCV');
                    resolve(null);
                } catch (e) {
                    console.error('Error al procesar HTML del BCV:', e.message);
                    resolve(null);
                }
            });
        });

        req.on('error', (err) => {
            console.error('Error de conexión con BCV:', err.message);
            resolve(null);
        });

        req.on('timeout', () => {
            req.destroy();
            console.error('Timeout al conectar con BCV');
            resolve(null);
        });
    });
};

module.exports = { getBcvRate };
