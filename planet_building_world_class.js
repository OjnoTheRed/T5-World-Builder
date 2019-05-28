var SYSTEM_OBJECT_COUNT = 0;
var MAIN_WORLD_HZ_ONLY = false;
var MAIN_WORLD_IS_SAT = false;
var MAIN_WORLD_NOT_SAT = false;
var TZ_NO_SAT = false;
var BARREN_SYS = false;
var NAME_TABLE_WIDTH = "70pt";
var DOWNLOAD_WORLD_DETAIL = true;
var ALL_DETAILS = [];

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
		var world_details_div = document.getElementById("world_detail");
		world_details_div.hidden = false;
		me.updateEdits(world_details_div);
		all_details.map(function(item, index)	{ 
													var elem = document.getElementById(item.id);
													elem.onchange = function()	{
																					item.update(elem.value); 
																					me.updateEdits(world_details_div);
																					me.isSatellite ? me.planet.orbit.set.updateTable() : me.orbit.set.updateTable();
																				};
												});
		var uwp_elem = document.getElementsByName("uwp");
		for(var i=0;i<uwp_elem.length;i++)
			uwp_elem[i].onchange = function()	{	me.uwp.update(this.id,this.value);
													me.updateEdits(world_details_div);
													me.orbit.set.updateTable();
												};		
		document.getElementById("tcs").innerHTML = me.tcs;		
		var cX_div = document.getElementById("cX");
		var eX_div = document.getElementById("eX");
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
																				};
													
												});
			updateCultureDescription(); 
			eX_div.hidden = false;
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
		}
		else
		{
			cX_div.hidden = true;
			eX_div.hidden = true;
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
												me.orbit.baseOrbit.o = orbSatSel.value; 
												me.orbit.calcRowContents(); 
												me.orbit.set.planet.orbit.set.updateTable(); 
											};
		}
		
		RESOURCES_ALL.map(function(item,index)	{
													var elem = document.getElementById(item.id);
													elem.onchange = function()	{
																					elem.checked ? me.resources().add(item) : me.resources().erase(item);
																					me.updateEdits(world_details_div);
																				};
												});
	}

	me.updateEdits = function(editDiv)
	{
		me.tcs.has("Tz") ? document.getElementById("tz_msg").hidden = false : document.getElementById("tz_msg").hidden = true;
		me.tcs.has("Lk") ? document.getElementById("lk_msg").hidden = false : document.getElementById("lk_msg").hidden = true;
		all_details.map(function(item, index)	{ 
													var elem = editDiv.ownerDocument.getElementById(item.id);
													switch(elem.tagName)
													{
														case "P":
															elem.innerHTML = item.contents();
															break;
														case "INPUT":
														case "SELECT":
															elem.value = item.contents();
															break;
													}
												
												});
		var uwp_edits = editDiv.ownerDocument.getElementsByName("uwp");
		for(var i=0;i<uwp_edits.length;i++)
			uwp_edits[i].value = me.uwp[uwp_edits[i].id];
		
		var resource_edits = editDiv.ownerDocument.getElementsByName("resource");
		for(i=0;i<resource_edits.length;i++)
			resource_edits[i].checked = me.resources().has(resource_edits[i].id);
		
		var tempTbl = document.getElementById("temperatureTbl");
		if(tempTbl)
			editDiv.removeChild(tempTbl);
		tempTbl = me.temperatureTblHTML(true);
		if(tempTbl)
		{
			tempTbl.id = "temperatureTbl";
			editDiv.appendChild(tempTbl);
		}
		me.economicExt.update();
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
			s += a + "G: " + new intraSystemTravel({ d:d, a:a, t:false }).timeString() + (lineBreaks ? "<br />" : "; ");
		return s;
	}
	
	me.symbol = function()
	{
		var symbol = {baseOrbit:me.orbit.baseOrbit, distance:me.orbit.orbitDistance() + " AU", uwp:me.uwp.toString()};
		symbol.symbol = (me.uwp.size == 0 && (me.generationObject.name == "Planetoids" || me.constructor.name == "mainWorld")) ? "sys_symbol_belt" : (me.isMainWorld ? "sys_symbol_main_world" : "sys_symbol_minor_world");
		symbol.name = me.name == "" ? me.generationObject.name : me.name;
		return symbol;
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
		if(me.tcs.has("Tz") && TZ_NO_SAT)
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
	me.seasonSummerPlus = function(reCalc)
	{
		if(arguments.length < 1)
			reCalc = false;
		if(SEASON_SUMMER_PLUS && !reCalc)
			return SEASON_SUMMER_PLUS;
		SEASON_SUMMER_PLUS = me.axialTilt()*0.6;
		return SEASON_SUMMER_PLUS;
	}
	
	var SEASON_WINTER_MINUS;
	me.seasonWinterMinus = function(reCalc)
	{
		if(arguments.length < 1)
			reCalc = false;
		if(SEASON_WINTER_MINUS && !reCalc)
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
	me.rotationalPeriod = function(reCalc)
	{
		if(arguments.length < 1)
			reCalc = false;
		if(ROTATIONAL_PERIOD && !reCalc)
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
	me.dayPlus = function(reCalc)
	{
		if(arguments.length < 1)
			reCalc = false;
		if(DAY_PLUS_TEMP && !reCalc)
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
	me.nightMinus = function(reCalc)
	{
		if(arguments.length < 1)
			reCalc = false;
		if(NIGHT_MINUS_TEMP && !reCalc)
			return NIGHT_MINUS_TEMP;
		NIGHT_MINUS_TEMP = 0;
		if(me.tcs.has("Tz"))
		{
			NIGHT_MINUS_TEMP = me.maxNightMinus();
			return NIGHT_MINUS_TEMP;
		}
		NIGHT_MINUS_TEMP = Math.max(me.maxNightMinus(),Math.abs(me.rotationalPeriod())/2*me.atmosPressureTable().night_minus);
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
	me.getStress = function(reCalc)
	{
		if(arguments.length < 1)
			reCalc = false;
		if(STRESS_FACTOR && !reCalc)
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
	me.temperatureTbl = function(reCalc)
	{
		if(arguments.length < 1)
			reCalc = false;
		if(TEMP_TABLE && !reCalc)
			return TEMP_TABLE;
		TEMP_TABLE = [];
		var seasonTbl = me.getSeasonTable();
		var latitudeTbl = me.latitudeAdj();
		for(var i=0;i<seasonTbl.length;i++)
		{
			TEMP_TABLE[i] = {	row:i, 
								avg:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i]) + "&deg;C", 
								summer:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + seasonTbl[i]*me.seasonSummerPlus()) + "&deg;C", 
								winter:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] - seasonTbl[i]*me.seasonWinterMinus()) + "&deg;C",
								avg_day:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + me.dayPlus(reCalc)) + "&deg;C", 
								avg_night:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + me.nightMinus(reCalc)) + "&deg;C", 
								summer_day:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + seasonTbl[i]*me.seasonSummerPlus() + me.dayPlus(reCalc)) + "&deg;C",
								summer_night:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] + seasonTbl[i]*me.seasonSummerPlus() + me.nightMinus(reCalc)) + "&deg;C", 
								winter_day:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] - seasonTbl[i]*me.seasonWinterMinus() + me.dayPlus(reCalc)) + "&deg;C", 
								winter_night:me.boundTemp(me.calcTemperatureC() + latitudeTbl[i] - seasonTbl[i]*me.seasonWinterMinus() + me.nightMinus(reCalc)) + "&deg;C" };
		}
		return TEMP_TABLE;
	}
	
	me.boundTemp = function(temperature)
	{
		return Math.round(Math.min(me.maxDayPlus() + me.calcTemperatureC(), Math.max(temperature, me.calcTemperatureC() + me.maxNightMinus())));
	}
	
	me.temperatureTblHTML = function(reCalc)
	{
		if(arguments.length < 1)
			reCalc = false;
		if(me.uwp.size == 0)
			return null;
		var tempTable = document.createElement("TABLE");
		var hdrRow = document.createElement("TR");
		var metaData;
		if(me.tcs.has("Tz"))
		{
			metaData = [{title:"Night Side Temperature", contents:(me.calcTemperatureC() + me.maxNightMinus()) + "&deg;C"},
						{title:"Twilight Zone Temperature", contents:me.calcTemperatureC() + "&deg;C"},
						{title:"Day Side Temperature", contents:(me.maxDayPlus() + me.calcTemperatureC()) + "&deg;C"}];
			
		}
		else
		{
			metaData = [{title:"Row",contents:"row"},
						{title:"Average Temperature",contents:"avg"},
						{title:"Spring / Autumn Day",contents:"avg_day"},
						{title:"Spring / Autumn Night",contents:"avg_night"},
						{title:"Summer Temperature",contents:"summer"},
						{title:"Summer Day",contents:"summer_day"},
						{title:"Summer Night",contents:"summer_night"},
						{title:"Winter Temperature",contents:"winter"},
						{title:"Winter Day",contents:"winter_day"},
						{title:"Winter Night",contents:"winter_night"}];			
		}
		var tempData = me.temperatureTbl(reCalc);
		if(tempData[0].row == 0)
			tempData.reverse();
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
		
	function clearAll()
	{
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
		//commenting these out for now because we do not want to change temperature related stuff each time we generate - user can edit temperature via orbit
		//CALC_GREEN_HOUSE = false;
		//CLOUDINESS = false;
		//NUM_WORLD_HEXES = false;
		//WATER_COVERAGE = false;
		//ICE_CAP_COVERAGE = false;
		//LAND_ALBEDO = false;
		//LAND_COVERAGE = false;
		//CLOUD_ALBEDO_INDEX = false;
		//CALC_ALBEDO = false;
		WORLD_DIAMETER = false;
	}
	
	var all_details = [
	{id:"world_name_edit",units:function() {return false},name:"World Name",contents:function() { return (me.name ? me.name : ("Unnamed " + me.generationObject.name)) },validate:function(s) { return s != ""; }, text_string:function() { return me.name;} ,update:function(v) {me.name = v;}, data_string:function() { return me.name; } },
	{id:"orbit_text", units:function() {return false}, name:"Orbit",contents:function() { return me.isSatellite ? me.orbit.baseOrbit.o : me.orbit.number(); }, text_string:function() { return me.isSatellite ? me.orbit.baseOrbit.o : me.orbit.number();}, data_string:function() { return this.text_string(); }},
	{id:"orbit_distance", units:function() { return (me.isSatellite ? "km" : "AU"); }, name:"Orbital Distance",contents:function() { return me.orbit.orbitDistance() + (me.isSatellite ? " km" : " AU"); }, text_string:function() { return me.orbit.orbitDistance() + (me.isSatellite ? " km" : " AU"); }, data_string:function() { return me.orbit.orbitDistance(); } },
	{id:"diameter_edit", units:function() { return "km"; }, name:"Diameter", contents:function() { return me.diameter(); }, validate:function(s){ return !isNaN(parseInt(s)) && parseInt(s) < 1.61*(me.uwp.size*1000 + 500) && parseInt(s) > 1.61*(me.uwp.size*1000 - 500);}, text_string:function() {return me.diameter() + " km"},update:function(v) { WORLD_DIAMETER = v; }, data_string:function() { return me.diameter(); }},
	{id:"jump_point_edit", units:function() { return "km"; }, name:"Jump Point distance", contents:function() { return me.jumpPoint(); }, validate:function() { return true; }, text_string:function() { return me.jumpPoint() + " km" }, update:function() { me.jumpPoint(); }, data_string:function() { return me.jumpPoint(); }},
	{id:"jump_point_times",units:function() { return false; }, name:"Time to Jump Point at ...", contents:function() { return me.jumpPointTimes(); }, validate:function() { return true; }, text_string:function() { return me.jumpPointTimes(false); }, update:function() { me.jumpPointTimes(); }, data_string:function() { return this.text_string(); } },
	{id:"density_type",units:function() { return false; }, name:"Density Type", contents:function() { return me.densityType().name }, validate:function() {return [WORLD_DENSITY_HEAVY_CORE_TABLE.name, WORLD_DENSITY_MOLTEN_CORE_TABLE.name, WORLD_DENSITY_ROCKY_BODY_TABLE.name, WORLD_DENSITY_ICY_BODY_TABLE.name]; }, text_string:function() { return me.densityType().name }, update:function(v) { DENSITY_TYPE = WORLD_DENSITY_TYPES_ALL.find(function(x) { return x.name == v; }) }, data_string:function() { return this.text_string(); }	},
	{id:"density_edit",units:function() { return "Earth"; }, name:"Density", contents:function() { return me.density() }, validate:function(s) { return !isNaN(parseFloat(s)) }, text_string:function() { return me.density() + " Earth"; }, update:function(v) { WORLD_DENSITY = v; }, data_string:function() { return me.density(); } },
	{id:"mass_text",units:function() { return "Earth"; },name:"Mass", contents:function() { return me.mass() },  validate:null, text_string:function() { return me.mass() + " Earth" }, update:null, data_string:function() { return me.mass(); } }, 
	{id:"gravity_text",units:function() { return "G"; },name:"Surface Gravity (G)", contents:function() { return me.gravity() },  validate:function(s) { return !isNaN(parseFloat(s));}, text_string:function() { return me.gravity() + " G"}, update:null, data_string:function() { return me.gravity(); } },
	{id:"rotational_period_edit",units:function() { return "hours"; }, name:"Rotation Period", contents:function() { if(me.tcs.has("Tz") || me.tcs.has("Lk")) document.getElementById(this.id).readOnly = true; else document.getElementById(this.id).readOnly = false; return me.rotationalPeriod(); }, validate:function(s) { return !isNaN(parseFloat(s));}, text_string:function() { return rotationPeriodString()}, update:function(v) { ROTATIONAL_PERIOD = v; me.lockCheck(); }, data_string:function() { return me.rotationalPeriod(); } },
	{id:"orbital_period_text",units:function() { return "years"; }, name:"Orbital Period", contents:function() { return orbitalPeriodString(); },  validate:function(s) { return !isNaN(parseFloat(s));}, text_string:function() { return orbitalPeriodString()}, update:null, data_string:function() { return me.orbitalPeriod(); } },
	{id:"tilt_edit",units:function() { return "degrees"; }, name:"Axial Tilt", contents:function() { return me.axialTilt() }, validate:function(s) { return !isNaN(parseInt(s));}, text_string:function() { return me.axialTilt() & "&deg;"}, update:function(v) { AXIAL_TILT = v; }, data_string:function() { return me.axialTilt(); }},
	{id:"atmos_pressure_edit",units:function() { return "Atmospheres"; }, name:"Surface Atmospheric Pressure", contents:function() { return me.atmosPressure() }, validate:function(s) { return !isNaN(parseFloat(s)); }, text_string:function() { return me.atmosPressure() + "Atm" }, update:function(v) { ATMOS_PRESSURE = v; }, data_string:function() { return me.atmosPressure(); }},
	{id:"atmos_compo_edit",units:function() { return false; }, name:"Atmosphere Composition", contents:function() { return me.atmosComposition() }, validate:function(s) { return s != "" }, text_string:function() { return me.atmosComposition()}, update:function(v) { ATMOS_COMPOSITION = v }, data_string:function() { return me.atmosComposition(); }},
	{id:"albedo_edit",units:function() { return false; }, name:"Albedo", contents:function() { return me.albedo() }, validate:function(s) { return !isNaN(parseInt(s)) }, text_string:function() { return me.albedo().toString() }, update:function(v) { CALC_ALBEDO = v; }, data_string:function() { return me.albedo(); } },
	{id:"greenhouse_edit",units:function() { return false; }, name:"Greenhouse", contents:function() { return me.greenhouse() }, validate:function(s) { return !isNaN(parseInt(s)) }, text_string:function() { return me.greenhouse().toString() }, update: function(v) { CALC_GREEN_HOUSE = v }, data_string:function() { return me.greenhouse(); } },
	{id:"base_world_temp_text",units:function() { return "degrees Celsius"; }, name:"Base Surface Temperature", contents:function() { return me.calcTemperatureC() + "&deg;C";},  validate:null, text_string:function() { return Math.round(me.calcTemperatureC()) + "&deg;C"}, update:function() {me.calcTemperatureC()}, data_string:function() { return me.calcTemperatureC(); } },
	{id:"average_day_temp_text",units:function() { return "degrees Celsius"; }, name:"Base Daytime temperature", contents:function() { return Math.round(me.calcTemperatureC() + me.dayPlus()) + "&deg;C"; },  validate:null, text_string:function() { return Math.round(me.calcTemperatureC() + me.dayPlus()) + "&deg;C"}, update:function() { me.dayPlus(); }, data_string:function() { return Math.round(me.calcTemperatureC() + me.dayPlus()); } },
	{id:"average_night_temp_text",units:function() { return "degrees Celsius"; }, name:"Base Nighttime temperature", contents:function() { return Math.round(me.calcTemperatureC() + me.nightMinus())  + "&deg;C";},  validate:null, text_string:function() { return Math.round(me.calcTemperatureC() + me.nightMinus()) + "&deg;C"}, update:function() { me.nightMinus() }, data_string:function() { return Math.round(me.calcTemperatureC() + me.nightMinus()); } },
	{id:"summer_increase_text",units:function() { return "degrees Celsius"; }, name:"Summer temperature increase", contents:function() { return Math.round(me.seasonSummerPlus(true))  + "&deg;C";},  validate:null, text_string:function() { return Math.round(me.seasonSummerPlus(true)) + "&deg;C"}, update:function() { me.seasonSummerPlus(); }, data_string:function() { return Math.round(me.seasonSummerPlus(false)); } },
	{id:"winter_decrease_text",units:function() { return "degrees Celsius"; }, name:"Winter temperature decrease", contents:function() { return Math.round(me.seasonWinterMinus(true))  + "&deg;C";},  validate:null, text_string:function() { return Math.round(me.seasonWinterMinus()) + "&deg;C"}, update:function() { me.seasonWinterMinus() }, data_string:function() { return Math.round(me.seasonWinterMinus()); } },
	{id:"highest_day_temperature_text",units:function() { return "degrees Celsius"; }, name:"Upper Temperature Limit", contents:function() { return Math.round(me.calcTemperatureC() + me.maxDayPlus())  + "&deg;C";},  validate:null, text_string:function() { return Math.round(me.calcTemperatureC() + me.maxDayPlus()) + "&deg;C"}, update:function() { me.maxDayPlus(); }, data_string:function() { return Math.round(me.calcTemperatureC() + me.maxDayPlus()); } },
	{id:"coldest_night_temperature_text",units:function() { return "degrees Celsius"; }, name:"Lower Temperature Limit", contents:function() { return Math.round(me.calcTemperatureC() + me.maxNightMinus())  + "&deg;C";},  validate:null, text_string:function() { return Math.round(me.calcTemperatureC() + me.maxNightMinus()) + "&deg;C"}, update:function() { me.maxNightMinus() }, data_string:function() { return Math.round(me.calcTemperatureC() + me.maxNightMinus()); } },
	{id:"hydro_perc_edit",units:function() { return "Percentage"; }, name:"Hydrographic Percentage", contents:function() { return me.getHydroPercentage() + "%";}, validate:function(s) { return !isNaN(parseInt(s))}, text_string:function() { return me.getHydroPercentage() + "%"}, update:function(v) { HYDRO_PERCENTAGE = v; }, data_string:function() { return me.getHydroPercentage(); }},
	{id:"liq_comp_edit",units:function() { return false; }, name:"Surface Liquid Composition", contents:function() { return me.getFluid() }, validate:function() { return true; }, text_string:function() { return me.getFluid(); }, update:function(v) { FLUID_DETAIL = v }, data_string:function() { return me.getFluid(); } },
	{id:"native_life_select",units:function() { return false; }, name:"Native Life", contents:function() { return me.nativeLife() ? "Yes" : "No" }, update:function(v) { v == "Yes" ? NATIVE_LIFE = true : NATIVE_LIFE = false }, text_string:function() { return me.nativeLife() ? "Yes" : "No" }, data_string:function() { return me.nativeLife() ? "Yes" : "No"; }},
	{id:"native_int_life_text",units:function() { return false; }, name:"Native Intelligent Life", contents:function() { me.nativeIntLife.generate(); return me.nativeIntLife.toString() }, update:function() { me.nativeIntLife.generate(); }, text_string:function() { me.nativeIntLife.generate(); return me.nativeIntLife.toString(); }, data_string:function() { me.nativeIntLife.generate(); return me.nativeIntLife.toString(); } },
	{id:"seismic_edit",units:function() { return false; }, name:"Seismic Stress", contents:function() { return me.getStress() }, validate:function(s) { return !isNaN(parseInt(s)); }, text_string:function() { return "Stress factor is " + me.getStress() + "<br />Occurence of a volcanic eruption or earthquake in a 24-hour period:<br />Formidable (4D) < " + (me.getStress() - 4) + "<br /><b>Note:</b> DM -2 if on a Volcano hex, DM -2 if on a fault line."}, update:function(v) { STRESS_FACTOR = v; }, data_string:function() { return me.getStress(); }}
	];
	
	all_details.map(function(item, index) { ALL_DETAILS[index] = item.name; });
	
	me.all_details = all_details;
	
	var cX_details = [
		{id:"cX_H", adj_id:"cX_H_adj", name:"Heterogeneity",contents:function() { return me.culturalExt.homogeneity; }, text_string:function() { return HOMOGENEITY_DESCRIPTIONS[me.culturalExt.homogeneity].tm; }, data_string:function() { return pseudoHex(me.culturalExt.homogeneity); }, update:function(v) { me.culturalExt.homogeneity = parseInt(v); updateCultureDescription(); } },
		{id:"cX_A", adj_id:"cX_A_adj", name:"Acceptance",contents:function() { return me.culturalExt.acceptance; }, text_string:function() { return ACCEPTANCE_DESCRIPTIONS[me.culturalExt.acceptance].tm; }, data_string:function() { return pseudoHex(me.culturalExt.acceptance); }, update:function(v) { me.culturalExt.acceptance = parseInt(v); updateCultureDescription(); } },
		{id:"cX_St", adj_id:"cX_St_adj", name:"Strangeness",contents:function() { return me.culturalExt.strangeness; }, text_string:function() { return STRANGENESS_DESCRIPTIONS[me.culturalExt.strangeness].tm; }, data_string:function() { return pseudoHex(me.culturalExt.strangeness); }, update:function(v) { me.culturalExt.strangeness = parseInt(v); updateCultureDescription(); } },
		{id:"cX_Sy", adj_id:"cX_Sy_adj", name:"Symbols",contents:function() { return me.culturalExt.symbols; }, text_string:function() { return ""; }, data_string:function() { return pseudoHex(me.culturalExt.symbols); }, update:function(v) { me.culturalExt.symbols = parseInt(v); updateCultureDescription(); } }	
	];
	
	var eX_details = [
		{id:"eX_R", name:"Resources",contents:function() { return me.economicExt.resources; }, data_string:function(){ return pseudoHex(me.economicExt.resources); }, update:function(v) { me.economicExt.resources = parseInt(v); } },
		{id:"eX_L", name:"Labor",contents:function() { return me.economicExt.labour; }, data_string:function() { return pseudoHex(me.economicExt.labour); }, update:function(v) { me.economicExt.labour = parseInt(v); } },
		{id:"eX_I", name:"Infrastructure",contents:function() { return me.economicExt.infrastructure; }, data_string:function() { return pseudoHex(me.economicExt.infrastructure); }, update:function(v) { me.economicExt.infrastructure = parseInt(v); } },
		{id:"eX_E", name:"Efficiency",contents:function() { return me.economicExt.efficiency; }, data_string:function() { return "" + me.economicExt.efficiency > -1 ? "+" + me.economicExt.efficiency : me.economicExt.efficiency; }, update:function(v) { me.economicExt.efficiency = parseInt(v); } }	
	];
	
	function updateCultureDescription()
	{
		var elem = document.getElementById("cX_description");
		elem.innerHTML = me.culturalExt.statement();
	}
	
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
		o.atmosPressure = me.atmosPressure();
		o.atmosComposition = me.atmosComposition();
		o.albedo = me.albedo();
		o.greenhouse = me.greenhouse();
		o.hydroPercentage = me.getHydroPercentage();
		o.surfaceLiquid = me.getFluid();
		o.nativeLife = me.nativeLife();
		o.stressFactor = me.getStress();
		o.standardSeed = me.standardSeed;		
		o.populLimit = me.populLimit;
		o.isSatellite = me.isSatellite;
		o.zone = me.zone;
		o.system = me.isMainWorld ? me.name : me.mainWorld.name;
		o.sector = me.sector;
		o.hex = me.hex;
		if(me.satelliteSystem)
			o.satelliteSystem = me.satelliteSystem.dbObj();
		return o;
	}
	
	me.read_dbObj = function(o)
	{
		me.name = o.name;
		me.isMainWorld = o.isMainWorld;
		me.standardSeed = o.standardSeed;
		me.generationObject = ALL_GENERATION_OBJECTS.find(function(v) { return v.name == o.generationObject });
		me.populLimit = o.populLimit;
		WORLD_DIAMETER = o.diameter;
		DENSITY_TYPE = WORLD_DENSITY_TYPES_ALL.find(function(x) { return x.name == o.densityType; });
		WORLD_DENSITY = o.density;
		ROTATIONAL_PERIOD = o.rotationalPeriod;
		AXIAL_TILT = o.axialTilt;
		ATMOS_PRESSURE = o.atmosPressure;
		ATMOS_COMPOSITION = o.atmosComposition;
		CALC_ALBEDO = o.albedo;
		CALC_GREEN_HOUSE = o.greenhouse;
		HYDRO_PERCENTAGE = o.hydroPercentage;
		FLUID_DETAIL = o.surfaceLiquid;
		NATIVE_LIFE = o.nativeLife;
		STRESS_FACTOR = o.stressFactor
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
			me.satelliteSystem = new satelliteOrbitSet(me);
			me.satelliteSystem.read_dbObj(o.satelliteSystem);
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
}

/*
function worldResources_old(world)
{
	var me = this;
	me.world = world;
	me.resourceList = [];
	
	me.generate = function()
	{
		for(var i=0;i<RESOURCES_ALL.length;i++)
		{
			var n = 0;
			var numObj = RESOURCES_ALL[i].number;
			switch(me.world.densityType())
			{
				case "Heavy Core":
				case "Molten Core":
					n += numObj.molten;
					break;				
				case "Rocky Body":
					n += numObj.rocky;
					break;
				case "Icy Body":
					n += numObj.icy;
					break;
			}
			if(me.world.uwp.atmos > 3 && me.world.uwp.atmos < 10)
				n += numObj.atmos_good;
			else
				n += numObj.atmos_bad;
			switch(me.world.uwp.popul)
			{
				case 0:
				case 1:
				case 2:
				case 3:
				case 4:
					n += numObj.pop_low;
					break;
				default:
					n += numObj.pop_good;
			}
			switch(me.world.uwp.TL)
			{
				case 0:
				case 1:
				case 2:
				case 3:
					n += numObj.tl_low;
					break;
				case 4:
				case 5:
				case 6:
					n += numObj.tech_low_mid;
					break;
				case 7:
				case 8:
				case 9:
				case 10:
				case 11:
					n += numObj.tech_up_mid;
					break;
				default:
					n += numObj.tech_hi;
			}
			if(me.world.nativeLife())
				n += numObj.life;
			else
				n += numObj.no_life;
			if(dice(2) <= n)
				me.resourceList.push(RESOURCES_ALL[i]);
		}
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
}
*/

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
	me.iX = 0;
	me.economicExt = new eX(me);
	me.culturalExt = new cX(me);
	me.noblesExt = new nobles(me);
	me.worlds = 0;
	me.allegiance = "Im";
	me.stars = new starSystem(me);
	me.standardSeed = "";
		
	me.buildQuery = function()
	{
		var newURL, url = window.location.href;
		var queryEnd = url.indexOf("?");
		if(queryEnd != -1)
			newURL = url.substring(0,queryEnd);
		else
			newURL = url;
		newURL += me.buildGet();
		return newURL;
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
		newURL += "&" + encodeURIComponent("iX") + "=" + encodeURIComponent(me.iX);
		newURL += "&" + encodeURIComponent("eX") + "=" + encodeURIComponent(me.economicExt);
		newURL += "&" + encodeURIComponent("cX") + "=" + encodeURIComponent(me.culturalExt);
		newURL += "&" + encodeURIComponent("nobz") + "=" + encodeURIComponent(me.noblesExt);
		newURL += "&" + encodeURIComponent("worlds") + "=" + encodeURIComponent(me.worlds);
		newURL += "&" + encodeURIComponent("allegiance") + "=" + encodeURIComponent(me.allegiance);
		newURL += "&" + encodeURIComponent("stellar") + "=" + encodeURIComponent(me.stars);
		newURL += "&" + encodeURIComponent("seed") + "=" + encodeURIComponent(me.standardSeed);
		newURL += "&" + encodeURIComponent("genMissData") + "=" + encodeURIComponent(0);
		return newURL;
	}
	
	me.generate = function()
	{
		me.uwp.createUWP();
		me.tcs.generate();
		me.popMulti = me.uwp.popul == 0 ? 0 : rng(9);
		me.belts = Math.max(0, dice(1)-3);
		me.gas_giants = Math.max(0, Math.floor(dice(2)/2-2));
		me.bases.generate();
		me.generateIx();
		me.economicExt.generate(); //NB: depends on generateIx
		me.culturalExt.generate();
		me.noblesExt.generate();
		me.nativeLife();
		me.nativeIntLife.generate();
		me.worlds = dice(2);
		me.stars.generate();
		me.system = me.name;
	}
		
	me.generateIx = function()
	{
		me.iX = 0;
		if(me.uwp.port == "A" || me.uwp.port == "B")
			me.iX++;
		if(me.uwp.port == "D" || me.uwp.port == "E" || me.uwp.port == "X")
			me.iX--;
		if(me.uwp.TL >= 16)
			me.iX++;
		if(me.uwp.TL >= 10)
			me.iX++;
		if(me.uwp.TL <= 8)
			me.iX--;
		if(me.tcs.has("Ag"))
			me.iX++;
		if(me.tcs.has("Hi"))
			me.iX++;
		if(me.tcs.has("In"))
			me.iX++;
		if(me.tcs.has("Ri"))
			me.iX++;
		if(me.uwp.popul <= 6)
			me.iX--;
		if(me.bases.has("Naval") && me.bases.has("Scout"))
			me.iX++;
		if(me.bases.has("Way Station"))
			me.iX++;
	}
	
	me.toString = function()
	{
		var s = pad(me.hex,5);
		s += pad(me.name,21);
		s += me.uwp + " ";
		s += pad(me.tcs,41);
		s += pad((" { " + me.iX + " } "),7);
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

	me.readString = function(s)
	{
		me.hex = s.substr(0,4);
		me.name = s.substr(5,20);
		me.uwp = new uwp(null,me);
		me.uwp.readUWP(s.substr(26,9));
		me.tcs = s.substr(36,40).trim().split(" ");
		me.iX = parseInt(s.substr(79,2).trim());
		if(isNaN(me.iX))
			me.iX = 0;
		me.economicExt = new eX(me);
		me.economicExt.readString(s.substr(84,7));
		me.culturalExt = new cX(me);
		me.culturalExt.readString(s.substr(92,6));
		me.noblesExt = new nobles(me);
		me.noblesExt.readString(s.substr(99,5));
		me.basesPresent = new bases(me);
		me.basesPresent.readString(s.substr(105,2).trim());
		me.travelZone = s.substr(108,1);
		me.popMulti = parseInt(s.substr(110,1));
		me.belts = parseInt(s.substr(111,1));
		me.gas_giants = parseInt(s.substr(112,1));
		me.worlds = parseInt(s.substr(114,2).trim());
		me.allegiance = s.substr(117,4);
		me.stars.readString(s.substr(122));
		me.nativeIntLife.generate();
	}
	
	me.readTabDelimited = function(s)
	{
		var dataArray = s.split("\t");
		me.hex = dataArray[2];
		me.name = dataArray[3];
		me.uwp = new uwp(null,me);
		me.uwp.readUWP(dataArray[4]);
		me.basesPresent = new bases(me);
		me.basesPresent.readString(dataArray[5].trim());
		me.tcs = new tcs(me);
		me.tcs.readString(dataArray[6].trim());
		me.travelZone = dataArray[7];
		me.popMulti = parseInt(dataArray[8].substr(0,1));
		me.belts = parseInt(dataArray[8].substr(1,1));
		me.gas_giants = parseInt(dataArray[8].substr(2,1));
		me.allegiance = dataArray[9];
		me.stars.readString(dataArray[10]);
		me.iX = parseInt(dataArray[11].substr(2,2));
		if(isNaN(me.iX))
			me.iX = 0;
		me.economicExt = new eX(me);
		me.economicExt.readString(dataArray[12]);
		me.culturalExt = new cX(me);
		me.culturalExt.readString(dataArray[13]);
		me.noblesExt = new nobles(me);
		me.noblesExt.readString(dataArray[14]);
		me.worlds = parseInt(dataArray[15].trim());
		me.nativeIntLife.generate();
	}

	me.readDataObj = function(dataObj)
	{
		me.subSector = dataObj.ss;
		me.hex = dataObj.hex;
		me.name = dataObj.name;
		me.uwp = new uwp(null,me);
		me.uwp.readUWP(dataObj.uwp);
		me.basesPresent = new bases(me);
		me.basesPresent.readString(dataObj.bases);
		me.tcs = new tcs(me);
		me.tcs.readString(dataObj.remarks);
		me.travelZone = dataObj.zone;
		me.popMulti = parseInt(dataObj.pbg.substr(0,1));
		if(isNaN(me.popMulti))
			me.popMulti = 1;
		me.belts = parseInt(dataObj.pbg.substr(1,1));
		if(isNaN(me.belts))
			me.belts = 0;
		me.gas_giants = parseInt(dataObj.pbg.substr(2,1));
		if(isNaN(me.gas_giants))
			me.gas_giants = 0;
		me.allegiance = dataObj.allegiance;
		me.stars.readString(dataObj.stars);
		me.iX = parseInt(dataObj.ix.substr(2,2));
		if(isNaN(me.iX))
			me.iX = 0;
		me.economicExt = new eX(me);
		me.economicExt.readString(dataObj.ex);
		me.culturalExt = new cX(me);
		me.culturalExt.readString(dataObj.cx);
		me.noblesExt = new nobles(me);
		me.noblesExt.readString(dataObj.nobility);
		me.worlds = parseInt(dataObj.w);
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
		o.iX = me.iX;
		o.worlds = me.worlds;
		o.allegiance = me.allegiance;
		o.economicExt = me.economicExt.dbObj();
		o.culturalExt = me.culturalExt.dbObj();
		o.noblesExt = me.noblesExt.toString();
		o.stars = me.stars.dbObj();
		o.bases = me.bases.toString();
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
		me.iX = o.iX;
		me.worlds = o.worlds;
		me.allegiance = o.allegiance;
		me.economicExt = new eX();
		me.economicExt.read_dbObj(o.economicExt);
		me.culturalExt = new cX();
		me.culturalExt.read_dbObj(o.culturalExt);
		me.noblesExt = new nobles();
		me.noblesExt.readString(o.noblesExt);
		me.stars = new starSystem();
		me.stars.read_dbObj(o.stars);
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
		me.standardSeed = me.mainWorld.standardSeed;
	}
	
	me.generate = function()
	{
		me.uwp.createUWP();
		if(BARREN_SYS && me.populLimit == 0 && me.mainWorld.uwp.popul == 0)
		{
			me.uwp.popul = 0;
			me.uwp.gov = 0;
			me.uwp.law = 0;
			me.uwp.TL = 0;
		}
		me.tcs.generate();
		me.nativeLife();
		me.nativeIntLife.generate();
		me.economicExt.generate();
	}
	
	me.buildGet = function()
	{
		var newURL = "?" + encodeURIComponent("hex") + "=" + encodeURIComponent(me.mainWorld.hex);
		newURL += "&" + encodeURIComponent("sector") + "=" + encodeURIComponent(me.mainWorld.sector);
		newURL += "&" + encodeURIComponent("name") + "=" + encodeURIComponent(me.name);
		newURL += "&" + encodeURIComponent("system") + "=" + encodeURIComponent(me.mainWorld.name + " (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")");
		newURL += "&" + encodeURIComponent("uwp") + "=" + encodeURIComponent(me.uwp);
		newURL += me.tcs.toURI();
		newURL += "&" + encodeURIComponent("seed") + "=" + encodeURIComponent(me.standardSeed);
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
	
	me.symbol = function()
	{
		var symbol = {baseOrbit:me.orbit.baseOrbit, distance:me.orbit.orbitDistance() + " AU", uwp:me.uwp, symbol:"sys_symbol_" + me.type};
		symbol.name = me.name == "" ? me.toString() : (me.name + "<br />(" + me.toString() + ")");
		return symbol;
	}
	
	me.numSats = function()
	{
		if((me.orbit.baseOrbit == 0 || me.orbit.baseOrbit == 1) && TZ_NO_SAT)
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

}

function ring(planet)
{
	var me = this;
	me.name = "";
	me.inheritFrom = world;
	me.inheritFrom();
	me.planet = planet;
	me.isSatellite = true;
	
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
		me.classes = [];
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
				me.infrastructure = Math.max(0, dice(1) + me.world.iX);
			if(!me.world.tcs.has("Ba") && !me.world.tcs.has("Lo") && !me.world.tcs.has("Ni"))
				me.infrastructure = Math.max(0,dice(2) + me.world.iX);
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
			if(me.resources === undefined)
			{
				me.resources = dice(2);
				if(me.world.uwp.TL > 7)
					me.resources += me.world.belts + me.world.gas_giants;
			}
			me.labour = Math.max(0,me.world.uwp.popul - 1);
			if(me.infrastructure === undefined)
			{
				if(me.world.tcs.has("Ba"))
					me.infrastructure = 0;
				if(me.world.tcs.has("Lo"))
					me.infrastructure = 1;
				if(me.world.tcs.has("Ni"))
					me.infrastructure = Math.max(0, dice(1) + me.world.iX);
				if(!me.world.tcs.has("Ba") && !me.world.tcs.has("Lo") && !me.world.tcs.has("Ni"))
					me.infrastructure = Math.max(0,dice(2) + me.world.iX);
			}
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
		if(s=="")
			return;
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
		me.acceptance = Math.max(1,me.world.uwp.popul + me.world.iX);
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
		if(s=="")
			return;
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
	
	me.statement = function()
	{
		var s = me.world.name + "'s culture is ";
		s += HOMOGENEITY_DESCRIPTIONS[me.homogeneity].tm + ", ";
		s += ACCEPTANCE_DESCRIPTIONS[me.acceptance].tm + ", and ";
		s += STRANGENESS_DESCRIPTIONS[me.strangeness].tm + ".  ";
		s += "It could also be described as ";
		s += HOMOGENEITY_DESCRIPTIONS[me.homogeneity].js + ", ";
		s += ACCEPTANCE_DESCRIPTIONS[me.acceptance].js + ", and ";
		s += STRANGENESS_DESCRIPTIONS[me.strangeness].js + ".  ";
		s += "Generated by adding a flux roll to Technology Level, symbols are broadly interpreted here as a society's general adoption of technology.  ";
		s += "For example, a society with a TL of 8 but a Symbols rating of 5 has the technological capability to create computers but they are not adopted into ";
		s += "the daily symbols used by that society.  This society has a symbols rating of " + me.symbols + " and a technology level of " + me.world.uwp.TL + ".  ";
		s += "This indicates the society is broadly " + (me.symbols > me.world.uwp.TL ? "looking ahead of" : (me.symbols < me.world.uwp.TL ? "not yet coping with" : "comfortable with"));
		s += " its available technology.  "
		s += "The following symbols are the highest level of symbols possibly used by that society: ";
		s += SYMBOLS_DESCRIPTIONS.find(function(symbolObj) { return symbolObj.level_low <= me.symbols && symbolObj.level_high >= me.symbols; }).symbols;
		return s;
	}
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
	}
}

var nobleKnight = {name:"Knight",code:"B",rule:function(world) { return true; } };
var nobleBaronet = {name:"Baronet",code:"c",rule:function(world) { return world.tcs.has("Pa") || world.tcs.has("Pr"); } };
var nobleBaron = {name:"Baron",code:"C",rule:function(world) { return world.tcs.has("Ag") || world.tcs.has("Ri"); } };
var nobleMarquis = {name:"Marquis",code:"D",rule:function(world) { return world.tcs.has("Pi"); } };
var nobleViscount = {name:"Viscount",code:"e",rule:function(world) { return world.tcs.has("Ph"); } };
var nobleCount =  {name:"Count",code:"E",rule:function(world) { return world.tcs.has("In") || world.tcs.has("Hi"); } };
var nobleDuke = {name:"Duke",code:"f",rule:function(world) { return world.iX >= 4; } };
var nobleCapitalDuke = {name:"Duke (capital)",code:"F",rule:function(world) { return world.tcs.has("Cp"); } };

var allNobles = [nobleKnight, nobleBaronet, nobleBaron, nobleMarquis, nobleViscount, nobleCount, nobleDuke, nobleCapitalDuke ];


var STAR_COUNT = 0;
function star(world, isPrimary)
{
	var me = this;
	me.world = world;
	me.spectral_class = "";
	me.spectral_size = "";
	me.isPrimary = isPrimary;
	me.isCloseCompanion = false;
	me.primary_class_flux = 0;
	me.primary_size_flux = 0;
	me.name = "";
	me.id = STAR_COUNT++;
	
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
					me.spectral_class += rng(10)-1;
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
		me.radii = data.radii;
		me.radius = data.radii*695700;
		me.jump_point = me.radius*200;
		me.mass = data.mass;
		me.luminosity = data.luminosity;
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
		if(me.spectral_class == "BD")
			return "BD";
		return (me.spectral_class + " " + me.spectral_size);
	}
	
	me.toTableRow = function()
	{
		var row = document.createElement("TR");
		var orb = me.isCloseCompanion ? "Companion" : "Primary";
		var contents = [orb,"","","","",me.nameTextBox(),"Star",me.toString(),"Radii (Sol): " + me.radii + "  Mass (Sol): " + me.mass + "  Luminosity (Sol): " + me.luminosity];
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
	
	me.nameTextBox = function()
	{
		var textInput = document.createElement("INPUT");
		textInput.setAttribute("type","text");
		textInput.width = NAME_TABLE_WIDTH;
		textInput.id = "STAR_NAME_" + me.id;
		textInput.value = me.name;
		textInput.onchange = function() { me.name = textInput.value; me.orbit.set.systemObj.toSymbolMap(); };
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
		return {name:me.name, spectral_size:me.spectral_size, spectral_class:me.spectral_class};
	}
	
	me.read_dbObj = function(o)
	{
		for(var p in o)
			me[p] = o[p];
	}
}

function starSystem(world)
{
	var me = this;
	me.world = world;
	me.stars = [];
	me.companions = [];
	
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
		me.stars = [];
		me.companions = [];
		var starStrings = s.match(/([OBAFGKM]\d\s(Ia|Ib|IV|V?I{0,3}|D))|(BD)(\s?})|(\s{0,1})(D)/g);
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
}

function fullSystem(mainWorldObj, generate_now)
{
	var me = this;
	me.mainWorld = mainWorldObj;
	me.stars = me.mainWorld.stars;
	me.primary = me.stars.stars[0];
	me.companion = me.stars.companions[0];	
	me.orbits = new orbitSet(me.primary, me.companion, me.mainWorld, me);
	me.orbitSets = [me.orbits];
	me.name = me.mainWorld.name ? me.mainWorld.name + " system" : "Unnamed system";
	me.name += me.mainWorld.sector ? (" (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")") : "";
	me.loadKey = null;
	me.totalAvailOrb = 0;
	
	if(arguments.length < 2)
		generate_now = true;
	
	me.generate = function()
	{
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
		var orbitsNeeded = parseInt(me.mainWorld.gas_giants) + parseInt(me.mainWorld.belts) + parseInt(me.mainWorld.worlds) + 1;
		if(MAIN_WORLD_IS_SAT && me.mainWorld.uwp.size != 0)
			me.mainWorld.tcs.add("Sa");
		if(!MAIN_WORLD_IS_SAT && !MAIN_WORLD_NOT_SAT && me.mainWorld.uwp.size != 0)
		{
			mwSatTbl = new dice_table(MAIN_WORLD_SATELLITE_TABLE);
			var mwType = mwSatTbl.roll()
			if(mwType == "Sa" || mwType == "Lk")
			{
				me.mainWorld.tcs.add("Sa");
				me.mainWorld.isSatellite = true;
			}
			if(mwType == "Lk")
				me.mainWorld.tcs.add("Lk");
		}
		if(me.mainWorld.isSatellite)
			orbitsNeeded--;
		if(orbitsNeeded > me.totalAvailOrb)
		{
			var numObjNerfed = orbitsNeeded - me.totalAvailOrb;
			if(numObjNerfed <= me.mainWorld.worlds)
				me.mainWorld.worlds -= numObjNerfed;
			else
			{
				numObjNerfed -= me.mainWorld.worlds;
				me.mainWorld.worlds = 0;
				if(numObjNerfed <= me.mainWorld.belts)
					me.mainWorld.belts -= numObjNerfed;
				else
				{
					numObjNerfed -= me.mainWorld.belts;
					me.mainWorld.belts = 0;
					if(numObjNerfed <= me.mainWorld.gas_giants)
						me.mainWorld.gas_giants -= numObjNerfed;
				}
			}
		}
		var mainWorldPlaced = false;
		if(!MAIN_WORLD_HZ_ONLY)
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
			if(me.mainWorld.tcs.has("Sa"))
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
					mw_planet.satelliteSystem = new satelliteOrbitSet(mw_planet);
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
			var pbTable = new dice_table(BELT_PLACE_TABLE);
			var o = hz + parseInt(pbTable.roll());
			while(!me.orbitSets[orbit_set].add(o,belt))
				orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;		
			belt.generate();
			orbit_set == max_orbit_set ? orbit_set=0 : orbit_set++;
		}
		orbit_set = 0;
		for(i=0;i<me.mainWorld.worlds;i++)
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
				planet.satelliteSystem = new satelliteOrbitSet(planet);
				planet.satelliteSystem.generate();
			}
		}
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
		if(DOWNLOAD_WORLD_DETAIL)
			me.orbitSets.map(function(i) { s += i.tofixedWidthTextDetails() + "\r\n"; });
		return s;
	}
	
	me.toPlainHTML = function()
	{
		var s = "<body style='background-color:white'>";
		s += "<div class='transparent'>" + document.getElementById("symbol_map").innerHTML + "</div>";
		me.orbitSets.map(function(i) { s += i.toPlainHTML(); });
		if(DOWNLOAD_WORLD_DETAIL)
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
		map = document.getElementById("symbol_map");
		while(map.hasChildNodes())
			map.removeChild(map.childNodes[0]);
		var heading = document.createElement("H1");
		heading.innerHTML = "The " + me.mainWorld.name + " System (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")";
		map.appendChild(heading);
		for(var i=0;i<me.orbitSets.length;i++)
			map.appendChild(me.orbitSets[i].toSysTable());
		return map;
	}
	
	me.dbObj = function()
	{
		var o = {};
		o.name = me.name;
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
		me.mainWorld = new mainWorld();
		me.mainWorld.read_dbObj(o.mainWorld);
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
	me.companionStar = companionStar;
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
		if(o.companionStar)
		{
			me.companionStar = new star();
			me.companionStar.read_dbObj(o.companionStar);
			me.companionStar.getData();
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
										c = new minorWorld(null, me.mainWorld); //genObject, mainWorld, planet
										break;
									case "gasGiant":
										c = new gasGiant(me.mainWorld);
										break;
									case "orbitSet":
										c = new orbitSet(null,null, me.mainWorld, me.systemObj);
								}
								if(orbit_dbObj.contents.type != "mainWorld") c.read_dbObj(orbit_dbObj.contents);
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
		orbitNumber = me.findClosestAvailable(orbitNumber);
		contents.systemOrbit = orbitNumber;
		me.setZone(contents, orbitNumber);
		me.orbits.push(new orbit(me, orbitNumber, contents));
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
		if(orbitNum < me.firstOrbit || orbitNum > me.maxOrbit)
			return true;
		for(var i=0;i<me.orbits.length;i++)
			if(me.orbits[i].baseOrbit == orbitNum)
				return true;
		return false;
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
						{heading:"TCs and Remarks",minWidth:0},{heading:"",minWidth:0},{heading:"",minWidth:0},{heading:"Albedo",minWidth:0},
						{heading:"Greenhouse multiplier",minWidth:0},{heading:"Average Temperature",minWidth:0}];
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
		if(me.companionStar !== undefined)
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
		if(DOWNLOAD_WORLD_DETAIL)
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
		if(DOWNLOAD_WORLD_DETAIL)
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
		if(!DOWNLOAD_WORLD_DETAIL)
			headings = headings.concat(["Albedo","Greenhouse Multiplier","Average Temperature"]);
		else
			ALL_DETAILS.map(function(item) { if(item != "World Name") headings.push(item); });
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
	
	me.symbol = function()
	{
		var symbol = {baseOrbit:me.orbit.baseOrbit, distance:me.orbit.orbitDistance(), uwp:me.toString(), symbol:"sys_symbol_orbitSet", name:""};
		return symbol;
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
					contents = new minorWorld(null, (me.planet.isMainWorld ? me.planet : me.planet.mainWorld) , me.planet); //(genObject, mainWorld, planet)
					break;
				case "mainWorld":
					contents = me.planet.mainWorld;
					contents.planet = me.planet;
			}
			contents.read_dbObj(orbit_dbObj.contents);
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
		do
		{
			var numSats = me.planet.numSats();
			if(numSats == 0)
				me.add(new ring(planet));
		}
		while(numSats == 0)
		numSats = Math.max(numSats,0);
		for(var k=0;k<numSats;k++)
			me.add(me.planet.generateSat());
		me.sort();
	}	
}

function orbit(orbitSet, orbitNumber, contents)
{
	var me = this;
	me.set = orbitSet;
	me.contents = contents;
	me.contents.orbit = me;
	me.baseOrbit = orbitNumber;
	me.isSatellite = me.baseOrbit.o !== undefined
	me.increment = flux();
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
			return Math.round(me.baseOrbit.m*me.set.planet.diameter());
		}
		else
		{
			var baseAU = ORBIT_DATA[me.baseOrbit].au;
			if(me.number == me.baseOrbit)
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
								{name:"tc",contents:""},{name:"mapLink",contents:"", isText:true},{name:"details",contents:"",isText:true},{name:"albedo",contents:"", isText:true},
								{name:"greenhouse",contents:"", isText:true},{name:"temperature",contents:"", isText:true}];
				break;
			case "orbitSet":
				row_contents = [{name:"baseOrbit", contents:me.baseOrbit, isText:true},{name:"baseOrbitAdjBtns",contents:"", isText:true},
								{name:"decimalOrbit", contents:me.number(), isText:true},{name:"orbitAdjBtns",contents:"", isText:true},
								{name:"distance", contents:me.orbitDistance() + " AU", isText:true},{name:"name", contents:me.contents.centralStar.name, isText:true}, 
								{name:"description",contents:me.contents.description + " Star System", isText:true}, 
								{name:"uwp",contents:me.contents.toString(), isText:true},{name:"tc",contents:"", isText:true},
								{name:"mapLink",contents:"", isText:true},{name:"details",contents:"",isText:true},{name:"albedo",contents:"", isText:true},
								{name:"greenhouse",contents:"", isText:true},{name:"temperature",contents:"", isText:true}];

				break;
			case "ring":
				row_contents = [{name:"baseOrbit", contents:"", isText:true},{name:"",contents:"", isText:true},
								{name:"decimalOrbit", contents:me.baseOrbit.o, isText:true},{name:"",contents:"", isText:true},
								{name:"distance", contents:me.orbitDistance() + " km", isText:true},{name:"name", contents:me.contents.nameTextBox(), isText:false}, 
								{name:"description",contents:"Ring System", isText:true}, 
								{name:"uwp",contents:"", isText:true},
								{name:"tc",contents:""},{name:"mapLink",contents:"", isText:true},{name:"details",contents:"",isText:true},{name:"albedo",contents:"", isText:true},
								{name:"greenhouse",contents:"", isText:true},{name:"temperature",contents:"", isText:true}];
				break;
			default:
				if(me.contents.isSatellite)
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
				me.contents.tcs.generate();
				var row_contents_b = [{name:"name", contents:me.contents.nameTextBox(),isText:false}, 
								{name:"description",contents:me.contents.generationObject.name, isText:true}, 
								{name:"uwp",contents:me.contents.uwp, isText:true},{name:"tc",contents:me.contents.tcs, isText:true},
								{name:"mapLink",contents:(me.contents.uwp.size == 0 || me.contents.constructor.name == "ring" ? false : me.getMaplink()), isText:false},
								{name:"details",contents:(me.contents.generationObject.name == "Planetoids" || me.contents.constructor.name == "ring" ? false : me.calcDetails()), isText:false},
								{name:"albedo",contents:me.contents.albedo(), isText:true},
								{name:"greenhouse",contents:me.contents.greenhouse(), isText:true}, 
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
		detailsBtn.onclick = me.contents.editDetails;
		return detailsBtn;
	}
	
	me.getMaplink = function()
	{
		var s = document.getElementById("seed").value;
		if(s.trim() == "" || isNaN(parseInt(s)))
			me.contents.standardSeed = rng(4294967295);
		else
			me.contents.standardSeed = parseInt(s);
		document.getElementById("seed").value = me.contents.standardSeed;
		var mapLink = document.createElement("A");
		mapLink.href = "t5_map.html" + me.contents.buildGet();
		mapLink.target = "_blank";
		mapLink.text = "Map";
		return mapLink;		
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
												me.calcRowContents(); 
												me.set.updateTable(); 
												document.getElementById("orbit_text").innerHTML = me.number(); 
												if(document.getElementById("world_detail").hidden == false)
													me.contents.updateEdits(document.getElementById("world_detail"));
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
												me.calcRowContents(); 
												me.set.updateTable(); 
												document.getElementById("orbit_text").innerHTML = me.number();
												if(document.getElementById("world_detail").hidden == false)
													me.contents.updateEdits(document.getElementById("world_detail"));												
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
												otherOrbit.contents.systemOrbit = me.baseOrbit;
												me.set.setZone(otherOrbit.contents, otherOrbit.baseOrbit)
											}
											me.baseOrbit = newBaseOrbit;
											me.contents.systemOrbit = newBaseOrbit;
											me.set.setZone(me.contents,me.baseOrbit);
											document.getElementById("orbit_text").innerHTML = me.number();
											if(document.getElementById("world_detail").hidden == false)
												me.contents.updateEdits(document.getElementById("world_detail"));
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
											if(document.getElementById("world_detail").hidden == false)
												me.contents.updateEdits(document.getElementById("world_detail"));
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
											me.contents.updateEdits(document.getElementById("world_detail"));
											me.updateTableRow();
											
										}
		return satSelect;							
	}
	
	me.toSysCells = function()
	{
		var symbolData = me.contents.symbol();
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
		var symbol = me.contents.symbol();
		var sDiv = document.createElement("DIV");
		sDiv.className = "sys " + symbol.symbol;
		sDiv.style.fontSize = "1em";
		sDiv.style.textAlign = "left";
		sDiv.style.marginBottom = "0";
		sDiv.innerHTML = "<span class='sys_satellite_name'>" + symbol.name + "</span><span class='sys_satellite_uwp'>" + symbol.uwp + "</span>";
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
		if((me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld") && !DOWNLOAD_WORLD_DETAIL)
		{
			s += me.contents.albedo() + ",";
			s += me.contents.greenhouse() + ",";
			s += me.contents.calcTemperatureC();
		}
		if((me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld") && DOWNLOAD_WORLD_DETAIL)
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
						if(!DOWNLOAD_WORLD_DETAIL)
							s += "," + x.contents.albedo() + "," + x.contents.greenhouse() + "," + x.contents.calcTemperatureC();
						else
							x.contents.all_details.map(function(item) { s += item.name == "World Name" ? "" : "," + item.data_string(); });
				}
				s += "\r\n";
			}
		}
		return s;
	}
}

function systemFlags()
{
	var urlAdd = "&" + encodeURIComponent("mw_hz_only") + "=" + encodeURIComponent(MAIN_WORLD_HZ_ONLY ? "1" : "0");
	urlAdd += "&" + encodeURIComponent("mw_is_sat") + "=" + encodeURIComponent(MAIN_WORLD_IS_SAT ? "1" : "0");
	urlAdd += "&" + encodeURIComponent("mw_is_not_sat") + "=" + encodeURIComponent(MAIN_WORLD_NOT_SAT ? "1" : "0");
	urlAdd += "&" + encodeURIComponent("tz_no_sat") + "=" + encodeURIComponent(TZ_NO_SAT ? "1" : "0");
	urlAdd += "&" + encodeURIComponent("barren_sys") + "=" + encodeURIComponent(BARREN_SYS ? "1" : "0");
	return urlAdd;
}

function readSystemFlags(URLParams)
{
	MAIN_WORLD_HZ_ONLY = parseInt(URLParams.get("mw_hz_only")) == 1 ? true : false;
	MAIN_WORLD_IS_SAT = parseInt(URLParams.get("mw_is_sat")) == 1 ? true : false;
	MAIN_WORLD_NOT_SAT = parseInt(URLParams.get("mw_is_not_sat")) == 1 ? true : false;;
	TZ_NO_SAT = parseInt(URLParams.get("tz_no_sat")) == 1 ? true : false;
	BARREN_SYS = parseInt(URLParams.get("barren_sys")) == 1 ? true : false;
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

function governmentProfile(world)
{
	var me = this;
	me.world = world;
	
	
}