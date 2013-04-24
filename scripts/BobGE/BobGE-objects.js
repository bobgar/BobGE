var GameObject = Class.extend(
{
	init: function(id) 
	{
		this.id = id;
		this.gl = BobGE.inst.gl;
		this.components = new Array();
		this.drawableComponents = new Array();
		this.updateableComponents = new Array();
		
		this.rotation = quat.create();
		this.position = vec4.create();
		//in some ways scale is out of place here since objects are points, 
		//but because I cache transforms on the object right now it makes the most sense.
		this.scale = vec3.create();
		this.scale[0] = 1; this.scale[1] = 1; this.scale[2] = 1;	
		this.dirty = true;
		this.cachedMat = mat4.create();
	},
	updateCachedMat: function()
	{
		mat4.fromRotationTranslation(this.cachedMat, this.rotation,  this.position);
		mat4.scale(this.cachedMat, this.cachedMat, this.scale);
	},
	addComponent: function(c)
	{
		c.owner = this;
		this.components[this.components.length] = c;	
		if(c.draw)
			this.drawableComponents[this.drawableComponents.length] = c;
		if(c.update)
			this.updateableComponents[this.updateableComponents.length] = c;
	}
});	