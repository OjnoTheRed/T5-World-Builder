var SYSTEM_OBJECT_COUNT = 0;
var MAIN_WORLD_HZ_ONLY = false;
var MAIN_WORLD_IS_SAT = false;
var MAIN_WORLD_NOT_SAT = false;
var NAME_TABLE_WIDTH = "70pt";

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

	me.details = function()
	{
		var wD = [
		{title:"World Name", contents:me.name ? me.name : ("Unnamed " + me.generationObject.name)},
		{title:"Location", contents:me.system},
		{title:"UWP", contents:me.uwp},
		{title:"Diameter", contents:me.diameter() + " km"},
		{title:"Density Type", contents:me.densityType().name},
		{title:"Density", contents:me.density() + " (Earth = 1)"},
		{title:"Mass", contents:me.mass() + " (Earth = 1)"},
		{title:"Surface Gravity", contents:me.gravity() + " G"},
		{title:"Rotation Period", contents:rotationPeriodString()},
		{title:"Orbital Period", contents:orbitalPeriodString()},
		{title:"Axial Tilt", contents:me.axialTilt() + "&deg;"},
		{title:"Surface Atmospheric Pressure", contents:me.atmosPressure() + " Atm"},
		{title:"Atmosphere Composition", contents:me.atmosComposition()},
		{title:"Hydrographic Percentage",contents:me.getHydroPercentage() + "%"},
		{title:"Surface Liquid Composition",contents:me.getFluid().name},
		{title:"Native Life",contents:me.nativeLife() ? "This world has native life." : "This world does not have native life."},
		{title:"Seismic Stress Factor",contents:"Stress factor is " + me.getStress() + "<br />Occurence of a volcanic eruption or earthquake in a 24-hour period:<br />Formidable (4D) < " + (me.getStress() - 4) + "<br /><b>Note:</b> DM -2 if on a Volcano hex, DM -2 if on a fault line."},
		{title:"Resources",contents:resourcesString()},
		{title:"Albedo",contents:"" + me.albedo()},
		{title:"Greenhouse Temperature multiplier",contents:"" + me.greenhouse()},
		{title:"Base Surface Temperature",contents:Math.round(me.calcTemperatureC()) + "&deg;C"},
		{title:"Average Daytime Temperature",contents:Math.round(me.calcTemperatureC() + me.dayPlus()) + "&deg;C"},
		{title:"Average Nighttime Temperature",contents:Math.round(me.calcTemperatureC() + me.nightMinus()) + "&deg;C"},
		{title:"Highest Possible Daytime Temperature",contents:Math.round(me.calcTemperatureC() + me.maxDayPlus()) + "&deg;C"},
		{title:"Coldest Possible Nighttime Temperature",contents:Math.round(me.calcTemperatureC() + me.maxNightMinus()) + "&deg;C"},
		{title:"Summer temperature increase",contents:Math.round(me.seasonSummerPlus()) + "&deg;C"},
		{title:"Winter temperature decrease",contents:Math.round(me.seasonWinterMinus()) + "&deg;C"},
		{title:"Temperature by latitude table",contents:me.temperatureTblHTML()}
		];
		return wD;
		
	}
	
	function rotationPeriodString()
	{
		var s = "";
		s += hms(Math.abs(me.rotationalPeriod())) + (me.rotationalPeriod() < 0 ? " retrograde" : "");
		if(me.tcs.has("Tz"))
			s += "<br>This planet is tidally locked to its central star, and so its rotational period equals its orbital period.";
		if(me.tcs.has("Lk"))
			s += "<br>This satellite is tidally locked to its central planet, and so its rotational period equals its orbital period.";
		return s;
	}
	
	function orbitalPeriodString()
	{
		var s = "";
		var p = me.orbitalPeriod();
		var myStar = me.isSatellite ? me.planet.orbit.set.centralStar : me.orbit.set.centralStar;
		var starName = myStar.name ? myStar.name : "an unnamed " + myStar.toString();
		console.log("p = " + p);
		if(me.isSatellite)
		{
			if(p < 2)
				s += dhms(p*28);
			else
				s += mdhms(p);
			console.log("s = " + s);
			var pname = me.planet.name;
			var porbp = me.planet.orbitalPeriod();
			s += " around " + (pname ? pname : (" an unnamed " + (me.planet.generationObject ? me.planet.generationObject.name : me.planet.toString()))) + ", ";
			s += "which orbits" + starName + " at a period of " + (porbp < 2 ? dhms(porbp*365) : ydhms(porbp)) + ". ";
		}
		else
		{
			if(p < 2)
				s += dhms(p*365);
			else
				s += ydhms(p);
			s += " around " + starName + ". ";
		}
		return s;
	}
	
	function resourcesString()
	{
		var s = "The world has ";
		var r = me.resources();
		if(r.length == 0) return "None.";
		for(var i=0;i<r.length-1;i++)
			s += r[i].name + " (for example " + r[i].examples + "), ";
		s += "and " + r[i].name + " (for example " + r[i].examples + ").";
		return s;
	}
	
	var WORLD_DIAMETER;
	me.diameter = function()
	{
		if(WORLD_DIAMETER)
			return WORLD_DIAMETER;
		var stupidImperial = me.uwp.size*1000 + flux()*100 + flux()*10 + flux();
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
	
	me.symbol = function()
	{
		var symbol = {baseOrbit:me.orbit.baseOrbit, distance:me.orbit.orbitDistance() + " AU", uwp:me.uwp.toString()};
		symbol.symbol = (me.uwp.size == 0 && (me.generationObject.name == "Planetoids" || me.constructor.name == "mainWorld")) ? "sys_symbol_belt" : (me.isMainWorld ? "sys_symbol_main_world" : "sys_symbol_minor_world");
		symbol.name = me.name == "" ? me.generationObject.name : me.name;
		return symbol;
	}
	
	me.nameTextBox = function()
	{
		var textInput = document.createElement("INPUT");
		textInput.setAttribute("type","text");
		textInput.width = NAME_TABLE_WIDTH;
		textInput.value = me.name;
		textInput.onchange = function() { me.name = textInput.value };
		return textInput;
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
		var g = me.mass() * (64 / Math.pow(me.uwp.size,2));
		g = Math.round(g*100)/100;
		return g
	}
	
	me.mass = function()
	{
		var vol = Math.pow(me.uwp.size/8,3); // in earth volumes
		var mass = vol*me.density();
		mass = Math.round(mass*1000)/1000;
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
		var lockPeriod = me.isSatellite ? me.orbitalPeriod()*28*24 : me.orbitalPeriod()*365*24;
		if(me.tcs.has("Tz") || me.tcs.has("Lk"))
		{
			ROTATIONAL_PERIOD = lockPeriod;
		}
		else
		{
			ROTATIONAL_PERIOD = (dice(2)-2)*4+5;
			if(me.isSatellite)
			{
				ROTATIONAL_PERIOD += me.planet.mass() / (me.orbit.orbitDistance() / 400000);
				console.log("me.planet.mass() = " + me.planet.mass());
				console.log("me.orbit.orbitDistance() / 400000 = " + me.orbit.orbitDistance() / 400000);
			}
			else
				ROTATIONAL_PERIOD += (me.orbit.set.centralStar.mass + (me.orbit.set.companionStar ? me.orbit.set.companionStar.mass : 0))/me.orbit.orbitDistance();
			if(ROTATIONAL_PERIOD >= 40)
			{
				var extrFnc = new dice_table(ROTATION_PERIOD_EXTREME_TABLE).roll();
				ROTATIONAL_PERIOD *= extrFnc();
			}
			if(ROTATIONAL_PERIOD > lockPeriod || -ROTATIONAL_PERIOD < -lockPeriod)
			{
				ROTATIONAL_PERIOD = lockPeriod;
				me.isSatellite ? me.tcs.add("Lk") : me.tcs.add("Tz");
			}
		}
		return ROTATIONAL_PERIOD;
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
		DAY_PLUS_TEMP = Math.min(me.maxDayPlus(),Math.abs(me.rotationalPeriod())/2*me.atmosPressureTable().day_plus);
		return DAY_PLUS_TEMP;
	}
	
	var NIGHT_MINUS_TEMP;
	me.nightMinus = function()
	{
		if(NIGHT_MINUS_TEMP)
			return NIGHT_MINUS_TEMP;
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
				ATMOS_PRESSURE_TABLE = ATM_PRESSURE_TABLE[d10()];
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
				ATMOS_COMPOSITION += me.getGasMix().description();
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
	me.getGasMix = function()
	{
		if(GAS_MIX_DETAIL)
			return GAS_MIX_DETAIL;
		GAS_MIX_DETAIL = new gasMix(me);
		return GAS_MIX_DETAIL;
	}
	
	var FLUID_DETAIL;
	me.getFluid = function()
	{
		if(FLUID_DETAIL)
			return FLUID_DETAIL;
		if(me.uwp.atmos < 10 || me.uwp.atmos > 12)
			FLUID_DETAIL = LIQUID_H2O;
		else
		{
			var randomRoll = dice(2);
			if(me.uwp.atmos == 10 && randomRoll > 9)
				FLUID_DETAIL = LIQUID_H2O;
			else
				FLUID_DETAIL = me.getGasMix().assoc_liquid();
		}
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
			for(var i=0;i<me.satelliteSystem.orbits.length;i++)
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
		if(NATIVE_LIFE)
			return NATIVE_LIFE;
		var nativeLifeTbl = new dice_table(NATIVE_LIFE_TBL,me.uwp);
		nativeLifeTbl.DM += (me.calcTemperatureC() < -20 || me.calcTemperatureC()) > 30 ? -1 : 0;
		if(me.isSatellite)
		{
			nativeLifeTbl.DM += (me.planet.orbit.set.centralStar.spectral_class == "G" || me.planet.orbit.set.centralStar.spectral_class == "K") ? 1 : 0;
			nativeLifeTbl.DM += (me.planet.orbit.set.centralStar.spectral_class == "F" || me.planet.orbit.set.centralStar.spectral_class == "A" || me.planet.orbit.set.centralStar.spectral_class == "B") ? -1 : 0;			
		}
		else
		{
			nativeLifeTbl.DM += (me.orbit.set.centralStar.spectral_class == "G" || me.orbit.set.centralStar.spectral_class == "K") ? 1 : 0;
			nativeLifeTbl.DM += (me.orbit.set.centralStar.spectral_class == "F" || me.orbit.set.centralStar.spectral_class == "A" || me.orbit.set.centralStar.spectral_class == "B") ? -1 : 0;
		}
		NATIVE_LIFE = nativeLifeTbl.roll();
		return NATIVE_LIFE;
	}
	
	var RESOURCES;
	me.resources = function()
	{
		if(RESOURCES)
			return RESOURCES;
		RESOURCES = [];
		var n = 0;
		for(var i=0;i<RESOURCES_ALL.length;i++)
		{
			var numObj = RESOURCES_ALL[i].number;
			switch(me.densityType())
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
			if(me.uwp.atmos > 3 && me.uwp.atmos < 10)
				n += numObj.atmos_good;
			else
				n += numObj.atmos_bad;
			switch(me.uwp.popul)
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
			switch(me.uwp.TL)
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
			if(me.nativeLife())
				n += numObj.life;
			else
				n += numObj.no_life;
			if(dice(2) < n)
				RESOURCES.push(RESOURCES_ALL[i]);
		}
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
		if(TEMP_TABLE)
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
		var tempData = me.temperatureTbl();
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
	
	me.detailsDiv = function()
	{
		var userSeed = document.getElementById("seed").value;
		var seedUsed = parseInt(userSeed);
		if(userSeed && !isNaN(seedUsed))
			init_rng(seedUsed);
		else
		{
			seedUsed = Date.now() >>> 0;
		}
		document.getElementById("seed").value = seedUsed;
		clearAll();
		var allDetails = me.details();
		var d = document.createElement("DIV");
		for(var i=0;i<allDetails.length;i++)
		{
			addHeading(d, allDetails[i].title);
			if(allDetails[i].contents.constructor.name == "String" || allDetails[i].contents.constructor.name == "uwp" )
				addText(d, allDetails[i].contents);
			else
				d.appendChild(allDetails[i].contents);

		}
		document.body.appendChild(d);
	}
	
	function addHeading(div, s)
	{
		var heading = document.createElement("H2");
		heading.className = "guidelines";
		heading.innerHTML = s;
		div.appendChild(heading);
	}
	
	function addText(div, s)
	{
		var para = document.createElement("P");
		para.innerHTML = s;
		div.appendChild(para);
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
	me.iX = 0;
	me.economicExt = new eX(me);
	me.culturalExt = new cX(me);
	me.noblesExt = new nobles(me);
	me.worlds = 0;
	me.allegience = "Im";
	me.stars = new starSystem(me);
	me.nativeIntLife = new nil(me);
	me.standardSeed = "";
		
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
		newURL += "&" + encodeURIComponent("allegience") + "=" + encodeURIComponent(me.allegience);
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
		me.economicExt.generate();
		me.culturalExt.generate();
		me.noblesExt.generate();
		me.worlds = dice(2);
		me.stars.generate();
		me.nil.generate();
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
		s += pad(me.allegience,5);
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
		me.allegience = s.substr(117,4);
		me.stars.readString(s.substr(122));
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
		me.allegience = dataArray[9];
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
	}

	me.readDataObj = function(dataObj)
	{
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
		me.allegience = dataObj.allegiance;
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
	me.populLimit = Math.max(0,mainWorld.uwp.popul-1);
	me.nativeIntLife = new nil(me);
	me.standardSeed = me.mainWorld.standardSeed;
	me.has_MW_as_sat = false;
	me.orbit = null;
	me.system = mainWorld.name;
	me.hex = mainWorld.hex;
	me.sector = mainWorld.sector;
	
	me.generate = function()
	{
		me.uwp.createUWP();
		me.tcs.generate();
		me.nativeIntLife.generate();
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
}

function gasGiant(mainWorld)
{
	var me = this;
	me.inheritFrom = world;
	me.inheritFrom();
	me.mainWorld = mainWorld;
	me.size = dice(2)+19;
	me.type = me.size < 23 ? "SGG" : "LGG";
	me.uwp = "Size: " + pseudoHex(me.size);
	me.iceGiant = false;
	me.zone = ""; // I = inner (closer than HZ-1), H = habitable (HZ-1 to HZ+1), O = outer (further than HZ+1)

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

}

function ring(planet)
{
	var me = this;
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
		return array_fnc.search.call(me.classes,tcCode) != -1;
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
				me.type = ALL_TC[i];
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
			s += "Colonist ";
		s += me.type.name;
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
		return array_fnc.nameSearch.call(me.basesPresent,baseName) != -1;
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
	me.resources = 0;
	me.labour = 0;
	me.infrastructure = 0;
	me.efficiency = 0;
	
	me.generate = function()
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
		var data = array_fnc.nameSearch.call(STAR_DATA,me.toString());
		me.radii = data.radii;
		me.radius = data.radii*695700;
		me.jump_point = me.radius*200;
		me.mass = data.mass;
		me.luminosity = data.luminosity;
		me.hz = data.hz;
		me.fao = data.fao;
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
		var orbit = me.isCloseCompanion ? "Companion" : "Primary";
		var contents = [orbit,"","","","",me.nameTextBox(),"Star",me.toString(),"Radii (Sol): " + me.radii + "  Mass (Sol): " + me.mass + "  Luminosity (Sol): " + me.luminosity];
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
		textInput.onchange = function() { me.name = textInput.value };
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
		if(array_fnc.nameSearch.call(STAR_DATA,s) == -1 && s != "D" && s != "BD")
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
}

function fullSystem(mainWorldObj)
{
	var me = this;
	me.mainWorld = mainWorldObj;
	me.stars = me.mainWorld.stars;
	me.primary = me.stars.stars[0];
	me.companion = me.stars.companions[0];	
	me.orbits = new orbitSet(me.primary, me.companion);
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
		var newOrbitSet = new orbitSet(me.stars.stars[i],me.stars.companions[i]);
		newOrbitSet.maxOrbit = orbitNumber-3;
		newOrbitSet.description = PREC_ORDINAL[precedenceCount++];
		me.orbitSets.push(newOrbitSet);
		me.orbits.add(orbitNumber, newOrbitSet);
	}	
	
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
		me.orbitSets[0].add(0, me.mainWorld); // Last resort: if somehow the main world has not been placed, put it in orbit 0 or nearest orbit

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
		for(var i=0;i<me.orbitSets.length;i++)
			s += me.orbitSets[i].tofixedWidthText() + "\r\n";
		return s;
	}
	
	me.toPlainHTML = function()
	{
		var s = "<html><head></head><body><h1>The " + me.mainWorld.name + " System (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")</h1>";
		for(var i=0;i<me.orbitSets.length;i++)
			s += me.orbitSets[i].toPlainHTML();
		s += "</body>";
		return s;
	}
	
	me.toCSV = function()
	{
		var s = "";
		for(var i=0;i<me.orbitSets.length;i++)
			s += me.orbitSets[i].toCSV();
		return s;
	}
	
	me.toSymbolMap = function()
	{
		var map = document.createElement("DIV");
		map.className = "sys";
		var heading = document.createElement("H1");
		heading.innerHTML = "The " + me.mainWorld.name + " System (" + me.mainWorld.hex + " " + me.mainWorld.sector + ")";
		map.appendChild(heading);
		for(var i=0;i<me.orbitSets.length;i++)
			map.appendChild(me.orbitSets[i].toSysTable());
		return map;
	}
	
}

var ORBIT_SET_COUNT = 0;

function orbitSet(centralStar, companionStar)
{
	var me = this;
	me.centralStar = centralStar;
	me.companionStar = companionStar;
	me.maxOrbit = 19;
	me.firstOrbit = me.centralStar.fao;
	me.orbits = [];
	me.hz = me.centralStar.hz;
	me.zone = false;
	me.hz_rel = 0;
	me.description = "";
	me.tableName = "orbit_set_table_" + ORBIT_SET_COUNT++;
	
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
		// widths: orbit=5, actual = 7, distance=15 name=41, content type=16, uwp=10, tcs and remarks = no limit
		var s = "--------Orbit-------\r\n";
		s += "Base Actual Distance       Name                 Content Type    UWP       TCs and Remarks\r\n";
		s += me.centralStar.tofixedWidthText();
		if(me.companionStar !== undefined)
			s += me.companionStar.tofixedWidthText();
		for(var i=0;i<me.orbits.length;i++)
			s += me.orbits[i].tofixedWidthText() + "\r\n";
		return s;
	}
	
	me.toPlainHTML = function()
	{
		var s = "<table>";
		s += "<tr><th>Base Orbit</th><th>Decimal Orbit</th><th>Orbital Distance</th><th>Name</th><th>Content Type</th><th>UWP</th><th>TCs and Remarks</th><th>Albedo</th><th>Greenhouse Multiplier</th><th>Average Temperature</th></tr>";
		s += me.centralStar.toPlainHTML();
		if(me.companionStar !== undefined)
			s += me.companionStar.toPlainHTML();
		for(var i=0;i<me.orbits.length;i++)
			s += me.orbits[i].toPlainHTML();
		s += "</table>";
		return s;
	}
	
	me.toCSV = function()
	{
		var headings = ["Orbit", "Decimal Orbit", "Orbital Distance", "Name", "Content Type", "UWP","TCs and Remarks", "Albedo","Greenhouse Multiplier","Average Temperature"];
		var s = headings.join(",") + "\r\n";
		s += me.centralStar.toCSV();
		if(me.companionStar !== undefined)
			s += me.companionStar.toCSV();
		for(var i=0;i<me.orbits.length;i++)
			s += me.orbits[i].toCSV() + "\r\n";
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

	me.occupied = function(orbit)
	{
		for(var i=0;i<me.orbits.length;i++)
			if(me.orbits[i].baseOrbit.o == orbit.o)
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
			var numSats = me.planet.numSats();;
			if(numSats == 0)
				me.add(new ring(planet));
		}
		while(numSats == 0)
		numSats = Math.max(numSats,0);
		for(var k=0;k<numSats;k++)
			me.add(planet.generateSat());
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
				var row_contents_b = [{name:"name", contents:me.contents.nameTextBox(), isText:false}, 
								{name:"description",contents:me.contents.generationObject.name, isText:true}, 
								{name:"uwp",contents:me.contents.uwp, isText:true},{name:"tc",contents:me.contents.tcs, isText:true},
								{name:"mapLink",contents:(me.contents.uwp.size == 0 || me.contents.constructor.name == "ring" ? false : me.getMaplink()), isText:false},
								{name:"details",contents:(me.contents.uwp.size == 0 || me.contents.constructor.name == "ring" ? false : me.calcDetails()), isText:false},
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
		detailsBtn.onclick = me.contents.detailsDiv;
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
		upButton.onclick = function() { if(me.increment < 5) { me.increment++; me.calcRowContents(); me.set.updateTable(); } };
		return upButton;
	}

	me.orbitAdjustDownBtn = function()
	{
		var downButton = document.createElement("BUTTON");
		downButton.type = "BUTTON";
		downButton.innerHTML = "&#x25BC;";
		downButton.className = "adjBtn";
		downButton.onclick = function() { if(me.increment > -5) { me.increment--; me.calcRowContents(); me.set.updateTable(); } };
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
											me.set.updateTable(); 
										}
									};
		return downButton;
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
		if(me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld")
		{
			s += " Albedo: " + me.contents.albedo();
			s += " Greenhouse: " + me.contents.greenhouse();
			s += " Avg Temp: " + me.contents.calcTemperatureC();
			s += "\r\n";
		}
		else
			s += "\r\n";
		if(me.contents.satelliteSystem)
		{
			for(var j=0;j<me.contents.satelliteSystem.orbits.length;j++)
			{
				var x = me.contents.satelliteSystem.orbits[j];
				switch(x.contents.constructor.name)
				{
					case "ring":
						s += " ".repeat(5) + pad_left(x.baseOrbit.o,7) + pad_left(x.orbitDistance() + " km",14) + " ".repeat(22) + "Ring System\r\n";
						break;
					default:
						s += " ".repeat(5) + pad_left(x.baseOrbit.o,7) + pad_left(x.orbitDistance() + " km",14) + " " + pad(x.contents.name, 21);
						s += pad(x.contents.generationObject.name,16) + pad(x.contents.uwp,10) + pad(x.contents.tcs,30) + " Albedo: " + x.contents.albedo();
						s += " Greenhouse: " + x.contents.greenhouse() + " Avg Temp: " + x.contents.calcTemperatureC() + "\r\n";
				}
			}
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
		if(me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld")
		{
			s += "<td>" + me.contents.albedo() + "</td>";
			s += "<td>" + me.contents.greenhouse() + "</td>";
			s += "<td>" + me.contents.calcTemperatureC() + "</td>";
		}
		else
			s += "<td></td><td></td><td></td>";
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
						s += "<td>" + x.contents.albedo() + "</td>";
						s += "<td>" + x.contents.greenhouse() + "</td>";
						s += "<td>" + x.contents.calcTemperatureC() + "</td>";
				}
				s += "</tr>";
			}
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
		if(me.contents.constructor.name == "mainWorld" || me.contents.constructor.name == "minorWorld")
		{
			s += me.contents.albedo() + ",";
			s += me.contents.greenhouse() + ",";
			s += me.contents.calcTemperatureC();
		}
		s += "\r\n"
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
						s += "," + x.baseOrbit.o + "," + x.orbitDistance() + " km," + x.contents.name + "," + x.contents.generationObject.name + "," + x.contents.uwp + "," + x.contents.tcs + "," + x.contents.albedo() + "," + x.contents.greenhouse() + "," + x.contents.calcTemperatureC() + "\r\n";
				}
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
	return urlAdd;
}

function readSystemFlags(URLParams)
{
	MAIN_WORLD_HZ_ONLY = parseInt(URLParams.get("mw_hz_only")) == 1 ? true : false;
	MAIN_WORLD_IS_SAT = parseInt(URLParams.get("mw_is_sat")) == 1 ? true : false;
	MAIN_WORLD_NOT_SAT = parseInt(URLParams.get("mw_is_not_sat")) == 1 ? true : false;;
}

function gasMix(world)
{
	var me = this;
	me.world = world;
	me.mix = null;
	me.gasMixObjs = [];
	
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
		me.mix.gasses.forEach(function (gas) { s += gas.notes + " "; } );
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
						me.mix.gasses[i].proportion = rng(me.mix.gasses[i].corrosive)/10000
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
	
	me.gasMixObjs.forEach( function(gas_mix) { if((me.world.uwp.atmos == 10 && gas_mix.exotic) || (me.world.uwp.atmos == 11 && gas_mix.corrosive) || (me.world.uwp.atmos == 12 && gas_mix.insidious)) gas_mix.possible = true;} );
	me.gasMixObjs.forEach( function(gas_mix) { if(!me.world.tcs.has("Fr") && me.cold(gas_mix.gasses)) gas_mix.possible = false; } );
	me.getMix();
}