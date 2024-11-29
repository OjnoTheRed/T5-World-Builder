function tjl_beast(world, terrain, niche)
{
	var me = this;
	me.world = world;
	me.terrain = terrain;
	me.name = "";
	me.locomotion = null;
	me.niche = niche; // valid values - "Producer","Herbivore","Omnivore","Carnivore","Scavenger", "Event" (event as placeholder only, will create separate class later)
	me.subniche = null;
	me.quantity = 1;
	me.size = null;
	me.strength = 1;
	me.strengthDescriptor = "";
	me.speedB = null;
	me.speedAF = null;
	me.speedC = null;
	me.attack = 0;
	me.flee = 0;
	me.weapon = "";
	me.armour = [];
	me.symmetry = "";
	me.stance = ""; // valid values "H" for horizonal, "V" for verticle.
	me.head = "H"; // begins with "H" and then codes for "S" (Senses), "B" (Brain), "Br" (Breathes), "F" (Feeds)
	me.torso = "T"; // begins with "T" and then codes for "S" (Senses), "B" (Brain), "Br" (Breathes), "F" (Feeds)
	me.tail = ""; // can be "N" for none, "T" for Tail, "V" for Vestigial, "M" for "Manipulator", "P" for "Proboscis" or "A" for "Antennae"
	me.limbs = []; // array of limb groups, usually 4 (two front, two rear), but rear can have more groups added.  Elements 0 & 1 are always front, the rest are rear.
	me.skeleton = "";
	me.fluids = "";
	me.skin = "";
	me.colour = "";
	me.manipulators = "";
	me.length = 0;
	me.widthDivisor = 0;
	me.depthDivisor = 0;
	me.density = null;
	
	me.nameTextBox = function()
	{
		var textInput = document.createElement("INPUT");
		textInput.setAttribute("type","text");
		textInput.width = NAME_TABLE_WIDTH;
		textInput.value = me.name;
		textInput.onchange = function() { me.name = textInput.value; };
		textInput.style.margin = "0 0 0 0";
		textInput.style.padding = "0 0 0 0";
		return textInput;
	}
	
	me.width = function()
	{
		return me.length / me.widthDivisor;
	}
	
	me.depth = function()
	{
		return me.length / me.depthDivisor;
	}
	
	me.volume = function()
	{
		return me.length * me.width() * me.depth();
	}
	
	me.mass = function()
	{
		return me.volume() * me.density.multiplier;
	}
	
	me.generate = function()
	{
		if(!me.terrain) me.terrain = new dice_table(tjl_native_terrain_tbl).roll();
		me.locomotion = tjl_MOVEMENT_TYPES[new dice_table(me.terrain.loco_tbl).roll()];
		if(!me.niche || (me.niche != "Producer" && me.niche != "Herbivore" && me.niche != "Omnivore" && me.niche != "Carnivore" && me.niche != "Scavenger" && me.niche != "Event"))
		{
			me.niche = new dice_table(tjl_NICHE_TBL).roll();
		}
		else
		{
			if(me.niche == "Event")
				return;
		}
		me.subniche = tjl_all_sub_niches[new dice_table(tjl_SUB_NICHE_FLUX_TBLS[me.niche]).roll()];
		me.quantity = new dice_table(tjl_QUANTITY_TBL).roll();
		var s_tbl = new dice_table(tjl_BEAST_SIZE_TBL);
		s_tbl.DM = parseInt(tjl_GRAV_MOD[me.world.uwp.size]);
		const tbl_result = s_tbl.roll()
		me.size = all_beast_sizes[tbl_result];
		var str_tbl = new dice_table(tjl_BEAST_STRENGTH_TBL);
		if(me.size.size <=3)
			me.strength = "Strength = 0";
		else
		{
			if(me.size.size == 4)
				str_tbl.DM -= 3;
			if(me.world.uwp.size <=4)
				str_tbl.DM -= 1;
			if(me.world.uwp.size >=10)
				str_tbl.DM += 1;
			var strengthObj = str_tbl.roll();
			me.strength = me.size.size >= 6 ? strengthObj.largeDescriptor : strengthObj.descriptor;
		}
		var speed_tbl = new dice_table(tjl_SPEED_TBL);
		if(me.locomotion.type == "Static")
		{
			me.speedC = me.speedAF = me.speedB = speed_tbl.table[0];			
		}
		else
		{
			if(me.niche == "Producer")
				speed_tbl.DM -= 5;
			switch(me.locomotion.type)
			{
				case "Flyer":
					speed_tbl.DM += 2;
					break;
				case "Swimmer":
					speed_tbl.DM -= 1;
					break;
				case "Diver":
					speed_tbl.DM -= 2;
			}
			me.speedC = speed_tbl.roll();
			me.speedAF = speed_tbl.table[Math.max(speed_tbl.min, speed_tbl.rollResult+1)];
			me.speedB = speed_tbl.table[Math.min(speed_tbl.max, speed_tbl.rollResult+2)];
		}
		var weapon_tbl = new dice_table(tjl_BEAST_WEAPONS_TBL);
		switch(me.niche)
		{
			case "Carnivore":
				weapon_tbl.DM = 1;
				break;
			case "Herbivore":
				weapon_tbl.DM = -1;
				break;
			default:
				weapon_tbl.DM = 0;
		}
		me.weapon = tjl_BEAST_WEAPONS[weapon_tbl.roll()];
		if(me.weapon.inflicts.search(/\//) != "-1")
		{
			var inflictOptions = me.weapon.inflicts.split("/");
			me.weapon.inflicts = inflictOptions[rng(inflictOptions.length)-1];
		}
		me.attack = typeof(me.subniche.a) == "string" ? me.subniche.a : me.subniche.a - dice(1);
		me.flee = typeof(me.subniche.f) == "string" ? me.subniche.f : me.subniche.f - dice(1);
		var numArmour = highFlux();
		for(var i=0;i<numArmour;i++)
		{
			var newArmour = new dice_table(tjl_BEAST_ARMOUR_TBL).roll();
			var existingArmourIndex = me.armour.findIndex(function(a) { return a.type == newArmour.type });
			if(existingArmourIndex == -1)
				me.armour.push(newArmour);
			else
				if(newArmour.dice > me.armour[existingArmourIndex].dice)
					me.armour[existingArmourIndex].dice = newArmour.dice;
		}
		var symmetry_tbl = new dice_table(tjl_SYMMETRY_TBL);
		switch(me.locomotion)
		{
			case "Flyer":
				symmetry_tbl.DM = 2;
				break;
			case "Swimmer":
				symmetry_tbl.DM = -2;
				break;
			default:
				symmetry_tbl.DM = 0;
		}
		me.symmetry = symmetry_tbl.roll();
		switch(me.locomotion)
		{
			case "Static":
			case "Drifter":
				me.stance = dice(1) < 4 ? "V" : "H";
				break;
			case "Walker":
				me.stance = dice(1) < 5 ? "H" : "V";
				break;
			default:
				me.stance = dice(1) < 6 ? "H" : "V";
		}
		var brain = new dice_table(tjl_BRAIN_TBL).roll();
		var breathes = new dice_table(tjl_BREATH_TBL).roll();
		var senses = new dice_table(tjl_SENSES_TBL).roll();
		var feeds = new dice_table(tjl_FEED_TBL).roll();
		if(brain == "H")
			me.head += "B";
		else
			me.torso += "B";
		if(breathes == "H")
			me.head += "Br";
		else
			me.torse += "Br";
		if(senses == "H")
			me.head += "S";
		else
			me.head += "S";
		if(feeds == "H")
			me.head += "F";
		else
			me.torse += "F";
		me.tail = new dice_table(tjl_LIMBS_TAIL_TBL).roll();
		var limbString = "";
		switch(me.locomotion)
		{
			case "Walker":
				limbString = new dice_table(tjl_LIMBS_WALKER_FRONT_TBL).roll();
				limbString += new dice_table(tjl_LIMBS_WALKER_REAR_TBL).roll();
				break;
			case "Amphibian":
				limbString = new dice_table(tjl_LIMBS_AMPHIB_FRONT_TBL).roll();
				limbString += new dice_table(tjl_LIMBS_AMPHIB_REAR_TBL).roll();
				break;
			case "Triphibian":
			case "Flyphibian":
				limbString = new dice_table(tjl_LIMBS_FLYPHIB_FRONT_TBL).roll();
				limbString += new dice_table(tjl_LIMBS_FLYPHIB_REAR_TBL).roll();
				break;
			case "Aquatic":
			case "Diver":
			case "Swimmer":
				limbString = new dice_table(tjl_LIMBS_SWIMMER_FRONT_TBL).roll();
				limbString += new dice_table(tjl_LIMBS_SWIMMER_REAR_TBL).roll();
				break;
			case "Flyer":
				limbString = new dice_table(tjl_LIMBS_FLYER_FRONT_TBL).roll();
				limbString += new dice_table(tjl_LIMBS_FLYER_REAR_TBL).roll();
				break;
		}
		for(var i=0;i<limbString.length;i++)
		{
			if(limbString.charAt(i) == "M")
			{
				var numLegs = dice(1);
				for(var j=0;j<numLegs;j++)
					me.limbs.push("L");
			}
			else
				me.limbs.push(charAt(i));
		}
		me.skeleton = new dice_table(tjl_SKELETON_TBL).roll();
		me.fluids = new dice_table(tjl_FLUIDS_TBL).roll();
		me.skin = new dice_table(tjl_SKIN_TBL).roll();
		me.colour = new dice_table(tjl_COLOUR_TBL).roll();
		me.manipulators = new dice_table(tjl_MANIPULATORS_TBL).roll();
		me.widthDivisor = new dice_table(tjl_BODY_PROFILE_TBL).roll();
		me.depthDivisor = new dice_table(tjl_BODY_PROFILE_TBL).roll();
		me.density = new dice_table(tjl_BEAST_DENSITY_TBL).roll();
	}
	
	me.edit = function()
	{
		beast_Edit_Fields = [{field:"beast_name_edit", prop:"name", change_fn:"Standard"}, 
							 {field:"niche_edit", prop:"niche", change_fn:function() {  }}, 
							 {field:"subniche_edit", prop:"subniche", change_fn:"Standard"}, 
							 {field:"locomotion_edit", prop:"locomotion", change_fn:"Standard"}, 
							 {field:"quantity_edit", prop:"quantity", change_fn:"Standard"}, 
							 {field:"beast_size_edit", prop:"size", change_fn:"Standard"}, 
							 {field:"beast_strength_edit", prop:"strength", change_fn:"Standard"}, 
							 {field:"beast_speed_edit", prop:"speedC", change_fn:function() {  }}, 
							 {field:"beast_attack_TN", prop:"attack", change_fn:"Standard"}, 
							 {field:"beast_flee_TN", prop:"flee", change_fn:"Standard"}, 
							 {field:"beast_weapon", prop:"weapon", change_fn:"Standard"}, 
							 {field:"beast_armour_edit", prop:"armour", change_fn:function() {  }}, 
							 {field:"beast_radproof_edit", prop:"armour", change_fn:function() {  }}, 
							 {field:"beast_flashproof_edit", prop:"armour", change_fn:function() {  }}, 
							 {field:"beast_soundproof_edit", prop:"armour", change_fn:function() {  }}, 
							 {field:"beast_sealed_edit", prop:"armour", change_fn:function() {  }}, 
							 {field:"beast_insulated_edit", prop:"armour", change_fn:function() {  }}, 
							 {field:"beast_psiproof_edit", prop:"armour", change_fn:function() {  }}, 
							 {field:"beast_symmetry", prop:"symmetry", change_fn:"Standard"}, 
							 {field:"beast_breathing_location", prop:["head","torso"]}, 
							 {field:"beast_brain_location", prop:["head","torso"]}, 
							 {field:"beast_senses_location", prop:["head","torso"]}, 
							 {field:"beast_feeding_location", prop:["head","torso"]}, 
							 {field:"beast_front_limbs_1", prop:"limbs", change_fn:"Standard"}, 
							 {field:"beast_front_limbs_2", prop:"limbs", change_fn:"Standard"}, 
							 {field:"beast_rear_limbs_1", prop:"limbs", change_fn:"Standard"}, 
							 {field:"beast_rear_Limbs_2", prop:"limbs", change_fn:"Standard"}, 
							 {field:"beast_tail", prop:"tail", change_fn:"Standard"}, 
							 {field:"beast_skeleton", prop:"skeleton", change_fn:"Standard"}, 
							 {field:"beast_fluids", prop:"fluids", change_fn:"Standard"}, 
							 {field:"beast_skin", prop:"skin", change_fn:"Standard"}, 
							 {field:"beast_colour", prop:"colour", change_fn:"Standard"}, 
							 {field:"beast_manipulators", prop:"manipulators", change_fn:"Standard"}, 
							 {field:"beast_body_width_divisor", prop:"widthDivisor", change_fn:function() {  }}, 
							 {field:"beast_body_depth_divisor", prop:"depthDivisor", change_fn:function() {  }}, 
							 {field:"beast_stance", prop:"stance", change_fn:function() {  }}, 
							 {field:"beast_density", prop:"density", change_fn:function() {  }}];
		beast_Edit_Fields.map(function(obj) {
			var edit_field = document.getElementById(obj.field);
			
		});
	}
	
	me.toString = function()
	{
		var s = me.quantity + " ";
		s += me.size.descriptor + " ";
		s += me.speedC.descriptor + " ";
		s += me.strengthDescriptor + " ";
		s += me.locomotion.type + " ";
		s += me.subniche.subniche + " ";
		if(Number.isInteger(me.attack))
			s += "A" + me.attack + " ";
		else
			s += me.attack + " ";
		if(Number.isInteger(me.flee))
			s += "F" + me.flee + " ";
		else
			s += me.flee + " ";
		s += me.weapon.name;
		me.armour.map(function(a) { s += "" + a.dice + "D " + a.type + " " });
		return s;
	}
	
	me.toTableRow = function(diceNum)
	{
		var tr = document.createElement("TR");
		if(me.niche == "Event")
		{
			var txt = "" + diceNum + " " + me.niche.substr(0,1);
			var txtN = document.createTextNode(txt);
			var td = document.createElement("TD");
			td.appendChild(txtN);
			tr.appendChild(td);
			txt = "Event: Place an appropriate event here - see pages 260-261 T5.10 Core Rule Book 3.";
			txtN = document.createTextNode(txt);
			td = document.createElement("TD");
			td.colSpan = 11;
			td.appendChild(txtN);
			tr.appendChild(td);
			return tr;
		}
		var aStr = "";
		me.armour.map(function(a) { aStr += "" + a.dice + "D&nbsp;" + a.type + " "; });
		var rowData = 	[
						 "" + diceNum + " " + me.niche.substr(0,1), 
						 me.nameTextBox(),
						 me.quantity, 
						 me.size.descriptor + " (Size " + me.size.size + ", " + me.size.value + "m)",
						 me.speedC.descriptor + " (" + me.speedC.value + " kph)",
						 me.strength,
						 me.locomotion.type,
						 me.subniche.subniche,
						 "A" + me.attack,
						 "F" + me.flee,
						 me.weapon.name + " (" + me.weapon.inflicts + ")",
						 aStr
						];
		rowData.map(function(bData) {
						var td = document.createElement("TD");
						if(typeof(bData) == "string")
							td.innerHTML = bData;
						else
							td.appendChild(bData);
						tr.appendChild(td);
		});
		return tr;
	}
}

function tjl_beastTable(world, terrain, auto_gen)
{
	if(arguments.length < 3) auto_gen = true;
	var me = this;
	me.world = world;
	me.beasts = [];
	me.beastNiches = ["Producer","Herbivore","Omnivore","Carnivore","Scavenger","Event"];
	me.terrain = terrain;
	
	me.generate = function()
	{
		me.beastNiches.map(function(nicheStr) {
			var beastie = new tjl_beast(me.world, me.terrain, nicheStr);
			beastie.generate();
			me.beasts.push(beastie);
		});
	}
	
	me.toTable = function()
	{
		var tbl = document.createElement("TABLE");
		var title_row = document.createElement("TR");
		var title_text = ["BEAST ENCOUNTER TABLE", "Grav Mod = " + parseInt(GRAV_MOD[me.world.uwp.size]),""];
		title_text.map(function(title_cell_text, index) {
			if(index == 0)
			{
				var title_txtN = document.createElement("B");
				var bold_text_node = document.createTextNode(title_cell_text);
				title_txtN.appendChild(bold_text_node);
				
			}
			else
				var title_txtN = document.createTextNode(title_cell_text);
			var title_cell = document.createElement("TD");
			title_cell.colSpan = index == 0 ? 6 : 5;
			if(index == title_text.length-1)
			{
				title_cell.rowSpan = 2;
				title_cell.style.textAlign = "center";
				var svgObj = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				svgObj.setAttribute("width",36);
				svgObj.setAttribute("height",36);
				title_cell.appendChild(svgObj);
				var hex = new terrainHex(null, svgObj, 0, 3);
				hex.clickEnabled = false;
				hex.world = me.world;
				me.terrain.svg.map(function(svgObj) {
					hex.add(svgObj);
				});				
				hex.render();
				var terrainTitle = document.createElement("p");
				terrainTitle.style.fontWeight = "bold";
				var terrainTitleText = document.createTextNode(me.terrain.name);
				terrainTitle.appendChild(terrainTitleText);
				title_cell.appendChild(terrainTitle);
			}
			title_cell.appendChild(title_txtN);
			title_row.appendChild(title_cell);
		});
		tbl.appendChild(title_row);
		var title_row_2 = document.createElement("TR");
		var title_text_2 = [{title:"Terrain Type", text:me.terrain.name}, {title:"Worldname and UWP", text:me.world.name + " " + me.world.uwp}];
		title_text_2.map(function(textObj, index) {
			var cellHTML = "<p class='guidelines' style='background-color:transparent'>" + textObj.title + "</p>" + textObj.text;
			var title_cell2 = document.createElement("TD");
			title_cell2.colSpan = index == 0 ? 6 : 5;
			title_cell2.innerHTML = cellHTML;
			title_row_2.appendChild(title_cell2);
		});
		tbl.appendChild(title_row_2);
		var hdr_row = document.createElement("TR");
		const hdr_row_text = ["1D Niche","Name","Qty","Size","SpeedC","Strength","Locomotion","Type","A","F","Weapon","Armour"];
		hdr_row_text.map(function(cellText) {
			var txtN = document.createTextNode(cellText);
			var cell = document.createElement("TH");
			cell.appendChild(txtN);
			hdr_row.appendChild(cell);
		});
		tbl.appendChild(hdr_row);
		me.beasts.map(function(beastie,index){tbl.appendChild(beastie.toTableRow(index+1))});
		return tbl;
	}
	
	if(auto_gen)
		me.generate();
}
// {dice:function() { return dice(2); },min:,max:, };
// {dice:function() { return flux(); },min:-5,max:5, "-5":, "-4":, "-3":, "-2":, "-1":, 0:, 1:, 2:, 3:, 4:, 5:};
const tjl_GRAV_MOD = [1,1,1,1,1,0,0,0,0,"-1","-1","-1","-1","-2","-2","-2"];
const tjl_ATMOS_MOD = [0,0,0,0,"-1","-1",0,0,1,1,0,0,0,1,0,"-1"];
const tjl_NATIVE_TERRAIN_SIZE_MOD = {property:"size", 0:1, 1:1, 2:1, 3:1, 4:1, 5:1, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0, 13:0, 14:0, 15:0, 16:0, 17:0, 18:0, 19:0, 20:0};
const tjl_NATIVE_TERRAIN_ATMOS_MOD = {property:"atmos", 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:2, 9:2, 10:2, 11:2, 12:2, 13:2, 14:2, 15:2};
const tjl_NATIVE_TERRAIN_HYDRO_MOD = {property:"hydro", 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:1, 7:1, 8:1, 9:2, 10:2};
const tjl_NATIVE_TERRAIN_CLEAR = {name:"Clear", svg:[clearTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_ROUGH = {name:"Rough", svg:[roughTerrain], loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:1, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_FOREST = {name:"Forest", svg:[woodsTerrain], dm:1, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_WETLAND_WOODS = {name:"Wetland Woods", svg:[swampTerrain], dm:3, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:1, 2:0, 3:0, 4:0, 5:2, 6:6}};
const tjl_NATIVE_TERRAIN_ROUGH_WOOD = {name:"Rough Wood", svg:[roughTerrain,woodsTerrain], loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:1, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_RESERVE = {name:"Reserve", svg:[], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_MOUNTAIN = {name:"Mountain", svg:[mountainTerrain], loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:5, 6:8}};
const tjl_NATIVE_TERRAIN_DESERT = {name:"Desert", svg:[desertTerrain], loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:5, 6:8}};
const tjl_NATIVE_TERRAIN_CAVERNS = {name:"Caverns", svg:[], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:1, 2:0, 3:0, 4:0, 5:7, 6:8}};
const tjl_NATIVE_TERRAIN_CRATER = {name:"Crater", svg:[cratersTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:5, 6:5}};
const tjl_NATIVE_TERRAIN_WASTELAND = {name:"Wasteland", svg:[wasteTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:5, 6:5}};
const tjl_NATIVE_TERRAIN_MINES = {name:"Mines", svg:[mineTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:1, 2:0, 3:0, 4:0, 5:7, 6:8}};
const tjl_NATIVE_TERRAIN_ISLAND = {name:"Island", svg:[islandTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:1, 2:0, 3:0, 4:5, 5:5, 6:7}};
const tjl_NATIVE_TERRAIN_SHORE = {name:"Shore", svg:[], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:1, 2:0, 3:0, 4:5, 5:2, 6:7}};
const tjl_NATIVE_TERRAIN_ICE_FIELD = {name:"Ice Field", svg:[iceFieldTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_ICECAP = {name:"Icecap", svg:[icecapTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_GLACIER = {name:"Glacier", svg:[], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_EXOTIC = {name:"Exotic", svg:[exoticTerrain], loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:3, 2:0, 3:0, 4:0, 5:5, 6:6}};
const tjl_NATIVE_TERRAIN_ABYSS = {name:"Abyss", svg:[oceanAbyssTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:4, 2:4, 3:4, 4:9, 5:9, 6:9}};
const tjl_NATIVE_TERRAIN_OCEAN_DEPTHS = {name:"Ocean Depths", svg:[oceanDepthTerrain], dm:5, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:3, 2:3, 3:4, 4:4, 5:4, 6:9}};
const tjl_NATIVE_TERRAIN_OCEAN = {name:"Ocean", svg:[oceanTerrain], dm:4, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:6, 2:7, 3:7, 4:3, 5:3, 6:9}};
const tjl_NATIVE_TERRAIN_RIVER = {name:"River", svg:[], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:3, 2:3, 3:7, 4:7, 5:2, 6:6}};
const tjl_NATIVE_TERRAIN_LAKE = {name:"Lake", svg:[], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:3, 2:1, 3:7, 4:4, 5:2, 6:2}};
const tjl_NATIVE_TERRAIN_WETLANDS = {name:"Wetlands", svg:[marshTerrain], dm:2, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:1, 2:1, 3:0, 4:0, 5:5, 6:2}};
const tjl_NATIVE_TERRAIN_BAKED_LANDS = {name:"Baked Lands", svg:[bakedLandsTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:5, 6:8}};
const tjl_NATIVE_TERRAIN_TWILIGHT = {name:"Twilight", svg:[], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:5, 6:5}};
const tjl_NATIVE_TERRAIN_FROZEN_LANDS = {name:"Frozen Lands", svg:[frozenLandTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:5, 6:8}};
const tjl_NATIVE_TERRAIN_VOLCANO = {name:"Volcano", svg:[volcanoTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:5, 4:5, 5:9, 6:8}};
const tjl_NATIVE_TERRAIN_CHASM = {name:"Chasm", svg:[chasmTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:5, 5:5, 6:8}};
const tjl_NATIVE_TERRAIN_PRECIPICE = {name:"Precipice", svg:[precipiceTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:5, 5:5, 6:8}};
const tjl_NATIVE_TERRAIN_CITY = {name:"City", svg:[cityTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_SUBURBS = {name:"Suburbs", svg:[suburbTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_TOWN = {name:"Town", svg:[townTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_RURAL = {name:"Rural", svg:[ruralTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_CROPLANDS = {name:"Croplands", svg:[cropTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_STARPORT = {name:"Starport", svg:[starportTerrain], dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:0, 5:0, 6:5}};
const tjl_NATIVE_TERRAIN_ALL = [tjl_NATIVE_TERRAIN_CLEAR, tjl_NATIVE_TERRAIN_ROUGH, tjl_NATIVE_TERRAIN_FOREST, tjl_NATIVE_TERRAIN_WETLAND_WOODS, tjl_NATIVE_TERRAIN_ROUGH_WOOD, tjl_NATIVE_TERRAIN_RESERVE, tjl_NATIVE_TERRAIN_MOUNTAIN, tjl_NATIVE_TERRAIN_DESERT, tjl_NATIVE_TERRAIN_CAVERNS, tjl_NATIVE_TERRAIN_CRATER, tjl_NATIVE_TERRAIN_WASTELAND, tjl_NATIVE_TERRAIN_MINES, tjl_NATIVE_TERRAIN_ISLAND, tjl_NATIVE_TERRAIN_SHORE, tjl_NATIVE_TERRAIN_ICE_FIELD, tjl_NATIVE_TERRAIN_ICECAP, tjl_NATIVE_TERRAIN_GLACIER, tjl_NATIVE_TERRAIN_EXOTIC, tjl_NATIVE_TERRAIN_ABYSS, tjl_NATIVE_TERRAIN_OCEAN_DEPTHS, tjl_NATIVE_TERRAIN_OCEAN, tjl_NATIVE_TERRAIN_RIVER, tjl_NATIVE_TERRAIN_LAKE, tjl_NATIVE_TERRAIN_WETLANDS, tjl_NATIVE_TERRAIN_BAKED_LANDS, tjl_NATIVE_TERRAIN_TWILIGHT, tjl_NATIVE_TERRAIN_FROZEN_LANDS, tjl_NATIVE_TERRAIN_VOLCANO, tjl_NATIVE_TERRAIN_CHASM, tjl_NATIVE_TERRAIN_PRECIPICE, tjl_NATIVE_TERRAIN_CITY, tjl_NATIVE_TERRAIN_SUBURBS, tjl_NATIVE_TERRAIN_TOWN, tjl_NATIVE_TERRAIN_RURAL, tjl_NATIVE_TERRAIN_CROPLANDS, tjl_NATIVE_TERRAIN_STARPORT];
var tjl_native_terrain_tbl = {dice:function() { return dice(1)*10 + dice(1); },min:11, max:66, 11:tjl_NATIVE_TERRAIN_CLEAR, 12:tjl_NATIVE_TERRAIN_ROUGH, 13:tjl_NATIVE_TERRAIN_FOREST, 14:tjl_NATIVE_TERRAIN_WETLAND_WOODS, 15:tjl_NATIVE_TERRAIN_ROUGH_WOOD, 16:tjl_NATIVE_TERRAIN_RESERVE, 21:tjl_NATIVE_TERRAIN_MOUNTAIN, 22:tjl_NATIVE_TERRAIN_DESERT, 23:tjl_NATIVE_TERRAIN_CAVERNS, 24:tjl_NATIVE_TERRAIN_CRATER, 25:tjl_NATIVE_TERRAIN_WASTELAND, 26:tjl_NATIVE_TERRAIN_MINES, 31:tjl_NATIVE_TERRAIN_ISLAND, 32:tjl_NATIVE_TERRAIN_SHORE, 33:tjl_NATIVE_TERRAIN_ICE_FIELD, 34:tjl_NATIVE_TERRAIN_ICECAP, 35:tjl_NATIVE_TERRAIN_GLACIER, 36:tjl_NATIVE_TERRAIN_EXOTIC, 41:tjl_NATIVE_TERRAIN_ABYSS, 42:tjl_NATIVE_TERRAIN_OCEAN_DEPTHS, 43:tjl_NATIVE_TERRAIN_OCEAN, 44:tjl_NATIVE_TERRAIN_RIVER, 45:tjl_NATIVE_TERRAIN_LAKE, 46:tjl_NATIVE_TERRAIN_WETLANDS, 51:tjl_NATIVE_TERRAIN_BAKED_LANDS, 52:tjl_NATIVE_TERRAIN_TWILIGHT, 53:tjl_NATIVE_TERRAIN_FROZEN_LANDS, 54:tjl_NATIVE_TERRAIN_VOLCANO, 55:tjl_NATIVE_TERRAIN_CHASM, 56:tjl_NATIVE_TERRAIN_PRECIPICE, 61:tjl_NATIVE_TERRAIN_CITY, 62:tjl_NATIVE_TERRAIN_SUBURBS, 63:tjl_NATIVE_TERRAIN_TOWN, 64:tjl_NATIVE_TERRAIN_RURAL, 65:tjl_NATIVE_TERRAIN_CROPLANDS, 66:tjl_NATIVE_TERRAIN_STARPORT};

const tjl_NICHE_TBL = {dice:function() {return flux();}, min:-5, max:5, "-5":"Producer","-4":"Producer","-4":"Herbivore","-3":"Herbivore","-2":"Omnivore","-1":"Omnivore",0:"Omnivore",1:"Omnivore",2:"Omnivore",3:"Carnivore",4:"Carnivore",5:"Scavenger",6:"Scavenger"};
const tjl_SUB_NICHE_FLUX_TBLS = {
	"Producer":{dice:function() { return flux(); },min:-5,max:5, "-5":1, "-4":1, "-3":1, "-2":1, "-1":0, 0:0, 1:0, 2:0, 3:0, 4:1, 5:1},
	"Herbivore":{dice:function() { return flux(); },min:-6,max:6, "-5":2, "-4":2, "-3":4, "-2":4, "-1":4, 0:3, 1:3, 2:3, 3:3, 4:4, 5:2},
	"Omnivore":{dice:function() { return flux(); },min:-6,max:6, "-5":8, "-4":8, "-3":7, "-2":7, "-1":7, 0:6, 1:5, 2:5, 3:5, 4:8, 5:8},
	"Carnivore":{dice:function() { return flux(); },min:-6,max:6, "-5":9, "-4":9, "-3":9, "-2":10, "-1":12, 0:11, 1:12, 2:10, 3:13, 4:13, 5:13},
	"Scavenger":{dice:function() { return flux(); },min:-6,max:6, "-5":15, "-4":15, "-3":15, "-2":14, "-1":16, 0:14, 1:16, 2:14, 3:17, 4:17, 5:17}
};
const tjl_LOCOMOTION_TYPES = ["Walks","Dives","Swims","Flies","Immobile","Drifts"];
const tjl_MOVEMENT_TYPES = [{type:"Walker", loco_types:[0]}, /* 0 */
{type:"Amphibian", loco_types:[0,2]}, /* 1 */
{type:"Triphibian", loco_types:[0,2,3]}, /* 2 */
{type:"Aquatic", loco_types:[1,2]}, /* 3 */
{type:"Diver", loco_types:[1]}, /* 4 */
{type:"Flyer", loco_types:[0,3]}, /* 5 */
{type:"Flyphibian", loco_types:[2,3]}, /* 6 */
{type:"Swimmer", loco_types:[2]}, /* 7 */
{type:"Static", loco_types:[4]}, /* 8 */
{type:"Drifter", loco_types:[5]}]; /* 9 */

const tjl_all_sub_niches = [
{niche:"Producer", subniche:"Collector", speedDM:-5, a:"N", f:"N"}, /* 0 */
{niche:"Producer", subniche:"Basker", speedDM:-5, a:"N", f:"N"}, /* 1 */
{niche:"Herbivore", subniche:"Filter", speedDM:0, a:"P", f:12}, /* 2 */
{niche:"Herbivore", subniche:"Grazers", speedDM:0, a:10, f:10}, /* 3 */
{niche:"Herbivore", subniche:"Intermittents", speedDM:0, a:11, f:11}, /* 4 */
{niche:"Omnivore", subniche:"Hunter", speedDM:0, a:14, f:10}, /* 5 */
{niche:"Omnivore", subniche:"Hunter / Gatherer", speedDM:0, a:12, f:11}, /* 6 */
{niche:"Omnivore", subniche:"Gatherer", speedDM:0, a:11, f:12}, /* 7 */
{niche:"Omnivore", subniche:"Eater", speedDM:0, a:14, f:10}, /* 8 */
{niche:"Carnivore", subniche:"Trapper", speedDM:0, a:"S", f:12}, /* 9 */
{niche:"Carnivore", subniche:"Siren", speedDM:0, a:"S", f:12}, /* 10 */
{niche:"Carnivore", subniche:"Chaser", speedDM:0, a:10, f:10}, /* 11 */
{niche:"Carnivore", subniche:"Pouncer", speedDM:0, a:"S", f:"S+"}, /* 12 */
{niche:"Carnivore", subniche:"Killer", speedDM:0, a:14, f:9}, /* 13 */
{niche:"Scavenger", subniche:"Intimidator", speedDM:0, a:12, f:11}, /* 14 */
{niche:"Scavenger", subniche:"Hijacker", speedDM:0, a:13, f:11}, /* 15 */
{niche:"Scavenger", subniche:"Carrion-eater", speedDM:0, a:12, f:12}, /* 16 */
{niche:"Scavenger", subniche:"Reducer", speedDM:0, a:12, f:12}, /* 17 */
];

const tjl_QUANTITY_TBL = {dice:function(){return flux();}, min:-5, max:5, 
	"-5":"Solitary (1)",
	"-4":"Single (1)",
	"-3":"Pair (half D)",
	"-2":"Small Group (1D)",
	"-1":"Large Group (1D+2)",
	0:"Pack (2D)",
	1:"Small Herd (3D)",
	2:"Large Herd (4D)",
	3:"Small Swarm (6D)",
	4:"Large Swarm (8D)",
	5:"Hive (2D*2D)"
	}

const tjl_all_beast_sizes = [
{size:"R", descriptor:"Microscopic", value:0.001, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":0.0005, "-4":0.0006, "-3":0.0007, "-2":0.0008, "-1":0.0009, 0:0.001, 1:0.0012, 2:0.0014, 3:0.0016, 4:0.0018, 5:0.002}}, /* 0 */
{size:"T", descriptor:"Miniscule", value:0.002, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":0.0015, "-4":0.0016, "-3":0.0017, "-2":0.0018, "-1":0.0019, 0:0.002, 1:0.003, 2:0.004, 3:0.005, 4:0.006, 5:0.007}}, /* 1 */
{size:1, descriptor:"Tiny", value:0.007, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":0.0045, "-4":0.005, "-3":0.0055, "-2":0.006, "-1":0.0065, 0:0.007, 1:0.02, 2:0.035, 3:0.05, 4:0.06, 5:0.075}}, /* 2 */
{size:2, descriptor:"Very Small", value:0.075, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":0.04, "-4":0.05, "-3":0.055, "-2":0.06, "-1":0.07, 0:0.075, 1:0.1, 2:0.12, 3:0.15, 4:0.18, 5:0.2}}, /* 3 */
{size:3, descriptor:"Small", value:0.02, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":0.14, "-4":0.15, "-3":0.16, "-2":0.18, "-1":0.19, 0:0.2, 1:0.3, 2:0.4, 3:0.5, 4:0.65, 5:0.75}}, /* 4 */
{size:4, descriptor:"Typical", value:0.75, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":0.45, "-4":0.5, "-3":0.6, "-2":0.65, "-1":0.7, 0:0.75, 1:0.9, 2:1.05, 3:1.2, 4:1.35, 5:1.5}}, /* 5 */
{size:5, descriptor:"Large", value:1.5, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":1.1, "-4":1.2, "-3":1.3, "-2":1.35, "-1":1.4, 0:1.5, 1:2.7, 2:3.5, 3:5.0, 4:6.5, 5:7.5}}, /* 6 */
{size:6, descriptor:"Very Large", value:7.5, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":4.0, "-4":5.0, "-3":6.0, "-2":6.5, "-1":7.0, 0:7.5, 1:20, 2:35, 3:50, 4:60, 5:75}}, /* 7 */
{size:7, descriptor:"Gigantic", value:75, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":40, "-4":50, "-3":55, "-2":60, "-1":70, 0:75, 1:200, 2:350, 3:500, 4:600, 5:750}}, /* 8 */
{size:8, descriptor:"Colossal", value:750, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":400, "-4":500, "-3":550, "-2":600, "-1":700, 0:750, 1:2000, 2:3500, 3:5000, 4:6000, 5:7000}}, /* 9 */
{size:9, descriptor:"Very Colossal", value:7500, varianceTbl:{dice:function(){return flux();}, min:-5, max:5, "-5":4000, "-4":5000, "-3":5500, "-2":6000, "-1":7000, 0:7500, 1:20000, 2:35000, 3:50000, 4:60000, 5:70000}} /* 10 */
];

const tjl_beast_variances = {"-5":0.5, "-4":0.6, "-3":0.7, "-2":0.8, "-1":0.9, 0:1, 1:1.2, 2:1.4, 3:1.6, 4:1.8, 5:2};

const tjl_BEAST_SIZE_TBL = {dice:function(){return flux();}, min:-5, max:6, 
"=6":2, 
"-5":2, 
"-4":3, 
"-3":3, 
"-2":4, 
"-1":4, 
0:5, 
1:5, 
2:6, 
3:6, 
4:7, 
5:7, 
6:8};

const tjl_BEAST_STRENGTH_TBL = {dice:function(){return dice(1);}, min:0, max:7, 
0:{descriptor:"Feeble (1D-3)", largeDescriptor:"Feeble (3D-3)"}, 
1:{descriptor:"Weak (1D)", largeDescriptor:"Weak (3D)"}, 
2:{descriptor:"Typical (2D)", largeDescriptor:"Typical (4D)"}, 
3:{descriptor:"Typical (3D)", largeDescriptor:"Typical (5D)"}, 
4:{descriptor:"Strong (4D)", largeDescriptor:"Strong (6D)"}, 
5:{descriptor:"Very Strong (5D)", largeDescriptor:"Very Strong (7D)"}, 
6:{descriptor:"Formidable (6D)", largeDescriptor:"Formidable (8D)"}, 
7:{descriptor:"Herculean (7D)", largeDescriptor:"Herculean (9D)"}};

const tjl_SPEED_TBL = {dice:function(){return dice(1);}, min:0, max:8, 
0:{descriptor:"Static", value:0},
1:{descriptor:"Walk", value:5},
2:{descriptor:"Run", value:10},
3:{descriptor:"Sprint", value:20},
4:{descriptor:"Charge", value:30},
5:{descriptor:"Fast", value:50},
6:{descriptor:"Very Fast", value:100},
7:{descriptor:"Extra Fast", value:300},
8:{descriptor:"Highly Fast", value:500}};

const tjl_BEAST_WEAPONS = [
{name:"Horns",inflicts:"Cut"}, /* 0 */
{name:"Antlers",inflicts:"Cut"}, /* 1 */
{name:"Tusks",inflicts:"Cut"}, /* 2 */
{name:"Fangs",inflicts:"Cut"}, /* 3 */
{name:"Teeth",inflicts:"Cut"}, /* 4 */
{name:"Claws",inflicts:"Cut"}, /* 5 */
{name:"Hooves",inflicts:"Blow"}, /* 6 */
{name:"Spikes",inflicts:"Cut"}, /* 7 */
{name:"Quills",inflicts:"Cut"}, /* 8 */
{name:"Sting",inflicts:"Poison/Tranq"}, /* 9 */
{name:"Manipulator",inflicts:"Blow"}, /* 10 */
{name:"Ped",inflicts:"Blow"}, /* 11 */
{name:"Thag",inflicts:"Blow"}, /* 12 */
{name:"Body", inflicts:"Blow"}
];

const tjl_BEAST_WEAPONS_TBL = {dice:function(){return flux();}, min:-6, max:6, "-6":5, "-5":5, "-4":9, "-3":2, "-2":2, "-1":4, 0:11, 1:13, 2:0, 3:0, 4:7, 5:7, 6:13};

const tjl_BEAST_ARMOUR_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":{dice:1, type:"RadProof"},
"-4":{dice:4, type:"Armour"},
"-3":{dice:1, type:"Flashproof"},
"-2":{dice:2, type:"Sealed"},
"-1":{dice:1, type:"Sealed"},
0:{dice:2, type:"Armour"},
1:{dice:1, type:"Insulated"},
2:{dice:2, type:"Insulated"},
3:{dice:1, type:"SoundProof"},
4:{dice:3, type:"Armour"},
5:{dice:1, type:"PsiShield"}};

const tjl_SYMMETRY_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"Asymmetrical",
"-4":"Asymmetrical",
"-3":"Asymmetrical",
"-2":"Bilateral",
"-1":"Bilateral",
0:"Bilateral",
1:"Bilateral",
2:"Trilateral",
3:"Trilateral",
4:"Radial",
5:"Radial"};

const tjl_BRAIN_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"H",
"-4":"H",
"-3":"H",
"-2":"H",
"-1":"H",
0:"H",
1:"H",
2:"H",
3:"T",
4:"T",
5:"T"
};

const tjl_SENSES_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"T",
"-4":"T",
"-3":"T",
"-2":"H",
"-1":"H",
0:"H",
1:"H",
2:"H",
3:"T",
4:"T",
5:"T"
};

const tjl_BREATH_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"H",
"-4":"H",
"-3":"H",
"-2":"H",
"-1":"H",
0:"H",
1:"H",
2:"H",
3:"T",
4:"T",
5:"T"
};

const tjl_FEED_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"H",
"-4":"H",
"-3":"H",
"-2":"H",
"-1":"H",
0:"H",
1:"H",
2:"H",
3:"T",
4:"T",
5:"T"
};

// A = Arm, N = None, L = Leg, M=Legs W = Wing, F - Flipper

const tjl_LIMBS_WALKER_FRONT_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"AA",
"-4":"AA",
"-3":"AN",
"-2":"AN",
"-1":"LL",
0:"LL",
1:"LL",
2:"LN",
3:"AL",
4:"AL",
5:"NN"
};

const tjl_LIMBS_WALKER_REAR_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"LL",
"-4":"LL",
"-3":"LN",
"-2":"LN",
"-1":"LN",
0:"LN",
1:"LN",
2:"LN",
3:"LN",
4:"LM",
5:"NN"
};

const tjl_LIMBS_FLYER_FRONT_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"WW",
"-4":"WW",
"-3":"WA",
"-2":"WL",
"-1":"WL",
0:"WL",
1:"WL",
2:"WN",
3:"AN",
4:"AN",
5:"AA"
};

const tjl_LIMBS_FLYER_REAR_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"WW",
"-4":"WL",
"-3":"WL",
"-2":"WN",
"-1":"WN",
0:"LN",
1:"LN",
2:"LN",
3:"LM",
4:"MM",
5:"NN"
};

const tjl_LIMBS_AMPHIB_FRONT_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"AA",
"-4":"AA",
"-3":"AF",
"-2":"AF",
"-1":"AL",
0:"AL",
1:"AL",
2:"AN",
3:"AF",
4:"AF",
5:"NN"
};

const tjl_LIMBS_AMPHIB_REAR_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"FF",
"-4":"LF",
"-3":"LL",
"-2":"LN",
"-1":"FN",
0:"FN",
1:"LN",
2:"FL",
3:"FF",
4:"LM",
5:"NN"
};

const tjl_LIMBS_SWIMMER_FRONT_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"AN",
"-4":"AN",
"-3":"AN",
"-2":"AN",
"-1":"FN",
0:"FN",
1:"FN",
2:"FF",
3:"NN",
4:"AA",
5:"FF"
};

const tjl_LIMBS_SWIMMER_REAR_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"FF",
"-4":"FF",
"-3":"LL",
"-2":"LN",
"-1":"LN",
0:"FN",
1:"FN",
2:"FN",
3:"NN",
4:"LM",
5:"FF"
};

const tjl_LIMBS_FLYPHIB_FRONT_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"FF",
"-4":"WW",
"-3":"WA",
"-2":"WA",
"-1":"WL",
0:"WL",
1:"WL",
2:"WN",
3:"FN",
4:"FN",
5:"FF"
};

const tjl_LIMBS_FLYPHIB_REAR_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"FF",
"-4":"FM",
"-3":"FL",
"-2":"FN",
"-1":"FF",
0:"FN",
1:"FN",
2:"FN",
3:"FN",
4:"FM",
5:"NN"
};

// P = Proboscis, T = Tail, V = Vestigial, M = Manipulator, A = Antennae
const tjl_LIMBS_TAIL_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"P",
"-4":"V",
"-3":"T",
"-2":"T",
"-1":"N",
0:"N",
1:"N",
2:"N",
3:"N",
4:"M",
5:"A"
};

const tjl_SKELETON_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"Fluid Interior Sacs",
"-4":"Fluid Interior Sacs",
"-3":"Cartilage interior",
"-2":"Cartilage interior",
"-1":"Bony Interior",
0:"Bony Interior",
1:"Bony Interior",
2:"Exoskeleton",
3:"Exoskeleton",
4:"Segmented Shell",
5:"Segmented Shell"
};

const tjl_FLUIDS_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"Foam",
"-4":"Lymph",
"-3":"Hemolymph",
"-2":"Ichor",
"-1":"Blood",
0:"Blood",
1:"Blood",
2:"Gore",
3:"Slime",
4:"Scum",
5:"Humours"
};

const tjl_SKIN_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"Feathery pelt",
"-4":"Furry Pelt",
"-3":"Furry Pelt",
"-2":"Leather",
"-1":"Skin",
0:"Skin",
1:"Skin",
2:"Fine Scales",
3:"Scales",
4:"Spines",
5:"Plates"
};

const tjl_COLOUR_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"Brilliant",
"-4":"Bright",
"-3":"Bright",
"-2":"Bright",
"-1":"Drab",
0:"Drab",
1:"Drab",
2:"Camouflage",
3:"Camouflage",
4:"Camouflage",
5:"Monochrome"
};

const tjl_MANIPULATORS_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":"Tentacles",
"-4":"Tentacles",
"-3":"Grippers",
"-2":"Grippers",
"-1":"Hands",
0:"Hands",
1:"Paws",
2:"Paws",
3:"Graspers",
4:"Graspers",
5:"Sockets"
};

const tjl_BODY_PROFILE_TBL = {dice:function(){return flux();}, min:-5, max:5,
"-5":100,
"-4":20,
"-3":12,
"-2":11,
"-1":10,
0:9,
1:8,
2:7,
3:6,
4:1.5,
5:1
};

const tjl_BEAST_DENSITY_TBL = {dice:function(){return dice(1);}, min:1, max:6,
1:{description:"Sack",multiplier:0.1},
2:{description:"Hollow",multiplier:0.5},
3:{description:"Light",multiplier:0.9},
4:{description:"Standard",multiplier:1.0},
5:{description:"Dense",multiplier:1.1},
6:{description:"V Dense",multiplier:1.5}
}; 

function updateSubNiche()
{
 // when a niche is selected, update the subniche edit to the relevant subniches	
}

function updateBeastStrength()
{
	// when size is updated, check if Size 6 or more and update Strength choices
}