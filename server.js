// Telegram Forward Proxy - 100% Compatible
// Works on Render.com

const http = require("http");
const https = require("https");
const net = require("net");
const url = require("url");

const TELEGRAM_HOST = "api.telegram.org";

console.log("🚀 Telegram Proxy Started");

// =====================
// 1) CONNECT Tunnel (TLS/HTTPS)
// =====================
const server = http.createServer((clientReq, clientRes) => {
    const parsedUrl = url.parse(clientReq.url);

    // فقط درخواست‌هایی که مربوط به تلگرام نیستند
    if (parsedUrl.hostname !== TELEGRAM_HOST) {
        clientRes.writeHead(400);
        clientRes.end("Invalid proxy target.");
        return;
    }

    const options = {
        hostname: TELEGRAM_HOST,
        port: 443,
        path: parsedUrl.path,
        method: clientReq.method,
        headers: clientReq.headers
    };

    const proxyReq = https.request(options, (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on("error", () => {
        clientRes.writeHead(500);
        clientRes.end("Proxy Request Failed");
    });

    clientReq.pipe(proxyReq, { end: true });
});

// =====================
// 2) HTTPS CONNECT Tunnel Handler
// =====================
server.on("connect", (req, clientSocket, head) => {
    const serverUrl = req.url.split(":");

    if (serverUrl[0] !== TELEGRAM_HOST) {
        clientSocket.end("HTTP/1.1 400 Bad Request\r\n");
        return;
    }

    const serverSocket = net.connect(443, TELEGRAM_HOST, () => {
        clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });

    serverSocket.on("error", () => {
        clientSocket.end("HTTP/1.1 500 Connection Error\r\n");
    });
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Telegram Proxy is Running on Port ${PORT}`);
});
