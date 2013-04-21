var Component = Class.extend(
{
	init: function() 
	{
		
	},
	update: function()
	{
	}
});

var ShakeComponent = Component.extend({
	init: function(x,y,z)
	{
		this.x = typeof x != 'undefined' ? x : 0;
		this.y = typeof x != 'undefined' ? y : 0;
		this.z = typeof x != 'undefined' ? z : 0;
	},
	update: function()
	{
		this.owner.position[0] += (Math.random() * this.x * 2 - this.x);
		this.owner.position[1] += (Math.random() * this.y * 2 - this.y);
		this.owner.position[2] += (Math.random() * this.z * 2 - this.z);
	}
});

//Constant Euler Angle rotation
var ConstantRotationComponent = Component.extend({
	init: function(x, y, z)
	{	
		//set rotations with defaulting
		this.x = typeof x != 'undefined' ? x : 0;
		this.y = typeof x != 'undefined' ? y : 0;
		this.z = typeof x != 'undefined' ? z : 0;
	},
	update: function()
	{
		quat.rotateX(this.owner.rotation, this.owner.rotation, this.x);		
		quat.rotateY(this.owner.rotation, this.owner.rotation, this.y);
		quat.rotateZ(this.owner.rotation, this.owner.rotation, this.z);
	}
});
