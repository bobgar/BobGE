
function webGLStart() 
{		
	log("Init BobGE!")

	var canvas = document.getElementById("BobGE");
	bobGE = new BobGE(canvas);	
	var c = new Cube();
	c.position[2] = -5;
	c.addComponent( new ConstantRotationComponent(0,.1,.1) );
	c.addComponent( new ShakeComponent(.01,.01,.01) );	
	bobGE.addObject(c);
	log(c);
	//bobGE.drawScene();
}