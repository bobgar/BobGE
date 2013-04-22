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
		//initialize the 
		this.textures = new Object();
		//Attempt to start up WebGL
		try {
			this.gl = canvas.getContext("experimental-webgl");
			this.gl.viewportWidth = canvas.width;
			this.gl.viewportHeight = canvas.height;
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
		this.mainCamera.addComponent(new BasicCameraController());
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
			for(var j = 0; j < obj.components.length; ++j)
			{
				var component = obj.components[j];
				component.update(elapsed);
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
		mat4.perspective(pMatrix, 45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0);		
		//log("num objects = "+this.objects.length);
		for(var k in this.objects)
		{
			var obj = this.objects[k];
			for(var j = 0; j < obj.components.length; ++j)
			{
				var component = obj.components[j];
				if(component.draw )
				{
					log("drawing component on " + obj.id, 3);
					component.draw(mvMatrix, pMatrix);					
				}
			}
		}
	}
});

var logLevel = 2;
function log(s, l)
{
	l = typeof l != 'undefined' ? l : 2;
	//Only log if the level of the curren message is lower (higher prio) than the log level.
	if(l <= logLevel)
		console.log(s);
}