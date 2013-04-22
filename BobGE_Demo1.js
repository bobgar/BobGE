
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
	go.addComponent( new ConstantRotationComponent(.06,.05,.04) );	
	bobGE.addObject(go);	
	log(go);	

	var go2 = new GameObject("testCube2");
	go2.position[2] = -10;
	go2.position[0] = -3;
	var c2 = new TexturedCubeComponent();
	c2.loadTexture("assets/Dirt.jpg");	
	go2.addComponent( c2 );	
	bobGE.addObject(go2);
	
	var go3 = new GameObject("testCube3");
	go3.position[2] = -10;
	go3.position[0] = 3;
	var c3 = new TexturedCubeComponent();
	c3.loadTexture("assets/Grass.jpg");	
	go3.addComponent( new ConstantRotationComponent(-.06,-.05,-.04) );	
	go3.addComponent( c3 );	
	bobGE.addObject(go3);
}