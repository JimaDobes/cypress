// http
import * as paf from "https://deno.land/std/path/mod.ts";
import { Application, Router, HttpError, send, Status } from "https://deno.land/x/oak/mod.ts";
import { wschat } from "./wschat.js";

const config = {
	host: 'localhost'
	,port: 84083
	,www: '../www'
	,index: 'index.html'
	// default expiration caching (minimum 1 second);
	,expires: 'private, max-age=1, s-maxage=1'
	,userAgent: ''
	,root: ''
	,version: '0.0.0'
};
const script = new URL(import.meta.url);
config.userAgent = `cypress/${config.version} Deno/${Deno.version.deno} V8/${Deno.version.v8} TS/${Deno.version.typescript} ${Deno.build.target}`;
config.root = paf.resolve(paf.dirname(script.pathname), config.www);

const app = new Application(config);
const router = new Router();

const charset = '; charset=utf-8';
const mimetypes = {
	css: `text/css${ charset }`
	,ico: `image/vnd.microsoft.icon`
	,jpg: `image/jpeg`
	,js: `text/javascript${ charset }`
	,json: `application/json${ charset }`
	,pdf: `application/pdf${ charset }`
	,txt: `text/plain${ charset }`
	,html: `text/html${ charset }`
	// application/csp-report as JSON
};

router.get('/ws', wschat);

// general error handling including unhandled middleware errors (500)
app.use(async (context, next) => {
	const {response, request} = context;
	try{
		await next();
	}catch(err){
		let status = err instanceof HttpError ? err.status : 500;
		const { pathname } = request.url;
		// adjust response to fit requested mimetype
		let ext = paf.extname(pathname).toLowerCase();

		if(404 === status && !ext){ // && !pathname.endsWith('/')){
			// single-page-app SPA pattern
			await send(context, config.index, config);
			response.status = 200;
		}else{
			// respect error status codes set by other middleware
			if((response.status || 0) < 400){
				response.status = status;
			};
			log(status, request.method, request.url.href, request.user, request.headers.get('user-agent'), request.ip);

			let type = mimetypes[ ext ] || mimetypes[ ( ext = 'html' ) ];
			response.type = type;

			// short caches on errors
			response.headers.set('Cache-Control', config.expires);

			const msg = (err.message || '').slice(0, 3000);

			if(err.expose){
				response.headers.set('X-appmsg', msg);
			};

			// setting a body resets the status to 200 oak/issues/448
			const _status = response.status;
			const { stack }  = err;
			// send an appropriate response
			switch(ext){
			case 'html':
			response.body = `<!doctype html>
<html><body>
<p>${status} ${ Status[status] || 'Internal Server Error' }</p>
<textarea style="white-space:pre;">
${ JSON.stringify({pathname, status, err, ext, message: err.message, _status, stack}) }
</textarea>
</body></html>`;
			break;
			default:
			response.body = '';
			}
			// restore status
			response.status = _status;
		}
	}
});

function log(status='000', VERB='GUESS', what='', who='?', client='~', where='...', other='-'){
	console.log(`${ (new Date).toISOString() } ${ status } "${ VERB } ${ what }" ${ who } "${ client }" ${ where } ${ other }`);
}
function _log(config){
	const {status, VERB, what, who, client, where, other} = config ?? {};
	log(status, VERB, what, who, client, where, other);
}
app.log = log;
app._log = _log;
globalThis.app = app;

// Logger
app.use(async (context, next) => {
	await next();
	const request = context.request;
	const time = context.response.headers.get('X-Response-Time');
	log(context.response.status, request.method, request.url, request.user, request.headers.get('user-agent'), request.ip, time);
});

app.use(router.routes());
app.use(router.allowedMethods());

// static content
app.use(async context => {
	// config = {root: paf.resolve(Deno.cwd(), '....'), index: 'index.html'}
	// console.warn(`static>`,{url: context.request.url, index: config.index});
	//await send(context, context.request.url.pathname, config);
	await send(context, context.request.url.pathname, config);
});
/*
app.addEventListener('error', (event)=>{
	console.error(event.error);
	log('000', 'ERROR', `${ event.error }`, undefined, config.userAgent);
});
app.addEventListener('listen', (server)=>{
	log('000', 'START', `${ server.secure ? 'https':'http' }://${ server.hostname || 'localhost' }:${ server.port }`, undefined, config.userAgent);
});
*/
let server;

self.onmessage = async (e) => {
	const { command = '?', port = config.port, host=config.host } = e.data;
	switch (command) {
		case "serve": {
			Object.assign(config, {port, host});
			if(!server){
				server = app.listen(config);
			}else{
				// TODO status?
			}
			//serve((_req) => new Response("Hello, world"), { port: port });
		} break;
		case "quit": {
			self.close();
		} break;
	}
	console.warn(`- worker ${ command }>`,{server, config});
};

