import { ReactiveElement, LitElement, html, svg, css } from './deps.js';
import './ws-client.js';
import './cypress-adjustment.js';

class CypressApp extends LitElement{
	static properties = {
		TODO: {type: String, attribute: true}
		,loading: {type: Boolean, attribute: true}
		,loading: {type: Boolean, attribute: true}
	}
	static styles = css`
:host{
	background-color: #333;
	width: 100vw;
	height: 100vh;
	display: block;
	position:fixed;
}
:host main{
	width: 100vw;
	height: 100vh;
	display:flex;
	position: fixed;
	align-items: center;
	justify-content: center;
}
:host([dragging]) main{
	background-color:red;
}
main img[edit]{
	border: thin solid #333;
	min-width: 1rem;
	min-height: 1rem;
	max-width: 100vw;
	max-height: 100vh;
}
main img:is(:focus, :active, :hover){
	border-color: #000;
}
:host #ui-controls{
	position:fixed;
	width:100vw;
	height:100vh;
	background:transparent;
	pointer-events: none;
}
:host #ui-controls > *{
	pointer-events: auto;
}
	`;
	constructor(){
		super();
		this.TODO = 'everything TODO...';
		this.title = 'cypress 🌲';
		this._handleThis = this._handleThis.bind(this);
		this.loading = true;

		this.addEventListener('relay', this._relay);
		this.addEventListener('adjustment', this._adjustment);

		this._dragevents.forEach(type=>{
			this.addEventListener(type, this._handleThis);
		});
	}
	_adjustment({detail}){
		const {adjustment, css} = detail;
		this.shadowRoot.querySelector('main img[edit]').style = css;
	}
	_relay({detail}){
		this.querySelector('ws-client')?.ws?.send(JSON.stringify(detail));
	}
	_handleThis(event){
		const {type, detail, dataTransfer, target} = event;
		if(type.startsWith('drag')){
			event.preventDefault();
			if(type!=='dragover'){
				console.log(type, {detail, target, event, _this: this, path: event.composedPath()});
			}
			switch(type){
			case 'dragover':
			break;
			case 'dragstart':
				this.setAttribute('dragging','');
			break;
			case 'dragend':
				this.removeAttribute('dragging');
			break;
			}
			return;
		}
		switch(type){
		case 'drop':
			event.preventDefault();
			event.stopImmediatePropagation();
			const { files } = dataTransfer;
			console.log(type, {files, detail, dataTransfer, target, event, _this: this, path: event.composedPath()});
			this.filing(files);
		break;
		default:
			console.log(type, {detail, event, _this: this, path: event.composedPath()});

		}
	}
	_updateImg(event){
		const { target } = event;
		const { src } = target;
		this.dispatchEvent(new CustomEvent('img-edit-src', {detail: {src}, composed: true, bubbles: true}));
		/*
		const imgs = [...this.shadowRoot.querySelectorAll('img[edit]'), ...this.querySelectorAll('[img-src]')];
		imgs.forEach(img=>{
			if(img === target) return;
			img.src = src;
		});
		*/
	}
	filed(data, source){
		this.dispatchEvent(new CustomEvent('relay',{detail: {cmd: 'load', data, source}}));
		this.shadowRoot.querySelector('img[edit]').src = data;
	}
	filing(files){
		// FileList {0: File, length: 1}
		// KISS demo
		const file = files.item(0);
		const reader = new FileReader();
		reader.onloadend = ()=>{
			this.filed(reader.result, reader);
		};
		reader.readAsDataURL(file);
	}
	connectedCallback(){
		super.connectedCallback();
		self.addEventListener('eg', this._handleThis);
		this.loading = false;
	}
	firstUpdated(){
		this.shadowRoot.querySelector('main img[edit]').src = "./sample.jpg"
	}
	disconnectedCallback(){
		super.disconnectedCallback();
		self.removeEventListener('eg', this._handleThis);
	}
	_dragevents = `drag,drop,dragover,dragleave,dragstart,dragend,dragenter`.trim().split(/[,\s;]+/);
	render(){
		return html`
<main>
	<img edit @load=${ this._updateImg }>
</main>
<section id=ui-controls>
	<h3>${ this.title }${ this.loading ? ' loading...':'' }</h3> 
	<cypress-adjustment panel>
		<!-- 
		saturate 10 ~= 100in Ps
		<img edit title="hue-intensity" style="">
		<img edit title="grayscale" style="">
		brightness: 1 nothing; 0% black, 200% double brightness; contrast: 0 gray, 1 no effect, 200% double
		<img edit title="grayscale" style=""
			ps=""
		>
		-->
	</cypress-adjustment>
	<section>
	<slot></slot>
	</section>

</section>
		`;
	}
}

customElements.define('cypress-app', CypressApp);
