var Component = Class.extend(
{
	init: function() 
	{
		this.gl = BobGE.inst.gl;
	}
});

var BasicCameraController = Component.extend(
{
	init: function()
	{		
		this.pitch = 0;
		this.yaw = 0;
		this.speed = 1;
		this._super();
	},
	update: function()
	{			
		var q = quat.create();
		quat.invert(q, this.owner.rotation);
		if (BobGE.inst.keysDown[87]) 
		{
			var movement = vec3.fromValues(0, 0, 1);
			vec4.transformQuat(movement, movement, q);
			vec4.scale(movement, movement, this.speed);
			vec4.add(this.owner.position, this.owner.position, movement);
		}
		if (BobGE.inst.keysDown[83]) 
		{
			var movement = vec3.fromValues(0, 0, -1);
			vec4.transformQuat(movement, movement, q);
			//vec4.scale(movement, movement, this.speed);
			vec4.add(this.owner.position, this.owner.position, movement);
		}
		if (BobGE.inst.keysDown[65]) 
		{
			var movement = vec3.fromValues(1, 0, 0);
			vec4.transformQuat(movement, movement, q);
			vec4.scale(movement, movement, this.speed);
			vec4.add(this.owner.position, this.owner.position, movement);
		}
		if (BobGE.inst.keysDown[68]) 
		{
			var movement = vec3.fromValues(-1, 0, 0);
			vec4.transformQuat(movement, movement, q);
			vec4.scale(movement, movement, this.speed);
			vec4.add(this.owner.position, this.owner.position, movement);
		}
		
		if(BobGE.inst.mouseDown)
		{			
			this.yaw += BobGE.inst.mouseDeltaX * .01;
			this.yaw = this.yaw % 6.283
			this.pitch += BobGE.inst.mouseDeltaY * .01;
			this.pitch = this.pitch % 6.283
		}		
		
		/*if (BobGE.inst.keysDown[37]) {
		  // Left cursor key
		  this.yaw += -.05;
		  //quat.rotateY(this.owner.rotation, this.owner.rotation, -.05 );
		}
		if (BobGE.inst.keysDown[39]) {
		  // Right cursor key
		  this.yaw += +.05;
		  //quat.rotateY(this.owner.rotation, this.owner.rotation, .05 );
		}
		if (BobGE.inst.keysDown[38]) {
		  // Up cursor key
		  this.pitch += -.05;
		  //quat.rotateX(this.owner.rotation, this.owner.rotation, -.05 );
		}
		if (BobGE.inst.keysDown[40]) {			
		  // Down cursor key
		  this.pitch += .05;
		  //quat.rotateX(this.owner.rotation, this.owner.rotation, .05 );
		}*/
		 
		var q = quat.create();
		quat.rotateX(this.owner.rotation, q, this.pitch);
		quat.rotateY(this.owner.rotation, this.owner.rotation, this.yaw);
		
		var iq = quat.create();
		var cd = vec3.fromValues(0, 0, -1);
		quat.invert(iq, this.owner.rotation);
		vec3.transformQuat(this.owner.dir, cd, iq)
		
		/*if(BobGE.inst.mouseDeltaX != 0)
			quat.rotateY(this.owner.rotation, this.owner.rotation, .05 * BobGE.inst.mouseDeltaX);
		if(BobGE.inst.mouseDeltay != 0)
			quat.rotateX(this.owner.rotation, this.owner.rotation, .05 * BobGE.inst.mouseDeltaY);*/
	
	}
});

//Basic Camera Controller + Pl
var PlayerCameraController = Class.extend(
{
	update: function()
	{
		if(BobGE.inst.mouseDown)
		{
			
		}
	}
});

/**
*  Constant Euler style rotations.
*  Note, the x,y,z rotations are in radians per second.
**/
var ConstantRotationComponent = Component.extend({
	init: function(x, y, z)
	{	
		this._super();
		//set rotations with defaulting
		this.x = typeof x != 'undefined' ? x : 0;
		this.y = typeof x != 'undefined' ? y : 0;
		this.z = typeof x != 'undefined' ? z : 0;		
		//document.onkeyup = handleKeyUp.bind(this);
	},
	update: function(elapsed)
	{
		//apply the appropriate amoutn of rotation based on elapsed time.
		quat.rotateX(this.owner.rotation, this.owner.rotation, this.x);				
		quat.rotateY(this.owner.rotation, this.owner.rotation, this.y);
		quat.rotateZ(this.owner.rotation, this.owner.rotation, this.z);	
		this.owner.dirty = true;
	}
});

var ConstantMovementComponent = Component.extend({
	init: function(x, y, z)
	{	
		this._super();
		//set rotations with defaulting
		this.x = typeof x != 'undefined' ? x : 0;
		this.y = typeof x != 'undefined' ? y : 0;
		this.z = typeof x != 'undefined' ? z : 0;		
		//document.onkeyup = handleKeyUp.bind(this);
	},
	update: function(elapsed)
	{
		//apply the appropriate amoutn of rotation based on elapsed time.
		this.owner.position[0] += this.x;	
		this.owner.position[1] += this.y;	
		this.owner.position[2] += this.z;	
		this.owner.dirty = true;
	}
});

var TexturedMeshComponent = Component.extend({
	init: function(id)
	{
		this._super();		
		
		//Create the static buffers for the geometry represented by this mesh if it doesn't exist.
		if(! BobGE.inst.vertexBuffers[id])
			BobGE.inst.vertexBuffers[id] = this.gl.createBuffer();
		if(! BobGE.inst.uvBuffers[id])	
			BobGE.inst.uvBuffers[id] = this.gl.createBuffer();
		if(!BobGE.inst.normalsBuffers[id])
			BobGE.inst.normalsBuffers[id] = new Object();				
		if(! BobGE.inst.triangleBuffers[id])	
			BobGE.inst.triangleBuffers[id] = this.gl.createBuffer();	
		if(!BobGE.inst.textureInstanceDictionaries[id])
			BobGE.inst.textureInstanceDictionaries[id] = new Object();		
		
	},
	
	drawInstances: function(mvMatrix, pMatrix, cameraMatrix, id)
	{
		var shader = BobGE.inst.shaderProgram;
		var gl = BobGE.inst.gl;
		
		//These three main buffers will be the same for every instance of the given object!
	
		//load the objects vertex buffer into memory
		gl.bindBuffer(gl.ARRAY_BUFFER, BobGE.inst.vertexBuffers[id]);
		gl.vertexAttribPointer(shader.vertexPositionAttribute, BobGE.inst.vertexBuffers[id].itemSize, gl.FLOAT, false, 0, 0);
		
		//load the objects UV map into memory
		gl.bindBuffer(gl.ARRAY_BUFFER, BobGE.inst.uvBuffers[id]);
		gl.vertexAttribPointer(shader.textureCoordAttribute, BobGE.inst.uvBuffers[id].itemSize, gl.FLOAT, false, 0, 0);		
		
		//load the objects normal buffers.
		gl.bindBuffer(gl.ARRAY_BUFFER, BobGE.inst.normalsBuffers[id]);
		gl.vertexAttribPointer(shader.vertexNormalAttribute, BobGE.inst.normalsBuffers[id].itemSize, gl.FLOAT, false, 0, 0);
	
		//loads the triangle buffer into memory
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BobGE.inst.triangleBuffers[id]);		
		
		for(var i in BobGE.inst.textureInstanceDictionaries[id])
		{
			var tid = BobGE.inst.textureInstanceDictionaries[id]; 
			//load the texture in once for all instance which share the same texture!
			gl.bindTexture(gl.TEXTURE_2D, BobGE.inst.textures[i]);
			gl.uniform1i(shader.samplerUniform, 0);
			for(var j = 0; j < tid[i].length; ++j)
			{
				var obj = tid[i][j].owner;				
				mat4.multiply(mvMatrix, cameraMatrix, obj.cachedMat);
				
				gl.uniformMatrix4fv(shader.pMatrixUniform, false, pMatrix);
				gl.uniformMatrix4fv(shader.mvMatrixUniform, false, mvMatrix);
				gl.drawElements(gl.TRIANGLES, BobGE.inst.triangleBuffers[id].numItems, gl.UNSIGNED_SHORT, 0);
			}
		}
	},
	
	draw: function(mvMatrix, pMatrix, cameraMatrix)
	{
		//grab the object
		var obj = this.owner;
		var shader = BobGE.inst.shaderProgram;
		//Generate the 4x4 matrix representing position / rotation	
		mat4.multiply(mvMatrix, cameraMatrix, this.owner.cachedMat);		
		
		//load the objects vertex buffer into memory
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.vertexAttribPointer(shader.vertexPositionAttribute, this.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		
		//load the objects UV map into memory
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
		this.gl.vertexAttribPointer(shader.textureCoordAttribute, this.uvBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		
		//load the objects texture into memory
		//this.gl.activeTexture(this.gl.TEXTURE0);
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
	loadTexture: function(tex, id)
	{
		var tid = BobGE.inst.textureInstanceDictionaries[id];
		
		if(!tid[tex])
			tid[tex] = new Array();
		tid[tex][tid[tex].length] = this;
		
		if(BobGE.inst.textures[tex])
		{
			this.texture = BobGE.inst.textures[tex];			
			return;
		}
		log("load tex");
		this.texture = this.gl.createTexture();
		this.texture.image = new Image();
		this.texture.image.onload = this.textureLoaded.bind(this);
		this.texture.image.src = tex;  
		BobGE.inst.textures[tex] = this.texture;
	},
	textureLoaded: function()
	{	
		log("tex loaded");
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		//this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.texture.image);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
		this.gl.generateMipmap(this.gl.TEXTURE_2D);
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.texture.loaded = true;		
	}
});

var TexturedCubeComponent = TexturedMeshComponent.extend({
	init: function()
	{
		var	id = "Cube";
		TexturedCubeComponent.prototype.id = id;
		this._super(id);
		
		if(! BobGE.inst.instancedMeshes[id])
			BobGE.inst.instancedMeshes[id] = TexturedCubeComponent.prototype;
		
		if(!TexturedCubeComponent.prototype.buffersInitialized)
		{
			this.initializeBuffers();
			TexturedCubeComponent.prototype.buffersInitialized = true;
		}
	},
	loadTexture: function(tex)
	{
		this._super(tex, TexturedCubeComponent.prototype.id);
	},
	initializeBuffers: function()
	{		
		var id = TexturedCubeComponent.prototype.id;
		var vb = BobGE.inst.vertexBuffers[id] = this.gl.createBuffer();
		var uv = BobGE.inst.uvBuffers[id] = this.gl.createBuffer();
		var tb = BobGE.inst.triangleBuffers[id] = this.gl.createBuffer();
		var vn = BobGE.inst.normalsBuffers[id] = this.gl.createBuffer();
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
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vb);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		vb.itemSize = 3;
		vb.numItems = 24;	
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
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, uv);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureMap), this.gl.STATIC_DRAW);
		uv.itemSize = 2;
		uv.numItems = 24;
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
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, tb);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), this.gl.STATIC_DRAW);		
		tb.itemSize = 1;
		tb.numItems = 36;
		//Set up the normal map
		var vertexNormals = [      
			0.0,  0.0,  1.0, 0.0,  0.0,  1.0, 0.0,  0.0,  1.0, 0.0,  0.0,  1.0,// Front face
			0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0,// Back face
			0.0,  1.0,  0.0, 0.0,  1.0,  0.0, 0.0,  1.0,  0.0, 0.0,  1.0,  0.0,// Top face
			0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0,// Bottom face
			1.0,  0.0,  0.0,	1.0,  0.0,  0.0,	1.0,  0.0,  0.0, 1.0,  0.0,  0.0,// Right face
			-1.0,  0.0,  0.0,-1.0,  0.0,  0.0,-1.0,  0.0,  0.0,-1.0,  0.0,  0.0,// Left face
		];
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vn);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);
		vn.itemSize = 3;
		vn.numItems = 24;
		
		/*this.prototype.vertexBuffer = this.vertexBuffer;
		this.prototype.uvBuffer = this.uvBuffer;
		this.prototype.triangleBuffer = this.triangleBuffer;*/
	}
});

var TexturedPlaneComponent = TexturedMeshComponent.extend({
	init: function(textureRepeat)
	{
		var	id = "Plane";
		TexturedPlaneComponent.prototype.id = id;
		this._super(id);
		
		if(! BobGE.inst.instancedMeshes[id])
			BobGE.inst.instancedMeshes[id] = TexturedPlaneComponent.prototype;
		
		if(!TexturedPlaneComponent.prototype.buffersInitialized)
		{
			this.initializeBuffers(textureRepeat);
			TexturedPlaneComponent.prototype.buffersInitialized = true;
		}
	},
	loadTexture: function(tex)
	{
		this._super(tex, TexturedPlaneComponent.prototype.id);
	},
	initializeBuffers: function(textureRepeat)
	{		
		var id = TexturedPlaneComponent.prototype.id;
		var vb = BobGE.inst.vertexBuffers[id] = this.gl.createBuffer();
		var uv = BobGE.inst.uvBuffers[id] = this.gl.createBuffer();
		var tb = BobGE.inst.triangleBuffers[id] = this.gl.createBuffer();
		var vn = BobGE.inst.normalsBuffers[id] = this.gl.createBuffer();
		log("init vertex buffer");
		//Set up the vertex buffer		
		var vertices = [
			-1.0,  0.0, -1.0,	-1.0,  0.0,  1.0,	1.0,  0.0,  1.0,	1.0,  0.0, -1.0,	// groundplane
        ];
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vb);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		vb.itemSize = 3;
		vb.numItems = 4;	
		log("init UV Map");
		//Set up the UV Map
		var textureMap = [
          0.0, textureRepeat,		0.0, 0.0,	textureRepeat, 0.0,	textureRepeat, textureRepeat, // Top face          
        ];
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, uv);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureMap), this.gl.STATIC_DRAW);
		uv.itemSize = 2;
		uv.numItems = 4;
		log("init triangle Map");
		//Set up the triangle map
		var triangles = [
            0, 1, 2,      0, 2, 3,    // Front face
        ];
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, tb);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), this.gl.STATIC_DRAW);		
		tb.itemSize = 1;
		tb.numItems = 6;
				
		var vertexNormals = [  
		0.0,  1.0,  0.0, 0.0,  1.0,  0.0, 0.0,  1.0,  0.0, 0.0,  1.0,  0.0,// Top face
		];
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vn);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);
		vn.itemSize = 3;
		vn.numItems = 4;
	}
});

