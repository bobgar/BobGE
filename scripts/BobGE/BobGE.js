/*
*  BobGE is the primary singleton class 
*/
var BobGE = Class.extend(
{
	init: function(canvas) 
	{	
		//The game engine should be a singleton!
		//If it has alraedy been initialized, return the original copy!
		if ( BobGE.inst )
			return BobGE.inst;
		BobGE.inst = this;
		
		//set up the default framerate in miliseconds
		this.maxFramerate = 1000.0 / 60.0; 
		//set last render and update times to 0 so they happen immedately
		this.lastRenderTime = 0;
		this.lastUpdateTime = 0;
		//initialize the dictionary to hold game objects
		this.objects = new Object();
		//initialize the texture dictionary, so we can ref all textures only once
		this.textures = new Object();
		//initialize the mesh objects to draw as instances
		this.instancedMeshes = new Object();
		
		//TODO this may be hacky -- storing all the vertex, triangle, and uv maps in dictionaries here!
		this.vertexBuffers = new Object();
		this.uvBuffers = new Object();			
		this.triangleBuffers = new Object();			
		this.textureInstanceDictionaries = new Object();
		
		//Attempt to start up WebGL
		try {
			this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
			this.gl.viewportWidth = canvas.width;
			this.gl.viewportHeight = canvas.height;
			//For this engine we assume we always want to cull back faces.
			this.gl.enable(this.gl.CULL_FACE);
		} catch (e) {
		}
		if (!this.gl) {
			log("Could not initialise WebGL, sorry :-(");
		}
		
		this.initShaders();
		this.initCamera();
		
		this.keysDown = new Object();
		document.onkeydown = this.keyDown.bind(this);
		document.onkeyup = this.keyUp.bind(this);
		
		canvas.onmousedown = this.mouseDown.bind(this);
		document.onmouseup = this.mouseUp.bind(this);
		document.onmousemove = this.mouseMove.bind(this);		
		
		//Mouse deltas should start at 0
		this.mouseDeltaX = 0;
		this.mouseDeltaY = 0;
		
		//This call starts the update loop		
		this.update();
		log("BobGE init complete");
	},
	/**
	*  Keyboard handlers
	**/
	keyDown: function(event)
	{
		this.keysDown[event.keyCode] = true;
	},
	keyUp: function(event)
	{
		this.keysDown[event.keyCode] = false;
	},
	/**
	*  Mouse Handlers
	**/
	mouseDown: function(event)
	{
	},
	mouseUp: function(event)
	{
	},
	mouseMove: function(event)
	{		
		var newX = event.clientX;
		var newY = event.clientY;
		//TODO slow / dumb to do this every mouse move.
		this.lastMouseX = typeof this.lastMouseX != 'undefined' ? this.lastMouseX : newX;
		this.lastMouseY = typeof this.lastMouseY != 'undefined' ? this.lastMouseY : newY;
		this.mouseDeltaX = newX - this.lastMouseX;
		this.mouseDeltaY = newY - this.lastMouseY;
		this.lastMouseX = newX;
		this.lastMouseY = newY;
	},
	/**
	*  Add an object to the game engine for rendering / update.
	**/
	addObject: function(o)
	{
		this.objects[o.id] = o;
	},
	removeObject: function(o)
	{
		delete this.objects[o.id];
	},
	/**
	*	This function initializes the default main camera.
	*   The main camera is just a game object and a special component
	**/
	initCamera: function()
	{
		this.mainCamera = new GameObject("mainCamera");				
		this.addObject(this.mainCamera);
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
		var vertexShader = this.getShader("shader-vs");

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

		this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
		this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
		this.shaderProgram.samplerUniform = this.gl.getUniformLocation(this.shaderProgram, "uSampler");
	},
	
	/**
	*  Main update loop of the game.
	**/
	update: function()
	{
		var curTime = new Date();
		var elapsed = curTime - this.lastUpdateTime;		
		
		//set up next update call
		requestAnimFrame( this.update.bind(this) );	
		//Update components
		for(var k in this.objects)
		{
			var obj = this.objects[k];	
			for(var j = 0; j < obj.updateableComponents.length; ++j)
			{
				var component = obj.updateableComponents[j];
				component.update(elapsed);
			}		
			//Right now we update transform if the object has been effected after that objects update
			//Ultimately it probably makes sense to do this after all updates but before renders
			//This is here to avoid the extra loop through objects (efficiency) but may not be necessary.
			if(obj.dirty)
			{
				obj.updateCachedMat();
				obj.dirty = false;
			}
		}
		this.lastUpdateTime = curTime;				
		//check the time since last render against our (maximum) framerate.
		if(curTime - this.lastRenderTime > this.maxFramerate)
		{
			this.lastRenderTime = curTime;
			//Draw the scene
			this.drawScene();
		}
		
		this.mouseDeltaX = 0;
		this.mouseDeltaY = 0;
		
		this.gl.activeTexture(this.gl.TEXTURE0);
	},
	
	/**
	*  Draw the entire object list.
	*  TODO:  Draw method should be on drawable components.
	*  Not every object will be drawable, or drawable in the same way.
	*  Though hopefully many will be similar.
	**/
	drawScene: function() 
	{
		//Clear the screen and reset the depth budffer before drawin the game world
		this.gl.clearColor(0.5, 0.5, 0.5, 1.0);
		this.gl.enable(this.gl.DEPTH_TEST);			
		//Create the temp matricies to hold object positions.
		var mvMatrix = mat4.create();
		var pMatrix = mat4.create();
		this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		//Generate the perspective matrix
		mat4.perspective(pMatrix, 45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 1000.0);		
		//log("num objects = "+this.objects.length);
		
		var cameraMatrix = mat4.create();
		mat4.fromQuat(cameraMatrix, this.mainCamera.rotation);
		mat4.translate(cameraMatrix, cameraMatrix, this.mainCamera.position);		
		
		//Draw instanced pass
		for(var k in this.instancedMeshes)
		{
			this.instancedMeshes[k].drawInstances(mvMatrix, pMatrix, cameraMatrix, this.instancedMeshes[k].id);
		}
		
		/*for(var k in this.objects)
		{
			var obj = this.objects[k];
			
			
			if(obj.dirty)
			{
				obj.updateCachedMat();
				obj.dirty = false;
			}
			
			for(var j = 0; j < obj.drawableComponents.length; ++j)
			{
				var component = obj.drawableComponents[j];
				if(component.draw )
				{
					log("drawing component on " + obj.id, 3);
					component.draw(mvMatrix, pMatrix, cameraMatrix);					
				}
			}
		}*/
	}
});

var logLevel = 3;
function log(s, l)
{
	l = typeof l != 'undefined' ? l : 2;
	//Only log if the level of the curren message is lower (higher prio) than the log level.
	if(l <= logLevel)
		console.log(s);
}