
function webGLStart() 
{		
	
	log("Init BobGE!")

	var canvas = document.getElementById("BobGE");
	var bobGE = new BobGE(canvas);	
	
	bobGE.mainCamera.addComponent(new BasicCameraController());
	bobGE.mainCamera.position[2] = -20;
	
	var go = new GameObject("testCube");
	go.position[2] = -15;
	var c = new TexturedCubeComponent();
	c.loadTexture("assets/Dirt.jpg");	
	go.addComponent( c );
	go.scale[0] = 2;
	go.scale[1] = 10;
	go.scale[2] = 2;
	//go.addComponent( new ConstantRotationComponent(.06,.05,.04) );	
	bobGE.addObject(go);	
	log(go);	

	var go2 = new GameObject("testCube2");
	go2.position[0] = 5;	
	var c2 = new TexturedCubeComponent();
	c2.loadTexture("assets/Dirt.jpg");	
	go2.addComponent( c2 );	
	bobGE.addObject(go2);
	
	var go3 = new GameObject("testCube3");
	go3.position[0] = -5;	
	var c3 = new TexturedCubeComponent();
	c3.loadTexture("assets/Grass.jpg");	
	go3.addComponent( new ConstantRotationComponent(-.06,-.05,-.04) );	
	go3.addComponent( c3 );	
	bobGE.addObject(go3);
	
	for(var i = -10; i < 10; i ++)
	{
		for(var j = -10; j < 10; j++)
		{
			for(var k = -10; k < 10; k++)
			{
				var g = new GameObject("floor_"+i+"_"+j+"_"+k);
				g.position[0] = i*2;
				g.position[1] = k*2 - 30;
				g.position[2] = j*2;
				var c = new TexturedCubeComponent();
				if(k == 9)
					c.loadTexture("assets/Grass.jpg");
				else
					c.loadTexture("assets/Dirt.jpg");
				g.addComponent(c);
				//if(i > 0 && j > 0 && k > 0)
				//	g.addComponent( new ConstantRotationComponent( (Math.random()-0.5) * 0.2 , (Math.random()-0.5) * 0.2 , (Math.random()-0.5) * 0.2 ));	
				bobGE.addObject(g);
			}
		}		
	}
}