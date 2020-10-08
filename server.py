import asyncio
import websockets
import json
import ssl
import pathlib

#PORT = 8765
PORT = 8443

HOST = "localhost"

print(f"start_server is running on http://{HOST}:{PORT}")

state = {
    "action": "",
    "counter": 0,
    "users_count": 0,
    "chat_current_message": "",
    "sender": ""
}

USERS = set()

UPDATE_USERS = "update_users"
UPDATE_COUNTER = "update_counter"
CHAT_MESSAGE = "chat_message"
PLUS = "plus"
MINUS = "minus"


async def send_message_to_users(action=UPDATE_USERS):
    state["action"] = action
    msg = json.dumps(state)
    await asyncio.wait([i.send(msg) for i in USERS])


async def update_user_count(ws, task=PLUS):
    if task == PLUS:
        USERS.add(ws)
    elif task == MINUS:
        USERS.remove(ws)
    state["users_count"] = len(USERS)


def update_counter(task=PLUS):
    if task == PLUS:
        state["counter"] += 1
    elif task == MINUS:
        if state["counter"] > 0:
            state["counter"] -= 1


def handle_received_data(action, message):
    if action == UPDATE_COUNTER:
        update_counter(message)
    elif action == CHAT_MESSAGE:
        state["chat_current_message"] = message["text"]
        state["sender"] = message["sender"]


ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
localhost_pem = pathlib.Path(__file__).with_name("server.pem")
ssl_context.load_cert_chain(localhost_pem)

async def start_server(ws, path):
    await update_user_count(ws, PLUS)
    await send_message_to_users(UPDATE_USERS)
    await send_message_to_users(UPDATE_COUNTER)
    try:
        async for i in ws:
            data_received = json.loads(i)
            action = data_received["action"]
            message = data_received["message"]
            handle_received_data(action, message)
            await send_message_to_users(action)
    finally:
        await update_user_count(ws, MINUS)
        await send_message_to_users(UPDATE_USERS)
        await send_message_to_users(UPDATE_COUNTER)

server = websockets.serve(start_server, HOST, PORT,ssl=ssl_context)
#server = websockets.serve(start_server, HOST, PORT)

asyncio.get_event_loop().run_until_complete(server)
asyncio.get_event_loop().run_forever()
