/*
*  BobGE is the primary singleton class 
*/
var BobGE = Class.extend(
{
	init: function(canvas) 
	{	
		if ( BobGE.inst )
			return BobGE.inst;
		BobGE.inst = this;
	
		this.objects = new Array();	

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
		
		//this.intervalId = setInterval(this.update, 66);
		//clearInterval(this._intervalId);		
		
		this.update();
		log("BobGE init complete");
	},
	addObject: function(o)
	{
		log("add cube");
		this.objects[this.objects.length] = o;
	},
	getShader: function(id) {
		log("Get Shaders!");
		var shaderScript = document.getElementById(id);
		if (!shaderScript) {
			log("Shader not found: " + id);
			return null;
		}
		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3) {
				str += k.textContent;
			}
			k = k.nextSibling;
		}
		var shader;
		if (shaderScript.type == "x-shader/x-fragment") {
			log("Found Fragment Shader!");
			shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			log("Found Vertex Shader!");
			shader = this.gl.createShader(this.gl.VERTEX_SHADER);
		} else {		
			return null;
		}
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
		//set up next update call
		requestAnimFrame( this.update.bind(this) );	
		//Update components
		for(var i = 0; i < this.objects.length; ++i)
		{
			var obj = this.objects[i];	
			for(var j = 0; j < obj.components.length; ++j)
			{
				var component = obj.components[j];
				component.update();
			}
		}
		//Draw the scene
		this.drawScene();
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
		for(var i = 0; i < this.objects.length; ++i)
		{		
			var obj = this.objects[i];	
			//Generate the 4x4 matrix representing position / rotation
			//TODO this should be cached on the object and only updated when rotated
			//(moves can be done easily by hand, and updating this every draw will be expensive).
			mat4.fromRotationTranslation(mvMatrix, obj.rotation, obj.position);	
			//load the objects vertex buffer into memory
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vertexBuffer);
			this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, obj.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
			
			//load the objects UV map into memory
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.uvBuffer);
			this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, obj.uvBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
			
			//load the objects texture into memory
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, obj.texture);
			this.gl.uniform1i(this.shaderProgram.samplerUniform, 0);
			
			//load the objects triangle buffer into memory
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.triangleBuffer);
			//Load the matricies into the shaders
			this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix);
			this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMatrix);
			//Draw the object
			this.gl.drawElements(this.gl.TRIANGLES, obj.triangleBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
		}
	}
});

function log(s)
{
	console.log(s);
}