const frozenValueElement = document.getElementById('frozenValue');
const decrementBtn = document.getElementById('decrementBtn');
let ws;

// 1. Сначала загружаем значение через обычный HTTP запрос
async function loadInitialValue() {
   try {
       const response = await fetch('/api/frozen');
       const data = await response.json();
       updateDisplay(data.frozen);
   } catch (error) {
       console.error('Ошибка загрузки:', error);
       frozenValueElement.textContent = 'Ошибка';
       frozenValueElement.style.color = 'red';
   }
}

// 2. Затем устанавливаем WebSocket соединение
function connectWebSocket() {
   const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
   ws = new WebSocket(protocol + window.location.host);

   ws.onopen = () => {
       console.log('WebSocket connected');
   };

   ws.onmessage = (event) => {
       const data = JSON.parse(event.data);
       updateDisplay(data.frozen);
   };

   ws.onclose = () => {
       console.log('WebSocket disconnected, reconnecting...');
       setTimeout(connectWebSocket, 1000);
   };
}

// 3. Функция обновления отображения
function updateDisplay(value) {
   frozenValueElement.textContent = value;
   frozenValueElement.classList.remove('loading');
   frozenValueElement.style.color = ''; // Сбрасываем цвет ошибки если был
}

// 4. Обработчик кнопки
decrementBtn.addEventListener('click', async () => {
   decrementBtn.disabled = true;
   try {
       const response = await fetch('/api/decrement', { method: 'POST' });
       const data = await response.json();
       updateDisplay(data.frozen);
   } catch (error) {
       console.error('Ошибка:', error);
       frozenValueElement.textContent = 'Ошибка';
       frozenValueElement.style.color = 'red';
   } finally {
       decrementBtn.disabled = false;
   }
});

// Инициализация
loadInitialValue(); // Сначала HTTP запрос
connectWebSocket(); // Затем WebSocket
