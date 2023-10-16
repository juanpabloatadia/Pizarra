// Requiere los módulos necesarios
const express = require('express'); // Framework web Express
const http = require('http'); // Módulo HTTP de Node.js
const WebSocket = require('ws'); // Módulo WebSocket

// Crea una instancia de la aplicación Express
const app = express();

// Crea un servidor HTTP utilizando la aplicación Express
const server = http.createServer(app);

// Crea un servidor WebSocket utilizando el servidor HTTP
const wss = new WebSocket.Server({ server });

// Define una ruta para servir un archivo HTML en la raíz del servidor
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Crea un conjunto (Set) para almacenar clientes WebSocket conectados
const clients = new Set();

// Crea un objeto para almacenar los datos de dibujo compartidos
let sharedDrawingData = {};

// Escucha eventos de conexión en el servidor WebSocket
wss.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado');

    // Agrega el cliente actual al conjunto de clientes
    clients.add(ws);

    // Envía los datos de dibujo actuales a un nuevo cliente al unirse.
    if (Object.keys(sharedDrawingData).length > 0) {
        ws.send(JSON.stringify(sharedDrawingData));
    }

    // Escucha eventos de mensaje del cliente WebSocket
    ws.on('message', (message) => {
        console.log(`Mensaje recibido del navegador: ${message}`);

        // Maneja el mensaje recibido del cliente
        if (message === 'clear') {
            // Si se recibe un mensaje 'clear', envía ese mensaje a todos los clientes
            clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send('clear');
                }
            });

            // Borra los datos de dibujo compartidos
            sharedDrawingData = {};

            return; // No es necesario continuar procesando el mensaje
        }

        // Intenta analizar el mensaje como datos de dibujo (asumiendo que los datos son JSON)
        try {
            const drawingData = JSON.parse(message);
            console.log('Datos de dibujo recibidos:', drawingData);

            // Actualiza los datos de dibujo compartidos
            sharedDrawingData = drawingData;

            // Reenvía el mensaje a todos los clientes (excepto al remitente)
            clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(drawingData));
                    console.log('Datos de dibujo reenviados a otro cliente');
                }
            });
        } catch (error) {
            console.error('Error al analizar el mensaje JSON:', error);
        }
    });

    // Escucha eventos de cierre de conexión
    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
        clients.delete(ws);
    });
});

// Define el puerto en el que se ejecutará el servidor, usando el puerto proporcionado por el entorno o 3001 como valor predeterminado
const PORT = process.env.PORT || 3001;

// Inicia el servidor HTTP para escuchar en el puerto definido
server.listen(PORT, () => {
    console.log(`Servidor Node.js escuchando en el puerto ${PORT}`);
});