// v1 is time based
import { v1 } from "https://deno.land/std/uuid/mod.ts";

const users = new Set();

export const ws = async function wschat(context, next){
	const { isUpgradable, response } = context;
	if(!isUpgradable){
		response.status = 426;
		response.body = `not upgradable`
		return;
	}
	const socket = await context.upgrade();
	socket.onmessage = _message;
	socket.onerror = _error;
	socket.onclose = _close;
	socket.userid = v1.generate();
	app._log({VERB:`WS-HELLO`, other: socket.userid});
	broadcast(`HELLO:${socket.userid}`);
	users.add(socket);
	// 204 no content
	context.response.body = null;
}

function _message(event){
	const {data, type, isTrusted, origin} = event;
	broadcast(data, this.userid);
}
// "IO error: Connection reset by peer (os error 54)"
// event instanceof ErrorEvent
function _error(event){
	const { type, message } = event;
	app._log({VERB:`WS-ERROR`, other: message});
	broadcast(`ERROR:${this.userid}, "${ message }"`);
}
function _close(event){
	users.delete(this);
	app._log({VERB:`WS-BYE`, other: this.userid});
	broadcast(`BYE:${this.userid}`);
}

function broadcast(message, userid){
	if (!message) return;
	for (const user of users.values()) {
		const { readyState = -1 } = user ?? {};
		if(readyState === 1){
			user.send(`${message}`);
		}else if(readyState > 2){
			app._log({VERB:`WS-STATUS`, other: `socket.readyState:${readyState}, call close as disconnected`});
			_close.call(user, {type:'disconnected'});
		}
	}
}

