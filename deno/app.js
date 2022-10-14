/*
 * provide a simple alternate UI and middleware for exploration with Ps and similar applications
   using modern web features and platform as a multiplier

 * run:
	 - deno run -A --unstable ./deno/app.js

 * update dependencies:
	 - deno cache --reload ./deno/app.js ./deno/http.js

 * debugging:
	 - to enable client debugging use 'true' boolean in new Webview(true); then once open right-click the view/web page and choose inspect to open the devtools
	 - for deno middleware include either option --inspect or --inspect-brk then use chrome://inspect to open the devtools for this:
	 	deno run -A --unstable --inspect-brk ./deno/app.js
	 	deno run -A --unstable --inspect ./deno/app.js
	 - see the docs for more info (linked below)

 * ffi ~ foreign function interface
	 - currently unexplored
	 - likely the preferred interface with other application processes
	 - https://deno.land/manual/runtime/ffi_api

 * docs, with links to APIs, Std library, 3rd party modules
 	- https://deno.land/manual/introduction

 * http related adapted from https://github.com/sourdough/starter/blob/main/tools/http.js

 * */
import { Webview } from "https://deno.land/x/webview@0.7.5/src/webview.ts";
import { preload, unload } from "https://deno.land/x/webview@0.7.5/src/ffi.ts";
import { getAvailablePortSync } from "https://deno.land/x/port/mod.ts";

// TODO share via file
const portAppChannel = 47083;
const config = {
	port: getAvailablePortSync()
	,host: 'localhost'
	,portAppChannel
};

const workerUrl = new URL("./http.js", import.meta.url).href;
const worker = new Worker(workerUrl, { type: "module" });
worker.postMessage({ command: "serve", ...config });

const webview = new Webview(true);
webview.title = `cypress 🌲`;
webview.size = {width:300,height:300,hint:1};

console.log(`webview`,{webview,globalThis,config,worker});

webview.navigate(`http://${ config.host }:${ config.port }`);

let count = 0;
webview.bind("radio", (...input)=>{
	console.log(`-> radio(...input)`,input);
	return {input, count:count++};
});

webview.run();
worker.postMessage({ command: "quit" });
