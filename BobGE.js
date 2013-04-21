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
		
		this.intervalId = setInterval(this.update, 66);
		//clearInterval(this._intervalId);		
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

		this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
		this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
	},
	update: function()
	{
		var bge = BobGE.inst;
		for(var i = 0; i < bge.objects.length; ++i)
		{
			var obj = bge.objects[i];	
			for(var j = 0; j < obj.components.length; ++j)
			{
				var component = obj.components[j];
				component.update();
			}
		}
		bge.drawScene();
	},
	drawScene: function() 
	{
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.enable(bobGE.gl.DEPTH_TEST);	
		//log("draw scene");
		//var mvMatrix = mat4.create();		
		var mvMatrix = mat4.create();
		var pMatrix = mat4.create();
		this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		mat4.perspective(pMatrix, 45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0);
		//log("num objects = "+this.objects.length);
		for(var i = 0; i < this.objects.length; ++i)
		{		
			var obj = this.objects[i];	
			//log(obj);			
			mat4.fromRotationTranslation(mvMatrix, obj.rotation, obj.position);			
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.buffer);
			this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, obj.buffer.itemSize, this.gl.FLOAT, false, 0, 0);
			
			this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix);
			this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMatrix);
			
			this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, obj.buffer.numItems);
		}
	}
});



function log(s)
{
	console.log(s);
}