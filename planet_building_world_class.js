var SYSTEM_OBJECT_COUNT = 0;
var ALL_DETAILS = [];
const NAME_TABLE_WIDTH = "70pt";
const DOWNLOAD_MAP_BUTTON_NAME = "downloadMapSVG";
const DOWNLOAD_MAP_PNG_BUTTON_NAME = "downloadMapPNG";
const DOWNLOAD_MAP_DATA_BUTTON_NAME = "downloadMapData";
const SLIDE_LEFT_BUTTON_NAME = "slideLeft";
const SLIDE_RIGHT_BUTTON_NAME = "slideRight";
const WORLD_MAP_DIV_NAME = "saveArea";
const WORLD_MAP_SVG_NAME = "worldMapSVG";
const SYSTEM_DETAILS_DIV_NAME = "systemDetails";
const WORLD_DETAILS_DIV_NAME = "world_details";
const MAP_SEED_BOX_NAME = "seed";
const USER_PREF_DIV_NAME = "pref_details"
const EDIT_MAP_BUTTON_NAME = "editThisMap";
const EDIT_WORLD_MAP_DIV_NAME = "editedMapArea";
const EDIT_WORLD_MAP_SVG_NAME = "worldMapEditSVG";
var currentWorld;
var uPObj;
var GO_AND_EDIT = true;
var defaultPrefs = {
	default_sector:"Spinward Marches",
	main_world_hz_only:false,
	main_world_is_sat:false,
	main_world_not_sat:false,
	tz_no_sat:false,
	barren_sys:false,
	download_world_detail:true,
	shoreline_extend_chance:40,
	creep_into_tz_chance:30,
	clear_terrain_default_bg:"#687033",
	clear_terrain_mars_bg:"#b5643b",
	clear_terrain_grey_bg:"#d9d9d9",
	clear_terrain_bw_bg:"#ffffff",
	mountain_terrain_default_bg:"#ac7339",
	mountain_terrain_mars_bg:"#674a35",
	mountain_terrain_grey_bg:"#737373",
	mountain_terrain_bw_bg:"#c8c8c8",
	lava_bg:"#dd2010",
        lava_bw_bg:"#aaaaaa",
	ocean_bg:"#4167b7",
	ocean_depth_bg:"#2d4486",
	ocean_abyss_bg:"#131c35",
	ocean_bw_bg:"#eeeeee",
	ocean_depth_bw_bg:"#eeeeee",
	ocean_abyss_bw_bg:"#eeeeee",
	desert_terrain_bg:"#ffffcc",
	desert_terrain_bw_bg:"#ffffff",
	border_colour:"#10ef10", 
	black_and_white_map:false,
	place_noble_estate:true,
	place_several_noble_estates:false,
	allow_ocean_nobz:false,
	redraw_maps_on_uwp_change:true
	};

function userPreferences()
{
	var me = this;

	me.prefs = Object.assign({}, defaultPrefs);

	me.toObj = function()
	{
		return me.prefs;
	}

	me.read_dbObj = function(o)
	{
		for(p in o)
			me.prefs[p] = me.coerce(o[p]);
	}

	me.resetPrefs = function()
	{
		me.prefs = Object.assign({}, defaultPrefs);
	}

	me.readDocument = function()
	{
		for(p in me.prefs)
			if(document.getElementById(p))
			{
				switch(typeof(me.prefs[p]))
				{
					case "boolean":
						me.prefs[p] = document.getElementById(p).checked;
						break;
					default:
						me.prefs[p] = me.coerce(document.getElementById(p).value);
				}
			}

	}

	me.writeDocument = function()
	{
		for(p in me.prefs)
			if(document.getElementById(p))
			{
				switch(typeof(me.prefs[p]))
				{
					case "boolean":
						document.getElementById(p).checked = me.prefs[p];
						break;
					default:
						document.getElementById(p).value = me.coerce(me.prefs[p]);
				}
			}
	}

	me.coerce = function(v)
	{
		switch(v)
		{
			case "false": return false;
			case "true": return true;
			default:
				var a = parseInt(v);
				if(isNaN(a))
					return v;
				else
					return a;
		}
	}
}

function world()
{
	var me = this;
	me.orbit = null;
	me.isSatellite = false;
	me.satelliteOrbit = 0;
	me.planet = null;
	me.satelliteSystem = null;
	me.has_MW_as_sat = false;
	me.zone = "";  // I = inner (closer than HZ-1), H = habitable (HZ-1 to HZ+1), O = outer (further than HZ+1)
	me.hz_rel = 0;
	me.system = ""; // Always equals "The <main world name> System", e.g. The Regina System
	me.name = "";
	me.isMainWorld = false;
	me.hex = "";
	me.sector = "";
	me.subSector = "";
	me.nativeIntLife = new nil(me);
	me.seed = 0;
	me.popMulti = 0;
	me.map = null;
	me.mapData = null;
	me.beltDetails = null;
	me.portDetails = null;

	me.nameTextBox = function()
	{
		var textInput = document.createElement("INPUT");
		textInput.setAttribute("type","text");
		textInput.width = NAME_TABLE_WIDTH;
		textInput.value = me.name;
		textInput.onchange = function() { me.name = textInput.value; me.orbit.set.systemObj.toSymbolMap(); };
		return textInput;
	}

	me.editDetails = function()
	{
		me.updateEdits();
		all_details.map(function(item, index)	{
													var elem = document.getElementById(item.id);
													elem.onchange = function()	{
																					item.update(elem.value);
																					me.updateEdits();
																					me.isSatellite ? me.planet.orbit.set.updateTable() : me.orbit.set.updateTable();
																					me.isSatellite ? me.planet.orbit.set.systemObj.detailsSaved = false : me.orbit.set.systemObj.detailsSaved = false;
																				};
												});
		var uwp_elem = document.getElementsByName("uwp");
		for(var i=0;i<uwp_elem.length;i++)
			uwp_elem[i].onchange = function()	{
													me.uwp.update(this.id,this.value);
													clearData(this.id);
													me.tcs.generate();
													me.updateEdits(uPObj.prefs.redraw_maps_on_uwp_change);
													me.isSatellite ? me.planet.orbit.set.updateTable() : me.orbit.set.updateTable();
													me.isSatellite ? me.planet.orbit.set.systemObj.detailsSaved = false : me.orbit.set.systemObj.detailsSaved = false;
												};
		document.getElementById("tcs").innerHTML = me.tcs;
		var nonBeltDetails = document.getElementsByName("nonBelt");
		if(me.beltDetails)
		{
			document.getElementById("beltDetailsHeading").style.display = "block";
			document.getElementById("beltDetailsDIV").style.display = "block";
			
			document.getElementById("beltPredomSize").onchange = me.beltDetails.update;
			document.getElementById("beltMaxSize").onchange = me.beltDetails.update;
			document.getElementById("beltWidth").onchange = me.beltDetails.update;
			document.getElementById("belt_nZone").onchange = me.beltDetails.update;
			document.getElementById("belt_mZone").onchange = me.beltDetails.update;
			document.getElementById("belt_cZone").onchange = me.beltDetails.update;

			for(var i=0;i<nonBeltDetails.length;i++)
				nonBeltDetails[i].style.display = "none";
		}
		else
		{
			document.getElementById("beltDetailsHeading").style.display = "none";
			document.getElementById("beltDetailsDIV").style.display = "none";
			for(var i=0;i<nonBeltDetails.length;i++)
				nonBeltDetails[i].style.display = "block";
		}
		var cX_div = document.getElementById("cX");
		var eX_div = document.getElementById("eX");
		var iX_div = document.getElementById("iX");
		var nobz_div = document.getElementById("nobz");
		if(me.constructor.name == "mainWorld")
		{
			cX_div.hidden = false;
			cX_details.map(function(item)		{
													var elem = document.getElementById(item.id);
													var elem_adj = document.getElementById(item.adj_id)
													elem.value = item.contents();
													elem_adj.innerHTML = item.text_string();
													elem.onchange = function()	{
																					item.update(elem.value);
																					elem_adj.innerHTML = item.text_string();
																					me.isSatellite ? me.planet.orbit.set.systemObj.detailsSaved = false : me.orbit.set.systemObj.detailsSaved = false;
																				};

												});
			eX_div.hidden = false;
			eX_details.map(function(item)		{
													var elem = document.getElementById(item.id);
													if(elem.nodeName == "P")
														elem.innerHTML = item.contents();
													else
														elem.value = item.contents();
													elem.onchange = function()	{
																					item.update(elem.value);
																					me.isSatellite ? me.planet.orbit.set.systemObj.detailsSaved = false : me.orbit.set.systemObj.detailsSaved = false;
																				};
												});
			document.getElementById("world_ix").value = me.importance.value;
			document.getElementById("world_ix_desc").innerHTML = me.importance.description();
			nobz_div.hidden = false;
			document.getElementById("nobz_codes").innerHTML = me.noblesExt.toString();
			document.getElementById("nobz_descriptions").innerHTML = me.noblesExt.allNobles();
		}
		else
		{
			cX_div.hidden = true;
			eX_div.hidden = true;
			iX_div.hidden = true;
			nobz_div.hidden = true;
		}
		var orbBtns = document.getElementById("orbitButtons");
		while(orbBtns.hasChildNodes())
			orbBtns.removeChild(orbBtns.childNodes[0]);
		var orbDtl = document.getElementById("orbit_text");
		var orbSatSel = document.getElementById("satOrbitSel");
		var orbFI = document.getElementById("orbitFormItem");
		if(!me.isSatellite)
		{
			orbDtl.hidden = false;
			orbBtns.hidden = false;
			orbSatSel.hidden = true;
			orbBtns.appendChild(me.orbit.baseOrbitAdjustUpBtn());
			orbBtns.appendChild(me.orbit.baseOrbitAdjustDownBtn());
			orbBtns.appendChild(me.orbit.orbitAdjustUpBtn());
			orbBtns.appendChild(me.orbit.orbitAdjustDownBtn());
		}
		else
		{
			orbDtl.hidden = true;
			orbBtns.hidden = true;
			orbSatSel.hidden = false;
			orbSatSel.value = me.orbit.baseOrbit.o;
			orbSatSel.onchange = function() {
												me.orbit.baseOrbit = SATELLITE_ORBIT_DATA.find(function(orb) { return orb.o == orbSatSel.value });												
												me.tcs.generate();
												me.orbit.calcRowContents();
												me.orbit.set.planet.orbit.set.updateTable();
												ROTATIONAL_PERIOD = null;
												me.updateEdits(true); // recalc rotational period / locking needed
												me.isSatellite ? me.planet.orbit.set.systemObj.detailsSaved = false : me.orbit.set.systemObj.detailsSaved = false;												
											};
		}

		RESOURCES_ALL.map(function(item,index)	{
													var elem = document.getElementById(item.id);
													elem.onchange = function()	{
																					elem.checked ? me.resources().add(item) : me.resources().erase(item);
																					me.updateEdits();
																					me.isSatellite ? me.planet.orbit.set.systemObj.detailsSaved = false : me.orbit.set.systemObj.detailsSaved = false;
																				};
												});
		currentWorld = me;
	}

	me.updateEdits = function(forceUpdateMap)
	{
		if(arguments.length < 1) 
			forceUpdateMap = false;
		var editDiv = detailDiv // global variable declared separately pointing at a correctly constructed HTML DIV - breaks encapsulation!
		me.tcs.has("Tz") ? document.getElementById("tz_msg").hidden = false : document.getElementById("tz_msg").hidden = true;
		me.tcs.has("Lk") ? document.getElementById("lk_msg").hidden = false : document.getElementById("lk_msg").hidden = true;
		all_details.map(function(item, index)	{
													var elem = editDiv.ownerDocument.getElementById(item.id);
													switch(elem.tagName)
													{
														case "P":
															elem.innerHTML = item.contents();
															break;
														default:
															elem.value = item.contents();
															break;
													}

												});
		var uwp_edits = editDiv.ownerDocument.getElementsByName("uwp");
		for(var i=0;i<uwp_edits.length;i++)
			uwp_edits[i].value = me.uwp[uwp_edits[i].id];
		document.getElementById("tcs").innerHTML = me.tcs;
		var resource_edits = editDiv.ownerDocument.getElementsByName("resource");
		for(i=0;i<resource_edits.length;i++)
			resource_edits[i].checked = me.resources().has(resource_edits[i].id);
		var tempTbl = document.getElementById("temperatureTbl");
		if(tempTbl)
			editDiv.removeChild(tempTbl);
		var newTempTbl = me.temperatureTblHTML();
		if(newTempTbl)
		{
			newTempTbl.id = "temperatureTbl";
			editDiv.appendChild(newTempTbl);
		}
		if(me.isMainWorld)
		{
			eX_details.map(function(item)		{
													var elem = document.getElementById(item.id);
													if(elem.nodeName == "P")
														elem.innerHTML = item.contents();
													else
														elem.value = item.contents();
													elem.onchange = function()	{
																					item.update(elem.value);
																				};
												});
			cX_details.map(function(item)		{
													var elem = document.getElementById(item.id);
													var elem_adj = document.getElementById(item.adj_id)
													elem.value = item.contents();
													elem_adj.innerHTML = item.text_string();
													elem.onchange = function()	{
																					item.update(elem.value);
																					elem_adj.innerHTML = item.text_string();
																				};

												});
			var iX_elem = document.getElementById("world_ix");
			var iX_elem_desc = document.getElementById("world_ix_desc");
			iX_elem.value = me.importance.value;
			iX_elem_desc.innerHTML = me.importance.description();
			iX_elem.onchange = function() 	{
												me.importance.value = parseInt(iX_elem.value);
												iX_elem_desc.innerHTML = me.importance.description();				
											};
			
		}
		if(me.mapData && !forceUpdateMap)
			me.createMap(me.mapData);
		else
			me.createMap();
		if(!me.beltDetails && me.isBelt())
			me.beltDetails = new beltDetails(me);
		if(me.beltDetails)
		{
			document.getElementById("beltPredomSize").value = me.beltDetails.predomSize;
			document.getElementById("beltMaxSize").value = me.beltDetails.maxDiam;
			document.getElementById("beltWidth").value = me.beltDetails.orbitWidth;
			document.getElementById("belt_nZone").value = me.beltDetails.beltZones.n;
			document.getElementById("belt_mZone").value = me.beltDetails.beltZones.m;
			document.getElementById("belt_cZone").value = me.beltDetails.beltZones.c;
			document.getElementById("belt_cZone").value = me.beltDetails.beltZones.c;
		}
	}

	me.createMap = function(mapData)
	{
		if(me.seed)
			init_rng(me.seed);
		else
		{
			init_rng(Date.now());
			me.seed = rng(4294967295);
			init_rng(me.seed);
		}

		var worldMapDiv = document.getElementById(WORLD_MAP_DIV_NAME);
		var worldMapSVG = document.getElementById(WORLD_MAP_SVG_NAME);
		while(worldMapSVG.childNodes.length > 0)
			worldMapSVG.removeChild(worldMapSVG.firstChild);
		var downloadMapButton = document.getElementById(DOWNLOAD_MAP_BUTTON_NAME);
		var fileName = me.name.replace(/'/g,"") + " UWP " + me.uwp + " world map.svg";
		var clickScript = "downloadMap('" + WORLD_MAP_DIV_NAME + "','" + fileName +"');";
		downloadMapButton.setAttribute("onclick", clickScript);
		
		var downloadAsPNGButton = document.getElementById(DOWNLOAD_MAP_PNG_BUTTON_NAME);
		fileName = me.name.replace(/'/g,"") + " UWP " + me.uwp + " world map.png";
		clickScript = "svgToPng('worldMapSVG','" + fileName +"');";
		downloadAsPNGButton.setAttribute("onclick", clickScript);
		
		var downloadMapDataButton = document.getElementById(DOWNLOAD_MAP_DATA_BUTTON_NAME);
		fileName = me.name.replace(/'/g,"") + " UWP " + me.uwp + " world map data.json";
		downloadMapDataButton.onclick = function() { downloadMapData(me.map, fileName); };
		
		var editMapButton = document.getElementById(EDIT_MAP_BUTTON_NAME);
		editMapButton.disabled = false;
		
		if(me.isBelt())
		{
			editMapButton.disabled = true;
			if(!me.beltDetails)
				me.beltDetails = new beltDetails(me);
			me.map = new beltMap(me, worldMapSVG, worldMapDiv);
			me.map.generate();
			return;
		}
		
		me.map = new worldMap(me, worldMapSVG, worldMapDiv);
		if(mapData)
		{
			me.map.loadObj(mapData);
			me.map.render();
			me.map.outline();
			me.mapData = mapData;
		}
		else
		{
			me.map.generate();
			me.map.render();
			me.map.outline();
			me.mapData = me.map.genSaveObj();
		}
	}

	function rotationPeriodString()
	{
		var s = hms(Math.abs(me.rotationalPeriod())) + (me.rotationalPeriod() < 0 ? " retrograde" : "");
		return s;
	}

	function orbitalPeriodString()
	{
		var s = "";
		var p = me.orbitalPeriod();
		if(me.isSatellite)
		{
			if(p < 2)
				s = dhms(p*28);
			else
				s = mdhms(p);
		}
		else
		{
			if(p < 2)
				s = dhms(p*365);
			else
				s = ydhms(p);
		}
		return s;
	}

	me.detailsHTML = function()
	{
		var s = "";
		all_details.map(function(item) { item.text_string ? s += "<td>" + item.text_string + "</td>" : s += "";} );
		return s;
	}

	me.detailsCSV = function()
	{
		var s = "";
		all_details.map(function(item) { item.text_string ? s += item.text_string + "," : s += "";});
		return s;
	}

	me.detailsText = function()
	{
		var s = ""
		all_details.map(function(item) { item.text_string ? s += item.name + ": " + item.text_string + ", " : s += ""; });
		return s;
	}

	me.isBelt = function()
	{
		return me.generationObject.name == "Planetoids" || (me.constructor.name == "mainWorld" && me.uwp.size == 0);
	}
	
	var WORLD_DIAMETER;
	me.diameter = function()
	{
		if(WORLD_DIAMETER)
			return WORLD_DIAMETER;
		var stupidImperial = 0;
		if(me.uwp.size == 0)
			stupidImperial = 300 + 25*flux() + 2.5*flux() + 0.25*flux();
		else
			stupidImperial = me.uwp.size*1000 + flux()*100 + flux()*10 + flux();
		WORLD_DIAMETER = Math.round(stupidImperial*1.61);
		return WORLD_DIAMETER;
	}

	// units are arbitrary (input units = output units) but intention is meters
	me.distanceToHorizon = function(height)
	{
		if(arguments.length < 1)
			height = 1.6;
		return Math.sqrt(height * (2 * me.diameter()/2 + height));
	}

	me.jumpPoint = function()
	{
		if(me.isSatellite)
			return Math.round(Math.max(me.diameter()*100, me.planet.jumpPoint() - me.orbit.orbitDistance(), me.planet.orbit.set.centralStar.jumpPoint() - (me.planet.orbit.orbitDistance()*AU_IN_KM)));
		else
			return Math.round(Math.max(me.diameter()*100, me.orbit.set.centralStar.jumpPoint() - (me.orbit.orbitDistance()*AU_IN_KM)));
	}

	me.jumpPointTimes = function(lineBreaks)
	{
		if(arguments.length < 1)
			lineBreaks = true;
		var d = me.jumpPoint();
		var s = "";
		for(var a=1;a<7;a++)
			s += a + "G: " + new intraSystemTravel({ d:(d*1000), a:(a*9.98), t:false }).timeString() + (lineBreaks ? "<br />" : "; ");
		return s;
	}

	me.getSatelliteOrbit = function(numSats)
	{
		if(arguments.length < 1)
			numSats = 0;
		var sat_orbit_table = (dice(2) - numSats) < 8 ? new dice_table(SATELLITE_ORBIT_DATA_CLOSE) : new dice_table(SATELLITE_ORBIT_DATA_FAR);
		return sat_orbit_table.roll();
	}

	me.numSats = function()
	{
		if(me.tcs.has("Tz") && uPObj.prefs.tz_no_sat)
			return -1;
		switch(me.zone)
		{
			case "H": return dice(1)-4;
			case "I": return dice(1)-5;
			case "O": return dice(1)-3;
		}
	}

	me.generateSat = function()
	{
		var worldTypeTable;
		switch(me.zone)
		{
			case "H":
				worldTypeTable = new dice_table(WORLD_TYPE_HZ_SATELLITE);
				break;
			case "I":
				worldTypeTable = new dice_table(WORLD_TYPE_INNER_SATELLITE);
				break;
			case "O":
				worldTypeTable = new dice_table(WORLD_TYPE_OUTER_SATELLITE);
				break;
		}
		if(me.constructor.name == "gasGiant")
			worldTypeTable.DM = 1;
		var newSat = new minorWorld(worldTypeTable.roll(),(me.isMainWorld ? me : me.mainWorld), me);
		newSat.system = me.system;
		newSat.generate();
		return newSat;
	}

	me.calcTemperatureK = function()
	{
		if(me.isSatellite)
			return Math.round(374.025 * me.greenhouse() * (1 - me.albedo()) * Math.pow(me.planet.orbit.set.centralStar.luminosity,0.25) / Math.sqrt(me.planet.orbit.orbitDistance()));
		else
			return Math.round(374.025 * me.greenhouse() * (1 - me.albedo()) * Math.pow(me.orbit.set.centralStar.luminosity,0.25) / Math.sqrt(me.orbit.orbitDistance()));
	}

	me.calcTemperatureC = function()
	{
		return me.calcTemperatureK() - 273;
	}

	var CALC_ALBEDO;
	me.albedo = function()
	{
		if(CALC_ALBEDO)
			return CALC_ALBEDO;
		var cloudComponent = me.cloudiness()*me.cloudAlbedo();
		var nonCloudComp = (1-me.cloudiness())*(me.landCover()*me.landAlbedo() + me.icecapCover()*0.55 + me.waterCover()*0.02);
		CALC_ALBEDO = Math.round((cloudComponent + nonCloudComp)*100)/100;
		return CALC_ALBEDO;
	}

	var CLOUD_ALBEDO_INDEX;
	me.cloudAlbedo = function()
	{
		if(CLOUD_ALBEDO_INDEX)
			return CLOUD_ALBEDO_INDEX;
		CLOUD_ALBEDO_INDEX = Math.min(0.8,0.3 + dice(1)*0.1);
		return CLOUD_ALBEDO_INDEX;
	}

	var LAND_COVERAGE;
	me.landCover = function()
	{
		if(LAND_COVERAGE)
			return LAND_COVERAGE;
		LAND_COVERAGE = 1 - me.icecapCover() - me.waterCover();
		return LAND_COVERAGE;
	}

	var LAND_ALBEDO;
	me.landAlbedo = function()
	{
		if(LAND_ALBEDO)
			return LAND_ALBEDO;
		LAND_ALBEDO = 0.1 + (1 - me.waterCover()) * 0.1; // an approximation - land albedo runs from 0.1 (forest / field) to 0.2 (desert)
		// so roughly calculating land albedo as 0.1 (darkest) plus adding brightnest upto 0.2 depending on how LITTLE water there is.
		return LAND_ALBEDO;
	}

	var ICE_CAP_COVERAGE;
	me.icecapCover = function()
	{
		if(ICE_CAP_COVERAGE)
			return ICE_CAP_COVERAGE;
		if(me.uwp.hydro <= 1)
		{
			ICE_CAP_COVERAGE = 0;
			return ICE_CAP_COVERAGE;
		}
		var numHexes = 1;
		var numRows = Math.floor(me.uwp.hydro/2);
		for(var i=0;i<numRows;i++)
			numHexes += i*5;
		ICE_CAP_COVERAGE = Math.floor(numHexes / me.worldHexes() * 100) / 100;
		return ICE_CAP_COVERAGE;
	}

	var WATER_COVERAGE;
	me.waterCover = function()
	{
		if(WATER_COVERAGE)
			return WATER_COVERAGE;
		WATER_COVERAGE = (1 - me.icecapCover()) * (me.getHydroPercentage() / 100);
		return WATER_COVERAGE;
	}

	var NUM_WORLD_HEXES;
	me.worldHexes = function()
	{
		if(NUM_WORLD_HEXES)
			return NUM_WORLD_HEXES;
		NUM_WORLD_HEXES = 20*(triangleNumber(me.uwp.size-1)+(me.uwp.size-1)/2)+2;
		return NUM_WORLD_HEXES;
	}

	var CLOUDINESS;
	me.cloudiness = function()
	{
		if(CLOUDINESS)
			return CLOUDINESS;
		CLOUDINESS = [0,0,0.1,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.7][me.uwp.hydro]
		if(me.uwp.atmos > 9 && me.uwp.atmos != 14)
			CLOUDINESS = Math.min(1, CLOUDINESS + 0.4);
		if(me.uwp.atmos < 4)
			CLOUDINESS = Math.max(0.2,CLOUDINESS);
		if(me.uwp.atmos == 14)
			CLOUDINESS = CLOUDINESS / 2;
		return CLOUDINESS;
	}

	var CALC_GREEN_HOUSE;
	me.greenhouse = function()
	{
		if(CALC_GREEN_HOUSE)
			return CALC_GREEN_HOUSE;
		if(me.uwp.atmos < 10 || me.uwp.atmos > 12)
			CALC_GREEN_HOUSE =  GREENHOUSE[me.uwp.atmos];
		if(me.uwp.atmos == 10)
			CALC_GREEN_HOUSE =  new dice_table(GH_ATM_10).roll();
		if(me.uwp.atmos == 11 || me.uwp.atmos == 12)
			CALC_GREEN_HOUSE =  new dice_table(GH_ATM_11).roll();
		return CALC_GREEN_HOUSE;
	}

	me.orbitalPeriod = function()
	{
		var d,m
		if(me.isSatellite)
		{
			d = me.orbit.orbitDistance() / 400000;
			m = me.planet.mass();
			for(var i=0;i<me.planet.satelliteSystem.orbits.length;i++)
				m += me.planet.satelliteSystem.orbits[i].contents.mass();
			m = m / 1.012;
		}
		else
		{
			d = me.orbit.orbitDistance();
			m = me.orbit.set.centralStar.mass;
			if(me.orbit.set.companionStar)
				m += me.orbit.set.companionStar.mass;
		}
		var orbit_period = Math.sqrt(Math.pow(d,3)/m); // earth years for planets; lunar months (28 days) for satellites
		return Math.round(orbit_period*1000)/1000;
	}

	me.gravity = function()
	{
		var g = 0;
		if(me.uwp.size == 0)
			g = me.mass() * (162358564 / Math.pow(me.diameter(),2));
		else
			g = me.mass() * (64 / Math.pow(me.uwp.size,2));
		if(g > 0.1)
			g = Math.round(g*100)/100;
		else
			g = Math.round(g*10000)/10000;
		return g
	}

	me.mass = function()
	{
		var vol = 0;
		if(me.uwp.size == 0)
			vol = Math.pow(me.diameter()/12742,3);
		else
			vol = Math.pow(me.uwp.size/8,3); // in earth volumes
		var mass = vol*me.density();
		if(mass > 0.1)
			mass = Math.round(mass*1000)/1000;
		else
			mass = Math.round(mass*100000)/100000;
		return mass;
	}

	var WORLD_DENSITY;
	me.density = function()
	{
		if(WORLD_DENSITY)
			return WORLD_DENSITY;
		var densityTbl = new dice_table(me.densityType());
		WORLD_DENSITY = densityTbl.roll();
		return WORLD_DENSITY;
	}

	var DENSITY_TYPE;
	me.densityType = function()
	{
		if(DENSITY_TYPE)
			return DENSITY_TYPE;
		if(me.generationObject.name == "Ice world")
			DENSITY_TYPE = WORLD_DENSITY_ICY_BODY_TABLE;
		else
		{
			if(me.constructor.name == "gasGiant")
				DENSITY_TYPE = WORLD_DENSITY_GAS_GIANT;
			else
			{
				var densityTypeTbl = new dice_table(WORLD_DENSITY_TYPE_TABLE, me.uwp);
				if(me.zone == "O")
					densityTypeTbl.DM += 6;
			}
			DENSITY_TYPE = densityTypeTbl.roll();

		}
		return DENSITY_TYPE;
	}

	var AXIAL_TILT;
	me.axialTilt = function()
	{
		if(AXIAL_TILT)
			return AXIAL_TILT;
		if(me.tcs.has("Tz"))
		{
			AXIAL_TILT = 0;
			return AXIAL_TILT;
		}
		var tiltTable = new dice_table(AXIAL_TILT_TABLE);
		var tiltFunction = tiltTable.roll();
		if(tiltFunction === EXTREME_AXIAL_TILT_TABLE)
		{
			var extremeTiltFunction = new dice_table(tiltFunction);
			AXIAL_TILT = extremeTiltFunction.roll()();
		}
		else
		{
			AXIAL_TILT = tiltFunction();
		}
		return AXIAL_TILT;
	}

	var SEASON_SUMMER_PLUS;
	me.seasonSummerPlus = function()
	{
		if(SEASON_SUMMER_PLUS)
			return SEASON_SUMMER_PLUS;
		SEASON_SUMMER_PLUS = me.axialTilt()*0.6;
		return SEASON_SUMMER_PLUS;
	}

	var SEASON_WINTER_MINUS;
	me.seasonWinterMinus = function()
	{
		if(SEASON_WINTER_MINUS)
			return SEASON_WINTER_MINUS;
		SEASON_WINTER_MINUS = me.axialTilt();
		return SEASON_WINTER_MINUS;
	}

	var ORBIT_ECCENTRICITY;
	me.orbitEccentricity = function()
	{
		if(ORBIT_ECCENTRICITY)
			return ORBIT_ECCENTRICITY;
		var eFnc = new dice_table(ORBIT_ECCENTRICITY_TABLE).roll();
		if(eFnc === ORBIT_ECCENTRICITY_TABLE_EXTREME)
		{
			var extFnc = eFnc.roll();
			ORBIT_ECCENTRICITY = extFnc();
		}
		else
			ORBIT_ECCENTRICITY = eFnc();
		return ORBIT_ECCENTRICITY;
	}

	var ROTATIONAL_PERIOD;
	me.rotationalPeriod = function()
	{
		if(ROTATIONAL_PERIOD)
			return ROTATIONAL_PERIOD;
		ROTATIONAL_PERIOD = 0;
		if(me.tcs.has("Tz") || me.tcs.has("Lk"))
			ROTATIONAL_PERIOD = me.lockPeriod();
		else
		{
			ROTATIONAL_PERIOD = (dice(2)-2)*4+5;
			if(me.isSatellite)
			{
				ROTATIONAL_PERIOD += me.planet.mass() / (me.orbit.orbitDistance() / 400000);
			}
			else
				ROTATIONAL_PERIOD += (me.orbit.set.centralStar.mass + (me.orbit.set.companionStar ? me.orbit.set.companionStar.mass : 0))/me.orbit.orbitDistance();
			if(ROTATIONAL_PERIOD >= 40)
			{
				var extrFnc = new dice_table(ROTATION_PERIOD_EXTREME_TABLE).roll();
				if(extrFnc())
					ROTATIONAL_PERIOD *= extrFnc();
			}
			if(!me.forcedPlanet)    // if forcedPlanet was set because Pl code was given, would also give Tz code if needed, so skip the check
			me.lockCheck();
		}
		ROTATIONAL_PERIOD = Math.floor(ROTATIONAL_PERIOD*100)/100;
		return ROTATIONAL_PERIOD;
	}

	me.lockPeriod = function()
	{
		return me.isSatellite ? me.orbitalPeriod()*28*24 : me.orbitalPeriod()*365*24;
	}

	me.lockCheck = function()
	{
		if(ROTATIONAL_PERIOD > me.lockPeriod() || -ROTATIONAL_PERIOD < -me.lockPeriod())
		{
			ROTATIONAL_PERIOD = me.lockPeriod();
			me.isSatellite ? me.tcs.add("Lk") : me.tcs.add("Tz");
		}
	}

	me.noTZ = function()
	{
		if(!me.tcs.has("Tz"))
			return;
		while(me.tcs.has("Tz"))
		{
			me.tcs.del("Tz");
			ROTATIONAL_PERIOD = null;
			me.rotationalPeriod();
		}
		DAY_PLUS_TEMP = null;
		NIGHT_MINUS_TEMP = null;
		SEASON_EFFECT_PER_ROW = null;
		TEMP_TABLE = null;
		me.mapData = null;
		me.updateEdits();
	}

	var MAX_DAY_PLUS_TEMP;
	me.maxDayPlus = function()
	{
		if(MAX_DAY_PLUS_TEMP)
			return MAX_DAY_PLUS_TEMP;
		MAX_DAY_PLUS_TEMP = me.atmosPressureTable().day_abs * me.calcTemperatureK();
		return MAX_DAY_PLUS_TEMP;
	}

	var MAX_NIGHT_MINUS_TEMP;
	me.maxNightMinus = function()
	{
		if(MAX_NIGHT_MINUS_TEMP)
			return MAX_NIGHT_MINUS_TEMP;
		MAX_NIGHT_MINUS_TEMP = -1 * me.atmosPressureTable().night_abs * me.calcTemperatureK();
		return MAX_NIGHT_MINUS_TEMP;
	}

	var DAY_PLUS_TEMP;
	me.dayPlus = function()
	{
		if(DAY_PLUS_TEMP)
			return DAY_PLUS_TEMP;
		DAY_PLUS_TEMP = 0;
		if(me.tcs.has("Tz"))
		{
			DAY_PLUS_TEMP = me.maxDayPlus();
			return DAY_PLUS_TEMP;
		}

		DAY_PLUS_TEMP = Math.min(me.maxDayPlus(),Math.abs(me.rotationalPeriod())/2*me.atmosPressureTable().day_plus);
		return DAY_PLUS_TEMP;
	}

	var NIGHT_MINUS_TEMP;
	me.nightMinus = function()
	{
		if(NIGHT_MINUS_TEMP)
			return NIGHT_MINUS_TEMP;
		NIGHT_MINUS_TEMP = 0;
		if(me.tcs.has("Tz"))
		{
			NIGHT_MINUS_TEMP = me.maxNightMinus();
			return NIGHT_MINUS_TEMP;
		}
		NIGHT_MINUS_TEMP = Math.max(me.maxNightMinus(),Math.abs(me.rotationalPeriod(false))/2*me.atmosPressureTable().night_minus);
		return NIGHT_MINUS_TEMP;
	}

	var ATMOS_PRESSURE;
	me.atmosPressure = function()
	{
		if(ATMOS_PRESSURE)
			return ATMOS_PRESSURE;
		if(me.uwp.atmos > 9 && me.uwp.atmos < 13)
			me.atmosComposition();
		else
			ATMOS_PRESSURE = new dice_table(me.atmosPressureTable()).roll();
		return ATMOS_PRESSURE;
	}

	var ATMOS_PRESSURE_TABLE;
	me.atmosPressureTable = function()
	{
		if(ATMOS_PRESSURE_TABLE)
			return ATMOS_PRESSURE_TABLE;
		switch(me.uwp.atmos)
		{
			case 10:
			case 11:
			case 12:
				me.atmosComposition();
				break;
			case 13:
				ATMOS_PRESSURE_TABLE = ATM_PRESSURE_VDENSE;
				break;
			case 14:
				ATMOS_PRESSURE_TABLE = ATM_PRESSURE_VTHIN;
				break;
			case 15:
				ATMOS_PRESSURE_TABLE = ATM_PRESSURE_TABLE[d10()-1];
				break;
			default:
				ATMOS_PRESSURE_TABLE = ATM_PRESSURE_TABLE[me.uwp.atmos];
		}
		return ATMOS_PRESSURE_TABLE;
	}

	var ATMOS_COMPOSITION;
	me.atmosComposition = function()
	{
		if(ATMOS_COMPOSITION)
			return ATMOS_COMPOSITION;
		switch(me.uwp.atmos)
		{
			case 0:
				ATMOS_COMPOSITION = "None";
				break;
			case 1:
				ATMOS_COMPOSITION = "Trace gases";
				break;
			case 2:
			case 5:
			case 6:
			case 8:
			case 13:
			case 14:
			case 15:
				ATMOS_COMPOSITION = "Standard Oxygen / Nitrogen Mix";
				break;
			case 3:
			case 4:
			case 7:
			case 9:
				ATMOS_COMPOSITION = "Standard Oxygen / Nitrogen Mix with a taint caused by " + new dice_table(ATM_COMPOSITION_TAINT).roll();
				break;
			case 10:
				var atmosObj = new dice_table(EXOTIC_ATMOS_COMPOSITION).roll();
				if(atmosObj.pressure === null && atmosObj.irritant === null)
				{
					ATMOS_COMPOSITION = "Occasional Corrosive";
					ATMOS_PRESSURE_TABLE = ATM_PRESSURE_TABLE[rng(7)+2];
					ATMOS_PRESSURE = new dice_table(ATMOS_PRESSURE_TABLE);
				}
				else
				{
					ATMOS_COMPOSITION = "Exotic gas mix at " + atmosObj.pressure.name + " pressure. ";
					ATMOS_PRESSURE_TABLE = atmosObj.pressure;
					ATMOS_PRESSURE = new dice_table(ATMOS_PRESSURE_TABLE).roll();
				}
				ATMOS_COMPOSITION += me.getGasMix(atmosObj.irritant).description();
				break;
			case 11:
				var t = me.calcTemperatureC();
				do
				{
					var atmosObj = new dice_table(CORROSIVE_ATMOS_COMPOSITION).roll();
				}
				while(t < atmosObj.lowerTemp && t > atmosObj.higherTemp);
				ATMOS_PRESSURE_TABLE = atmosObj.pressure;
				ATMOS_PRESSURE = new dice_table(ATMOS_PRESSURE_TABLE).roll();
				ATMOS_COMPOSITION = "Corrosive gas mix at temperature " + t + "&deg;C and at " + atmosObj.pressure.name + " pressure. ";
				ATMOS_COMPOSITION += me.getGasMix().description();
				break;
			case 12:
				ATMOS_PRESSURE_TABLE = new dice_table(INSIDIOUS_ATMOS_PRESSURE).roll();
				ATMOS_PRESSURE = new dice_table(ATMOS_PRESSURE_TABLE).roll();
				ATMOS_COMPOSITION = "Insidious atmosphere caused by " + new dice_table(INSIDIOUS_ATMOS_COMPOSITION).roll() + " at " + ATMOS_PRESSURE + " pressure. "
				ATMOS_COMPOSITION += me.getGasMix().description();
				break;
		}
		return ATMOS_COMPOSITION;
	}

	var GAS_MIX_DETAIL;
	me.getGasMix = function(irritantFlag)
	{
		if(arguments.length < 1 || irritantFlag === null)
			irritantFlag = false;
		else
			irritantFlag = true;
		if(GAS_MIX_DETAIL)
			return GAS_MIX_DETAIL;
		GAS_MIX_DETAIL = new gasMix(me, irritantFlag);
		return GAS_MIX_DETAIL;
	}

	var FLUID_DETAIL;
	me.getFluid = function()
	{
		var f_obj;
		if(FLUID_DETAIL)
			return FLUID_DETAIL;
		if(me.uwp.atmos < 10 || me.uwp.atmos > 12)
			f_obj = LIQUID_H2O;
		else
		{
			var randomRoll = dice(2);
			if(me.uwp.atmos == 10 && randomRoll > 9)
				f_obj = LIQUID_H2O;
			else
				f_obj = me.getGasMix().assoc_liquid();
		}
		FLUID_DETAIL = f_obj.name;
		return FLUID_DETAIL;
	}

	var HYDRO_PERCENTAGE;
	me.getHydroPercentage = function()
	{
		if(HYDRO_PERCENTAGE)
			return HYDRO_PERCENTAGE;
		if(me.constructor.name == "gasGiant")
			HYDRO_PERCENTAGE = 0;
		else
			HYDRO_PERCENTAGE = Math.max(0,Math.min(100,me.uwp.hydro*10 + flux()));
		return HYDRO_PERCENTAGE;
	}

	var STRESS_FACTOR;
	me.getStress = function()
	{
		if(STRESS_FACTOR)
			return STRESS_FACTOR;
		STRESS_FACTOR = dice(1)-3;
		if(me.densityType().name == "Molten Core")
			STRESS_FACTOR += dice(1)-3;
		if(me.densityType().name == "Heavy Core")
			STRESS_FACTOR += dice(1)-2;
		if(me.isSatellite)
		{
			STRESS_FACTOR += me.planet.diameter() / (me.orbit.baseOrbit.m*64);
			//STRESS_FACTOR += me.planet.orbit.set.centralStar.mass / me.planet.orbit.orbitDistance();
		}
		else
		{
			if(me.satelliteSystem)
				for(var i=0;i<me.satelliteSystem.orbits.length;i++)
					if(me.satelliteSystem.orbits[i].contents.constructor.name != "ring")
						STRESS_FACTOR += me.satelliteSystem.orbits[i].contents.diameter() / (me.satelliteSystem.orbits[i].baseOrbit.m*64);
			STRESS_FACTOR += me.orbit.set.centralStar.mass / me.orbit.orbitDistance();
		}
		STRESS_FACTOR = Math.round(Math.max(0, STRESS_FACTOR));
		return STRESS_FACTOR;
	}

	var VOLCANOES = [];
	me.getNumVolcanoes = function() // generate the number of volcanoes for a continent and push it into an array
	{
		var v = Math.max(0, flux() + Math.floor(me.getStress() / 2));
		VOLCANOES.push(v);
		return VOLCANOES;
	}

	var NATIVE_LIFE;
	me.nativeLife = function()
	{
		if(NATIVE_LIFE !== undefined)
			return NATIVE_LIFE;
		var nativeLifeTbl = new dice_table(NATIVE_LIFE_TBL,me.uwp);
		NATIVE_LIFE = nativeLifeTbl.roll();
		return NATIVE_LIFE;
	}

	var RESOURCES;
	me.resources = function()
	{
		if(RESOURCES)
			return RESOURCES;
		RESOURCES = new worldResources(me);
		RESOURCES.generate();
		return RESOURCES;
	}

	me.latitudeAdj = function()
	{
		if(me.constructor.name == "mainWorld" || me.constructor.name == "minorWorld")
			return LAT_TEMPS[me.uwp.size-1];
		return false;
	}

	me.equatorRow = function()
	{
		return (3*me.uwp.size-2)/2;
	}

	var SEASON_EFFECT_PER_ROW;
	me.getSeasonTable = function()
	{
		if(SEASON_EFFECT_PER_ROW)
			return SEASON_EFFECT_PER_ROW;
		var tropicRow;
		var numRows = me.uwp.size * 3 / 2;
		if(me.uwp.size % 2 == 1)
			tropicRow = Math.floor(me.axialTilt() / 90 * numRows);
		else
			tropicRow = Math.round(me.axialTilt() / 90 * numRows);
		SEASON_EFFECT_PER_ROW = [];
		for(var i=0;i<numRows;i++)
		{
			if(i < tropicRow-1)
				SEASON_EFFECT_PER_ROW[i] = 0;
			if(i == tropicRow-1)
				SEASON_EFFECT_PER_ROW[i] = 0.25;
			if(i == tropicRow)
				SEASON_EFFECT_PER_ROW[i] = 0.5;
			if(i == tropicRow+1)
				SEASON_EFFECT_PER_ROW[i] = 0.75;
			if(i > tropicRow+1)
				SEASON_EFFECT_PER_ROW[i] = 1;
		}
		return SEASON_EFFECT_PER_ROW;
	}

	var TEMP_TABLE;
	me.temperatureTbl = function()
	{
		TEMP_TABLE = [];
		var seasonTbl = me.getSeasonTable();
		var latitudeTbl = me.latitudeAdj();
		for(var i=0;i<seasonTbl.length;i++)
		{
			TEMP_TABLE[i] = {	row:i,
								avg:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i]) + "&deg;C",
								summer:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + seasonTbl[i]*me.seasonSummerPlus()) + "&deg;C",
								winter:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] - seasonTbl[i]*me.seasonWinterMinus()) + "&deg;C",
								avg_day:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + me.dayPlus()) + "&deg;C",
								avg_night:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + me.nightMinus()) + "&deg;C",
								summer_day:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + seasonTbl[i]*me.seasonSummerPlus() + me.dayPlus()) + "&deg;C",
								summer_night:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + seasonTbl[i]*me.seasonSummerPlus() + me.nightMinus()) + "&deg;C",
								winter_day:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] - seasonTbl[i]*me.seasonWinterMinus() + me.dayPlus()) + "&deg;C",
								winter_night:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] - seasonTbl[i]*me.seasonWinterMinus() + me.nightMinus()) + "&deg;C" };
		}
		return TEMP_TABLE;
	}

	me.boundTemp = function(temperature)
	{
		return Math.round(Math.min(me.maxDayPlus() + me.calcTemperatureC(), Math.max(temperature, me.calcTemperatureC() + me.maxNightMinus())));
	}

	me.temperatureTblHTML = function()
	{
		if(me.uwp.size == 0)
			return null;
		var tempTable = document.createElement("TABLE");
		tempTable.style.width = "100%";
		tempTable.style.textAlign = "center";
		var hdrRow = document.createElement("TR");
		var metaData, metaData2;
		if(me.tcs.has("Tz"))
		{
			metaData = [{title:"Night Side Temperature", contents:(me.calcTemperatureC() + me.maxNightMinus()) + "&deg;C"},
						{title:"Twilight Zone Temperature", contents:me.calcTemperatureC() + "&deg;C"},
						{title:"Day Side Temperature", contents:(me.maxDayPlus() + me.calcTemperatureC()) + "&deg;C"}];

		}
		else
		{
			metaData2 = [{title:"", colSpan:"1"},
						 {title:"Spring / Autumn", colSpan:"3"},
						 {title:"Summer", colSpan:"3"},
						 {title:"Winter", colSpan:"3"}];
			
			metaData = [{title:"Row",contents:"row"},
						{title:"Base",contents:"avg"},
						{title:"Day",contents:"avg_day"},
						{title:"Night",contents:"avg_night"},
						{title:"Base",contents:"summer"},
						{title:"Day",contents:"summer_day"},
						{title:"Night",contents:"summer_night"},
						{title:"Base",contents:"winter"},
						{title:"Day",contents:"winter_day"},
						{title:"Night",contents:"winter_night"}];
		}
		var tempData = me.temperatureTbl();
		if(tempData[0].row == 0)
			tempData.reverse();
		if(metaData2 !== undefined)
		{
			var hdrRow2 = document.createElement("TR");
			for(var i=0;i<metaData2.length;i++)
			{
				var hdrCell2 = document.createElement("TH");
				hdrCell2.innerHTML = metaData2[i].title;
				hdrCell2.colSpan = metaData2[i].colSpan;
				hdrRow2.appendChild(hdrCell2);
			}
			tempTable.appendChild(hdrRow2);			
		}
		for(var i=0;i<metaData.length;i++)
		{
			var hdrCell = document.createElement("TH");
			hdrCell.innerHTML = metaData[i].title;
			hdrRow.appendChild(hdrCell);
		}
		tempTable.appendChild(hdrRow);
		if(me.tcs.has("Tz"))
		{
			var dataRow = document.createElement("TR");
			for(i=0;i<metaData.length;i++)
			{
				var dataCell = document.createElement("TD");
				dataCell.innerHTML = metaData[i].contents;
				dataRow.appendChild(dataCell);
			}
			tempTable.appendChild(dataRow);
		}
		else
			for(i=0;i<tempData.length;i++)
			{
				var dataRow = document.createElement("TR");
				for(var j=0;j<metaData.length;j++)
				{
					var dataCell = document.createElement("TD");
					dataCell.innerHTML = tempData[i][metaData[j].contents];
					dataRow.appendChild(dataCell);
				}
				tempTable.appendChild(dataRow);
			}
		return tempTable;
	}
	
	var PORT_DETAILS;
	me.portDetails = function()
	{
		if(!PORT_DETAILS)
			PORT_DETAILS = new portDetails(me);
		return PORT_DETAILS;
	}
	
	me.populCount = function()
	{
		var theCount = me.popMulti*Math.pow(10,me.uwp.popul);
		var s = "" + theCount + " = " + me.popMulti + " &times; 10<sup>" + me.uwp.popul + "</sup>";
		return s;
	}
	
	me.govDigitExp = function()
	{
		return "This world has government type " + me.uwp.gov + " (" + GOV_DESCRIPTIONS[me.uwp.gov].title + "). " + GOV_DESCRIPTIONS[me.uwp.gov].desc;
	}
	
	var GOV_DETAIL;
	me.govDetail = function()
	{
		if(GOV_DETAIL)
			return GOV_DETAIL;
		GOV_DETAIL = new govDetail(me).textDetail;
		return GOV_DETAIL;
	}
	
	me.lawDetails = function()
	{
		return "The law level of " + me.uwp.law + " means that " + LAW_DESCRIPTIONS[me.uwp.law] + ".";
	}
	
	me.techDetails = function()
	{
		var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; });
		var s = "";
		s += "The overall Technology Level (TL) of this world is " + me.uwp.TL + ". ";
		s += "In the Traveller Universe, this is equivalent to approximately " + techDes.era + ". ";
		s += "The latest energy in use might include " + techDes.energy + ". ";
		s += "Society has evolved to include " + techDes.society + ". ";
		s += "Typical living environments include " + techDes.environ + ". ";
		s += "The lastest communication devices used by the citizenry are " + techDes.comms + ". ";
		s += "Transport has advanced to " + techDes.transport + ". ";
		s += "The latest thing in medicine is " + techDes.medicine + ". ";
		s += "Science is developing " + techDes.science + ", and the latest local technology includes " + techDes.tech + ". ";
		s += "The latest available computer is " + techDes.computers + ". ";
		s += "The fastest speed is done by " + techDes.speed1 + ", equivalent to Speed " + techDes.speed2.speed + " (" + techDes.speed2.kph + " kph). ";
		s += "Commonly used personal weapons include " + techDes.personalWpns + ". ";
		s += "Heavier military grade weapons at this technology level include " + techDes.hvyWpns + ". ";
		s += "Space travel is accomplished by " + techDes.spaceTravel + ". ";
		s += "The latest weapon in space is the " + techDes.weapons + ", and space defenses are " + techDes.defenses + ". ";
		s += "Space sensors used at this technology level are " + techDes.sensors1 + ", while world sensors used by starships now include " + techDes.sensors2 + ". ";
		return s;
	}

	function clearData(uwpProperty)
	{
		if(arguments.length < 1)
			uwpProperty = "all";
		switch(uwpProperty)
		{
			case "port":
				PORT_DETAILS = false;
				break;
			case "size":
				DENSITY_TYPE = false;
				WORLD_DENSITY = false;
				WORLD_DIAMETER = false;
				break;
			case "atmos":
				TEMP_TABLE = false;
				SEASON_EFFECT_PER_ROW = false;
				FLUID_DETAIL = false;
				GAS_MIX_DETAIL = false;
				ATMOS_COMPOSITION = false;
				ATMOS_PRESSURE_TABLE = false;
				ATMOS_PRESSURE = false;
				NIGHT_MINUS_TEMP = false;
				DAY_PLUS_TEMP = false;
				MAX_NIGHT_MINUS_TEMP = false;
				MAX_DAY_PLUS_TEMP = false;
				ROTATIONAL_PERIOD = false;
				ORBIT_ECCENTRICITY = false;
				SEASON_WINTER_MINUS = false;
				SEASON_SUMMER_PLUS = false;
				TEMP_TABLE = false;
				break;
			case "hydro":
				NATIVE_LIFE = false;
				VOLCANOES = false;
				STRESS_FACTOR = false;
				HYDRO_PERCENTAGE = false;
				break;
			case "popul":
				if(me.isMainWorld)
				{
					me.economicExt.update();
					me.culturalExt.generate();
				}
			case "all":
				PORT_DETAILS = false;
				TEMP_TABLE = false;
				SEASON_EFFECT_PER_ROW = false;
				RESOURCES = false;
				NATIVE_LIFE = false;
				VOLCANOES = false;
				STRESS_FACTOR = false;
				HYDRO_PERCENTAGE = false;
				FLUID_DETAIL = false;
				GAS_MIX_DETAIL = false;
				ATMOS_COMPOSITION = false;
				ATMOS_PRESSURE_TABLE = false;
				ATMOS_PRESSURE = false;
				NIGHT_MINUS_TEMP = false;
				DAY_PLUS_TEMP = false;
				MAX_NIGHT_MINUS_TEMP = false;
				MAX_DAY_PLUS_TEMP = false;
				ROTATIONAL_PERIOD = false;
				ORBIT_ECCENTRICITY = false;
				SEASON_WINTER_MINUS = false;
				SEASON_SUMMER_PLUS = false;
				AXIAL_TILT = false;
				DENSITY_TYPE = false;
				WORLD_DENSITY = false;
				WORLD_DIAMETER = false;
				break;
			default:
				break;
		}
	}
	
	me.forceRegen = function()
	{
		clearData();
	}

var all_details = 
[
	{ id:"world_name_edit", units:function() { return false; }, name:"World Name", contents:function() { return (me.name ? me.name : ("Unnamed " + me.generationObject.name)); }, validate:function(s) { return s != ""; }, text_string:function() { return me.name; }, update:function(v) { me.name = v; }, data_string:function() { return me.name; }  }, 
	{ id:"orbit_text", units:function() { return false }, name:"Orbit", contents:function() { return me.isSatellite ? me.orbit.baseOrbit.o : me.orbit.number(); }, text_string:function() { return me.isSatellite ? me.orbit.baseOrbit.o : me.orbit.number(); }, data_string:function() { return this.text_string(); }  },  
	{ id:"orbit_distance", units:function() { return (me.isSatellite ? "km" : "AU"); }, name:"Orbital Distance", contents:function() { return me.orbit.orbitDistance() + (me.isSatellite ? " km" : " AU"); }, text_string:function() { return me.orbit.orbitDistance() + (me.isSatellite ? " km" : " AU"); }, data_string:function() { return me.orbit.orbitDistance(); }  }, 
	{ id:"diameter_edit", units:function() { return "km"; }, name:"Diameter", contents:function() { return me.diameter(); }, validate:function(s) { return !isNaN(parseInt(s)) && parseInt(s) < 1.61*(me.uwp.size*1000 + 500) && parseInt(s) > 1.61*(me.uwp.size*1000 - 500); }, text_string:function() { return (me.diameter() + " km"); }, update:function(v) { WORLD_DIAMETER = v; }, data_string:function() { return me.diameter(); }  }, 
	{ id:"jump_point_edit", units:function() { return "km"; }, name:"Jump Point distance", contents:function() { return me.jumpPoint(); }, validate:function() { return true; }, text_string:function() { return (me.jumpPoint() + " km"); }, update:function() { me.jumpPoint(); }, data_string:function() { return me.jumpPoint(); }  }, 
	{ id:"jump_point_times", units:function() { return false; }, name:"Time to Jump Point at ...", contents:function() { return me.jumpPointTimes(); }, validate:function() { return true; }, text_string:function() { return me.jumpPointTimes(false); }, update:function() { me.jumpPointTimes(); }, data_string:function() { return this.text_string(); }  }, 
	{ id:"density_type", units:function() { return false; }, name:"Density Type", contents:function() { return me.densityType().name }, validate:function() { return [WORLD_DENSITY_HEAVY_CORE_TABLE.name, WORLD_DENSITY_MOLTEN_CORE_TABLE.name, WORLD_DENSITY_ROCKY_BODY_TABLE.name, WORLD_DENSITY_ICY_BODY_TABLE.name]; }, text_string:function() { return me.densityType().name }, update:function(v) { DENSITY_TYPE = WORLD_DENSITY_TYPES_ALL.find(function(x) { return x.name == v; }); }, data_string:function() { return this.text_string(); }  }, 
	{ id:"density_edit", units:function() { return "Earth"; }, name:"Density", contents:function() { return me.density(); }, validate:function(s) { return !isNaN(parseFloat(s)); }, text_string:function() { return (me.density() + " Earth"); }, update:function(v) { WORLD_DENSITY = v; }, data_string:function() { return me.density(); }  }, 
	{ id:"mass_text", units:function() { return "Earth"; }, name:"Mass", contents:function() { return me.mass(); }, validate:null, text_string:function() { return (me.mass() + " Earth"); }, data_string:function() { return me.mass(); }  }, 
	{ id:"gravity_text", units:function() { return "G"; }, name:"Surface Gravity (G)", contents:function() { return me.gravity(); }, validate:function(s) { return !isNaN(parseFloat(s)); }, text_string:function() { return me.gravity() + " G" }, data_string:function() { return me.gravity(); }  }, 
	{ id:"rotational_period_edit", units:function() { return "hours"; }, name:"Rotation Period", contents:function() { if(me.tcs.has("Tz") || me.tcs.has("Lk")) document.getElementById(this.id).readOnly = true; else document.getElementById(this.id).readOnly = false; return me.rotationalPeriod(); }, validate:function(s) { return !isNaN(parseFloat(s)); }, text_string:function() { return rotationPeriodString() }, update:function(v) { ROTATIONAL_PERIOD = v; NIGHT_MINUS_TEMP = false; DAY_PLUS_TEMP = false; SEASON_EFFECT_PER_ROW = false; TEMP_TABLE = false; }, data_string:function() { return me.rotationalPeriod(); } }, 
	{ id:"orbital_period_text", units:function() { return "years"; }, name:"Orbital Period", contents:function() { return orbitalPeriodString(); }, validate:function(s) { return !isNaN(parseFloat(s)); }, text_string:function() { return orbitalPeriodString(); }, data_string:function() { return me.orbitalPeriod(); } }, 
	{ id:"tilt_edit", units:function() { return "degrees"; }, name:"Axial Tilt", contents:function() { return me.axialTilt(); }, validate:function(s) { return !isNaN(parseInt(s)); }, text_string:function() { return (me.axialTilt() & "&deg;"); }, update:function(v) { AXIAL_TILT = v; SEASON_SUMMER_PLUS = false; SEASON_WINTER_MINUS = false; SEASON_EFFECT_PER_ROW = false; TEMP_TABLE = false; }, data_string:function() { return me.axialTilt(); }  }, 
	{ id:"atmos_pressure_edit", units:function() { return "Atmospheres"; }, name:"Surface Atmospheric Pressure", contents:function() { return me.atmosPressure() }, validate:function(s) { return !isNaN(parseFloat(s)); }, text_string:function() { return (me.atmosPressure() + "Atm"); }, update:function(v) { ATMOS_PRESSURE = v; }, data_string:function() { return me.atmosPressure(); }  }, 
	{ id:"atmos_compo_edit", units:function() { return false; }, name:"Atmosphere Composition", contents:function() { return me.atmosComposition(); }, validate:function(s) { return s != "" }, text_string:function() { return me.atmosComposition(); }, update:function(v) { ATMOS_COMPOSITION = v }, data_string:function() { return me.atmosComposition().replace(/,/g,""); }  }, 
	{ id:"albedo_edit", units:function() { return false; }, name:"Albedo", contents:function() { return me.albedo(); }, validate:function(s) { return !isNaN(parseInt(s)); }, text_string:function() { return me.albedo().toString(); }, update:function(v) { CALC_ALBEDO = v; SEASON_SUMMER_PLUS = false; SEASON_WINTER_MINUS = false; SEASON_EFFECT_PER_ROW = false; TEMP_TABLE = false; }, data_string:function() { return me.albedo(); }  }, 
	{ id:"greenhouse_edit", units:function() { return false; }, name:"Greenhouse", contents:function() { return me.greenhouse(); }, validate:function(s) { return !isNaN(parseInt(s)); }, text_string:function() { return me.greenhouse().toString(); }, update: function(v) { CALC_GREEN_HOUSE = v; SEASON_SUMMER_PLUS = false; SEASON_WINTER_MINUS = false; SEASON_EFFECT_PER_ROW = false; TEMP_TABLE = false; }, data_string:function() { return me.greenhouse(); }  }, 
	{ id:"base_world_temp_text", units:function() { return "degrees Celsius"; }, name:"Base Surface Temperature", contents:function() { return (me.calcTemperatureC() + "&deg;C"); }, validate:null, text_string:function() { return (Math.round(me.calcTemperatureC()) + "&deg;C"); }, update:function() { me.calcTemperatureC(); }, data_string:function() { return me.calcTemperatureC(); }  }, 
	{ id:"average_day_temp_text", units:function() { return "degrees Celsius"; }, name:"Base Daytime temperature", contents:function() { return (Math.round(me.calcTemperatureC() + me.dayPlus()) + "&deg;C"); }, text_string:function() { return (Math.round(me.calcTemperatureC() + me.dayPlus()) + "&deg;C"); }, data_string:function() { return Math.round(me.calcTemperatureC() + me.dayPlus()); } }, 
	{ id:"average_night_temp_text", units:function() { return "degrees Celsius"; }, name:"Base Nighttime temperature", contents:function() { return (Math.round(me.calcTemperatureC() + me.nightMinus())  + "&deg;C"); }, text_string:function() { return (Math.round(me.calcTemperatureC() + me.nightMinus()) + "&deg;C"); }, data_string:function() { return Math.round(me.calcTemperatureC() + me.nightMinus()); }  }, 
	{ id:"summer_increase_text", units:function() { return "degrees Celsius"; }, name:"Summer temperature increase", contents:function() { return (Math.round(me.seasonSummerPlus())  + "&deg;C"); }, validate:null, text_string:function() { return (Math.round(me.seasonSummerPlus()) + "&deg;C"); }, update:null, data_string:function() { return Math.round(me.seasonSummerPlus(false)); }  }, 
	{ id:"winter_decrease_text", units:function() { return "degrees Celsius"; }, name:"Winter temperature decrease", contents:function() { return (Math.round(me.seasonWinterMinus())  + "&deg;C"); }, validate:null, text_string:function() { return (Math.round(me.seasonWinterMinus()) + "&deg;C"); }, update:null, data_string:function() { return Math.round(me.seasonWinterMinus()); }  }, 
	{ id:"highest_day_temperature_text", units:function() { return "degrees Celsius"; }, name:"Upper Temperature Limit", contents:function() { return (Math.round(me.calcTemperatureC() + me.maxDayPlus())  + "&deg;C"); }, validate:null, text_string:function() { return (Math.round(me.calcTemperatureC() + me.maxDayPlus()) + "&deg;C"); }, update:null, data_string:function() { return Math.round(me.calcTemperatureC() + me.maxDayPlus()); }  }, 
	{ id:"coldest_night_temperature_text", units:function() { return "degrees Celsius"; }, name:"Lower Temperature Limit", contents:function() { return (Math.round(me.calcTemperatureC() + me.maxNightMinus())  + "&deg;C"); }, validate:null, text_string:function() { return (Math.round(me.calcTemperatureC() + me.maxNightMinus()) + "&deg;C"); }, update:null, data_string:function() { return Math.round(me.calcTemperatureC() + me.maxNightMinus()); }  }, 
	{ id:"hydro_perc_edit", units:function() { return "Percentage"; }, name:"Hydrographic Percentage", contents:function() { return (me.getHydroPercentage() + "%"); }, validate:function(s) { return !isNaN(parseInt(s)) }, text_string:function() { return (me.getHydroPercentage() + "%"); }, update:function(v) { HYDRO_PERCENTAGE = v; }, data_string:function() { return me.getHydroPercentage(); }  }, 
	{ id:"liq_comp_edit", units:function() { return false; }, name:"Surface Liquid Composition", contents:function() { return me.getFluid(); }, validate:function() { return true; }, text_string:function() { return me.getFluid(); }, update:function(v) { FLUID_DETAIL = v }, data_string:function() { return me.getFluid(); }  }, 
	{ id:"native_life_select", units:function() { return false; }, name:"Native Life", contents:function() { return (me.nativeLife() ? "Yes" : "No"); }, update:function(v) { v == ("Yes" ? NATIVE_LIFE = true : NATIVE_LIFE = false); }, text_string:function() { return (me.nativeLife() ? "Yes" : "No"); }, data_string:function() { return (me.nativeLife() ? "Yes" : "No"); }  }, 
	{ id:"native_int_life_text", units:function() { return false; }, name:"Native Intelligent Life", contents:function() { me.nativeIntLife.generate(); return me.nativeIntLife.toString() }, update:function() { me.nativeIntLife.generate(); }, text_string:function() { me.nativeIntLife.generate(); return me.nativeIntLife.toString(); }, data_string:function() { me.nativeIntLife.generate(); return me.nativeIntLife.toString(); }  }, 
	{ id:"seismic_edit", units:function() { return false; }, name:"Seismic Stress", contents:function() { return me.getStress(); }, validate:function(s) { return !isNaN(parseInt(s)); }, text_string:function() { return ("Stress factor is " + me.getStress() + "<br />Occurence of a volcanic eruption or earthquake in a 24-hour period:<br />Formidable (4D) < " + (me.getStress() - 4) + "<br /><b>Note:</b> DM -2 if on a Volcano hex, DM -2 if on a fault line."); }, update:function(v) { STRESS_FACTOR = v; }, data_string:function() { return me.getStress(); }  }, 
	{ id:"portClass", units:function() { return false; }, name:"Port Class", contents:function() { return me.uwp.port; }, text_string:function() { return me.uwp.port; }, data_string:function() { return me.uwp.port; }  }, 
	{ id:"portQuality", units:function() { return false; }, name:"Port Quality", contents:function() { return me.portDetails().quality + " " + me.portDetails().which; }, text_string:function() { return me.portDetails().quality + " " + me.portDetails().which; }, data_string:function() { return (me.portDetails().quality + " " + me.portDetails().which).replace(/,/g,""); }  }, 
	{ id:"portHigh", units:function() { return false; }, name:"High Port", contents:function() { return me.portDetails().highport ? "Yes" : "No"; }, text_string:function() { return me.portDetails().highport ? "Yes" : "No"; }, data_string:function() { return me.portDetails().highport ? "Yes" : "No"; }  }, 
	{ id:"portDown", units:function() { return false; }, name:"Down Port", contents:function() { return me.portDetails().downport == "beacon" ? "Beacon Only" : (me.portDetails().downport ? "Yes" : "No"); }, text_string:function() { return me.portDetails().downport == "beacon" ? "Beacon Only" : (me.portDetails().downport ? "Yes" : "No"); }, data_string:function() { return me.portDetails().downport == "beacon" ? "Beacon Only" : (me.portDetails().downport ? "Yes" : "No"); }  }, 
	{ id:"portShipyards", units:function() { return false; }, name:"Shipyard Capability", contents:function() { return me.portDetails().yard ? me.portDetails().yard : "No capability"; }, text_string:function() { return me.portDetails().yard ? me.portDetails().yard : "No capability"; }, data_string:function() { return me.portDetails().yard ? me.portDetails().yard : "No capability"; }  }, 
	{ id:"portRepairs", units:function() { return false; }, name:"Repairs Capability", contents:function() { return me.portDetails().repairs; }, text_string:function() { return me.portDetails().repairs; }, data_string:function() { return me.portDetails().repairs; }  }, 
	{ id:"port_fuelRefined", units:function() { return false; }, name:"Refined Fuel", contents:function() { return me.portDetails().refined ? "Yes" : "No"; }, text_string:function() { return me.portDetails().refined ? "Yes" : "No"; }, data_string:function() { return me.portDetails().refined ? "Yes" : "No"; }  }, 
	{ id:"port_fuelRaw", units:function() { return false; }, name:"Unrefined Fuel", contents:function() { return me.portDetails().raw ? "Yes" : "No"; }, text_string:function() { return me.portDetails().raw ? "Yes" : "No"; }, data_string:function() { return me.portDetails().raw ? "Yes" : "No"; }  }, 
	{ id:"port_fuelRadio", units:function() { return false; }, name:"Fissible Radioactives", contents:function() { return me.portDetails().radioact ? "Yes" : "No"; }, text_string:function() { return me.portDetails().radioact ? "Yes" : "No"; }, data_string:function() { return me.portDetails().radioact ? "Yes" : "No"; }  }, 
	{ id:"port_fuelAntiM", units:function() { return false; }, name:"Anti-Matter Slugs", contents:function() { return me.portDetails().antimatter ? "Yes" : "No"; }, text_string:function() { return me.portDetails().antimatter ? "Yes" : "No"; }, data_string:function() { return me.portDetails().antimatter ? "Yes" : "No"; }  }, 
	{ id:"port_fuelColl", units:function() { return false; }, name:"Replacement Collectors", contents:function() { return me.portDetails().collector ? "Yes" : "No"; }, text_string:function() { return me.portDetails().collector ? "Yes" : "No"; }, data_string:function() { return me.portDetails().collector ? "Yes" : "No"; }  }, 
	{ id:"sizeUWPexp", units:function() { return false; }, name:"Size UWP Digit Explanation", contents:function() { return SIZE_DESCRIPTIONS[me.uwp.size]; },  text_string:function() { return SIZE_DESCRIPTIONS[me.uwp.size]; }, data_string:function() { return SIZE_DESCRIPTIONS[me.uwp.size].replace(/,/g,""); }  }, 
	{ id:"atmosUWPExpl", units:function() { return false; }, name:"Atmosphere UWP Digit Explanation", contents:function() { return ("The atmosphere is " + ATMOS_DESCRIPTIONS[me.uwp.atmos]); }, text_string:function() { return ("The atmosphere is " + ATMOS_DESCRIPTIONS[me.uwp.atmos]); }, data_string:function() { return ("The atmosphere is " + ATMOS_DESCRIPTIONS[me.uwp.atmos].replace(/,/g,"")); }  }, 
	{ id:"populDigExp", units:function() { return false; }, name:"Population Digit Explanation", contents:function() { return (me.uwp.popul + " - population is in the order of 10<sup>" + me.uwp.popul + "</sup>."); }, text_string:function() { return (me.uwp.popul + " - population is in the order of 10<sup>" + me.uwp.popul + "</sup>."); }, data_string:function() { return (me.uwp.popul + " - population is in the order of 10<sup>" + me.uwp.popul + "</sup>."); }  }, 
	{ id:"popMultiExp", units:function() { return false; }, name:"Population Multipler", contents:function() { return me.popMulti; }, text_string:function() { return me.popMulti; }, data_string:function() { return me.popMulti; } }, 
	{ id:"populCalc", units:function() { return false; }, name:"Total Population Calculation", contents:function() { return me.populCount(); },  text_string:function() { return me.populCount(); }, data_string:function() { return me.populCount(); } },
	{ id:"govDigExp", units:function() { return false; }, name:"World Government Type", contents:function() { return me.govDigitExp(); }, text_string:function() { return me.govDigitExp(); }, data_string:function() { return me.govDigitExp().replace(/,/g,""); } },
	{ id:"govDetailExp", units:function() { return false; }, name:"World Government Detail", contents:function() { return me.govDetail(); }, text_string:function() { return me.govDetail(); }, data_string:function() { return me.govDetail().replace(/,/g,""); } },
	{ id:"lawDigit", units:function() { return false;}, name:"Law Level Digit", contents:function(){ return me.uwp.law; }, text_string:function(){ return me.uwp.law; }, data_string:function(){ return me.uwp.law; }},
	{ id:"lawExplanation", units:function() { return false;}, name:"Law Level explanation", contents:function() { return me.lawDetails(); }, text_string:function() { return me.lawDetails(); }, data_string:function() { return me.lawDetails(); }},
	{ id:"techDigit", units:function() { return false;}, name:"Technology Level Digit", contents:function() { return me.uwp.TL; }, text_string:function() { return me.uwp.TL; }, data_string:function() { return me.uwp.TL; }},
	{ id:"tecHist", units:function() { return false;}, name:"Earth Historical Era", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.era; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.era; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.era; } }, 
	{ id:"tecEnergy", units:function() { return false;}, name:"Energy", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.energy; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.energy; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.energy; } }, 
	{ id:"tecSoc", units:function() { return false;}, name:"Society", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.society; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.society; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.society; } }, 
	{ id:"tecEnv", units:function() { return false;}, name:"Environment", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.environ; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.environ; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.environ; } }, 
	{ id:"tecComm", units:function() { return false;}, name:"Communications", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.comms; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.comms; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.comms; } }, 
	{ id:"tecTra", units:function() { return false;}, name:"Transport", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.transport; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.transport; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.transport; } }, 
	{ id:"tecMed", units:function() { return false;}, name:"Medicine", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.medicine; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.medicine; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.medicine; } }, 
	{ id:"tecSci", units:function() { return false;}, name:"Latest Science", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.science; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.science; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.science; } }, 
	{ id:"tecTech", units:function() { return false;}, name:"Latest Technology", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.tech; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.tech; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.tech; } }, 
	{ id:"tecCmp", units:function() { return false;}, name:"Computers", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.computers; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.computers; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.computers; } }, 
	{ id:"tecSpeed", units:function() { return false;}, name:"Travel Speeds", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return "Fastest speed is by " + techDes.speed1 + ", (speed " + techDes.speed2.speed + " or " + techDes.speed2.kph + " kph). "; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return "Fastest speed is by " + techDes.speed1 + ", (speed " + techDes.speed2.speed + " or " + techDes.speed2.kph + " kph). "; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return "Fastest speed is by " + techDes.speed1 + ", (speed " + techDes.speed2.speed + " or " + techDes.speed2.kph + " kph). "; } }, 
	{ id:"tecWpn", units:function() { return false;}, name:"Personal Weapons", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.personalWpns; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.personalWpns; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.personalWpns; } }, 
	{ id:"tecHWpn", units:function() { return false;}, name:"Heavy Weapons", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.hvyWpns; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.hvyWpns; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.hvyWpns; } }, 
	{ id:"tecSpac", units:function() { return false;}, name:"Space Travel", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.spaceTravel; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.spaceTravel; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.spaceTravel; } }, 
	{ id:"tecSpacWpn", units:function() { return false;}, name:"Space Weapons", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.weapons; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.weapons; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.weapons; } }, 
	{ id:"tecSpacDef", units:function() { return false;}, name:"Space Defences", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.defenses; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.defenses; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.defenses; } }, 
	{ id:"tecSpacSen", units:function() { return false;}, name:"Space Sensors", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.sensors1; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.sensors1; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.sensors1; } }, 
	{ id:"tecWorldSen", units:function() { return false;}, name:"World Sensors", contents:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.sensors2; }, text_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.sensors2; }, data_string:function() { var techDes = TECH_DESCRIPTORS.find(function(v) { return v.TL == me.uwp.TL; }); return techDes.sensors2; } }
 ];

 
	me.all_details = all_details;
	ALL_DETAILS = all_details;

	var cX_details = [
		{id:"cX_H", adj_id:"cX_H_adj", name:"Heterogeneity",contents:function() { return me.culturalExt.homogeneity; }, text_string:function() { return HOMOGENEITY_DESCRIPTIONS[me.culturalExt.homogeneity].tm; }, data_string:function() { return pseudoHex(me.culturalExt.homogeneity); }, update:function(v) { me.culturalExt.homogeneity = parseInt(v); } },
		{id:"cX_A", adj_id:"cX_A_adj", name:"Acceptance",contents:function() { return me.culturalExt.acceptance; }, text_string:function() { return ACCEPTANCE_DESCRIPTIONS[me.culturalExt.acceptance].tm; }, data_string:function() { return pseudoHex(me.culturalExt.acceptance); }, update:function(v) { me.culturalExt.acceptance = parseInt(v); } },
		{id:"cX_St", adj_id:"cX_St_adj", name:"Strangeness",contents:function() { return me.culturalExt.strangeness; }, text_string:function() { return STRANGENESS_DESCRIPTIONS[me.culturalExt.strangeness].tm; }, data_string:function() { return pseudoHex(me.culturalExt.strangeness); }, update:function(v) { me.culturalExt.strangeness = parseInt(v); } },
		{id:"cX_Sy", adj_id:"cX_Sy_adj", name:"Symbols",contents:function() { return me.culturalExt.symbols; }, text_string:function() { return ""; }, data_string:function() { return pseudoHex(me.culturalExt.symbols); }, update:function(v) { me.culturalExt.symbols = parseInt(v); } }
	];

	var eX_details = [
		{id:"eX_R", name:"Resources",contents:function() { return me.economicExt.resources; }, data_string:function(){ return pseudoHex(me.economicExt.resources); }, update:function(v) { me.economicExt.resources = parseInt(v); } },
		{id:"eX_L", name:"Labor",contents:function() { return me.economicExt.labour; }, data_string:function() { return pseudoHex(me.economicExt.labour); }, update:function(v) { me.economicExt.labour = parseInt(v); } },
		{id:"eX_I", name:"Infrastructure",contents:function() { return me.economicExt.infrastructure; }, data_string:function() { return pseudoHex(me.economicExt.infrastructure); }, update:function(v) { me.economicExt.infrastructure = parseInt(v); } },
		{id:"eX_E", name:"Efficiency",contents:function() { return me.economicExt.efficiency; }, data_string:function() { return me.economicExt.efficiency > -1 ? "+" + me.economicExt.efficiency : me.economicExt.efficiency; }, update:function(v) { me.economicExt.efficiency = parseInt(v); } }
	];

	me.dbObj = function()
	{
		var o = {};
		o.name = me.name;
		o.uwp = me.uwp.dbObj();
		o.tcs = me.tcs.dbObj();
		o.isMainWorld = me.isMainWorld;
		o.generationObject = me.generationObject.name;
		o.nil = me.nativeIntLife.dbObj();
		o.diameter = me.diameter();
		o.densityType = me.densityType().name;
		o.density = me.density();
		o.rotationalPeriod = me.rotationalPeriod();
		o.axialTilt = me.axialTilt();
		o.atmosComposition = me.atmosComposition();
		o.atmosPressure = me.atmosPressure();
		o.atmosPressureTbl = me.atmosPressureTable().name;
		o.albedo = me.albedo();
		o.greenhouse = me.greenhouse();
		o.hydroPercentage = me.getHydroPercentage();
		o.surfaceLiquid = me.getFluid();
		o.nativeLife = me.nativeLife();
		o.stressFactor = me.getStress();
		o.seed = me.seed;
		o.populLimit = me.populLimit;
		o.isSatellite = me.isSatellite;
		o.zone = me.zone;
		o.system = me.system;
		o.sector = me.sector;
		o.hex = me.hex;
		if(me.satelliteSystem)
			o.satelliteSystem = me.satelliteSystem.dbObj();
		o.resources = me.resources().dbObj();
		if(me.beltDetails)
			o.beltDetails = me.beltDetails.dbObj();
		else
			o.mapData = (me.map && me.map.saveObj.length > 0) ? me.map.genSaveObj() : null;
		return o;
	}

	me.read_dbObj = function(o)
	{
		me.name = o.name;
		me.isMainWorld = o.isMainWorld;
		me.seed = parseInt(o.seed);
		me.generationObject = ALL_GENERATION_OBJECTS.find(function(v) { return v.name == o.generationObject });
		me.populLimit = o.populLimit;
		WORLD_DIAMETER = o.diameter;
		DENSITY_TYPE = WORLD_DENSITY_TYPES_ALL.find(function(x) { return x.name == o.densityType; });
		WORLD_DENSITY = o.density;
		ROTATIONAL_PERIOD = o.rotationalPeriod;
		AXIAL_TILT = o.axialTilt;
		ATMOS_PRESSURE = o.atmosPressure;
		ATMOS_COMPOSITION = o.atmosComposition;
		ATMOS_PRESSURE_TABLE = ATM_PRESSURE_TABLE.find(function(tbl) { return tbl.name == o.atmosPressureTbl; });
		CALC_ALBEDO = o.albedo;
		CALC_GREEN_HOUSE = o.greenhouse;
		HYDRO_PERCENTAGE = o.hydroPercentage;
		FLUID_DETAIL = o.surfaceLiquid;
		NATIVE_LIFE = o.nativeLife;
		STRESS_FACTOR = o.stressFactor
		RESOURCES = new worldResources(me);
		RESOURCES.read_dbObj(o.resources);
		me.uwp = new uwp(me);
		me.uwp.read_dbObj(o.uwp);
		me.tcs = new tcs(me);
		me.tcs.read_dbObj(o.tcs);
		me.nativeIntLife = new nil(me);
		me.nativeIntLife.read_dbObj(o.nil);
		me.isSatellite = o.isSatellite;
		me.zone = o.zone;
		me.system = o.system;
		me.sector = o.sector;
		me.hex = o.hex;
		if(o.satelliteSystem)
		{
			me.satelliteSystem = new satelliteOrbitSet(me); // (planet, systemObj)
			me.satelliteSystem.read_dbObj(o.satelliteSystem);
		}
		if(o.mapData)
			me.mapData = o.mapData;
		if(o.beltDetails)
		{
			me.beltDetails = new beltDetails(me, false);
			me.beltDetails.read_dbObj(o.beltDetails);
		}

	}
}

function worldResources(world)
{
	var me = this;
	me.world = world;
	me.resourceList = [];

	me.generate = function()
	{
		for(var i=0;i<RESOURCES_ALL.length;i++)
			if(RESOURCES_ALL[i].rules(world))
				me.resourceList.push(RESOURCES_ALL[i]);
		return me.resourceList;
	}

	me.add = function(resource)
	{
		if(me.resourceList.find(function(v) { return v.name == resource.name }) === undefined)
			me.resourceList.push(resource);
	}

	me.erase = function(resource)
	{
		var i = me.resourceList.findIndex(function(v) { return v.name == resource.name });
		if(i !== undefined)
			me.resourceList.splice(i,1);
	}

	me.has = function(resourceID)
	{
		return me.resourceList.find(function(v) { return v.id == resourceID }) !== undefined;
	}

	me.toString = function()
	{
		var s = "The world has ";
		var r = me.resourceList;
		if(r.length == 0) return "None.";
		for(var i=0;i<r.length-1;i++)
			s += r[i].name + " (for example " + r[i].examples + "); ";
		s += "and " + r[i].name + " (for example " + r[i].examples + ").";
		return s;
	}

	me.dbObj = function()
	{
		var o = [];
		me.resourceList.map(function(item, index) { o[index] = item.id; });
		return o;
	}

	me.read_dbObj = function(o)
	{
		o.map(function(resourceID)
		{
			me.resourceList.push(RESOURCES_ALL.find(function(v) { return v.id == resourceID; }));
		});
	}
}

function mainWorld(generationObject)
{
	var me = this;
	me.inheritFrom = world;
	me.inheritFrom();
	me.isMainWorld = true;
	me.generationObject = arguments.length > 0 ? generationObject : habitableZoneUWP;
	me.uwp = new uwp(me);
	me.tcs = new tcs(me);
	me.bases = new bases(me);
	me.populLimit = 15;
	me.travelZone = ""; // "A" = Amber Zone, "R" = Red Zone, "B" = Balkanized (TNE), F/U = Forbidden / Unabsorbed (Zhodani)
	me.popMulti = 0;
	me.belts = 0;
	me.gas_giants = 0;
	me.economicExt = new eX(me);
	me.culturalExt = new cX(me);
	me.importance = new iX(me);
	me.noblesExt = new nobles(me);
	me.worlds = 0;
	me.allegiance = "Im";
	me.stars = new starSystem(me);
	me.starString = "";
	me.dataObj = {};
	me.processData = true;
	
	me.symbolName = function()
	{
		return me.isBelt() ? "sys_symbol_belt" : "sys_symbol_main_world";
	}
	
	me.backupName = function()
	{
		return "The Main World";
	}	

	me.buildGet = function()
	{
		var newURL = "?" + encodeURIComponent("hex") + "=" + encodeURIComponent(me.hex);
		newURL += "&" + encodeURIComponent("sector") + "=" + encodeURIComponent(me.sector);
		newURL += "&" + encodeURIComponent("name") + "=" + encodeURIComponent(me.name);
		newURL += "&" + encodeURIComponent("system") + "=" + encodeURIComponent(me.name + " (" + me.hex + " " + me.sector + ")");
		newURL += "&" + encodeURIComponent("uwp") + "=" + encodeURIComponent(me.uwp);
		newURL += me.tcs.toURI();
		newURL += "&" + encodeURIComponent("bases") + "=" + encodeURIComponent(me.bases);
		newURL += "&" + encodeURIComponent("travelZone") + "=" + encodeURIComponent(me.travelZone);
		newURL += "&" + encodeURIComponent("popMulti") + "=" + encodeURIComponent(me.popMulti);
		newURL += "&" + encodeURIComponent("belts") + "=" + encodeURIComponent(me.belts);
		newURL += "&" + encodeURIComponent("gas_giants") + "=" + encodeURIComponent(me.gas_giants);
		newURL += "&" + encodeURIComponent("eX") + "=" + encodeURIComponent(me.economicExt);
		newURL += "&" + encodeURIComponent("cX") + "=" + encodeURIComponent(me.culturalExt);
		newURL += "&" + encodeURIComponent("iX") + "=" + encodeURIComponent(me.importance.value);
		newURL += "&" + encodeURIComponent("nobz") + "=" + encodeURIComponent(me.noblesExt);
		newURL += "&" + encodeURIComponent("worlds") + "=" + encodeURIComponent(me.worlds);
		newURL += "&" + encodeURIComponent("allegiance") + "=" + encodeURIComponent(me.allegiance);
		newURL += "&" + encodeURIComponent("stellar") + "=" + encodeURIComponent(me.stars);
		newURL += "&" + encodeURIComponent("seed") + "=" + encodeURIComponent(me.seed);
		newURL += "&" + encodeURIComponent("genMissData") + "=" + encodeURIComponent(0);
		return newURL;
	}

	me.generate = function(uwpCreateYes)
	{
		if(arguments.length < 1)
			uwpCreateYes = true;
		if(uwpCreateYes)
			me.uwp.createUWP();
		me.tcs.generate();
		if(me.uwp.size == 0)
			me.generationObject = planetoidsUWP;
		me.popMulti = me.uwp.popul == 0 ? 0 : rng(9);
		me.belts = Math.max(0, dice(1)-3);
		me.gas_giants = Math.max(0, Math.floor(dice(2)/2-2));
		me.bases.generate();
		me.economicExt.generate();
		me.culturalExt.generate();
		me.noblesExt.generate();
		me.nativeLife();
		me.nativeIntLife.generate();
		me.worlds = dice(2);
		me.stars.generate();
		me.system = "The " + me.name + " System (" + me.hex + " " + me.sector + ")";
	}

	me.toString = function()
	{
		var s = pad(me.hex,5);
		s += pad(me.name,21);
		s += me.uwp + " ";
		s += pad(me.tcs,41);
		s += pad(me.importance,7);
		s += me.economicExt + " ";
		s += me.culturalExt + " ";
		s += pad(me.noblesExt,6);
		s += pad(me.bases,3);
		s += me.travelZone + " ";
		s += me.popMulti + "" + me.belts + "" + me.gas_giants + " ";
		s += pad(me.worlds,3);
		s += pad(me.allegiance,5);
		s += me.stars;
		return s;
	}
	
	me.toCSV = function()
	{
		var s = "";
		s += me.hex + ",";
		s += me.name + ",";
		s += me.uwp + ",";
		s += me.tcs + ",";
		s += me.importance + ",";
		s += me.economicExt + ",";
		s += me.culturalExt + ",";
		s += me.noblesExt + ",";
		s += me.bases + ",";
		s += me.travelZone + ",";
		s += me.popMulti + "" + me.belts + "" + me.gas_giants + ",";
		s += me.worlds + ",";
		s += me.allegiance + ",";
		s += me.stars;
		return s;
	}

	me.toTR = function()
	{
		var w_tr = document.createElement("TR");
		me.iX_string_static = me.importance;
		me.pbg = me.popMulti + "" + me.belts + "" + me.gas_giants;
		var props = ["hex","name","uwp","tcs","iX_string_static","economicExt","culturalExt","noblesExt","bases","travelZone","pbg","worlds","allegiance","stars"];
		props.map(function(p) {
			var wd_td = document.createElement("TD");
			var wd_txt = document.createTextNode(me[p]);
			wd_td.appendChild(wd_txt);
			w_tr.appendChild(wd_td);
		});
		return w_tr;
	}
	
	me.saveDataObj = function()
	{
		var dataObj = {};
		dataObj.ss = me.subSector;
		dataObj.hex = me.hex;
		dataObj.name = me.name;
		dataObj.uwp = me.uwp.toString();
		dataObj.bases = me.bases.toString();
		dataObj.remarks = me.tcs.toString();
		dataObj.zone = me.travelZone;
		dataObj.pbg = "" + me.popMulti + me.belts + me.gas_giants;
		dataObj.allegiance = me.allegiance;
		dataObj.stars = me.stars.toString();
		dataObj.ex = me.economicExt.toString();
		dataObj.cx = me.culturalExt.toString();
		dataObj.nobility = me.noblesExt.toString();
		dataObj.w = me.worlds;
		dataObj.sector = me.sector;
		return dataObj;
	}

	me.readDataObj = function(dataObj)
	{
		me.dataObj = dataObj;
		me.subSector = me.dataObj.ss;
		me.sector = me.dataObj.sector;
		me.hex = me.dataObj.hex;
		me.name = me.dataObj.name;
	}

	me.processDataObj = function()
	{
		me.hex = me.dataObj.hex;
		me.sector = me.dataObj.sector;
		me.subSector = me.dataObj.ss;
		me.name = me.dataObj.name;
		me.seed = me.dataObj.seed;
		me.system = me.dataObj.system ? me.dataObj.system : "The " + me.name + " system (" + me.hex + " " + me.sector + ")";
		me.uwp = new uwp(null,me);
		if(me.dataObj.uwp)
			me.uwp.readUWP(me.dataObj.uwp);
		else
			me.uwp.generate();
		if(me.uwp.size == 0)
			me.generationObject = planetoidsUWP;
		me.bases = new bases(me);
		if(me.dataObj.bases !== null)
			me.bases.readString(me.dataObj.bases);
		me.tcs = new tcs(me);
		if(me.dataObj.remarks)
			me.tcs.readString(me.dataObj.remarks);
		else
			me.tcs.generate();
		// 'Pl' does NOT need to be included in the displayed TCS values, so record it in separate field
                if(me.dataObj.remarks && me.dataObj.remarks.indexOf('Pl') >= 0)
                        me.forcedPlanet = true;
                if(me.dataObj.icN)
                        me.icecapN = me.dataObj.icN;
                if(me.dataObj.icS)
                        me.icecapS = me.dataObj.icS;
                if(me.dataObj.tzD)
                        me.twilightDay = me.dataObj.tzD*1;
                if(me.dataObj.tzN)
                        me.twilightNight = me.dataObj.tzN*1;
                // don't allow combined twilight zones to go over 180 degrees
                var twilightTotal = me.twilightDay + me.twilightNight;
                if(twilightTotal > 180)
                {
                        me.twilightDay = Math.round(me.twilightDay * 180 / twilightTotal);
                        me.twilightNight = Math.round(me.twilightNight * 180 / twilightTotal);
                        // if new total != 180 because of rounding, force it to 180
                        me.twilightDay -= (me.twilightDay+me.twilightNight > 180);
                        me.twilightNight += (me.twilightDay+me.twilightNight < 180);
                }
		me.travelZone = me.dataObj.zone;
		if(me.dataObj.pbg)
		{
			me.popMulti = parseInt(me.dataObj.pbg.substr(0,1));
			me.belts = parseInt(me.dataObj.pbg.substr(1,1));
			me.gas_giants = parseInt(me.dataObj.pbg.substr(2,1));
		}
		else
		{
			me.popMulti = parseInt(me.dataObj.popMulti);
			me.belts = parseInt(me.dataObj.belts);
			me.gas_giants = parseInt(me.dataObj.gas_giants);
		}
		if(isNaN(me.popMulti))
			me.popMulti = me.uwp.popul == 0 ? 0 : rng(9);
		if(isNaN(me.belts))
			me.belts = Math.max(0, dice(1)-3);
		if(isNaN(me.gas_giants))
			me.gas_giants = Math.max(0, Math.floor(dice(2)/2-2));
		me.allegiance = me.dataObj.allegiance;
		if(me.allegiance === null)
			me.allegiance = "";
		if(me.dataObj.stars)
			me.stars.readString(me.dataObj.stars);
		else
			me.stars.generate();
		me.economicExt = new eX(me);
		if(me.dataObj.ex)
			me.economicExt.readString(me.dataObj.ex);
		else
			me.economicExt.generate();
		me.culturalExt = new cX(me);
		if(me.dataObj.cx)
			me.culturalExt.readString(me.dataObj.cx);
		else
			me.culturalExt.generate();
		me.importance = new iX(me);
		if(me.dataObj.ix)
			me.importance.readDigit(me.dataObj.ix);
		else
			me.importance.generate();
		me.noblesExt = new nobles(me);
		if(me.dataObj.nobility !== null)
			me.noblesExt.readString(me.dataObj.nobility);
		else
			me.noblesExt.generate();
		me.worlds = parseInt(me.dataObj.w);
		if(isNaN(me.worlds))
			me.worlds = dice(2);
		else
			me.worlds = Math.min(12,me.worlds);
		me.nativeIntLife.generate();
	}

	var inherited_dbObj = me.dbObj;
	me.dbObj = function()
	{
		var o = inherited_dbObj();
		o.type = "mainWorld";
		o.travelZone = me.travelZone;
		o.popMulti = me.popMulti;
		o.belts = me.belts;
		o.gas_giants = me.gas_giants;
		o.worlds = me.worlds;
		o.allegiance = me.allegiance;
		o.economicExt = me.economicExt.dbObj();
		o.culturalExt = me.culturalExt.dbObj();
		o.noblesExt = me.noblesExt.toString();
		o.stars = me.stars.dbObj();
		o.bases = me.bases.toString();
		o.seed = me.seed;
		return o;
	}

	var inherited_read_dbObj = me.read_dbObj;
	me.read_dbObj = function(o)
	{
		inherited_read_dbObj(o);
		me.travelZone = o.travelZone;
		me.popMulti = o.popMulti;
		me.belts = o.belts;
		me.gas_giants = o.gas_giants;
		me.worlds = o.worlds;
		me.allegiance = o.allegiance;
		me.seed = parseInt(o.seed);
		me.economicExt = new eX(me);
		me.economicExt.read_dbObj(o.economicExt);
		me.culturalExt = new cX(me);
		me.culturalExt.read_dbObj(o.culturalExt);
		me.noblesExt = new nobles(me);
		me.noblesExt.readString(o.noblesExt);
		me.stars = new starSystem(me);
		me.stars.read_dbObj(o.stars);
		me.bases = new bases(me);
		me.bases.readString(o.bases);
		me.nativeIntLife.generate();
	}
}

function minorWorld(genObject, mainWorld, planet)
{
	var me = this;
	me.inheritFrom = world;
	me.inheritFrom();
	me.mainWorld = mainWorld;
	me.generationObject = genObject;
	me.uwp = new uwp(me);
	me.tcs = new tcs(me);
	me.isSatellite = arguments.length > 2;
	me.planet = me.isSatellite ? planet : null;
	me.zone = me.isSatellite ? planet.zone : ""; // I = inner (closer than HZ-1), H = habitable (HZ-1 to HZ+1), O = outer (further than HZ+1)
	me.satelliteOrbit = 0;
	me.hz_rel = me.isSatellite ? planet.hz_rel : 0;
	me.satelliteMaxSize = me.isSatellite ? (planet.uwp ? planet.uwp.size : planet.size) : 20;
	me.satelliteSystem = null;
	me.has_MW_as_sat = false;
	me.orbit = null;
	me.economicExt = new eX(me);
	if(me.mainWorld)
	{
		me.system = mainWorld.name;
		me.hex = mainWorld.hex;
		me.sector = mainWorld.sector;
		me.populLimit = Math.max(0,me.mainWorld.uwp.popul-1);
		me.seed = me.mainWorld.seed;
	}
	
	me.symbolName = function()
	{ 
		return me.generationObject.name == "Planetoids" ? "sys_symbol_belt" : "sys_symbol_minor_world";
	}
	
	me.backupName = function()
	{
		return me.generationObject.name;
	}

	me.generate = function()
	{
		me.uwp.createUWP();
		me.popMulti = rng(9);
		if(uPObj.prefs.barren_sys && me.populLimit == 0 && me.mainWorld.uwp.popul == 0)
		{
			me.uwp.popul = 0;
			me.uwp.gov = 0;
			me.uwp.law = 0;
			me.uwp.TL = 0;
			me.popMulti = 0;
		}
		me.tcs.generate();
		me.nativeLife();
		me.nativeIntLife.generate();
		me.economicExt.generate();
		if(me.generationObject.name == "Planetoids")
			me.beltDetails = new beltDetails(me);
	}

	me.buildGet = function()
	{
		var newURL = "?" + encodeURIComponent("hex") + "=" + encodeURIComponent(me.mainWorld.hex);
		newURL += "&" + encodeURIComponent("sector") + "=" + encodeURIComponent(me.mainWorld.sector);
		newURL += "&" + encodeURIComponent("name") + "=" + encodeURIComponent(me.name);
		newURL += "&" + encodeURIComponent("system") + "=" + encodeURIComponent(me.mainWorld.name + " (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")");
		newURL += "&" + encodeURIComponent("uwp") + "=" + encodeURIComponent(me.uwp);
		newURL += me.tcs.toURI();
		newURL += "&" + encodeURIComponent("seed") + "=" + encodeURIComponent(me.seed);
		return newURL;
	}

	me.buildQuery = function()
	{
		var newURL, url = window.location.href;
		var queryEnd = Math.min(url.indexOf("#"),url.indexOf("?"));
		if(queryEnd != -1)
			newURL = url.substring(0,queryEnd);
		else
			newURL = url;
		newURL += me.buildGet();
		return newURL;
	}

	var inherited_dbObj = me.dbObj;
	me.dbObj = function()
	{
		var o = inherited_dbObj();
		o.type = "minorWorld";
		return o;
	}
}

function beltDetails(worldObj, generateNow)
{
	if(arguments.length < 2)
		generateNow = true;
	var me = this;
	me.world = worldObj;
	me.beltZones = {n:0, m:0, c:0};
	me.predomSize = "";
	me.maxDiam = "";
	me.orbitWidth = 0;
	
	me.generate = function()
	{
		me.predomSize = new dice_table(BELT_DETAILS_PBD).roll();
		me.maxDiam = new dice_table(BELT_DETAILS_MAX_DIAM).roll();
		var predomZoneTbl = new dice_table(BELT_DETAILS_PRE_ZONE, null, me.world).roll();
		var temp_beltZones = new dice_table(predomZoneTbl).roll();
		var temp_n = Math.max(0, temp_beltZones.n + flux());
		var temp_m = temp_beltZones.m + flux();
		var temp_c = 100 - temp_n - temp_m;
		me.beltZones = {n:temp_n, m:temp_m, c:temp_c};
		me.orbitWidth = new dice_table(BELT_DETAILS_ORBIT_WIDTH, null, me.world).roll();
	}
	
	me.toString = function()
	{
		var s = "";
		s += "Predominant size (approx. 30% of planetoids): " + me.predomSize;
		if(!me.maxDiam == "as rolled")
			s += ", Maximum size (approx 1% of planetoids): " + me.maxDiam;
		s += ", Nickel Zone (inner): " + me.beltZones.n + "%";
		s += ", Mixed Zone (middle): " + me.beltZones.m + "%";
		s += ", Carbonaceous Zone (outer): " + me.beltZones.c + "%";
		s += ", Belt width: " + me.orbitWidth + " AU.";
		return s;
	}
	
	me.update = function()
	{
		me.predomSize = document.getElementById("beltPredomSize").value;
		me.maxDiam = document.getElementById("beltMaxSize").value;
		me.orbitWidth = parseFloat(document.getElementById("beltWidth").value);
		me.beltZones.n = parseInt(document.getElementById("belt_nZone").value);
		me.beltZones.m = parseInt(document.getElementById("belt_mZone").value);
		me.beltZones.c = parseInt(document.getElementById("belt_cZone").value);
		
		if((me.beltZones.n + me.beltZones.m + me.beltZones.c) !== 100)
			me.beltZones.m = 100 - me.beltZones.n - me.beltZones.c;	

		me.world.updateEdits();
	}
	
	me.dbObj = function()
	{
		var o = {};
		o.predomSize = me.predomSize;
		o.maxDiam = me.maxDiam;
		o.orbitWidth = me.orbitWidth;
		o.beltZones = me.beltZones;
		return o;
	}
	
	me.read_dbObj = function(o)
	{
		for(var p in o)
			me[p] = o[p];
	}
	
		
	if(generateNow)
		me.generate();
}

function gasGiant(mainWorld)
{
	var me = this;
	me.isMainWorld = false;
	me.inheritFrom = world;
	me.inheritFrom();
	me.mainWorld = mainWorld;
	me.size = dice(2)+19;
	me.type = me.size < 23 ? "SGG" : "LGG";
	me.uwp = "Size: " + pseudoHex(me.size);
	me.iceGiant = false;
	me.zone = ""; // I = inner (closer than HZ-1), H = habitable (HZ-1 to HZ+1), O = outer (further than HZ+1)
	me.satelliteSystem = null;
	
	me.symbolName = function()
	{
		return "sys_symbol_" + me.type;
	}
	
	me.backupName = function()
	{
		return me.iceGiant ? "Ice Giant" : (me.type == "SGG" ? "Small Gas Giant" : "Large Gas Giant");
	}

	me.placementTable = function()
	{
		if(me.iceGiant)
			return GAS_GIANT_ICE_PLACE_TABLE;
		if(me.type == "SGG")
			return GAS_GIANT_SMALL_PLACE_TABLE;
		return GAS_GIANT_LARGE_PLACE_TABLE;
	}

	me.toString = function()
	{
		if(me.type == "LGG")
			return "Large Gas Giant";
		if(me.iceGiant)
			return "Small Ice Giant";
		return "Small Gas Giant";
	}

	var WORLD_DIAMETER;
	me.diameter = function()
	{
		if(WORLD_DIAMETER !== undefined)
			return WORLD_DIAMETER;
		var base = GAS_GIANT_SIZES[me.size];
		var stupidImperial = base + flux()*1000 + flux()*100 + flux()*10 + flux();
		WORLD_DIAMETER = stupidImperial*1.61;
		return WORLD_DIAMETER;
	}

	me.numSats = function()
	{
		if((me.orbit.baseOrbit == 0 || me.orbit.baseOrbit == 1) && uPObj.prefs.tz_no_sat)
			return -1;
		return dice(1)-1;
	}

	var WORLD_DENSITY;
	me.density = function()
	{
		if(WORLD_DENSITY !== undefined)
			return WORLD_DENSITY;
		var densityTbl = new dice_table(WORLD_DENSITY_GAS_GIANT);
		WORLD_DENSITY = densityTbl.roll();
		return WORLD_DENSITY;
	}

	me.mass = function()
	{
		var vol = 4 / 3 * Math.PI * Math.pow(GAS_GIANT_SIZES[me.size]/8000,3); // in earth volumes
		var mass = vol*me.density();
		mass = Math.round(mass*1000)/1000;
		return mass;
	}

	me.dbObj = function()
	{
		var o = {};
		o.name = me.name;
		o.zone = me.zone;
		o.size = me.size;
		o.type = "gasGiant";
		o.gas_giant_type = me.type;
		o.uwp = me.uwp;
		o.iceGiant = me.iceGiant;
		o.density = me.density();
		o.diameter = me.diameter();
		if(me.satelliteSystem)
			o.satelliteSystem = me.satelliteSystem.dbObj();
		return o;
	}

	me.read_dbObj = function(o)
	{
		me.name = o.name;
		me.zone = o.zone;
		me.size = o.size;
		me.type = o.gas_giant_type;
		me.uwp = o.uwp;
		me.iceGiant = o.iceGiant;
		WORLD_DIAMETER = o.diameter;
		WORLD_DENSITY = o.density;
		if(o.satelliteSystem)
		{
			me.satelliteSystem = new satelliteOrbitSet(me);
			me.satelliteSystem.read_dbObj(o.satelliteSystem);
		}
	}
	
	me.timetoJumpPoint = function(accel, distance, solveType)
	{
		var pObj = {};
		pObj.t = false;
		pObj.d = Math.max(0, me.diameter()*100000 - distance * 1000);
		if(pObj.d == 0)
			return "Ship already past jump point.";
		pObj.a = accel * 9.81;
		var calcObj = new intraSystemTravel(pObj, solveType);
		return calcObj.timeString();
	}	

	me.updateDetails = function()
	{
		me.name = document.getElementById("ggName").value;
		me.size = parseInt(document.getElementById("ggSize").value);
		me.type = me.size < 23 ? "SGG" : "LGG";
		WORLD_DENSITY = parseFloat(document.getElementById("ggDensity").value);
		me.iceGiant = (document.getElementById("ggType").value == "IG" ? true : false);
		me.uwp = "Size: " + pseudoHex(me.size);
		me.orbit.set.updateTable();
		me.editDetails();		
	}

	me.editDetails = function()
	{
		divsToShow(15);
		document.getElementById("ggName").value = me.name;
		document.getElementById("ggSize").value = me.size;
		document.getElementById("ggType").value = (me.iceGiant ? "IG" : "GG");
		document.getElementById("ggDensity").value = me.density();
		document.getElementById("ggMass").innerHTML = "" + me.mass() + " (Earth Masses)  " + (me.mass() / 317.83).toLocaleString("en-AU",{style:"decimal", maximumFractionDigits: 2}) + " (Jupiter Masses)";
		document.getElementById("ggDiameter").innerHTML = "" + me.diameter().toLocaleString("en-AU",{style:"decimal",maximumFractionDigits:0}) + " km";
		document.getElementById("ggJP").innerHTML = "" + (me.diameter() * 100).toLocaleString("en-AU",{style:"decimal",maximumFractionDigits:0}) + " km";
		
		document.getElementById("ggName").onchange = me.updateDetails;
		document.getElementById("ggSize").onchange = me.updateDetails;
		document.getElementById("ggType").onchange = me.updateDetails;
		document.getElementById("ggDensity").onchange = me.updateDetails;
		document.getElementById("ggShipDistance").onchange = me.updateDetails;
		document.getElementById("ggShipAccel").onchange = me.updateDetails;

		var shipDistance = parseInt(document.getElementById("ggShipDistance").value);
		var shipAccel = parseInt(document.getElementById("ggShipAccel").value);
		document.getElementById("ggJPTime").innerHTML = "" + me.timetoJumpPoint(shipAccel,shipDistance,true) + " (stop and start) " + me.timetoJumpPoint(shipAccel,shipDistance,false) + " (continuous acceleration) ";
	}

	me.updateEdits = function()
	{
		return false;
	}

}

function ring(planet)
{
	var me = this;
	me.name = "";
	me.inheritFrom = world;
	me.inheritFrom();
	me.planet = planet;
	me.isSatellite = true;
	
	me.symbolName = function()
	{
		return "sys_symbol_belt";
	}
	
	me.backupName = function()
	{
		return "Ring";
	}

	me.toString = function()
	{
		return "Ring system";
	}

	me.symbol = function()
	{
		var symbol = {baseOrbit:me.orbit.baseOrbit, distance:me.orbit.orbitDistance(), uwp:"", symbol:"sys_symbol_belt"};
		symbol.name = me.name == "" ? me.toString() : (me.name + " (" + me.toString() + ")");
		return symbol;
	}

	me.getSatelliteOrbit = function()
	{
		return (new dice_table(SATELLITE_ORBIT_DATA_RING)).roll();
	}

	me.mass = function()
	{
		return 0;
	}

	me.dbObj = function()
	{
		return {type:"ring", name:me.name};
	}

	me.read_dbObj = function(o)
	{
		me.name = o.name;
	}

	me.updateEdits = function()
	{
		return false;
	}
}

function uwp(worldObject)
{
	var me = this;
	me.port = "X"; //Starport or Spaceport
	me.size = 0;	//Size
	me.atmos = 0;	//Atmosphere
	me.hydro = 0;	//Hydrographics
	me.popul = 0;	//Population
	me.gov = 0;	//Government
	me.law = 0;	//Law Level
	me.TL = 0;	//Technology Level
	me.world = worldObject;
	me.genObject; // pass in the rules for generating the UWP
	me.mainWorld; // true = is a main world; false = is not a main world

	me.createUWP = function()
	{
		me.genObject = me.world.generationObject;
		me.mainWorld = me.world.isMainWorld;
		for(worldStat in me.genObject)
		{
			if(typeof(me.genObject[worldStat]) != "function")
				continue;
			me.genObject[worldStat](me, me.world.populLimit);
		}
	}

	me.update = function(property, value)
	{
		if(property == "port")
			me.port = value;
		else
			me[property] = parseInt(value);
	}

	me.totalTechDM = function()
	{
		var total_tech_DM = 0;
		for(var i=0;i<WORLD_TL_MODS.length;i++)
		{
			var propertyValue = me[WORLD_TL_MODS[i].property];
			if(WORLD_TL_MODS[i][propertyValue] != undefined)
				total_tech_DM += WORLD_TL_MODS[i][propertyValue];
		}
		return total_tech_DM;
	}

	me.readUWP = function(uwpString)
	{
		me.port = uwpString.substr(0,1);
		me.size = readPseudoHex(uwpString.substr(1,1));
		me.atmos = readPseudoHex(uwpString.substr(2,1));
		me.hydro = readPseudoHex(uwpString.substr(3,1));
		me.popul = readPseudoHex(uwpString.substr(4,1));
		me.gov = readPseudoHex(uwpString.substr(5,1));
		me.law = readPseudoHex(uwpString.substr(6,1));
		me.TL = readPseudoHex(uwpString.substr(8,1));
	}

	me.toString = function()
	{
		var s = "";
		s += me.port;
		s += pseudoHex(me.size);
		s += pseudoHex(me.atmos);
		s += pseudoHex(me.hydro);
		s += pseudoHex(me.popul);
		s += pseudoHex(me.gov);
		s += pseudoHex(me.law);
		s += "-" + pseudoHex(me.TL);
		return s;
	}

	me.dbObj = function()
	{
		return {port:me.port, size:me.size, atmos:me.atmos, hydro:me.hydro, popul:me.popul, gov:me.gov, law:me.law, TL:me.TL};
	}

	me.read_dbObj = function(o)
	{
		for(p in o)
			me[p] = o[p];
	}
}

function tcs(world)
{
	var me = this;
	me.world = world;
	me.classes = [];

	me.generate = function()
	{
//		me.classes = [];
            if(me.classes.length == 0)
		for(var i=0;i<ALL_TC.length;i++)
			if(ALL_TC[i].rules(me.world))
				me.add(ALL_TC[i].code);
	}

	me.has = function(tcCode)
	{
		return me.classes.find(function(v) { return v == tcCode } ) !== undefined;
	}

	me.add = function(tcCode)
	{
		if(!me.has(tcCode))
			me.classes.push(tcCode);
	}

	me.del = function(tcCode)
	{
		var i = me.classes.findIndex(function(v) { return v == tcCode } );
		if(i > -1)
			me.classes.splice(i,1);
	}

	me.toString = function()
	{
		return me.classes.join(" ");
	}

	me.readString = function(s)
	{
		var c = s.split(" ");
		for(var i=0;i<c.length;i++)
			me.add(c[i]);
	}

	me.toURI = function()
	{
		var s = "";
		for(var i=0;i<me.classes.length;i++)
			s += "&" + encodeURIComponent("tc") + "=" + encodeURIComponent(me.classes[i]);
		return s;
	}

	me.dbObj = function()
	{
		var o = {};
		o.classes = me.classes;
		return o;
	}

	me.read_dbObj = function(o)
	{
		o.classes.map(function(tcCode)
							{
								me.classes.push(tcCode);
							});
	}
}

function nil(worldObject)
{
	var me = this;
	me.world = worldObject;
	me.type = null;

	me.generate = function()
	{
		me.type = null;
		for(var i=0;i<ALL_NIL.length;i++)
			if(ALL_NIL[i].rules(me.world))
				me.type = ALL_NIL[i];
	}

	me.is = function(name)
	{
		return me.type.name == name;
	}

	me.toString = function()
	{
		var s = "";
		if(me.world.gov == 1)
			s += "Corporate ";
		if(me.world.gov == 6)
			s += "Colonial ";
		if(me.type)
                        s += me.type.name;
		return s;
	}

	me.dbObj = function()
	{
		me.generate();
		return {name:me.type.name};
	}

	me.read_dbObj = function(o)
	{
		me.type = ALL_NIL.find(function(v){ return v.name == o.name });
	}
}

function bases(world)
{
	var me = this;
	me.world = world;
	me.basesPresent = [];

	me.generate = function()
	{
		for(var i=0;i<allBases.length;i++)
			if(allBases[i].present(me.world.uwp.port))
				me.add(allBases[i]);
	}

	me.toString = function()
	{
		var s = "";
		for(var i=0;i<me.basesPresent.length;i++)
			s += me.basesPresent[i].code;
		return s;
	}

	me.readString = function(s)
	{
		for(var i=0;i<allBases.length;i++)
			if(s.search(allBases[i].code) != -1)
				me.basesPresent.push(allBases[i]);
	}

	me.has = function(baseName)
	{
		return me.basesPresent.find(function(v) {v.name == baseName}) !== undefined;
	}

	me.add = function(baseObj)
	{
		if(!me.has(baseObj.name))
			me.basesPresent.push(baseObj);
	}
}

var navalBase = {name:"Naval",code:"N",present:function(starport) { return (starport=="A" &&  dice(2) <= 6) || (starport=="B" && dice(2) <= 5); } };
var scoutBase = {name:"Scout",code:"S",present:function(starport) { return (starport=="A" &&  dice(2) <= 4) || (starport=="B" && dice(2) <= 5) || (starport == "C" && dice(2) <= 6) || (starport == "D" && dice(2) <= 7); } };
var navalDepot = {name:"Naval Depot",code:"D",present:function(starport) { return false; } };
var scoutWay = {name:"Way Station",code:"W",present:function(starport) { return false; } };
var aslan_clanBase = {name:"Clan Base (Aslan)",code:"R",present:function(starport) { return false; } };
var aslan_tlaukuBase = {name:"Tlauku Base (Aslan)",code:"T",present:function(starport) { return false; } };
var kkree_navalBase = {name:"Naval Base (K'kree)",code:"K",present:function(starport) { return false; } };
var kkree_navalOutpost = {name:"Naval Outpost (K'kree)",code:"O",present:function(starport) { return false; } };
var vargr_navalBase = {name:"Naval Base (Vargr)",code:"G",present:function(starport) { return false; } };
var vargr_corsairBase = {name:"Corsair Base (Vargr)",code:"C",present:function(starport) { return false; } };
var zho_navalBase = {name:"Naval Base (Zhodani)",code:"Z",present:function(starport) { return false; } };
var zho_navalDepot = {name:"Naval Depot (Zhodani)",code:"Y",present:function(starport) { return false; } };
var zho_relayStation = {name:"Relay Station (Zhodani)",code:"X",present:function(starport) { return false; } };
var hiver_navalBase = {name:"Naval Base (Hiver Federation)",code:"L",present:function(starport) { return false; } };
var hiver_embassyCentre = {name:"Embassy Centre (Hiver Federation)",code:"E",present:function(starport) { return false; } };
var hiver_militaryBase = {name:"Military Base (Hiver Federation)",code:"M",present:function(starport) { return false; } };

var genericBase = {name:"",code:"",present:function(starport) { return false; } };

var allBases = [ navalBase, scoutBase, navalDepot, scoutWay, aslan_clanBase, aslan_tlaukuBase, kkree_navalBase, kkree_navalOutpost, vargr_navalBase, vargr_corsairBase, zho_navalBase, zho_navalDepot, zho_relayStation, hiver_embassyCentre, hiver_militaryBase, hiver_navalBase ];

function eX(world)
{
	var me = this;
	me.world = world;
	me.resources;
	me.labour;
	me.infrastructure;
	me.efficiency;

	me.generate = function()
	{
		if(me.world.isMainWorld)
		{
			me.resources = dice(2);
			if(me.world.uwp.TL > 7)
				me.resources += me.world.belts + me.world.gas_giants;
			me.labour = Math.max(0,me.world.uwp.popul - 1);
			if(me.world.tcs.has("Ba"))
				me.infrastructure = 0;
			if(me.world.tcs.has("Lo"))
				me.infrastructure = 1;
			if(me.world.tcs.has("Ni"))
				me.infrastructure = Math.max(0, dice(1) + me.world.importance.value);
			if(!me.world.tcs.has("Ba") && !me.world.tcs.has("Lo") && !me.world.tcs.has("Ni"))
				me.infrastructure = Math.max(0, dice(2) + me.world.importance.value);
			me.efficiency = flux();
		}
		else
		{
			me.resources = dice(2);
			me.labour = Math.max(0,me.world.uwp.popul - 1);
			if(me.world.tcs.has("Ba"))
				me.infrastructure = 0;
			if(me.world.tcs.has("Lo"))
				me.infrastructure = 1;
			if(!me.world.tcs.has("Ba") && !me.world.tcs.has("Lo"))
				me.infrastructure = Math.max(0,me.world.mainWorld.infrastructure - 1);
			me.efficiency = me.world.mainWorld.efficiency;
		}
	}

	me.update = function()
	{
		if(me.world.isMainWorld)
		{
			me.resources = dice(2);
			if(me.world.uwp.TL > 7)
				me.resources += me.world.belts + me.world.gas_giants;
			me.labour = Math.max(0,me.world.uwp.popul - 1);
			if(me.world.tcs.has("Ba"))
				me.infrastructure = 0;
			if(me.world.tcs.has("Lo"))
				me.infrastructure = 1;
			if(me.world.tcs.has("Ni"))
				me.infrastructure = Math.max(0, dice(1) + me.world.importance.value);
			if(!me.world.tcs.has("Ba") && !me.world.tcs.has("Lo") && !me.world.tcs.has("Ni"))
				me.infrastructure = Math.max(0, dice(2) + me.world.importance.value);
			if(me.efficiency === undefined)
				me.efficiency = flux();
		}
		else
		{
			if(me.resources === undefined)
				me.resources = dice(2);
			me.labour = Math.max(0,me.world.uwp.popul - 1);
			if(me.infrastructure === undefined)
			{
				if(me.world.tcs.has("Ba"))
					me.infrastructure = 0;
				if(me.world.tcs.has("Lo"))
					me.infrastructure = 1;
				if(!me.world.tcs.has("Ba") && !me.world.tcs.has("Lo"))
					me.infrastructure = Math.max(0,me.world.mainWorld.infrastructure - 1);
			}
			if(me.efficiency === undefined)
				me.efficiency = me.world.mainWorld.efficiency;
		}
	}

	me.getRU = function()
	{
		var resourcesMulti = Math.max(1,me.resources);
		var labourMulti = Math.max(1,me.labour);
		var infraMulti = Math.max(1,me.infrastructure);
		var effMulti = me.effiency == 0 ? 1 : me.efficiency;
/*
		// solution to previously raised errata; publication of T5.10 has made it clear that negative efficiency stays.
		var effMulti;
		switch(me.efficiency)
		{
			case -5:
				effMulti = 0.5;
				break;
			case -4:
				effMulti = 0.6;
				break;
			case -3:
				effMulti = 0.7;
				break;
			case -2:
				effMulti = 0.8
				break;
			case -1:
				effMulti = 0.9
			case 0:
				effMulti = 1;
			default:
				effMulti = me.efficiency;
		}
*/
		return resourcesMulti*labourMulti*infraMulti*effMulti;
	}

	me.toString = function()
	{
		var s = "(" + pseudoHex(me.resources);
		s += pseudoHex(me.labour);
		s += pseudoHex(me.infrastructure);
		s += me.efficiency < 0 ? "-" : "+";
		s += Math.abs(me.efficiency) + ")";
		return s;
	}

	me.readString = function(s) // s must be of the form "(762-1)"
	{
		if(s=="" || s==null)
		{
			me.generate();
			return;
		}
		me.resources = readPseudoHex(s.substr(1,1));
		me.labour = readPseudoHex(s.substr(2,1));
		me.infrastructure = readPseudoHex(s.substr(3,1));
		me.efficiency = parseInt(s.substr(4,2));
	}

	me.dbObj = function()
	{
		return {resources:me.resources, labour:me.labour, infrastructure:me.infrastructure, efficiency:me.efficiency};
	}

	me.read_dbObj = function(o)
	{
		for(var p in o)
			me[p] = o[p];
	}
}

function cX(world)
{
	var me = this;
	me.world = world;
	me.homogeneity = 0;
	me.acceptance = 0;
	me.strangeness = 0;
	me.symbols = 0;

	me.generate = function()
	{
		me.homogeneity = Math.max(1,me.world.uwp.popul + flux());
		me.acceptance = Math.max(1,me.world.uwp.popul + me.world.importance.value);
		me.strangeness = Math.max(1,flux() + 5);
		me.symbols = Math.max(1,me.world.uwp.TL + flux());
	}

	me.toString = function()
	{
		var s = "[";
		s += pseudoHex(me.homogeneity);
		s += pseudoHex(me.acceptance);
		s += pseudoHex(me.strangeness);
		s += pseudoHex(me.symbols);
		s += "]";
		return s;
	}

	me.readString = function(s) // s must be of the form [98A5]
	{
		if(s=="" || s==null)
		{
			me.generate();
			return;
		}
		me.homogeneity = readPseudoHex(s.substr(1,1));
		me.acceptance = readPseudoHex(s.substr(2,1));
		me.strangeness = readPseudoHex(s.substr(3,1));
		me.symbols = readPseudoHex(s.substr(4,1));
	}

	me.dbObj = function()
	{
		return {homogeneity:me.homogeneity, acceptance:me.acceptance, strangeness:me.strangeness, symbols:me.symbols};
	}

	me.read_dbObj = function(o)
	{
		for(var p in o)
			me[p] = o[p];
	}
}

function iX(world)
{
	var me = this;
	me.world = world;
	me.value = 0;
	
	me.generate = function()
	{
		var returnedIX = 0;
		if(me.world.uwp.port == "A" || me.world.uwp.port == "B")
			returnedIX++;
		if(me.world.uwp.port == "D" || me.world.uwp.port == "E" || me.world.uwp.port == "X")
			returnedIX--;
		if(me.world.uwp.TL >= 16)
			returnedIX++;
		if(me.world.uwp.TL >= 10)
			returnedIX++;
		if(me.world.uwp.TL <= 8)
			returnedIX--;
		if(me.world.tcs.has("Ag"))
			returnedIX++;
		if(me.world.tcs.has("Hi"))
			returnedIX++;
		if(me.world.tcs.has("In"))
			returnedIX++;
		if(me.world.tcs.has("Ri"))
			returnedIX++;
		if(me.world.uwp.popul <= 6)
			returnedIX--;
		if(me.world.bases.has("Naval") && me.world.bases.has("Scout"))
			returnedIX++;
		if(me.world.bases.has("Way Station"))
			returnedIX++;
		me.value = returnedIX;
		return returnedIX;
	}

	me.description = function()
	{
		return IMPORTANCE_DESCRIPTIONS[me.value];
	}

	me.toString = function()
	{
		return " { " + me.value + " } ";
	}
	
	me.readString = function(s) // must be of the form { -1 }
	{
		if(s == "" || s == null)
		{
			me.generate();
			return;
		}
		var temp_iX = parseInt(s.substr(2,2));
		if(!Number.isInteger(temp_iX))
			me.generate();
		else
			me.value = temp_iX;
	}
	
	me.readDigit = function(s) // must be an integer or string representing an integer from -5 to +5
	{
		var temp_iX = parseInt(s);
		if(isNaN(temp_iX) || !Number.isInteger(temp_iX) || temp_iX < -5 || temp_iX > 5)
		{
			me.generate();
			return;
		}
		me.value = temp_iX;
	}
	
	me.generate();
}

function nobles(world)
{
	var me = this;
	me.world = world;
	me.nobles = [];

	me.generate = function()
	{
		for(var i=0;i<allNobles.length;i++)
			if(allNobles[i].rule(me.world))
				me.nobles.push(allNobles[i]);
	}

	me.toString = function()
	{
		var s = "";
		for(var i=0;i<me.nobles.length;i++)
			s += me.nobles[i].code;
		return s;
	}

	me.readString = function(s)
	{
		for(var i=0;i<allNobles.length;i++)
			if(s.search(allNobles[i].code) != -1)
				me.nobles.push(allNobles[i]);
		if(me.nobles.length == 0 || !me.nobles.find(function(v) { return v.code == "B" } ))
			me.nobles.push(nobleKnight);
	}

	me.allNobles = function()
	{
		var s = "";
		for(var i=0;i<me.nobles.length;i++)
			s += me.nobles[i].name + ", ";
		return s.substr(0, s.length-2);
	}
}

var nobleKnight = {name:"Knight",code:"B",rule:function(world) { return true; } };
var nobleBaronet = {name:"Baronet",code:"c",rule:function(world) { return world.tcs.has("Pa") || world.tcs.has("Pr"); } };
var nobleBaron = {name:"Baron",code:"C",rule:function(world) { return world.tcs.has("Ag") || world.tcs.has("Ri"); } };
var nobleMarquis = {name:"Marquis",code:"D",rule:function(world) { return world.tcs.has("Pi"); } };
var nobleViscount = {name:"Viscount",code:"e",rule:function(world) { return world.tcs.has("Ph"); } };
var nobleCount =  {name:"Count",code:"E",rule:function(world) { return world.tcs.has("In") || world.tcs.has("Hi"); } };
var nobleDuke = {name:"Duke",code:"f",rule:function(world) { return world.importance.value >= 4; } };
var nobleCapitalDuke = {name:"Duke (capital)",code:"F",rule:function(world) { return world.tcs.has("Cp"); } };

var allNobles = [nobleKnight, nobleBaronet, nobleBaron, nobleMarquis, nobleViscount, nobleCount, nobleDuke, nobleCapitalDuke ];


var STAR_COUNT = 0;
function star(isPrimary)
{
	var me = this;
	me.spectral_class = "";
	me.spectral_size = "";
	me.isPrimary = isPrimary;
	me.isCloseCompanion = false;
	me.primary_class_flux = 0;
	me.primary_size_flux = 0;
	me.name = "";
	me.id = STAR_COUNT++;
	me.luminosityVary = 1;
	me.sizeVary = 1;
	me.massVary = 1;

	me.generate = function()
	{
		var size_dm = 0;
		var class_dm = 0;
		if(!me.isPrimary)
		{
			size_dm = dice(1)+2;
			class_dm = dice(1)-1;
		}
		var spectral_class_table = new dice_table(STAR_SPECTRAL_CLASS_TABLE);
		spectral_class_table.DM = class_dm;
		if(me.isPrimary)
		{
			me.spectral_class = spectral_class_table.roll();
			me.primary_class_flux = spectral_class_table.rollResult;
		}
		else
		{
			me.spectral_class = spectral_class_table.selection(me.primary_class_flux);
		}
		if(me.spectral_class == "BD")
			return;
		var spectral_size_table;
		switch(me.spectral_class)
		{
			case "O":
				spectral_size_table = new dice_table(STAR_CLASS_O_SIZE_TABLE);
				spectral_size_table.DM = size_dm;
				if(me.isPrimary)
				{
					me.spectral_size = spectral_size_table.roll();
					me.primary_size_flux = spectral_size_table.rollResult;
				}
				else
					me.spectral_size = spectral_size_table.selection(me.primary_size_flux);
				if(me.spectral_size != "D")
					me.spectral_class += rng(8)+1;
				else
					me.spectral_class == "";
				break;
			case "B":
				spectral_size_table = new dice_table(STAR_CLASS_B_SIZE_TABLE);
				spectral_size_table.DM = size_dm;
				if(me.isPrimary)
				{
					me.spectral_size = spectral_size_table.roll();
					me.primary_size_flux = spectral_size_table.rollResult;
				}
				else
					me.spectral_size = spectral_size_table.selection(me.primary_size_flux);
				if(me.spectral_size != "D")
					me.spectral_class += rng(10)-1;
				else
					me.spectral_class == "";
				break;
			case "A":
				spectral_size_table = new dice_table(STAR_CLASS_A_SIZE_TABLE);
				spectral_size_table.DM = size_dm;
				if(me.isPrimary)
				{
					me.spectral_size = spectral_size_table.roll();
					me.primary_size_flux = spectral_size_table.rollResult;
				}
				else
					me.spectral_size = spectral_size_table.selection(me.primary_size_flux);
				if(me.spectral_size != "D")
					me.spectral_class += rng(10)-1;
				else
					me.spectral_class == "";
				break;
			case "F":
				spectral_size_table = new dice_table(STAR_CLASS_F_G_K_SIZE_TABLE);
				spectral_size_table.DM = size_dm;
				if(me.isPrimary)
				{
					me.spectral_size = spectral_size_table.roll();
					me.primary_size_flux = spectral_size_table.rollResult;
				}
				else
					me.spectral_size = spectral_size_table.selection(me.primary_size_flux);
				if(me.spectral_size != "D")
				{
					if(me.spectral_size == "VI")
						me.spectral_class += rng(5)+4;
					else
						me.spectral_class += rng(10)-1;
				}
				else
					me.spectral_class == "";
				break;
			case "G":
				spectral_size_table = new dice_table(STAR_CLASS_F_G_K_SIZE_TABLE);
				spectral_size_table.DM = size_dm;
				if(me.isPrimary)
				{
					me.spectral_size = spectral_size_table.roll();
					me.primary_size_flux = spectral_size_table.rollResult;
				}
				else
					me.spectral_size = spectral_size_table.selection(me.primary_size_flux);
				if(me.spectral_size != "D")
					me.spectral_class += rng(10)-1;
				else
					me.spectral_class == "";
				break;
			case "K":
				spectral_size_table = new dice_table(STAR_CLASS_F_G_K_SIZE_TABLE);
				spectral_size_table.DM = size_dm;
				if(me.isPrimary)
				{
					me.spectral_size = spectral_size_table.roll();
					me.primary_size_flux = spectral_size_table.rollResult;
				}
				else
					me.spectral_size = spectral_size_table.selection(me.primary_size_flux);
				if(me.spectral_size != "D")
				{
					if(me.spectral_size == "IV")
						me.spectral_class += rng(5);
					else
						me.spectral_class += rng(10)-1;
				}
				else
					me.spectral_class == "";
				break;
			case "M":
				spectral_size_table = new dice_table(STAR_CLASS_M_SIZE_TABLE);
				spectral_size_table.DM = size_dm;
				if(me.isPrimary)
				{
					me.spectral_size = spectral_size_table.roll();
					me.primary_size_flux = spectral_size_table.rollResult;
				}
				else
					me.spectral_size = spectral_size_table.selection(me.primary_size_flux);
				if(me.spectral_size != "D")
					me.spectral_class += rng(10)-1;
				else
					me.spectral_class == "";
		}
		me.getData();
	}

	me.getData = function()
	{
		var data = STAR_DATA.find(function(v) {return v.name == me.toString()});
		me.radii = data.radii * me.sizeVary;
		me.radius = me.radii*695700;
		me.jump_point = me.radius*200;
		me.mass = data.mass * me.massVary;
		me.luminosity = data.luminosity * me.luminosityVary;
		me.hz = data.hz;
		me.fao = data.fao;
	}
	
	me.jumpPoint = function()
	{
		return Math.round(me.radius*200);
	}

	me.toString = function()
	{
		if(me.spectral_size == "D")
			return "D";
		if(me.spectral_size == "N")
			return "N";
		if(me.spectral_size == "B")
			return "B";
		if(me.spectral_class == "BD")
			return "BD";
		return (me.spectral_class + " " + me.spectral_size);
	}

	me.toTableRow = function()
	{
		var row = document.createElement("TR");
		var orb = me.isCloseCompanion ? "Companion" : "Primary";
		var contents = [orb,"","","","",me.nameTextBox(),"Star",me.toString(),"",me.calcDetails(),""];
		for(var i=0;i<contents.length;i++)
		{
			var cell = document.createElement("TD");
			if(typeof(contents[i]) == "string")
				cell.innerHTML = contents[i];
			else
				cell.appendChild(contents[i]);
			if(i == contents.length-1)
				cell.colSpan = 6;
			row.appendChild(cell);
		}
		return row;
	}
	
	me.calcDetails = function()
	{
		var detailsBtn = document.createElement("BUTTON");
		detailsBtn.style.className = "btn2";
		detailsBtn.style.paddingBottom = "0";
		detailsBtn.style.paddingLeft = "0";
		detailsBtn.style.paddingRight = "0";
		detailsBtn.style.paddingTop = "0";

		detailsBtn.innerHTML = "Details";
		detailsBtn.onclick = me.editDetails;
		return detailsBtn;
	}
	
	me.timetoJumpPoint = function(accel, distance, solveType)
	{
		var pObj = {};
		pObj.t = false;
		pObj.d = Math.max(0, me.jump_point*1000 - distance * 150000000000);
		if(pObj.d == 0)
			return "Ship already past jump point.";
		pObj.a = accel * 9.81;
		var calcObj = new intraSystemTravel(pObj, solveType);
		return calcObj.timeString();
	}
	
	me.editDetails = function()
	{
		divsToShow(12);
		document.getElementById("starName").value = me.name;
		document.getElementById("spectralClass").value = me.spectral_class;
		document.getElementById("spectralSize").value = me.spectral_size;
		document.getElementById("luminosityVary").value = me.luminosityVary;
		document.getElementById("sizeVary").value = me.sizeVary;
		document.getElementById("massVary").value = me.massVary;
		document.getElementById("starMass").innerHTML = "" + me.mass.toLocaleString("en-AU", {style:"decimal", maximumFractionDigits:6}) + " Sol";
		document.getElementById("starRadius").innerHTML = "" + me.radii.toLocaleString("en-AU", {style:"decimal", maximumFractionDigits:6}) + " Sol";
		document.getElementById("starDiameter").innerHTML = "" + (2*me.radius).toLocaleString("en-AU", {style:"decimal", maximumFractionDigits:0}) + " km";
		document.getElementById("starLumin").innerHTML = "" + me.luminosity.toLocaleString("en-AU", {style:"decimal", maximumFractionDigits:6}) + " Sol";
		document.getElementById("starJP").innerHTML = "" + me.jump_point.toLocaleString("en-AU", {style:"decimal", maximumFractionDigits:0}) + " km";
		document.getElementById("shipTime").innerHTML = me.timetoJumpPoint(parseInt(document.getElementById("shipAccel").value), parseFloat(document.getElementById("shipDistance").value), true);
		document.getElementById("shipTimeCA").innerHTML = me.timetoJumpPoint(parseInt(document.getElementById("shipAccel").value), parseFloat(document.getElementById("shipDistance").value), false);
		document.getElementById("shipDistanceToJP").innerHTML = "" + (me.jump_point - document.getElementById("shipDistance").value * 150000000).toLocaleString("en-AU", {style:"decimal", maximumFractionDigits:0}) + " km";
		
		document.getElementById("starName").onchange = me.updateDetails;
		document.getElementById("spectralClass").onchange = me.updateDetails;
		document.getElementById("spectralSize").onchange = me.updateDetails;
		document.getElementById("luminosityVary").onchange = me.updateDetails;
		document.getElementById("sizeVary").onchange = me.updateDetails;
		document.getElementById("massVary").onchange = me.updateDetails;
		document.getElementById("shipDistance").onchange = me.updateDetails;
		document.getElementById("shipAccel").onchange = me.updateDetails;
		
	}
	
	me.updateDetails = function()
	{
		me.name = document.getElementById("starName").value;
		me.spectral_class = document.getElementById("spectralClass").value;
		me.spectral_size = document.getElementById("spectralSize").value;
		me.luminosityVary = document.getElementById("luminosityVary").value;
		me.sizeVary = document.getElementById("sizeVary").value;
		me.massVary = document.getElementById("massVary").value;
		me.getData();
		me.set.updateTable();
		me.editDetails();
	}

	me.nameTextBox = function()
	{
		var textInput = document.createElement("INPUT");
		textInput.setAttribute("type","text");
		textInput.width = NAME_TABLE_WIDTH;
		textInput.id = "STAR_NAME_" + me.id;
		textInput.value = me.name;
		textInput.onchange = function() { me.name = textInput.value; me.set.systemObj.toSymbolMap(); };
		return textInput;
	}

	me.tofixedWidthText = function()
	{
		var s = pad((me.isCloseCompanion ? "Companion" : "Primary"),27);
		s += pad(me.name,21);
		s += pad("Star",16);
		s += pad(me.toString(),10)
		s += "Radii (Sol): " + me.radii + " Mass (Sol): " + me.mass + " Luminosity (Sol): " + me.luminosity + "\r\n";
		return s;
	}

	me.toPlainHTML = function()
	{
		var s = "<tr><td>" + (me.isCloseCompanion ? "Companion" : "Primary") + "</td><td></td><td></td>";
		s += "<td>" + me.name + "</td>";
		s += "<td>Star</td>";
		s += "<td>" + me.toString() + "</td>";
		s += "<td>Radii (Sol): " + me.radii + " Mass (Sol): " + me.mass + " Luminosity (Sol): " + me.luminosity + "</td>";
		s += "</tr>";
		return s;
	}


	me.toCSV = function()
	{
		return (me.isCloseCompanion ? "Companion" : "Primary") + ",,," + me.name + ",Star," + me.toString() + ",\r\n";
	}

	me.readString = function(s)
	{
		if(s == "")
			return;
		s = s.trim();
		if(STAR_DATA.find(function(v){ return v.name == s}) === undefined && s != "D" && s != "BD")
			throw new Error("Non-valid stellar classification passed into a star object: '" + s + "'");
		if(s == "D")
		{
			me.spectral_class = "";
			me.spectral_size = "D";
			me.getData();
			return;
		}
		if(s == "N")
		{
			me.spectral_class = "";
			me.spectral_size = "N";
			me.getData();
			return;
		}
		if(s == "B")
		{
			me.spectral_class = "";
			me.spectral_size = "B";
			me.getData();
			return;
		}
		if(s == "BD")
		{
			me.spectral_class = "BD";
			me.spectral_size = "";
			me.getData();
			return;
		}
		me.spectral_class = s.split(" ")[0];
		me.spectral_size = s.split(" ")[1];
		me.getData();
	}

	me.symbol = function()
	{
		var symbol = {baseOrbit:me.isCloseCompanion ? "Companion" : "Primary", distance:"", uwp:me.toString(), satellites:""};
		symbol.symbol = me.isCloseCompanion ? "sys_symbol_star sys_companion" : "sys_symbol_star";
		symbol.name = me.name == "" ? "An unnamed star" : me.name;
		return symbol;
	}

	me.toSysCells = function()
	{
		var symbolData = me.symbol();
		var cells = {};
		for(var p in symbolData)
		{
			var cell = document.createElement("TD");
			cell.className = "sys_cell";
			var cell_contents;
			switch(p)
			{
				case "symbol":
					var cell_contents = document.createElement("DIV");
					cell_contents.className = symbolData.symbol;
					cell_contents.className += " sys";
					break;
				default:
					var cell_contents = document.createElement("P");
					cell_contents.className = (p == "uwp" ? "sys_details" : "sys_orbit");
					cell_contents.innerHTML = symbolData[p];
					break;
			}
			cell.appendChild(cell_contents);
			cells[p] = cell;
		}
		return cells;
	}

	me.dbObj = function()
	{
		return {name:me.name, spectral_size:me.spectral_size, spectral_class:me.spectral_class, luminosityVary:me.luminosityVary, sizeVary:me.sizeVary, massVary:me.massVary};
	}

	me.read_dbObj = function(o)
	{
		for(var p in o)
			if(o[p])
				me[p] = o[p];
		me.getData();
	}

	me.updateEdits = function()
	{
		return false;
	}
}

function starSystem(world)
{
	var me = this;
	me.world = world;
	me.stars = [];
	me.companions = [];
	me.starString = "";

	me.generate = function()
	{
		me.stars[0] = new star(me.world, true);
		me.stars[0].generate();
		if(flux() >= 3)
			me.createCompanion(0);
		for(var i=1;i<4;i++)
		{
			if(flux() >= 3)
			{
				me.stars[i] = new star(me.world, false);
				me.stars[i].primary_class_flux = me.stars[0].primary_class_flux;
				me.stars[i].primary_size_flux = me.stars[0].primary_size_flux;
				me.stars[i].generate();
				if(flux() >= 3)
					me.createCompanion(i);
			}
		}
	}

	me.createCompanion = function(index)
	{
		me.companions[index] = new star(me.world, false);
		me.companions[index].primary_class_flux = me.stars[0].primary_class_flux;
		me.companions[index].primary_size_flux = me.stars[0].primary_size_flux;
		me.companions[index].generate();
		me.companions[index].isCloseCompanion = true;
	}

	me.toString = function()
	{
		var s = "";
		for(var i=0;i<me.stars.length;i++)
		{
			if(me.stars[i])
				s += me.stars[i] + " ";
			if(me.companions[i])
				s += me.companions[i] + " ";
		}
		s = s.trim();
		return s;
	}

	me.readString = function(s)
	{
		if(typeof(s) != "string" || s.trim()=="")
			return;
		s = s.replace(/[OBAFGKM]\d\s(D)/g,function(x) { return x.replace(/\sD/g, " V"); });
		s = s.replace(/F[0-4]\sVI/g, "F5 VI"); // F0 VI, F1 VI, F2 VI, F3 VI, F4 VI all converted to F5 VI
		s = s.replace(/K[0-5]\sIV/g, "K6 IV"); // K0 through K5 IV converted to K6 IV
		s = s.replace(/M[0-9]\sIV/g, function(x) { return x.replace(/\sIV/g, " V"); }); // convert M0 - M9 IV to V
		s = s.replace(/O[0-1]/g, "O2"); // no O1 or O0 - both become O2
		s = s.replace(/O[2-9]\sVI/g, function(x) { return x.replace(/\sVI/g, " V"); }); // convert any O-type subdwarfs to dwarfs
		me.stars = [];
		me.companions = [];
		var starStrings = s.match(/([OBAFGKMLTY]\d\s(Ia|Ib|IV|V?I{0,3}|D))|(BD)(\s?})|(\s{0,1})(D)|(\s{0,1})(N)|(\s{0,1})(B)/g);
		if(starStrings == null)
			return;
		starStrings.forEach(function(item, index, ssArray) { ssArray[index] = item.trim(); });
		me.stars[0] = new star();
		me.stars[0].readString(starStrings[0]);
		var stars_and_companions = [me.stars[0]];
		var last_available = 0;
		var first_available = 1;
		var slot = 0;
		for(var i=1;i<starStrings.length;i++)
		{
			last_available = 8-(starStrings.length-i);
			var slotRoll = rng(last_available);
			slot = Math.max(first_available,slotRoll);
			if(slot%2 == 1 && !stars_and_companions[slot-1])
				slot--;
			stars_and_companions[slot] = new star();
			stars_and_companions[slot].readString(starStrings[i]);
			first_available = slot+1;
		}
		for(i=1;i<stars_and_companions.length;i++)
		{
			if(stars_and_companions[i] !== undefined)
			{
				if(i%2 == 0)
					me.stars[i/2] = stars_and_companions[i];
				else
				{
					me.companions[(i-1)/2] = stars_and_companions[i];
					me.companions[(i-1)/2].isCloseCompanion = true;
				}
			}
		}
	}

	me.dbObj = function()
	{
		var o = {};
		for(var i=0;i<me.stars.length;i++)
		{
			if(me.stars[i])
				o["star" + i] = me.stars[i].dbObj();
			if(me.companions[i])
				o["companion" + i] = me.companions[i].dbObj();
		}
		return o;
	}

	me.read_dbObj = function(o)
	{
		for(var i=0;i<4;i++)
		{
			if(o["star" + i] !== undefined)
			{
				me.stars[i] = new star();
				me.stars[i].read_dbObj(o["star" + i]);
			}
			if(o["companion" + i] !== undefined)
			{
				me.companions[i] = new star();
				me.companions[i].read_dbObj(o["companion" + i]);
			}
		}
	}

	me.updateEdits = function()
	{
		return false;
	}
}

function fullSystem(mainWorldObj, sysDiv, symbolDiv, detailsDiv, generate_now)
{
	var me = this;
	me.mainWorld = mainWorldObj;
	me.stars = me.mainWorld.stars;
	me.orbits = null;
	me.orbitSets = [];
	me.name = "";
	me.loadKey = null;
	me.totalAvailOrb = 0;
	me.sysDiv = sysDiv;
	me.symbolDiv = symbolDiv;
	me.detailsDiv = detailsDiv;
	me.detailsSaved = false;
	me.seed = me.mainWorld.dataObj.seed;

	if(arguments.length < 5)
		generate_now = true;

	me.generate = function()
	{
		init_rng(me.seed);
		if(me.mainWorld.processData)
			me.mainWorld.processDataObj();
		else
			me.mainWorld.stars.readString(me.mainWorld.stars.starString);
		me.name = me.mainWorld.system ? (me.mainWorld.system) : "Unnamed system";
		me.primary = me.stars.stars[0];
		me.companion = me.stars.companions[0];
		me.orbits = new orbitSet(me.primary, me.companion, me.mainWorld, me);
		me.orbitSets = [me.orbits];
		STAR_COUNT = 0;
		var precedenceCount = 1;
		for(var i=1;i<me.stars.stars.length;i++)
		{
			if(!me.stars.stars[i])
				continue;
			var orbitNumber;
			switch(i)
			{
				case 1:
					orbitNumber = dice(1)-1;
					break;
				case 2:
					orbitNumber = dice(1)+5;
					break;
				case 3:
					orbitNumber = dice(1)+11;
					break;
			}
			var newOrbitSet = new orbitSet(me.stars.stars[i],me.stars.companions[i], me.mainWorld, me);
			newOrbitSet.maxOrbit = orbitNumber-3;
			newOrbitSet.description = PREC_ORDINAL[precedenceCount++];
			me.orbitSets.push(newOrbitSet);
			me.orbits.add(orbitNumber, newOrbitSet);
		}
		me.orbitSets.map(function(orbit_set)
								{
									me.totalAvailOrb += orbit_set.availableOrbitCount();
								});
		var mwType = "";
                if(me.mainWorld.forcedPlanet)
                {
                    mwType = "";
                    me.mainWorld.tcs.del("Pl");
                }
                else if(me.mainWorld.tcs.has("Lk") || me.mainWorld.tcs.has("Sa"))
                        mwType = "Sa";
                else
                {
		if(!uPObj.prefs.main_world_is_sat && !uPObj.prefs.main_world_not_sat && me.mainWorld.uwp.size != 0)
		{
			mwSatTbl = new dice_table(MAIN_WORLD_SATELLITE_TABLE);
			var mwType = mwSatTbl.roll()
		}
		if(uPObj.prefs.main_world_is_sat && me.mainWorld.uwp.size != 0)
			mwType = dice(1) > 3 ? "Sa" : "Lk";
		if(uPObj.prefs.main_world_not_sat || me.mainWorld.uwp.size == 0)
			mwType = "";
                }
		if(mwType == "Sa" || mwType == "Lk")
		{
			me.mainWorld.tcs.add("Sa");
			me.mainWorld.isSatellite = true;
		}
		else
			me.mainWorld.isSatellite = false;
		if(mwType == "Lk")
			me.mainWorld.tcs.add("Lk");
//                if(me.mainWorld.dataObj.remarks.indexOf("Tz") >= 0)
//                        me.mainWorld.tcs.add("Tz");
		var mainWorldPlaced = false;
		if(!uPObj.prefs.main_world_hz_only)
		{
			var mwOrbitTable = new dice_table(MAIN_WORLD_ORBIT_TABLE);
			var mwOrbit = mwOrbitTable.roll();
		}
		else
			mwOrbit = 0;
		for(i=0;i<me.orbitSets.length;i++)
		{
			if(me.mainWorld.uwp.size == 0)
			{
				var mwBeltOrbitTbl = new dice_table(BELT_PLACE_TABLE);
				var mwBeltOrbit = me.orbitSets[i].hz+mwBeltOrbitTbl.roll();
				if(me.orbitSets[i].add(mwBeltOrbit, me.mainWorld))
				{
					mainWorldPlaced = true;
					break;
				}
			}
			if(me.mainWorld.isSatellite)
			{
				var mw_planet;
				if(me.mainWorld.gas_giants > 0)
				{
					mw_planet = new gasGiant(me.mainWorld);
					me.mainWorld.gas_giants--;
				}
				else
				{
					mw_planet = new minorWorld(bigWorldUWP, me.mainWorld);
					mw_planet.generate();
				}
				if(me.orbitSets[i].add(me.orbitSets[i].hz+mwOrbit, mw_planet))
				{
					mainWorldPlaced = true;
					mw_planet.satelliteSystem = new satelliteOrbitSet(mw_planet, me);
					mw_planet.satelliteSystem.add(me.mainWorld);
					mw_planet.has_MW_as_sat = true;
					me.mainWorld.planet = mw_planet;
					me.mainWorld.isSatellite = true;
					me.mainWorld.hz_rel = mw_planet.hz_rel;
					mw_planet.satelliteSystem.generate();
					mw_planet.satelliteSystem.sort();
					break;
				}
			}
			else
				if(me.orbitSets[i].add(me.orbitSets[i].hz+mwOrbit, me.mainWorld))
				{
					mainWorldPlaced = true;
					break;
				}
		}
		if(!mainWorldPlaced)
			me.orbitSets[0].add(0, me.mainWorld); // Last resort: if somehow the main world has not been placed, put it in orbit 0

		me.mainWorld.system = me.name;
		me.mainWorld.tcs.generate();
	
		var ice_g = false;
		var orbit_set = 0;
		var max_orbit_set = me.orbitSets.length-1;
		var hz = parseInt(me.orbitSets[orbit_set].hz);
		for(i=0;i<me.mainWorld.gas_giants;i++)
		{
			var giant = new gasGiant(me.mainWorld);
			if(giant.type == "SGG")
			{
				giant.iceGiant = ice_g;
				ice_g = !ice_g;
			}
			giant.system = me.name;
			var pTable = new dice_table(giant.placementTable());
			var o = hz + parseInt(pTable.roll());
			while(!me.orbitSets[orbit_set].add(o,giant))
				orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;
			orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;
		}
		orbit_set = 0;
		for(i=0;i<me.mainWorld.belts;i++)
		{
			var belt = new minorWorld(planetoidsUWP, me.mainWorld);
			belt.system = me.name;
			var pbTable = new dice_table(BELT_PLACE_TABLE);
			var o = hz + parseInt(pbTable.roll());
			while(!me.orbitSets[orbit_set].add(o,belt))
				orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;
			belt.generate();
			orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;
		}
		orbit_set = 0;
		var numWorlds = me.mainWorld.worlds - me.mainWorld.belts - me.mainWorld.gas_giants - 1;
		for(i=0;i<numWorlds;i++)
		{
			if(i==me.mainWorld.worlds-1)
				var ppTable = new dice_table(WORLD2_PLACE_TABLE);
			else
				var ppTable = new dice_table(WORLD1_PLACE_TABLE);
			while(me.orbitSets[orbit_set].full())
				orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;
			var o = me.orbitSets[orbit_set].findClosestAvailable(ppTable.roll());
			var wpTable;
			if(o > hz-2 && o < hz+2)
				wpTable = new dice_table(WORLD_TYPE_HZ_PLANET);
			if(o < hz-1)
				wpTable = new dice_table(WORLD_TYPE_INNER_PLANET);
			if(o > hz+1)
				wpTable = new dice_table(WORLD_TYPE_OUTER_PLANET);
			var planet = new minorWorld(wpTable.roll(),me.mainWorld);
			planet.system = me.name;
			var success = false;
			do
			{
				success = me.orbitSets[orbit_set].add(o, planet);
				if(!success)
					orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;
			}
			while(!success);
			planet.generate();
			orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;
		}
		for(i=0;i<me.orbitSets.length;i++)
		{
			var set = me.orbitSets[i].orbits;
			for(var j=0;j<set.length;j++)
			{
				var planet = set[j].contents;
				if((planet.constructor.name == "mainWorld" || planet.constructor.name == "minorWorld") && planet.uwp.size == 0)
					continue;
				if(planet.constructor.name == "orbitSet")
					continue;
				if(planet.has_MW_as_sat)
					continue;
				planet.satelliteSystem = new satelliteOrbitSet(planet, me);
				planet.satelliteSystem.generate();
			}
		}
		currentWorld = me.mainWorld;
	}

	me.toTable = function()
	{
		var s = [];
		for(var i=0;i<me.orbitSets.length;i++)
			s.push(me.orbitSets[i].toTable());
		return s;
	}

	me.tofixedWidthText = function()
	{
		var s = "The " + me.mainWorld.name + " System (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")\r\n\r\n";
		me.orbitSets.map(function(i) { s += i.tofixedWidthText() + "\r\n"; });
		if(uPObj.prefs.download_world_detail)
			me.orbitSets.map(function(i) { s += i.tofixedWidthTextDetails() + "\r\n"; });
		return s;
	}

	me.toPlainHTML = function()
	{
		var s = "<body style='background-color:white'>";
		s += "<div class='transparent'>" + document.getElementById("symbol_map").innerHTML + "</div>";
		me.orbitSets.map(function(i) { s += i.toPlainHTML(); });
		if(uPObj.prefs.download_world_detail)
			me.orbitSets.map(function(i) { s += i.toPlainHTMLDetails(); });
		s += "</body>";
		return s;
	}

	me.toCSV = function()
	{
		var s = "";
		me.orbitSets.map(function(i) { s += i.toCSV(); });
		return s;
	}

	me.toSymbolMap = function()
	{
		while(me.symbolDiv.hasChildNodes())
			me.symbolDiv.removeChild(me.symbolDiv.childNodes[0]);
		var heading = document.createElement("H1");
		heading.innerHTML = "The " + me.mainWorld.name + " System (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")";
		me.symbolDiv.appendChild(heading);
		for(var i=0;i<me.orbitSets.length;i++)
			me.symbolDiv.appendChild(me.orbitSets[i].toSysTable());
		return me.symbolDiv;
	}

	me.dbObj = function()
	{
		var o = {};
		me.name = me.mainWorld.name ? (me.mainWorld.name + " system") : "Unnamed system";
		me.name += me.mainWorld.sector ? (" (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")") : "";
		o.name = me.name;
		o.seed = me.seed;
		o.mainWorld = me.mainWorld.dbObj();
		o.stars = me.stars.dbObj();
		o.primary = me.primary.dbObj();
		if(me.companion)
			o.companion = me.companion.dbObj();
		o.orbitSets = [];
		me.orbitSets.map(function(orbit_set)
							{
								o.orbitSets.push(orbit_set.dbObj());
							});
		return o;
	}

	me.read_dbObj = function(o)
	{
		me.name = o.name;
		me.seed = parseInt(o.seed);
		//mainWorld has to be read and generated to create a fullSystem class object, so these lines are deprecated
		//me.mainWorld = new mainWorld();
		//me.mainWorld.read_dbObj(o.mainWorld);
		me.stars = new starSystem(me.mainWorld)
		me.stars.read_dbObj(o.stars);
		me.primary = new star();
		me.primary.read_dbObj(o.primary);
		if(o.companion)
		{
			me.companion = new star();
			me.companion.read_dbObj(o.companion);
		}
		me.orbitSets = [];
		o.orbitSets.map(function(orbit_set_dbObj)
							{
								var orbit_set = new orbitSet(me.primary, me.companion, me.mainWorld, me);
								orbit_set.read_dbObj(orbit_set_dbObj);
								me.orbitSets.push(orbit_set);
							});
	}

	if(generate_now)
		me.generate();

}

var ORBIT_SET_COUNT = 0;

function orbitSet(centralStar, companionStar, mainWorld, systemObj)
{
	var me = this;
	me.centralStar = centralStar;
	if(me.centralStar) // necessary test because reading a db object needs to put this as null for orbit sets and THEN place star from data.
		me.centralStar.set = me;
	me.companionStar = companionStar;
	if(me.companionStar)
		me.companionStar.set = me;
	me.systemObj = systemObj;
	me.maxOrbit = 19;
	me.orbits = [];
	if(me.centralStar)
	{
		me.firstOrbit = me.centralStar.fao;
		me.hz = me.centralStar.hz;
	}
	me.zone = false;
	me.hz_rel = 0;
	me.description = "";
	me.tableName = "orbit_set_table_" + ORBIT_SET_COUNT++;
	me.mainWorld = mainWorld;
	
	me.symbolName = function()
	{
		return "sys_symbol_orbitSet";
	}
	
	me.backupName = function()
	{
		return "Secondary Star System";
	}

	me.dbObj = function()
	{
		var o = {};
		o.type = "orbitSet";
		o.centralStar = me.centralStar.dbObj();
		if(me.companionStar)
			o.companionStar = me.companionStar.dbObj();
		o.maxOrbit = me.maxOrbit;
		o.firstOrbit = me.firstOrbit;
		o.hz = me.hz;
		o.zone = me.zone;
		o.hz_rel = me.hz_rel;
		o.description = me.description;
		o.tableName = me.tableName;
		o.orbits = [];
		me.orbits.map(function(orb)
							{
								o.orbits.push(orb.dbObj());
							});
		return o;
	}

	me.read_dbObj = function(o)
	{
		me.centralStar = new star();
		me.centralStar.read_dbObj(o.centralStar);
		me.centralStar.getData();
		me.centralStar.set = me;
		if(o.companionStar)
		{
			me.companionStar = new star();
			me.companionStar.read_dbObj(o.companionStar);
			me.companionStar.getData();
			me.companionStar.set = me;
		}
		me.maxOrbit = o.maxOrbit;
		me.firstOrbit = o.firstOrbit;
		me.hz = o.hz;
		me.zone = o.zone;
		me.hz_rel = o.hz_rel;
		me.description = o.description;
		me.tableName = o.tableName;
		me.orbits = [];
		o.orbits.map(function(orbit_dbObj)
							{
								var c;
								switch(orbit_dbObj.contents.type)
								{
									case "mainWorld":
										c = me.mainWorld;
										break;
									case "minorWorld":
										c = new minorWorld(ALL_GENERATION_OBJECTS.find(function(v) { return v.name == orbit_dbObj.contents.generationObject.name}), me.mainWorld);
										c.read_dbObj(orbit_dbObj.contents);
										break;
									case "gasGiant":
										c = new gasGiant(me.mainWorld);
										c.read_dbObj(orbit_dbObj.contents);
										break;
									case "orbitSet":
										c = new orbitSet(me.centralStar, me.companionStar, me.mainWorld, me.systemObj);
										c.read_dbObj(orbit_dbObj.contents);
								}
								var on = orbit_dbObj.baseOrbit;
								me.setZone(c, on);
								var orb = new orbit(me, on , c);
								orb.read_dbObj(orbit_dbObj);
								me.orbits.push(orb);
							});
	}

	me.add = function(orbitNumber, contents)
	{
		if(me.full())
			return false;
		var increment = Math.round((orbitNumber - Math.floor(orbitNumber))*10);
		if(increment > 5)
		{
			orbitNumber++;
			increment -= 10;
		}			
		orbitNumber = me.findClosestAvailable(Math.floor(orbitNumber));
		me.setZone(contents, orbitNumber);
		me.orbits.push(new orbit(me, orbitNumber, contents, increment));
		return true;
	}

	me.setZone = function(contents, orbitNumber)
	{
		//if this orbitSet has been assigned a zone, it means it orbits around another star
		//so we choose the HOTTER hz_rel and zone values
		if(!me.zone)
			contents.hz_rel = orbitNumber - me.hz;
		else
			contents.hz_rel = Math.min(orbitNumber - me.hz, me.hz_rel);
		if(orbitNumber < me.hz-1)
			contents.zone = "I";
		if(orbitNumber > me.hz-2 && orbitNumber < me.hz+2)
			contents.zone = "H";
		if(orbitNumber > me.hz+1)
			contents.zone = "O";
		if(me.zone)
		{
			if(me.zone == "I" && (contents.zone == "O" || contents.zone == "H"))
				contents.zone = "I";
			if(me.zone == "H" && contents.zone == "O")
				contents.zone = "H";
		}
	}

	me.get = function(orbitNumber)
	{
		for(var i=0;i<me.orbits.length;i++)
			if(me.orbits[i].baseOrbit == orbitNumber)
				return me.orbits[i];
		return false;
	}

	me.orbitOccupied = function(orbitNum)
	{
		if(!me.orbitAvailable(orbitNum))
			return true;
		for(var i=0;i<me.orbits.length;i++)
			if(me.orbits[i].baseOrbit == orbitNum)
				return true;
		return false;
	}
	
	me.orbitAvailable = function(orbitNum)
	{
		if(orbitNum < me.firstOrbit || orbitNum > me.maxOrbit)
			return false;
		return true;		
	}

	me.findClosestAvailable = function(orbitNumber)
	{
		var closestOrbit = orbitNumber;
		var i = 0;
		while(me.orbitOccupied(closestOrbit))
		{
			i++;
			closestOrbit += i%2 == 0 ? i : -i;
		}
		return closestOrbit;
	}

	me.full = function()
	{
		return me.availableOrbitCount() < 1;
	}

	me.sortOrbits = function()
	{
		me.orbits.sort(function (a, b)
						{
							return a.number() - b.number();
						} );

	}

	me.toSysTable = function()
	{
		var table = document.createElement("TABLE");
		table.className = "sys sys_table";
		var rows = {baseOrbit:null, distance:null, symbol:null, name:null, uwp:null, satellites:null}
		var primary = me.centralStar.toSysCells();

		for(var p in rows)
		{
			rows[p] = document.createElement("TR");
			table.appendChild(rows[p]);
			rows[p].appendChild(primary[p]);
		}
		if(me.companionStar)
		{
			var companion = me.companionStar.toSysCells();
			for(var p in companion)
				rows[p].appendChild(companion[p]);
		}

		for(var i=0;i<me.orbits.length;i++)
		{
			var orbit_contents = me.orbits[i].toSysCells();
			for(var p in orbit_contents)
				rows[p].appendChild(orbit_contents[p]);
		}
		return table;
	}

	me.toTable = function()
	{
		SYSTEM_OBJECT_COUNT = 0;
		var setTable = document.createElement("TABLE");
		setTable.id = me.tableName;
		me.appendDataRows(setTable);
		return setTable;
	}

	me.updateTable = function()
	{
		var setTable = document.getElementById(me.tableName);
		var rows = setTable.childNodes;
		while(setTable.hasChildNodes())
			var u = setTable.removeChild(rows[0]);
		me.appendDataRows(setTable);
		me.systemObj.toSymbolMap();
		return setTable;
	}

	me.appendDataRows = function(setTable)
	{
		var headings = [{heading:"Orbit",minWidth:0},{heading:"",minWidth:"35pt"},{heading:"Decimal Orbit",minWidth:0},{heading:"",minWidth:"35pt"},
						{heading:"Orbital Distance",minWidth:"80pt"},{heading:"Name",minWidth:0},{heading:"Content Type",minWidth:"70pt"},{heading:"UWP",minWidth:0},
						{heading:"TCs and Remarks",minWidth:0},{heading:"",minWidth:0},{heading:"",minWidth:0},{heading:"Average Temperature",minWidth:0}];
		var hRow = document.createElement("TR");
		for(var i=0;i<headings.length;i++)
		{
			hCell = document.createElement("TH");
			hCell.className = "orbitSetHeader";
			hCell.style.minWidth = headings[i].minWidth;
			hCell.innerHTML = headings[i].heading;
			hRow.appendChild(hCell);
		}
		setTable.appendChild(hRow);
		setTable.appendChild(me.centralStar.toTableRow());
		if(me.companionStar && me.companionStar !== undefined)
			setTable.appendChild(me.companionStar.toTableRow());
		me.sortOrbits();
		for(i=0;i<me.orbits.length;i++)
		{
			setTable.appendChild(me.orbits[i].toTableRow());
			var satRows = me.orbits[i].satelliteRows();
			for(var j=0;j<satRows.length;j++)
				setTable.appendChild(satRows[j]);
		}
	}

	me.tofixedWidthText = function()
	{
		var s = "--------Orbit-------\r\n";
		s += "Base Actual Distance       Name                 Content Type    UWP       TCs and Remarks\r\n";
		s += me.centralStar.tofixedWidthText();
		if(me.companionStar !== undefined)
			s += me.companionStar.tofixedWidthText();
		me.orbits.map(function(i) { s += i.tofixedWidthText() + "\r\n"; });
		if(uPObj.prefs.download_world_detail)
			s += me.tofixedWidthTextDetails();
		return s;
	}

	me.tofixedWidthTextDetails = function()
	{
		var s = "";
		me.orbits.map(function(i)	{
										s += i.tofixedWidthTextDetails() + "\r\n";

									});
		return s;
	}

	me.toPlainHTML = function()
	{
		var s = "<table>";
		s += "<tr><th>Base Orbit</th><th>Decimal Orbit</th><th>Orbital Distance</th><th>Name</th><th>Content Type</th><th>UWP</th><th>TCs and Remarks</th>";
		s += "<th>Albedo</th><th>Greenhouse Multiplier</th><th>Average Temperature</th>";
		s += "</tr>";
		s += me.centralStar.toPlainHTML();
		if(me.companionStar !== undefined)
			s += me.companionStar.toPlainHTML();
		me.orbits.map(function(i) { s += i.toPlainHTML(); });
		s += "</table>";
		if(uPObj.prefs.download_world_detail)
			s += me.toPlainHTMLDetails();
		return s;
	}

	me.toPlainHTMLDetails = function()
	{
		var s = "";
		me.orbits.map(function(i) { s += "<table>" + i.toPlainHTMLDetails(); + "</table>"});
		return s;
	}

	me.toCSV = function()
	{
		var headings = ["Orbit", "Decimal Orbit", "Orbital Distance", "Name", "Content Type", "UWP","TCs and Remarks"]
		if(!uPObj.prefs.download_world_detail)
			headings = headings.concat(["Albedo","Greenhouse Multiplier","Average Temperature"]);
		else
			ALL_DETAILS.map(function(item) { if(item.name != "World Name") headings.push(item.name); });
		var s = headings.join(",") + "\r\n";
		s += me.centralStar.toCSV();
		if(me.companionStar !== undefined)
			s += me.companionStar.toCSV();
		me.orbits.map(function(i) { s += i.toCSV(); });
		return s;
	}

	me.toString = function()
	{
		return me.description + " (" + me.centralStar + ")";
	}

	me.orbitCount = function()
	{
		return me.maxOrbit - me.firstOrbit + 1;
	}

	me.availableOrbitCount = function()
	{
		return me.orbitCount() - me.orbits.length;
	}

	me.updateEdits = function()
	{
		if(me.orbit !== undefined)
		{
			me.orbits.map(function(o, i, a) { if(o.baseOrbit > (me.orbit.baseOrbit - 3)) a.splice(i,1); });
			me.updateTable();
		}
		return false;
	}
}

function satelliteOrbitSet(planet)
{
	var me = this;
	me.planet = planet;
	me.orbits = [];

	me.dbObj = function()
	{
		var o = {};
		var dbObj_orbits = [];
		me.orbits.map(function(orb)
		{
			dbObj_orbits.push(orb.dbObj());
		});
		o.sats = dbObj_orbits;
		return o;
	}

	me.read_dbObj = function(o)
	{
		me.orbits = [];
		var contents;
		o.sats.map(function(orbit_dbObj)
		{
			switch(orbit_dbObj.contents.type)
			{
				case "ring":
					contents = new ring(me.planet);
					break;
				case "minorWorld":
					var mw = me.planet.isMainWorld ? me.planet : me.planet.mainWorld;
					contents = new minorWorld(ALL_GENERATION_OBJECTS.find(function(v) { return v.name == orbit_dbObj.contents.generationObject.name}), (me.planet.isMainWorld ? me.planet : me.planet.mainWorld) , me.planet); //(genObject, mainWorld, planet)
					contents.read_dbObj(orbit_dbObj.contents);
					break;
				case "mainWorld":
					contents = me.planet.mainWorld;
					contents.planet = me.planet;
			}
			
			var orb = new orbit(me, orbit_dbObj.baseOrbit, contents); //orbitSet, orbitNumber, contents
			orb.read_dbObj(orbit_dbObj);
			me.orbits.push(orb);
		});
	}

	me.occupied = function(orb)
	{
		for(var i=0;i<me.orbits.length;i++)
			if(me.orbits[i].baseOrbit.o == orb.o)
				return true;
		return false;
	}

	me.add = function(satellite)
	{
		do
		{
			var satelliteOrbit = satellite.getSatelliteOrbit(me.orbits.length);
		}
		while(me.occupied(satelliteOrbit));
		me.orbits.push(new orbit(me, satelliteOrbit, satellite));
		if(satellite.constructor.name != "ring")
			satellite.tcs.generate();
	}

	me.sort = function()
	{
		me.orbits.sort(function (a,b) { return a.baseOrbit.m - b.baseOrbit.m } );
	}

	me.generate = function()
	{
            // in rare cases, the do loop will sometimes get stuck without exiting
            // so add a bail-out counter to eventually abort it
//            var loopCnt = 0;
            
//		do
//		{
			var numSats = me.planet.numSats();
			if(numSats == 0)
				me.add(new ring(planet));
//		}
//		while(numSats == 0 && loopCnt++ < 10)
		numSats = Math.max(numSats,0);
		for(var k=0;k<numSats;k++)
			me.add(me.planet.generateSat());
		me.sort();
	}

	me.updateEdits = function()
	{
		return false;
	}
}

function orbit(orbitSet, orbitNumber, contents, increment)
{
	var me = this;
	me.set = orbitSet;
	me.contents = contents;
	me.contents.orbit = me;
	me.baseOrbit = orbitNumber;
	me.isSatellite = me.baseOrbit.o !== undefined
	if(increment == 0 && contents.constructor.name != "mainWorld")
		me.increment = flux();
	else
		me.increment = increment;
	me.objectID = 0;
	
	me.dbObj = function()
	{
		return {baseOrbit:me.baseOrbit, increment:me.increment, isSatellite:me.isSatellite, contents:me.contents.dbObj()};
	}

	me.read_dbObj = function(o)
	{
		me.baseOrbit = o.baseOrbit;
		me.increment = o.increment;
		me.isSatellite = o.isSatellite;
	}

	me.number = function()
	{
		return Math.max(0,Math.round((me.baseOrbit + me.increment*0.1)*10)/10);
	}

	me.orbitDistance = function()
	{
		if(me.isSatellite)
		{
			return Math.round(me.baseOrbit.m*me.set.planet.diameter()/1.6);
		}
		else
		{
			var baseAU = ORBIT_DATA[me.baseOrbit].au;
			if(me.increment == 0)
				return baseAU;
			var n = me.increment > 0 ? baseAU + ORBIT_DATA[me.baseOrbit].incrUp*me.increment : baseAU + ORBIT_DATA[me.baseOrbit].incrDown*me.increment;
			n = Math.round(n*100)/100;
			return n;
		}
	}

	me.getCellClassName = function()
	{
		if(me.contents.hz_rel < -1)
			return "zoneInner";
		if(me.contents.hz_rel == -1)
			return "zoneWarm";
		if(me.contents.hz_rel == 0)
			return "zoneGoldilocks";
		if(me.contents.hz_rel == 1)
			return "zoneCold";
		if(me.contents.hz_rel > 1)
			return "zoneOuter";
	}

	me.calcRowContents = function()
	{
		var row_contents = [];
		switch(me.contents.constructor.name)
		{
			case "gasGiant":
				row_contents = [{name:"baseOrbit", contents:me.baseOrbit, isText:true},{name:"baseOrbitAdjBtns",contents:"", isText:true},
								{name:"decimalOrbit", contents:me.number(), isText:true},{name:"orbitAdjBtns",contents:"", isText:true},
								{name:"distance", contents:me.orbitDistance() + " AU", isText:true},{name:"name", contents:me.contents.nameTextBox(), isText:false},
								{name:"description",contents:me.contents.toString(), isText:true},
								{name:"uwp",contents:"Size: " + pseudoHex(me.contents.size), isText:true},
								{name:"tc",contents:""},{name:"details",contents:me.calcDetails(),isText:false},{name:"scrub",contents:me.scrub(),isText:false},{name:"temperature",contents:"", isText:true}];
				break;
			case "orbitSet":
				row_contents = [{name:"baseOrbit", contents:me.baseOrbit, isText:true},{name:"baseOrbitAdjBtns",contents:"", isText:true},
								{name:"decimalOrbit", contents:me.number(), isText:true},{name:"orbitAdjBtns",contents:"", isText:true},
								{name:"distance", contents:me.orbitDistance() + " AU", isText:true},{name:"name", contents:me.contents.centralStar.name, isText:true},
								{name:"description",contents:me.contents.description + " Star System", isText:true},
								{name:"uwp",contents:me.contents.toString(), isText:true},{name:"tc",contents:"", isText:true},
								{name:"details",contents:"",isText:true},{name:"scrub",contents:"",isText:true},{name:"temperature",contents:"", isText:true}];

				break;
			case "ring":
				row_contents = [{name:"baseOrbit", contents:"", isText:true},{name:"",contents:"", isText:true},
								{name:"decimalOrbit", contents:me.baseOrbit.o, isText:true},{name:"",contents:"", isText:true},
								{name:"distance", contents:me.orbitDistance() + " km", isText:true},{name:"name", contents:me.contents.nameTextBox(), isText:false},
								{name:"description",contents:"Ring System", isText:true},
								{name:"uwp",contents:"", isText:true},
								{name:"tc",contents:""},{name:"details",contents:"",isText:true},{name:"scrub",contents:me.scrub(),isText:false},{name:"temperature",contents:"", isText:true}];
				break;
			default:
				if(me.isSatellite)
				{
					var row_contents_a = [{name:"baseOrbit", contents:"", isText:true},{name:"",contents:"", isText:true},
											{name:"decimalOrbit", contents:me.baseOrbit.o, isText:true},{name:"",contents:"", isText:true},
											{name:"distance", contents:me.orbitDistance() + " km", isText:true}];
				}
				else
				{
					var row_contents_a = [{name:"baseOrbit", contents:me.baseOrbit, isText:true},{name:"baseOrbitAdjBtns",contents:"", isText:true},
											{name:"decimalOrbit", contents:me.number(), isText:true},{name:"orbitAdjBtns",contents:"", isText:true},
											{name:"distance", contents:me.orbitDistance() + " AU", isText:true}];
				}
				var row_contents_b = [{name:"name", contents:me.contents.nameTextBox(),isText:false},
								{name:"description",contents:me.contents.generationObject.name, isText:true},
								{name:"uwp",contents:me.contents.uwp, isText:true},{name:"tc",contents:me.contents.tcs, isText:true},
								{name:"details",contents:(me.contents.constructor.name == "ring" ? false : me.calcDetails()), isText:false},{name:"scrub",contents:me.scrub(),isText:false},
								{name:"temperature",contents:me.contents.calcTemperatureC() + "&deg;C", isText:true}];
				row_contents = row_contents_a.concat(row_contents_b);
		}

		return row_contents;
	}

	me.calcDetails = function()
	{
		var detailsBtn = document.createElement("BUTTON");
		detailsBtn.style.className = "btn2";
		detailsBtn.style.paddingBottom = "0";
		detailsBtn.style.paddingLeft = "0";
		detailsBtn.style.paddingRight = "0";
		detailsBtn.style.paddingTop = "0";

		detailsBtn.innerHTML = "Details";
		detailsBtn.onclick = function() { divsToShow(2); me.contents.editDetails(); };
		return detailsBtn;
	}
	
	me.scrub = function()
	{
		var scrubBtn = document.createElement("BUTTON");
		scrubBtn.style.className = "btn2";
		scrubBtn.style.paddingBottom = "0";
		scrubBtn.style.paddingLeft = "0";
		scrubBtn.style.paddingRight = "0";
		scrubBtn.style.paddingTop = "0";
		scrubBtn.innerHTML = "Scrub";
		scrubBtn.title = "That's EXTERMINATUS for all you 40k fans";
		scrubBtn.onclick = function()
		{
			tw_confirm("This will remove the selected orbit and its contents completely including any satellites.  This cannot be undone. Are you SURE?", scrub_exec); 
		}
		return scrubBtn;
	}
	
	function scrub_exec()
	{
		document.getElementById("myConfirm").style.display = "none";
		if(!me.isSatellite)
		{
			me.set.orbits.splice(me.set.orbits.findIndex(function(v){ return v.baseOrbit == me.baseOrbit; }),1);
			me.set.updateTable();
		}
		else
		{
			me.set.orbits.splice(me.set.orbits.findIndex(function(v){ return v.baseOrbit.o == me.baseOrbit.o; }),1);
			me.set.planet.orbit.set.updateTable();
		}		
	}

	me.toTableRow = function()
	{
		me.objectID = SYSTEM_OBJECT_COUNT++;
		var row_contents = me.calcRowContents();
		var row = document.createElement("TR");
		for(var i=0;i<row_contents.length;i++)
		{
			var cell = document.createElement("TD");
			cell.className = me.getCellClassName();
			cell.id = row_contents[i].name + me.objectID;
			var node;
			if(row_contents[i].isText)
				cell.innerHTML = row_contents[i].contents;
			else
				if(row_contents[i].contents)
					cell.appendChild(row_contents[i].contents);
			if(row_contents[i].name == "orbitAdjBtns")
			{
				cell.appendChild(me.orbitAdjustUpBtn("decimalOrbit" + me.objectID));
				cell.appendChild(me.orbitAdjustDownBtn("decimalOrbit" + me.objectID));
			}
			if(row_contents[i].name == "baseOrbitAdjBtns")
			{
				cell.appendChild(me.baseOrbitAdjustUpBtn("baseOrbit" + me.objectID));
				cell.appendChild(me.baseOrbitAdjustDownBtn("baseOrbit" + me.objectID));
			}
			row.appendChild(cell);
		}
		return row;
	}

	me.satelliteRows = function()
	{
		var satRows = [];
		if(!me.contents.satelliteSystem)
			return [];
		for(var i=0;i<me.contents.satelliteSystem.orbits.length;i++)
		{
			var x = me.contents.satelliteSystem.orbits[i];
			var sRow = document.createElement("TR");
			var sRowContents = x.calcRowContents();
			var cellClasses = ["satellite","satellite","satellite","satellite","satellite","orbitSetData","orbitSetData","orbitSetData","orbitSetData","orbitSetData","orbitSetData","orbitSetData","orbitSetData","orbitSetData"];
			x.objectID = SYSTEM_OBJECT_COUNT++;
			for(var k=0;k<sRowContents.length;k++)
			{
				cell = document.createElement("TD");
				if(sRowContents[k].isText)
					cell.innerHTML = sRowContents[k].contents;
				else
					if(sRowContents[k].contents)
						cell.appendChild(sRowContents[k].contents);
				cell.className = cellClasses[k];
				cell.id = sRowContents[k].name + x.objectID;
				sRow.appendChild(cell);
			}
			satRows.push(sRow);
		}
		return satRows;
	}

	me.updateTableRow = function()
	{
		var row_contents = me.calcRowContents();
		for(var i=0;i<row_contents.length;i++)
		{
			var cell = document.getElementById(row_contents[i].name + me.objectID);
			while(cell.hasChildNodes())
				cell.removeChild(cell.childNodes[0]);
			if(row_contents[i].isText)
				cell.innerHTML = row_contents[i].contents;
			else
				cell.appendChild(row_contents[i].contents);
			if(row_contents[i].name == "orbitAdjBtns")
			{
				cell.appendChild(me.orbitAdjustUpBtn("decimalOrbit" + me.objectID));
				cell.appendChild(me.orbitAdjustDownBtn("decimalOrbit" + me.objectID));
			}
			if(row_contents[i].name == "baseOrbitAdjBtns")
			{
				cell.appendChild(me.baseOrbitAdjustUpBtn("baseOrbit" + me.objectID));
				cell.appendChild(me.baseOrbitAdjustDownBtn("baseOrbit" + me.objectID));
			}
		}
		if(me.contents.satelliteSystem)
			for(var i=0;i<me.contents.satelliteSystem.orbits.length;i++)
			{
				var x = me.contents.satelliteSystem.orbits[i];
				var sRowContents = x.calcRowContents();
				for(var k=0;k<sRowContents.length;k++)
				{
					cell = document.getElementById(sRowContents[k].name + x.objectID);
					if(sRowContents[k].isText)
						cell.innerHTML = sRowContents[k].contents;
					else
						cell.appendChild(sRowContents[k].contents);
				}
			}
	}

	me.orbitAdjustUpBtn = function()
	{
		var upButton = document.createElement("BUTTON");
		upButton.type = "BUTTON";
		upButton.innerHTML = "&#x25B2;";
		upButton.className = "adjBtn";
		upButton.onclick = function()	{
											if(me.increment < 5)
											{
												me.increment++;
												if(me.contents.tcs)
													me.contents.tcs.generate();
												me.calcRowContents();
												me.set.updateTable();
												document.getElementById("orbit_text").innerHTML = me.number();
												me.contents.updateEdits();
											}
										};
		return upButton;
	}

	me.orbitAdjustDownBtn = function()
	{
		var downButton = document.createElement("BUTTON");
		downButton.type = "BUTTON";
		downButton.innerHTML = "&#x25BC;";
		downButton.className = "adjBtn";
		downButton.onclick = function()	{
											if(me.increment > -5)
											{
												me.increment--;
												if(me.contents.tcs)
													me.contents.tcs.generate();
												me.calcRowContents();
												me.set.updateTable();
												document.getElementById("orbit_text").innerHTML = me.number();
												me.contents.updateEdits();
											}
										};
		return downButton;
	}

	me.baseOrbitAdjustUpBtn = function()
	{
		var upButton = document.createElement("BUTTON");
		upButton.type = "BUTTON";
		upButton.innerHTML = "&#x25B2;";
		upButton.className = "adjBtn";
		upButton.onclick = function()
									{
										if(me.baseOrbit < 19)
										{
											var newBaseOrbit = me.baseOrbit + 1;
											if(me.set.orbitOccupied(newBaseOrbit))
											{
												var otherOrbit = me.set.get(newBaseOrbit);
												otherOrbit.baseOrbit = me.baseOrbit;
												me.set.setZone(otherOrbit.contents, otherOrbit.baseOrbit)
											}
											me.baseOrbit = newBaseOrbit;
											me.set.setZone(me.contents,me.baseOrbit);
											document.getElementById("orbit_text").innerHTML = me.number();
											if(me.contents.tcs)
												me.contents.tcs.generate();
											me.contents.updateEdits();
											me.set.updateTable();
										}
									};
		return upButton;
	}

	me.baseOrbitAdjustDownBtn = function()
	{
		var downButton = document.createElement("BUTTON");
		downButton.type = "BUTTON";
		downButton.innerHTML = "&#x25BC;";
		downButton.className = "adjBtn";
		downButton.onclick = function()
									{
										if(me.baseOrbit > 0)
										{
											var newBaseOrbit = me.baseOrbit - 1;
											if(me.set.orbitOccupied(newBaseOrbit))
											{
												var otherOrbit = me.set.get(newBaseOrbit);
												otherOrbit.baseOrbit = me.baseOrbit;
												me.set.setZone(otherOrbit.contents, otherOrbit.baseOrbit)
											}
											me.baseOrbit = newBaseOrbit;
											me.set.setZone(me.contents,me.baseOrbit);
											document.getElementById("orbit_text").innerHTML = me.number();
											if(me.contents.tcs)
												me.contents.tcs.generate();
											me.contents.updateEdits();
											me.set.updateTable();
										}
									};
		return downButton;
	}

	me.satOrbitSelector = function()
	{
		var satSelect = document.createElement("SELECT");
		satSelect.className = "worldDetails";
		SATELLITE_ORBIT_DATA.map(function(item,index)	{
															var opt = document.createElement("OPTION")
															opt.innerHTML = opt.value = item.o;
															satSelect.appendChild(opt);
														});
		satSelect.onchange = function()	{
											me.baseOrbit = SATELLITE_ORBIT_DATA.find(function(v) { return v.o == satSelect.value; });
											me.contents.tcs.generate();
											me.contents.rotationalPeriod(true);
											me.contents.dayPlus(true);
											me.contents.nightMinus(true);
											me.contents.getStress(true);
											if(me.contents.planet.constructor.name == "mainWorld" || me.contents.planet.constructor.name == "minorWorld")
												me.contents.planet.getStress(true);
											me.contents.updateEdits();
											me.updateTableRow();

										}
		return satSelect;
	}

	me.toSysCells = function()
	{
		var symbolData = {baseOrbit:me.baseOrbit, distance:me.orbitDistance() + " AU", uwp:(me.contents.uwp ? me.contents.uwp : me.contents.centralStar)};
		symbolData.symbol = me.contents.symbolName(); 
		symbolData.name = (!me.contents.name || me.contents.name == "") ? me.contents.backupName() : me.contents.name;

		var cells = {};
		for(var p in symbolData)
		{
			var cell = document.createElement("TD");
			cell.className = "sys_cell";
			var cell_contents;
			switch(p)
			{
				case "symbol":
					var cell_contents = document.createElement("DIV");
					cell_contents.className = "sys " + symbolData.symbol;
					break;
				default:
					var cell_contents = document.createElement("P");
					cell_contents.className = (p == "uwp" || p == "name" ? "sys_details" : "sys_orbit");
					cell_contents.innerHTML = symbolData[p];
					break;
			}
			cell.appendChild(cell_contents);
			cells[p] = cell;
		}
		cells.satellites = document.createElement("TD");
		cells.satellites.className = "sys_cell";
		cells.satellites.style.textAlign = "left";
		cells.satellites.style.verticalAlign = "top";
		if(me.contents.satelliteSystem)
		{
			me.contents.satelliteSystem.sort();
			for(var i=0;i<me.contents.satelliteSystem.orbits.length;i++)
				cells.satellites.appendChild(me.contents.satelliteSystem.orbits[i].toSysSatEntry());
		}
		return cells;
	}
	
	me.toSysSatEntry = function()
	{
		var symbolData = {uwp:(me.contents.uwp ? me.contents.uwp : "")};
		symbolData.symbol = me.contents.symbolName(); 
		symbolData.name = (!me.contents.name || me.contents.name == "") ? me.contents.backupName() : me.contents.name;
		
		var sDiv = document.createElement("DIV");
		sDiv.className = "sys " + symbolData.symbol;
		sDiv.style.fontSize = "1em";
		sDiv.style.textAlign = "left";
		sDiv.style.marginBottom = "0";
		sDiv.innerHTML = "<span class='sys_satellite_name'>" + symbolData.name + "</span><span class='sys_satellite_uwp'>" + symbolData.uwp + "</span>";
		return sDiv;
	}

	me.tofixedWidthText = function()
	{
		var s = pad(me.baseOrbit,5) + pad(me.number(),7) + pad(me.orbitDistance()+" AU",15);
		switch(me.contents.constructor.name)
		{
			case "gasGiant":
				s += pad(me.contents.name,21) + pad(me.contents.toString(),16);
				break;
			case "orbitSet":
				s += pad(me.contents.centralStar.name,21) + pad(me.contents.description + " StarSystem",16);
				break;
			default:
				s += pad(me.contents.name,21) + pad(me.contents.generationObject.name,16);
		}
		if(me.contents.uwp)
			s += pad(me.contents.uwp,10);
		if(me.contents.size)
			s += pad("Size: " + pseudoHex(me.contents.size),10);
		if(!me.contents.uwp && !me.contents.size)
			s += pad(me.contents.toString(),10);
		if(me.contents.tcs)
			s += pad(me.contents.tcs,30);
		if((me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld"))
		{
			s += " Albedo: " + me.contents.albedo();
			s += " Greenhouse: " + me.contents.greenhouse();
			s += " Avg Temp: " + me.contents.calcTemperatureC();
		}
		if(me.contents.satelliteSystem)
		{
			for(var j=0;j<me.contents.satelliteSystem.orbits.length;j++)
			{
				s += "\r\n";
				var x = me.contents.satelliteSystem.orbits[j];
				switch(x.contents.constructor.name)
				{
					case "ring":
						s += " ".repeat(5) + pad_left(x.baseOrbit.o,7) + pad_left(x.orbitDistance() + " km",14) + " ".repeat(22) + "Ring System";
						break;
					default:
						s += " ".repeat(5) + pad_left(x.baseOrbit.o,7) + pad_left(x.orbitDistance() + " km",14) + " " + pad(x.contents.name, 21);
						s += pad(x.contents.generationObject.name,16) + pad(x.contents.uwp,10) + pad(x.contents.tcs,30)
						s += " Albedo: " + x.contents.albedo() + " Greenhouse: " + x.contents.greenhouse() + " Avg Temp: " + x.contents.calcTemperatureC();
				}
			}
		}
		return s;
	}

	me.tofixedWidthTextDetails = function()
	{
		var s = "";
		if((me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld"))
			me.contents.all_details.map(function(item) { s += item.name + ": " + item.text_string() + "\r\n"; });
		if(me.contents.satelliteSystem)
		{
			var sats = me.contents.satelliteSystem.orbits;
			sats.map(function(i) { if(i.contents.constructor.name != "ring") i.contents.all_details.map(function(j) { s += j.name + ": " + j.text_string() + "\r\n"; }) });
			s += "\r\n";
		}
		return s;
	}

	me.toPlainHTML = function()
	{
		var s = "<tr>";
		s += "<td>" + me.baseOrbit + "</td>";
		s += "<td>" + me.number() + "</td>";
		s += "<td>" + me.orbitDistance() + " AU</td>";
		switch(me.contents.constructor.name)
		{
			case "gasGiant":
				s += "<td>" + me.contents.name + "</td>";
				s += "<td>" + me.contents.toString() + "</td>";
				break;
			case "orbitSet":
				s += "<td>" + me.contents.centralStar.name + "</td>";
				s += "<td>" + me.contents.description + " Star System</td>";
				break;
			default:
				s += "<td>" + me.contents.name + "</td>";
				s += "<td>" + me.contents.generationObject.name + "</td>";
		}
		if(me.contents.uwp)
			s += "<td>" + me.contents.uwp + "</td>";
		if(me.contents.size)
			s += "<td>Size: " + pseudoHex(me.contents.size) + "</td>";
		if(!me.contents.uwp && !me.contents.size)
			s += "<td>" + me.contents.toString() + "</td>";
		if(me.contents.tcs)
			s += "<td>" + me.contents.tcs + "</td>";
		if((me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld"))
		{
			s += "<td>" + me.contents.albedo() + "</td>";
			s += "<td>" + me.contents.greenhouse() + "</td>";
			s += "<td>" + me.contents.calcTemperatureC() + "</td>";
		}
		else
			s += "<td></td><td></td><td></td>";
		s += "</tr>";

		if(me.contents.satelliteSystem)
		{
			for(var i=0;i<me.contents.satelliteSystem.orbits.length;i++)
			{
				s += "<tr>";
				var x = me.contents.satelliteSystem.orbits[i];
				s += "<td></td><td style='font-style:italic;text-align:right'>" + x.baseOrbit.o + "</td>";
				s += "<td style='font-style:italic;text-align:right'>" + x.orbitDistance() + " km</td>";
				switch(x.contents.constructor.name)
				{
					case "ring":
						s += "<td></td><td>Ring System</td><td></td><td></td><td></td><td></td><td></td><td></td>";
						break;
					default:
						s += "<td>" + x.contents.name + "</td><td>" + x.contents.generationObject.name + "</td><td>";
						s += x.contents.uwp + "</td><td>" + x.contents.tcs + "</td>";
						s += "<td>" + x.contents.albedo() + "</td>" + "<td>" + x.contents.greenhouse() + "</td>" + "<td>" + x.contents.calcTemperatureC() + "</td>";
				}
				s += "</tr>";
			}
		}
		return s;
	}

	me.toPlainHTMLDetails = function()
	{
		var s = "";
		if((me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld"))
			me.contents.all_details.map(function(i) { s += "<tr><td>" + i.name + "</td><td>" + i.text_string() + "</td></tr>"; });
		s += "<tr></tr>";
		if(me.contents.satelliteSystem)
		{
			var sats = me.contents.satelliteSystem.orbits;
			sats.map(function(i) { if(i.contents.constructor.name != "ring") i.contents.all_details.map(function(j) { s += "<tr><td>" + j.name + "</td><td>" + j.text_string() + "</td></tr>"; }); } );
			s += "<tr></tr>";
		}
		return s;
	}

	me.toCSV = function()
	{
		var s = me.baseOrbit + "," + me.number() + "," + me.orbitDistance() + " AU,";
		switch(me.contents.constructor.name)
		{
			case "gasGiant":
				s += me.contents.name + "," + me.contents.toString() + ",";
				break;
			case "orbitSet":
				s += me.contents.centralStar.name + "," + me.contents.description + " Star System,";
				break;
			default:
				s += me.contents.name + "," + me.contents.generationObject.name + ",";
		}
		if(me.contents.uwp)
			s += me.contents.uwp + ",";
		if(me.contents.size)
			s += "Size: " + pseudoHex(me.contents.size) + ",";
		if(!me.contents.uwp && !me.contents.size)
			s += me.contents.toString() + ",";
		if(me.contents.tcs)
			s += me.contents.tcs + ",";
		if((me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld") && !uPObj.prefs.download_world_detail)
		{
			s += me.contents.albedo() + ",";
			s += me.contents.greenhouse() + ",";
			s += me.contents.calcTemperatureC();
		}
		if((me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld") && uPObj.prefs.download_world_detail)
			me.contents.all_details.map(function(item) { s += item.name == "World Name" ? "" : item.data_string().toString().replace(/,/g," ") + ","; });
		s += "\r\n";
		if(me.contents.satelliteSystem)
		{
			for(var j=0;j<me.contents.satelliteSystem.orbits.length;j++)
			{
				var x = me.contents.satelliteSystem.orbits[j];
				switch(x.contents.constructor.name)
				{
					case "ring":
						s += "," + x.baseOrbit.o + "," + x.orbitDistance() + " km,,Ring System\r\n";
						break;
					default:
						s += "," + x.baseOrbit.o + "," + x.orbitDistance() + " km," + x.contents.name + "," + x.contents.generationObject.name + "," + x.contents.uwp + "," + x.contents.tcs;
						if(!uPObj.prefs.download_world_detail)
							s += "," + x.contents.albedo() + "," + x.contents.greenhouse() + "," + x.contents.calcTemperatureC();
						else
							x.contents.all_details.map(function(item) { s += item.name == "World Name" ? "" : "," + ("" + item.data_string()).replace(/,/g," "); });
				}
				s += "\r\n";
			}
		}
		return s;
	}
}

function gasMix(world, irritantFlag)
{
	var me = this;
	me.world = world;
	me.mix = null;
	me.gasMixObjs = [];
	me.irritant = irritantFlag;

	me.assoc_liquid = function()
	{
		var liquids = [];
		for(var i=0;i<me.mix.gasses.length;i++)
		{
			var l = me.mix.gasses[i].assoc_liquid;
			if(l != LIQUID_H2O)
				liquids.push(l);
		}
		return liquids.length == 0 ? LIQUID_H2O : array_fnc.random.call(liquids);
	}


	me.description = function()
	{
		var s = "The atmosphere is composed of ";
		for(var i=0;i<me.mix.gasses.length-1;i++)
			s += me.mix.gasses[i].name + "(" + me.mix.gasses[i].proportion + "%), ";
		s = s.substr(0,s.length-2);
		s += " and " + me.mix.gasses[i].name + "(" + me.mix.gasses[i].proportion + "%). ";
		//me.mix.gasses.forEach(function (gas) { s += gas.notes + " "; } );
		return s;
	}

	me.getMix = function()
	{
		do
		{
			me.mix = array_fnc.random.call(me.gasMixObjs);
		}
		while(!me.mix.possible);
		var total_mix_left = 100;
		for(var i=0;i<me.mix.gasses.length;i++)
		{
			switch(me.world.uwp.atmos)
			{
				case 10:
					if(me.mix.gasses[i].corrosive)
						me.mix.gasses[i].proportion = rng(me.mix.gasses[i].corrosive)/10000;
					else
						me.mix.gasses[i].proportion = Math.min(total_mix_left, rng(100));
					total_mix_left -= me.mix.gasses[i].proportion;
					break;
				case 11:
					if(me.mix.gasses[i].inert)
						me.mix.gasses[i].proportion = Math.min(total_mix_left, rng(100));
					else
						if(me.mix.gasses[i].corrosive)
							me.mix.gasses[i].proportion = (me.mix.gasses[i].corrosive + rng(me.mix.gasses[i].insidious - me.mix.gasses[i].corrosive))/10000;
					total_mix_left -= me.mix.gasses[i].proportion;
					break;
				case 12:
					if(me.mix.gasses[i].inert)
						me.mix.gasses[i].proportion = Math.min(total_mix_left, rng(100));
					else
						me.mix.gasses[i].proportion = (me.mix.gasses[i].insidious + rng(7)*me.mix.gasses[i].insidious)/10000;
					total_mix_left -= me.mix.gasses[i].proportion;
					break;
			}
		}
		for(i=0;i<me.mix.gasses.length;i++)
			if(me.mix.gasses[i].inert)
				me.mix.gasses[i].proportion += total_mix_left;
		return me.mix;
	}

	// determines if a gas mix is only suitable for colder, larger worlds
	me.cold = function(gas_mix)
	{
		for(var i=0;i<gas_mix.length;i++)
			if(gas_mix[i].molecular_weight < 20)
				return true;
		return false;
	}

	for(var i=0;i<GAS_MIXES.length;i++)
	{
		var gasObj = {gasses:[],exotic:true,corrosive:false,insidious:false,possible:false};
		gasObj.gasses = GAS_MIXES[i];
		for(var j=0;j<gasObj.gasses.length;j++)
		{
			if(!gasObj.gasses[j].exotic)
				gasObj.exotic = false;
			if(gasObj.gasses[j].corrosive)
				gasObj.corrosive = true;
			if(gasObj.gasses[j].insidious)
				gasObj.insidious = true;
		}
		me.gasMixObjs.push(gasObj);
	}

	me.gasMixObjs.forEach( function(gas_mix) { if((me.world.uwp.atmos == 10 && gas_mix.exotic) || (me.world.uwp.atmos == 10 && gas_mix.corrosive && me.irritant) || (me.world.uwp.atmos == 11 && gas_mix.corrosive) || (me.world.uwp.atmos == 12 && gas_mix.insidious)) gas_mix.possible = true;} );
	me.gasMixObjs.forEach( function(gas_mix) { if(!me.world.tcs.has("Fr") && me.cold(gas_mix.gasses)) gas_mix.possible = false; } );
	me.getMix();
}

var portData = [
{type:"A", which:"starport", quality:"Excellent", refined:true, raw:true, yard:"starships", repairs:"A complete overhaul", downport:true},
{type:"B", which:"starport", quality:"Good", refined:true, raw:true, yard:"spacecraft", repairs:"A complete overhaul", downport:true},
{type:"C", which:"starport", quality:"Routine", refined:false, raw:true, yard:false, repairs:"Major repairs", downport:true},
{type:"D", which:"starport", quality:"Poor", refined:false, raw:true, yard:false, repairs:"Minor repairs", downport:true},
{type:"E", which:"starport", quality:"Frontier", refined:false, raw:false, yard:false, repairs:"No repairs", downport:"beacon"},
{type:"X", which:"starport", quality:"None", refined:false, raw:false, yard:false, repairs:"No repairs", downport:false},
{type:"F", which:"spaceport", quality:"Good", refined:false, raw:true, yard:false, repairs:"Minor repairs", downport:true},
{type:"G", which:"spaceport", quality:"Poor", refined:false, raw:true, yard:false, repairs:"Slight repairs", downport:true},
{type:"H", which:"spaceport", quality:"Basic", refined:false, raw:false, yard:false, repairs:"No repairs", downport:"beacon"},
{type:"Y", which:"spaceport", quality:"None", refined:false, raw:false, yard:false, repairs:"No repairs", downport:false}
];
function portDetails(world)
{
	var me = this;
	me.world = world;
	me.type = "";
	me.which = "";
	me.quality = "";
	me.which = "";
	me.refined = false;
	me.raw = false;
	me.radioact = false;
	me.antimatter = false;
	me.collector = false;
	me.yard = "";
	me.repairs = "";
	me.downport = true;
	me.highport = false;
	
	me.generate = function()
	{
		var data = portData.find(function(v) { return v.type == me.world.uwp.port; });
		for(var d in data)
			me[d] = data[d];
		me.highport = me.genHighPort();
		me.radioact = me.genRadioAct();
		me.antimatter = me.genAntiMatter();
		me.collector = me.genCollector();
	}
	
	me.genHighPort = function()
	{
		switch(me.type)
		{
			case "A":
				return me.world.uwp.popul >= 7;
			case "B":
				return me.world.uwp.popul >= 8;
			case "C":
				return me.world.uwp.popul >= 9;
			default:
				return false;
		}
	}
	
	me.genRadioAct = function()
	{
		switch(me.type)
		{
			case "A":
			case "B":
				return me.world.uwp.TL >= 8;
			default:
				return false;
		}
	}
	
	me.genAntiMatter = function()
	{
		switch(me.type)
		{
			case "A":
			case "B":
				return me.world.uwp.TL >= 18;
			default:
				return false;
		}
	}
	
	me.genCollector = function()
	{
		switch(me.type)
		{
			case "A":
			case "B":
				return me.world.uwp.TL >= 14;
			default:
				return false;
		}		
	}
	
	me.generate();
}
