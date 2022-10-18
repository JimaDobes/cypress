import { ReactiveElement, LitElement, html, svg, css } from './deps.js';
import { msg, updateWhenLocaleChanges, localeList, localeDictionary, setLocale, getLocale, updateLocaleFromUrl } from './locales.js';

console.log('www/ws-client.js', {html, LitElement, css, svg, msg, getLocale});

class WsClient extends LitElement{
	static properties = {
		connected: {type: Boolean, reflect: true}
		,ws: {type: Object}
		,portAppChannel: {type: Number}
	}
	static styles = css`
:host{
	background-color: #fff;
	width: 10rem;
	height: 10rem;
	padding: 1em;
	display: block;
}
:host(:not([connected])) [type="reset"]{display:none;}
	`;
	constructor(){
		super();
		this.connected = false;
		this.ws = null;
		this.portAppChannel = 47083;
		this._handleThis = this._handleThis.bind(this);
	}
	_handleThis(event){
		const {type, data} = event;
		switch(type){
		case 'close':
			this.disconnect();
		break;
		case 'message':
			console.log(type, {data});
		break;
		default:
			console.log(type, {data, event});
		}
	}
	connectedCallback(){
		super.connectedCallback();
	}
	disconnectedCallback(){
		super.disconnectedCallback();
	}
	connect(){
		let ws = this.ws;
		if(!ws){
			ws = new WebSocket(`ws://localhost:${ this.portAppChannel }/ws`);
			this.ws = ws;
			this.wsEvents.forEach(function(type){
				ws.addEventListener(type, this._handleThis);
			}, this);
			this.connected = true;
		}
	}
	_wsEvent(type){
		this.ws[this.type](type, this._handleThis);
	}
	get wsEvents(){ return ['message','open','close','error']; }
	disconnect(){
		const { ws } = this;
		if(!ws) return;
		/* ws.readyState: 0 opening; 1 open; 2 closing; 3 closed; */
		console.log({readyState:this.ws.readyState});
		this.ws.close();
		console.log({readyState:this.ws.readyState});
		this.connected = false;
		this.wsEvents.forEach(function(type){
			ws.removeEventListener(type, this._handleThis);
		}, this);

		this.ws = null;
	}
	_reset(event){
		this.disconnect();
	}
	_submit(event){
		event.preventDefault();

		const {connected, ws, portAppChannel} = this;
		console.log(event.type, {connected, portAppChannel, ws, event, _this:this}, this);
		if(!this.connected){
			this.connect();
		}else{
			const $msg = this.shadowRoot.querySelector('[msg]');
			const msg = $msg.value.trim();
			$msg.value = '';
			if(msg){
				console.warn(`sent`, {msg});
				this.ws.send(msg);
			}else{
				console.warn(`msg missing`, {msg});
			};
		};
	}
	render(){
		return html`
<h3>${ this.localName }${ this.loading ? 'loading...':'' }</h3> 
<form @submit=${ this._submit } @reset=${ this._reset }>
<input type=search msg>
<button type=submit>${ this.connected ? 'send':'connect' }</button>
<button disconnect type=reset>disconnect</button>
<textarea></textarea>
<slot>...</slot>
</form>
		`;
	}
}

customElements.define('ws-client', WsClient);
