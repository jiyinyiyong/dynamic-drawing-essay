//
//  main.js
//  DyanamicPicturesMotivation
//
//  Created by Bret Victor on 3/4/11.
//  (c) 2011 Bret Victor.  MIT open-source license.
//


(function(){



//====================================================================================
//
//  domready
//

window.addEvent('domready', function () {
	var canvas = document.id("canvas");
	
	$$("canvas").each( function (canvas) {
		if (!canvas.getContext) { return; }   // no canvas support
		new City(canvas);
	});
});

var getPropertiesFromClassName = function (className) {
	var properties = {};
	var names = className.split(" ");

	for (var i=0; i < names.length; i++) {
		var name = names[i];
		if (name.indexOf("p-") == 0) {
			var substrings = name.split('-');
			if (substrings.length == 3) {
				properties[substrings[1]] = substrings[2];
			}
		}
	}
	return properties;
};



//====================================================================================
//
//  City
//

var City = new Class({

	initialize: function (canvas, reincarnationIndex) {
		this.canvas = this.element = canvas;
		this.reincarnationIndex = (reincarnationIndex || 0);
		
		this.width = 1 *  canvas.get("width");
		this.height = 1 * canvas.get("height");
		
		var properties = getPropertiesFromClassName(canvas.className);
		for (var p in properties) { this[p] = properties[p]; }

		var seed = this.vary([8, 5, 20]) + (reincarnationIndex || 0);
		resetRandom(seed);
		
		this.ctx = this.canvas.getContext("2d");
		
		this.sky = new Sky({
			city:this,
			bgGradient: this.ctx.createLinearGradient(0,0,0,this.height)
		});
		
        this.skylines = [];
        this.skylines.push(new Skyline({
        	city:this,
        	baseHeightMean:this.vary([50, 50, 40]),
        	baseHeightRadius:this.vary([10, 10, 3]),
        	peakHeightMean:this.vary([80, 80, 45]),
        	peakHeightRadius:this.vary([30, 30, 5]),
        	canNotch: this.vary([true,true,false]),
        	fillStyle:"#014180",
        	speed:this.vary([5,-1,0]),
        }));
        this.skylines.push(new Skyline({
        	city:this,
        	baseHeightMean:this.vary([30, 40, 0]),
        	baseHeightRadius:this.vary([10, 10, 2]),
        	peakHeightMean:this.vary([50, 55, 65]),
        	peakHeightRadius:this.vary([10, 10, 2]),
        	canNotch: true,
        	fillStyle:"#041f5a",
        	speed:this.vary([10,-28,2]),
        }));
        this.skylines.push(new Skyline({
        	city:this,
        	baseHeightMean:this.vary([15, 20, 15]),
        	baseHeightRadius:this.vary([10, 5, 2]),
        	peakHeightMean:this.vary([30, 80, 15]),
        	peakHeightRadius:this.vary([10, 40, 2]),
        	canNotch: this.vary([true,true,false]),
        	fillStyle:"#000",
        	speed:this.vary([30,-30,30]),
        }));

        this.setClickable(!!(1 * this.isClickable));
        this.setAnimating(!!(1 * (this.isAnimated || 0)));
        this.setInteractive(!!(1 * (this.isInteractive || 0)));

        this.drawInContext(this.ctx);
	},
	
	destroy: function () {
		this.setClickable(false);
		this.setInteractive(false);
		this.setAnimating(false);
		this.canvas.removeEvents();
	},
	
	vary: function (values) {
		return values[this.variant || 0];
	},

	drawInContext: function (ctx) {
		this.sky.drawInContext(ctx);
		for (var i = 0; i < this.skylines.length; i++) {
			this.skylines[i].drawInContext(ctx);
		}
	},


	//----------------------------------------------------------------------------------
	//
	//  animating
	//
	
	setAnimating: function (animating) {
		if (animating) {
			this.animationInterval = this.updateAnimation.periodical(20, this);
		}
		else {
			if (this.animationInterval) {
				clearTimeout(this.animationInterval);
				delete this.animationInterval;
			}
		}
	},
	
	updateAnimation: function () {
		for (var i = 0; i < this.skylines.length; i++) {
			var skyline = this.skylines[i];
			skyline.scrollBy(skyline.speed / 20);
		}
		this.drawInContext(this.ctx);
	},
	

	//----------------------------------------------------------------------------------
	//
	//  clickable
	//

	setClickable: function (clickable) {
		if (clickable) {
			this.element.addEvent("click", this._click.bind(this));
		}
		else {
			this.element.removeEvents("click");
		}
	},
	
	_click: function (event) {
		event.stop();
		
		var canvas = this.canvas;
		var reincarnationIndex = this.reincarnationIndex;

		this.destroy();
		new City(canvas, reincarnationIndex + 1);
	},


	//----------------------------------------------------------------------------------
	//
	//  interactive
	//

	setInteractive: function (interactive) {
		if (interactive) {
			if (!this._mouseBound) {
				this._mouseBound = {
					mouseDown: this._mouseDown.bind(this),
					mouseMove: this._mouseMove.bind(this),
					mouseUp: this._mouseUp.bind(this),
				};
			}
			this.element.addEvent("mousedown", this._mouseBound.mouseDown);
			this.interactiveInterval = this.updateInteraction.periodical(20, this);
		}
		else {
			this.element.removeEvents("mousedown");
			if (this.interactiveInterval) { clearTimeout(this.interactiveInterval); delete this.interactiveInterval; }
		}
	},
	
	_mouseDown: function (event) {
		event.stop();
		this.element.getDocument().addEvents({
			mousemove: this._mouseBound.mouseMove,
			mouseup: this._mouseBound.mouseUp
		});
		
		this.lastPosition = this.getEventPosition(event);
		this.lastDx = 0;
		this.isDragging = true;
	},

	_mouseMove: function (event) {
		event.stop();
		
		var timestamp = Date.now();
		var position = this.getEventPosition(event);
		var dx = position.x - this.lastPosition.x;

		this.lastPosition = position;
		this.lastDx = dx;
		this.lastTimestamp = timestamp;
		
		this.updateInteractionWithDx(dx);
	},

	_mouseUp: function (event) {
		event.stop();
		this.isDragging = false;
		if (Date.now() - this.lastTimestamp > 350) { this.lastDx = 0; }
		
		this.element.getDocument().removeEvents({
			mousemove: this._mouseBound.mouseMove,
			mouseup: this._mouseBound.mouseUp
		});
	},
	
	updateInteractionWithDx: function (dx) {
		var firstSpeed = this.skylines[this.skylines.length - 1].speed;
		for (var i = 0; i < this.skylines.length; i++) {
			var skyline = this.skylines[i];
			skyline.scrollBy(-dx * skyline.speed / firstSpeed);
		}
		this.drawInContext(this.ctx);
	},
	
	updateInteraction: function () {
		if (this.isDragging || Math.abs(this.lastDx || 0) < 0.1) { return; }
		this.lastDx *= 0.96;
		this.updateInteractionWithDx(this.lastDx);
	},
	
	getEventPosition: function (event) {
		var canvasPosition = this.canvas.getPosition();
		return { x: event.client.x - canvasPosition.x, y: event.client.y - canvasPosition.y };
	}

	
});


//====================================================================================
//
//  Sky
//

var Sky = new Class({

	initialize: function (params) {
		for (var p in params) { this[p] = params[p]; }

		this.bgGradient.addColorStop(0, "#002c72");
		this.bgGradient.addColorStop(1, "#00aceb");
		
		this.stars = [];
		for (var i = 0; i < 80; i++) {
			var star = {
				x: uniformRandomInt(0, this.city.width),
				y: uniformRandomInt(0, Math.floor(this.city.height * 0.4)),
				fillStyle: "rgba(145,225,255," + uniformRandom(0.2,1.0) + ")"
				
			};
			this.stars.push(star);
		}
	},

	drawInContext: function (ctx) {
		ctx.fillStyle = this.bgGradient;
        ctx.fillRect(0, 0, this.city.width, this.city.height);
        
        for (var i = 0; i < this.stars.length; i++) {
        	var star = this.stars[i];
        	ctx.fillStyle = star.fillStyle;
        	ctx.fillRect(star.x, star.y, 1, 1);
        }
	}
	
});


//====================================================================================
//
//  Skyline
//

var Skyline = new Class({

	initialize: function (params) {
		for (var p in params) { this[p] = params[p]; }
		this.x = 0;
		this.buildings = [];
		this.notchStyles = [ "none", "none", "triangle", "square" ];
		
		this.addBuildings();
	},
	
	addBuildings: function () {
		var x = 0;
		var baseHeight = this.baseHeightMean;
		
		while (x < this.city.width * 1.5) {
			var buildingWidth = uniformRandomInt(10,40);
			var building = new Building({
				skyline:this,
				baseY: this.city.height,
				baseHeight: baseHeight,
				peakHeight: uniformRandomInt(this.peakHeightMean - this.peakHeightRadius, this.peakHeightMean + this.peakHeightRadius),
				width: buildingWidth,
				padding: Math.max(-1, uniformRandomInt(-4,12)),
				notchStyleLeft: this.notchStyles[this.canNotch ? uniformRandomInt(0,3) : 0],
				notchStyleRight: this.notchStyles[this.canNotch ? uniformRandomInt(0,3) : 0],
				notchWidth: uniformRandomInt(2, Math.floor(buildingWidth/2)),
				fillStyle: this.fillStyle
			});

			this.buildings.push(building);
			x += building.width + building.padding;
			
			var newBaseHeight = gaussianRandomInt(this.baseHeightMean - this.baseHeightRadius, this.baseHeightMean + this.baseHeightRadius);
			if (uniformRandomInt(0,2) == 0) {
				baseHeight = newBaseHeight;
			}
		}
		
		this.width = x;
	},
	
	scrollBy: function (dx) {
		this.x -= dx;
		if (this.x + this.width * 2 < this.city.width) { this.x += this.width; }
		if (this.x > 0) { this.x -= this.width; }
	},
	
	drawInContext: function (ctx) {
		var x = this.x;
		var count = this.buildings.length;
		for (var n = 0; n < 2; n++) {
			for (var i = 0; i < count; i++) {
				var building = this.buildings[i];
				building.drawInContext(ctx, x);
				x += building.width + building.padding;
			}
		}
	}
	
});


//====================================================================================
//
//  Building
//

var Building = new Class({
	
	initialize: function (params) {
		for (var p in params) { this[p] = params[p]; }
		this.notchWidth = Math.min(this.notchWidth, Math.floor(this.width / 2));
	},
	
	drawInContext: function (ctx, x) {
		ctx.fillStyle = this.fillStyle;
		ctx.beginPath();
		ctx.moveTo(x, this.baseY);

		if (this.notchStyleLeft == "square") {
			ctx.lineTo(x, this.baseY - this.peakHeight + this.notchWidth);
			ctx.lineTo(x + this.notchWidth, this.baseY - this.peakHeight + this.notchWidth);
			ctx.lineTo(x + this.notchWidth, this.baseY - this.peakHeight);
		}
		else if (this.notchStyleLeft == "triangle") {
			ctx.lineTo(x, this.baseY - this.peakHeight + this.notchWidth);
			ctx.lineTo(x + this.notchWidth, this.baseY - this.peakHeight);
		}
		else {
			ctx.lineTo(x, this.baseY - this.peakHeight);
		}

		if (this.notchStyleRight == "square") {
			ctx.lineTo(x + this.width - this.notchWidth, this.baseY - this.peakHeight);
			ctx.lineTo(x + this.width - this.notchWidth, this.baseY - this.peakHeight + this.notchWidth);
			ctx.lineTo(x + this.width, this.baseY - this.peakHeight + this.notchWidth);
		}
		else if (this.notchStyleRight == "triangle") {
			ctx.lineTo(x + this.width - this.notchWidth, this.baseY - this.peakHeight);
			ctx.lineTo(x + this.width, this.baseY - this.peakHeight + this.notchWidth);
		}
		else {
			ctx.lineTo(x + this.width, this.baseY - this.peakHeight);
		}
				
		ctx.lineTo(x + this.width, this.baseY - this.baseHeight);
		ctx.lineTo(x + this.width + this.padding, this.baseY - this.baseHeight);
		ctx.lineTo(x + this.width + this.padding, this.baseY);
		ctx.closePath();
		ctx.fill();
	}

});



//====================================================================================
//
//  random
//

var randomSeed = 1;

var resetRandom = function (seed) {
	randomSeed = seed;
};

var random = function () {
     randomSeed = ((randomSeed * 58321) + 11113) & 0x7fffffff;
     return (randomSeed >> 16) / 0x7fff;
};

var gaussianishRandom = function (n) {
	var x = 0;
	for (var i = 0; i < n; i++) { x += random(); }
	return x / n;
};

var uniformRandom = function (from, to) {
	return from + (to - from) * random();
};

var uniformRandomInt = function (from, to) {
	return Math.floor(from + (to - from + 1) * random());
};

var gaussianRandomInt = function (from, to) {
	return Math.floor(from + (to - from + 1) * gaussianishRandom(2));
};


//====================================================================================

})();

