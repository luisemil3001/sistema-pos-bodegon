const axios = require('axios');

async function verify() {
    try {
        console.log('Verificando API de ajustes...');
        const res = await axios.get('http://localhost:5000/api/settings');
        console.log('Datos recibidos:', JSON.stringify(res.data, null, 2));
        
        if (res.data.tipo_impresora === 'pos' || res.data.tipo_impresora === 'fiscal') {
            console.log('VERIFICACIÓN EXITOSA: El campo tipo_impresora existe y tiene un valor válido.');
        } else {
            console.log('VERIFICACIÓN FALLIDA: El campo tipo_impresora no es el esperado.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error al conectar con la API:', err.message);
        console.log('Asegúrate de que el servidor backend esté corriendo en el puerto 5000.');
        process.exit(1);
    }
}

verify();
