var GameObject = Class.extend(
{
	init: function() 
	{
		this.components = new Array();
		this.buffer = BobGE.inst.gl.createBuffer();
		this.rotation = quat.create();
		this.position = vec4.create();
	},
	addComponent: function(c)
	{
		this.components[this.components.length] = c;
		c.owner = this;
	}
});

var Cube = GameObject.extend(
{
	init: function() 
	{	
		var bge = BobGE.inst;
		this._super();
		
		bge.gl.bindBuffer(bge.gl.ARRAY_BUFFER, this.buffer);
		var vertices = [
				// Front face
				-1.0, -1.0,  1.0,
				 1.0, -1.0,  1.0,
				 1.0,  1.0,  1.0,
				-1.0,  1.0,  1.0,

				// Back face
				-1.0, -1.0, -1.0,
				-1.0,  1.0, -1.0,
				 1.0,  1.0, -1.0,
				 1.0, -1.0, -1.0,

				// Top face
				-1.0,  1.0, -1.0,
				-1.0,  1.0,  1.0,
				 1.0,  1.0,  1.0,
				 1.0,  1.0, -1.0,

				// Bottom face
				-1.0, -1.0, -1.0,
				 1.0, -1.0, -1.0,
				 1.0, -1.0,  1.0,
				-1.0, -1.0,  1.0,

				// Right face
				 1.0, -1.0, -1.0,
				 1.0,  1.0, -1.0,
				 1.0,  1.0,  1.0,
				 1.0, -1.0,  1.0,

				// Left face
				-1.0, -1.0, -1.0,
				-1.0, -1.0,  1.0,
				-1.0,  1.0,  1.0,
				-1.0,  1.0, -1.0
			];	
		bge.gl.bufferData(bge.gl.ARRAY_BUFFER, new Float32Array(vertices), bge.gl.STATIC_DRAW);
		this.buffer.itemSize = 3;
		this.buffer.numItems = 24;		
	}
});