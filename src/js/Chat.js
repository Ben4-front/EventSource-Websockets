import ChatAPI from './api/ChatAPI';

export default class Chat {
  constructor(container) {
    this.container = container;

    this.baseUrl = 'https://chat-backend-cbgz.onrender.com';
    this.api = new ChatAPI(this.baseUrl);
    
    this.user = null;
    this.ws = null;

    this.bindToDOM();
    this.registerEvents();
  }

  bindToDOM() {
    this.modal = document.querySelector('#modal');
    this.loginForm = document.querySelector('#login-form');
    this.modalError = document.querySelector('.modal__error');
    
    this.chatContainer = document.querySelector('#chat');
    this.usersList = document.querySelector('#users-list');
    this.messagesArea = document.querySelector('#messages-area');
    this.chatForm = document.querySelector('#chat-form');
  }

  registerEvents() {

    this.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nickname = this.loginForm.nickname.value.trim();
      
      if (!nickname) return;

      const result = await this.api.registerUser({ name: nickname });

      if (result.success) {
        this.user = result.user;
        this.modal.classList.add('hidden');
        this.chatContainer.classList.remove('hidden');
        this.connectWebSocket();
      } else {
        this.modalError.textContent = 'Такой никнейм занят или недопустим';
        this.modalError.classList.remove('hidden');
      }
    });


    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = this.chatForm.message;
      const messageText = input.value.trim();

      if (!messageText || !this.ws) return;

      const payload = {
        type: 'send',
        message: messageText,
        user: this.user
      };

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(payload));
        input.value = '';
      }
    });
  }

  connectWebSocket() {

    const wsUrl = this.baseUrl.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws`);

    this.ws.addEventListener('open', () => {
      console.log('Connected to WS');
    });

    this.ws.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      console.log('Received:', data);

      
      if (Array.isArray(data)) {
        this.renderUsers(data);
      } 

      else if (data.type === 'send') {
        this.renderMessage(data);
      }
    });

    this.ws.addEventListener('close', (e) => {
      console.log('Disconnected', e);

    });

    this.ws.addEventListener('error', (e) => {
      console.error('WS Error', e);
    });
  }

  renderUsers(users) {
    this.usersList.innerHTML = '';
    
    users.forEach(user => {
      const isCurrentUser = user.name === this.user.name;
      const userEl = document.createElement('div');
      userEl.className = 'user-item';
      
      userEl.innerHTML = `
        <div class="user-avatar"></div>
        <div class="user-name ${isCurrentUser ? 'user-me' : ''}">
           ${user.name} ${isCurrentUser ? '(You)' : ''}
        </div>
      `;
      this.usersList.appendChild(userEl);
    });
  }

  renderMessage(data) {
    const { user, message, created } = data; 
    const isSelf = user.name === this.user.name;
    
    const msgEl = document.createElement('div');
    msgEl.className = `message-container ${isSelf ? 'message__self' : 'message__income'}`;
    

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgEl.innerHTML = `
      <div class="message-meta">${isSelf ? 'You' : user.name}, ${time}</div>
      <div class="message-text">${message}</div>
    `;

    this.messagesArea.appendChild(msgEl);
    

    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }
}