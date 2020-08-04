const socket = io();

const inboxPeople = document.querySelector(".inbox__people");
const inputField = document.querySelector(".msgInput");
const nameField = document.querySelector(".nameInput");
const messageForm = document.querySelector(".message_form");
const nameForm = document.querySelector(".name_form");
const messageBox = document.querySelector(".messages__history");
const fallback = document.querySelector(".fallback");

let userName = "";
let activeUserName = "";
const chats = {};

const newUserConnected = (user) => {
  userName = user || `User${Math.floor(Math.random() * 1000000)}`;
  socket.emit("new user", userName);
  // addToUsersBox(userName);
};

const activateChat = (userName) => {
  activeUserName = userName;
  document.querySelector('.active')?.classList.remove('active');
  document.querySelector(`.${userName}-userlist`).classList.add('active');
  document.querySelector(`.${userName}-userlist`).classList.remove('notification');
  messageBox.innerHTML = '';
  for(msg of chats[userName]) {
    addNewMessage(msg);
  }
}

const addToUsersBox = (name) => {
  if (!!document.querySelector(`.${name}-userlist`) || userName === name) {
    return;
  }

  chats[name] = [];
  inboxPeople.innerHTML += `
    <div onClick="activateChat('${name}')" class="chat_ib ${name}-userlist">
      <h5>${name}</h5>
    </div>
  `;
};

const addNewMessage = ({ from, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const receivedMsg = `
  <div class="incoming__message">
    <div class="received__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="message__author">${from}</span>
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  const myMsg = `
  <div class="outgoing__message">
    <div class="sent__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  messageBox.innerHTML += from === userName ? myMsg : receivedMsg;
};

// new user is created so we generate nickname and emit event
// newUserConnected();

nameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  document.querySelector('.dim').remove();
  newUserConnected(`${nameField.value}-${Math.floor(Math.random() * 1000000)}`);
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inputField.value || !activeUserName) {
    return;
  }

  const msg = { message: inputField.value, from: userName, to: activeUserName };
  addNewMessage(msg);
  chats[activeUserName].push(msg);
  socket.emit("chat message", msg);

  inputField.value = "";
});

inputField.addEventListener("keyup", () => {
  if (activeUserName) {
    socket.emit("typing", {
      isTyping: inputField.value.length > 0,
      from: userName,
      to: activeUserName
    });
  }
});

socket.on("new user", function (data) {
  data.map((user) => addToUsersBox(user));
});

socket.on("user disconnected", function (userName) {
  document.querySelector(`.${userName}-userlist`)?.remove();
});

socket.on("chat message", function (data) {
  console.log(data);
  chats[data.from].push(data);
  if(data.from === activeUserName) {
    addNewMessage(data);
  } else {
    document.querySelector(`.${data.from}-userlist`).classList.add('notification');
  }
});


socket.on("typing", function (data) {
  const { isTyping, from } = data;

  if (!isTyping) {
    fallback.innerHTML = "";
    return;
  }

  fallback.innerHTML = `<p>${from} is typing...</p>`;
});