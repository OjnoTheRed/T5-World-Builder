HEAVY_FIGHTING = -1;
VIRUS = -1;
LIGHTLY_AFFECTED = 0;
CORE_REGION_POCKET = 1;
THE_WAVE = -2;
TAINTED_ATMOS = -1;
COLLAPSE = false;
WAVE = true;

function reduce_selected_sector_marc()
{
	var reducDiv = document.getElementById("ReducDiv");
	if(reducDiv !== null)
		document.body.removeChild(reducDiv);
	reducDiv = document.createElement("DIV");
	reducDiv.style.clear = "both";
	reducDiv.style.overflowX = "scroll";
	reducDiv.id = "ReducDiv";
	document.body.appendChild(reducDiv);
	var numIterations = parseInt(document.getElementById("numIterations").value);
	
	var reducTbl = document.createElement("TABLE");
	reducDiv.appendChild(reducTbl);
	
	var reducTblHdr1 = document.createElement("TR");
	var tblHdr1Cells = [];
	for(var i=0;i<numIterations+1;i++)
	{
		var hdr1_cell = document.createElement("TH");
		hdr1_cell.colSpan = 3;
		hdr1_cell.innerHTML = i ? ("Iteration " + i) : "Original";
		tblHdr1Cells[i] = hdr1_cell;
		reducTblHdr1.appendChild(tblHdr1Cells[i]);
	}
	reducTbl.appendChild(reducTblHdr1);
	var reducTblHdr2 = document.createElement("TR");
	var tblHdr2Cells = [];
	for(i=0;i<numIterations+1;i++)
	{
		var hdr2_cell_a = document.createElement("TH");
		hdr2_cell_a.innerHTML = i ? "State of Change" : "Name";
		tblHdr2Cells.push(hdr2_cell_a);
		reducTblHdr2.appendChild(hdr2_cell_a);
		var hdr2_cell_b = document.createElement("TH");
		hdr2_cell_b.innerHTML = "UWP";
		tblHdr2Cells.push(hdr2_cell_b);
		reducTblHdr2.appendChild(hdr2_cell_b);
		var hdr2_cell_c = document.createElement("TH");
		hdr2_cell_c.innerHTML = "TCs";
		tblHdr2Cells.push(hdr2_cell_c);
		reducTblHdr2.appendChild(hdr2_cell_c);		
	}
	reducTbl.appendChild(reducTblHdr2);
	worldArray.map(function(world)
						{
							var reduc_obj = new reduceWorldMarc(world);
							var newRow = document.createElement("TR");
							reducTbl.appendChild(newRow);
							var oWCells = reduc_obj.cells_sW();
							oWCells.map(function(v) 
											{
												newRow.appendChild(v);
											});
							var rWCells = reduc_obj.cells_rW();
							rWCells.map(function(v) 
											{
												newRow.appendChild(v);
											});							
							for(i=0;i<numIterations-1;i++)
							{
								reduc_obj = new reduceWorldMarc(reduc_obj.rW);
								rWCells = reduc_obj.cells_rW();
								rWCells.map(function(v) 
												{
													newRow.appendChild(v);
												});							
							}
						});
	
	
}

function reduceWorldMarc(world, auto_generate)
{
	var me = this;
	me.sW = world; // source world
	me.rW = new mainWorld(); // reduced world derived from source world
	me.new_world = false;
	
	if(arguments.length < 2)
		auto_generate = true;

	me.copy_rw_to_sw = function()
	{
		me.sW = new mainWorld();
		me.sW.name = me.rW.name;
		me.sW.uwp.port = me.rW.uwp.port;
		me.sW.uwp.size = me.rW.uwp.size;
		me.sW.uwp.atmos = me.rW.uwp.atmos;
		me.sW.uwp.hydro = me.rW.uwp.hydro;
		me.sW.uwp.popul = me.rW.uwp.popul;
		me.sW.uwp.gov = me.rW.uwp.gov;
		me.sW.uwp.law = me.rW.uwp.law;
		me.sW.uwp.TL = me.rW.uwp.TL;
		me.sW.tcs.classes.map(function(v)
								{
									me.rW.tcs.add(v);
								});
		me.sW.iX = me.rW.iX;
	}
	
	var STATE_OF_CHANGE;
	var ORIGINAL_STATE_OF_CHANGE;
	me.stateOfChange = function()
	{
		if(STATE_OF_CHANGE !== undefined)
			return STATE_OF_CHANGE
		STATE_OF_CHANGE = ORIGINAL_STATE_OF_CHANGE = flux();
		return STATE_OF_CHANGE;
	}
	
	me.shiftStateOfChange = function()
	{
		var local_s_of_c = me.stateOfChange();
		if(local_s_of_c == 0)
			return 0;
		if(local_s_of_c < 0)
		{
			STATE_OF_CHANGE++;
			return STATE_OF_CHANGE;
		}
		STATE_OF_CHANGE--;
		return STATE_OF_CHANGE;
	}
	
	me.stateOfChangeDesc = function()
	{
		return STATE_OF_CHANGE_DESCRIPTIONS[ORIGINAL_STATE_OF_CHANGE] + " (" + ORIGINAL_STATE_OF_CHANGE + ")";
	}
	
	me.reduceWorld = function()
	{
		if(me.sW.uwp.popul == 7 || me.sW.uwp.popul == 8)
			me.sW.tcs.add("S8"); // dummy population trade code 
		
		me.rW.uwp.size = me.sW.uwp.size;
		me.rW.uwp.TL = me.sW.uwp.TL;
		
		var rarelyTbl = new dice_table(LTC_D_TBL);
		rarelyTbl.DM = me.stateOfChange();
		me.rW.uwp.atmos = me.sW.uwp.atmos + rarelyTbl.roll();
		
		var slowlyTbl = new dice_table(LTC_C_TBL);
		slowlyTbl.DM = me.shiftStateOfChange();

		var slowly_result = SPECIAL_POP_SITUATIONS[slowlyTbl.roll()];
		var action;
		if(me.sW.tcs.has("Ba") || me.sW.tcs.has("Di"))
			action = slowly_result.Ba;
		if(me.sW.tcs.has("Lo"))
			action = slowly_result.Lo;
		if(me.sW.tcs.has("Ni"))
			action = slowly_result.Ni;
		if(me.sW.tcs.has("S8"))
			action = slowly_result.S8;
		if(me.sW.tcs.has("Hi"))
			action = slowly_result.Hi;
		switch(action)
		{
			case "NE":
				break;
			case "Di":
				me.rW.uwp.popul = 0;
				me.rW.uwp.gov = 0;
				me.rW.uwp.law = 0;
				break;
			case "R7":
				me.rW.uwp.popul = 7;
				me.rW.uwp.gov = me.sW.uwp.gov + (me.rW.uwp.popul - me.sW.uwp.popul);
				break;
			case "-2":
			case "-1":
			case "1":
			case "2":
			case "3":
				me.rW.uwp.popul = me.sW.uwp.popul + parseInt(action);
				me.rW.uwp.gov = me.sW.uwp.gov + (me.rW.uwp.popul - me.sW.uwp.popul);
				break;
			case "1D":
				me.rW.uwp.popul = dice(1);
				me.rW.uwp.gov = me.rW.uwp.popul + flux();
				break;
			case "2D":
				me.rW.uwp.popul = dice(2);
				me.rW.uwp.gov = me.rW.uwp.popul + flux();
				break;			
		}
		if(me.stateOfChange() == -6)
			me.rW.uwp.TL = Math.max(0,me.rW.uwp.TL-dice(1));
		if(slowly_result.nmw)
		{
			me.new_world = true;
			me.rW.uwp.size = dice(2)-2;
			me.rW.uwp.atmos = Math.max(0,Math.min(15,me.rW.uwp.size + flux()));
			me.rW.uwp.hydro = Math.max(0,Math.min(10,me.rW.uwp.atmos + flux()));
		}
		else
		{
			me.new_world = false;
			me.rW.uwp.size = me.sW.uwp.size;
			me.rW.uwp.atmos = me.sW.uwp.atmos;
			me.rW.uwp.hydro = me.sW.uwp.hydro;
		}
		var steadilyTbl = new dice_table(LTC_B_TBL);
		steadilyTbl.DM = me.shiftStateOfChange();
		steadily_result = steadilyTbl.roll();
		me.rW.uwp.port = me.alterPort(me.sW.uwp.port, steadily_result.sl);
		if(action != "Di")
			me.rW.uwp.law = me.sW.uwp.law + steadily_result.sl;
		me.rW.uwp.TL = me.rW.uwp.TL + steadily_result.tl;
		if(me.rW.uwp.popul < 7)
			me.rW.uwp.TL = Math.max(0, me.rW.uwp.TL-2);
		me.rW.uwp.size = Math.max(0, me.rW.uwp.size);
		me.rW.uwp.atmos = Math.max(0, me.rW.uwp.atmos);
		me.rW.uwp.hydro = Math.max(0, Math.min(10, me.rW.uwp.hydro));
		me.rW.uwp.popul = Math.max(0,me.rW.uwp.popul);
		me.rW.uwp.gov = Math.max(0,me.rW.uwp.gov);
		me.rW.uwp.law = Math.max(0,me.rW.uwp.law);
		me.rW.uwp.TL = Math.max(0,me.rW.uwp.TL);
		me.rW.tcs.generate();
		me.rW.generateIx();
	}
	
	me.alterPort = function(originalPort, steps)
	{
		var ports = "ABCDEX";
		return ports.substr(Math.min(ports.length-1, Math.max(0,ports.search(originalPort)+steps)),1);
	}
	
	me.cells_sW = function()
	{
		var cells = [];
		cells[0] = document.createElement("TD");
		cells[0].innerHTML = me.sW.fullName;
		cells[1] = document.createElement("TD");
		cells[1].innerHTML = me.sW.uwp.toString() + " {" + me.sW.iX + "}";
		cells[2] = document.createElement("TD");
		cells[2].innerHTML = me.sW.tcs.toString();
		return cells;
	}
	
	me.cells_rW = function()
	{
		var cells = [];
		cells[0] = document.createElement("TD");
		cells[0].innerHTML = me.stateOfChangeDesc();
		cells[1] = document.createElement("TD");
		cells[2] = document.createElement("TD");
		if(me.new_world)
		{
			cells[1].innerHTML = "<b>" + me.rW.uwp.toString()  + " {" + me.rW.iX + "}" + "</b>";
			cells[2].innerHTML = "<b>" + me.rW.tcs.toString() + "</b>";
		}
		else
		{
			cells[1].innerHTML = me.rW.uwp.toString() + " {" + me.rW.iX + "}";
			cells[2].innerHTML = me.rW.tcs.toString();
		}
		return cells;
	}
	
	if(auto_generate)
		me.reduceWorld();

}

var LTC_A_TBL = { dice: function(){ return flux(); }, min:-6, max:6, mods:[], "-6":-4, "-5":-3, "-4":-2, "-3":-1, "-2":0, "-1":0, 0:0, 1:0, 2:0, 3:1, 4:1, 5:1, 6:1};
var LTC_B_TBL = { dice: function(){ return flux(); }, min:-6, max:6, mods:[], "-6":{sl:-2,tl:-1,nmw:false}, "-5":{sl:-2,tl:-1,nmw:false}, "-4":{sl:-2,tl:0,nmw:true}, "-3":{sl:-1,tl:0,nmw:false}, "-2":{sl:-1,tl:0,nmw:false}, "-1":{sl:0,tl:0,nmw:false}, 0:{sl:0,tl:0,nmw:false}, 1:{sl:0,tl:0,nmw:false}, 2:{sl:1,tl:0,nmw:false}, 3:{sl:1,tl:0,nmw:false}, 4:{sl:2,tl:0,nmw:false}, 5:{sl:2,tl:0,nmw:false}, 6:{sl:2,tl:0,nmw:false}};
var LTC_C_TBL = { dice: function(){ return flux(); }, min:-6, max:6, mods:[], "-6":"Catastrophic", "-5":"-2", "-4":"-1", "-3":"-1", "-2":0, "-1":0, 0:0, 1:0, 2:0, 3:1, 4:1, 5:2, 6:"Dramatic"};
var LTC_D_TBL = { dice: function(){ return flux(); }, min:-6, max:6, mods:[], "-6":-2, "-5":-1, "-4":0, "-3":0, "-2":0, "-1":0, 0:0, 1:0, 2:0, 3:0, 4:0, 5:1, 6:2};
var LTC_E_TBL = { dice: function(){ return flux(); }, min:-6, max:6, mods:[], "-6":-3, "-5":-2, "-4":-1, "-3":0, "-2":0, "-1":0, 0:0, 1:0, 2:0, 3:0, 4:1, 5:2, 6:3};

var SPECIAL_POP_SITUATIONS = {
"Catastrophic":{Ba:"NE",Lo:"Di",Ni:"Di",S8:"Di",Hi:"R7",nmw:true},
"-2":{Ba:"NE",Lo:"Di",Ni:"Di",S8:"Di",Hi:"-2",nmw:false},
"-1":{Ba:"NE",Lo:"Di",Ni:"Di",S8:"1D",Hi:"-1",nmw:false},
0:{Ba:"NE",Lo:"1D",Ni:"1D",S8:"NE",Hi:"NE",nmw:false},
1:{Ba:"NE",Lo:"1D",Ni:"1D",S8:"1",Hi:"1",nmw:false},
2:{Ba:"NE",Lo:"1D",Ni:"1D",S8:"2",Hi:"2",nmw:false},
"Dramatic":{Ba:"2D",Lo:"2D",Ni:"2D",S8:"3",Hi:"3",nmw:true}
};

var STATE_OF_CHANGE_DESCRIPTIONS = {"-6":"Disruption", "-5":"Metaphysical disorder", "-4":"Upheaval", "-3":"Disruptive Chaos", "-2":"Pervasive Chaos", "-1":"Typical Conflict Chaos", 0:"Typical Peacetime Chaos", 1:"Prosperity", 2:"Dramatic Prosperity", 3:"Positive Social Progress", 4:"Social Transformation", 5:"True Peace and Harmony", 6:"Advancement"};

function reduce_selected_sector()
{
	var reducDiv = document.getElementById("ReducDiv");
	if(reducDiv !== null)
		document.body.removeChild(reducDiv);
	reducDiv = document.createElement("DIV");
	reducDiv.style.clear = "both";
	reducDiv.id = "ReducDiv";
	document.body.appendChild(reducDiv);
	var reducOpt = parseInt(document.getElementById("waveOnly").value);
	var popCapOpt = document.getElementById("popCap").checked;
	
	var reducTbl = document.createElement("TABLE");
	reducDiv.appendChild(reducTbl);
	var reducTblHdr = document.createElement("TR");
	var tblHdrCell = [];
	for(var i=0;i<7;i++)
	{
		tblHdrCell[i] = document.createElement("TH");
		reducTblHdr.appendChild(tblHdrCell[i]);
	}
	reducTbl.appendChild(reducTblHdr);
	tblHdrCell[0].innerHTML = "World Name";
	tblHdrCell[1].innerHTML = "Original UWP";
	tblHdrCell[2].innerHTML = "Original TCs";
	tblHdrCell[3].innerHTML = "UWP after Collapse";
	tblHdrCell[4].innerHTML = "TCs after Collapse";
	tblHdrCell[5].innerHTML = "UWP after Wave";
	tblHdrCell[6].innerHTML = "TCs after Wave";
	worldArray.map(function(world)
						{
							var reduc_obj = new reduceWorld(world, reducOpt, popCapOpt);
							reducTbl.appendChild(reduc_obj.tableRow());
						});
	
}

function loadSectorsRW(sectorListText)
{
	var sectorSelect = document.getElementById("SectorSelect");	
	sectors = JSON.parse(sectorListText);
	var sectorList = [];
	for(var i=0;i<sectors.Sectors.length;i++)
	{
		var myOption = new Object();
		myOption.text = sectors.Sectors[i].Names[0].Text.trim();
		myOption.value = encodeURIComponent(sectors.Sectors[i].Names[0].Text.trim());
		if(sectorList.find(function(v) {return v.text == myOption.text}) === undefined)
			sectorList.push(myOption); 
	}
	sectorList.sort(function(a, b) {return a.text.localeCompare(b.text);});
	for(i=0;i<sectorList.length;i++)
	{
		myOption = document.createElement("option");
		myOption.text = sectorList[i].text;
		myOption.value = sectorList[i].value;
		sectorSelect.add(myOption);
	}
	if(DEFAULT_SECTOR)
		sectorSelect.value = DEFAULT_SECTOR;
	else
		sectorSelect.value = encodeURIComponent("Spinward Marches");
	loadWorldsRW(sectorSelect)
}

var worldArray;
function loadWorldsRW(selectObject)
{
	var urlString = "https://travellermap.com/data/" + selectObject.value + "/tab";
	loadDoc(urlString, worldLoadParseRW, selectObject);

	var new_fav_sector = selectObject.value;
	var objStore = user_pref_db.transaction(["userPreferences"],"readwrite").objectStore("userPreferences");
	var request = objStore.get("Default");
	request.onsuccess = function(event)
	{
		var data = event.target.result;
		data.fav_sector = new_fav_sector;		
		var requestUpdate = objStore.put(data);
	}
}

function worldLoadParseRW(worldListDoc, selectObject)
{
	var worldList = parseSector(worldListDoc).worlds;
	worldArray = [];
	for(worldEntry in worldList)
	{
		aWorld = new mainWorld();
		aWorld.readDataObj(worldList[worldEntry]);
		aWorld.sector = selectObject.options[selectObject.selectedIndex].text.replace(/\s+\(.+\)/g,"");
		aWorld.standardSeed = aWorld.hex + aWorld.hex;
		aWorld.fullName = aWorld.subSector + " - " + aWorld.name + " (" + aWorld.hex + " " + aWorld.sector + ")";
		worldArray.push(aWorld);
	}
	worldArray.sort(function(a, b) { return a.hex.localeCompare(b.hex); });
	worldArray.sort(function(a, b) { return a.subSector.localeCompare(b.subSector); });
}

var user_pref_db;
var DEFAULT_SECTOR;
function initLoad_reduce_sector()
{
	init_rng(Date.now());
	
	if(!window.indexedDB)
		window.alert("Your browser does not support a stable version of IndexedDB.  Saving of your preferences may not be available.");
	var r = window.indexedDB.open("t5_sector_reducer_prefs",1);
	
	r.onerror = function(event) 
	{
		// no error handling yet
	};
	
	r.onsuccess = function(event) 
	{
		user_pref_db = event.target.result;
		user_pref_db.transaction("userPreferences").objectStore("userPreferences").get("Default").onsuccess = function(event) {
		DEFAULT_SECTOR = event.target.result.fav_sector;
		loadDoc("https://travellermap.com/api/universe", loadSectorsRW);
		};
	};
	
	r.onupgradeneeded = function(event) 
	{ 
		user_pref_db = event.target.result;
		var objectStore = user_pref_db.createObjectStore("userPreferences", { keyPath: "profile_name" });
		objectStore.createIndex("profile_name","profile_name",{unique:true});
		objectStore.transaction.oncomplete = function(event)
		{
			var profileObjectStore = user_pref_db.transaction("userPreferences","readwrite").objectStore("userPreferences");
			var default_fav_sector = encodeURIComponent("Spinward Marches");
			profileObjectStore.add({profile_name:"Default", fav_sector:default_fav_sector, b_and_w:false, capital_avoid_half_tri:true});
		};		
	};	
	var givenWorld = readURL();
	if(givenWorld)
		loadWorld(givenWorld);
}

function reduceWorld(world, reducOpt, popCapOpt, generate_now)
{
	var me = this;
	me.world = world;
	me.collapseWorld = new mainWorld();
	me.waveWorld = new mainWorld();
	me.reducOpt = reducOpt;
	me.popCapOpt = popCapOpt;
	me.eventType = COLLAPSE;
	
	if(arguments.length < 4)
		generate_now = true;
	
	var COLLAPSE_MOD;
	me.setCollapseMod = function(modVal)
	{
		COLLAPSE_MOD = modVal;
	}
	
	me.getCollapseMod = function()
	{
		if(COLLAPSE_MOD)
			return COLLAPSE_MOD;
		me.setCollapseMod(HEAVY_FIGHTING)
			return COLLAPSE_MOD;
	}
	
	var WAVE_MOD;
	me.setWaveMod = function(modVal)
	{
		WAVE_MOD = modVal;
		if(me.world.atmos == 2 || me.world.atmos == 4 || me.world.atmos == 7 || me.world.atmos == 9)
			WAVE_MOD += TAINTED_ATMOS;
	}
	
	me.getWaveMod = function()
	{
		if(WAVE_MOD)
			return WAVE_MOD;
		me.setWaveMod(THE_WAVE);
			return WAVE_MOD;
	}
	
	var WORLD_MOD;
	me.getWorldMod = function()
	{
		if(WORLD_MOD)
			return WORLD_MOD;
		WORLD_MOD = 0;
		ALL_TC.map(function(v)
						{
							if(me.world.tcs.has(v.code))
								WORLD_MOD += v.mod;
						});
		if(me.world.uwp.atmos == 1 || me.world.uwp.atmos > 9)
			WORLD_MOD += -2;
/*		if(me.world.nativeIntLife.type.natives)
			WORLD_MOD += 2; */
		return WORLD_MOD;
	}
	
	me.getTotalMods = function()
	{
		return me.getWorldMod() + (me.eventType == WAVE ? me.getWaveMod() : me.getCollapseMod());
	}
	
	var REDUCTION_RESULT;
	me.getReductionResult = function()
	{
		if(REDUCTION_RESULT)
			return REDUCTION_RESULT;
		REDUCTION_RESULT = flux() + me.getTotalMods();
		return REDUCTION_RESULT;
	}
	
	me.reduceUWP = function()
	{
		var rW = me.eventType == COLLAPSE ? me.collapseWorld : me.waveWorld;
		var sW = me.eventType == COLLAPSE ? me.world : me.collapseWorld;
		rW.uwp.size = sW.uwp.size;
		rW.uwp.atmos = sW.uwp.atmos;
		rW.uwp.hydro = sW.uwp.hydro;
		var rr = me.getReductionResult();
		if(rr < -8)
		{
			rW.uwp.port = "X";
			rW.uwp.popul = 0;
			rW.uwp.gov = 0;
			rW.uwp.law = 0;
			rW.popMulti = 0;
			rW.uwp.TL = sW.uwp.TL + (flux() - 5) - 4;
		}
		if(rr >= -8 && rr <= -5)
		{
			if(sW.uwp.popul == 0)
				rW.uwp.port = "X";
			else
				rW.uwp.port = me.reducePort(sW.uwp.port,3);
			rW.uwp.popul = Math.max(0,Math.min(sW.uwp.popul, sW.uwp.popul+me.getTotalMods()));
			if(rW.uwp.popul < 3)
			{
				rW.uwp.popul = 0;
				rW.uwp.gov = 0;
				rW.uwp.law = 0;
				rW.popMulti = 0;
				rW.uwp.TL = sW.uwp.TL + (flux() - 5) + me.portMod(rW.uwp.port);
			}
			else
			{
				rW.uwp.popul--;
				rW.uwp.gov = rW.uwp.popul + flux();
				rW.uwp.law = rW.uwp.gov + flux();
				rW.popMulti = rng(9);
				rW.uwp.TL = Math.min(sW.uwp.TL, dice(1) + rW.uwp.totalTechDM() - 2);
			}
		}
		if(rr >=-4 && rr <= -2)
		{
			if(sW.uwp.popul == 0)
				rW.uwp.port = me.reducePort(sW.uwp.port,3);
			else
				rW.uwp.port = me.reducePort(sW.uwp.port,2);
			rW.uwp.popul = Math.max(0,Math.min(sW.uwp.popul, sW.uwp.popul+me.getTotalMods()));
			if(rW.uwp.popul < 2)
			{
				rW.uwp.popul = 0;
				rW.uwp.gov = 0;
				rW.uwp.law = 0;
				rW.popMulti = 0;				
				rW.uwp.TL = sW.uwp.TL + (flux() - 5) + me.portMod(rW.uwp.port);
			}
			else
			{
				rW.uwp.popul--;
				rW.uwp.gov = rW.uwp.popul + flux();
				rW.uwp.law = rW.uwp.gov + flux();
				rW.popMulti = rng(9);
				rW.uwp.TL = Math.min(sW.uwp.TL, dice(1) + rW.uwp.totalTechDM() - 1);
			}			
		}
		if(rr >=-1 && rr <= 1)
		{
			if(sW.uwp.popul == 0)
				rW.uwp.port = me.reducePort(sW.uwp.port,2);
			else
				rW.uwp.port = me.reducePort(sW.uwp.port,1);
			rW.uwp.popul = Math.max(0,Math.ceil(Math.min(sW.uwp.popul, sW.uwp.popul+me.getTotalMods()/2)));
			if(rW.uwp.popul < 1)
			{
				rW.uwp.popul = 0;
				rW.uwp.gov = 0;
				rW.uwp.law = 0;
				rW.popMulti = 0;				
				rW.uwp.TL = sW.uwp.TL + (flux() - 5) + me.portMod(rW.uwp.port);
			}
			else
			{
				rW.uwp.gov = rW.uwp.popul + flux();
				rW.uwp.law = rW.uwp.gov + flux();
				rW.popMulti = rng(9);
				rW.uwp.TL = Math.min(sW.uwp.TL+1, dice(1) + rW.uwp.totalTechDM());
			}			
		}
		if(rr >=2 && rr <= 4)
		{
			if(sW.uwp.popul == 0)
				rW.uwp.port = me.reducePort(sW.uwp.port,1);
			else
				rW.uwp.port = sW.uwp.port;
			rW.uwp.popul = Math.max(0,Math.ceil(Math.min(sW.uwp.popul+1, sW.uwp.popul+me.getTotalMods()/2)));
			if(rW.uwp.popul < 1)
			{
				rW.uwp.popul = 0;
				rW.uwp.gov = 0;
				rW.uwp.law = 0;
				rW.popMulti = 0;				
				rW.uwp.TL = sW.uwp.TL + (flux() - 5) + me.portMod(rW.uwp.port);
			}
			else
			{
				rW.uwp.gov = rW.uwp.popul + flux();
				rW.uwp.law = rW.uwp.gov + flux();
				rW.popMulti = rng(9);
				rW.uwp.TL = Math.min(sW.uwp.TL+2, dice(1) + rW.uwp.totalTechDM());
			}			
		}
		if(rr > 4)
		{
			if(sW.uwp.popul == 0)
				rW.uwp.port = me.reducePort(sW.uwp.port,1);
			else
				rW.uwp.port = me.increasePort(sW.uwp.port,1);
			rW.uwp.popul = Math.max(0,Math.ceil(Math.min(sW.uwp.popul+2, sW.uwp.popul+me.getTotalMods()/2)));
			if(rW.uwp.popul < 1)
			{
				rW.uwp.popul = 0;
				rW.uwp.gov = 0;
				rW.uwp.law = 0;
				rW.popMulti = 0;				
				rW.uwp.TL = sW.uwp.TL + (flux() - 5) + me.portMod(rW.uwp.port);
			}
			else
			{
				rW.uwp.gov = rW.uwp.popul + flux();
				rW.uwp.law = rW.uwp.gov + flux();
				rW.popMulti = rng(9);
				rW.uwp.TL = dice(1) + rW.uwp.totalTechDM();
			}						
		}
		if(sW.tcs.has("Di"))
		{
			rW.uwp.TL -= dice(1)-1;
			rW.uwp.TL = Math.max(1, rW.uwp.TL);
		}
		if(me.popCapOpt)
			rW.uwp.popul = Math.min(10,Math.max(0,rW.uwp.popul));
		else
			rW.uwp.popul = Math.max(0,rW.uwp.popul);
		rW.uwp.gov = Math.max(0,rW.uwp.gov);
		rW.uwp.law = Math.max(0,rW.uwp.law);
		rW.uwp.TL = Math.max(0,rW.uwp.TL);
		rW.tcs.generate();
		me.copyPhysicalTCs(sW,rW);
		if(sW.tcs.has("Rw") || (sW.tcs.has("Hi") || sW.tcs.has("Ph")) && !(rW.tcs.has("Hi") || rW.tcs.has("Ph")) && !(rW.tcs.has("Di") || rW.tcs.has("Ba")))
		{
			rW.tcs.add("Rw");
		}
	}
		
	me.generate = function()
	{
		if(me.reducOpt == 1)
		{
			me.eventType = COLLAPSE;
			me.reduceUWP();
			me.eventType = WAVE;
			me.reduceUWP();
		}
		else
		{
			me.collapseWorld = me.world;
			me.eventType = WAVE;
			me.reduceUWP();
		}
	}
	
	me.tableRow = function()
	{
		var tr = document.createElement("TR");
		var td = [];
		for(var i=0;i<7;i++)
		{
			td[i] = document.createElement("TD");
			tr.appendChild(td[i]);
		}
		td[0].innerHTML = me.world.fullName;
		td[1].innerHTML = me.world.uwp.toString();
		td[2].innerHTML = me.world.tcs.toString();
		td[3].innerHTML = me.collapseWorld.uwp.toString();
		td[4].innerHTML = me.collapseWorld.tcs.toString();
		td[5].innerHTML = me.waveWorld.uwp.toString();
		td[6].innerHTML = me.waveWorld.tcs.toString();
		return tr;
	}
	
	me.reducePort = function(originalPort, steps)
	{
		var ports = "ABCDEX";
		return ports.substr(Math.min(ports.length-1, ports.search(originalPort)+steps),1);
	}
	
	me.increasePort = function(originalPort, steps)
	{
		var ports = "ABCDEX";
		return ports.substr(Math.max(0, ports.search(originalPort)-steps),1);	
	}
	
	me.portMod = function(port)
	{
		return [6,4,2,0,0,-4]["ABCDEX".search(port)];
	}
	
	me.copyPhysicalTCs = function(sW, rW)
	{
		var physicalTCs = ["Ho","Co","Tz","Sa","Lk","Fr","Tr","Tu"];
		physicalTCs.map(function(tcCode)
								{
									if(sW.tcs.has(tcCode))
										rW.tcs.add(tcCode);
								});
	}
	
	if(generate_now)
		me.generate();
}