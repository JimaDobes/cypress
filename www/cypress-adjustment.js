import { ReactiveElement, LitElement, html, svg, css } from './deps.js';

class CypressAdjustment extends LitElement{
	static properties = {
		TODO: {type: String, attribute: true}
		,loading: {type: Boolean, attribute: true}
	}
	static styles = css`
:host{
	padding: 1em;
	display: block;
}
	`;
	constructor(){
		super();
		this.TODO = 'everything TODO...';
	}
	connectedCallback(){
		super.connectedCallback();
	}
	disconnectedCallback(){
		super.disconnectedCallback();
	}
	render(){
		return html`
<h3>adjustments</h3>
<slot></slot>

</section>
		`;
	}
	_click(event){
		console.log(event.type, event.target);
		const detail = {when:(new Date).toISOString()};
		this.dispatchEvent(new CustomEvent('adjustment', {composed: true, detail, bubbles: true}));
	}
}

customElements.define('cypress-adjustment', CypressAdjustment);
