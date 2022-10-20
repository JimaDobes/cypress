const Preset = {
	fn({preset}){
		const { name = '?', id = '', ps } = preset;
		console.warn(`preset>`,{name,id,ps});
		this.updateLayers({name, id, adjust: ps});
	}

	,updateLayers(preset){
		const {name, id, adjust} = preset;
		const groupName = 'preset-group';
		const layer = ps.findLayerBy({ key:'name' , value:groupName});
		return ps.executeAsModal( this.updateLayersTask, {commandName: `create preset "${ name }"`, descriptor: { layer, preset, groupName }})
			.then(this.updateLayersOk)
			.catch(this.updateLayersFail)
			;
	}

	,updateLayersTask(context, descriptor){
		const {layer={_docId:-1,_id:-1}, preset, groupName } = descriptor;
		
		const {adjust, name, id} = preset;

		if(!layer && !adjust.length){
			return Promise.resolve({preset, groupName, layer: null, adjustments: []});
		}

		return (	layer && layer._id > -1 ? 
			Promise.resolve(layer)
			: Preset.createLayerGroup(groupName)
			)
			.then(lyr=>{
				const { _id } = lyr;
				// fix for PS-91385 where reference isn't the actual new layer
				const layer = ps.findLayerBy({key:'_id', value:_id})
				// clear whatever is there
				// console.warn(`TODO reset all the presets UI: adjustments.layers = null`, {layer});
				layer.layers.map(lyr=>lyr.delete());
				// give group layer focus so the new layers are created inside it
				layer.selected = true;

				if(!adjust.length && name === 'reset'){
					layer.delete();
					return ({preset, groupName, layer: null, adjustments: []});
				}
				
				return ps.batchPlay([
				{ "_obj": "select", "_target": [{ "_ref": "layer", "_id": _id }] }
				])
				.then(()=>{
					const adjustments = adjust.map(ps.createAdjustmentLayer);
					const detail = {adjustments, layer, preset, groupName};

					return ps.batchPlay( adjustments )
					.then(result=>{
						layer.layers.forEach((lyr,i)=>{
							// adjustments and layers are in opposite order (not sure why)
							const index = adjustments.length - 1 - i;
							const adjustment = adjustments[index];
							const { type } = adjustment.using;
							// derive a name for the layer (that shows) from the type
							const name = type._obj ?? type._class ?? lyr.name;
							lyr.name = name;
							const {_id, _docId, kind } = lyr;
							adjustment.layer = {_id, _docId, name, kind};
							lyr.selected = false;
						});
						layer.selected = true;
						return detail;
					})
					;
				})
				;
			}) 
			;
	}

	,createLayerGroup(name){
		return photoshop.app.activeDocument.createLayerGroup({name})
		.then(lyr=>{
			ps.batchPlay([
        // create masks for entire group
				// NOTE: Below requires document selection dance to work on non-active documents
        {
          _obj: "make",
          at: { _enum: "channel", _ref: "channel", _value: "mask" },
          new: { _class: "channel" },
          using: { _enum: "userMaskEnabled", _value: "revealAll" },
        },
        {
          _obj: "make",
          _target: [{ _ref: "path" }],
          at: { _ref: "path", _enum: "path", _value: "vectorMask" },
          using: { _enum: "vectorMaskEnabled", _value: "revealAll" },
          _isCommand: true,
        },
        // NOTE cannot add adjustment layers to a collapsed group, so have to keep this open and disabled
        //{ "_obj": "collapseAllGroupsEvent", "_isCommand": true, "_options": { "dialogOptions": "dontDisplay" } }
      ]);
			return lyr;
		})
	}


};
ps.preset = Preset.fn.bind(Preset);
