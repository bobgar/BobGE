
function webGLStart() 
{		
	
	log("Init BobGE!")

	var canvas = document.getElementById("BobGE");
	var bobGE = new BobGE(canvas);	
	
	bobGE.mainCamera.addComponent(new BasicCameraController());
	bobGE.mainCamera.position[2] = -20;
	bobGE.mainCamera.position[1] = -80;
	bobGE.mainCamera.components[0].pitch = 1.1;
	//bobGE.mainCamera.addComponent(new ConstantMovementComponent(0,0,.5));
	
	/*var go = new GameObject("testCube");
	go.position[1] = 40;
	go.position[2] = -15;
	var c = new TexturedCubeComponent();
	c.loadTexture("assets/Dirt.jpg");	
	go.addComponent( c );
	go.scale[0] = 2;
	go.scale[1] = 20;
	go.scale[2] = 2;
	//go.addComponent( new ConstantRotationComponent(.06,.05,.04) );	
	bobGE.addObject(go);	
	log(go);	

	var go2 = new GameObject("testCube2");
	go2.position[0] = 5;	
	go2.position[1] = 40;
	var c2 = new TexturedCubeComponent();
	c2.loadTexture("assets/Dirt.jpg");	
	go2.addComponent( c2 );	
	bobGE.addObject(go2);
	
	var go3 = new GameObject("testCube3");
	go3.position[0] = -5;	
	go3.position[1] = 40;
	var c3 = new TexturedCubeComponent();
	c3.loadTexture("assets/Grass.jpg");	
	go3.addComponent( new ConstantRotationComponent(-.06,-.05,-.04) );	
	go3.addComponent( c3 );	
	bobGE.addObject(go3);*/
	
	
	var cubeMapObject = new GameObject("CubeMap");
	var cubeMap = new CubeMap() ;
	cubeMapObject.addComponent(cubeMap );
	cubeMap.setupTextureMap(["assets/Dirt.jpg", "assets/Grass.jpg"]);
	bobGE.addObject(cubeMapObject);
}