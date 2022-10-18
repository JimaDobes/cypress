import { ReactiveElement, LitElement, html, svg, css } from './deps.js';

class CypressApp extends LitElement{
	static properties = {
		TODO: {type: String, attribute: true}
		,loading: {type: Boolean, attribute: true}
		,loading: {type: Boolean, attribute: true}
	}
	static styles = css`
:host{
	background-color: #cf0;
	width: 100vw;
	height: 100vh;
	padding: 1em;
	display: block;
}
	`;
	constructor(){
		super();
		this.TODO = 'everything TODO...';
		this.title = 'cypress 🌲';
		this._handleThis = this._handleThis.bind(this);
		this.loading = true;
	}
	_handleThis(event){
		const {type, detail} = event;
		console.log(type, {detail, event, _this: this, path: event.composedPath()});
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
	render(){
		return html`
<h3>${ this.title }${ this.loading ? ' loading...':'' }</h3> 
<slot></slot>
		`;
	}
}

customElements.define('cypress-app', CypressApp);
