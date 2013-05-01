
function webGLStart() 
{		
	
	log("Init BobGE!")

	var canvas = document.getElementById("BobGE");
	var bobGE = new BobGE(canvas);	
	
	bobGE.mainCamera.addComponent(new CubeMapPlayerController());
	bobGE.mainCamera.position[2] = -20;
	bobGE.mainCamera.position[1] = -80;
	bobGE.mainCamera.components[0].pitch = 1.1;
	
	
	var cubeMapObject = new GameObject("CubeMap");
	var cubeMap = new CubeMap() ;
	cubeMapObject.addComponent(cubeMap );
	cubeMap.setupTextureMap(["assets/Dirt.jpg", "assets/Grass.jpg"]);
	bobGE.addObject(cubeMapObject);
}