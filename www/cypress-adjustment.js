import { ReactiveElement, LitElement, html, svg, css } from './deps.js';

class CypressAdjustment extends LitElement{
	static properties = {
		active: {type: Object},
		list: {type: Array},
		img: {},
	}
	static styles = css`
:host{
	padding: 1em;
	display: block;
}
::slotted(img){
	cursor:pointer;
}
img{
	width: 50px;
	height: 50px;
	border: thin solid #000;
}

	`;
	constructor(){
		super();
		this.active = null;
		this.img = null;
		this.list = [
			{ name: 'reset', id: 'a1',
				style: '',
				ps: {}
			},
			{ name: 'hue-intensity', id: 'a2',
				style: 'filter: hue-rotate(26deg) saturate(10) brightness(1.5)',
				ps: {}
			},
/** 
    // Set current adjustment layer
    command = {"_obj":"set","_target":[{"_enum":"ordinal","_ref":"adjustmentLayer","_value":"targetEnum"}],"to":{"_obj":"hueSaturation","adjustment":[{"_obj":"hueSatAdjustmentV2","hue":26,"lightness":6,"saturation":93}]}};

 *****/
			{ name: 'grayscale', id: 'a3',
				style: 'filter: grayscale(0.93)',
				ps: {}
			},
/**
        // Make adjustment layer
        {"_obj":"make","_target":[{"_ref":"adjustmentLayer"}],"using":{"_obj":"adjustmentLayer","type":{"_obj":"blackAndWhite","blue":20,"cyan":60,"grain":40,"magenta":80,"presetKind":{"_enum":"presetKindType","_value":"presetKindDefault"},"red":40,"tintColor":{"_obj":"RGBColor","blue":179.00115966796876,"grain":211.00067138671876,"red":225.00045776367188},"useTint":false,"yellow":60}}}
 *****/
			{ name: 'contrasty', id: 'a4',
				style: 'filter: brightness(1.1) contrast(160%)',
				ps: {}

/**
        // Make adjustment layer
        {"_obj":"make","_target":[{"_ref":"adjustmentLayer"}],"using":{"_obj":"adjustmentLayer","type":{"_obj":"brightnessEvent","useLegacy":false}}},
        // Set current adjustment layer
        {"_obj":"set","_target":[{"_enum":"ordinal","_ref":"adjustmentLayer","_value":"targetEnum"}],"to":{"_obj":"brightnessEvent","brightness":61,"center":59,"useLegacy":false}},
        // Set current adjustment layer
        {"_obj":"set","_target":[{"_enum":"ordinal","_ref":"adjustmentLayer","_value":"targetEnum"}],"to":{"_obj":"brightnessEvent","brightness":62,"center":76,"useLegacy":false}}
 *****/
			},
		];
		this.addEventListener('click', this._click);
		this._imgUpdate = this._imgUpdate.bind(this);
	}
	_imgUpdate({detail}){
		this.img = detail?.src;
	}
	connectedCallback(){
		super.connectedCallback();
		self.addEventListener('img-edit-src',this._imgUpdate);
	}
	disconnectedCallback(){
		super.disconnectedCallback();
		self.removeEventListener('img-edit-src',this._imgUpdate);
	}
/* filter-function = 
  blur()         |
  brightness()   |
  contrast()     |
  drop-shadow()  |
  grayscale()    |
  hue-rotate()   |
  invert()       |
  opacity()      |
  sepia()        |
  saturate()     
 */
	render(){
		return html`
<h3>click an adjustment</h3>
<div>
${ this.list.map((adj,i)=>{
	const { style, name, id } = adj;
	return html`<img style=${style} title=${name} id=${ id } src="${ this.img }" index=${ i }>`;
}) }
</div>
<slot></slot>
		`;
	}
	_click(event){
		const path = event.composedPath();
		const img = path.find(node=>node.matches?.('img'));
		if(!img) return;

		const css = img.getAttribute('style');
		const index = img.getAttribute('index');
		const adjustment = this.list[ index ];
		const detail = {css, adjustment};
		this.dispatchEvent(new CustomEvent('adjustment', {composed: true, detail, bubbles: true}));
		console.warn('needs translation for Ps>',detail);
		this.dispatchEvent(new CustomEvent('relay', {composed: true, detail, bubbles: true, cancelable: true}));
	}
}

customElements.define('cypress-adjustment', CypressAdjustment);
