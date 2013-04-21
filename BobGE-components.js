var Component = Class.extend(
{
	init: function() 
	{
		this.gl = BobGE.inst.gl;
	},
	update: function(elapsed)
	{
	}
});

/**
*  Constant Euler style rotations.
*  Note, the x,y,z rotations are in radians per second.
**/
var ConstantRotationComponent = Component.extend({
	init: function(x, y, z)
	{	
		//set rotations with defaulting
		this.x = typeof x != 'undefined' ? x : 0;
		this.y = typeof x != 'undefined' ? y : 0;
		this.z = typeof x != 'undefined' ? z : 0;		
		//document.onkeyup = handleKeyUp.bind(this);
	},
	update: function(elapsed)
	{
		if (BobGE.inst.keysDown[33]) {
		  // Page Up
		  this.owner.position[2] -= 0.05;
		}
		if (BobGE.inst.keysDown[34]) {
		  // Page Down
		  this.owner.position[2] += 0.05;
		}
		if (BobGE.inst.keysDown[37]) {
		  // Left cursor key
		  this.y -= 1;
		}
		if (BobGE.inst.keysDown[39]) {
		  // Right cursor key
		  this.y += 1;
		}
		if (BobGE.inst.keysDown[38]) {
		  // Up cursor key
		  this.x -= 1;
		}
		if (BobGE.inst.keysDown[40]) {
		  // Down cursor key
		  this.x += 1;
		}
	
		//calculate percentage of a second that has passed
		var p = elapsed / 1000.0 ;
		//apply the appropriate amoutn of rotation based on elapsed time.
		quat.rotateX(this.owner.rotation, this.owner.rotation, this.x * p);		
		quat.rotateY(this.owner.rotation, this.owner.rotation, this.y * p);
		quat.rotateZ(this.owner.rotation, this.owner.rotation, this.z * p);
	}
});

var TexturedMeshComponent = Component.extend({
	init: function(x, y, z)
	{	
		this._super();
		this.vertexBuffer = this.gl.createBuffer();
		this.uvBuffer = this.gl.createBuffer();
		this.triangleBuffer = this.gl.createBuffer();		
		this.texture = this.gl.createTexture();
	},
	update: function(elapsed)
	{
	},
	draw: function(mvMatrix, pMatrix)
	{
		//grab the object
		var obj = this.owner;
		var shader = BobGE.inst.shaderProgram;
		//Generate the 4x4 matrix representing position / rotation
		//TODO this should be cached on the object and only updated when rotated
		//(moves can be done easily by hand, and updating this every draw will be expensive).
		mat4.fromRotationTranslation(mvMatrix, obj.rotation, obj.position);	
		//load the objects vertex buffer into memory
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.vertexAttribPointer(shader.vertexPositionAttribute, this.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		
		//load the objects UV map into memory
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
		this.gl.vertexAttribPointer(shader.textureCoordAttribute, this.uvBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		
		//load the objects texture into memory
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.uniform1i(shader.samplerUniform, 0);
		
		//load the objects triangle buffer into memory
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
		//Load the matricies into the shaders
		this.gl.uniformMatrix4fv(shader.pMatrixUniform, false, pMatrix);
		this.gl.uniformMatrix4fv(shader.mvMatrixUniform, false, mvMatrix);
		//Draw the object
		this.gl.drawElements(this.gl.TRIANGLES, this.triangleBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
	},
	loadTexture: function(tex)
	{
		log("load tex");
		this.texture.image = new Image();
		this.texture.image.onload = this.textureLoaded.bind(this);
		this.texture.image.src = tex;  
	},
	textureLoaded: function()
	{	
		log("tex loaded");
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.texture.image);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
		this.gl.generateMipmap(this.gl.TEXTURE_2D);
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
	}
});

var TexturedCubeComponent = TexturedMeshComponent.extend({
	init: function(x, y, z)
	{	
		this._super();
		this.initializeBuffers();
	},
	initializeBuffers: function()
	{		
		log("init vertex buffer");
		//Set up the vertex buffer		
		var vertices = [            
            -1.0, -1.0,  1.0,	1.0, -1.0,  1.0,	1.0,  1.0,  1.0,	-1.0,  1.0,  1.0,	// Front face            
            -1.0, -1.0, -1.0,	-1.0,  1.0, -1.0,	1.0,  1.0, -1.0,	1.0, -1.0, -1.0,	// Back face
			-1.0,  1.0, -1.0,	-1.0,  1.0,  1.0,	1.0,  1.0,  1.0,	1.0,  1.0, -1.0,	// Top face
			-1.0, -1.0, -1.0,	1.0, -1.0, -1.0,	1.0, -1.0,  1.0,	-1.0, -1.0,  1.0,	// Bottom face
			1.0, -1.0, -1.0,	1.0,  1.0, -1.0,	1.0,  1.0,  1.0,	1.0, -1.0,  1.0,	// Right face
			-1.0, -1.0, -1.0,	-1.0, -1.0,  1.0,	-1.0,  1.0,  1.0,	-1.0,  1.0, -1.0,	// Left face
        ];
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		this.vertexBuffer.itemSize = 3;
		this.vertexBuffer.numItems = 24;	
		log("init UV Map");
		//Set up the UV Map
		var textureMap = [
          0.0, 0.0,		1.0, 0.0,	1.0, 1.0,	0.0, 1.0, // Front face
          1.0, 0.0,		1.0, 1.0,	0.0, 1.0,	0.0, 0.0, // Back face
          0.0, 1.0,		0.0, 0.0,	1.0, 0.0,	1.0, 1.0, // Top face
          1.0, 1.0,		0.0, 1.0,	0.0, 0.0,	1.0, 0.0, // Bottom face
          1.0, 0.0,		1.0, 1.0,	0.0, 1.0,	0.0, 0.0, // Right face          
          0.0, 0.0,		1.0, 0.0,	1.0,1.0,	0.0, 1.0, // Left face
        ];
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureMap), this.gl.STATIC_DRAW);
		this.uvBuffer.itemSize = 2;
		this.uvBuffer.numItems = 24;
		log("init triangle Map");
		//Set up the triangle map
		var triangles = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), this.gl.STATIC_DRAW);		
		this.triangleBuffer.itemSize = 1;
		this.triangleBuffer.numItems = 36;
	}
});

