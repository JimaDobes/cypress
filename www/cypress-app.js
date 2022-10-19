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
maing img:is(:focus, :active, :hover){
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
[panel][adjustments] img{
	width: 50px;
	height: 50px;
	border: thin solid #000;
}
	`;
	constructor(){
		super();
		this.TODO = 'everything TODO...';
		this.title = 'cypress 🌲';
		this._handleThis = this._handleThis.bind(this);
		this.loading = true;

		this.addEventListener('relay', this._relay);

		this._dragevents.forEach(type=>{
			this.addEventListener(type, this._handleThis);
		});
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
	_imgUpdate(img){
		img.src = this.result;
		console.log({img, res: this.result, reader: this});
	}
	filing(files){
		const imgs = [...this.shadowRoot.querySelectorAll('img[edit]'), ...this.querySelectorAll('img[edit]')];
		// FileList {0: File, length: 1}
		// KISS demo
		const file = files.item(0);
		const reader = new FileReader();
		reader.onloadend = ()=>{
			this.dispatchEvent(new CustomEvent('relay',{detail: {cmd: 'load', data:reader.result, source: reader}}));
			imgs.forEach(this._imgUpdate, reader);
		};
		reader.readAsDataURL(file);
	}
	connectedCallback(){
		super.connectedCallback();
		self.addEventListener('eg', this._handleThis);
		this.loading = false;
	}
	disconnectedCallback(){
		super.disconnectedCallback();
		self.removeEventListener('eg', this._handleThis);
	}
	_dragevents = `drag,drop,dragover,dragleave,dragstart,dragend,dragenter`.trim().split(/[,\s;]+/);
	render(){
		return html`
<main>
	<img edit>
</main>
<section id=ui-controls>
	<h3>${ this.title }${ this.loading ? ' loading...':'' }</h3> 
	<section panel adjustments>
		<img edit>
		<img edit>
		<img edit>
	</section>
	<section>
	various
	<button>button</button>
	<slot></slot>
	</section>

</section>
		`;
	}
}

customElements.define('cypress-app', CypressApp);
