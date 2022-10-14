// TODO share via file
const portAppChannel = 47083;
const log = (...msg) => {
	console.log(`ws(${Date.now()})`,...msg);
}
const error = (...msg) => {
	console.error(`ws(${Date.now()})`,...msg);
}

const WebSocketServer = require('./node_modules/websocket/index.js').server;
const http = require('http');
 
const server = http.createServer(function(request, response) {
	log(`Received request for ${request.url}`);
	response.writeHead(404);
	response.end();
});

server.listen(portAppChannel, function() {
	log(`Server is listening on portAppChannel ${ portAppChannel }`);
});
 
wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
	// We're allowing everything; this probably isn't a good idea for production, though.
	return true;
}
 
wsServer.on('request', function(request) {
	if (!originIsAllowed(request.origin)) {
		// Make sure we only accept requests from an allowed origin
		request.reject();
		error(`Connection from origin ${request.origin} rejected.`);
		return;
	}
	
	var connection = request.accept('test-protocol', request.origin);
	log("Connection accepted.");

	const sentMessages = [];
	const timers = {};
	const data = {};

	function send(msg) {
		sentMessages.push(msg);
		connection.send(msg);
	}

	connection.on("message", message => {
		const [cmd, ...args] = message.utf8Data.split("=");
		switch (cmd) {
			case "echo": 
				send(`text=${args.join("=")}`);
				break;
			case "rand":
				if (args[0] === "on") {
					if (timers.rand) clearInterval(timers.rand);
					timers.rand = setInterval(() => {
						const randomNumber = (Math.random()*10000).toString();
						send(`text=${randomNumber}`);
					}, 250);
				} else {
					clearInterval(timers.rand);
				}
				break;
			case "fast":
				if (args[0] === "on") {
					data.fast = 0;
					if (timers.fast) clearInterval(timers.fast);
					timers.fast = setInterval(() => {
						send(`text=${data.fast}`);
						data.fast++;
					},1);
				} else {
					clearInterval(timers.fast);
				}
				break;
			case "validate":
				if (sentMessages.join("\n") !== args.join("=")) {
					error("Missed!");
					error("Sent: " + sentMessages.join("\n"));
					error("Recv: " + args.join("="))
					send(`text=missed messages`);
				} else {
					send(`text=received everything ok`);
				}
				break;
			default:
				send(`err=didn't know how to ${cmd}`);
		}
	});

	connection.on('close', function(reasonCode, description) {
		clearInterval(timers.rand);
		clearInterval(timers.fast);
		log(' Peer ' + connection.remoteAddress + ' disconnected.');
	});

	send("text=Hello!");
});

log("wsserver");
