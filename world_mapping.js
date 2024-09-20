const DOWN_TRIANGLE = false;
const UP_TRIANGLE = true;
const LARGE_TRIANGLE = true;
const SMALL_TRIANGLE = false;
const OUTLINE_THICKNESS = 5;
var MAP_KEY_HEIGHT = 350;
var svgNS = "http://www.w3.org/2000/svg";
var DOWNLOAD_BUTTON_CLASS = "btn1";
var DEFAULT_INFO_PARAGRAPH_CLASS = "white";
var SLIDE_COUNTER = 0;
const MAP_EDIT_TOOLBAR_NAME = "mapEditToolbar";

function worldMap(world, parentObj, containerDiv, blankMap, editMode)
{
	var me = this;
	me.blank = arguments.length < 4 ? false : blankMap;
	me.editMode = arguments.length < 5 ? false : editMode;
	me.world = world;
	me.totalRows = 3*me.world.uwp.size-1;
	me.worldTriangles = [];
	me.hexes = [];
	me.namedHexes = {};
	me.numHexes = 5*(2*triangleNumber(me.world.uwp.size) + 2*triangleNumber(me.world.uwp.size-1));
	me.rows = [];
	me.oceanTriangleIDs = [];
	me.cityHexes = [];
	me.theTown = null;
	me.parentObj = parentObj;
	me.containerDiv = containerDiv;
	me.map_left_offset = 10
	me.mapWidth = Math.max(me.map_left_offset+1000,me.map_left_offset+5.5*(me.world.uwp.size+1)*32);
	if(me.editMode)
	{
		me.mapHeight = (3*me.world.uwp.size+1)*28;
		me.map_top_offset = 20;
	}
	else
	{
		me.map_top_offset = 200;
		me.mapHeight = me.map_top_offset+(3*me.world.uwp.size+1)*28+MAP_KEY_HEIGHT;
	}
	me.parentObj.setAttributeNS(null,"height","100%");
	me.parentObj.setAttributeNS(null,"width","100%");
	me.parentObj.setAttributeNS(null,"viewBox","0 0 " + me.mapWidth + " " + me.mapHeight);
	me.topCoverTrianglePoints = [];
	me.bottomCoverTrianglePoints = [];
	me.mapCornerPoints = [];
	me.key = new mapKey(me);
	me.twilightZoneWestCol = 0;
	me.twilightZoneEastCol = 0;
	me.twilightZoneOption = 0;
	me.worldOceans = [];
	me.worldContinents = [];
	me.skipSeas = false;
	me.saveObj = [];

	me.init = function()
	{
		var worldSize = me.world.uwp.size;
		if(worldSize == 0)
			return;
		var northPole = new worldHex(me, me.parentObj, null, -1, -1, -1);
		northPole.renderFlag = false;
		northPole.x = -1;
		northPole.y = -1;
		var southPole = new worldHex(me, me.parentObj, null, -2, -2, -2);
		southPole.renderFlag = false;
		southPole.x = -2;
		southPole.y = -2;
		for(var i=0;i<20;i++)
			me.worldTriangles[i] = new worldTriangle(me, worldSize, me.parentObj, i);
		for(i=0;i<me.rows.length;i++)
			me.rows[i].sort(function(a,b) { return a.columnNumber - b.columnNumber });
		me.rows.map(function (row, i) { row.map(function(hex,j) 
													{	
														hex.y = i; 
														hex.x = j; 
														if((hex.y == worldSize-1 || hex.y == me.totalRows-worldSize) && ((hex.x + 1) % worldSize ) == 0)
															hex.pentagon = true;
														if(hex.parentTriangle.id % 4 == 0 && hex.x == (hex.y * ((hex.parentTriangle.id / 4) + 1) + hex.parentTriangle.id/4))
															hex.northPolarEdge = true;
														if((hex.parentTriangle+1) % 4 == 0 && hex.x == ((worldSize*3-hex.y-1)*((hex.parentTriangle.id+1)/4)-1))
															hex.southPolarEdge = true;
													} ) } );
	}
	
	me.croppedMap = function()
	{
		var fileName = me.world.name.replace(/'/g,"") + " UWP " + me.world.uwp + " world map cropped.png";
		var width = (5*(me.world.uwp.size)*32);
		var height = ((3*me.world.uwp.size)*28);
		var scale = 3;
		if(width*scale > 4096)
			scale = 4096 / width;
		saveSvgAsPng(document.querySelector("#" + WORLD_MAP_SVG_NAME), fileName, {scale:scale, left:me.mapCornerPoints[0].x, top:me.mapCornerPoints[0].y, width:width, height:height});
	}
	
	me.generate = function()
	{	
		if(me.world.uwp.size == 0)
			return;
		if(!me.blank)
		{
			mountains();
			oceans();
			continents(); // not actual terrain placement, but defines a continent as all non-ocean hexes in a world triangle
			craters();
			seas();
			icecaps();
			frozenPlanet();
			tundra();
			twilightZone();
			cities();
			rural();
			chasms();
			precipices();
			ruins();
			cropLand();
			lowPopulTown();
			arcologies();
			starport();
			penal();
			waste();
			exotic();
			desert();
			if(uPObj.prefs.place_noble_estate)
				nobleLand();
			resourceHexes();
			clearTerrainAllocate();
		}
	}

	me.genSaveObj = function()
	{
		me.saveObj = [];
		if(me.world.uwp.size == 0)
		{
			me.saveObj.push("Planetoids");
			return me.saveObj;
		}
		for(var i=0;i<me.worldTriangles.length;i++)
			me.saveObj[i] = me.worldTriangles[i].saveObj();
		me.saveObj[20] = {};
		me.saveObj[20].north = [];
		me.hexes[0].terrainTypes.map(function(t)
										{
											me.saveObj[20].north.push(t.code);
										});
		me.saveObj[20].south = [];
		me.hexes[1].terrainTypes.map(function(t)
										{
											me.saveObj[20].south.push(t.code);
										});
		return me.saveObj;
	}

	me.loadObj = function(saveObj)
	{
		if(me.saveObj[0] == "Planetoids")
			return;
		me.blank = true;
		me.generate();
		me.blank = false;
		me.saveObj = saveObj;
		me.getHex(-1,-1).terrainTypes = [];
		saveObj[20].north.map(function(t)
									{
										me.getHex(-1,-1).terrainTypes.push(allTerrain[t]);
									});
		me.getHex(-2,-2).terrainTypes = [];
		saveObj[20].south.map(function(t)
									{
										me.getHex(-2,-2).terrainTypes.push(allTerrain[t]);
									});
		saveObj.forEach(function(tsObj, i)
									{
										if(i != 20)
											me.worldTriangles[i].loadObj(tsObj);
									});
	}

	me.getHexesWithin = function(selectedHex, distance)
	{
		var Q = [];
		Q.push(selectedHex);
		for(var i=0;i<distance;i++)
		{
			var currentLength = Q.length;
			for(var j=0;j<currentLength;j++)
			{
				var neighbours = Q[j].getAdjacentHexes();
				for(var k=0;k<neighbours.length;k++)
					if(Q.find(function(v) { return v.name == neighbours[k].name } ) === undefined)
						Q.push(neighbours[k]);
			}
		}
		return Q;
	}

	me.render = function()
	{
		var worldSize = me.world.uwp.size;
		if(worldSize == 0)
		{
			addText(0, 40, "Sorry, cannot produce a world map for asteroids, planetoids", "Arial, sans-serif", "2em", "black", me.parentObj);
			addText(0, 80, "or worlds reduced to size 0.", "Arial, sans-serif", "2em", "black", me.parentObj);
			return;
		}
		for(var i=0;i<me.worldTriangles.length;i++)
			me.worldTriangles[i].render(me.editMode);
		if(worldSize != 1)
		{
			for(i=0;i<2;i++)
			{
				me.worldTriangles[i].reposition(true);
				me.worldTriangles[i].render(me.editMode);
				me.worldTriangles[i].reposition(false);
			}
		}
		var x=0, y=0, z=0;
		var selectedHex, new_left_offset, copyOfIt;
		for(z=0;z<5;z++)
		{
			var startCol = worldSize + worldSize*2*z;
			x=startCol;
			for(y=0;y<worldSize-1;y++)
			{
				selectedHex = me.getHex(x,y);
				new_left_offset = selectedHex.left_offset + (worldSize-y-1)*32;
				copyOfIt = new worldHex(me, me.parentObj, selectedHex.parentTriangle, new_left_offset, selectedHex.top_offset, selectedHex.hexID);
				copyOfIt.terrainTypes = array_fnc.copy.call(selectedHex.terrainTypes);
				copyOfIt.clickEnabled = false;
				copyOfIt.render(me.editMode);
				x++;
			}
		}
		for(z=0;z<5;z++)
		{
			startCol = worldSize*2*(z+1);
			x=startCol;
			for(y=me.totalRows-1;y>me.totalRows-worldSize;y--)
			{
				selectedHex = me.getHex(x,y);
				if(z==4)
					new_left_offset = selectedHex.left_offset + (worldSize-(me.totalRows-y))*32 - worldSize*160;
				else
					new_left_offset = selectedHex.left_offset + (worldSize-(me.totalRows-y))*32;
				copyOfIt = new worldHex(me, me.parentObj, selectedHex.parentTriangle, new_left_offset, selectedHex.top_offset, selectedHex.hexID);
				copyOfIt.terrainTypes = array_fnc.copy.call(selectedHex.terrainTypes);
				copyOfIt.clickEnabled = false;
				copyOfIt.render(me.editMode);
				x++;
			}
		}
		selectedHex = me.worldTriangles[18].hexes[me.worldTriangles[18].hexes.length-1];
		new_left_offset = selectedHex.left_offset - worldSize*160;
		copyOfIt = new worldHex(me, me.parentObj, selectedHex.parentTriangle, new_left_offset, selectedHex.top_offset, selectedHex.hexID);
		copyOfIt.terrainTypes = array_fnc.copy.call(selectedHex.terrainTypes);
		copyOfIt.render(me.editMode);
		if(worldSize == 1)
		{
			var pole_hex_left_offset = me.map_left_offset;
			var pole_hex_top_offset = me.map_top_offset-28;
			for(z=0;z<6;z++)
			{
				var north_pole_hex = new worldHex(me, me.parentObj, me.worldTriangles[0], pole_hex_left_offset, pole_hex_top_offset, -1);
				north_pole_hex.terrainTypes = array_fnc.copy.call(me.getHex(-1,-1).terrainTypes);
				north_pole_hex.render(me.editMode);
				pole_hex_left_offset+=32;
			}
			pole_hex_left_offset = me.map_left_offset+16;
			pole_hex_top_offset = me.map_top_offset+56;
			for(z=0;z<5;z++)
			{
				var south_pole_hex = new worldHex(me, me.parentObj, me.worldTriangles[0], pole_hex_left_offset, pole_hex_top_offset, -2);
				south_pole_hex.terrainTypes = array_fnc.copy.call(me.getHex(-1,-1).terrainTypes);
				south_pole_hex.render(me.editMode);
				pole_hex_left_offset+=32;
			}

		}

	}

	me.outline = function(editingFlag)
	{
		if(arguments.length < 1) editingFlag = false;
		var worldSize = me.world.uwp.size;
		if(worldSize == 0)
			return;
		if(worldSize == 1)
		{
			me.outline_size_1(editingFlag);
			return;
		}
		for(var i=0;i<me.worldTriangles.length;i++)
			me.worldTriangles[i].outline();
		for(i=0;i<2;i++)
		{
			me.worldTriangles[i].reposition(true);
			me.worldTriangles[i].outline();
			me.worldTriangles[i].reposition(false);
		}
		var equatorRowVal = (3*worldSize-2)/2;
		var equatorRow = me.rows[Math.floor(equatorRowVal)];
		var eqLineY = equatorRow[0].top_offset + 17;
		if(Math.floor(equatorRowVal) != equatorRowVal)
			eqLineY += 14;
		var eqLineX = equatorRow[0].left_offset;
		var eqLength = (5*worldSize+1)*36;
		addLine(eqLineX,eqLineY,eqLineX+eqLength,eqLineY,"1","black",me.parentObj, true);

		var s;
		for(i=0;i<10;i+=2)
		{
			s = "M " + me.topCoverTrianglePoints[i].x + " " + me.topCoverTrianglePoints[i].y + " ";
			s += "L "  + me.topCoverTrianglePoints[i+1].x + " " + me.topCoverTrianglePoints[i+1].y + " ";
			s += "L "  + me.topCoverTrianglePoints[i+2].x + " " + me.topCoverTrianglePoints[i+2].y;
			addPath(s, 2, "black", "white", me.parentObj);
		}
		for(i=0;i<8;i+=2)
		{
			s = "M " + me.bottomCoverTrianglePoints[i+1].x + " " + me.bottomCoverTrianglePoints[i+1].y + " ";
			s += "L "  + me.bottomCoverTrianglePoints[i+2].x + " " + me.bottomCoverTrianglePoints[i+2].y + " ";
			s += "L "  + me.bottomCoverTrianglePoints[i+3].x + " " + me.bottomCoverTrianglePoints[i+3].y;
			addPath(s, 2, "black", "white", me.parentObj);
		}
		var sizeUsed = me.world.uwp.size < 5 ? 5 : me.world.uwp.size;
		// left blank-out rectangle
		addRectangle(0, me.mapCornerPoints[0].y, me.mapCornerPoints[0].x,me.mapCornerPoints[2].y - me.mapCornerPoints[0].y + 18,"white",0,"none", me.parentObj);
		addLine(me.mapCornerPoints[0].x, me.mapCornerPoints[0].y, me.mapCornerPoints[1].x, me.mapCornerPoints[1].y, "2px","black", me.parentObj);
		s = "" + (me.mapCornerPoints[1].x-1) + "," + me.mapCornerPoints[1].y + " ";
		s += ""  + me.mapCornerPoints[2].x + "," + me.mapCornerPoints[2].y + " ";
		s += ""  + me.mapCornerPoints[1].x-1 + "," + me.mapCornerPoints[2].y;
		addPolygon(s, 0, "none", "white", me.parentObj);
		addLine(me.mapCornerPoints[1].x, me.mapCornerPoints[1].y, me.mapCornerPoints[2].x, me.mapCornerPoints[2].y, "2px","black", me.parentObj);
		// right blank-out rectangle
		addRectangle(me.mapCornerPoints[4].x,me.mapCornerPoints[4].y,6*(sizeUsed+1)*32 - me.mapCornerPoints[4].x + 10,me.mapCornerPoints[5].y - me.mapCornerPoints[4].y + 18,"white",0,"none", me.parentObj);
		addLine(me.mapCornerPoints[4].x, me.mapCornerPoints[4].y, me.mapCornerPoints[5].x, me.mapCornerPoints[5].y, "2px","black", me.parentObj);
		s = "" + (me.mapCornerPoints[5].x+1) + "," + me.mapCornerPoints[5].y + " ";
		s += ""  + me.mapCornerPoints[3].x + "," + me.mapCornerPoints[3].y + " ";
		s += ""  + me.mapCornerPoints[5].x+1 + "," + me.mapCornerPoints[3].y;
		addPolygon(s, 0, "none", "white", me.parentObj);
		addLine(me.mapCornerPoints[3].x, me.mapCornerPoints[3].y, me.mapCornerPoints[5].x, me.mapCornerPoints[5].y, "2px","black", me.parentObj);
		addRectangle(0, 0, me.map_left_offset + 6*(sizeUsed+1)*32, me.map_top_offset-10, "white",0,"none", me.parentObj);
		addRectangle(0, me.mapCornerPoints[2].y, me.map_left_offset + 6*(sizeUsed+1)*32, 500, "white",0,"none", me.parentObj);
		if(!me.blank && !editingFlag)
		{
			me.worldText();
			me.key.render();
		}
		
		// addRectangle(me.mapCornerPoints[0].x, me.mapCornerPoints[0].y, 5*(me.world.uwp.size)*32, (3*me.world.uwp.size)*28, "none", "4px", "red", me.parentObj); 

	}

	me.outline_size_1 = function()
	{
		var worldSize = me.world.uwp.size;
		if(worldSize != 1)
			return;
		var northernPoints = [];
		var southernPoints = [];
		var cornerPoints = [];
		for(var i=1;i<=9;i+=2)
		{
			var currentHex = me.getHex(i,0);
			var point1 = new point(currentHex.left_offset,currentHex.top_offset-11);
			northernPoints.push(point1);
			if(i==1)
				cornerPoints.push(point1);
			var point2 = new point(currentHex.left_offset+16,currentHex.top_offset+17);
			northernPoints.push(point2);
			var point3 = new point(currentHex.left_offset-16,currentHex.top_offset+17);
			addPolygon(point1 + " " + point2 + " " + point3, 1, "black", "none", me.parentObj);
		}
		currentHex = me.getHex(9,0);
		point1 = new point(currentHex.left_offset+32,currentHex.top_offset-11);
		northernPoints.push(point1);
		cornerPoints.push(point1);
		point2 = new point(currentHex.left_offset+16,currentHex.top_offset+17);
		northernPoints.push(point2);
		point3 = new point(currentHex.left_offset+48,currentHex.top_offset+17);
		addPolygon(point1 + " " + point2 + " " + point3, 1, "black", "none", me.parentObj);
		for(i=0;i<12;i+=2)
		{
			currentHex = me.getHex(i,1);
			point1 = new point(currentHex.left_offset,currentHex.top_offset-11);
			point2 = new point(currentHex.left_offset+32,currentHex.top_offset-11);
			point3 = new point(currentHex.left_offset+16,currentHex.top_offset+17);
			addPolygon(point1 + " " + point2 + " " + point3, 1, "black", "none", me.parentObj);
			point1 = new point(currentHex.left_offset+16,currentHex.top_offset+17);
			if(i==10 || i==0)
				cornerPoints.push(point1);
			point3 = new point(currentHex.left_offset+32,currentHex.top_offset+45);
			southernPoints.push(point3);
			if(i==0)
				cornerPoints.push(point3);
			point2 = new point(currentHex.left_offset+48,currentHex.top_offset+17);
			southernPoints.push(point2);
			addPolygon(point1 + point2 + point3, 1, "black", "none", me.parentObj);
		}
		var s;
		for(i=0;i<10;i+=2)
		{
			s = "M " + northernPoints[i].x + " " + northernPoints[i].y + " ";
			s += "L "  + northernPoints[i+1].x + " " + northernPoints[i+1].y + " ";
			s += "L "  + northernPoints[i+2].x + " " + northernPoints[i+2].y;
			addPath(s, 1, "black", "white", me.parentObj);
		}
		for(i=0;i<10;i+=2)
		{
			s = "M " + southernPoints[i].x + " " + southernPoints[i].y + " ";
			s += "L "  + southernPoints[i+1].x + " " + southernPoints[i+1].y + " ";
			s += "L "  + southernPoints[i+2].x + " " + southernPoints[i+2].y;
			addPath(s, 1, "black", "white", me.parentObj);
		}
		addRectangle(0,cornerPoints[0].y,cornerPoints[0].x,cornerPoints[3].y - cornerPoints[0].y + 18,"white",0,"none", me.parentObj);
		addLine(cornerPoints[0].x, cornerPoints[0].y, cornerPoints[2].x, cornerPoints[2].y, "1px","black", me.parentObj);
		s = "" + (cornerPoints[2].x-1) + "," + cornerPoints[3].y + " ";
		s += ""  + cornerPoints[3].x + "," + cornerPoints[3].y + " ";
		s += ""  + cornerPoints[2].x-1 + "," + cornerPoints[2].y;
		addPolygon(s, 0, "none", "white", me.parentObj);
		addLine(cornerPoints[2].x, cornerPoints[2].y, cornerPoints[3].x, cornerPoints[3].y, "1px","black", me.parentObj);
		addRectangle(cornerPoints[1].x,cornerPoints[1].y,me.map_left_offset + 1344,me.map_top_offset + 300,"white",0,"none", me.parentObj);
		addLine(cornerPoints[1].x, cornerPoints[1].y, cornerPoints[4].x, cornerPoints[4].y, "1px","black", me.parentObj);
		addRectangle(0, 0, 1344, me.map_top_offset-10, "white", 0, "none", me.parentObj);
		addRectangle(0, cornerPoints[3].y, me.map_left_offset + 6*(me.world.uwp.size+1)*32, me.map_top_offset + 300, "white", 0, "none", me.parentObj);
		if(!me.blank)
		{
			me.worldText();
			me.key.render();
		}

	}

	me.worldText = function()
	{
		var nameFontSize = "2em";
		addText(me.map_left_offset + OUTLINE_THICKNESS, OUTLINE_THICKNESS*8, "World", "Arial, sans-serif", "0.8em", "black", me.parentObj);
		addText(me.map_left_offset + OUTLINE_THICKNESS, OUTLINE_THICKNESS*8+32, me.world.name, "Arial, sans-serif", nameFontSize,  "black", me.parentObj);

		addText(me.map_left_offset + OUTLINE_THICKNESS, OUTLINE_THICKNESS*8+64, "System", "Arial, sans-serif", "0.8em", "black", me.parentObj);
		addText(me.map_left_offset + OUTLINE_THICKNESS, OUTLINE_THICKNESS*8+96, me.world.system, "Arial, sans-serif", nameFontSize,  "black", me.parentObj);


		addText(me.map_left_offset + OUTLINE_THICKNESS + 500, OUTLINE_THICKNESS*8, "UWP", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(me.map_left_offset + OUTLINE_THICKNESS + 500, OUTLINE_THICKNESS*8+32, me.world.uwp, "Arial, sans-serif", "2em",  "black", me.parentObj);

		addText(me.map_left_offset + OUTLINE_THICKNESS + 700, OUTLINE_THICKNESS*8, "Trade Classifications and Remarks", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(me.map_left_offset + OUTLINE_THICKNESS + 700, OUTLINE_THICKNESS*8+32, me.world.tcs, "Arial, sans-serif", "2em",  "black", me.parentObj);

		addRectangle(me.map_left_offset-6, OUTLINE_THICKNESS, me.mapWidth - 10, me.mapHeight - me.map_top_offset + 190, "none", OUTLINE_THICKNESS, "black", me.parentObj);

		addLine(me.map_left_offset-8, OUTLINE_THICKNESS*8+120, me.map_left_offset + me.mapWidth - 18, OUTLINE_THICKNESS*8+120,2,"black", me.parentObj);
	}

	me.countLandHexes = function()
	{
		var numLand = 0;
		for(var i=0;i<me.hexes.length;i++)
			if(!me.hexes[i].has(oceanTerrain))
				numLand++;
		return numLand;
	}

	me.getHex = function(col, row)
	{
		return me.namedHexes["(" + col + "," + row + ")"];
	}

	me.fetchHex = function(x,y)
	{
		if(x==-1)
			return me.hexes[0];
		if(x==-2)
			return me.hexes[1];
		if(x >= me.rows[y].length)
			x -= me.rows[y].length; // wrap around
		if(x < 0)
			x = me.rows[y].length - x;
		return me.rows[y][x];
	}

	me.slideTerrain = function(slideRight)
	{
		if(arguments.length < 1)
			slideRight = true;
		var neighbourHex;
		for(var i=0;i<me.hexes.length;i++)
		{
			if(me.hexes[i].rowNumber < 0)
				continue;
			if(slideRight)
				neighbourHex = me.hexes[i].getWestNeighbour();
			else
				neighbourHex = me.hexes[i].getEastNeighbour();
			me.hexes[i].altTerrainTypes = [];
			me.hexes[i].altTerrainTypes = neighbourHex.terrainTypes.map(function(v) { return v; });
		}
		var northRow = me.world.uwp.size - 1;
		var southRow = me.world.uwp.size*2 - 1;
		var delay;
		for(var row=0;row<me.rows.length;row++)
		{
			delay = 0;
			if(row < northRow)
				delay = northRow - row;
			if(row > southRow)
				delay = row - southRow;
			if(delay > SLIDE_COUNTER)
				continue;
			for(var j=0;j<me.rows[row].length;j++)
			{
				var hex = me.rows[row][j];
				hex.terrainTypes = [];
				hex.terrainTypes = hex.altTerrainTypes.map(function (v) { return v; });
			}
		}
		if(SLIDE_COUNTER > me.world.uwp.size-2)
			SLIDE_COUNTER = 0;
		else
			SLIDE_COUNTER++;
		do
		{
			me.parentObj.removeChild(me.parentObj.childNodes[0]);
		}
		while(me.parentObj.hasChildNodes());
		me.render();
		me.outline();
	}

	function oceans()
	{
		if(me.world.uwp.hydro == 0)
			return;
		if(me.world.uwp.hydro == 10)
		{
			oceans3();
			return;
		}
		if(me.world.uwp.size < 5 && me.world.uwp.hydro > 7)
		{
			oceans2();
			return;
		}
		oceans1();
	}

	function oceans1()
	{
		if(me.world.uwp.size == 1)
		{
			var numOceanHexes = Math.round(me.world.uwp.hydro*1.2);
			var shuffledHexes = shuffle(me.hexes);
			for(var i=0;i<numOceanHexes;i++)
				addOcean(shuffledHexes[i]);
			me.skipSeas = true;
			return;
		}
		var shuffledTriangles = shuffle(me.worldTriangles);
		for(var i=0;i<me.world.uwp.hydro*2;i++)
		{
			var triangleSelected = shuffledTriangles[i];
			me.oceanTriangleIDs.push(triangleSelected.id);
			var startHexes = triangleSelected.getCentreHexes();
			var anOcean = [];
			for(var j=0;j<startHexes.length;j++)
				if(!startHexes[j].has(oceanTerrain))
					anOcean.push(startHexes[j]);
			if(anOcean.length==0)
			{
				var shuffledHexes = shuffle(triangleSelected.hexes);
				shuffledHexes.sort(sort_land_first);
				newStartHex = shuffledHexes[0];
				anOcean.push(newStartHex);
			}
			startLength = anOcean.length;
			for(var j=0;j<triangleSelected.hexes.length - startLength;j++)
			{
				var allNeighbours = [];
				for(var k=0;k<anOcean.length;k++)
				{
					var neighbours = anOcean[k].getAdjacentHexes();
					for(var l=0;l<neighbours.length;l++)
					{
 						if(allNeighbours.find(function(v){ return v.name == neighbours[l].name}) === undefined && anOcean.find(function(v) { return v.name == neighbours[l].name } ) === undefined && !neighbours[l].has(oceanTerrain))
							allNeighbours.push(neighbours[l]);
					}
				}
				if(allNeighbours.length > 0)
					anOcean.push(array_fnc.random.call(allNeighbours));
			}
			me.worldOceans.push(anOcean);
			for(j=0;j<anOcean.length;j++)
				addOcean(anOcean[j]);
		}
	}

	function oceans2()
	{
		var numOceanHexes = Math.floor(me.numHexes*0.1*me.world.uwp.hydro);
		var shuffledHexes = shuffle(me.hexes);
		for(var i=0;i<numOceanHexes;i++)
			addOcean(shuffledHexes[i]);
		me.skipSeas = true;
		continents();
	}

	function oceans3()
	{
		for(var i=0;i<me.hexes.length;i++)
			addOcean(me.hexes[i]);
		me.skipSeas = true;
	}

	function addOcean(selectedHex)
	{
		if(me.world.tcs.has("Va"))
			return;
		selectedHex.terrainTypes.push(oceanTerrain);
		selectedHex.clear = false;
		if(selectedHex.has(mountainTerrain))
		{
			selectedHex.erase(mountainTerrain);
			selectedHex.add(islandTerrain);
		}
	}

	function continents()
	{
		for(i=0;i<20;i++)
		{
			var aContinent = [];
			for(j=0;j<me.worldTriangles[i].hexes.length;j++)
				if(!me.worldTriangles[i].hexes[j].has(oceanTerrain))
					aContinent.push(me.worldTriangles[i].hexes[j]);
			if(aContinent.length != 0)
				me.worldContinents.push(aContinent);
		}
	}

	function mountains()
	{
		if(me.world.uwp.size == 1)
		{
			var numMountains = dice(1);
			var shuffledHexes = shuffle(me.hexes);
			for(var i=0;i<numMountains;i++)
				shuffledHexes[i].add(mountainTerrain);
			return;
		}
		for(var i=0;i<me.worldTriangles.length;i++)
		{
			var numMountains = Math.min(dice(1), triangleNumber(me.world.uwp.size-1));
			var shuffledHexes = shuffle(me.worldTriangles[i].hexes);
			for(var j=0;j<numMountains;j++)
				shuffledHexes[j].add(mountainTerrain);
		}
	}

	function chasms()
	{
		if(me.world.uwp.size == 1)
		{
			var shuffledHexes = shuffle(me.hexes);
			var numChasms = d3();
			for(var i=0;i<numChasms;i++)
				shuffledHexes[i].add(chasmTerrain);
			return;
		}
		var shuffledTriangles = shuffle(me.worldTriangles);
		for(var i=0;i<me.world.uwp.size;i++)
		{
			var numChasms = Math.min(dice(1), triangleNumber(me.world.uwp.size-1));
			var shuffledHexes = shuffle(shuffledTriangles[i].hexes);
			for(var j=0;j<numChasms;j++)
				shuffledHexes[j].add(chasmTerrain);
		}
	}

	function precipices()
	{
		if(me.world.uwp.size == 1)
		{
			array_fnc.random.call(me.hexes).add(precipiceTerrain);
			return;
		}
		var shuffledTriangles = shuffle(me.worldTriangles);
		for(var i=0;i<me.world.uwp.size;i++)
			array_fnc.random.call(shuffledTriangles[i].hexes).add(precipiceTerrain);
	}

	function ruins()
	{
		if(!me.world.tcs.has("Di"))
			return;
		if(me.world.uwp.size == 1)
		{
			numRuins = dice(1);
			var shuffledHexes = shuffle(me.hexes);
			for(var i=0;i<numRuins;i++)
				shuffledHexes[i].add(ruinsTerrain);
			return;
		}
		for(var i=0;i<me.worldTriangles.length;i++)
		{
			var numRuins = Math.min(dice(1), triangleNumber(me.world.uwp.size-1));
			var shuffledHexes = shuffle(me.worldTriangles[i].hexes);
			for(var j=0;j<numRuins;j++)
				shuffledHexes[j].add(ruinsTerrain);
		}
	}

	function craters()
	{
		if(!me.world.tcs.has("Va"))
			return;
		if(me.world.uwp.size == 1)
		{
			var numCraters = dice(1);
			var shuffledHexes = shuffle(me.hexes);
			for(var i=0;i<numCraters;i++)
				shuffledHexes[i].add(cratersTerrain);
			return;
		}
		for(var i=0;i<me.worldTriangles.length;i++)
		{
			var numCraters = Math.min(dice(1), triangleNumber(me.world.uwp.size-1));
			var shuffledHexes = shuffle(me.worldTriangles[i].hexes);
			for(var j=0;j<numCraters;j++)
				shuffledHexes[j].add(cratersTerrain);
		}
	}

	function desert()
	{
		if(!me.world.tcs.has("De"))
			return;
		for(var i=0;i<me.hexes.length;i++)
                    if(!me.hexes[i].has(oceanTerrain) && !me.hexes[i].has(icecapTerrain))
			me.hexes[i].add(desertTerrain);
	}

	function seas()
	{
		if(me.skipSeas)
			return;
		if(me.countLandHexes() <= me.world.uwp.hydro) // i.e. if the number of available land hexes is less than or equal to the number of seas we're about to place, don't do it
			return;
		var shuffledContinents = shuffle(me.worldContinents);
		for(i=0;i<me.world.uwp.hydro;i++)
			addOcean(array_fnc.random.call(shuffledContinents[i]));
	}

	function icecaps()
	{
		if(me.systemZone == "I" || me.world.tcs.has("Tz"))
			return;
		var iceCapRows = Math.floor(me.world.uwp.hydro/2)-1;
		if(me.world.uwp.size == 1)
		{
			switch(iceCapRows)
			{
				case -1:
					return;
				case 0:
					me.hexes[0].add(icecapTerrain);
					me.hexes[0].clear = false;
					me.hexes[1].add(icecapTerrain);
					me.hexes[1].clear = false;
					break;
				default:
					for(var i=0;i<me.hexes.length;i++)
					{
						me.hexes[i].add(icecapTerrain);
						me.hexes[i].clear = false;
					}
			}
			return;
		}
		if(me.world.tcs.has("Ic"))
			iceCapRows = Math.min(iceCapRows + dice(1),me.world.uwp.size*2);
		if(iceCapRows > -1)
		{
                        if(me.getHex(-1,-1).has(islandTerrain))
                        {
                                me.getHex(-1,-1).erase(islandTerrain);
                                me.getHex(-1,-1).add(mountainTerrain);
                        }
			me.getHex(-1,-1).add(icecapTerrain);
			me.getHex(-1,-1).clear = false;
                        if(me.getHex(-2,-2).has(islandTerrain))
                        {
                                me.getHex(-2,-2).erase(islandTerrain);
                                me.getHex(-2,-2).add(mountainTerrain);
                        }
			me.getHex(-2,-2).add(icecapTerrain);
			me.getHex(-2,-2).clear = false;
		}
		for(var i=0;i<me.worldTriangles.length;i++)
			for(var j=0;j<me.worldTriangles[i].hexes.length;j++)
			{
				if(me.worldTriangles[i].hexes[j].rowNumber < iceCapRows || ((me.totalRows - me.worldTriangles[i].hexes[j].rowNumber - 1) < iceCapRows))
				{
                                        if(me.worldTriangles[i].hexes[j].has(islandTerrain))
                                        {
                                                me.worldTriangles[i].hexes[j].erase(islandTerrain);
                                                me.worldTriangles[i].hexes[j].add(mountainTerrain);
                                        }
					me.worldTriangles[i].hexes[j].add(icecapTerrain)
					me.worldTriangles[i].hexes[j].erase(oceanTerrain);
					me.worldTriangles[i].hexes[j].clear = false;
				}
			}
	}

	function frozenPlanet()
	{
		if(!me.world.tcs.has("Fr"))
			return;
		
		for(var i=0;i<me.hexes.length;i++)
		{
			var hex = me.hexes[i];
			if(hex.has(icecapTerrain))
				continue;
			if(hex.has(oceanTerrain))
			{
                                if(hex.has(islandTerrain))
                                {
                                        hex.erase(islandTerrain);
                                        hex.add(mountainTerrain);
                                }
				hex.erase(oceanTerrain);
				hex.add(iceFieldTerrain);
			}
			else
			{
				hex.add(frozenLandTerrain);
			}
		}
	}

	function tundra()
	{
		if(!me.world.tcs.has("Tu"))
			return;
		var numTundraRows = dice(1);
		for(var i=0;i<me.worldTriangles.length;i++)
			for(var j=0;j<me.worldTriangles[i].hexes.length;j++)
			{
				var hex = me.worldTriangles[i].hexes[j];
				if(hex.rowNumber > numTundraRows && (me.totalRows - hex.rowNumber - 1) > numTundraRows)
					continue;
				if(hex.has(icecapTerrain))
					continue;
				if(hex.has(oceanTerrain))
				{
                                        if(hex.has(islandTerrain))
                                        {
                                                hex.erase(islandTerrain);
                                                hex.add(mountainTerrain);
                                        }
					hex.erase(oceanTerrain);
					hex.add(iceFieldTerrain);
				}
				else
				{
					hex.add(frozenLandTerrain);
				}
			}
	}

	function cropLand()
	{
		var Agricultural = me.world.tcs.has("Ag");
		var Farming = me.world.tcs.has("Fa");
		if(!Agricultural && !Farming)
			return;
		if(me.world.uwp.size == 1)
		{
			var numCropLand = 0;
			if(Agricultural)
				numCropLand = dice(2);
			if(Farming)
				numCropLand = dice(1);
			var numLand = 0;
			numCropLand = Math.min(me.countLandHexes(),numCropLand);
			var shuffledHexes = shuffle(me.hexes);
			for(var j=0;j<numCropLand;j++)
				shuffledHexes[j].add(cropTerrain);
			return;
		}
		for(var i=0;i<me.worldContinents.length;i++)
		{
			if(me.worldContinents[i].length == 0)
				continue;
			var numCropLand = 0;
			if(Agricultural)
				numCropLand = dice(2);
			if(Farming)
				numCropLand = dice(1);
			numCropLand = Math.min(numCropLand,me.worldContinents[i].length-1);
			var shuffledHexes = shuffle(me.worldContinents[i]);
			for(var j=0;j<numCropLand;j++)
				shuffledHexes[j].add(cropTerrain);
		}
	}

	function lowPopulTown()
	{
		if(!me.world.tcs.has("Lo") && !me.world.tcs.has("Ni"))
			return;
		var shuffledHexes = shuffle(me.hexes);
		var selectedHex;
		shuffledHexes.sort(sort_land_first);
		selectedHex = shuffledHexes[0];
		selectedHex.add(townTerrain);
		me.theTown = selectedHex;
	}

	function cities()
	{
		if(me.world.uwp.popul < 7)
			return;
		me.cityHexes = [];
		var cityType = cityTerrain;
		if((me.world.uwp.atmos == 0 || me.world.uwp.atmos == 1 || (me.world.uwp.atmos > 9 && me.world.uwp.atmos < 13) || (me.world.atmos > 13)) && !(me.world.nativeIntLife.type.name == "Natives" || me.world.nativeIntLife.type.name == "Exotic Natives"))
			cityType = domedCityTerrain;
		if(me.world.uwp.size == 1)
		{
			for(var i=0;i<me.hexes.length;i++)
				if(!me.hexes[i].has(oceanTerrain) || me.hexes[i].has(islandTerrain))
				{
					me.hexes[i].add(cityType);
					me.cityHexes.push(me.hexes[i]);
				}
			return;
		}
		var numCities = Math.min(me.world.uwp.popul,me.worldContinents.length);
		var shuffledContinents = shuffle(me.worldContinents);
		for(i=0;i<numCities;i++)
		{
			var shuffledHexes = shuffle(shuffledContinents[i]);
			var selectedHex = shuffledHexes[0];
			selectedHex.add(cityType);
			me.cityHexes.push(selectedHex);
		}
	}

	function arcologies()
	{
		if(!me.world.tcs.has("Hi"))
			return;
		var numArcologies = Math.floor(me.world.uwp.popul / 2);
		if(me.world.uwp.size == 1)
		{
			var shuffledHexes = shuffle(me.hexes);
			for(var i=0;i<numArcologies;i++)
				shuffledHexes[i].add(arcologyTerrain);
			return;
		}
		var shuffledTriangles = shuffle(me.worldTriangles);
		for(var i=0;i<numArcologies;i++)
		{
			do
			{
				var selectedHex = array_fnc.random.call(shuffledTriangles[i].hexes);
			}
			while(selectedHex.has(oceanTerrain) && !selectedHex.has(islandTerrain));
			selectedHex.add(arcologyTerrain);
		}
	}

	function rural()
	{
		if(me.cityHexes.length == 0)
			return;
		if(me.world.uwp.size == 1)
		{
			if(me.cityHexes.length > 0)
				for(var i=0;i<me.hexes.length;i++)
					if(me.hexes[i].noTerrain())
						me.hexes[i].add(ruralTerrain);
			return;
		}
		for(var i=0;i<me.cityHexes.length;i++)
		{
			var possibleRuralHexes = me.getHexesWithin(me.cityHexes[i],me.world.uwp.popul);
			for(j=0;j<possibleRuralHexes.length;j++)
				if(possibleRuralHexes[j].noTerrain())
					possibleRuralHexes[j].add(ruralTerrain);
		}
	}

	function starport()
	{
		if(me.world.uwp.port == "X" || me.world.uwp.port == "Y")
			return;
		var selectedHex;
		if(me.cityHexes.length > 0)
			selectedHex = array_fnc.random.call(me.cityHexes);
		else
			selectedHex = me.theTown;
		if(selectedHex === null)
			selectedHex = getRandomLandHex();
		selectedHex.add(starportTerrain);
	}

	function getRandomLandHex()
	{
		do
		{
			var selectedHex = array_fnc.random.call(me.hexes);
		}
		while(selectedHex.has(oceanTerrain) && !selectedHex.has(islandTerrain));
		return selectedHex;
	}

	function penal()
	{
		if(!me.world.tcs.has("Pe"))
			return;
		var numPenal = me.world.uwp.popul;
		if(me.world.uwp.size == 1)
		{
			var shuffledHexes = shuffle(me.hexes);
			shuffledHexes.sort(sort_land_first);
			for(var i=0;i<numPenal;i++)
				shuffledHexes[i].add(penalTerrain);
			return;
		}
		var shuffledTriangles = shuffle(me.worldTriangles);
		for(var i=0;i<numPenal;i++)
		{
			do
			{
				var selectedHex = array_fnc.random.call(me.worldTriangles[i].hexes);
			}
			while(selectedHex.has(oceanTerrain) && !selectedHex.has(islandTerrain));
			selectedHex.add(penalTerrain);
		}
	}

	function waste()
	{
		if(me.world.uwp.TL < 5)
			return;
		var numWaste = dice(1);
		if(me.world.uwp.size == 1)
		{
			var shuffledHexes = shuffle(me.hexes);
			for(var i=0;i<numWaste;i++)
				shuffledHexes[i].add(wasteTerrain);
			return;
		}
		var selectedTriangle = d20()-1;
		var wasteHexes = [];
		wasteHexes[0] = array_fnc.random.call(me.worldTriangles[selectedTriangle].hexes);
		for(var i=0;i<numWaste-1;i++)
			wasteHexes[i+1] = array_fnc.random.call(wasteHexes[i].getAdjacentHexes());
		for(i=0;i<wasteHexes.length;i++)
			wasteHexes[i].add(wasteTerrain);
	}

	function exotic()
	{
		array_fnc.random.call(me.hexes).add(exoticTerrain);
	}

	function nobleLand()
	{
		if(!me.world.noblesExt || me.world.noblesExt.toString() == "")
			return;

		if(uPObj.prefs.place_several_noble_estates)
		{
			var nobz = me.world.noblesExt.toString();
			var terrain;
			var num = 1;
			for(var i=0;i<nobz.length;i++)
			{
				var nob = nobz.charAt(i);
				switch(nob)
				{
					case "B":
						terrain = nobleTerrainB;
						break;
					case "c":
						terrain = nobleTerrainc;
						break;
					case "C":
						terrain = nobleTerrainC;
						break;
					case "D":
						terrain = nobleTerrainD;
						break;
					case "e":
						terrain = nobleTerraine;
						break;
					case "E":
						terrain = nobleTerrainE;
						break;
					case "f":
						terrain = nobleTerrainf;
						num = 2;
						break;
					case "F":
						terrain = nobleTerrainF;
						num = 4;
				}
				for(var j=0;j<num;j++)
				{
					var selectedHex;
					do
					{
						selectedHex = array_fnc.random.call(me.hexes);
					}
					while((!uPObj.prefs.allow_ocean_nobz && selectedHex.has(oceanTerrain) && !selectedHex.has(islandTerrain)) || selectedHex.has(nobleTerrainB) || selectedHex.has(nobleTerrainc) || selectedHex.has(nobleTerrainC) || selectedHex.has(nobleTerrainD) || selectedHex.has(nobleTerraine) || selectedHex.has(nobleTerrainE) || selectedHex.has(nobleTerrainf) || selectedHex.has(nobleTerrainF) );
					selectedHex.add(terrain);
				}
			}
		}
		else
		{
			var selectedHex;
			do
			{
				selectedHex = array_fnc.random.call(me.hexes);
			}
			while(!uPObj.prefs.allow_ocean_nobz && selectedHex.has(oceanTerrain) && !selectedHex.has(islandTerrain))
			selectedHex.add(nobleTerrain);
		}
	}

	function resourceHexes()
	{
		var numResources = me.world.economicExt.resources;
		if(me.world.uwp.TL < 8)
			numResources -= (me.world.belts + me.world.gas_giants);
		numResources = Math.min(numResources,me.hexes.length-2);
		if(numResources <= 0)
			return;
		if(me.world.uwp.size == 1)
		{
			numResources = Math.min(numResources,12);
			var shuffledHexes = shuffle(me.hexes);
			for(var i=0;i<numResources;i++)
				shuffledHexes[i].add(resourceTerrain);
			return;
		}
		numResources = Math.min(numResources,me.hexes.length);
		for(var i=0;i<numResources;i++)
		{
			var selectedHex, selectedTriangle;
			do
			{
				selectedTriangle = d20()-1;
				selectedHex = array_fnc.random.call(me.worldTriangles[selectedTriangle].hexes);
			}
			while(selectedHex.has(resourceTerrain))
			selectedHex.add(resourceTerrain);
		}
	}

	function clearTerrainAllocate()
	{
		for(var i=0;i<me.hexes.length;i++)
			if(!me.hexes[i].hasBaseTerrain())
				me.hexes[i].terrainTypes.push(clearTerrain);
	}

	function twilightZone()
	{
		if(!me.world.tcs.has("Tz"))
			return;
		if(me.world.uwp.size == 1)
		{
			var hex = me.getHex(1,0);
			if(hex.has(oceanTerrain))
				hex.add(desertTerrainWest);
			else
				hex.add(bakedLandsWestHalfTerrain);
			hex = me.getHex(3,0);
			if(hex.has(oceanTerrain))
				hex.add(iceFieldTerrainEast);
			else
				hex.add(frozenLandTerrainEast);
			hex = me.getHex(6,1);
			if(hex.has(oceanTerrain))
				hex.add(iceFieldTerrainWest);
			else
				hex.add(frozenLandTerrainWest);
			hex = me.getHex(8,1);
			if(hex.has(oceanTerrain))
				hex.add(desertTerrainEast);
			else
				hex.add(bakedLandsEastHalfTerrain);
			hex = me.getHex(5,0);
			if(hex.has(oceanTerrain))
			{
				hex.erase(oceanTerrain);
				hex.add(iceFieldTerrain);
				hex.erase(islandTerrain);
			}
			else
			{
				hex.add(frozenLandTerrain);
			}
			hex = me.getHex(4,1);
			if(hex.has(oceanTerrain))
			{
				hex.erase(oceanTerrain);
				hex.add(iceFieldTerrain);
				hex.erase(islandTerrain);
			}
			else
			{
				hex.add(frozenLandTerrain);
			}
			hex = me.getHex(9,0);
			if(hex.has(oceanTerrain))
			{
				hex.erase(oceanTerrain);
				hex.add(desertTerrain);
				hex.erase(islandTerrain);
			}
			else
			{
				hex.add(bakedLandsTerrain);
			}
			hex = me.getHex(10,1);
			if(hex.has(oceanTerrain))
			{
				hex.erase(oceanTerrain);
				hex.add(desertTerrain);
				hex.erase(islandTerrain);
			}
			else
			{
				hex.add(bakedLandsTerrain);
			}
			return;
		}
		var zoneHexes = me.getTwilightZone();
		for(var i=0;i<me.hexes.length;i++)
		{
			if(zoneHexes.find(function(v) { return v.name == me.hexes[i].name }) !== undefined)
				continue;
			var hex = me.hexes[i];
			if(hex.columnNumber > me.twilightZoneWestCol+1 && hex.columnNumber < me.twilightZoneEastCol-1)
			{
				if(hex.has(oceanTerrain))
				{
					if(hex.has(islandTerrain))
					{
						hex.erase(islandTerrain);
						hex.add(mountainTerrain);
					}
					hex.erase(oceanTerrain);
					hex.add(iceFieldTerrain);
				}
				else
				{
					hex.add(frozenLandTerrain);
				}
			}
			if(hex.columnNumber < me.twilightZoneWestCol-1 || hex.columnNumber > me.twilightZoneEastCol+1)
			{
				if(hex.has(oceanTerrain))
				{
					if(hex.has(islandTerrain))
					{
						hex.erase(islandTerrain);
						hex.add(mountainTerrain);
					}
					hex.erase(oceanTerrain);
					hex.add(desertTerrain);
				}
				else
				{
					hex.add(bakedLandsTerrain);
				}
			}
		}
		for(i=0;i<zoneHexes.length;i++)
		{
			if(zoneHexes[i].parentTriangle == null || zoneHexes[i].parentTriangle.id == 3 || zoneHexes[i].parentTriangle.id == 12)
				continue;
			var hex = zoneHexes[i];
			if(hex.columnNumber == me.twilightZoneEastCol-1)
			{
				if(hex.has(oceanTerrain))
					hex.add(iceFieldTerrainWest);
				else
					hex.add(frozenLandTerrainWest);
			}
			if(hex.columnNumber == me.twilightZoneEastCol+1)
			{
				if(hex.has(oceanTerrain))
					hex.add(desertTerrainEast);
				else
					hex.add(bakedLandsEastHalfTerrain);
			}
			if(hex.columnNumber == me.twilightZoneWestCol-1)
			{
				if(hex.has(oceanTerrain))
					hex.add(desertTerrainWest);
				else
					hex.add(bakedLandsWestHalfTerrain);
			}
			if(hex.columnNumber == me.twilightZoneWestCol+1)
			{
				if(hex.has(oceanTerrain))
					hex.add(iceFieldTerrainEast);
				else
					hex.add(frozenLandTerrainEast);
			}
		}
/*		for(i=0;i<zoneHexes.length;i++)
			zoneHexes[i].terrainTypes.push(twilightZoneMarker); */

	}

	me.getTwilightZone = function()
	{
		var twilightZone1 = [];
		var twilightZone1a = [];
		var twilightZone2 = [];
		var twilightZone2a = [];
		var worldSize = me.world.uwp.size;
		var firstZone1Hex = me.worldTriangles[4].hexes[0];
		me.twilightZoneWestCol = firstZone1Hex.columnNumber-1;
		for(var i=0;i<me.hexes.length;i++)
			if(me.hexes[i].columnNumber > firstZone1Hex.columnNumber-3 && me.hexes[i].columnNumber < firstZone1Hex.columnNumber+1)
				twilightZone1.push(me.hexes[i]);
		twilightZone1.push(me.worldTriangles[0].hexes[0]);
		var startCol = me.worldTriangles[3].hexes[me.worldTriangles[3].hexes.length-1].columnNumber;
		var x=startCol;
		for(var y=me.totalRows-1;y>me.totalRows-worldSize+1;y--)
		{
			selectedHex = me.getHex(x,y);
			twilightZone1a.push(selectedHex);
			x++;
		}
		var firstZone2Hex = me.worldTriangles[15].hexes[me.worldTriangles[15].hexes.length-1];
		me.twilightZoneEastCol = firstZone2Hex.columnNumber-1;
		for(var i=0;i<me.hexes.length;i++)
			if(me.hexes[i].columnNumber>firstZone2Hex.columnNumber-3 && me.hexes[i].columnNumber < firstZone2Hex.columnNumber+1)
				twilightZone2.push(me.hexes[i]);
		twilightZone2.push(me.worldTriangles[11].hexes[me.worldTriangles[11].hexes.length-1]);
		startCol = me.worldTriangles[12].hexes[0].columnNumber;
		x=startCol;

		for(y=0;y<worldSize-2;y++)
		{
			selectedHex = me.getHex(x,y);
			twilightZone2a.push(selectedHex);
			x++;
		}
		var twilightZoneAll = twilightZone1.concat(twilightZone1a,twilightZone2,twilightZone2a);
		twilightZoneAll.push(me.getHex(-1,-1));
		twilightZoneAll.push(me.getHex(-2,-2));
		return twilightZoneAll;
	}

	me.init();
}

function worldTriangle(worldMapObj, worldSize, parentObj, id)
{
	var me = this;
	me.map = worldMapObj;
	me.id = id;
	me.worldSize = worldSize;
	me.parentObj = parentObj;
	me.hexes = [];
	me.outlineTriangle = null;
	
	me.init = function()
	{
		var base_left = Math.floor(me.id / 4);
		var verticle_pos = me.id % 4;
		switch(verticle_pos)
		{
			case 0:
				me.left_offset = me.map.map_left_offset+16+(base_left*me.worldSize*32);
				me.top_offset = me.map.map_top_offset;
				me.upOrDown = UP_TRIANGLE;
				me.largeOrSmall = SMALL_TRIANGLE;
				break;
			case 1:
				me.left_offset = me.map.map_left_offset+16+(base_left*me.worldSize*32);
				me.top_offset = me.map.map_top_offset+(me.worldSize-2)*28;
				me.upOrDown = DOWN_TRIANGLE;
				me.largeOrSmall = LARGE_TRIANGLE;
				break;
			case 2:
				me.left_offset = me.map.map_left_offset+me.worldSize*16+base_left*me.worldSize*32;
				me.top_offset = me.map.map_top_offset+(me.worldSize)*28;
				me.upOrDown = UP_TRIANGLE;
				me.largeOrSmall = LARGE_TRIANGLE;
				break;
			case 3:
				me.left_offset = me.map.map_left_offset+me.worldSize*16+base_left*me.worldSize*32+32;
				me.top_offset = me.map.map_top_offset+(me.worldSize)*56-28;
				me.upOrDown = DOWN_TRIANGLE;
				me.largeOrSmall = SMALL_TRIANGLE;
				break;
		}
	}

	me.generate = function()
	{
		var k = 0;
		var hexPerSide = ((me.largeOrSmall == LARGE_TRIANGLE) ? me.worldSize : me.worldSize-1);
		if(me.upOrDown == UP_TRIANGLE)
		{
			for(var i=0;i<hexPerSide;i++)
			{
				for(var j=0;j<i+1;j++)
				{
					var hex_left_offset = (me.left_offset + j*32 + (hexPerSide-i)*16);
					var hex_top_offset = (me.top_offset + i*28);
					me.hexes.push(new worldHex(me.map, me.parentObj, me, hex_left_offset, hex_top_offset, k));
					k++;
				}
			}
		}
		else
		{
			for(var i=0;i<hexPerSide;i++)
			{
				for(var j=0;j<hexPerSide-i;j++)
				{
					var hex_left_offset = (me.left_offset + j*32 + i*16);
					var hex_top_offset = (me.top_offset + (i+1)*28);
					me.hexes.push(new worldHex(me.map, me.parentObj, me, hex_left_offset, hex_top_offset, k));
					k++;
				}
			}
		}
	}

	me.saveObj = function()
	{
		var sObj = [];
		me.hexes.forEach ( function(h)
							{
								var c_h = [];
								h.terrainTypes.map(function (t)
													{
														c_h.push(t.code);
													});
								sObj.push(c_h);
							} );

		return sObj;
	}

	me.loadObj = function(sObj)
	{
		sObj.forEach ( function(h, i)
							{
								me.hexes[i].terrainTypes = [];
								h.map(function (t)
													{
														me.hexes[i].terrainTypes.push(allTerrain[t]);
													});
							} );		
	}

	me.reposition = function(forward)
	{
		var offset = 5*me.worldSize*32;
		me.left_offset += forward ? offset : -offset;
		for(var i=0;i<me.hexes.length;i++)
			me.hexes[i].left_offset += forward ? offset : -offset;
	}

	me.render = function(editFlag)
	{
		for(var i=0;i<me.hexes.length;i++)
			me.hexes[i].render(editFlag);
		if(me.largeOrSmall == SMALL_TRIANGLE && me.upOrDown == UP_TRIANGLE && me.worldSize > 1)
		{
			var pole_hex_left_offset = me.hexes[0].left_offset-16;
			var pole_hex_top_offset = me.hexes[0].top_offset-28;
			var northPole = new worldHex(me.map, me.parentObj, me, pole_hex_left_offset, pole_hex_top_offset, -1);
			northPole.terrainTypes = array_fnc.copy.call(me.map.getHex(-1,-1).terrainTypes);
			northPole.render();
		}
		if(me.largeOrSmall == SMALL_TRIANGLE && me.upOrDown == DOWN_TRIANGLE && me.worldSize > 1)
		{
			var pole_hex_left_offset = me.hexes[me.hexes.length-1].left_offset-16;
			var pole_hex_top_offset = me.hexes[me.hexes.length-1].top_offset+28;
			var southPole = new worldHex(me.map, me.parentObj, me, pole_hex_left_offset, pole_hex_top_offset, -2);
			southPole.terrainTypes = array_fnc.copy.call(me.map.getHex(-2,-2).terrainTypes);
			southPole.render();
		}

	}

	me.outline = function()
	{
		var point1, point2, point3;
		if(me.upOrDown == UP_TRIANGLE)
		{
			if(me.largeOrSmall == SMALL_TRIANGLE)
			{
				point1 = new point(me.hexes[0].left_offset,me.hexes[0].top_offset-10);
				point2 = new point(me.hexes[me.hexes.length-1].left_offset+32, me.hexes[me.hexes.length-1].top_offset+45);
				point3 = new point(me.hexes[me.hexes.length-me.worldSize+1].left_offset-32,me.hexes[me.hexes.length-me.worldSize+1].top_offset+45);
				me.map.topCoverTrianglePoints.push(point1);
				me.map.topCoverTrianglePoints.push(point2);
				if(me.id == 0)
					me.map.mapCornerPoints.push(point1);
			}
			else
			{
				point1 = new point(me.hexes[0].left_offset,me.hexes[0].top_offset-10);
				point2 = new point(me.hexes[me.hexes.length-1].left_offset+16, me.hexes[me.hexes.length-1].top_offset+17);
				point3 = new point(me.hexes[me.hexes.length-me.worldSize+1].left_offset-48,me.hexes[me.hexes.length-me.worldSize+1].top_offset+17);
			}
		}
		else
		{
			if(me.largeOrSmall == LARGE_TRIANGLE)
			{
				point1 = new point(me.hexes[0].left_offset-16,me.hexes[0].top_offset+17);
				point2 = new point(me.hexes[me.worldSize-1].left_offset+16, me.hexes[me.worldSize-1].top_offset+17);
				point3 = new point(me.hexes[me.hexes.length-1].left_offset,me.hexes[me.hexes.length-1].top_offset+45);
				if(me.id == 1)
					me.map.mapCornerPoints.push(point3);
			}
			else
			{
				point1 = new point(me.hexes[0].left_offset-32,me.hexes[0].top_offset-10);
				point2 = new point(me.hexes[me.worldSize-2].left_offset+32, me.hexes[me.worldSize-2].top_offset-10);
				point3 = new point(me.hexes[me.hexes.length-1].left_offset,me.hexes[me.hexes.length-1].top_offset+45);
				me.map.bottomCoverTrianglePoints.push(point1);
				me.map.bottomCoverTrianglePoints.push(point3);
				if(me.id == 3 || me.id == 19)
					me.map.mapCornerPoints.push(point3);
			}

		}
		addPolygon(point1 + point2 + point3, 2, "black","none", me.parentObj);
	}

	me.allHexesHave = function(terrainName)
	{
		for(var i=0;i<me.hexes.length;i++)
			if(!me.hexes[i].has(terrainName))
				return false;
		return true;
	}

	me.getCentreHexes = function()
	{
		var centreHexes = [];
		var hexPerSide = ((me.largeOrSmall == LARGE_TRIANGLE) ? me.worldSize : me.worldSize-1);
		var topRow = me.hexes[0].rowNumber;
		var centreRowOffset = (hexPerSide-1+Math.floor(hexPerSide/3))*0.5;
		var centreRow;
		var centreCol = me.upOrDown == UP_TRIANGLE ? me.hexes[0].columnNumber : me.hexes[me.hexes.length-1].columnNumber;
		if(hexPerSide < 3)
		{
			for(i=0;i<me.hexes.length;i++)
				centreHexes.push(me.hexes[i]);
			return centreHexes;
		}
		if(hexPerSide == 3)
		{
			if(me.upOrDown == DOWN_TRIANGLE)
			{
				centreHexes.push(me.hexes[1]);
				centreHexes.push(me.hexes[3]);
				centreHexes.push(me.hexes[4]);
			}
			else
			{
				centreHexes.push(me.hexes[1]);
				centreHexes.push(me.hexes[2]);
				centreHexes.push(me.hexes[4]);
			}
			return centreHexes;
		}
		if(hexPerSide > 3)
		{
			if(centreRowOffset % Math.floor(centreRowOffset) == 0)
			{
				centreRow = me.upOrDown ? (topRow + centreRowOffset) : (topRow + hexPerSide - centreRowOffset - 1);
				centreHexes.push(me.map.getHex(centreCol,centreRow));
				return centreHexes;
			}
			else
			{
				if(me.upOrDown == UP_TRIANGLE)
				{
					centreRow = topRow + centreRowOffset;
					if(Math.floor(centreRowOffset) % 2 == 0)
					{
						centreHexes.push(me.map.getHex(centreCol,Math.floor(centreRow)));
						centreHexes.push(me.map.getHex(centreCol-1,Math.floor(centreRow)+1));
						centreHexes.push(me.map.getHex(centreCol+1,Math.floor(centreRow)+1));
						return centreHexes;
					}
					else
					{
						centreHexes.push(me.map.getHex(centreCol,Math.ceil(centreRow)));
						centreHexes.push(me.map.getHex(centreCol-1,Math.floor(centreRow)));
						centreHexes.push(me.map.getHex(centreCol+1,Math.floor(centreRow)));
						return centreHexes;
					}
				}
				else
				{
					centreRow = topRow +  hexPerSide - centreRowOffset;
					if(Math.floor(centreRowOffset) % 2 == 0)
					{
						centreHexes.push(me.map.getHex(centreCol,Math.floor(centreRow)));
						centreHexes.push(me.map.getHex(centreCol-1,Math.ceil(centreRow)));
						centreHexes.push(me.map.getHex(centreCol+1,Math.ceil(centreRow)));
						return centreHexes;
					}
					else
					{
						centreHexes.push(me.map.getHex(centreCol,Math.floor(centreRow)-1));
						centreHexes.push(me.map.getHex(centreCol-1,Math.floor(centreRow)));
						centreHexes.push(me.map.getHex(centreCol+1,Math.floor(centreRow)));
						return centreHexes;
					}
				}
			}
		}
	}
	
	me.init();
	me.generate();
}

/*
TERRAIN DEFINITIONS
defines the actual drawing of terrain, its code for saving, its name, and various flags to classify them.

Type is an integer with the following meanings:
0 - base terrain: a hex must have exactly one base terrain assigned
1 - symbol: a hex can have any number of terrain classed as a symbol
2 - overlay: a hex may have 0 or 1 overlay terrain (generally the half-hexes needed for Twilight Zone worlds)
3 - key only: may not be placed on the map (e.g. scale)

*/

var resourceTerrain = {name:"Resource", code:85, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var s = "M " + (l+11) + " " + (t+7) + " ";
															s += "L " + (l+19) + " " + (t+7) + " ";
															s += "M " + (l+11) + " " + (t+18) + " ";
															s += "L " + (l+11) + " " + (t+10) + " ";
															s += "L " + (l+13) + " " + (t+10) + " ";
															s += "L " + (l+21) + " " + (t+18);
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(102,0,102)";
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:1};
var mountainTerrain = {name:"Mountain", code:21, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(77,51,25)";
															addLine(l+3,t+19,l+8,t+10,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+8,t+10,l+16,t+25,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+12,t+15,l+19,t+8,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+19,t+8,l+24,t+17,"2px",strokeColour,aWorldHex.parentObj);
															var tcs = aWorldHex.world.tcs;
															if(tcs.has("Va"))
																fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.mountain_terrain_bw_bg : uPObj.prefs.mountain_terrain_grey_bg;
															else
																fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.mountain_terrain_bw_bg : (aWorldHex.world.uwp.atmos == 1 ? uPObj.prefs.mountain_terrain_mars_bg : uPObj.prefs.mountain_terrain_default_bg);
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function(){ return this.name}, preferLand:false, type:0};
var chasmTerrain = {name:"Chasm", code:23, draw: function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(81,0,0)";
															addLine(l+3,t+22,l+5,t+22,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+5,t+22,l+10,t+30,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+22,t+30,l+27,t+22,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+27,t+22,l+29,t+22,"2px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:1};
var precipiceTerrain = {name:"Precipice", code:45, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(81,0,0)";
															addLine(l+14,t+17,l+16,t+17,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+16,t+17,l+21,t+25,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+12,t+20,l+14,t+20,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+14,t+20,l+19,t+28,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+10,t+23,l+12,t+23,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+12,t+23,l+17,t+31,"2px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:1};
var precipiceTerrainRed = {name:"Precipice", code:45, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "grey" : "red";
															addLine(l+14,t+17,l+16,t+17,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+16,t+17,l+21,t+25,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+12,t+20,l+14,t+20,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+14,t+20,l+19,t+28,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+10,t+23,l+12,t+23,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+12,t+23,l+17,t+31,"2px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:1};
var ruinsTerrain = {name:"Ruins", code:26, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(242,0,0)";
															var s = "M" + (l + 11) + " " + (t+11) + " L" + (l+11) + " " + (t+7) + " L" + (l+15) + " " + (t+7) + " L" + (l+15) + " " + (t+11) + " ";
															s += "M" + (l + 18) + " " + (t+11) + " L" + (l+18) + " " + (t+5) + " L" + (l+21) + " " + (t+5) + " L" + (l+21) + " " + (t+11) + " ";
															s += "M" + (l + 23) + " " + (t+11) + " L" + (l+26) + " " + (t+8) + " L" + (l+29) + " " + (t+11);
															addPath(s, 2, strokeColour, "none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:1};
var cratersTerrain = {name:"Craters", code:74, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(64,64,64)";
															var craterFill = uPObj.prefs.black_and_white_map ? "white" : "rgb(204,204,204)";
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(194,194,163";
															addCircle(l+16, t+17, 9, 1, strokeColour, craterFill,aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = fillColour;

														}, toString:function(){ return this.name}, preferLand:true, type:0};
var desertTerrain = {name:"Desert", code:22, draw: function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.desert_terrain_bw_bg : uPObj.prefs.desert_terrain_bg;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(230,172,0)";
															addLine(l+3,t+17,l+30,t+17,"3px",strokeColour,aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function(){ return this.name}, preferLand:false, type:0};														
var desertTerrainWest = {name:"Desert West Half Only", code:118, draw: function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.desert_terrain_bw_bg : uPObj.prefs.desert_terrain_bg;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(230,172,0)";
															addPolygon((l+16) + "," + t + " " + (l+16) + "," + (t+35) + " " + l + "," + (t+28) + " " + l + "," + (t+7), 1, "black", fillColour,aWorldHex.parentObj);
															addLine(l+3,t+17,l+16,t+17,"3px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:2};
var desertTerrainEast = {name:"Desert East Half Only", code:119, draw: function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.desert_terrain_bw_bg : uPObj.prefs.desert_terrain_bg;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(230,172,0)";
															addPolygon((l+16) + "," + t + " " + (l+32) + "," + (t+7) + " " + (l+32) + "," + (t+28) + " " + (l+16) + "," + (t+35), 1, "black", fillColour,aWorldHex.parentObj);
															addLine(l+16,t+17,l+30,t+17,"3px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:2};
var oceanTerrain = {name:"Ocean", code:31, draw: function(aWorldHex)
														{
															var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.ocean_bw_bg : uPObj.prefs.ocean_bg;
															aWorldHex.hexElem.style.fill = fillColour;
															if(uPObj.prefs.black_and_white_map)
															{
																var l = aWorldHex.left_offset;
																var t = aWorldHex.top_offset;
																var d = t+7;
																var c = t+13;
																var s = "M" + (l+4) + " " + d + " ";
																for(var i=0;i<4;i++)
																	s += "Q" + (l+7+i*6) + " " + c + " " + (l+4+(i+1)*6) + " " + d + " ";
																addPath(s, "2px", "black","none", aWorldHex.parentObj);
															}
														}, toString:function(){ return this.name}, preferLand:false, type:0};
var oceanDepthTerrain = {name:"Ocean Depth", code:71, draw: function(aWorldHex)
														{
															var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.ocean_depth_bw_bg : uPObj.prefs.ocean_depth_bg;
															aWorldHex.hexElem.style.fill = fillColour;
															if(uPObj.prefs.black_and_white_map)
															{
																var l = aWorldHex.left_offset;
																var t = aWorldHex.top_offset;
																for(var j=0;j<2;j++)
																{
																	var d = t+7+j*6;
																	var c = t+13+j*6;
																	var s = "M" + (l+4) + " " + d + " ";
																	for(var i=0;i<4;i++)
																		s += "Q" + (l+7+i*6) + " " + c + " " + (l+4+(i+1)*6) + " " + d + " ";
																	addPath(s, "2px", "black","none", aWorldHex.parentObj);
																}
															}
														}, toString:function(){ return this.name}, preferLand:false, creep:oceanTerrain, type:0};
var oceanAbyssTerrain = {name:"Ocean Abyss", code:72, draw: function(aWorldHex)
														{
															var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.ocean_abyss_bw_bg : uPObj.prefs.ocean_abyss_bg;
															aWorldHex.hexElem.style.fill = fillColour;
															if(uPObj.prefs.black_and_white_map)
															{
																var l = aWorldHex.left_offset;
																var t = aWorldHex.top_offset;
																for(var j=0;j<3;j++)
																{
																	var d = t+7+j*6;
																	var c = t+13+j*6;
																	var s = "M" + (l+4) + " " + d + " ";
																	for(var i=0;i<4;i++)
																		s += "Q" + (l+7+i*6) + " " + c + " " + (l+4+(i+1)*6) + " " + d + " ";
																	addPath(s, "2px", "black","none", aWorldHex.parentObj);
																}
															}
														}, toString:function(){ return this.name}, preferLand:false, creep:oceanDepthTerrain, type:0};
var islandTerrain = {name:"Island", code:32, draw: function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															if(!aWorldHex.has(oceanTerrain) && !aWorldHex.has(iceFieldTerrain) && !aWorldHex.has(icecapTerrain))
															{
																aWorldHex.add(oceanTerrain);
																oceanTerrain.draw(aWorldHex);
															}
															var islandFill = uPObj.prefs.black_and_white_map ? uPObj.prefs.mountain_terrain_bw_bg : uPObj.prefs.clear_terrain_default_bg;
															addCircle(l+16, t+17, 5, 1, "black", islandFill,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:0};
var icecapTerrain = {name:"Ice cap", code:36, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(81,81,81)";
															addLine(l+4,t+10,l+28,t+10,"2px",strokeColour,aWorldHex.parentObj);
															addCircle(l+9, t+6, 2, 1, strokeColour, strokeColour, aWorldHex.parentObj);
															addCircle(l+16, t+6, 2, 1, strokeColour, strokeColour,aWorldHex.parentObj);
															addCircle(l+23, t+6, 2, 1, strokeColour, strokeColour,aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = "white";
														}, toString:function(){ return this.name}, preferLand:false, type:0};
var iceFieldTerrain = {name:"Ice Field", code:44, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var s = "";
															s += "M " + (l+5) + " " + (t+10) + " L " + (l+6) + " " + (t+6) + " L " + (l+10) + " " + (t+6) + " L " + (l+11) + " " + (t+10) + " ";
															s += "M " + (l+13) + " " + (t+10) + " L " + (l+14) + " " + (t+6) + " L " + (l+18) + " " + (t+6) + " L " + (l+19) + " " + (t+10) + " ";
															s += "M " + (l+21) + " " + (t+10) + " L " + (l+22) + " " + (t+6) + " L " + (l+26) + " " + (t+6) + " L " + (l+27) + " " + (t+10) + " ";
															var s1 = "M " + (l+5) + " " + (t+15) + " Q " + (l+11) + " " + (t+11) + " " + (l+16) + " " + (t+15);
															var s2 = "M " + (l+16) + " " + (t+15) + " Q " + (l+21) + " " + (t+19) + " " + (l+27) + " " + (t+15);
															addPath(s, 2,"black","none",aWorldHex.parentObj);
															addPath(s1,2,"black","none",aWorldHex.parentObj);
															addPath(s2,2,"black","none",aWorldHex.parentObj);
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(230,236,255)";
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function(){ return this.name}, preferLand:false, type:0};
var iceFieldTerrainWest = {name:"Ice Field West Half Only", code:108, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var s = "";
															s += "M " + (l+5) + " " + (t+10) + " L " + (l+6) + " " + (t+6) + " L " + (l+10) + " " + (t+6) + " L " + (l+11) + " " + (t+10) + " ";
															s += "M " + (l+13) + " " + (t+10) + " L " + (l+14) + " " + (t+6) + " L " + (l+16) + " " + (t+6) + " ";
															var s1 = "M " + (l+5) + " " + (t+15) + " Q " + (l+11) + " " + (t+11) + " " + (l+16) + " " + (t+15);
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(230,236,255)";
															addPolygon((l+16) + "," + t + " " + (l+16) + "," + (t+35) + " " + l + "," + (t+28) + " " + l + "," + (t+7), 1, "black", fillColour,aWorldHex.parentObj);
															addPath(s, 2, "black", "none",aWorldHex.parentObj);
															addPath(s1,2,"black","none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:2};
var iceFieldTerrainEast = {name:"Ice Field East Half Only", code:109, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var s = "";
															s += "M " + (l+16) + " " + (t+6) + " L " + (l+18) + " " + (t+6) + " L " + (l+19) + " " + (t+10) + " ";
															s += "M " + (l+21) + " " + (t+10) + " L " + (l+22) + " " + (t+6) + " L " + (l+26) + " " + (t+6) + " L " + (l+27) + " " + (t+10) + " ";
															var s1 = "M " + (l+16) + " " + (t+15) + " Q " + (l+21) + " " + (t+19) + " " + (l+27) + " " + (t+15);
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(230,236,255)";
															addPolygon((l+16) + "," + t + " " + (l+32) + "," + (t+7) + " " + (l+32) + "," + (t+28) + " " + (l+16) + "," + (t+35), 1, "black", fillColour, aWorldHex.parentObj);
															addPath(s, 2, "black", "none", aWorldHex.parentObj);
															addPath(s1, 2,"black", "none", aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:2};
var frozenLandTerrain = {name:"Frozen Land", code:43, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(219,223,185)";
															addLine(l+5,t+7,l+27,t+7,"2px","black",aWorldHex.parentObj);
															addPath("M " + (l+5) + " " + (t+12) + " Q " + (l+11) + " " + (t+9) + " " + (l+16) + " " + (t+12), 2, "black", "none",aWorldHex.parentObj);
															addPath("M " + (l+16) + " " + (t+12) + " Q " + (l+21) + " " + (t+15) + " " + (l+27) + " " + (t+12), 2, "black", "none",aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function(){ return this.name}, preferLand:false, type:0};
var frozenLandTerrainWest = {name:"Frozen Land West Half Only", code:106, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(219,223,185)";
															addPolygon((l+16) + "," + t + " " + (l+16) + "," + (t+35) + " " + l + "," + (t+28) + " " + l + "," + (t+7), 1, "black", fillColour,aWorldHex.parentObj);
															addLine(l+5,t+7,l+16,t+7,"2px","rgb(0,0,0)",aWorldHex.parentObj);
															addPath("M " + (l+5) + " " + (t+12) + " Q " + (l+11) + " " + (t+9) + " " + (l+16) + " " + (t+12), 2, "black", "none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:2};
var frozenLandTerrainEast = {name:"Frozen Land East Half Only", code:107, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(219,223,185)";
															addPolygon((l+16) + "," + t + " " + (l+32) + "," + (t+7) + " " + (l+32) + "," + (t+28) + " " + (l+16) + "," + (t+35), 1, "black", fillColour,aWorldHex.parentObj);
															addLine(l+16,t+7,l+27,t+7,"2px","black",aWorldHex.parentObj);
															addPath("M " + (l+16) + " " + (t+12) + " Q " + (l+21) + " " + (t+15) + " " + (l+27) + " " + (t+12), 2, "black", "none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:2};
var cropTerrain = {name:"Crop Land", code:24, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var s = "";
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(204,153,0)";
															for(var i=1;i<=7;i++)
																s += "M " + (l+i*4) + " " + (t+14) + " L " + (l+i*4) + " " + (t+23) + " ";
															addPath(s, 2, strokeColour, "none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var townTerrain = {name:"Town", code:55, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,255)";
															addRectangle(l+20, t+23, 7, 7, "none", "2px", strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var cityTerrain = {name:"City", code:51, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,255)";
															addRectangle(l+17, t+20, 4, 4, "none", "1px", strokeColour,aWorldHex.parentObj);
															addRectangle(l+23, t+20, 4, 4, "none", "1px", strokeColour,aWorldHex.parentObj);
															addRectangle(l+17, t+26, 4, 4, "none", "1px", strokeColour,aWorldHex.parentObj);
															addRectangle(l+23, t+26, 4, 4, "none", "1px", strokeColour,aWorldHex.parentObj);
															addRectangle(l+14, t+25, 1, 1, "none", "1px", strokeColour,aWorldHex.parentObj);
															addRectangle(l+29, t+25, 1, 1, "none", "1px", strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var suburbTerrain = {name:"Suburb", code:54, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															addCircle(l+6, t+21, 2, 1, "black","black",aWorldHex.parentObj);
															addCircle(l+7, t+15, 2, 1, "black","black",aWorldHex.parentObj);
															addCircle(l+11, t+10, 2, 1, "black","black",aWorldHex.parentObj);
															addCircle(l+16, t+6, 2, 1, "black","black",aWorldHex.parentObj);
															addCircle(l+22, t+4, 2, 1, "black","black",aWorldHex.parentObj);
															addCircle(l+12, t+19, 2, 1, "black","black",aWorldHex.parentObj);
															addCircle(l+14, t+15, 2, 1, "black","black",aWorldHex.parentObj);
															addCircle(l+17, t+12, 2, 1, "black","black",aWorldHex.parentObj);
															addCircle(l+21, t+9, 2, 1, "black","black",aWorldHex.parentObj);
														}, toString:function() { return this.name }, preferLand:true, type:1};
var domedCityTerrain = {name:"Domed City", code:52, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,255)";
															addLine(l+4,t+27,l+28,t+27,"2px",strokeColour,aWorldHex.parentObj);
															addPath("M " + (l+7) + " " + (t+27) + " Q " + (l+16) + " " + (t+17) + " " + (l+25) + " " + (t+27),2,strokeColour,"none",aWorldHex.parentObj);
														}, toString:function() { return this.name }, preferLand:true, type:1};
var arcologyTerrain = {name:"Arcology", code:53, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,255)";
															var s = "M " + (l+2) + " " + (t+12) + " L " + (l+2) + " " + (t+6) + " L " + (l+16) + " " + (t+6) + " L " + (l+16) + " " + (t+12);
															addPath(s, 1, strokeColour, "none",aWorldHex.parentObj);
															addRectangle(l+4,t+8,4,4,"none","1px",strokeColour,aWorldHex.parentObj);
															addRectangle(l+10,t+8,4,4,"none","1px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var ruralTerrain = {name:"Rural", code:25, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(230,46,0)";
															for(var i=0;i<3;i++)
																addLine((l+2)+i*5,(t+16)+i*4,(l+2)+i*5,(t+23)+i*4,"2px",strokeColour,aWorldHex.parentObj);
															for(i=0;i<2;i++)
																addLine(l+2,(t+17)+i*3,l+13,(t+27)+i*3,"2px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var starportTerrain = {name:"Starport", code:56, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "red";
															addCircle(l+16, t+17, 5, 1, strokeColour, "none",aWorldHex.parentObj)
															addLine(l+16,t+7,l+16,t+28,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+6,t+17,l+26,t+17,"2px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var bakedLandsTerrain = {name:"Baked Lands", code:41, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(204,0,0)";
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(255,119,51)";
															for(var i=0;i<7;i++)
																addRectangle(l+3+i*4,t+7,2,2,strokeColour,"1px",strokeColour,aWorldHex.parentObj);
															addLine(l+3,t+11,l+29,t+11,"2px",strokeColour,aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function(){ return this.name}, preferLand:false, type:0};
var bakedLandsWestHalfTerrain = {name:"Baked Lands West Half Only", code:104, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(204,0,0)";
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(255,119,51)";
															addPolygon((l+16) + "," + t + " " + (l+16) + "," + (t+35) + " " + l + "," + (t+28) + " " + l + "," + (t+7), 1, "black", fillColour,aWorldHex.parentObj);
															for(var i=0;i<4;i++)
																addRectangle(l+3+i*4,t+7,2,2,strokeColour,"1px",strokeColour,aWorldHex.parentObj);
															addLine(l+3,t+11,l+16,t+11,"2px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:2};
var bakedLandsEastHalfTerrain = {name:"Baked Lands East Half Only", code:105, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(204,0,0)";
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(255,119,51)";
															addPolygon((l+16) + "," + t + " " + (l+32) + "," + (t+7) + " " + (l+32) + "," + (t+28) + " " + (l+16) + "," + (t+35), 1, "black", fillColour,aWorldHex.parentObj);
															for(var i=4;i<7;i++)
																addRectangle(l+3+i*4,t+7,2,2,strokeColour,"1px",strokeColour,aWorldHex.parentObj);
															addLine(l+16,t+11,l+29,t+11,"2px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:2};
var penalTerrain = {name:"Penal Settlement", code:57, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(127,127,127)";
															for(var i=0;i<3;i++)
																addLine((l+10)+i*6,t+9,(l+10)+i*6,t+27,"2px",strokeColour,aWorldHex.parentObj);
															for(i=0;i<2;i++)
																addLine(l+5,t+9+i*18,l+27,t+9+i*18,"2px",strokeColour,aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:1};
var wasteTerrain = {name:"Wasteland", code:75, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(153,153,102)";
															var s = "M " + (l+3) + " " + (t+26) + " L " + (l+6) + " " + (t+17) + " M " + (l+8) + " " + (t+21) + " L " + (l+9) + " " + (t+26);
															s += " M " + (l+12) + " " + (t+26) + " L " + (l+16) + " " + (t+11) + " L " + (l+20) + " " + (t+26) + " M " + (l+16) + " " + (t+22);
															s += " L " + (l+16) + " " + (t+26) + " M " + (l+22) + " " + (t+26) + " L " + (l+24) + " " + (t+17) + " M " + (l+26) + " " + (t+21);
															s += " L " + (l+28) + " " + (t+26);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:1};
var exoticTerrain = {name:"Exotic Terrain", code:46, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(218,139,218)";
															addLine(l+4,t+27,l+28,t+27,"2px",strokeColour,aWorldHex.parentObj);
															addPath("M " + (l+10) + " " + (t+27) + " Q " + (l+16) + " " + (t+17) + " " + (l+22) + " " + (t+27), 2, strokeColour,"none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:false, type:1};
var nobleTerrain = {name:"Noble Estate", code:82, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var nobleTerrainB = {name:"Noble Estate - Knight", code:110, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															addText(l+6,t+17,"B","Arial","8pt","black",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var nobleTerrainc = {name:"Noble Estate - Baronet", code:111, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															addText(l+6,t+17,"c","Arial","8pt","black",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var nobleTerrainC = {name:"Noble Estate - Baron", code:112, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															addText(l+6,t+17,"C","Arial","8pt","black",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var nobleTerrainD = {name:"Noble Estate - Marquis", code:113, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															addText(l+6,t+17,"D","Arial","8pt","black",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var nobleTerraine = {name:"Noble Estate - Viscount", code:114, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															addText(l+6,t+17,"e","Arial","8pt","black",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var nobleTerrainE = {name:"Noble Estate - Count", code:115, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															addText(l+6,t+17,"E","Arial","8pt","black",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var nobleTerrainf = {name:"Noble Estate - Duke", code:116, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															addText(l+6,t+17,"f","Arial","8pt","black",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};
var nobleTerrainF = {name:"Noble Estate - Duke (Capital)", code:117, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(255,0,191)";
															var s = "M " + (l+5) + " " + (t+8) + " L " + (l+14) + " " + (t+8) + " L " + (l+14) + " " + (t+17);
															s += " L " + (l+10) + " " + (t+21) + " L " + (l+9) + " " + (t+21) + " L " + (l+5) + " " + (t+17);
															s += " L " + (l+5) + " " + (t+8);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															addText(l+6,t+17,"F","Arial","8pt","black",aWorldHex.parentObj);
														}, toString:function(){ return this.name}, preferLand:true, type:1};

var clearTerrain = {name:"Clear", code: 11, draw:function(aWorldHex)
														{
															var tcs = aWorldHex.world.tcs;
															var fillColour;
															if(tcs.has("Va"))
																fillColour = (uPObj.prefs.black_and_white_map) ? "white" : uPObj.prefs.clear_terrain_grey_bg;
															else
																fillColour = (uPObj.prefs.black_and_white_map) ? "white" : (aWorldHex.world.uwp.atmos == 1 ? uPObj.prefs.clear_terrain_mars_bg : uPObj.prefs.clear_terrain_default_bg);
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function(){ return this.name}, preferLand:false, type:0};
var roughTerrain = {name:"Rough", code: 13, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(204,156,0)";
															for(var i=0;i<2;i++)
															{
																var s = "M " + (l+6+i*14) + " " + (t+23) + " L " + (l+6+i*14) + " " + (t+21) + " L " + (l+10+i*14) + " " + (t+21) + " ";
																s += "L " + (l+10+i*14) + " " + (t+26) + " L " + (l+15+i*14) + " " + (t+26);
																addPath(s, 2, "black","none",aWorldHex.parentObj);
															}
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function(){ return this.name }, preferLand:true, type:0};
var woodsTerrain = {name:"Woods", code:14, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(0,51,0)";
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(2,162,58)";
															var s = "M " + (l+17) + " " + (t+21) + " L " + (l+17) + " " + (t+12) + " ";
															s += "M " + (l+12) + " " + (t+15) + " Q " + (l+9) + " " + (t+12) + " " + (l+11) + " " + (t+9) + " ";
															s += "Q " + (l+13) + " " + (t+5) + " " + (l+17) + " " + (t+5) + " ";
															s += "Q " + (l+23) + " " + (t+5) + " " + (l+22) + " " + (t+10) + " ";
															s += "Q " + (l+25) + " " + (t+12) + " " + (l+22) + " " + (t+14);
															addPath(s, 2, strokeColour,"none",aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function(){ return this.name}, preferLand:true, type:0};
var swampTerrain = {name:"Swamp", code:15, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(151,172,32)";
															addLine(l+6,t+22,l+29,t+22,"2px","black",aWorldHex.parentObj);
															addLine(l+17,t+22,l+17,t+8,"2px","black",aWorldHex.parentObj);
															addLine(l+17,t+22,l+8,t+13,"2px","black",aWorldHex.parentObj);
															addLine(l+17,t+22,l+27,t+13,"2px","black",aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function() {return this.name}, preferLand:true, type:0};
var marshTerrain = {name:"Marsh", code:12, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : "rgb(0,34,0)";
															var fillColour = uPObj.prefs.black_and_white_map ? "white" : "rgb(151,172,32)";
															addLine(l+5,t+17,l+31,t+17,"2px",strokeColour,aWorldHex.parentObj);
															addLine(l+9,t+12,l+27,t+12,"2px",strokeColour,aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = fillColour;
														}, toString:function() {return this.name} , preferLand:true, type:0};
var lakeTerrain = {name:"Lake", code:35, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var lakeFill = uPObj.prefs.black_and_white_map ? "rgb(127,127,127)" : "blue";
															addCircle(l+16, t+17, 8, 1, "black", lakeFill,aWorldHex.parentObj);
														}, toString:function() {return this.name} , preferLand:true, type:0};
var lakeTerrain2 = {name: "Lake", code: 37, draw:function(aWorldHex)
														{
															var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.ocean_bw_bg : uPObj.prefs.ocean_bg;
															aWorldHex.hexElem.style.fill = fillColour;
															if(uPObj.prefs.black_and_white_map)
															{
																var l = aWorldHex.left_offset;
																var t = aWorldHex.top_offset;
																var d = t+7;
																var c = t+13;
																var s = "M" + (l+4) + " " + d + " ";
																for(var i=0;i<4;i++)
																	s += "Q" + (l+7+i*6) + " " + c + " " + (l+4+(i+1)*6) + " " + d + " ";
																addPath(s, "2px", "black","none", aWorldHex.parentObj);
															}
														}, toString:function() { return this.name }, preferLand:false, type:0};
var worldHexScale = {name:"World Hex Scale", code:100, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															addLine(l+2,t+17,l+30,t+17,"2px","black",aWorldHex.parentObj);
															addLine(l+2,t+17,l+5,t+14,"2px","black",aWorldHex.parentObj);
															addLine(l+2,t+17,l+5,t+20,"2px","black",aWorldHex.parentObj);
															addLine(l+27,t+14,l+30,t+17,"2px","black",aWorldHex.parentObj);
															addLine(l+27,t+20,l+30,t+17,"2px","black",aWorldHex.parentObj);
															addText(l+2, t+27, "1,000 km", "Arial, sans-serif", "8px", "black", aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = "white";
														}, toString:function() {return this.name} , preferLand:false, type:3};
var terrainHexScale = {name:"Terrain Hex Scale", code:101, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															addLine(l+25,t+2,l+25,t+30,"2px","black",aWorldHex.parentObj);
															addLine(l+25,t+2,l+22,t+5,"2px","black",aWorldHex.parentObj);
															addLine(l+25,t+2,l+28,t+5,"2px","black",aWorldHex.parentObj);
															addLine(l+22,t+27,l+25,t+30,"2px","black",aWorldHex.parentObj);
															addLine(l+28,t+27,l+25,t+30,"2px","black",aWorldHex.parentObj);
															addText(l+2,t+17,"100 km", "Arial, sans-serif","8px","black",aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = "white";
														}, toString:function() {return this.name} , preferLand:false, type:3};
var localHexScale = {name:"Local Hex Scale", code:102, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															addLine(l+2,t+17,l+30,t+17,"2px","black",aWorldHex.parentObj);
															addLine(l+2,t+17,l+5,t+14,"2px","black",aWorldHex.parentObj);
															addLine(l+2,t+17,l+5,t+20,"2px","black",aWorldHex.parentObj);
															addLine(l+27,t+14,l+30,t+17,"2px","black",aWorldHex.parentObj);
															addLine(l+27,t+20,l+30,t+17,"2px","black",aWorldHex.parentObj);
															addText(l+2, t+27, "10 km", "Arial, sans-serif", "8px", "black", aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = "white";
														}, toString:function() {return this.name} , preferLand:false, type:3};
var singleHexScale = {name:"Single Hex Scale", code:103, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															addLine(l+25,t+2,l+25,t+30,"2px","black",aWorldHex.parentObj);
															addLine(l+25,t+2,l+22,t+5,"2px","black",aWorldHex.parentObj);
															addLine(l+25,t+2,l+28,t+5,"2px","black",aWorldHex.parentObj);
															addLine(l+22,t+27,l+25,t+30,"2px","black",aWorldHex.parentObj);
															addLine(l+28,t+27,l+25,t+30,"2px","black",aWorldHex.parentObj);
															addText(l+2,t+17,"1 km", "Arial, sans-serif","8px","black",aWorldHex.parentObj);
															aWorldHex.hexElem.style.fill = "white";
														}, toString:function() {return this.name} , preferLand:false, type:3};
var mineTerrain = {name:"Mine", code:84, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															addLine(l+10,t+22,l+11,t+9,"2px","black",aWorldHex.parentObj);
															addLine(l+7,t+9,l+26,t+9,"2px","black",aWorldHex.parentObj);
															addLine(l+23,t+22,l+22,t+9,"2px","black",aWorldHex.parentObj);
														}, toString:function() {return this.name } , preferLand:true, type:1};
var oilTerrain = {name:"Oil", code:86, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															addLine(l+11,t+25,l+15,t+4,"2px","black",aWorldHex.parentObj);
															addLine(l+20,t+4,l+24,t+25,"2px","black",aWorldHex.parentObj);
															addLine(l+15,t+4,l+20,t+4,"2px","black",aWorldHex.parentObj);
															addLine(l+14,t+9,l+21,t+9,"2px","black",aWorldHex.parentObj);
															addLine(l+13,t+15,l+22,t+15,"2px","black",aWorldHex.parentObj);
															addLine(l+12,t+21,l+23,t+21,"2px","black",aWorldHex.parentObj);
														}, toString:function() { return this.name }, preferLand:false, type:1};
var volcanoTerrain = {name:"Volcano", code:81, draw:function(aWorldHex)
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var s = "M" + (l+5) + " " + (t+25) + " Q" + (l+12) + " " + (t+17) + " " + (l+12) + " " + (t+7) + " ";
															s += "Q" + (l+17) + " " + (t+10) + " " + (l+21) + " " + (t+7) + " ";
															s += "Q" + (l+20) + " " + (t+17) + " " + (l+27) + " " + (t+25);
															addPath(s, "2px", "black","none", aWorldHex.parentObj);
														}, toString:function() { return this.name }, preferLand:true, type:0};
var borderRedNNETerrain = {name:"Border N NE", code:120, draw: function (aWorldHex) 
														{ 
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+15,t+1,l+31,t+8,"3px",strokeColour,aWorldHex.parentObj,true);
														}, toString: function () { return this.name }, preferLand: false, type:1};
var borderRedNESETerrain = {name:"Border NE SE", code:121, draw: function (aWorldHex) 
														{ 
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+31, t+8, l+31, t+29, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString:function () { return this.name }, preferLand: false, type:1};
var borderRedSESTerrain = {name: "Border SE S", code: 122, draw: function (aWorldHex) 
														{ 
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+31, t+27, l+15, t+34, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};														
var borderRedSSWTerrain = {name: "Border S SW", code: 123, draw: function (aWorldHex) 
														{ 
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+15, t+34, l+1, t+27, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};														
var borderRedSWNWTerrain = {name: "Border SW NW", code: 124, draw: function (aWorldHex) 
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+1, t+27, l+1, t+8, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};
var borderRedNWNTerrain = {name: "Border NW N", code: 125, draw: function (aWorldHex) 
														{ 
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+1, t+8, l+15, t+1, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};
var borderRedCNTerrain = {name: "Border Centre N", code: 126, draw: function (aWorldHex)
														{ 
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+16, t+0, l+17, t+18, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};
var borderRedCNETerrain = {name: "Border Centre NE", code: 127, draw: function (aWorldHex) 
														{ 
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+32, t+7, l+17, t+18, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};
var borderRedCSETerrain = {name: "Border Centre SE", code: 128, draw: function (aWorldHex) 
														{ 
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+32, t+28, l+17, t+18, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};
var borderRedCSTerrain = {name: "Border Centre S", code: 129, draw: function (aWorldHex) 
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+16, t+35, l+17, t+18, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};
var borderRedCSWTerrain = {name: "Border Centre SW", code: 130, draw: function (aWorldHex) 
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+0, t+28, l+17, t+18, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};
var borderRedCNWTerrain = {name: "Border Centre NW", code: 131, draw: function (aWorldHex) 
														{
															var l = aWorldHex.left_offset;
															var t = aWorldHex.top_offset;
															var strokeColour = uPObj.prefs.black_and_white_map ? "black" : uPObj.prefs.border_colour;
															addLine(l+0, t+7, l+17, t+18, "3px", strokeColour, aWorldHex.parentObj, true);
														}, toString: function () { return this.name }, preferLand: false, type:1};

var allTerrain = {
	11:clearTerrain,
	12:marshTerrain,
	13:roughTerrain,
	14:woodsTerrain,
	15:swampTerrain,
	21:mountainTerrain,
	22:desertTerrain,
	23:chasmTerrain,
	24:cropTerrain,
	25:ruralTerrain,
	26:ruinsTerrain,
	31:oceanTerrain,
	32:islandTerrain,
	35:lakeTerrain,
	36:icecapTerrain,
	37:lakeTerrain2,
	41:bakedLandsTerrain,
	43:frozenLandTerrain,
	44:iceFieldTerrain,
	45:precipiceTerrain,
	46:exoticTerrain,
	51:cityTerrain,
	52:domedCityTerrain,
	53:arcologyTerrain,
	54:suburbTerrain,
	55:townTerrain,
	56:starportTerrain,
	57:penalTerrain,
	71:oceanDepthTerrain,
	72:oceanAbyssTerrain,
	74:cratersTerrain,
	75:wasteTerrain,
	81:volcanoTerrain,
	82:nobleTerrain,
	84:mineTerrain,
	85:resourceTerrain,
	86:oilTerrain,
	100:worldHexScale,
	101:terrainHexScale,
	102:localHexScale,
	103:singleHexScale,
	104:bakedLandsWestHalfTerrain,
	105:bakedLandsEastHalfTerrain,
	106:frozenLandTerrainWest,
	107:frozenLandTerrainEast,
	108:iceFieldTerrainWest,
	109:iceFieldTerrainEast,
	110:nobleTerrainB,
	111:nobleTerrainc,
	112:nobleTerrainC,
	113:nobleTerrainD,
	114:nobleTerraine,
	115:nobleTerrainE,
	116:nobleTerrainf,
	117:nobleTerrainF,
	118:desertTerrainWest,
	119:desertTerrainEast,
	120:borderRedNNETerrain,
	121:borderRedNESETerrain,
	122:borderRedSESTerrain,
	123:borderRedSSWTerrain,
	124:borderRedSWNWTerrain,
	125:borderRedNWNTerrain,
	126:borderRedCNTerrain,
	127:borderRedCNETerrain,
	128:borderRedCSETerrain,
	129:borderRedCSTerrain,
	130:borderRedCSWTerrain,
	131:borderRedCNWTerrain
};

var WORLD_HEX = 0;
var TERRAIN_HEX = 1;
var LOCAL_HEX = 2;
var SINGLE_HEX = 3;
function mapHex(mapObj, parentObj, left_offset, top_offset)
{
	var me = this;
	me.map = mapObj;
	me.parentObj = parentObj;
	me.hexElem = null;
	me.left_offset = left_offset;
	me.top_offset = top_offset;
	me.terrainTypes = [];
	me.rowNumber = me.calcRow();
	me.columnNumber = me.calcCol();
	me.name = "(" + me.columnNumber + "," + me.rowNumber + ")";
	me.renderFlag = true;
	me.adjacentHexes = [];
	if(me.map) me.world = me.map.world;
	me.clickEnabled = true;
	me.edge = false;
	me.id = 0;
	me.hexType = 0;

	me.toString = function()
	{
		return me.name;
	}

	me.has = function(terrainObject)
	{
		return (me.terrainTypes.find(function(v) { return v.name == terrainObject.name }) !== undefined);
	}
	
	me.base = function()
	{
		return me.terrainTypes.find(function(v) { return v.type == 0; });
	}

	me.add = function(terrainObject)
	{
		if(!me.has(terrainObject))
			me.terrainTypes.push(terrainObject);
	}

	me.erase = function(terrainObject)
	{
		var index = me.terrainTypes.findIndex(function(v) { return v.name == terrainObject.name });
		if(index != -1)
			me.terrainTypes.splice(index, 1);
	}

	me.transform = function(oldTerrainObj, newTerrainObj)
	{
		me.erase(oldTerrainObj);
		me.add(newTerrainObj);
	}

	me.noTerrain = function()
	{
		return me.terrainTypes.length == 0;
	}
	
	me.hasBaseTerrain = function()
	{
		var i = me.terrainTypes.length;
		while(i--)
			if(me.terrainTypes[i].type == 0)
				return true;
		return false;
	}

	me.copyOf = function()
	{
		var copy = new Object();
		for(x in me)
			copy[x] = me[x];
		return copy;
	}

	me.getNeighboursIn = function(hexSet)
	{
		var neighboursInSet = [];
		var neighbours = me.getAdjacentHexes();
		for(var i=0;i<hexSet.length;i++)
		{
			for(var j=0;j<neighbours.length;j++)
				if(neighbours[j] && neighbours[j].name == hexSet[i].name)
					neighboursInSet.push(hexSet[i]);
		}
		return neighboursInSet;
	}

	me.countTerrainInNeighbours = function(terrainObj)
	{
		var neighbours = me.getAdjacentHexes();
		var n = 0;
		for(var i=0;i<neighbours.length;i++)
			if(neighbours[i] && neighbours[i].has(terrainObj))
				n++;
		return n;
	}

	me.applyPattern = function(patternString)
	{
		me.colour = parseInt(patternString.substr(0,1));
		me.number = parseInt(patternString.substr(1,2));
	}

	me.distanceTo = function(otherHex)
	{
		return Math.sqrt(Math.abs(Math.pow(otherHex.top_offset-me.top_offset,2)) + Math.abs(Math.pow(otherHex.left_offset-me.left_offset,2)));
	}

	me.closer = function(destHex,stepHex)
	{
		return me.distanceTo(destHex) > stepHex.distanceTo(destHex);
	}

	/*
	Children must implement following functions:
	me.calcRow
	me.calcCol
	me.render
	me.getAdjacentHexes
	*/
}

function worldHex(worldMapObj, parentObj, parentTriangle, left_offset, top_offset, hexID)
{
	var me = this;
	me.parentTriangle = parentTriangle;
	me.hexID = hexID;
	me.isTool = false;

	me.calcRow = function()
	{
		return me.top_offset < 0 ? me.top_offset : (me.top_offset - me.map.map_top_offset) / 28;
	}

	me.calcCol = function()
	{
		return me.left_offset < 0 ? me.left_offset : (me.left_offset - me.map.map_left_offset) / 16;
	}

	me.render = function(editFlag)
	{
		if(arguments.length < 1)
			editFlag = false;
		if(!me.renderFlag)
			return;
		var x1=16+me.left_offset;
		var y1=me.top_offset;
		var x2=32+me.left_offset;
		var y2=7+me.top_offset;
		var x3=32+me.left_offset;
		var y3=28+me.top_offset;
		var x4=16+me.left_offset;
		var y4=35+me.top_offset;
		var x5=me.left_offset;
		var y5=28+me.top_offset;
		var x6=me.left_offset;
		var y6=7+me.top_offset;
		var pointsCoord = "" + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x6 + "," + y6;
		me.hexElem = addPolygon(pointsCoord, 1, "black", "none", me.parentObj);
		
		if(me.clickEnabled)
			me.hexElem.onclick = function() { generateHexMap(me, "World Hex", worldHexMap); };
		if(editFlag)
			me.hexElem.onclick = function() { me.editTerrain(); };
		if(me.isTool)
			me.hexElem.onclick = function() { CURRENT_TOOL_CODE = me.terrainTypes[0].code; me.toolbar.map(function(v) { v.style.backgroundColor = "white"; });  me.toolDiv.style.backgroundColor = "red";};
		
		for(var i=0;i<me.terrainTypes.length;i++)
		{
			me.terrainTypes[i].draw(me);
			if(!editFlag && (me.map instanceof worldMap))
				me.map.key.addHex(me.terrainTypes[i]); 
		}
		
		if(me.hexElem.style.fill == "none" /*&& me.parentTriangle*/ && !me.map.blank)
		{
			if(me.world.tcs.has("Va"))
				var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.clear_terrain_bw_bg : uPObj.prefs.clear_terrain_grey_bg;
			else
				var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.clear_terrain_bw_bg : (me.map.world.uwp.atmos == 1 ? uPObj.prefs.clear_terrain_mars_bg : uPObj.prefs.clear_terrain_default_bg);

			me.hexElem.style.fill = fillColour;
		}
		//the following is useful debugging code
		//addText(me.left_offset+2, me.top_offset+16, me.name, "Arial", "10px","black",me.parentObj);
		//addText(me.left_offset+2, me.top_offset+16, (me.parentTriangle ? me.parentTriangle.id : ""), "Arial", "16px","#10ef10",me.parentObj);
		//addText(me.left_offset+2, me.top_offset+32, "["+(me.x !== undefined ? me.x : "U")+","+(me.y !== undefined ? me.y : "U")+"]", "Arial", "10px","#10ef10",me.parentObj);
	}
	
	me.editTerrain = function()
	{
		var terrainToAdd = allTerrain[CURRENT_TOOL_CODE];
		switch(terrainToAdd.type)
		{
			case 0:
				var terrainToReplace = me.base();
				if(terrainToAdd.name != terrainToReplace.name)
					me.transform(terrainToReplace, terrainToAdd);
				break;
			case 1:
				if(me.has(terrainToAdd))
					me.erase(terrainToAdd);
				else
					me.add(terrainToAdd);					
				break;
			case 2:
				var existingOverlay = me.terrainTypes.find(function(v) { return v.type == 1; });
				if(existingOverlay === undefined)
					me.add(terrainToAdd);
				else
					me.transform(existingOverlay, terrainToAdd);				
		}
		do
		{
			me.parentObj.removeChild(me.parentObj.childNodes[0]);
		}
		while(me.parentObj.hasChildNodes());
		me.map.render();
		me.map.outline(true);
	}
	
	// max col = 2 * 5 * size
	me.getEastNeighbour = function()
	{
		var theRow = me.map.rows[me.rowNumber];
		var i = theRow.findIndex(function(hexObj) { return hexObj.columnNumber == me.columnNumber });
		if(i == theRow.length - 1)
			return theRow[0];
		else
			return theRow[i+1];
	}

	me.getWestNeighbour = function()
	{
		var theRow = me.map.rows[me.rowNumber];
		var i = theRow.findIndex(function(hexObj) { return hexObj.columnNumber == me.columnNumber });
		if(i == 0)
			return theRow[theRow.length-1];
		else
			return theRow[i-1];
	}

	me.getAdjacentHexes = function()
	{
		var neighbours = [];
		var wsize = me.map.world.uwp.size;
		if(me.x == -1 && me.y == -1) //NORTH POLE
		{
			for(var i=0;i<me.map.rows[0].length;i++)
				neighbours.push(me.map.rows[0][i]);
			return neighbours;
		}	
		if(me.x == -2 && me.y == -2) //SOUTH POLE
		{
			for(var i=0;i<me.map.rows[3*wsize-2].length;i++)
				neighbours.push(me.map.rows[3*wsize-2][i]);
			return neighbours;
		}
		if(me.pentagon && (me.parentTriangle.id - 1) % 4 == 0) // NORTHERN PENTAGONS - all neighbours broken, need to match World Hex Map context
		{
			var triCol = (me.parentTriangle.id - 1) / 4;
			neighbours.push(me.map.fetchHex(me.x-triCol-1, me.y-1));
			neighbours.push(me.map.fetchHex(me.x-triCol, me.y-1)); // first two neighbours are the same as this is a PENTAGON
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1,me.y));
			return neighbours;
		}
		if(me.pentagon && (me.parentTriangle.id + 1) % 4 == 0) // SOUTHERN PENTAGONS
		{
			neighbours.push(me.map.fetchHex(me.x+1, me.y-1));
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x-1, me.y+1)); 
			neighbours.push(me.map.fetchHex(me.x-1, me.y+1)); // these two neighbours are the same as this is a PENTAGON
			neighbours.push(me.map.fetchHex(me.x-1,me.y));
			neighbours.push(me.map.fetchHex(me.x, me.y-1));
			return neighbours;
		}
		if(me.y == 0)
		{
			neighbours.push(me.map.hexes[0]); // NORTH POLE will be one of the neighbours
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x*2+2, me.y+1));
			neighbours.push(me.map.fetchHex(me.x*2+1, me.y+1));
			neighbours.push(me.map.fetchHex(me.x*2, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1,me.y));
			return neighbours;
		}
		if(me.y == me.map.rows.length-1)
		{
			neighbours.push(me.map.fetchHex(me.x*2+1, me.y-1));
			neighbours.push(me.map.fetchHex(me.x*2+2, me.y-1));
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x-1, me.y));
			neighbours.push(me.map.hexes[1]); // SOUTH POLE will be one of the neighbours			
			neighbours.push(me.map.fetchHex(me.x*2, me.y-1));
			return neighbours;
		}
		if(me.northPolarEdge)
		{
			var triCol = me.parentTriangle.id % 4;
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x+triCol+2, me.y+1));
			neighbours.push(me.map.fetchHex(me.x+triCol+1, me.y+1));
			neighbours.push(me.map.fetchHex(me.x+triCol, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1,me.y));
			neighbours.push(me.map.fetchHex(me.x-triCol-1, me.y-1));
			return neighbours;
		}
		if(me.map.fetchHex(me.x-1, me.y).northPolarEdge)
		{
			var triCol = me.parentTriangle.id / 4;
			neighbours.push(me.map.fetchHex(me.x-triCol, me.y-1));
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x+triCol+1, me.y+1));
			neighbours.push(me.map.fetchHex(me.x+triCol, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1,me.y));
			neighbours.push(me.map.fetchHex(me.x-triCol-1, me.y-1));
			return neighbours;
		}
		if(me.map.fetchHex(me.x-1, me.y).pentagon && (me.parentTriangle.id) % 4 == 1) // Northern Pentagon east neighbours
		{
			var triCol = (me.parentTriangle.id - 1) / 4;
			neighbours.push(me.map.fetchHex(me.x-triCol, me.y-1));
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1, me.y+1));
			neighbours.push(me.map.fetchHex(me.x, me.y-1));
			neighbours.push(me.map.fetchHex(me.x-triCol-1, me.y-1));
			return neighbours;
		}
		if(me.southPolarEdge)
		{
			var triCol = (me.parentTriangle.id - 3) / 4;
			neighbours.push(me.map.fetchHex(me.x+triCol+1, me.y-1));
			neighbours.push(me.map.fetchHex(me.x+triCol+2, me.y-1));
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x-triCol-1, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1, me.y));
			neighbours.push(me.map.fetchHex(me.x+triCol, me.y-1));
			return neighbours;
		}
		if(me.map.fetchHex(me.x-1, me.y).southPolarEdge)
		{
			var triCol = (me.parentTriangle.id - 3) / 4;
			neighbours.push(me.map.fetchHex(me.x+triCol+1, me.y-1));
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x-triCol, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-triCol-1, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1, me.y));
			neighbours.push(me.map.fetchHex(me.x+triCol, me.y-1));
			return neighbours;
		}
		if(me.map.fetchHex(me.x-1, me.y).pentagon && (me.parentTriangle.id) % 4 == 3) // Southern Pentagon east neighbours
		{
			var triCol = (me.parentTriangle.id - 3) / 4;
			neighbours.push(me.map.fetchHex(me.x+triCol+1, me.y-1));
			neighbours.push(me.map.fetchHex(me.x+1, me.y));
			neighbours.push(me.map.fetchHex(me.x-triCol, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-triCol-1, me.y+1));
			neighbours.push(me.map.fetchHex(me.x-1, me.y));
			neighbours.push(me.map.fetchHex(me.x, me.y-1));
			return neighbours;
		}
		if(me.parentTriangle.id % 4 == 0) // northern polar triangles, all other hexes
		{
			var triCol = me.parentTriangle.id / 4;
			neighbours.push(me.map.fetchHex(me.x - triCol, me.y - 1));
			neighbours.push(me.map.fetchHex(me.x + 1, me.y));
			neighbours.push(me.map.fetchHex(me.x + triCol + 1, me.y + 1));
			neighbours.push(me.map.fetchHex(me.x + triCol, me.y + 1));
			neighbours.push(me.map.fetchHex(me.x - 1, me.y));
			neighbours.push(me.map.fetchHex(me.x - triCol - 1, me.y - 1));
			return neighbours;
		}
		if(me.parentTriangle.id % 4 == 3) // southern polar triangles, all other hexes
		{
			var triCol = (me.parentTriangle.id - 3) / 4;
			neighbours.push(me.map.fetchHex(me.x + triCol + 1, me.y - 1));
			neighbours.push(me.map.fetchHex(me.x + 1, me.y));
			neighbours.push(me.map.fetchHex(me.x - triCol, me.y + 1));
			neighbours.push(me.map.fetchHex(me.x - triCol - 1, me.y + 1));
			neighbours.push(me.map.fetchHex(me.x - 1, me.y));
			neighbours.push(me.map.fetchHex(me.x + triCol, me.y - 1));
			return neighbours;
		}
		// all remaining hexes use these to get their neighbours UPTO - north west, not north east should be neighbour[0]
		neighbours.push(me.map.fetchHex(me.x + 1, me.y - 1));
		neighbours.push(me.map.fetchHex(me.x + 1, me.y));
		neighbours.push(me.map.fetchHex(me.x, me.y + 1));
		neighbours.push(me.map.fetchHex(me.x - 1, me.y + 1));
		neighbours.push(me.map.fetchHex(me.x - 1, me.y));
		neighbours.push(me.map.fetchHex(me.x, me.y - 1));
		return neighbours;
	}

	me.inheritFrom = mapHex;
	me.inheritFrom(worldMapObj, parentObj, left_offset, top_offset);
	me.hexType = WORLD_HEX;
	if(me.rowNumber >= 0)
	{
		if(!me.map.rows[me.rowNumber])
			me.map.rows[me.rowNumber] = [];
		me.map.rows[me.rowNumber].push(me);
		var maxRow = me.map.world.uwp.size*3-2;
		var eqRow = maxRow / 2;
		me.latitude = (eqRow == Math.floor(eqRow)) ? eqRow-me.rowNumber : me.rowNumber < eqRow ? Math.floor(eqRow) - me.rowNumber : Math.ceil(eqRow) - me.rowNumber;
		me.hemisphere = me.rowNumber < eqRow ? "N" : "S";
		if(me.rowNumber == eqRow)
			me.hemisphere = "E";
	}
	me.map.hexes.push(me);
	me.map.namedHexes[me.name] = me;
}

function terrainHex(worldHexMapObject, parentObj, left_offset, top_offset)
{
	var me = this;

	me.calcCol = function()
	{
		return (me.left_offset - HEX_MAP_LEFT_OFFSET) / 27;
	}

	me.calcRow = function()
	{
		return (me.top_offset - HEX_MAP_TOP_OFFSET) / 16;
	}

	me.render = function()
	{
		var x1 = 8 + me.left_offset;
		var y1 = me.top_offset;
		var x2 = 27 + me.left_offset;
		var y2 = me.top_offset;
		var x3 = 35 + me.left_offset;
		var y3 = 16 + me.top_offset;
		var x4 = 27 + me.left_offset;
		var y4 = 32 + me.top_offset;
		var x5 = 8 + me.left_offset;
		var y5 = 32 + me.top_offset;
		var x6 = me.left_offset;
		var y6 = 16 + me.top_offset;
		me.hexElem = addPolygon("" + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x6 + "," + y6, 1, "black", "none", me.parentObj);
		for(var i=0;i<me.terrainTypes.length;i++)
			me.terrainTypes[i].draw(me);
		if(me.hexElem.style.fill == "none")
		{
			me.hexElem.style.fill = uPObj.prefs.black_and_white_map ? uPObj.prefs.clear_terrain_bw_bg : uPObj.prefs.clear_terrain_default_bg;
			if(me.world.tcs.has("Va"))
				me.hexElem.style.fill = uPObj.prefs.black_and_white_map ? uPObj.prefs.clear_terrain_bw_bg : uPObj.prefs.clear_terrain_grey_bg;
		}
		if(me.clickEnabled)
			me.hexElem.onclick = function() { generateHexMap(me, "Terrain Hex", terrainHexMap); };
		//addText(me.left_offset+8, me.top_offset+10, me.name, "Arial", "8px", "black", me.parentObj);
	}

	me.getAdjacentHexes = function()
	{
		var neighbours = [];
		for(var i=0;i<me.map.directionIncrements.length;i++)
			neighbours[i] = me.map.getHex(me.columnNumber + me.map.directionIncrements[i].col, me.rowNumber + me.map.directionIncrements[i].row);
		return neighbours;
	}

	me.inheritFrom = mapHex;
	me.inheritFrom(worldHexMapObject, parentObj, left_offset, top_offset);
	me.hexType = TERRAIN_HEX;

}

function localHex(terrainHexMapObject, parentObj, left_offset, top_offset)
{
	var me = this;

	me.calcCol = function()
	{
		return (me.left_offset - HEX_MAP_LEFT_OFFSET) / 16;
	}

	me.calcRow = function()
	{
		return (me.top_offset - HEX_MAP_TOP_OFFSET) / 28;
	}

	me.render = function()
	{
		if(!me.renderFlag)
			return;
		var x1=16+me.left_offset;
		var y1=me.top_offset;
		var x2=32+me.left_offset;
		var y2=7+me.top_offset;
		var x3=32+me.left_offset;
		var y3=28+me.top_offset;
		var x4=16+me.left_offset;
		var y4=35+me.top_offset;
		var x5=me.left_offset;
		var y5=28+me.top_offset;
		var x6=me.left_offset;
		var y6=7+me.top_offset;
		var pointsCoord = "" + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x6 + "," + y6;
		me.hexElem = addPolygon(pointsCoord, 1, "black", "none", me.parentObj);

//		addText(me.left_offset+8, me.top_offset+8, me.name, "Arial, sans-serif", "8px","black", me.parentObj);
//		addText(me.left_offset+15, me.top_offset+15, me.id, "Arial, sans-serif", "12px", "black", me.parentObj);

		for(var i=0;i<me.terrainTypes.length;i++)
			me.terrainTypes[i].draw(me);
		if(me.hexElem.style.fill == "none")
		{
			if(me.world.tcs.has("Va"))
				var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.clear_terrain_bw_bg : uPObj.prefs.clear_terrain_grey_bg;
			else
				var fillColour = uPObj.prefs.black_and_white_map ? uPObj.prefs.clear_terrain_bw_bg : uPObj.prefs.clear_terrain_default_bg;

			me.hexElem.style.fill = fillColour;
		}
		if(me.clickEnabled)
			me.hexElem.onclick = function() { generateHexMap(me, "Local Hex", localHexMap); };
	}

	me.getAdjacentHexes = function()
	{
		var neighbours = [];
		for(var i=0;i<me.map.directionIncrements.length;i++)
			neighbours[i] = me.map.getHex(me.columnNumber + me.map.directionIncrements[i].col, me.rowNumber + me.map.directionIncrements[i].row);
		return neighbours;
	}

	me.inheritFrom = mapHex;
	me.inheritFrom(terrainHexMapObject, parentObj, left_offset, top_offset);
	me.hexType = LOCAL_HEX;
}

function singleHex(terrainHexMapObject, parentObj, left_offset, top_offset)
{
	var me = this;

	me.calcCol = function()
	{
		return (me.left_offset - HEX_MAP_LEFT_OFFSET) / 27;
	}

	me.calcRow = function()
	{
		return (me.top_offset - HEX_MAP_TOP_OFFSET) / 16;
	}

	me.render = function()
	{
		var x1 = 8 + me.left_offset;
		var y1 = me.top_offset;
		var x2 = 27 + me.left_offset;
		var y2 = me.top_offset;
		var x3 = 35 + me.left_offset;
		var y3 = 16 + me.top_offset;
		var x4 = 27 + me.left_offset;
		var y4 = 32 + me.top_offset;
		var x5 = 8 + me.left_offset;
		var y5 = 32 + me.top_offset;
		var x6 = me.left_offset;
		var y6 = 16 + me.top_offset;
		me.hexElem = addPolygon("" + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x6 + "," + y6, 1, "black", "none", me.parentObj);
		for(var i=0;i<me.terrainTypes.length;i++)
			me.terrainTypes[i].draw(me);
		if(me.hexElem.style.fill == "none")
		{
			me.hexElem.style.fill = uPObj.prefs.black_and_white_map ? uPObj.prefs.clear_terrain_bw_bg : uPObj.prefs.clear_terrain_default_bg;
			if(me.world.tcs.has("Va"))
				me.hexElem.style.fill = uPObj.prefs.black_and_white_map ? uPObj.prefs.clear_terrain_bw_bg : uPObj.prefs.clear_terrain_grey_bg;
		}

		//addText(me.left_offset+16, me.top_offset+20, me.id, "Arial", 20, "black", me.parentObj);
	}

	me.getAdjacentHexes = function()
	{
		var neighbours = [];
		for(var i=0;i<me.map.directionIncrements.length;i++)
			neighbours[i] = me.map.getHex(me.columnNumber + me.map.directionIncrements[i].col, me.rowNumber + me.map.directionIncrements[i].row);
		return neighbours;
	}

	me.inheritFrom = mapHex;
	me.inheritFrom(terrainHexMapObject, parentObj, left_offset, top_offset);
	me.hexType = SINGLE_HEX;
}

var HEX_MAP_TOP_OFFSET = 70;
var HEX_MAP_LEFT_OFFSET = 14;
var HEX_MAP_HEIGHT = 340;
var HEX_MAP_WIDTH = 720;
var worldHexCounter = 0;
function generateHexMap(parentHex, mapType, mapClass)
{
	var saveAreaName = "worldHexMap" + ++worldHexCounter;
	var mapSVGID = "worldHexMapSVG" + worldHexCounter;
	var infoPara = document.createElement("P");
	var infoText = document.createTextNode("Click on any hex on the " + mapType + " map to generate the map for that hex.");
	infoPara.className = DEFAULT_INFO_PARAGRAPH_CLASS;
	infoPara.appendChild(infoText);

	var hexMapContainer = document.createElement("DIV");
	hexMapContainer.setAttribute("class","userInput");
	hexMapContainer.style.display = "block";
	hexMapContainer.style.width = (HEX_MAP_LEFT_OFFSET*2 + HEX_MAP_WIDTH + 20) + "px";
	hexMapContainer.style.height = (HEX_MAP_TOP_OFFSET*2 + HEX_MAP_HEIGHT + 80) + "px";
	hexMapContainer.style.zIndex = worldHexCounter+1;
	hexMapContainer.style.top = "4px";
	hexMapContainer.style.left = "4px";	//hexMapContainer.style.overflow = "scroll";

	var downloadMapButton = document.createElement("INPUT");
	downloadMapButton.setAttribute("name","downloadMap" + worldHexCounter);
	var clickScript = "downloadMap('" + saveAreaName + "',' " + parentHex.world.name.replace(/'/g,"") + " " + parentHex.world.uwp + " " + mapType + " " + worldHexCounter + ".svg');";
	downloadMapButton.setAttribute("onclick",clickScript);
	downloadMapButton.setAttribute("value","Download Map as SVG");
	downloadMapButton.setAttribute("type","button");
	downloadMapButton.setAttribute("class",DOWNLOAD_BUTTON_CLASS);
	downloadMapButton.setAttribute("style","margin:8px;");
	hexMapContainer.appendChild(downloadMapButton);
	var downloadAsPNGButton = document.createElement("INPUT");
	downloadAsPNGButton.setAttribute("name","downloadMap");
	clickScript = "svgToPng('" + mapSVGID + "',' " + parentHex.world.name.replace(/'/g,"") + " " + parentHex.world.uwp + " " + mapType + " " + worldHexCounter + ".png');"
	downloadAsPNGButton.setAttribute("onclick",clickScript);
	downloadAsPNGButton.setAttribute("value","Download Map as PNG");
	downloadAsPNGButton.setAttribute("type","button");
	downloadAsPNGButton.setAttribute("class",DOWNLOAD_BUTTON_CLASS);
	downloadAsPNGButton.setAttribute("style","margin:8px;");
	hexMapContainer.appendChild(downloadAsPNGButton);

	var closeButton = document.createElement("BUTTON");
	closeButton.innerHTML = "X";
	closeButton.className = "btn2";
	closeButton.style.cssFloat = "right";
	closeButton.onclick = function() { hexMapContainer.style.display = "none"; };
	hexMapContainer.appendChild(closeButton);

	var hexMapDiv = document.createElement("DIV");
	hexMapDiv.setAttribute("id", saveAreaName);
	hexMapDiv.setAttribute("class", "noBorder");
	hexMapDiv.style.backgroundColor = "white";
	var hexMapSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	hexMapSVG.setAttribute("xmlns","http://www.w3.org/2000/svg");
	hexMapSVG.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	hexMapSVG.setAttribute("xml:space","preserve");
	hexMapSVG.setAttribute("width",HEX_MAP_LEFT_OFFSET*2+HEX_MAP_WIDTH);
	hexMapSVG.setAttribute("height",HEX_MAP_TOP_OFFSET*2+HEX_MAP_HEIGHT);
	hexMapSVG.setAttribute("id",mapSVGID);
	hexMapSVG.style.backgroundColor = "white";
	document.body.appendChild(hexMapContainer);
	if(mapType != "Local Hex")
		hexMapContainer.appendChild(infoPara);
	hexMapContainer.appendChild(hexMapDiv);
	hexMapDiv.appendChild(hexMapSVG);



	var userSeed = parseInt(document.getElementById("seed").value);
	var seedUsed = userSeed;
	if(userSeed)
		init_rng(seedUsed);
	else
	{
		seedUsed = Date.now() >>> 0;
	}
	document.getElementById("seed").value = seedUsed;

	var map = new mapClass(hexMapSVG, parentHex);
	map.generate();
	map.render();
	map.outline();
}

var VERTICAL_HEXES = 0;
var HORIZONTAL_HEXES = 1;
var HORIZONTAL_HEXES_PATTERN = ["200","200","200","200","200","200","011","043","131","042","041","036","200","012","044","124","125","126","063","035","200","001","132","123","101","065","064","062","034","200","013","045","133","122","121","116","164","165","166","200","014","046","134","135","112","111","115","163","061","033","200","015","051","136","143","113","114","162","161","032","200","016","141","142","144","153","154","155","156","200","003","052","145","146","152","056","031","200","021","053","054","151","055","026","200","022","023","004","024","025","200"];
var VERTICAL_HEXES_PATTERN = ["200","200","200","200","200","200","011","043","116","042","041","036","200","012","044","121","115","114","063","035","200","013","045","124","122","113","064","062","034","200","200","126","125","123","112","065","164","165","166","200","014","046","131","132","145","111","066","163","061","033","200","015","051","133","144","146","154","155","162","032","200","016","134","135","143","151","153","156","161","200","200","052","136","142","152","056","031","200","021","053","141","054","055","026","200","022","023","024","200","025","200"];
function hexMap(parentObj, parentHex)
{
	var me = this;
	me.parentObj = parentObj;
	me.parentHex = parentHex;
	me.world = me.parentHex.world;
	me.hexes = [];
	me.namedHexes = {};
	me.whiteHexes = [];
	me.blackHexes = [];
	me.hexSetType = me.parentHex.hexType % 2 == 0 ? HORIZONTAL_HEXES : VERTICAL_HEXES;

	if(me.hexSetType == HORIZONTAL_HEXES)
	{
		me.edgeHexesBySide = [[12, 20, 29, 39, 50],[50,60,69,77,84,90],[85,86,87,88,89],[40,51,61,70,78,85],[6,13,21,30,40],[0,1,2,3,4,5]];
		me.edgeHexSet = [0, 1, 2, 3, 4, 5, 6, 12, 13, 20, 21, 29, 30, 39, 40, 50, 51, 60, 61, 69, 70, 77, 78, 84, 85, 86, 87, 88, 89, 90];
		me.directionIncrements = [{ col:1 ,row:-1 },{ col:1 ,row:1 },{ col:0 ,row:2 },{ col:-1 ,row:1 },{ col:-1 ,row:-1 },{ col:0 ,row:-2 }];
	}
	else
	{
		me.edgeHexesBySide = [[5,12,20,29,39,50],[50,60,69,77,84,90],[85,86,87,88,89,90],[40,51,61,70,78,85],[0,6,13,21,30,40],[0,1,2,3,4,5]];
		me.edgeHexSet = [0,1,2,3,4,5,6,12,13,20,21,29,30,39,40,50,51,60,61,69,70,77,78,84,85,86,87,88,89,90];
		me.directionIncrements = [{ col:1 ,row:-1 },{ col:2 ,row:0 },{ col:1 ,row:1 },{ col:-1 ,row:1 },{ col:-2 ,row:0 },{ col:-1 ,row:-1 }];
	}
	me.key = new hexMapKey(me);
	me.oppositeEdges = [[2,3,4], [3,4,5], [4,5,0], [5,0,1], [0,1,2], [1,2,3]];
	me.centreHex = null;

	me.generate = function()
	{
		if(me.hexSetType == HORIZONTAL_HEXES)
			me.generateHorizontal();
		if(me.hexSetType == VERTICAL_HEXES)
			me.generateVertical();
		me.centreHex = me.hexes[45];
		shoreLine();
		oceans();
		oceanDepth();
		oceanAbyss();
		mountains();
		chasm();
		precipice()
		ruins();
		craters();
		desert();
		desertHalf();
		islands();
		iceCap();
		iceField();
		iceFieldHalf();
		frozenLands();
		frozenLandsHalf();
		bakedLands();
		bakedLandsHalf();
		cropLand();
		town();
		city();
		suburb();
		domedCity();
		arcology();
		rural();
		starport();
		clear();
		lake();
		rough();
		wood();
		marsh();
		swamp();
		for(var i=0;i<me.hexes.length;i++)
			if(me.hexes[i].noTerrain())
			{
				me.hexes[i].add(clearTerrain);
				me.key.addHex(clearTerrain);
			}
		resource();
		oil();
		mine();
		wasteLand();
		exotic();
		volcano();
		nobleLand();
		penal();
		creepNeighbouringTerrain(icecapTerrain);
	}

	me.generateHorizontal = function()
	{
		var patternIndex = 0;
		var hexID = 0;
		for(var i=0;i<11;i++)
		{
			var STARTING_TOP_OFFSET = HEX_MAP_TOP_OFFSET + 96 + (i < 6 ? i*32 : 160 + (i-5)*16);
			var STARTING_LEFT_OFFSET = HEX_MAP_LEFT_OFFSET + (i < 6 ? 0 : (i-5) * 27);
			var rowHexCount = i < 5 ? i+6 : 16-i;
			for(var j=0;j<rowHexCount;j++)
			{
				var x = STARTING_LEFT_OFFSET + j*27;
				var y = STARTING_TOP_OFFSET - j*16;
				switch(me.parentHex.hexType)
				{
					case WORLD_HEX:
						var aTerrainHex = new terrainHex(me, me.parentObj, x, y);
						break;
					case TERRAIN_HEX:
						var aTerrainHex = new localHex(me, me.parentObj, x, y);
						break;
					case LOCAL_HEX:
						var aTerrainHex = new singleHex(me, me.parentObj, x, y);
						break;
				}
				aTerrainHex.applyPattern(HORIZONTAL_HEXES_PATTERN[patternIndex++]);
				me.hexes.push(aTerrainHex);
				me.namedHexes[aTerrainHex.name] = aTerrainHex;
				aTerrainHex.id = hexID++;
				if(me.edgeHexSet.find(function(v) { return v == aTerrainHex.id } ) !== undefined)
					aTerrainHex.edge = true;
				switch(aTerrainHex.colour)
				{
					case BLACK_HEX:
						me.blackHexes.push(aTerrainHex);
						break;
					case WHITE_HEX:
						me.whiteHexes.push(aTerrainHex);
						break;
					case BLANK_HEX:
				}
			}
		}
	}

	me.generateVertical = function()
	{
		var patternIndex = 0;
		var hexID = 0;
		for(var i=0;i<11;i++)
		{
			var numHexInRow = i < 6 ? (i+6) : (16-i);
			var rowStartLeftOffset = HEX_MAP_LEFT_OFFSET + (11-numHexInRow)*16;
			var rowTopOffset = HEX_MAP_TOP_OFFSET + 40 + i*28;
			for(var j=0;j<numHexInRow;j++)
			{
				var left_offset = rowStartLeftOffset+j*32;
				var newHex = new localHex(me, me.parentObj, left_offset, rowTopOffset);
				newHex.id = hexID++;
				newHex.applyPattern(VERTICAL_HEXES_PATTERN[patternIndex++]);
				if(me.edgeHexSet.find(function(v){ return v ==  newHex.id } ) !== undefined)
					newHex.edge = true;
				me.hexes.push(newHex);
				me.namedHexes[newHex.name] = newHex;
				if(newHex.colour == WHITE_HEX)
					me.whiteHexes.push(newHex);
				if(newHex.colour == BLACK_HEX)
					me.blackHexes.push(newHex);
			}
		}
	}

	me.render = function()
	{
		for(var i=0;i<me.hexes.length;i++)
			me.hexes[i].render();
	}

	me.getHex = function(col, row)
	{
		return me.namedHexes["(" + col + "," + row + ")"];
		/*
		var i=me.hexes.length;
		while(i--)
			if(me.hexes[i].rowNumber == row && me.hexes[i].columnNumber == col)
				return me.hexes[i];
		return false;
		*/
	}

	me.getParallelHex = function(hex, direction, amount)
	{
		var x = hex.columnNumber;
		var y = hex.rowNumber;
		for(var i=0;i<amount;i++)
		{
			x += me.directionIncrements[direction].col;
			y += me.directionIncrements[direction].row;
		}
		return me.getHex(x,y);
	}

	me.tracePath = function(startHex, destHex)
	{
		var currentHex = startHex;
		var nextHex;
		var hexPath = [currentHex];
		do
		{
			do
			{
				nextHex = array_fnc.random.call(currentHex.getAdjacentHexes());
			}
			while(!nextHex || hexPath.find(function(v) { return v.name == nextHex.name }) !== undefined || !currentHex.closer(destHex,nextHex) || nextHex.getNeighboursIn(hexPath).length > 1 || (hexPath.length == 1 && nextHex.edge));
			currentHex = nextHex;
			hexPath.push(currentHex);
		}
		while(currentHex.name != destHex.name && !currentHex.edge)
		return hexPath;
	}

	me.getTerrainCount = function(terrainType, hexSet)
	{
		var c = 0;
		for(var i=0;i<hexSet.length;i++)
			if(hexSet[i].has(terrainType))
				c++;
		return c;
	}

	/*
	Child must implement me.outline
	*/

	function mountains()
	{
		if(!me.parentHex.has(mountainTerrain))
			return;
		me.key.addHex(mountainTerrain);
		for(var i=0;i<me.whiteHexes.length;i++)
		{
			if(!me.whiteHexes[i].has(oceanTerrain))
				me.whiteHexes[i].add(mountainTerrain);
			else
			{
				me.whiteHexes[i].add(islandTerrain);
				me.key.addHex(islandTerrain);
			}
		}
	}

	function precipice()
	{
		if(!me.parentHex.has(precipiceTerrain))
			return;
		me.key.addHex(precipiceTerrain);
		var parentHexNeighbours = me.parentHex.getAdjacentHexes();
		var possibleStartEdges = [];
		for(var i=0;i<parentHexNeighbours;i++)
			if(parentHexNeighbours[i].has(precipiceTerrain))
				possibleStartEdges.push(i);
		var startEdge = possibleStartEdges.length == 0 ? dice(1)-1 : array_fnc.random.call(possibleStartEdges);
		var destEdge = array_fnc.random.call(me.oppositeEdges[startEdge]);
		var startHex = me.hexes[array_fnc.random.call(me.edgeHexesBySide[startEdge])];
		var destHex = me.hexes[array_fnc.random.call(me.edgeHexesBySide[destEdge])];
		var precipicePath = me.tracePath(startHex,destHex);
		for(i=0;i<precipicePath.length;i++)
			precipicePath[i].add(precipiceTerrain);
	}

	function chasm()
	{
		if(!me.parentHex.has(chasmTerrain))
			return;
		me.key.addHex(precipiceTerrain);
		var parentHexNeighbours = me.parentHex.getAdjacentHexes();
		var possibleStartEdges = [];
		for(var i=0;i<parentHexNeighbours;i++)
			if(parentHexNeighbours[i].has(chasmTerrain))
				possibleStartEdges.push(i);
		var startEdge = possibleStartEdges.length == 0 ? dice(1)-1 : array_fnc.random.call(possibleStartEdges);
		var destEdge = array_fnc.random.call(me.oppositeEdges[startEdge]);
		var startHex = me.hexes[array_fnc.random.call(me.edgeHexesBySide[startEdge])]; // start is centre, "destination" is start hex
		var centrePath = me.tracePath(me.centreHex,startHex);
		var destHex = me.hexes[array_fnc.random.call(me.edgeHexesBySide[destEdge])];
		centrePath = centrePath.concat(me.tracePath(me.centreHex,destHex)); // start is centre, "destination" is destination hex and sew both together!
		var chasmWidth = dice(1);
		path1distance = Math.max(1,Math.floor(chasmWidth/2));
		path2distance = Math.max(1,chasmWidth - path1distance);
		var path1direction = startEdge < 5 ? startEdge+1 : 0;
		var path2direction = path1direction < 3 ? path1direction+3 : path1direction-3;
		for(i=0;i<centrePath.length;i++)
		{
			var parallelHex1 = me.getParallelHex(centrePath[i],path1direction,path1distance);
			if(parallelHex1)
				parallelHex1.add(precipiceTerrain);
			var parallelHex2 = me.getParallelHex(centrePath[i],path2direction,path2distance);
			if(parallelHex2)
				parallelHex2.add(precipiceTerrainRed);
		}
	}

	function oceans()
	{
		if(!me.parentHex.has(oceanTerrain))
			return;
		me.key.addHex(oceanTerrain);
		if(me.parentHex.hexType == WORLD_HEX)
		{
			var parentHexNeighbours = me.parentHex.getAdjacentHexes();
			for(var i=0;i<parentHexNeighbours.length;i++)
				if(!parentHexNeighbours[i])
					parentHexNeighbours.splice(i,1);
			var allOcean = true;
			for(var i=0;i<parentHexNeighbours.length;i++)
				if(!parentHexNeighbours[i].has(oceanTerrain))
					allOcean = false;
			for(i=0;i<me.hexes.length;i++)
				switch(me.hexes[i].colour)
				{
					case WHITE_HEX:
						if(allOcean)
						{
							me.hexes[i].add(oceanDepthTerrain);
							me.key.addHex(oceanDepthTerrain);
						}
						else
							me.hexes[i].add(oceanTerrain);
						break;
					default:
						me.hexes[i].add(oceanTerrain);
				}
		}
		else
			for(var i=0;i<me.hexes.length;i++)
				me.hexes[i].add(oceanTerrain);
	}

	function oceanDepth()
	{
		if(!me.parentHex.has(oceanDepthTerrain))
			return;
		placeTerrain(oceanDepthTerrain, "all", false, true);
		if(me.parentHex.hexType == TERRAIN_HEX)
			placeTerrain(oceanAbyssTerrain, 1, false, true, oceanDepthTerrain);
		for(var i=0;i<me.hexes.length;i++)
			if(me.hexes[i].noTerrain())
				me.hexes[i].add(oceanTerrain);
	}

	function oceanAbyss()
	{
		if(!me.parentHex.has(oceanAbyssTerrain))
			return;
		placeTerrain(oceanAbyssTerrain, "all", false, true);
		for(var i=0;i<me.hexes.length;i++)
			if(me.hexes[i].noTerrain())
				me.hexes[i].add(oceanDepthTerrain);
	}

	function islands()
	{
		if(!me.parentHex.has(islandTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				placeTerrain(islandTerrain, 1, true, true);
				break;
			case TERRAIN_HEX:
				if(me.parentHex.has(oceanTerrain))
					removeTerrain(oceanTerrain, 1);
				if(me.parentHex.has(oceanDepthTerrain))
					removeTerrain(oceanDepthTerrain, 1);
				placeTerrain(islandTerrain, 1, true, true);
				for(var i=0;i<me.hexes.length;i++)
					if(me.hexes[i].has(islandTerrain) && !me.hexes[i].has(oceanTerrain))
						me.hexes[i].erase(islandTerrain);
				break;
			case LOCAL_HEX:
				if(me.parentHex.has(oceanTerrain))
					removeTerrain(oceanTerrain, "all");
				if(me.parentHex.has(oceanDepthTerrain))
					removeTerrain(oceanDepthTerrain, "all");
				if(me.parentHex.has(oceanAbyssTerrain))
					removeTerrain(oceanAbyssTerrain, "all");
				creepNeighbouringTerrain(oceanTerrain);
				break;
		}
	}

	function shoreLine()
	{
		creepNeighbouringTerrain(oceanTerrain);
		creepNeighbouringTerrain(oceanDepthTerrain);
		creepNeighbouringTerrain(oceanAbyssTerrain);
		creepNeighbouringTerrain(lakeTerrain2);
	}

	function ruins()
	{
		placeTerrain(ruinsTerrain, 1, true, true);
	}

	function craters()
	{
		placeTerrain(cratersTerrain, 2, true, false)
	}

	function desert()
	{
		if(!me.parentHex.has(desertTerrain))
			return;
		me.key.addHex(desertTerrain);
		for(var i=0;i<me.hexes.length;i++)
			if(!me.hexes[i].has(mountainTerrain))
				me.hexes[i].add(desertTerrain);
		if(me.parentHex.hexType != LOCAL_HEX && !me.parentHex.has(mountainTerrain))
			placeTerrain(clearTerrain, 2, false, false, desertTerrain);
		creepNeighbouringTerrain(oceanTerrain, desertTerrain);
	}

	function iceCap()
	{
		if(!me.parentHex.has(icecapTerrain))
			return;
		me.key.addHex(icecapTerrain);
		for(var i=0;i<me.hexes.length;i++)
			me.hexes[i].add(icecapTerrain);
	}

	function iceField()
	{
		if(!me.parentHex.has(iceFieldTerrain))
			return;
		me.key.addHex(iceFieldTerrain);
		for(var i=0;i<me.hexes.length;i++)
			me.hexes[i].add(iceFieldTerrain);
		creepNeighbouringTerrain(oceanTerrain);
	}

	function frozenLands()
	{
		if(!me.parentHex.has(frozenLandTerrain))
			return;
		me.key.addHex(frozenLandTerrain);
		for(var i=0;i<me.hexes.length;i++)
			me.hexes[i].add(frozenLandTerrain);
		creepNeighbouringTerrain(iceFieldTerrain, frozenLandTerrain);
	}

	function cropLand()
	{
		var putOnOcean = me.parentHex.has(oceanTerrain);
		placeTerrain(cropTerrain, "all", true, putOnOcean);
	}

	function town()
	{
		if(!me.parentHex.has(townTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				placeTerrain(townTerrain, "one", true, false);
				break;
			case TERRAIN_HEX:
				placeTerrain(townTerrain, 1, true, false);
				break;
			case LOCAL_HEX:
				var townHex = array_fnc.random.call(me.whiteHexes);
				townHex.add(townTerrain);
				var otherTowns = townHex.getAdjacentHexes();
				for(var i=0;i<otherTowns.length;i++)
					if(otherTowns[i])
						otherTowns[i].add(townTerrain);
		}
	}

	function city()
	{
		if(!me.parentHex.has(cityTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				if(!me.world.tcs.has("Hi"))
					placeTerrain(cityTerrain, "one", true, false);
				else
					placeTerrain(cityTerrain, "two", true, false);
				break;
			case TERRAIN_HEX:
				var cityHex = array_fnc.random.call(me.whiteHexes);
				var suburbHexes = cityHex.getAdjacentHexes();
				cityHex.add(cityTerrain);
				for(var i=0;i<suburbHexes.length;i++)
					if(suburbHexes[i])
						suburbHexes[i].add(suburbTerrain);
				if(me.world.tcs.has("Hi"))
				{
					do
					{
						var cityHex2 = array_fnc.random.call(me.whiteHexes);
					}
					while(cityHex2.has(cityTerrain) || cityHex2.has(suburbTerrain));
					var suburbHexes2 = cityHex2.getAdjacentHexes();
					cityHex2.add(cityTerrain);
					for(var i=0;i<suburbHexes2.length;i++)
						if(suburbHexes2[i])
						{
							suburbHexes2[i].add(suburbTerrain);
							me.key.addHex(suburbTerrain);
						}
				}
				break;
			case LOCAL_HEX:
				placeTerrain(cityTerrain, "all", true, false);
		}
	}

	function suburb()
	{
		if(!me.parentHex.has(suburbTerrain))
			return;
		placeTerrain(suburbTerrain, "all", false, false);
		removeTerrain(suburbTerrain, 2);
		placeTerrain(woodsTerrain, 1, false, false, suburbTerrain);
	}

	function domedCity()
	{
		if(!me.parentHex.has(domedCityTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
			case TERRAIN_HEX:
				if(!me.world.tcs.has("Hi"))
					placeTerrain(domedCityTerrain, "one", true, false);
				else
					placeTerrain(domedCityTerrain, "two", true, false);
				break;
			case LOCAL_HEX:
				var cityHex = array_fnc.random.call(me.whiteHexes);
				cityHex.add(domedCityTerrain);
				var otherCity = cityHex.getAdjacentHexes();
				for(var i=0;i<otherCity.length;i++)
					if(otherCity[i])
						otherCity[i].add(domedCityTerrain);
		}
	}

	function arcology()
	{
		if(!me.parentHex.has(arcologyTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
			case TERRAIN_HEX:
				placeTerrain(arcologyTerrain, "one", true, false);
				break;
			case LOCAL_HEX:
				var cityHex = array_fnc.random.call(me.whiteHexes);
				cityHex.add(arcologyTerrain);
				var otherCity = cityHex.getAdjacentHexes();
				for(var i=0;i<otherCity.length;i++)
					if(otherCity[i])
						otherCity[i].add(arcologyTerrain);
		}
	}

	function rural()
	{
		placeTerrain(ruralTerrain, "all", true, false);
	}

	function starport()
	{
		if(!me.parentHex.has(starportTerrain))
			return;
		me.key.addHex(starportTerrain);
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				placeTerrain(starportTerrain, "one", false, false);
				break;
			case TERRAIN_HEX:
				var starportHex = placeTerrain(starportTerrain, "one", false, false);
				var shuffledHexes = shuffle(me.hexes);
				shuffledHexes.sort( function (a,b)
									{
										return a.distanceTo(starportHex) - b.distanceTo(starportHex);
									} );
				shuffledHexes.sort( sort_land_first );
				shuffledHexes[1].add(cityTerrain);
				shuffledHexes[2].add(cityTerrain);
				me.key.addHex(cityTerrain);
				break;
			case LOCAL_HEX:
				placeTerrain(starportTerrain, "all", false, false);
				for(var i=0;i<me.blackHexes.length;i++)
					if(!me.blackHexes[i].has(oceanTerrain))
					{
						me.blackHexes[i].add(cityTerrain);
						me.key.addHex(cityTerrain);
					}
		}
	}

	function bakedLands()
	{
		if(!me.parentHex.has(bakedLandsTerrain))
			return;
		me.key.addHex(bakedLandsTerrain);
		for(var i=0;i<me.hexes.length;i++)
			me.hexes[i].add(bakedLandsTerrain);
		creepNeighbouringTerrain(desertTerrain, bakedLandsTerrain);
	}

	function clear()
	{
		if(!me.parentHex.has(clearTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				var shuffledWhiteHexes;
				placeTerrain(roughTerrain, 2, false, false);
				if(me.world.uwp.atmos > 2 && me.world.uwp.atmos < 11)
					placeTerrain(woodsTerrain, 2, false, false);
				if(me.world.uwp.hydro > 1)
				{
					var numMarsh = dice(2);
					shuffledWhiteHexes = shuffle(me.whiteHexes);
					for(i=0;i<numMarsh;i++)
					{
						var hex = shuffledWhiteHexes[i];
						if(hex.has(oceanTerrain))
							continue;
						if(!hex.has(woodsTerrain))
						{
							hex.add(marshTerrain);
							me.key.addHex(marshTerrain);
						}
						else
						{
							hex.erase(woodsTerrain);
							hex.add(swampTerrain);
							me.key.addHex(swampTerrain);
						}
					}
				}
				placeTerrain(lakeTerrain, 1, false, false);
			break;
			case TERRAIN_HEX:
				for(var i=0;i<me.hexes.length;i++)
				if(me.hexes[i].noTerrain())
					me.hexes[i].add(clearTerrain);
			break;
			case LOCAL_HEX:
				placeTerrain(woodsTerrain, 1, false, true);
		}
	}

	function rough()
	{
		if(!me.parentHex.has(roughTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case TERRAIN_HEX:
				placeTerrain(roughTerrain, "all", true, false);
				if(!me.parentHex.has(lakeTerrain))
					removeTerrain(roughTerrain, 2);
				break;
			case LOCAL_HEX:
				placeTerrain(roughTerrain, "all", true, false);
				removeTerrain(roughTerrain, 1);
		}
	}

	function wood()
	{
		if(!me.parentHex.has(woodsTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case TERRAIN_HEX:
				placeTerrain(woodsTerrain, "all", true, false);
				if(!me.parentHex.has(lakeTerrain))
					removeTerrain(woodsTerrain, 2);
				break;
			case LOCAL_HEX:
				placeTerrain(woodsTerrain, "all", true, false);
		}
	}

	function marsh()
	{
		if(!me.parentHex.has(marshTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case TERRAIN_HEX:
				placeTerrain(marshTerrain, "all", true, false);
				if(!me.parentHex.has(lakeTerrain))
					removeTerrain(marshTerrain, 2);
				break;
			case LOCAL_HEX:
				placeTerrain(marshTerrain, "all", true, false);
				removeTerrain(marshTerrain, 1);
		}
	}

	function swamp()
	{
		if(!me.parentHex.has(swampTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case TERRAIN_HEX:
				placeTerrain(swampTerrain, "all", true, false);
				if(!me.parentHex.has(lakeTerrain))
					removeTerrain(swampTerrain, 2);
				break;
			case LOCAL_HEX:
				placeTerrain(swampTerrain, "all", true, false);
				removeTerrain(swampTerrain, 1);
		}
	}

	function lake()
	{
		if(!me.parentHex.has(lakeTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case TERRAIN_HEX:
				placeTerrain(lakeTerrain2, "all", false, false);
				removeTerrain(lakeTerrain2, 1);
				break;
			case LOCAL_HEX:
				for(var i=0;i<me.hexes.length;i++)
					me.hexes[i].add(lakeTerrain2);
		}
	}

	function resource()
	{
		if(!me.parentHex.has(resourceTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				placeTerrain(resourceTerrain, 2, true, true);
				break;
			case TERRAIN_HEX:
				placeTerrain(resourceTerrain, 1, false, true);
				placeTerrain(oilTerrain, 1, false, true);
				placeTerrain(mineTerrain, 1, false, true);
				break;
			case LOCAL_HEX:
				placeTerrain(resourceTerrain, "all", true, true);
		}
	}

	function oil()
	{
		placeTerrain(oilTerrain, "all", true, true);
	}

	function mine()
	{
		placeTerrain(mineTerrain, "all", true, false);
	}

	function wasteLand()
	{
		placeTerrain(wasteTerrain, "all", true, true);
	}

	function exotic()
	{
		if(!me.parentHex.has(exoticTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				placeTerrain(exoticTerrain, 2, true, true);
				break;
			case TERRAIN_HEX:
				placeTerrain(exoticTerrain, "all", true, true);
				placeTerrain(volcanoTerrain, 1, false, true);
				break;
			case LOCAL_HEX:
				placeTerrain(exoticTerrain, "all", true, true);
				removeTerrain(exoticTerrain, 1);
		}
	}

	function volcano()
	{
		placeTerrain(volcanoTerrain, 1, true, true);
	}

	function nobleLand()
	{
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				if(!uPObj.prefs.place_several_noble_estates)
					placeTerrain(nobleTerrain, "one", true, uPObj.prefs.allow_ocean_nobz);
				else
				{
					if(me.parentHex.has(nobleTerrainB))
						placeTerrain(nobleTerrainB, "one", true, uPObj.prefs.allow_ocean_nobz);
					if(me.parentHex.has(nobleTerrainc))
						placeTerrain(nobleTerrainc, "two", true, uPObj.prefs.allow_ocean_nobz);
					if(me.parentHex.has(nobleTerrainC))
						placeTerrain(nobleTerrainC, "four", true, uPObj.prefs.allow_ocean_nobz);
					if(me.parentHex.has(nobleTerrainD))
						placeTerrain(nobleTerrainD, "eight", true, uPObj.prefs.allow_ocean_nobz);
					if(me.parentHex.has(nobleTerraine))
						placeTerrain(nobleTerraine, "sixteen", true, uPObj.prefs.allow_ocean_nobz);
					if(me.parentHex.has(nobleTerrainE))
						placeTerrain(nobleTerrainE, "thirty-two", true, uPObj.prefs.allow_ocean_nobz);
					if(me.parentHex.has(nobleTerrainf))
						placeTerrain(nobleTerrainf, "thirty-two", true, uPObj.prefs.allow_ocean_nobz);
					if(me.parentHex.has(nobleTerrainF))
						placeTerrain(nobleTerrainF, "thirty-two", true, uPObj.prefs.allow_ocean_nobz);
				}
				break;
			case TERRAIN_HEX:
				placeTerrain(nobleTerrain, "all", true, uPObj.prefs.allow_ocean_nobz);
				break;
		}
	}

	function penal()
	{
		if(!me.parentHex.has(penalTerrain))
			return;
		switch(me.parentHex.hexType)
		{
			case WORLD_HEX:
				placeTerrain(penalTerrain, 1, true, false);
				break;
			case TERRAIN_HEX:
				placeTerrain(penalTerrain, "all", true, false);
				break;
			case LOCAL_HEX:
				placeTerrain(penalTerrain, "all", true, false);
		}
	}

	function bakedLandsHalf()
	{
		placeHalfWorldHexTerrain(bakedLandsWestHalfTerrain, bakedLandsEastHalfTerrain, bakedLandsTerrain);
	}

	function frozenLandsHalf()
	{
		placeHalfWorldHexTerrain(frozenLandTerrainWest, frozenLandTerrainEast, frozenLandTerrain);
	}

	function desertHalf()
	{
		placeHalfWorldHexTerrain(desertTerrainWest, desertTerrainEast, desertTerrain);
	}

	function iceFieldHalf()
	{
		placeHalfWorldHexTerrain(iceFieldTerrainWest, iceFieldTerrainEast, iceFieldTerrain);
	}

	function creepNeighbouringTerrain(terrainObj, terrainToErase)
	{
		if(me.parentHex.has(terrainObj))
			return;
		var neighbours = me.parentHex.getAdjacentHexes();
		var allNeighboursNonCreep = true;
		for(var i=0;i<neighbours.length;i++)
		{
			if(neighbours[i] && neighbours[i].has(terrainObj))
				allNeighboursNonCreep = false;
		}
		if(allNeighboursNonCreep)
			return;
		var terrainToAdd;
		if(terrainObj.creep)
			terrainToAdd = terrainObj.creep;
		else
			terrainToAdd = terrainObj;
		me.key.addHex(terrainToAdd);
		for(var i=0;i<neighbours.length;i++)
		{
			if(neighbours[i] && neighbours[i].has(terrainObj))
				for(var j=0;j<me.edgeHexesBySide[i].length;j++)
				{
					me.hexes[me.edgeHexesBySide[i][j]].add(terrainToAdd);
					if(arguments.length > 1)
						me.hexes[me.edgeHexesBySide[i][j]].erase(terrainToErase);
				}
		}
		var numPasses = d3() + 1;
		for(i=0;i<numPasses;i++)
		{
			for(var j=0;j<me.hexes.length;j++)
			{
				if(!(me.hexes[j].has(terrainObj) || me.hexes[j].has(terrainToAdd)) && me.hexes[j].colour != BLANK_HEX && !me.hexes[j].edge)
				{
					var terrC = me.hexes[j].countTerrainInNeighbours(terrainObj) + me.hexes[j].countTerrainInNeighbours(terrainToAdd);
					if(terrC > (i+1))
					{
						if(d100() < (uPObj.prefs.shoreline_extend_chance / (i+1)))
							{
								me.hexes[j].add(terrainToAdd);
								if(arguments.length > 1)
									me.hexes[j].erase(terrainToErase);
							}
					}
				}
			}
		}
	}

	function placeHalfWorldHexTerrain(halfTerrainWest, halfTerrainEast, terrainObj)
	{
		if(!me.parentHex.has(halfTerrainWest) && !me.parentHex.has(halfTerrainEast))
			return;
		me.key.addHex(terrainObj);
		if(me.parentHex.has(halfTerrainWest))
		{
			for(var i=0;i<me.hexes.length;i++)
				if(me.hexes[i].columnNumber < 5)
					me.hexes[i].add(terrainObj);
		}
		if(me.parentHex.has(halfTerrainEast))
		{
			for(var i=0;i<me.hexes.length;i++)
				if(me.hexes[i].columnNumber > 5)
					me.hexes[i].add(terrainObj);
		}
		var numPasses = d3()+1;
		for(var n=0;n<numPasses;n++)
		{
			for(var i=0;i<me.hexes.length;i++)
			{
				if(me.hexes[i].has(terrainObj))
					continue;
				if(me.hexes[i].countTerrainInNeighbours(terrainObj) > 1)
				{
					if(d100() < uPObj.prefs.creep_into_tz_chance)
						me.hexes[i].add(terrainObj);
				}
			}
		}
	}

	function placeTerrain(terrainObject, numDice, sendHome, placeOnOcean, terrainToRemove)
	{
		if((arguments.length > 2 && sendHome == true) && !me.parentHex.has(terrainObject))
			return;
		me.key.addHex(terrainObject);
		var numHexes = 0;
		switch(numDice)
		{
			case "all":
				numHexes = me.whiteHexes.length;
				break;
			case "one":
				numHexes = 1;
				break;
			case "two":
				numHexes = 2;
				break;
			case "four":
				numHexes = 4;
				break;
			case "eight":
				numHexes = 8;
				break;
			case "sixteen":
				numHexes = 16;
				break;
			case "thirty-two":
				numHexes = 32;
				break;
			default:
				numHexes = dice(numDice);
		}
		var shuffledWhiteHexes = shuffle(me.whiteHexes);
		if(numDice != "all" && terrainObject.preferLand)
			shuffledWhiteHexes.sort(sort_land_first);
		for(var i=0;i<numHexes;i++)
		{
			var hex = shuffledWhiteHexes[i];
			if(!placeOnOcean && ((hex.has(lakeTerrain2) || hex.has(oceanTerrain) || hex.has(oceanDepthTerrain)) && !hex.has(islandTerrain)))
				continue;
			hex.add(terrainObject);
			if(arguments.length > 4)
				hex.erase(terrainToRemove);
		}
		if(numHexes == 1)
			return hex;
		else
			return null;
	}

	function removeTerrain(terrainObject, numDice)
	{
		var numHexes = 0;
		switch(numDice)
		{
			case "all":
				numHexes = me.whiteHexes.length;
				break;
			case "one":
				numHexes = 1;
				break;
			case "two":
				numHexes = 2;
				break;
			default:
				numHexes = dice(numDice);
		}
		var shuffledWhiteHexes = shuffle(me.whiteHexes);
		if(numDice != "all")
		shuffledWhiteHexes.sort(function(a, b)
									{
										if(a.has(terrainObject) && !b.has(terrainObject))
											return -1;
										if(!a.has(terrainObject) && b.has(terrainObject))
											return 1;
										return 0;
									} );
		for(var i=0;i<numHexes;i++)
			shuffledWhiteHexes[i].erase(terrainObject);
	}
}

function worldHexMap(parentObj, worldHexToMap)
{
	var me = this;
	me.parentObj = parentObj;
	me.parentHex = worldHexToMap;
	me.world = me.parentHex.world;
	me.inheritFrom = hexMap;
	me.inheritFrom(me.parentObj, me.parentHex);

	me.outline = function()
	{
		var x1 = me.hexes[0].left_offset + 17;
		var y1 = me.hexes[0].top_offset + 16;
		var x2 = me.hexes[5].left_offset + 17;
		var y2 = me.hexes[5].top_offset + 16;
		var x3 = me.hexes[50].left_offset + 17;
		var y3 = me.hexes[50].top_offset + 16;
		var x4 = me.hexes[90].left_offset + 17;
		var y4 = me.hexes[90].top_offset + 16;
		var x5 = me.hexes[85].left_offset + 17;
		var y5 = me.hexes[85].top_offset + 16;
		var x6 = me.hexes[40].left_offset + 17;
		var y6 = me.hexes[40].top_offset + 16;
		addPolygon("" + (x1-17) + "," + (y1-16) + " " + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x2 + "," + (y2-21), "none","white","white",me.parentObj);
		addPolygon("" + x2 + "," + (y2-22) + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + (x3+12) + "," + (y3-15), "none","white","white",me.parentObj);
		addPolygon("" + (x3+18) + "," + (y3-23) + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + (x4+18) + "," + (y4+18), "none","white","white",me.parentObj);
		addPolygon("" + (x4+18) + "," + (y4+18) + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x5 + "," + (y5+22), "none","white","white",me.parentObj);
		addPolygon("" + x5 + "," + (y5+22) + " " + x5 + "," + y5 + " " + x6 + "," + y6 + " " + (x6-23) + "," + (y6+7), "none","white","white",me.parentObj);
		addPolygon("" + (x6-21) + "," + (y6+5) + " " + x6 + "," + y6 + " " + x1 + "," + y1 + " " + (x1-17) + "," + (y1-16), "none","white","white",me.parentObj);
		var pointsCoord = "" + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x6 + "," + y6;
		addPolygon(pointsCoord, "3px", "rgb(0,0,0)", "none", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*9, "World Hex Map", "Optima, Arial, sans-serif", "2.5em", "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*20-32, "World Name", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*20, me.world.name, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 200, OUTLINE_THICKNESS*20-32, "UWP", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 200, OUTLINE_THICKNESS*20, me.world.uwp, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 350, OUTLINE_THICKNESS*20-32, "TC's and Remarks", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 350, OUTLINE_THICKNESS*20, me.world.tcs, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addRectangle(HEX_MAP_LEFT_OFFSET-8, OUTLINE_THICKNESS, me.parentObj.getAttribute("width") - 16, me.parentObj.getAttribute("height") - HEX_MAP_TOP_OFFSET + 28, "none", OUTLINE_THICKNESS, "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 495, OUTLINE_THICKNESS*20-32, "Overall World Hex", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		var overallHex = new worldHex(me, me.parentObj, null, 550, OUTLINE_THICKNESS*20+12, -3);
		overallHex.terrainTypes = array_fnc.copy.call(me.parentHex.terrainTypes);
		overallHex.clickEnabled = false;
		overallHex.render();
		var neighbours = me.parentHex.getAdjacentHexes();
		var overallNeighbours = [];
		var offsets = [{x:16, y:-28},{x:32,y:0},{x:16,y:28},{x:-16,y:28},{x:-32,y:0},{x:-16,y:-28}];
		for(var i=0;i<neighbours.length;i++)
		{
			if(neighbours[i])
			{
				overallNeighbours.push(new worldHex(me, me.parentObj, null, overallHex.left_offset+offsets[i].x, overallHex.top_offset+offsets[i].y,-3));
				overallNeighbours[i].terrainTypes = array_fnc.copy.call(neighbours[i].terrainTypes);
				overallNeighbours[i].clickEnabled = false;
				overallNeighbours[i].render();
			}
		}
		me.key.render();
	}
}

function terrainHexMap(parentObj, terrainHexToMap)
{
	var me = this;
	me.parentObj = parentObj;
	me.parentHex = terrainHexToMap;
	me.world = me.parentHex.world;
	me.inheritFrom = hexMap;
	me.inheritFrom(me.parentObj, me.parentHex);

	me.outline = function()
	{
		var x1 = me.hexes[0].left_offset + 17;
		var y1 = me.hexes[0].top_offset + 16;
		var x2 = me.hexes[5].left_offset + 17;
		var y2 = me.hexes[5].top_offset + 16;
		var x3 = me.hexes[50].left_offset + 17;
		var y3 = me.hexes[50].top_offset + 16;
		var x4 = me.hexes[90].left_offset + 17;
		var y4 = me.hexes[90].top_offset + 16;
		var x5 = me.hexes[85].left_offset + 17;
		var y5 = me.hexes[85].top_offset + 16;
		var x6 = me.hexes[40].left_offset + 17;
		var y6 = me.hexes[40].top_offset + 16;
		addPolygon("" + (x1-17) + "," + (y1-16) + " " + x1 + "," + y1 + " " + x2 + "," + y2 + " " + (x2+17) + "," + (y2-21), "none","white","white",me.parentObj);
		addPolygon("" + (x2+17) + "," + (y2-20) + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + (x3+25) + "," + y3, "none","white","white",me.parentObj);
		addPolygon("" + (x3+25) + "," + y3 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + (x4+18) + "," + (y4+18), "none","white","white",me.parentObj);
		addPolygon("" + (x4+18) + "," + (y4+18) + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + (x5-17) + "," + (y5+22), "none","white","white",me.parentObj);
		addPolygon("" + (x5-17) + "," + (y5+22) + " " + x5 + "," + y5 + " " + x6 + "," + y6 + " " + (x6-25) + "," + y6, "none","white","white",me.parentObj);
		addPolygon("" + (x6-25) + "," + (y6+5) + " " + x6 + "," + y6 + " " + x1 + "," + y1 + " " + (x1-17) + "," + (y1-16), "none","white","white",me.parentObj);
		var pointsCoord = "" + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x6 + "," + y6;
		addPolygon(pointsCoord, "3px", "rgb(0,0,0)", "none", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*9, "Terrain Hex Map", "Optima, Arial, sans-serif", "2.5em", "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*20-32, "World Name", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*20, me.world.name, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 200, OUTLINE_THICKNESS*20-32, "UWP", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 200, OUTLINE_THICKNESS*20, me.world.uwp, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 350, OUTLINE_THICKNESS*20-32, "TC's and Remarks", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 350, OUTLINE_THICKNESS*20, me.world.tcs, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addRectangle(HEX_MAP_LEFT_OFFSET-8, OUTLINE_THICKNESS, me.parentObj.getAttribute("width") - 16, me.parentObj.getAttribute("height") - HEX_MAP_TOP_OFFSET + 28, "none", OUTLINE_THICKNESS, "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 495, OUTLINE_THICKNESS*20-32, "Overall Terrain Hex", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		var overallHex = new terrainHex(me, me.parentObj, 550, OUTLINE_THICKNESS*20+12);
		overallHex.terrainTypes = array_fnc.copy.call(me.parentHex.terrainTypes);
		overallHex.clickEnabled = false;
		overallHex.render();
		var neighbours = me.parentHex.getAdjacentHexes();
		var overallNeighbours = [];
		var offsets = [{x:27,y:-16},{x:27,y:16},{x:0,y:32},{x:-27,y:16},{x:-27,y:-16},{x:0,y:-32}];
		for(var i=0;i<neighbours.length;i++)
		{
			if(neighbours[i])
			{
				overallNeighbours.push(new terrainHex(me, me.parentObj, overallHex.left_offset+offsets[i].x, overallHex.top_offset+offsets[i].y));
				overallNeighbours[i].terrainTypes = array_fnc.copy.call(neighbours[i].terrainTypes);
				overallNeighbours[i].clickEnabled = false;
				overallNeighbours[i].render();
			}
		}
		me.key.render();
	}

}

function localHexMap(parentObj, localHexToMap)
{
	var me = this;
	me.parentObj = parentObj;
	me.parentHex = localHexToMap;
	me.world = me.parentHex.world;
	me.inheritFrom = hexMap;
	me.inheritFrom(me.parentObj, me.parentHex);

	me.outline = function()
	{
		var x1 = me.hexes[0].left_offset + 17;
		var y1 = me.hexes[0].top_offset + 16;
		var x2 = me.hexes[5].left_offset + 17;
		var y2 = me.hexes[5].top_offset + 16;
		var x3 = me.hexes[50].left_offset + 17;
		var y3 = me.hexes[50].top_offset + 16;
		var x4 = me.hexes[90].left_offset + 17;
		var y4 = me.hexes[90].top_offset + 16;
		var x5 = me.hexes[85].left_offset + 17;
		var y5 = me.hexes[85].top_offset + 16;
		var x6 = me.hexes[40].left_offset + 17;
		var y6 = me.hexes[40].top_offset + 16;
		addPolygon("" + (x1-17) + "," + (y1-16) + " " + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x2 + "," + (y2-21), "none","white","white",me.parentObj);
		addPolygon("" + x2 + "," + (y2-22) + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + (x3+12) + "," + (y3-15), "none","white","white",me.parentObj);
		addPolygon("" + (x3+18) + "," + (y3-23) + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + (x4+18) + "," + (y4+18), "none","white","white",me.parentObj);
		addPolygon("" + (x4+18) + "," + (y4+18) + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x5 + "," + (y5+22), "none","white","white",me.parentObj);
		addPolygon("" + x5 + "," + (y5+22) + " " + x5 + "," + y5 + " " + x6 + "," + y6 + " " + (x6-23) + "," + (y6+7), "none","white","white",me.parentObj);
		addPolygon("" + (x6-21) + "," + (y6+5) + " " + x6 + "," + y6 + " " + x1 + "," + y1 + " " + (x1-17) + "," + (y1-16), "none","white","white",me.parentObj);
		var pointsCoord = "" + x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x6 + "," + y6;
		addPolygon(pointsCoord, "3px", "rgb(0,0,0)", "none", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*9, "Local Hex Map", "Optima, Arial, sans-serif", "2.5em", "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*20-32, "World Name", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS, OUTLINE_THICKNESS*20, me.world.name, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 200, OUTLINE_THICKNESS*20-32, "UWP", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 200, OUTLINE_THICKNESS*20, me.world.uwp, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 350, OUTLINE_THICKNESS*20-32, "TC's and Remarks", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 350, OUTLINE_THICKNESS*20, me.world.tcs, "Arial, sans-serif", "1.5em",  "black", me.parentObj);
		addRectangle(HEX_MAP_LEFT_OFFSET-8, OUTLINE_THICKNESS, me.parentObj.getAttribute("width") - 16, me.parentObj.getAttribute("height") - HEX_MAP_TOP_OFFSET + 28, "none", OUTLINE_THICKNESS, "black", me.parentObj);
		addText(HEX_MAP_LEFT_OFFSET + OUTLINE_THICKNESS + 495, OUTLINE_THICKNESS*20-32, "Overall Local Hex", "Arial, sans-serif", "0.8em",  "black", me.parentObj);
		var overallHex = new localHex(me, me.parentObj, 550, OUTLINE_THICKNESS*20+12);
		overallHex.terrainTypes = array_fnc.copy.call(me.parentHex.terrainTypes);
		overallHex.clickEnabled = false;
		overallHex.render();
		var neighbours = me.parentHex.getAdjacentHexes();
		var overallNeighbours = [];
		var offsets = [{x:16, y:-28},{x:32,y:0},{x:16,y:28},{x:-16,y:28},{x:-32,y:0},{x:-16,y:-28}];
		for(var i=0;i<neighbours.length;i++)
		{
			if(neighbours[i])
			{
				var j = overallNeighbours.push(new localHex(me, me.parentObj, overallHex.left_offset+offsets[i].x, overallHex.top_offset+offsets[i].y)) - 1;
				overallNeighbours[j].terrainTypes = array_fnc.copy.call(neighbours[i].terrainTypes);
				overallNeighbours[j].clickEnabled = false;
				overallNeighbours[j].render();
			}
		}
		me.key.render();
	}
}


function hexMapKey(hexMap)
{
	var me = this;
	me.map = hexMap;
	me.parentObj = hexMap.parentObj;
	me.hexesIncluded = [];

	var HEXES_PER_ROW = 2;

	me.addHex = function(terrainType)
	{
		if(me.hexesIncluded.find(function(v){ return v.name == terrainType.name }) === undefined)
			me.hexesIncluded.push(terrainType);
	}

	me.render = function()
	{
		me.hexesIncluded.sort(array_sort_by_name);
		var starting_left_offset = 450;
		var starting_top_offset = HEX_MAP_TOP_OFFSET + 110;
		for(var i=0;i<me.hexesIncluded.length;i++)
		{
			var top_offset = starting_top_offset + Math.floor(i/HEXES_PER_ROW)*40;
			var left_offset = starting_left_offset + (i%HEXES_PER_ROW)*160;
			switch(me.map.parentHex.hexType)
			{
				case WORLD_HEX:
					var keyHex = new terrainHex(me.map, me.parentObj, left_offset, top_offset)
					break;
				case TERRAIN_HEX:
					var keyHex = new localHex(me.map, me.parentObj, left_offset, top_offset)
					break;
				case LOCAL_HEX:
					var keyHex = new singleHex(me.map, me.parentObj, left_offset, top_offset)
			}
			keyHex.terrainTypes.push(me.hexesIncluded[i]);
			if(me.hexesIncluded[i].name == "Island")
				keyHex.terrainTypes.push(oceanTerrain);
			keyHex.render();
			addText(keyHex.left_offset+40, keyHex.top_offset+20, me.hexesIncluded[i].name, "Arial, sans-serif","1em", "black", me.parentObj);
		}
		var top_offset = starting_top_offset + Math.floor(i/HEXES_PER_ROW)*40;
		var left_offset = starting_left_offset + (i%HEXES_PER_ROW)*160;
		switch(me.map.parentHex.hexType)
		{
			case WORLD_HEX:
				var keyHex = new terrainHex(me.map, me.parentObj, left_offset, top_offset);
				keyHex.add(terrainHexScale);
				break;
			case TERRAIN_HEX:
				var keyHex = new localHex(me.map, me.parentObj, left_offset, top_offset);
				keyHex.add(localHexScale);
				break;
			case LOCAL_HEX:
				var keyHex = new singleHex(me.map, me.parentObj, left_offset, top_offset);
				keyHex.add(singleHexScale);
				break;
		}
		keyHex.render();
		addText(keyHex.left_offset+40, keyHex.top_offset+20, "Scale", "Arial, sans-serif","1em", "black", me.parentObj);
	}
}

function point(x,y)
{
	this.x = x;
	this.y = y;

	this.toString = function()
	{
		return " " + this.x + "," + this.y + " ";
	}

	this.toSVG = function()
	{
		return " " + this.x + " " + this.y + " ";
	}

}

function mapKey(worldMap)
{
	var me = this;
	me.map = worldMap;
	me.parentObj = worldMap.parentObj;
	me.hexesIncluded = [];

	var HEXES_PER_ROW = Math.max(4,Math.floor((6*(me.map.world.uwp.size+1)*32)/320));

	me.addHex = function(terrainType)
	{
		if(me.hexesIncluded.find( function(v) { return v.name == terrainType.name } ) === undefined)
			me.hexesIncluded.push(terrainType);
	}

	me.render = function()
	{
		me.hexesIncluded.sort(array_sort_by_name);
		if(me.map.world.uwp.size > 1)
			var starting_left_offset = me.map.mapCornerPoints[1].x;
		else
			var starting_left_offset = me.map.map_left_offset;
		var starting_top_offset = me.map.mapHeight - MAP_KEY_HEIGHT + 10;
		for(var i=0;i<me.hexesIncluded.length;i++)
		{
			var top_offset = starting_top_offset + Math.floor(i/HEXES_PER_ROW)*40;
			var left_offset = starting_left_offset + (i%HEXES_PER_ROW)*250;
			var keyHex = new worldHex(me.map, me.map.parentObj, null, left_offset, top_offset, -3)
			keyHex.terrainTypes.push(me.hexesIncluded[i]);
			if(me.hexesIncluded[i].name == "Island")
				keyHex.terrainTypes.push(oceanTerrain);
			keyHex.render();
			addText(keyHex.left_offset+40, keyHex.top_offset+20, me.hexesIncluded[i].name, "Arial, sans-serif","1em", "black", me.parentObj);
		}
		top_offset = starting_top_offset + Math.floor(i/HEXES_PER_ROW)*40;
		left_offset = starting_left_offset + (i%HEXES_PER_ROW)*250;
		var keyHex = new worldHex(me.map, me.map.parentObj, null, left_offset, top_offset, -3)
		keyHex.terrainTypes.push(worldHexScale);
		keyHex.render();
		addText(keyHex.left_offset+40, keyHex.top_offset+20, "Scale", "Arial, sans-serif","1em", "black", me.parentObj);

	}
}


var BLACK_HEX = 0;
var WHITE_HEX = 1;
var BLANK_HEX = 2;

function addText(left_offset, top_offset, textString, fontFamily, fontSize, fontColour, parentObj)
{
	var svgNode = document.createElementNS(svgNS,"text");
	svgNode.setAttributeNS(null,"style","font-size:" + fontSize + ";font-family:" + fontFamily + ";fill:" + fontColour + ";");
	svgNode.setAttributeNS(null,"x",left_offset);
	svgNode.setAttributeNS(null,"y",top_offset);
	var textNode = document.createTextNode(textString);
	svgNode.appendChild(textNode);
	parentObj.appendChild(svgNode);
}

function addRectangle(x, y, width, height, fill, strokeWidth, stroke, parentObj)
{
	var rectangle = document.createElementNS(svgNS,"rect");
	rectangle.setAttributeNS(null,"x",x);
	rectangle.setAttributeNS(null,"y",y);
	rectangle.setAttributeNS(null,"width", width);
	rectangle.setAttributeNS(null,"height",height);
	rectangle.setAttributeNS(null,"style","fill:" + fill + ";stroke-width:" + strokeWidth + ";stroke:" + stroke);
	parentObj.appendChild(rectangle);
}

function addLine(x1, y1, x2, y2, strokeWidth, stroke, parentObj, dashed)
{
	if(arguments.length < 8)
		dashed = false;
	var line = document.createElementNS(svgNS,"line");
	line.setAttributeNS(null,"x1",x1);
	line.setAttributeNS(null,"y1",y1);
	line.setAttributeNS(null,"x2",x2);
	line.setAttributeNS(null,"y2",y2);
	line.setAttributeNS(null,"stroke-width",strokeWidth);
	line.setAttributeNS(null,"stroke",stroke);
	if(dashed)
		line.setAttributeNS(null,"stroke-dasharray","5,5");
	parentObj.appendChild(line);

}

function addCircle(cx, cy, r, strokeWidth, stroke, fill, parentObj)
{
	var circle = document.createElementNS(svgNS,"circle");
	circle.setAttributeNS(null,"cx",cx);
	circle.setAttributeNS(null,"cy",cy);
	circle.setAttributeNS(null,"r",r);
	circle.setAttributeNS(null,"style","stroke=width:" + strokeWidth + ";stroke:" + stroke + ";fill:" + fill);
	parentObj.appendChild(circle);
}

function addDashedCircle(cx, cy, r, strokeWidth, stroke, fill, dash_array, parentObj)
{
	var circle = document.createElementNS(svgNS,"circle");
	circle.setAttributeNS(null,"cx",cx);
	circle.setAttributeNS(null,"cy",cy);
	circle.setAttributeNS(null,"r",r);
	circle.setAttributeNS(null,"style","stroke=width:" + strokeWidth + ";stroke:" + stroke + ";fill:" + fill + ";stroke-dasharray:" + dash_array);
	parentObj.appendChild(circle);
}


function addPath(pathInstructions, strokeWidth, stroke, fill, parentObj)
{
	var path = document.createElementNS(svgNS,"path");
	path.setAttributeNS(null,"d",pathInstructions);
	path.setAttributeNS(null, "style","stroke-width:" + strokeWidth + ";stroke:" + stroke + ";fill:" + fill);
	parentObj.appendChild(path);
}

function addPolygon(pointsCoord, strokeWidth, stroke, fill, parentObj)
{
	var polygon = document.createElementNS(svgNS,"polygon");
	polygon.setAttributeNS(null,"points",pointsCoord);
	polygon.setAttributeNS(null, "style","stroke:" + stroke + ";stroke-width:" + strokeWidth + ";fill:" + fill);
	parentObj.appendChild(polygon);
	return polygon; // needed for references to world hexes for modifying colour for some terrain
}

function sort_land_first(a, b)
{
	if((a.has(islandTerrain) || !(a.has(oceanTerrain) || a.has(lakeTerrain2))) && ((b.has(oceanTerrain) || b.has(lakeTerrain2)) && !b.has(islandTerrain)))
		return -1;
	if((b.has(islandTerrain) || !(b.has(oceanTerrain) || b.has(lakeTerrain2))) && ((a.has(oceanTerrain) || a.has(lakeTerrain2)) && !a.has(islandTerrain)))
		return 1;
	return 0;
	// if a has islands/land and b does not, a goes first (return -1); if b has islands/land and a does not, b goes first (return +1)
	// if both have or neither have, do nothing (return 0)
}


var CURRENT_TOOL_CODE = 11; // code is the terrain code
function editingToolBar(worldMap)
{
	var me = this;
	me.map = worldMap;
	const h_spacing = 34;
	const v_spacing = 40;
	const num_per_row = 35;
	me.toolBarDiv = document.getElementById(MAP_EDIT_TOOLBAR_NAME);
	me.tools = [];
	
	me.init = function()
	{
		if(me.toolBarDiv.hasChildNodes())
			return;
		for(var x in allTerrain)
		{
			var terrain = allTerrain[x];
			if(terrain.type == 3)
				continue;
			var hexSymbolDiv = document.createElement("DIV");
			hexSymbolDiv.className = "editTools";
			me.toolBarDiv.appendChild(hexSymbolDiv);
			me.tools.push(hexSymbolDiv);
			var hexSymbolSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			hexSymbolDiv.appendChild(hexSymbolSVG);
			var hexSymbol = new worldHex(me.map, hexSymbolSVG, null, 0, 0, -4);
			hexSymbol.toolbar = me.tools; // enables unused tool backgrounds to be set to white
			hexSymbol.toolDiv = hexSymbolDiv; // enables current tool to be set to red
			hexSymbol.clickEnabled = false;
			hexSymbol.isTool = true;
			hexSymbol.add(terrain);
			hexSymbol.render();
		}
	}	
	me.init();
} 

function beltMap(world, parentObj, containerDiv)
{
	var me = this;
	me.world = world;
	me.parentObj = parentObj;
	me.div = containerDiv;
	me.mapWidth = 3000;
	me.mapHeight = 100;
	me.parentObj.setAttributeNS(null,"width",me.mapWidth);
	me.parentObj.setAttributeNS(null,"height",me.mapHeight);
	me.parentObj.setAttributeNS(null,"viewBox","0 0 " + me.mapWidth + " " + me.mapHeight);
	
	me.generate = function()
	{
		var b_multi = 10;
		var l_multi = 1;
		var inner_bound = 350;
		var n_bound = inner_bound+me.world.beltDetails.beltZones.n*b_multi;
		var m_bound = n_bound+me.world.beltDetails.beltZones.m*b_multi;
		var c_bound = m_bound+me.world.beltDetails.beltZones.c*b_multi;
		var n_label = inner_bound-195;
		var m_label = n_bound-195;
		var c_label = m_bound-195;
		
		addDashedCircle("-200","50","" + c_bound,"2","black","#A4A4A4","5,5",me.parentObj);
		addDashedCircle("-200","50","" + m_bound,"2","black","#D8D8D8","5,5",me.parentObj);
		addDashedCircle("-200","50","" + n_bound,"2","black","#F2F2F2","5,5",me.parentObj);
		addDashedCircle("-200","50","" + inner_bound,"2","black","white","5,5",me.parentObj);
		addText("10","20","Belt Details", "Optima", "80", "black", me.parentObj);
		addText("30", "60", "To Star", "Arial", "12", "black", me.parentObj);
		addPath("M10 54 L20 50 L20 58 Z","1","black","black",me.parentObj);
		addPath("M155 80 L165 70 M155 80 L165 90 M155 80 L" + (c_bound - 205) + " 80 L" + (c_bound - 215) + " 70 M" + (c_bound - 205) + " 80 L" + (c_bound - 215) + " 90","4","black","none",me.parentObj);
		addText("" + (100+(c_bound - inner_bound)/2), "95", "Width: " + me.world.beltDetails.orbitWidth + " AU", "Arial", "10", "black", me.parentObj);
		addText("" + n_label, "50", "N-Zone", "Arial", "12", "black", me.parentObj);
		addText("" + m_label, "50", "M-Zone", "Arial", "12", "black", me.parentObj)
		addText("" + c_label, "50", "C-Zone", "Arial", "12", "white", me.parentObj)
	}
}