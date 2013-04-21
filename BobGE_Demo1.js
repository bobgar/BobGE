
function webGLStart() 
{		
	log("Init BobGE!")

	var canvas = document.getElementById("BobGE");
	var bobGE = new BobGE(canvas);	
	var go = new GameObject("testCube");
	go.position[2] = -10;
	var c = new TexturedCubeComponent();
	c.loadTexture("assets/Dirt.jpg");	
	go.addComponent( c );
	log(c);
	go.addComponent( new ConstantRotationComponent(0,0,0) );	
	bobGE.addObject(go);		
	log(go);	
}