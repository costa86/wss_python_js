const host = "localhost",
    port = 8443,
    ws = new WebSocket(`wss://${host}:${port}/`),
    counter = document.getElementById("counter"),
    onlineUsers = document.getElementById("onlineUsers"),
    btnSendMsg = document.getElementById("btnSendMsg"),
    inputChatMessage = document.getElementById("inputChatMessage"),
    messagesLog = document.getElementById("messagesLog"),
    username = document.getElementById("username"),
    usernameHeader = document.getElementById("usernameHeader"),
    counterButtons = document.getElementsByClassName("counterButtons");

const state = {
    "action": "",
    "message": "",
};

inputChatMessage.focus();

const UPDATE_USERS = "update_users",
    UPDATE_COUNTER = "update_counter",
    CHAT_MESSAGE = "chat_message";


btnSendMsg.disabled = true;

function toggleBtnSendMsg(e) {
    let chars = e.target.value.length;
    btnSendMsg.disabled = (chars > 0) ? false : true;
}

inputChatMessage.addEventListener("keyup", (e) => toggleBtnSendMsg(e));

function handleChatMessage(data) {
    const newMessage = document.createElement("spam"),
        usernameElement = document.createElement("p"),
        msgCard = document.createElement("div"),
        sender = data.sender;
    msgCard.className = "msgCard";
    usernameElement.innerHTML = (sender == username.value) ? "Me: " : `${sender}: `;
    usernameElement.appendChild(newMessage);
    newMessage.innerHTML = data.chat_current_message;
    msgCard.appendChild(usernameElement);
    messagesLog.appendChild(msgCard);
    inputChatMessage.value = "";
    inputChatMessage.focus();
}

const actionsMap = new Map();
actionsMap.set(UPDATE_COUNTER, (data) => counter.innerHTML = data.counter);
actionsMap.set(UPDATE_USERS, (data) => onlineUsers.innerHTML = data.users_count);
actionsMap.set(CHAT_MESSAGE, (data) => handleChatMessage(data));


function handleAction(action, data) {
    actionsMap.get(action)(data);
}

ws.onopen = (e) => {
    console.log(`Connected to ${e.target.url}`);
}

ws.onmessage = (e) => {
    const parsedData = JSON.parse(e.data),
        action = parsedData.action;
    console.log(e.data);
    handleAction(action, parsedData);
    document.title = usernameHeader.innerHTML = username.value;
}

for (let i of counterButtons) {
    i.addEventListener("click", (button) => {
        console.log(UPDATE_COUNTER);
        sendDataToServer(UPDATE_COUNTER, button.target.name);
    });
}



function sendDataToServer(action, message) {
    state.action = action;
    state.message = message;
    const stringData = JSON.stringify(state);
    ws.send(stringData);
}



btnSendMsg.addEventListener("click", () => {
    let fullMessage = {
        "sender": username.value,
        "text": inputChatMessage.value
    };
    sendDataToServer(CHAT_MESSAGE, fullMessage);
});

