/*
ESModules only load in the browser--they're not supported in PS
- events in both PS and browsers are the intermediary between loading and handling functionality
 */
class Layer{
	constructor(){
		this.layers = [];
		this._id = -1;
		this.kind = 'fake';
		this.name = '';
		this.selected = false;
	}
	delete(){
		console.log(`layer[_id:${ this._id }].delete()`);
	}
}

class Document{
	constructor(){
		this._id = -1;
		this.layers = [new Layer()];
	}
	createLayerGroup(config){
		const layer = new Layer();
		return Promise.resolve(Object.assign(layer, config, {kind:'group'}));
	}
}

const Ps = {
	document: new Document

};

const photoshop = {
	action: {
		addNotificationListener(list, handler){
			list.forEach(({event})=>{
				globalThis.addEventListener(event, handler);
			});
		}
		,batchPlay(commands, options){
			return Promise.resolve({unknown:'faked'});
		}
	}
	,app: {
		showAlert(message){
			alert(message);
		}
		,activeDocument: new Proxy(
			Ps.document, {
			get(target, key, pxy){
				console.warn(`activeDocument.${ key }`);
				return target[ key ] ?? {};
			},
			set(target, key, val, pxy){
				target[ key ] = val;
				return true;
			}
		})
	}
	,constants: {
		LayerKind: {F:'B'}
	}
	,core: {
		executeAsModal(command, options){
			const {descriptor, ...config} = options;
			return command(config, descriptor);
		}
	}
};
globalThis.photoshop = photoshop;
export { Ps, photoshop, Layer, Document };
