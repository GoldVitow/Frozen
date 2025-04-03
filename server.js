const express = require('express');
const fs = require('fs');
const WebSocket = require('ws');
const app = express();
const PORT = 3000;

const DATA_FILE = 'data.json';
const INCREMENT_DAYS = 5; // Интервал в днях

// Инициализация данных
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        frozen: 0,
        lastIncrement: new Date().toISOString()
    }));
}

app.use(express.static('public'));

// Создаем обычный HTTP-сервер (HTTPS обрабатывается Render автоматически)
const server = app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

// WebSocket сервер должен использовать тот же HTTPS-сервер
const wss = new WebSocket.Server({ server });

// Проверка и инкремент
function checkAndIncrement() {
    const data = readData();
    const lastDate = new Date(data.lastIncrement);
    const currentDate = new Date();
    const daysPassed = (currentDate - lastDate) / (1000 * 60 * 60 * 24);

    if (daysPassed >= INCREMENT_DAYS) {
        data.frozen += Math.floor(daysPassed / INCREMENT_DAYS);
        data.lastIncrement = currentDate.toISOString();
        saveData(data);
        console.log(`[${currentDate.toLocaleString()}] Автоинкремент: frozen = ${data.frozen}`);
        broadcastFrozenValue();
    }
}

// Рассылка всем клиентам
function broadcastFrozenValue() {
    const data = readData();
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ frozen: data.frozen }));
        }
    });
}

// API для уменьшения
app.post('/api/decrement', (req, res) => {
    const data = readData();
    data.frozen = Math.max(0, data.frozen - 1);
    saveData(data);
    broadcastFrozenValue();
    res.json({ frozen: data.frozen });
});

// Проверка каждые 6 часов (для надёжности)
setInterval(checkAndIncrement, 6 * 60 * 60 * 1000);

// Первая проверка при запуске
checkAndIncrement();

// Вспомогательные функции
function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Добавляем этот endpoint в server.js
app.get('/api/frozen', (req, res) => {
    const data = readData();
    res.json({ frozen: data.frozen });
});
