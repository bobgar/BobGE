var GameObject = Class.extend(
{
	init: function(id) 
	{
		this.id = id;
		this.gl = BobGE.inst.gl;
		this.components = new Array();
		
		this.rotation = quat.create();
		this.position = vec4.create();
	},
	addComponent: function(c)
	{
		c.owner = this;
		this.components[this.components.length] = c;		
	}
});	