var CubeMap = Component.extend(
{	
	init: function(chunkXSize, chunkYSize, chunkZSize, chunkDrawDistance, seed, perlinScale)
	{
		this.perlin = new SimplexNoise();
		this.gl = BobGE.inst.gl;
		this.chunkXSize = chunkXSize ? chunkXSize : 16;
		this.chunkYSize = chunkYSize ? chunkYSize : 32;
		this.chunkZSize = chunkZSize ? chunkZSize : 16;
		this.perlinScale = perlinScale ? perlinScale : 32;
		this.chunkDrawDistance = chunkDrawDistance ? chunkDrawDistance : 5
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
		
		this.curChunkX = Math.round((-BobGE.inst.mainCamera.position[0] - this.chunkXSize) / (this.chunkXSize*2.0));
		this.curChunkZ = Math.round((-BobGE.inst.mainCamera.position[2] - this.chunkZSize) / (this.chunkZSize*2.0));
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
				g.position[0] = (x) * (this.chunkXSize*2.0) + (this.chunkXSize) - 1;
				g.position[2] = (z) * (this.chunkZSize*2.0) + (this.chunkXSize) - 1;
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
		if(vec3.length(v1) < 4)//If the object is very close we render it anyway.
			return true;
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
	
	testCollision: function(pos)
	{
		
		var x = (Math.floor((pos[0] / 2.0 )) % this.chunkXSize);
		x = x < 0 ? this.chunkXSize+x : x;
		var y = Math.floor((pos[1]) / 2.0 );		
		var z = (Math.floor((pos[2] / 2.0 ) ) % this.chunkZSize);
		z = z < 0 ? this.chunkZSize+z : z;
		
		var cx = Math.floor(pos[0] / (2 * this.chunkXSize));
		var cz = Math.floor(pos[2] / (2 * this.chunkZSize));
		
		if(y >= (this.chunkYSize))
			return false;
		else if(y < 0)
			return true;
		else if(this.chunkMap[cx+","+cz].chunk[x][y][z].blockType == -1)		
			return false;
			
		return true;
	},
	
	getBlockAtPosition: function(pos)
	{
		var x = (Math.floor(((pos[0] + 1) / 2.0 )) % this.chunkXSize);
		x = x < 0 ? this.chunkXSize + x : x;
		var y = Math.floor((pos[1] + 1) / 2.0 );		
		var z = (Math.floor(((pos[2] + 1) / 2.0 ) ) % this.chunkZSize) ;
		z = z < 0 ? this.chunkZSize + z : z;
		
		var cx = Math.floor((pos[0]+1) / (2 * this.chunkXSize));
		var cz = Math.floor((pos[2]+1) / (2 * this.chunkZSize));
		
		if(y >= (this.chunkYSize))
			return undefined;
		else if(y < 0)
			return undefined;
		return this.chunkMap[cx+","+cz].chunk[x][y][z];
	}
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
					var t = this.cubeMap.perlin.noise3d((i + this.x * this.xSize) / this.cubeMap.perlinScale, j / this.cubeMap.perlinScale, (k + this.z * this.zSize) / this.cubeMap.perlinScale ) + (j / this.ySize) ;
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
						{
							this.chunk[x][y][z].addVisibleEdge();							
						}
						if(x-1 < 0 && this.cubeMap.chunkMap[(this.x-1) +","+ this.z] && this.cubeMap.chunkMap[(this.x-1) +","+ this.z].chunk[this.xSize-1][y][z].blockType == -1 )
						{
							this.chunk[x][y][z].addVisibleEdge();
						}
						if(z+1 >= this.zSize && this.cubeMap.chunkMap[this.x+","+(this.z+1)] && this.cubeMap.chunkMap[this.x+","+(this.z+1)].chunk[x][y][0].blockType == -1 )
						{
							this.chunk[x][y][z].addVisibleEdge();
						}
						if(z-1 < 0 && this.cubeMap.chunkMap[this.x+","+(this.z-1)] && this.cubeMap.chunkMap[this.x+","+(this.z-1)].chunk[x][y][this.zSize-1].blockType == -1 )
						{
							this.chunk[x][y][z].addVisibleEdge();
						}
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
		
		/*if(x+1 < this.xSize)
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
			this.chunk[x][y][z-1].addVisibleEdge();*/
			
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
	},
	addBlock: function(b, x,y,z)
	{
		var c = this.chunk[x][y][z];
		if(c.blockType != -1)
			return;
		
		c.blockType = b;
		this.addToVisible(c);
		
		if(x+1 < this.xSize)
			this.chunk[x+1][y][z].removeVisibleEdge();
		else if(this.cubeMap.chunkMap[(this.x+1) +","+ this.z]) //if the cubemap at x+1 exists
			this.cubeMap.chunkMap[(this.x+1) +","+ this.z].chunk[0][y][z].removeVisibleEdge();
		if(x-1 >= 0)
			this.chunk[x-1][y][z].removeVisibleEdge();
		else if(this.cubeMap.chunkMap[(this.x-1) +","+ this.z]) //if the cubemap at x+1 exists
			this.cubeMap.chunkMap[(this.x-1) +","+ this.z].chunk[this.xSize-1][y][z].removeVisibleEdge();
			
		if(y+1 < this.ySize)
			this.chunk[x][y+1][z].removeVisibleEdge();					
		if(y-1 >= 0)
			this.chunk[x][y-1][z].removeVisibleEdge();						
			
		if(z+1 < this.zSize)
			this.chunk[x][y][z+1].removeVisibleEdge();
		else if(this.cubeMap.chunkMap[this.x+","+(this.z+1)]) //if the cubemap at x+1 exists
			this.cubeMap.chunkMap[this.x+","+(this.z+1)].chunk[x][y][0].removeVisibleEdge();		
		if(z-1 >= 0)
			this.chunk[x][y][z-1].removeVisibleEdge();
		else if(this.cubeMap.chunkMap[this.x+","+(this.z-1)]) //if the cubemap at x+1 exists
			this.cubeMap.chunkMap[this.x+","+(this.z-1)].chunk[x][y][this.zSize-1].removeVisibleEdge();	
	}
});

var CubeMapCube = Class.extend(
{
	init: function(chunk, x, y, z, blockType)
	{
		this.chunk = chunk;
		this.x = x;
		this.y = y;
		this.z = z;
		
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
	},
	removeVisibleEdge: function()
	{
		this.visibleEdges --;
		if(this.visibleEdges == 0 && this.blockType != -1)
			this.chunk.removeFromVisible(this);
	}
});

var CubeMapPlayerController = Component.extend(
{
	init: function()
	{		
		this.numFired = 0;
		this.pitch = 0;
		this.yaw = 0;
		this.speed = 30; //per second		
		
		this.xp = vec3.fromValues(1,0,0);
		this.yp = vec3.fromValues(0,1,0);
		this.zp = vec3.fromValues(0,0,1);
		
		BobGE.inst.mouseUpListeners[BobGE.inst.mouseUpListeners.length] = this.onMouseUp.bind(this);
		BobGE.inst.mouseDownListeners[BobGE.inst.mouseDownListeners.length] = this.onMouseDown.bind(this);
		
		this._super();
	},
	update: function(elapsed)
	{			
		var ms = this.speed * (elapsed / 1000.0);
	
		var q = quat.create();
		//We calculate negative camera position for purpose of checking collisions
		var ncp = vec3.create();		
		//quat.rotateY(q, q, -this.yaw);
		quat.invert(q, this.owner.rotation);
		if (BobGE.inst.keysDown[87]) 
		{
			var movement = vec3.fromValues(0, 0, ms);
			vec3.transformQuat(movement, movement, q);
			
			vec3.add(this.owner.position, this.owner.position, movement);
			//log("x: "+this.owner.position[0]+" y: "+this.owner.position[1]+" z: "+this.owner.position[2]);
			vec3.negate(ncp, this.owner.position);
			if(CubeMap.inst.testCollision(ncp))
				vec3.sub(this.owner.position, this.owner.position, movement);
		}
		if (BobGE.inst.keysDown[83]) 
		{
			var movement = vec3.fromValues(0, 0, -ms);
			vec3.transformQuat(movement, movement, q);			
			vec3.add(this.owner.position, this.owner.position, movement);
			vec3.negate(ncp, this.owner.position);
			if(CubeMap.inst.testCollision(ncp))
				vec3.sub(this.owner.position, this.owner.position, movement);
		}
		if (BobGE.inst.keysDown[65]) 
		{
			var movement = vec3.fromValues(ms, 0, 0);
			vec3.transformQuat(movement, movement, q);			
			vec3.add(this.owner.position, this.owner.position, movement);
			vec3.negate(ncp, this.owner.position);
			if(CubeMap.inst.testCollision(ncp))
				vec3.sub(this.owner.position, this.owner.position, movement);
		}
		if (BobGE.inst.keysDown[68]) 
		{
			var movement = vec3.fromValues(-ms, 0, 0);
			vec3.transformQuat(movement, movement, q);			
			vec3.add(this.owner.position, this.owner.position, movement);
			vec3.negate(ncp, this.owner.position);
			if(CubeMap.inst.testCollision(ncp))
				vec3.sub(this.owner.position, this.owner.position, movement);
		}
		
		if(BobGE.inst.middleButtonDown)
		{			
			this.yaw += BobGE.inst.mouseDeltaX * .01;
			this.yaw = this.yaw % 6.283
			this.pitch += BobGE.inst.mouseDeltaY * .01;
			this.pitch = this.pitch % 6.283
		}		
		 
		var q = quat.create();
		quat.rotateX(this.owner.rotation, q, this.pitch);
		quat.rotateY(this.owner.rotation, this.owner.rotation, this.yaw);
		
		var iq = quat.create();
		var cd = vec3.fromValues(0, 0, -1);
		quat.invert(iq, this.owner.rotation);
		vec3.transformQuat(this.owner.dir, cd, iq)		
		
		/*if(BobGE.inst.rightButtonDown)
		{
			var c = this.firstCubeContact();
			if(c)
				c.chunk.removeBlock(c.x, c.y, c.z);
		}
		if(BobGE.inst.leftButtonDown)
		{
			var c = this.lastEmptyCube();
			if(c)
				c.chunk.addBlock(0, c.x, c.y, c.z);
		}*/
	},
	
	onMouseDown: function()
	{
	},
	
	onMouseUp: function(event)
	{
		switch(event.button)
		{
			case 0:
				/*var go = new GameObject("fired block" + this.numFired)
				go.addComponent(new destroyAfterDelay(3));				
				var ncp = vec3.create();
				vec3.negate(ncp, this.owner.position);
				go.position = ncp;				
				go.scale[0] = .25;go.scale[1] = .25;go.scale[2] = .25;				
				var mv = BobGE.inst.mouseToRay();				
				var cmc = new ConstantMovementComponent();				
				cmc.x = mv[0] * 20; cmc.y = mv[1]* 20; cmc.z = mv[2]* 20; 
				go.addComponent(cmc);				
				var tc = new TexturedCubeComponent();
				tc.loadTexture("Assets/Water.jpg");
				go.addComponent(tc);				
				BobGE.inst.addObject(go);
				this.numFired ++;*/
				var c = this.lastEmptyCube();
				if(c)
					c.chunk.addBlock(0, c.x, c.y, c.z);
				break;
			case 2:
				var c = this.firstCubeContact();
				if(c)
					c.chunk.removeBlock(c.x, c.y, c.z);
				break;
			default:
				break;
		}
	},
	lastEmptyCube : function()
	{
		var ncp = vec3.create();
		vec3.negate(ncp, this.owner.position);
		
		var mv = BobGE.inst.mouseToRay();
		vec4.scale(mv, mv, .25);
		
		var i = 0;
		for(var i = 0; i < 80; ++i)
		{
			vec3.add(ncp, ncp, mv);
			var c = CubeMap.inst.getBlockAtPosition(ncp);
			if(c != undefined && c.blockType != -1)
			{
				vec3.sub(ncp, ncp, mv);
				var c = CubeMap.inst.getBlockAtPosition(ncp);
				return c;
			}
		}
	},
	
	firstCubeContact: function()
	{
		var ncp = vec3.create();
		vec3.negate(ncp, this.owner.position);
		
		var mv = BobGE.inst.mouseToRay();
		vec4.scale(mv, mv, .25);
		
		var i = 0;
		for(var i = 0; i < 80; ++i)
		{
			vec3.add(ncp, ncp, mv);
			var c = CubeMap.inst.getBlockAtPosition(ncp);
			if(c != undefined && c.blockType != -1)
				return c;
		}
	
		/*
		//We calculate negative camera position for purpose of checking collisions
		var ncp = vec3.create();
		vec3.negate(ncp, this.owner.position);
		
		var cp = vec3.create(); //current position
		var sr = vec3.create(); //scaled ray
		
		//If we're inside a cube, we return that one!
		//NOTE this shouldn't ever happen.
		var c = CubeMap.inst.getBlockAtPosition(ncp);
		if(c != undefined && c.blockType != -1)
			return c;
		
		var q = quat.create();
		var mv = BobGE.inst.mouseToRay();
		
		//planar shift for each plane after determining intersection
		var dxp = mv[0] > 0 ? 2 : -2;
		var dyp = mv[1] > 0 ? 2 : -2;
		var dzp = mv[2] > 0 ? 2 : -2;		
		//Last found distance in each planar direction.
		var dtcxp = 0;
		var dtcyp = 0;
		var dtczp = 0;
		
		var xpp = vec3.create();
		var ypp = vec3.create();
		var zpp = vec3.create();
		
		//plane points
		xpp[0] = mv[0] > 0 ? Math.floor(ncp[0]/2.0)*2 + 1 : Math.ceil(ncp[0]/2.0)*2 - 1;
		ypp[1] = mv[1] > 0 ? Math.floor(ncp[1]/2.0)*2 + 1 : Math.ceil(ncp[1]/2.0)*2 - 1;
		zpp[2] = mv[2] > 0 ? Math.floor(ncp[2]/2.0)*2 + 1 : Math.ceil(ncp[2]/2.0)*2 - 1;
		
		var curCube;
		
		while(Math.abs(dtcxp) < 20 || Math.abs(dtcyp) < 20 || Math.abs(dtczp) < 20)
		{
			if(Math.abs(dtcxp) <= Math.abs(dtcyp) && Math.abs(dtcxp) <= Math.abs(dtczp))
			{
				dtcxp = BobGE.inst.planeRayIntersection(xpp , this.xp, ncp, mv);
				if(dtcxp == NaN)
				    dtcxp = 99999;
				else
				{
					if(Math.abs(dtcxp) <= 20)
					{
						vec3.scale(sr, mv, dtcxp);//calculate the total vector to the intersection
						vec3.add(cp, ncp, sr);//move from the initial ray point to the intersection
						cp[0] = Math.round(cp[0])
						var c = CubeMap.inst.getBlockAtPosition(cp);	
						log("x point tested " + cp[0] + "," + cp[1] + "," +cp[2]);						
						if(c && c.blockType != -1 && (curCube == undefined || curCube.d >= Math.abs(dtcxp)))
							curCube = {c : CubeMap.inst.getBlockAtPosition(cp), d : Math.abs(dtcxp)};						
					}
					xpp[0] += dxp;
				}
			}			
			else if(Math.abs(dtcyp) < Math.abs(dtczp))
			{
				dtcyp = BobGE.inst.planeRayIntersection(ypp , this.yp, ncp, mv);
				if(dtcyp == NaN)
				    dtcyp = 99999;
				else
				{					
					if(Math.abs(dtcyp) <= 20)
					{
						vec3.scale(sr, mv, dtcyp);//calculate the total vector to the intersection						
						vec3.add(cp, ncp, sr);//move from the initial ray point to the intersection
						cp[1] = Math.round(cp[1]) ;
						var c = CubeMap.inst.getBlockAtPosition(cp);
						log("y point tested " + cp[0] + "," + cp[1] + "," +cp[2]);
						if(c && c.blockType != -1 && (curCube == undefined || curCube.d >= Math.abs(dtcyp)))
							curCube = {c : c, d : Math.abs(dtcyp)};						
					}
					ypp[1] += dyp;
				}
			}
			else
			{
				dtczp = BobGE.inst.planeRayIntersection(zpp , this.zp, ncp, mv);
				if(dtczp == NaN)
				    dtczp = 99999;
				else
				{					
					if(Math.abs(dtczp) <= 20)
					{
						vec3.scale(sr, mv, dtczp);//calculate the total vector to the intersection						
						vec3.add(cp, ncp, sr);//move from the initial ray point to the intersection
						cp[2] = Math.round(cp[2]) ;
						var c = CubeMap.inst.getBlockAtPosition(cp);
						log("z point tested " + cp[0] + "," + cp[1] + "," +cp[2]);
						if(c && c.blockType != -1 && (curCube == undefined || curCube.d >= Math.abs(dtczp)))
							curCube = {c : c, d : Math.abs(dtczp)};						
					}
					zpp[2] += dzp;
				}				
			}
		}
		if(curCube)
			return curCube.c;
		return curCube;*/
	}
});

