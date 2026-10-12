import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, push, onChildAdded, set } from "https://gstatic.com";

// Твой рабочий конфиг из консоли Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDbjz76GB2jF3DmeqvjvFQgzyGP95KfKNk",
  authDomain: "://firebaseapp.com",
  databaseURL: "https://firebaseio.com",
  projectId: "nebula-60381",
  storageBucket: "nebula-60381.firebasestorage.app",
  messagingSenderId: "1001084802756",
  appId: "1:1001084802756:web:511337299bc7a8a062db91",
  measurementId: "G-9R95D3MG00"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const chatsRef = ref(db, 'chats');
let activeChatId = "chat-1"; 

document.addEventListener("DOMContentLoaded", function() {
  loadChatsFromFirebase();
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => searchUsers(e.target.value));
  }
});

// 1. ЗАГРУЗКА ВСЕХ ГРУПП И КАНАЛОВ ИЗ ОБЛАКА GOOGLE
function loadChatsFromFirebase() {
  const stream = document.getElementById('chats-box-stream');
  
  stream.innerHTML = `
    <div class="dialog-item ${activeChatId === 'chat-1' ? 'active' : ''}" id="chat-1" onclick="window.openChat()">
      <div class="avatar-circle" style="background-color: #007aff;">📘</div>
      <div class="dialog-info"><div class="dialog-name">Избранное</div></div>
    </div>
  `;

  onChildAdded(chatsRef, (data) => {
    const chat = data.val();
    if (!chat || data.key === 'chat-1') return;

    const icon = chat.type === 'channel' ? '📢' : '👥';
    const item = document.createElement('div');
    item.className = `dialog-item ${data.key === activeChatId ? 'active' : ''}`;
    item.id = data.key;
    item.setAttribute('data-username', chat.username || '');
    item.onclick = () => switchChat(data.key, chat.title, icon, chat.username);
    
    item.innerHTML = `
      <div class="avatar-circle" style="background-color: #a155ff;">${icon}</div>
      <div class="dialog-info">
        <div class="dialog-name">${chat.title}</div>
        <div style="font-size:12px; color:#645c84;">@${chat.username || ''}</div>
      </div>
    `;
    stream.appendChild(item);
  });
}

// 2. СИНХРОННОЕ ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ (БЕЗ СЛЭШЕЙ И КРИВОЙ ЛОГИКИ)
function switchChat(chatId, title, icon, username) {
  activeChatId = chatId;
  document.querySelectorAll('.dialog-item').forEach(el => el.classList.remove('active'));
  
  const activeItem = document.getElementById(chatId);
  if (activeItem) activeItem.classList.add('active');
  
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('settings-screen').style.display = 'none';
  document.getElementById('chat-screen').style.display = 'flex';
  
  let headerHTML = `
    <div class="avatar-circle" style="width:36px; height:36px; min-width:36px; min-height:36px; font-size:16px; margin-right:10px; background-color: ${chatId === 'chat-1' ? '#007aff' : '#a155ff'}">${icon}</div>
    ${title}
  `;
  
  if (username) {
    headerHTML += `<span style="font-size:13px; color:#4e466d; font-weight:normal; margin-left:8px;">@${username}</span>`;
  }
  
  document.getElementById('chat-header-title').innerHTML = headerHTML;
  loadMessagesFromFirebase(chatId);
}

// 3. ПОЛУЧЕНИЕ ИСТОРИИ ИЗ КОНКРЕТНОЙ ВЕТКИ ОБЛАКА
function loadMessagesFromFirebase(chatId) {
  const box = document.getElementById('messages-box');
  box.innerHTML = '';
  
  const currentMessagesRef = ref(db, `messages/${chatId}`);
  onChildAdded(currentMessagesRef, (data) => {
    const msg = data.val();
    const b = document.createElement('div');
    b.className = 'msg-bubble';
    b.innerHTML = `<span></span><div class="msg-meta-box"><span class="msg-time">${msg.time}</span><div class="msg-status-icon">✓</div></div>`;
    b.querySelector('span').textContent = msg.text;
    box.appendChild(b);
    box.scrollTop = box.scrollHeight;
  });
}

// 4. ОТПРАВКА СООБЩЕНИЯ В ОБЛАЧНУЮ БД GOOGLE
function sendMessage(e) {
  e.preventDefault();
  const i = document.getElementById('msg-input'), t = i.value.trim(); 
  if (!t) return;
  
  const now = new Date(), timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentMessagesRef = ref(db, `messages/${activeChatId}`);
  
  push(currentMessagesRef, {
    text: t,
    time: timeString
  });
  
  i.value = '';
}

// 5. СОЗДАНИЕ ГРУППЫ/КАНАЛА НА СЕРВЕРЕ GOOGLE FIREBASE
function createRoom(type) {
  document.getElementById('fab-menu-popup').style.display = 'none';
  const title = prompt(`Название для нового ${type === 'channel' ? 'канала' : 'группы'}:`); if (!title) return;
  const username = prompt(`Придумай уникальный @username для поиска:`); if (!username) return;
  const cleanUser = username.toLowerCase().replace(/[^a-z0-9]/g, '');

  const newChatRef = push(chatsRef);
  set(newChatRef, {
    title: title,
    type: type,
    username: cleanUser
  });
}

// ЖИВОЙ КЛИЕНТСКИЙ ПОИСК ПО ЮЗЕРНЕЙМАМ ИЗ ОБЛАКА
function searchUsers(query) {
  const q = query.toLowerCase().replace('@', '').trim();
  document.querySelectorAll('.dialog-item').forEach(item => {
    if (item.id === 'chat-1') return;
    const u = item.getAttribute('data-username') || '';
    item.style.display = (q === '' || u.includes(q)) ? 'flex' : 'none';
  });
}

function openChat() { switchChat('chat-1', 'Избранное', '📘', ''); }
function openSettings() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('chat-screen').style.display = 'none';
  document.querySelectorAll('.dialog-item').forEach(el => el.classList.remove('active'));
  document.getElementById('settings-screen').style.display = 'flex';
}
function toggleFabMenu() {
  const m = document.getElementById('fab-menu-popup');
  m.style.display = m.style.display === 'block' ? 'none' : 'block';
}
function ts(b, i) {
  const o = document.getElementById(b); o.style.display = o.style.display === 'block' ? 'none' : 'block';
  if (o.style.display === 'block') document.getElementById(i).focus();
}

window.openChat = openChat; window.openSettings = openSettings; window.toggleFabMenu = toggleFabMenu;
window.createRoom = createRoom; window.ts = ts; window.sendMessage = sendMessage;
