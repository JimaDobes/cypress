import { ReactiveElement, LitElement, html, svg, css } from './deps.js';
import { msg, updateWhenLocaleChanges, localeList, localeDictionary, setLocale, getLocale, updateLocaleFromUrl } from './locales.js';

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
		const {type, data, message} = event;
		const { ws } = this;
		switch(type){
		case 'close':
			this.disconnect();
		break;
		case 'open':
			this.connected = true;
		break;
		case 'message':
			console.log(type, {data});
			this.shadowRoot.querySelector('[broadcast]').value = data;
			this.cmd(data);
		break;
		default:
			console.log(type, {data, message, readyState: ws?.readyState, event});
		}
	}
	cmd(data){
		try{
			const json = JSON.parse(data);
			console.log(`cmd(...)`,{json});
			const {cmd} = json;
			// TODO possibly improve
			this.dispatchEvent(new CustomEvent('cmd', {bubbles: true, cancelable: true, composed: true, detail: json}));
		}catch(error){
			console.warn(error, {data});
		};
	}
	connectedCallback(){
		super.connectedCallback();
		this.connect();
	}
	disconnectedCallback(){
		super.disconnectedCallback();
		this.disconnect();
	}
	/* ws.readyState: 0 opening; 1 open; 2 closing; 3 closed; */
	connect(){
		let ws = this.ws;
		if(!ws || ws.readyState > 1){
			ws = new WebSocket(`ws://localhost:${ this.portAppChannel }/ws`);
			this.ws = ws;
			this.wsEvents.forEach(function(type){
				ws.addEventListener(type, this._handleThis);
			}, this);
		}
	}
	get wsEvents(){ return ['message','open','close','error']; }
	disconnect(){
		const { ws } = this;
		if(!ws) return;
		if(ws.readyState<2){
			this.ws.close();
		}
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

		const {connected, ws } = this;
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
<input type=search msg placeholder="send message">
<div>
<button type=submit>${ this.connected ? 'send':'connect' }</button>
<button disconnect type=reset>disconnect</button>
</div>
<textarea broadcast placeholder="last broadcast" readonly></textarea>
<slot>...</slot>
</form>
		`;
	}
}

customElements.define('ws-client', WsClient);
