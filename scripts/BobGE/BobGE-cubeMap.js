var CubeMap = Component.extend(
{	
	init: function(chunkXSize, chunkYSize, chunkZSize, chunkDrawDistance, seed)
	{
		this.perlin = new SimplexNoise();
		this.gl = BobGE.inst.gl;
		this.chunkXSize = chunkXSize ? chunkXSize : 16;
		this.chunkYSize = chunkYSize ? chunkYSize : 16;
		this.chunkZSize = chunkXSize ? chunkZSize : 16;
		this.chunkDrawDistance = chunkDrawDistance ? chunkDrawDistance : 4
		this.seed = seed ? seed : Math.random();
		//TODO an associative array is not the ideal way to store this.
		this.chunkMap = new Object();
		
		this.ground = new Array(this.chunkDrawDistance*2+1)
		for(var i = 0; i < this.ground.length; ++i)
		{
			this.ground[i] = new Array(this.chunkDrawDistance*2+1);
			for(var j = 0; j < this.ground[i].length; ++j)
			{
				this.ground[i][j] = new GameObject("ground"+i+","+j);					
				this.ground[i][j].scale[0] = this.chunkXSize;
				this.ground[i][j].scale[2] = this.chunkZSize;
				this.ground[i][j].position[1] = -1;
				
				this.ground[i][j].position[0] = (i-this.chunkDrawDistance) * (this.chunkXSize*2.0) - 1;
				this.ground[i][j].position[2] = (j-this.chunkDrawDistance) * (this.chunkZSize*2.0) - 1;
				
				var texturePlaneComponent = new TexturedPlaneComponent(this.chunkXSize);
				texturePlaneComponent.loadTexture("assets/Water.jpg");	
				this.ground[i][j].addComponent( texturePlaneComponent );	
				BobGE.inst.addObject(this.ground[i][j]);
			}
		}
		
		//this.initShaders();
		
		this.referenceCube = new TexturedCubeComponent();		
		
		BobGE.inst.instancedMeshes["CubeMap"] = CubeMap.prototype;
		CubeMap.inst = this;
	},
	
	
	update: function()
	{
		//this.lastChunkX = this.curChunkX ;
		//this.lastChunkZ = this.curChunkZ ;
		
		this.curChunkX = -Math.round(BobGE.inst.mainCamera.position[0] / (this.chunkXSize*2.0));
		this.curChunkZ = -Math.round(BobGE.inst.mainCamera.position[2] / (this.chunkZSize*2.0));
		for(var k = -this.chunkDrawDistance; k <=this.chunkDrawDistance ; ++k)
		{
			for(var l = -this.chunkDrawDistance; l <=this.chunkDrawDistance ; ++l)
			{
				var x = (this.curChunkX+k)
				var z = (this.curChunkZ+l);
				if(!this.chunkMap[x+","+z])
				{
					this.chunkMap[x+","+z] = new CubeMapChunk(this, x, z, this.chunkXSize,this.chunkYSize,this.chunkZSize);					
					//log("instantiating chunk "+x+","+z);
				}
				var g = this.ground[k + this.chunkDrawDistance][l + this.chunkDrawDistance];
				g.position[0] = (x) * (this.chunkXSize*2.0) - 1;
				g.position[2] = (z) * (this.chunkZSize*2.0) - 1;
				g.dirty = true;
			}
		}
		/*if(this.lastChunkX != this.curChunkX || this.lastChunkZ != this.curChunkZ)
		{
			
		}*/
	},
	frustrumCulling: function(c)
	{	
		var v1 = vec3.create();
		vec3.add(v1, c.position, BobGE.inst.mainCamera.position);
		vec3.normalize(v1, v1);
		var rd = Math.asin(vec3.dot(v1, BobGE.inst.mainCamera.dir)) ;
		return rd > .75;
	},
	drawInstances: function(mvMatrix, pMatrix, cameraMatrix)
	{
		var id = "Cube";
		//var shader = this.shaderProgram;
		var shader = BobGE.inst.shaderProgram;
		var gl = BobGE.inst.gl;
		
		//These three main buffers will be the same for every instance of the given object!
	
		//load the objects vertex buffer into memory
		gl.bindBuffer(gl.ARRAY_BUFFER, BobGE.inst.vertexBuffers[id]);
		gl.vertexAttribPointer(shader.vertexPositionAttribute, BobGE.inst.vertexBuffers[id].itemSize, gl.FLOAT, false, 0, 0);
		
		//load the objects UV map into memory
		gl.bindBuffer(gl.ARRAY_BUFFER, BobGE.inst.uvBuffers[id]);
		gl.vertexAttribPointer(shader.textureCoordAttribute, BobGE.inst.uvBuffers[id].itemSize, gl.FLOAT, false, 0, 0);		
	
		//loads the triangle buffer into memory
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BobGE.inst.triangleBuffers[id]);
		
		//load the objects normal buffers.
		gl.bindBuffer(gl.ARRAY_BUFFER, BobGE.inst.normalsBuffers[id]);
		gl.vertexAttribPointer(shader.vertexNormalAttribute, BobGE.inst.normalsBuffers[id].itemSize, gl.FLOAT, false, 0, 0);
		
		/*gl.uniform3f(shader.ambientColorUniform,1,1,1);		
		var lightingDirection = [1,-1,1];
		var adjustedLD = vec3.create();
		vec3.normalize(lightingDirection, adjustedLD);
		vec3.scale(adjustedLD, -1);
		gl.uniform3fv(shader.lightingDirectionUniform, adjustedLD);		
		gl.uniform3f(shader.directionalColorUniform, 1, 1, 1);*/
		
		for(var k = -CubeMap.inst.chunkDrawDistance; k <=CubeMap.inst.chunkDrawDistance ; ++k)
		{
			for(var l = -CubeMap.inst.chunkDrawDistance; l <=CubeMap.inst.chunkDrawDistance ; ++l)
			{
				var x = (CubeMap.inst.curChunkX+k)
				var z = (CubeMap.inst.curChunkZ+l);
				var vl = CubeMap.inst.chunkMap[x+","+z].visibleLists;
				for(var i = 0; i < vl.length; ++i)
				{	
					//load the texture in once for all instance which share the same texture!
					if(vl[i].length > 0)
					{			
						gl.bindTexture(gl.TEXTURE_2D, CubeMap.inst.cubeTextureMap[i]);
						gl.uniform1i(shader.samplerUniform, 0);
						
						gl.uniform1i(shader.useLightingUniform, true);
						
						for(var j = 0; j < vl[i].length; ++j)
						{			
							var obj = vl[i][j];
							if(this.frustrumCulling(obj))
							{
								mat4.translate(mvMatrix, cameraMatrix, obj.position);
								//gl.uniform3fv(shader.uTransUniform , false, vl[i][j].pos);
								gl.uniformMatrix4fv(shader.pMatrixUniform, false, pMatrix);
								gl.uniformMatrix4fv(shader.mvMatrixUniform, false, mvMatrix);
								
								var normalMatrix = mat3.create();
								//mat3.fromMat4(normalMatrix, mvMatrix)
								//mat3.invert(normalMatrix, normalMatrix);
								//mat3.transpose(normalMatrix,normalMatrix);
								gl.uniformMatrix3fv(shader.nMatrixUniform, false, normalMatrix);
								
								gl.drawElements(gl.TRIANGLES, BobGE.inst.triangleBuffers[id].numItems, gl.UNSIGNED_SHORT, 0);
							}
						}
					}
				}
			}
		}
	},
	
	setupTextureMap: function(texArray)
	{
		this.cubeTextureMap = new Array(texArray.length);
		for(var i = 0; i < texArray.length; i++)
		{
			this.cubeTextureMap[i] = this.loadTexture(texArray[i]);
			//this.visibleLists[i] = new Array();
		}
	},
	loadTexture: function(tex)
	{
		if(BobGE.inst.textures[tex])
		{
			return BobGE.inst.textures[tex];
		}
		log("load tex");
		var texture = this.gl.createTexture();
		texture.image = new Image();
		texture.image.onload = this.textureLoaded.bind(texture);
		texture.image.src = tex;  
		BobGE.inst.textures[tex] = texture;
		return BobGE.inst.textures[tex];
	},
	textureLoaded: function()
	{	
		log("tex loaded");
		var gl = BobGE.inst.gl;
		gl.bindTexture(gl.TEXTURE_2D, this);
		//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
		this.loaded = true;		
	},
	
	/**
	*  getShader is a helper function used to find and compile the vertex and fragment shaders
	**/
	getShader: function(id) {
		log("Get Shaders!");
		//Assume the shaders we're looking for are on the main dom object.  Get them by ID
		var shaderScript = document.getElementById(id);
		//If not found, return null
		if (!shaderScript) {
			log("Shader not found: " + id);
			return null;
		}
		var shader;
		//Figure out what kind of shader we have, and create the type appropriately
		if (shaderScript.type == "x-shader/x-fragment") {
			log("Found Fragment Shader!");
			shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			log("Found Vertex Shader!");
			shader = this.gl.createShader(this.gl.VERTEX_SHADER);
		} else {		
			return null;
		}
		//strip out unnecessary bits from the source.
		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3) {
				str += k.textContent;
			}
			k = k.nextSibling;
		}
		//define the source and compile the shader
		this.gl.shaderSource(shader, str);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			log(this.gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	},
	initShaders: function(){
		log("Init Shaders!");
		var fragmentShader = this.getShader("shader-fs");
		var vertexShader = this.getShader("shader-cube-vs");

		this.shaderProgram = this.gl.createProgram();
		this.gl.attachShader(this.shaderProgram, vertexShader);
		this.gl.attachShader(this.shaderProgram, fragmentShader);
		this.gl.linkProgram(this.shaderProgram);

		if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
			log("Could not initialise shaders");
		}

		this.gl.useProgram(this.shaderProgram);

		this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
		this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
		
		this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
        this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

		this.shaderProgram.uTransUniform = this.gl.getUniformLocation(this.shaderProgram, "uTrans");
		this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
		this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
		this.shaderProgram.samplerUniform = this.gl.getUniformLocation(this.shaderProgram, "uSampler");
	},
});

var CubeMapChunk = Class.extend(
{
	init: function(cubeMap, x, z, xSize, ySize, zSize)
	{
		this.cubeMap = cubeMap;
		this.x = x;
		this.z = z;
		this.xSize = xSize;
		this.ySize = ySize;
		this.zSize = zSize;
		
		
		
		this.chunk = new Array(xSize);
		for(var i = 0; i < this.xSize; ++i)
		{
			this.chunk[i] = new Array(ySize);
			for(var j = 0; j < this.ySize; ++j)
			{
				this.chunk[i][j] = new Array(zSize);
				for(var k = 0; k < this.zSize; ++k)
				{
					var t = this.cubeMap.perlin.noise3d(i/this.xSize + this.x, j / this.ySize, k/this.zSize + this.z) + (j / this.ySize);
					if(t < -.2)
						this.chunk[i][j][k] = new CubeMapCube(this, i,j,k);
					else
						this.chunk[i][j][k] = new CubeMapCube(this, i,j,k, -1);
				}
			}
		}
		
		this.dropGrass();
		this.determineVisibility();		
	},
	dropGrass: function()
	{
		for(var x = 0; x < this.xSize; ++x)
		{
			for(var z = 0; z < this.zSize; ++z)
			{
				var y = this.ySize-1;
				while(y > 0 && this.chunk[x][y][z].blockType != 0)
					y--;
				if(y != 0)
					this.chunk[x][y][z].blockType = 1;
				//this.chunk[x][0][z].blockType = 1;
			}
		}
	},
	determineVisibility: function()
	{
		//Visible lists, these will get stored by texture
		//By default we assign 10.
		this.visibleLists = new Array(10);
		for(var i = 0; i < 10; ++i)
		{
			this.visibleLists[i] = new Array();
		}
		
		for(var x = 0; x < this.xSize; ++x)
		{
			for(var y = 0; y < this.ySize; ++y)
			{
				for(var z = 0; z < this.zSize; ++z)
				{
					if(this.chunk[x][y][z].blockType == -1)
					{
						if(x+1 < this.xSize)
							this.chunk[x+1][y][z].addVisibleEdge();
						else if(this.cubeMap.chunkMap[(this.x+1) +","+ this.z]) //if the cubemap at x+1 exists
							this.cubeMap.chunkMap[(this.x+1) +","+ this.z].chunk[0][y][z].addVisibleEdge();
						if(x-1 >= 0)
							this.chunk[x-1][y][z].addVisibleEdge();
						else if(this.cubeMap.chunkMap[(this.x-1) +","+ this.z]) //if the cubemap at x+1 exists
							this.cubeMap.chunkMap[(this.x-1) +","+ this.z].chunk[this.xSize-1][y][z].addVisibleEdge();
							
						if(y+1 < this.ySize)
							this.chunk[x][y+1][z].addVisibleEdge();					
						if(y-1 >= 0)
							this.chunk[x][y-1][z].addVisibleEdge();						
							
						if(z+1 < this.zSize)
							this.chunk[x][y][z+1].addVisibleEdge();
						else if(this.cubeMap.chunkMap[this.x+","+(this.z+1)]) //if the cubemap at x+1 exists
							this.cubeMap.chunkMap[this.x+","+(this.z+1)].chunk[x][y][0].addVisibleEdge();		
						if(z-1 >= 0)
							this.chunk[x][y][z-1].addVisibleEdge();
						else if(this.cubeMap.chunkMap[this.x+","+(this.z-1)]) //if the cubemap at x+1 exists
							this.cubeMap.chunkMap[this.x+","+(this.z-1)].chunk[x][y][this.zSize-1].addVisibleEdge();	
					}
					else //This is to check for previously generated chunks bordering this one, since they will need to update visibility on edges which couldn't be done before.
					{
						if(x+1 >= this.xSize && this.cubeMap.chunkMap[(this.x+1) +","+ this.z] && this.cubeMap.chunkMap[(this.x+1) +","+ this.z].chunk[0][y][z].blockType == -1 )
							this.chunk[x][y][z].addVisibleEdge();
						if(x-1 < 0 && this.cubeMap.chunkMap[(this.x-1) +","+ this.z] && this.cubeMap.chunkMap[(this.x-1) +","+ this.z].chunk[this.xSize-1,y,z].blockType == -1 )
							this.chunk[x][y][z].addVisibleEdge();
						if(z+1 >= this.ySize && this.cubeMap.chunkMap[this.x+","+(this.z+1)] && this.cubeMap.chunkMap[this.x+","+(this.z+1)].chunk[x][y][0].blockType == -1 )
							this.chunk[x][y][z].addVisibleEdge();
						if(z-1 < 0 && this.cubeMap.chunkMap[this.x+","+(this.z-1)] && this.cubeMap.chunkMap[this.x+","+(this.z-1)].chunk[x,y,this.zSize-1].blockType == -1 )
							this.chunk[x][y][z].addVisibleEdge();
					}
				}
			}
		}
	},
	addToVisible: function(c)
	{
		this.visibleLists[c.blockType][this.visibleLists[c.blockType].length] = c;
	},
	removeFromVisible: function(c)
	{
		for(var i =0; i < this.visibleLists[c.blockType].length; i++)
		{
			if(this.visibleLists[c.blockType][i] == c)
				this.visibleLists[c.blockType].splice(i, 1);
		}
	},
	removeBlock: function(x,y,z)
	{
		var c = this.chunk[x][y][z];
		if(c.visibleEdges > 0 && c.blockType != -1)
			this.removeFromVisible(c);
		c.blockType = -1;
		
		if(x+1 < this.xSize)
			this.chunk[x+1][y][z].addVisibleEdge();
		if(x-1 >= 0)
			this.chunk[x-1][y][z].addVisibleEdge();
		if(y+1 < this.ySize)
			this.chunk[x][y+1][z].addVisibleEdge();
		if(y-1 >= 0)
			this.chunk[x][y-1][z].addVisibleEdge();
		if(z+1 < this.zSize)
			this.chunk[x][y][z+1].addVisibleEdge();
		if(z-1 >= 0)
			this.chunk[x][y][z-1].addVisibleEdge();
	}
});

var CubeMapCube = Class.extend(
{
	init: function(chunk, x, y, z, blockType)
	{
		this.chunk = chunk;
		//this.pos = vec3.create(x,y,z);
		this.position = vec3.fromValues((x+chunk.x*(chunk.xSize))*2,y*2,(z+chunk.z*(chunk.zSize))*2);
		this.blockType = blockType ? blockType : 0;
		this.visibleEdges = 0;
	},
	changeBlockType: function(bt)
	{
		//log("changing block to "+ bt);
		if(this.blockType != -1 && this.visibleEdges >= 1 )
			this.chunk.removeFromVisible(this);	
		this.blockType = bt;
		if(this.blockType != -1 && this.visibleEdges >= 1 )
			this.chunk.addToVisible(this);		
	},
	addVisibleEdge: function()
	{
		this.visibleEdges++;
		if(this.visibleEdges == 1 && this.blockType != -1)
		{
			this.chunk.addToVisible(this);
		}
	}
});