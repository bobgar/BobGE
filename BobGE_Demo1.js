
function webGLStart() 
{		
	log("Init BobGE!")

	var canvas = document.getElementById("BobGE");
	bobGE = new BobGE(canvas);	
	var c = new Cube();
	c.loadTexture("assets/Dirt.jpg");
	c.position[2] = -10;
	c.addComponent( new ConstantRotationComponent(.3,.2,.1) );
	//c.addComponent( new ShakeComponent(.01,.01,.01) );	
	bobGE.addObject(c);		
	//bobGE.drawScene();
}