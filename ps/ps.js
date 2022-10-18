/* https://developer.adobe.com/photoshop/uxp/2022/ps_reference/classes/layer/
 */
function evented(list, handler, target=self){
	list.trim().split(/[\s,]+/).forEach(type=>{ if(type) target.addEventListener(type, handler) });
}
// PS events
evented(`$All open close select`, _handler);
// regular DOM events
evented(`load, DOMContentLoaded`, _event);
/*
 * DOM event handler signature like
	handler({type, detail, ...others})
 * Ps event handler signature like
	handler(type='type', detail={...varies})
 */

function _event({type, detail, ps = false}){
	if(ps.debug || globalThis.debug) console.log({'✣': `${ ps ? '*':'' }{type,...detail}`, type, ...detail});
}
function _handler(type='?', detail={}){
	_event({type, detail, ps: true});
}

const ps = {
	init(){
		const { photoshop } = this;
		if(!photoshop) return console.warn(`no globalThis.photoshop`);
	},
	get photoshop(){
		let { photoshop, require } = globalThis;
		if(!photoshop && require){
			photoshop = require('photoshop');
			globalThis.photoshop = photoshop;
		}
		return photoshop;
	},
// convenience
	get $(){
		return photoshop.app.activeDocument;
	},
	get $$(){
		return Array.from(ps.$.activeLayers);
	},
	get _(){
		return Array.from(this.$.layers);
	},
	get LayerKind(){
		return photoshop.constants.LayerKind;
	},
	get layerKind(){
		return Object.values(ps.LayerKind).sort();
	},

	actionEventListener(events, handler) {
		photoshop.action.addNotificationListener(events, handler);
	},

	findKeyValue(layer, i){
		const { key, value } = this;
		return layer[key] === value;
	},
	layerReducer(config, layer){
		const {list, finder=null, all=true, search} = config;

		if(!all && list.length) return config;

		if(!finder || finder.call(search, layer) ){
			list.push(layer);
		}

		const { layers } = layer;
		if(layers){
			layers.reduce(ps.layerReducer, config);
		}
		return config;
	},
	/* 	{key: '_id', value: 12},
		{key: 'name', value: 'layer 1'}, 
		{finder: (layer)=>{ return layer.name.includes('Special'); }}
	 */
	findLayerBy(search={}){
		const {all=false, finder=ps.findKeyValue, layers=photoshop.app.activeDocument.layers} = search;
		const { list } = layers.reduce(ps.layerReducer, {list: [], finder, all, search});
		return all ? list : list[0];
	},
	cmd(work, options){
		return this.executeAsModal(function executeAsModal(){
			return ps.batchPlay(work, options);
		}, options);
	},
	executeAsModal(fn, options){
		const opt = {commandName: 'running in modal', descriptor: null, ...options};
		return photoshop.core.executeAsModal(fn, opt);
	},
	// https://developer.adobe.com/photoshop/uxp/ps_reference/media/advanced/batchplay/
	batchPlay(commands, options={}){
		if(!Array.isArray(commands)){
			commands = [commands];
		}
		// .flat avoids throwing on incidental sub-arrays, returns new array
		return photoshop.action.batchPlay(commands.flat(5), options);
	},
	/* type 'adjustmentLayer', 'TODO', 'opacity', 1, 23
@arg { string } kind from photoshop.contstants.LayerKind: blackAndWhite, brightnessContrast, channelMixer, colorBalance, colorLookup, curves, exposure, gradientFill, gradientMap, group, hueSaturation, inversion, levels, pattern, photoFilter, pixel, posterize, selectiveColor, smartObject, solidColor, text, threeD, threshold, vibrance, video
@arg { object } changes dictionary to spread onto the 'to' hash (eg record Actions for changing adjustment layers for these values)
@arg { number } layer_id for the layer _id number
	 */
	updateAdjustmentLayer({kind, changes, id}){
		return {
			_obj: 'set', 
/* 	// currently selected layer
			_target: [{_ref: 'adjustmentLayer', "_enum": "ordinal", "_value": "targetEnum"}]
	// specific layer
			_target: [{_ref: 'adjustmentLayer', _id: 123}], */
			_target: [{_ref: 'adjustmentLayer', _id: id}],
			to: { _obj: kind, useLegacy: false, ...changes },
		};
	},
	/* updateAdjustmentLayers({kind: 'TODO', adjust: {any}, id: 123}) */
	updateAdjustmentLayers(...items){
		// https://developer.adobe.com/photoshop/uxp/ps_reference/media/advanced/batchplay/
		return ps.batchPlay( items.map(ps.updateAdjustmentLayer) );
	},
	createAdjustmentLayer(item){
		return {
			_obj: "make",
			_target: [ { "_ref": "adjustmentLayer" } ],
			using: { "_obj": "adjustmentLayer", },
			...item
		};
	},
	createAdjustmentLayers(...items){
		return ps.batchPlay( items.map(ps.createAdjustmentLayer) );
	},
	// currently only does expand/collapse
	toggleGroupLayer(_id=-1){
		const photoshop = this.photoshop;
		photoshop.action.batchPlay([

		    { _obj: "multiGet", _target: {_ref: "layer", _id}, extendedReference: [[
			   "layerSectionExpanded"
		    ]] }
		], {}).then(([{layerSectionExpanded}])=>{

		console.log(`before toggling:`,{_id, layerSectionExpanded});
		layerSectionExpanded = !layerSectionExpanded;
		return photoshop.core.executeAsModal(function _executeAsModal(context, descriptor){
			return photoshop.action.batchPlay([{
				_obj: "set",
				_target: [{ _ref: "property", _property: "layerSectionExpanded" }, { _ref: "layer", _id }],
				to: layerSectionExpanded
			}], {}).then(res=>{
				return descriptor;
			}).catch(console.error);
		},
		{ commandName: 'toggle group layer expanded', descriptor: {layerSectionExpanded, _id} }
		);

		}).then(console.log).catch(console.error);

	}
};

globalThis.ps = ps;
