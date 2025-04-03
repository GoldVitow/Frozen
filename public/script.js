const frozenValueElement = document.getElementById('frozenValue');
const decrementBtn = document.getElementById('decrementBtn');
let ws;

// Подключение к WebSocket
function connectWebSocket() {
   // Определяем протокол автоматически
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    ws = new WebSocket(protocol + window.location.host);

   ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         frozenValueElement.textContent = data.frozen;
   };

   ws.onclose = () => {
         setTimeout(connectWebSocket, 1000); // Переподключение при разрыве
   };
}

// Уменьшение значения
decrementBtn.addEventListener('click', async () => {
   try {
         const response = await fetch('/api/decrement', { method: 'POST' });
         const data = await response.json();
         frozenValueElement.textContent = data.frozen;
   } catch (error) {
         console.error('Ошибка:', error);
   }
});

// Инициализация
connectWebSocket();
