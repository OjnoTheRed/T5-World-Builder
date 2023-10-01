function beast(world, terrain, niche)
{
	var me = this;
	me.world = world;
	me.terrain = terrain;
	me.nativeTerrain = null;
	me.locomotion = null;
	me.niche = niche; // valid values - "Producer","Herbivore","Omnivore","Carnivore","Scavenger"
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
	
	me.generate = function()
	{
		me.nativeTerrain = new dice_table(native_terrain_tbl).roll();
		me.locomotion = MOVEMENT_TYPES[new dice_table(me.nativeTerrain.loco_tbl, me.world.uwp).roll()];
		if(!me.niche || (me.niche != "Producer" && me.niche != "Herbivore" && me.niche != "Omnivore" && me.niche != "Carnivore" && me.niche != "Scavenger" && me.niche != "Event"))
		{
			me.niche = new dice_table(NICHE_TBL).roll();
			var sub_niche_tbl = new dice_table(SUB_NICHE_FLUX_TBLS[me.niche]);
			sub_niche_tbl.DM = me.nativeTerrain.dm;
			me.subniche = all_sub_niches[sub_niche_tbl.roll()];
		}
		else
		{
			if(me.niche == "Event")
				return;
			me.subniche = all_sub_niches[new dice_table(SUB_NICHE_1D_TBLS[me.niche]).roll()];
		}
		var q = new dice_table(QUANTITY_TBL).roll();
		if(typeof(q) == "function")
			me.quantity = q();
		else
			me.quantity = q;
		var s_tbl = new dice_table(BEAST_SIZE_TBL);
		s_tbl.DM = parseInt(GRAV_MOD[me.world.uwp.size]) + parseInt(ATMOS_MOD[me.world.uwp.atmos]);
		me.size = all_beast_sizes[s_tbl.roll()];
		var str_tbl = new dice_table(BEAST_STRENGTH_TBL);
		str_tbl.DM = parseInt(-GRAV_MOD[me.world.uwp.size]) + parseInt(ATMOS_MOD[me.world.uwp.atmos]);
		var strengthObj = str_tbl.roll();
		me.strength = strengthObj.value(me.size.size == "R" || me.size.size == "T" ? 0 : me.size.size);
		me.strengthDescriptor = strengthObj.descriptor;
		var speed_tbl = new dice_table(SPEED_TBL);
		if(me.niche == "Producer")
			speed_tbl.DM -= 5;
		if(me.locomotion.type == "Flyer")
			speed_tbl.DM += 2;
		me.speedAF = speed_tbl.roll();
		me.speedC = speed_tbl.table[Math.max(speed_tbl.min, speed_tbl.rollResult-1)];
		me.speedB = speed_tbl.table[Math.min(speed_tbl.max, speed_tbl.rollResult+1)];
		me.weapon = BEAST_WEAPONS[me.niche == "Carnivore" ? new dice_table(BEAST_WEAPONS_TBL_CARN).roll() : new dice_table(BEAST_WEAPONS_TBL).roll()];
		if(me.weapon.inflicts.search(/\//) != "-1")
		{
			var inflictOptions = me.weapon.inflicts.split("/");
			me.weapon.inflicts = inflictOptions[rng(inflictOptions.length-1)];
		}
		if(me.weapon.inflicts == "tranq")
			me.weapon.damage = "tranq";
		else
			me.weapon.damage = me.strength.dice;
		me.attack = typeof(me.subniche.a) == "string" ? me.subniche.a : me.subniche.a - dice(1);
		me.flee = typeof(me.subniche.f) == "string" ? me.subniche.f : me.subniche.f - dice(1);
		
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
			td.colSpan = 9;
			td.appendChild(txtN);
			tr.appendChild(td);
			return tr;
		}
		var rowData = 	[
						 "" + diceNum + " " + me.niche.substr(0,1), 
						 me.quantity, 
						 me.size.descriptor + " (Size " + me.size.size + ", " + me.size.value + "m)",
						 me.speedAF.descriptor + " (" + me.speedAF.value + " kph)",
						 me.strengthDescriptor + " (" + me.strength + ")",
						 me.locomotion.type,
						 me.subniche.subniche,
						 "A" + me.attack,
						 "F" + me.flee,
						 me.weapon.name + " (" + me.weapon.inflicts + " " + me.strength + " hits)"
						];
		rowData.map(function(bData) {
						var td = document.createElement("TD");
						var txt = document.createTextNode(bData);
						td.appendChild(txt);
						tr.appendChild(td);
		});
		return tr;
	}
}

function beastTable(world, terrain, auto_gen)
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
			var beastie = new beast(me.world, "", nicheStr);
			beastie.generate();
			me.beasts.push(beastie);
		});
	}
	
	me.toTable = function()
	{
		var tbl = document.createElement("TABLE");
		var title_row = document.createElement("TR");
		var title_text = ["BEAST ENCOUNTER TABLE", "Grav Mod = " + parseInt(GRAV_MOD[me.world.uwp.size]), "Atm Mod = " + parseInt(ATMOS_MOD[me.world.uwp.atmos]),"Environ DM = " + me.terrain.dm, ""];
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
			title_cell.colSpan = index == 0 ? 3 : 2;
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
			title_cell2.colSpan = index == 0 ? 5 : 4;
			title_cell2.innerHTML = cellHTML;
			title_row_2.appendChild(title_cell2);
		});
		tbl.appendChild(title_row_2);
		var hdr_row = document.createElement("TR");
		const hdr_row_text = ["1D Niche","Qty","Size","SpeedAF","Strength","Locomotion","Type","A","F","Comments"];
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
const GRAV_MOD = [1,1,1,1,1,0,0,0,0,"-1","-1","-1","-1","-2","-2","-2"];
const ATMOS_MOD = [0,0,0,0,"-1","-1",0,0,1,1,0,0,0,1,0,"-1"];
const NATIVE_TERRAIN_SIZE_MOD = {property:"size", 0:1, 1:1, 2:1, 3:1, 4:1, 5:1, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0, 13:0, 14:0, 15:0, 16:0, 17:0, 18:0, 19:0, 20:0};
const NATIVE_TERRAIN_ATMOS_MOD = {property:"atmos", 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:2, 9:2, 10:2, 11:2, 12:2, 13:2, 14:2, 15:2};
const NATIVE_TERRAIN_HYDRO_MOD = {property:"hydro", 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:1, 7:1, 8:1, 9:2, 10:2};
const NATIVE_TERRAIN_MOUNTAIN = {name:"Mountain", svg:[mountainTerrain], code:21, dm:-5, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:0, 2:0, 3:0, 4:0, 5:5, 6:8}};
const NATIVE_TERRAIN_DESERT = {name:"Desert", svg:[desertTerrain], code:22, dm:-4, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:0, 2:0, 3:0, 4:0, 5:5, 6:8}};
const NATIVE_TERRAIN_EXOTIC = {name:"Exotic", svg:[exoticTerrain], code:46, dm:-3, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:3, 2:0, 3:0, 4:0, 5:5, 6:6}};
const NATIVE_TERRAIN_ROUGH_WOOD = {name:"Rough Wood", svg:[roughTerrain,woodsTerrain], code:14, dm:-2, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:3, 2:0, 3:0, 4:0, 5:5, 6:8}};
const NATIVE_TERRAIN_ROUGH = {name:"Rough", svg:[roughTerrain], code:13, dm:-1, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:1, 2:0, 3:0, 4:0, 5:5, 6:8}};
const NATIVE_TERRAIN_CLEAR = {name:"Clear", svg:[clearTerrain], code:11, dm:0, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:0, 2:0, 3:0, 4:0, 5:0, 6:6}};
const NATIVE_TERRAIN_FOREST = {name:"Forest", svg:[woodsTerrain], code:14, dm:1, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:0, 2:0, 3:0, 4:0, 5:6, 6:8}};
const NATIVE_TERRAIN_WETLANDS = {name:"Wetlands", svg:[marshTerrain], code:12, dm:2, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:1, 2:3, 3:0, 4:0, 5:2, 6:6}};
const NATIVE_TERRAIN_WETLAND_WOODS = {name:"Wetland Woods", svg:[swampTerrain], code:15, dm:3, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:1, 2:3, 3:0, 4:0, 5:2, 6:6}};
const NATIVE_TERRAIN_OCEAN = {name:"Ocean", svg:[oceanTerrain], code:31, dm:4, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:6, 2:7, 3:7, 4:7, 5:3, 6:4}};
const NATIVE_TERRAIN_OCEAN_DEPTHS = {name:"Ocean Depths", svg:[oceanDepthTerrain], code:71, dm:5, loco_tbl:{dice:function() { return dice(1); }, min:1, max:6, mods:[NATIVE_TERRAIN_SIZE_MOD, NATIVE_TERRAIN_ATMOS_MOD, NATIVE_TERRAIN_HYDRO_MOD], 1:3, 2:4, 3:4, 4:4, 5:9, 6:9}};
const NATIVE_TERRAIN_ALL = [NATIVE_TERRAIN_MOUNTAIN, NATIVE_TERRAIN_DESERT, NATIVE_TERRAIN_EXOTIC, NATIVE_TERRAIN_ROUGH_WOOD, NATIVE_TERRAIN_ROUGH, NATIVE_TERRAIN_CLEAR, NATIVE_TERRAIN_FOREST, NATIVE_TERRAIN_WETLANDS, NATIVE_TERRAIN_WETLAND_WOODS, NATIVE_TERRAIN_OCEAN, NATIVE_TERRAIN_OCEAN_DEPTHS];
var native_terrain_tbl = {dice:function() { return flux(); },min:-5, max:5, "-5":NATIVE_TERRAIN_MOUNTAIN, "-4":NATIVE_TERRAIN_DESERT, "-3":NATIVE_TERRAIN_EXOTIC, "-2":NATIVE_TERRAIN_ROUGH_WOOD, "-1":NATIVE_TERRAIN_ROUGH, 0:NATIVE_TERRAIN_CLEAR, 1:NATIVE_TERRAIN_FOREST, 2:NATIVE_TERRAIN_WETLANDS, 3:NATIVE_TERRAIN_WETLAND_WOODS, 4:NATIVE_TERRAIN_OCEAN, 5:NATIVE_TERRAIN_OCEAN_DEPTHS};

const NICHE_TBL = {dice:function() {return flux();}, min:-5, max:5, "-5":"Producer","-4":"Producer","-4":"Herbivore","-3":"Herbivore","-2":"Omnivore","-1":"Omnivore",0:"Omnivore",1:"Omnivore",2:"Omnivore",3:"Carnivore",4:"Carnivore",5:"Scavenger",6:"Scavenger"};
const SUB_NICHE_FLUX_TBLS = {
	"Producer":{dice:function() { return flux(); },min:-6,max:6, "-6":0, "-5":0, "-4":0, "-3":0, "-2":0, "-1":0, 0:1, 1:1, 2:1, 3:1, 4:1, 5:1, 6:1},
	"Herbivore":{dice:function() { return flux(); },min:-6,max:6, "-6":3, "-5":3, "-4":3, "-3":4, "-2":4, "-1":4, 0:4, 1:3, 2:3, 3:3, 4:3, 5:3, 6:2},
	"Omnivore":{dice:function() { return flux(); },min:-6,max:6, "-6":5, "-5":5, "-4":5, "-3":5, "-2":5, "-1":7, 0:6, 1:7, 2:7, 3:7, 4:7, 5:7, 6:8},
	"Carnivore":{dice:function() { return flux(); },min:-6,max:6, "-6":12, "-5":12, "-4":12, "-3":12, "-2":12, "-1":12, 0:11, 1:11, 2:11, 3:11, 4:9, 5:10, 6:13},
	"Scavenger":{dice:function() { return flux(); },min:-6,max:6, "-6":16, "-5":16, "-4":16, "-3":15, "-2":15, "-1":15, 0:14, 1:14, 2:14, 3:14, 4:14, 5:17, 6:17}	
}

const SUB_NICHE_1D_TBLS = {
	"Producer":{dice:function() { return dice(1); }, min:1, max:6, 1:0, 2:0, 3:0, 4:1, 5:1, 6:1},
	"Herbivore":{dice:function() { return dice(1); }, min:1, max:6, 1:2, 2:3, 3:3, 4:3, 5:4, 6:4},
	"Omnivore":{dice:function() { return dice(1); }, min:1, max:6, 1:5, 2:5, 3:6, 4:7, 5:7, 6:8},
	"Carnivore":{dice:function() { return dice(1); }, min:1, max:6, 1:9, 2:10, 3:11, 4:12, 5:12, 6:13},
	"Scavenger":{dice:function() { return dice(1); }, min:1, max:6, 1:14, 2:14, 3:15, 4:16, 5:16, 6:17}
}

const LOCOMOTION_TYPES = ["Walks","Dives","Swims","Flies","Immobile","Drifts"];
const MOVEMENT_TYPES = [{type:"Walker", loco_types:[0]},
{type:"Amphibian", loco_types:[0,2]},
{type:"Triphibian", loco_types:[0,2,3]},
{type:"Aquatic", loco_types:[1,2]},
{type:"Diver", loco_types:[1]},
{type:"Flyer", loco_types:[0,3]},
{type:"Flyphibian", loco_types:[2,3]},
{type:"Swimmer", loco_types:[2]},
{type:"Static", loco_types:[4]},
{type:"Drifter", loco_types:[5]}];

const all_sub_niches = [
{niche:"Producer", subniche:"Collector", speedDM:-5, a:"(No)", f:"(No)"}, /* 0 */
{niche:"Producer", subniche:"Basker", speedDM:-5, a:"(No)", f:"(No)"}, /* 1 */
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

const QUANTITY_TBL = {dice:function(){return dice(1);}, min:1, max:6, 1:1, 2:2, 3:3, 4:function(){return dice(2);}, 5:function(){return dice(1)+2;}, 6:function(){return dice(1)*dice(1);}}

const all_beast_sizes = [
{size:"R", descriptor:"Microscopic", value:0.001}, /* 0 */
{size:"T", descriptor:"Miniscule", value:0.002}, /* 1 */
{size:1, descriptor:"Tiny", value:0.007}, /* 2 */
{size:2, descriptor:"Very Small", value:0.075}, /* 3 */
{size:3, descriptor:"Small", value:0.02}, /* 4 */
{size:4, descriptor:"Typical", value:0.75}, /* 5 */
{size:5, descriptor:"Large", value:1.5}, /* 6 */
{size:6, descriptor:"Very Large", value:7.5}, /* 7 */
{size:7, descriptor:"Gigantic", value:75}, /* 8 */
{size:8, descriptor:"Colossal", value:750}, /* 9 */
{size:9, descriptor:"Very Colossal", value:7500} /* 10 */
];

const BEAST_SIZE_TBL = {dice:function(){return flux();}, min:-5, max:6, "-5":0, "-4":1, "-3":2, "-2":3, "-1":4, 0:5, 1:5, 2:6, 3:7, 4:8, 5:9, 6:10};

const BEAST_STRENGTH_TBL = {dice:function(){return dice(1);}, min:0, max:7, 0:{descriptor:"Feeble", value:function(){return Math.max(0,dice(1)-3);}, dice:0}, 1:{descriptor:"Weak", value:function(s){return s*dice(1);}, dice:1}, 2:{descriptor:"Typical", value:function(s){return s*dice(2);}, dice:2}, 3:{descriptor:"Typical", value:function(s){return s*dice(3);}, dice:3}, 4:{descriptor:"Strong", value:function(s){return s*dice(4);}, dice:4}, 5:{descriptor:"Very Strong", value:function(s){return s*dice(5);}, dice:5}, 6:{descriptor:"Formidable", value:function(s){return s*dice(6);}, dice:6}, 7:{descriptor:"Herculean", value:function(s){return s*dice(7);}, dice:7}};

const SPEED_TBL = {dice:function(){return dice(1);}, min:0, max:8, 0:{descriptor:"Immobile", value:0},1:{descriptor:"Walk", value:5},2:{descriptor:"Run", value:10},3:{descriptor:"Sprint", value:20},4:{descriptor:"Charge", value:30},5:{descriptor:"Fast", value:50},6:{descriptor:"Very Fast", value:100},7:{descriptor:"Extra Fast", value:300},8:{descriptor:"Highly Fast", value:500}};

const BEAST_WEAPONS = [
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

const BEAST_WEAPONS_TBL = {dice:function(){return flux();}, min:-5, max:5, "-5":11, "-4":11, "-3":1, "-2":0, "-1":0, 0:4, 1:13, 2:13, 3:8, 4:7, 5:9, 6:12};
const BEAST_WEAPONS_TBL_CARN = {dice:function(){return flux();}, min:-5, max:5, "-5":5, "-4":5, "-3":2, "-2":2, "-1":4, 0:4, 1:4, 2:4, 3:4, 4:9, 5:9, 6:9};


