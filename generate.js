var worldMapCounter = 0;

function generate_map()
{	
	var myWorld = readUserInput();
	
	if(!myWorld)
		return;
	window.open("t5_map.html" + myWorld.buildGet() + mapFlags());
}

function generate_system()
{	
	var myWorld = readUserInput();
	if(!myWorld)
		return;
	window.open("t5_system.html" + myWorld.buildGet() + systemFlags());
}

function readUserInput()
{
	var worldHex = document.getElementById("element_7").value.substr(0,4);
	var sectorName = document.getElementById("element_7").value.substr(5).trim();
	var worldName = document.getElementById("element_1").value;
	var uwpString = document.getElementById("element_2").value;
	var additionalTradeCodes = checkboxSelect(document.getElementsByName("TradeCode"));
	var iX = parseInt(document.getElementById("iX").value);
	var eX = "(" + document.getElementById("eX").value + ")";
	var cX = "[" + document.getElementById("cX").value + "]";
	var nobz = document.getElementById("Nobz").value;
	var basesString = document.getElementById("Bases").value;
	var zone = document.getElementById("Zone").value;
	var popMulti = parseInt(document.getElementById("Pop_Multi").value);
	var belts = parseInt(document.getElementById("Planetoid").value);
	var gas_giants = parseInt(document.getElementById("Gas_Giants").value);
	var worlds = parseInt(document.getElementById("Worlds").value);
	var allegiance = document.getElementById("allegiance").value;
	var stellar_data = document.getElementById("Stellar_Data").value;
	var userSeed = document.getElementById("seed").value;
	if(userSeed)
	{
		init_rng(userSeed);
		seedUsed = userSeed;
	}
	else
	{
		seedUsed = Date.now() >>> 0;
		init_rng(seedUsed);
		document.getElementById("seed").value = seedUsed;
	}	
	
	var myWorld = new mainWorld();
	var thereIsAnError = false;
	myWorld.standardSeed = seedUsed;
	myWorld.hex = worldHex;
	myWorld.sector = sectorName;
	myWorld.name = worldName;
	try
	{
		myWorld.uwp.readUWP(uwpString);
	}
	catch(errorE)
	{
		document.getElementById("guide_2").style.color = "red";
		document.getElementById("element_2").style.color = "red";
		thereIsAnError = true;
	}
	myWorld.tcs.generate();
	for(var i=0;i<additionalTradeCodes.length;i++)
		myWorld.tcs.add(additionalTradeCodes[i]);
	myWorld.iX = iX;
	try
	{
		myWorld.economicExt.readString(eX);
	}
	catch(errorE)
	{
		document.getElementById("eX").style.color = "red";
		document.getElementById("guide_3").style.color = "red";
		thereIsAnError = true;
	}
	try
	{
		myWorld.culturalExt.readString(cX);
	}
	catch(errorE)
	{
		document.getElementById("cX").style.color = "red";
		document.getElementById("guide_5").style.color = "red";
		thereIsAnError = true;
	}
	myWorld.bases.readString(basesString);
	myWorld.travelZone = zone;
	myWorld.popMulti = popMulti;
	myWorld.belts = belts;
	myWorld.gas_giants = gas_giants;
	myWorld.worlds = worlds;
	myWorld.noblesExt.readString(nobz);
	myWorld.allegiance = allegiance;
	try
	{
		myWorld.stars.readString(stellar_data);
	}
	catch(errorE)
	{
		document.getElementById("Stellar_Data").style.color = "red";
		document.getElementById("guide_16").style.color = "red";
		thereIsAnError = true;
	}
	if(thereIsAnError)
		return false;
	BLACK_AND_WHITE = document.getElementById("black_white_map").checked;
	MAIN_WORLD_HZ_ONLY = document.getElementById("mw_in_hz").checked;
	MAIN_WORLD_IS_SAT = document.getElementById("mw_is_sat").checked;
	MAIN_WORLD_NOT_SAT = document.getElementById("mw_is_not_sat").checked;
	TZ_NO_SAT = document.getElementById("tz_no_sat").checked;
	BARREN_SYS = document.getElementById("barren_sys").checked;
	MAP_OPT_PLACE_NOBLE_ESTATE = document.getElementById("place_nobz").checked;
	MAP_OPT_SEVERAL_NOBLE_ESTATES = document.getElementById("place_several_nobz").checked;
	ALLOW_OCEAN_NOBZ = document.getElementById("allow_ocean_nobz").checked;
	NUM_WORLD_MAPS = document.getElementById("num_world_maps").value;
	return myWorld;
}

function downloadMap(saveAreaName, fileName)
{
	var mapXML = document.getElementById(saveAreaName);
	var saveText = mapXML.innerHTML
	var blob = new Blob([saveText], {type: "text/plain;charset=utf-8"});
	saveAs(blob, fileName);
}

function downloadSystem()
{
	DOWNLOAD_WORLD_DETAIL = document.getElementById("downloadWorldDetails").checked;
	var styleText = "";
	loadDoc("traveller.css", finaliseDownloadSystem);
}

function finaliseDownloadSystem(styleText)
{
	var fileName = mySystem.mainWorld.name.replace(/'/g,"") + " UWP " + mySystem.mainWorld.uwp + " generated system.html";
	var blob = new Blob(["<html><head><style>", styleText ,"</style></head>",mySystem.toPlainHTML(),"</html>"], {type: "text/plain;charset=utf-8"});
	saveAs(blob, fileName);	
}

function downloadSystemText()
{
	DOWNLOAD_WORLD_DETAIL = document.getElementById("downloadWorldDetails").checked;
	var blob = new Blob([mySystem.tofixedWidthText()], {type: "text/plain;charset=utf-8"});
	saveAs(blob, "The " + mySystem.mainWorld.name + " System.txt");
}

function downloadSystemCSV()
{
	DOWNLOAD_WORLD_DETAIL = document.getElementById("downloadWorldDetails").checked;
	var blob = new Blob([mySystem.toCSV()], {type: "text/plain;charset=utf-8"});
	saveAs(blob, "The " + mySystem.mainWorld.name + " System.csv");
}

var user_pref_db;
var DEFAULT_SECTOR;
function initLoad()
{
	init_rng(Date.now());
	
	if(!window.indexedDB)
		window.alert("Your browser does not support a stable version of IndexedDB.  Saving of your preferences may not be available.");
	var r = window.indexedDB.open("t5_world_builder_prefs",1);
	
	r.onerror = function(event) 
	{
		// no error handling yet
	};
	
	r.onsuccess = function(event) 
	{
		user_pref_db = event.target.result;
		user_pref_db.transaction("userPreferences").objectStore("userPreferences").get("Default").onsuccess = function(event) {
		DEFAULT_SECTOR = event.target.result.fav_sector;
		loadDoc("https://travellermap.com/api/universe", loadSectors);
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

var mySystem;
var SAVED_SYSTEMS = [];
var request;
var sys_db;
function initLoad_system()
{
	init_rng(Date.now());
	var givenWorld = readURL(readSystemFlags);
	var downloadBtn = document.getElementById("downloadSystem");
	var downloadBtn2 = document.getElementById("downloadSystemAsText");
	var downloadBtn3 = document.getElementById("downloadSystemAsCSV");
	var systemMapBtn = document.getElementById("system_map");
	var sysDiv = document.getElementById("sys_table");
	var symbolDiv = document.getElementById("symbol_map");
	var sysTitle = document.getElementById("systemTitle");
	if(givenWorld)
	{
		init_rng(givenWorld.standardSeed);
		mySystem = new fullSystem(givenWorld, true);
		var sTables = mySystem.toTable();
		for(var i=0;i<sTables.length;i++)
			sysDiv.appendChild(sTables[i]);
		mySystem.toSymbolMap();
		sysTitle.innerHTML = "The " + mySystem.name;
	}
	else
	{
		document.body.removeChild(downloadBtn);
		document.body.removeChild(downloadBtn2);
		document.body.removeChild(downloadBtn3);
		document.body.removeChild(systemMapBtn);
		sysDiv.innerHTML = "This web page functions by using GET data.  Click <a href='t5_world_builder.html'>here</a> to generate a system.  Or choose a pre-saved system from the drop-down menu.";
	}
	var request = window.indexedDB.open("saved_systems_db",1);
	request.onerror = function(event) 
	{
		// no error handling yet
	};
			
	request.onsuccess = function(event) 
	{
		sys_db = event.target.result;
		var objS = sys_db.transaction("savedSystems").objectStore("savedSystems");
		objS.openCursor().onsuccess = function(event) {
			var cursor = event.target.result;
			if(cursor) {
				SAVED_SYSTEMS[cursor.key] = (cursor.value);
				cursor.continue();
			}
			else {
				load_saved_systems();
			}
		};
	};
	
	request.onupgradeneeded = function(event) 
	{ 
		sys_db = event.target.result;
		var objectStore = sys_db.createObjectStore("savedSystems", { autoIncrement: true });
	};
}

function load_saved_systems()
{
	var s = document.getElementById("saved_systems");
	while(s.length > 0)
		s.remove(0);
	SAVED_SYSTEMS.forEach(function(v, k)	{
												var o = document.createElement("OPTION");
												o.text = v.name;
												o.value = k;
												s.add(o);
											});

}

function save_sys()
{
	if(!mySystem)
		return;
	var sysObjStore = sys_db.transaction("savedSystems","readwrite").objectStore("savedSystems");
	var sys_obj = mySystem.dbObj();
	var d = 0;
	var r = sysObjStore.add(sys_obj);
	r.onsuccess = function(event)
	{
		SAVED_SYSTEMS[event.target.result] = sys_obj;
		load_saved_systems();
	}
}

function update_sys()
{
	if(!mySystem)
		return;
	console.log("mySystem.loadKey = " + mySystem.loadKey);
	if(mySystem.loadKey)
	{
		var objStore = sys_db.transaction("savedSystems","readwrite").objectStore("savedSystems");
		objStore.get(mySystem.loadKey).onsuccess = function(event)
		{
			objStore.put(mySystem.dbObj(), mySystem.loadKey);
		}
	}
	else
		save_sys();
}

function load_sys()
{
	var s = document.getElementById("saved_systems");
	var downloadBtn = document.getElementById("downloadSystem");
	var k = parseInt(s.options[s.selectedIndex].value);
	var sys_obj;
	sys_db.transaction("savedSystems").objectStore("savedSystems").get(k).onsuccess = function(event)
	{
		sys_obj = event.target.result;
		var temp_mainWorld = new mainWorld();
		temp_mainWorld.read_dbObj(sys_obj.mainWorld);
		mySystem = new fullSystem(temp_mainWorld, false);
		mySystem.read_dbObj(sys_obj);
		mySystem.loadKey = k;
		var sysDiv = document.getElementById("sys_table");
		init_rng(mySystem.mainWorld.standardSeed);
		var sTables = mySystem.toTable();
		while(sysDiv.hasChildNodes())
			sysDiv.removeChild(sysDiv.childNodes[0]);
		for(var i=0;i<sTables.length;i++)
			sysDiv.appendChild(sTables[i]);
		mySystem.toSymbolMap();
	};	
}

function del_sys()
{
	if(!confirm("This action cannot be undone.  Press OK to delete system shown in the Saved Systems box, or Cancel to abort."))
		return;
	var s = document.getElementById("saved_systems");
	var k = parseInt(s.options[s.selectedIndex].value);
	sys_db.transaction("savedSystems","readwrite").objectStore("savedSystems").delete(k).onsuccess = function(event)
	{
		SAVED_SYSTEMS.splice(k,1);
		load_saved_systems();
	}
}

function export_sys()
{
	var saveText = JSON.stringify(mySystem.dbObj());
	var blob = new Blob([saveText], {type: "text/plain;charset=utf-8"});
	saveAs(blob, mySystem.name + ".json");
}

function import_sys(input_file_obj)
{
	var selFile = input_file_obj.files[0];
	var reader = new FileReader();	
	reader.addEventListener("loadend", function() 
	{
		var sys_obj = JSON.parse(reader.result);
		var temp_mainWorld = new mainWorld();
		temp_mainWorld.read_dbObj(sys_obj.mainWorld);
		mySystem = new fullSystem(temp_mainWorld, false);
		mySystem.read_dbObj(sys_obj);
		var sysDiv = document.getElementById("sys_table");
		init_rng(mySystem.mainWorld.standardSeed);
		var sTables = mySystem.toTable();
		while(sysDiv.hasChildNodes())
			sysDiv.removeChild(sysDiv.childNodes[0]);
		for(var i=0;i<sTables.length;i++)
			sysDiv.appendChild(sTables[i]);			
	},false);
	reader.readAsText(selFile);

}

var myMap;
function initLoad_map()
{
	init_rng(Date.now());
	var myWorld = readURL(readMapFlags);
	if(myWorld)
	{
		for(var i=0;i<NUM_WORLD_MAPS;i++)
		{
			var saveAreaName = "saveArea";
			var worldMapSVGID = "worldMapSVG";
			if(i==0)
				init_rng(myWorld.standardSeed);
			else
			{
				init_rng(Date.now());
				myWorld.standardSeed = rng(4294967295);
				init_rng(myWorld.standardSeed);
			}
			var worldMapContainerDiv = document.createElement("DIV");
			worldMapContainerDiv.setAttribute("id","worldMapContainer" + worldMapCounter++);
			worldMapContainerDiv.setAttribute("class","container");
			var downloadMapButton = document.createElement("INPUT");
			downloadMapButton.setAttribute("name","downloadMap");
			var fileName = myWorld.name.replace(/'/g,"") + " UWP " + myWorld.uwp + " world map.svg";
			var clickScript = "downloadMap('" + saveAreaName + "','" + fileName +"');";
			downloadMapButton.setAttribute("onclick",clickScript);
			downloadMapButton.setAttribute("value","Download Map as SVG");
			downloadMapButton.setAttribute("type","button");
			downloadMapButton.setAttribute("class","btn1");
			downloadMapButton.setAttribute("style","margin:8px;");
			worldMapContainerDiv.appendChild(downloadMapButton);
			var downloadAsPNGButton = document.createElement("INPUT");
			downloadAsPNGButton.setAttribute("name","downloadMap");
			fileName = myWorld.name.replace(/'/g,"") + " UWP " + myWorld.uwp + " world map.png";
			clickScript = "svgToPng('" + worldMapSVGID + "','" + fileName + "');";
			downloadAsPNGButton.setAttribute("onclick",clickScript);
			downloadAsPNGButton.setAttribute("value","Download Map as PNG");
			downloadAsPNGButton.setAttribute("type","button");
			downloadAsPNGButton.setAttribute("class","btn1");
			downloadAsPNGButton.setAttribute("style","margin:8px;");
			worldMapContainerDiv.appendChild(downloadAsPNGButton);
			var slideLeftButton = document.createElement("INPUT");
			slideLeftButton.setAttribute("name","slideLeft");
			slideLeftButton.setAttribute("onclick","myMap.slideTerrain(false);");
			slideLeftButton.setAttribute("value", "<");
			slideLeftButton.setAttribute("type","button");
			slideLeftButton.setAttribute("class","btn1");
			slideLeftButton.setAttribute("style","margin:8px;");
			worldMapContainerDiv.appendChild(slideLeftButton);
			var slideRightButton = document.createElement("INPUT");
			slideRightButton.setAttribute("name","slideRight");
			slideRightButton.setAttribute("onclick","myMap.slideTerrain(true);");
			slideRightButton.setAttribute("value", ">");
			slideRightButton.setAttribute("type","button");
			slideRightButton.setAttribute("class","btn1");
			slideRightButton.setAttribute("style","margin:8px;");
			worldMapContainerDiv.appendChild(slideRightButton);
			var urlTitle = document.createElement("P");
			urlTitle.style.color="white";
			urlTitle.innerHTML = "URL for this map:";
			var urlBox = document.createElement("INPUT");
			urlBox.setAttribute("type","text");
			urlBox.style.width="100%";
			urlBox.style.marginBottom="0.5em";
			urlBox.value=myWorld.buildQuery()+mapFlags(1);
			worldMapContainerDiv.appendChild(urlTitle);
			worldMapContainerDiv.appendChild(urlBox);
			var worldMapDiv = document.createElement("DIV");
			worldMapDiv.setAttribute("id", saveAreaName);
			worldMapDiv.setAttribute("class", "container");
			worldMapDiv.style.backgroundColor = "white";
			worldMapDiv.style.marginLeft = "1.5em";
			var worldMapSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			worldMapSVG.setAttribute("xmlns","http://www.w3.org/2000/svg");
			worldMapSVG.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			worldMapSVG.setAttribute("xml:space","preserve");
			worldMapSVG.setAttribute("id", worldMapSVGID);	
			worldMapDiv.appendChild(worldMapSVG);
			worldMapContainerDiv.appendChild(worldMapDiv);
			document.body.appendChild(worldMapContainerDiv);
			myMap = new worldMap(myWorld, worldMapSVG, worldMapDiv);
			myMap.generate();
			myMap.render(); 
			myMap.outline();
		}		
	}
	else
	{
		var msgDiv = document.createElement("DIV");
		msgDiv.innerHTML = "This web page functions by using GET data.  Click <a href='t5_world_builder.html'>here</a> to generate a map.";
		document.body.appendChild(msgDiv);
	}	
}

function loadSectors(sectorListText)
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
	loadWorlds(sectorSelect);

}

function giveRandomSeed()
{
	var newSeed = rng(4294967295);
	document.getElementById('seed').value = newSeed;
}

var worldArray;
function loadWorlds(selectObject, save_fav_sector)
{
	if(arguments.length < 2)
		save_fav_sector = true;
	var urlString = "https://travellermap.com/data/" + selectObject.value + "/tab";
	loadDoc(urlString, worldLoadParse, selectObject);
	if(save_fav_sector)
	{
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
}

function worldLoadParse(worldListDoc, selectObject)
{
	var worldSelector = document.getElementById("WorldSelect");
	while(worldSelector.options.length > 0)
		worldSelector.remove(0);
	var worldList = parseSector(worldListDoc).worlds;
	worldArray = [];
	for(worldEntry in worldList)
	{
		aWorld = new mainWorld();
		aWorld.readDataObj(worldList[worldEntry]);
		aWorld.sector = selectObject.options[selectObject.selectedIndex].text.replace(/\s+\(.+\)/g,"");
		aWorld.standardSeed = aWorld.hex + aWorld.hex;
		worldArray.push(aWorld);
	}
	worldArray.sort( function (a, b)
						{
							if(a.name || b.name)
								return a.name.localeCompare(b.name);
							return a.hex.localeCompare(b.hex);
						}
					);
	
	for(i=0;i<worldArray.length;i++)
	{
		var myOption = document.createElement("option");
		myOption.text = worldArray[i].name ? worldArray[i].name : worldArray[i].hex;
		myOption.value = worldArray[i].hex;
		worldSelector.add(myOption);
	}
	if(worldArray.length == 0)
	{
		var myOption = document.createElement("option");
		myOption.text = "No World Data available";
		myOption.value = "XXXX";
		worldSelector.add(myOption);
	}
}

function parseSector(tabDelimitedData) {
  var sector = {
    worlds: {}
  };
  var lines = tabDelimitedData.split(/\r?\n/);
  var header = lines.shift().toLowerCase().split('\t')
    .map(function(h) { return h.replace(/[^a-z]/g, ''); });
  lines.forEach(function(line) {
    if (!line.length) return;
    var world = {};
    line.split('\t').forEach(function(field, index) {
      world[header[index]] = field;
    });
	if(world.uwp != "???????-?") // clunky way of skipping lines, will do for now to skip over Corridor Sector anomalies
		sector.worlds[world.hex] = world;
  });
  return sector;
}

function loadWorldDetails(selectObject)
{
	if(selectObject.value == "XXXX")
		return;
	var selectedWorld = worldArray.find(function(v) { return v.hex == selectObject.value } );
	loadWorld(selectedWorld);
}

function loadWorld(worldObject)
{
	document.getElementById("element_7").value = worldObject.hex + " " + worldObject.sector;
	document.getElementById("element_1").value = worldObject.name;
	document.getElementById("element_2").value = worldObject.uwp.toString();
	document.getElementById("tcs").innerHTML = worldObject.tcs;
	setAdditionalTCs(worldObject);
	document.getElementById("iX").value = worldObject.iX;
	document.getElementById("eX").value = worldObject.economicExt.toString().substr(1,5);
	document.getElementById("cX").value = worldObject.culturalExt.toString().substr(1,4);
	document.getElementById("Nobz").value = worldObject.noblesExt.toString();
	document.getElementById("Bases").value = worldObject.bases.toString();
	document.getElementById("Zone").value = worldObject.travelZone;
	document.getElementById("Pop_Multi").value = worldObject.popMulti;
	document.getElementById("Planetoid").value = worldObject.belts;
	document.getElementById("Gas_Giants").value = worldObject.gas_giants;
	document.getElementById("Worlds").value = worldObject.worlds;
	document.getElementById("allegiance").value = worldObject.allegiance;
	document.getElementById("Stellar_Data").value = worldObject.stars.toString();
	document.getElementById('seed').value = worldObject.standardSeed;	
}

function setAdditionalTCs(worldObj)
{
	var addTCCheckboxes = document.getElementsByName("TradeCode");
	for(var i=0;i<addTCCheckboxes.length;i++)
		addTCCheckboxes[i].checked = worldObj.tcs.has(addTCCheckboxes[i].value);
}

function svgToPng(worldMapSVGID, fileName)
{
	saveSvgAsPng(document.querySelector("#" + worldMapSVGID), fileName, {scale: 3.0}); //user-defined scale to be added later
}

function generateMissing()
{
	var worldHex = document.getElementById("element_7").value.substr(0,4);
	var sectorName = document.getElementById("element_7").value.substr(4);
	var worldName = document.getElementById("element_1").value;
	var uwpString = document.getElementById("element_2").value;
	var additionalTradeCodes = checkboxSelect(document.getElementsByName("TradeCode"));
	var iX = parseInt(document.getElementById("iX").value);
	var eX = "(" + document.getElementById("eX").value + ")";
	if(eX == "(000+0)")
		eX = 123;
	var cX = "[" + document.getElementById("cX").value + "]";
	if(cX == "[0000]")
		cX = 123;
	var nobz = document.getElementById("Nobz").value;
	var basesString = document.getElementById("Bases").value;
	var zone = document.getElementById("Zone").value;
	var popMulti = parseInt(document.getElementById("Pop_Multi").value);
	var belts = parseInt(document.getElementById("Planetoid").value);
	var gas_giants = parseInt(document.getElementById("Gas_Giants").value);
	var worlds = parseInt(document.getElementById("Worlds").value);
	var allegiance = document.getElementById("allegiance").value;
	var stellar_data = document.getElementById("Stellar_Data").value;
	var myWorld = new mainWorld();
	myWorld.hex = worldHex;
	myWorld.sector = sectorName;
	myWorld.name = worldName;
	try
	{
		myWorld.uwp.readUWP(uwpString);
	}
	catch(errorE)
	{
		myWorld.uwp.createUWP();
		document.getElementById("element_2").value = myWorld.uwp.toString();
	}
	myWorld.tcs.generate();
	for(var i=0;i<additionalTradeCodes.length;i++)
		myWorld.tcs.add(additionalTradeCodes[i]);
	document.getElementById("tcs").innerHTML = myWorld.tcs;
	if(popMulti == 1 && belts == 0 && gas_giants == 0 && worlds == 2)
	{
		myWorld.popMulti = rng(9);
		myWorld.belts = Math.max(0, dice(1)-3);
		myWorld.gas_giants = Math.max(0, Math.floor(dice(2)/2-2));
		myWorld.worlds = dice(2);
		document.getElementById("Pop_Multi").value = myWorld.popMulti;
		document.getElementById("Planetoid").value = myWorld.belts;
		document.getElementById("Gas_Giants").value = myWorld.gas_giants;
		document.getElementById("Worlds").value = myWorld.worlds;
	}
	try
	{
		myWorld.economicExt.readString(eX);
	}
	catch(errorE)
	{
		myWorld.economicExt.generate();
		document.getElementById("eX").value = myWorld.economicExt.toString().substr(1,5);
	}
	try
	{
		myWorld.culturalExt.readString(cX);
	}
	catch(errorE)
	{
		myWorld.culturalExt.generate();
		document.getElementById("cX").value = myWorld.culturalExt.toString().substr(1,4);
	}
	if(basesString == "")
	{
		myWorld.bases.generate();
		document.getElementById("Bases").value = myWorld.bases.toString();
	}
	else
		myWorld.bases.readString(basesString);
	if(nobz=="")
	{
		myWorld.noblesExt.generate();
		document.getElementById("Nobz").value = myWorld.noblesExt.toString();
	}
	else
		myWorld.noblesExt.readString(nobz);
	myWorld.generateIx();
	document.getElementById("iX").value = myWorld.iX;
	myWorld.allegiance = allegiance;
	if(stellar_data == "")
	{
		myWorld.stars.generate();
		document.getElementById("Stellar_Data").value = myWorld.stars.toString();
	}
	else
	{
		myWorld.stars.readString(stellar_data);
	}
}

function clearWorldDetails()
{
	document.getElementById("element_7").value = "";
	document.getElementById("element_7").value = "";
	document.getElementById("element_1").value = "";
	document.getElementById("element_2").value = "";
	document.getElementById("iX").value = "";
	document.getElementById("eX").value = "";
	document.getElementById("cX").value = "";
	document.getElementById("Nobz").value = "";
	document.getElementById("Bases").value = "";
	document.getElementById("Zone").value = "";
	document.getElementById("Pop_Multi").value = "1";
	document.getElementById("Planetoid").value = "0";
	document.getElementById("Gas_Giants").value = "0";
	document.getElementById("Worlds").value = "2";
	document.getElementById("allegiance").value = "";
	document.getElementById("Stellar_Data").value = "";
}

function writeWorldDetails(worldObject)
{
	document.getElementById("element_7").value =  worldObject.hex + " " + worldObject.sector;
	document.getElementById("element_1").value = worldObject.name;
	document.getElementById("element_2").value = worldObject.uwp;
	document.getElementById("iX").value = worldObject.iX;
	document.getElementById("eX").value = worldObject.economicExt.substring(1,5);
	document.getElementById("cX").value = worldObject.culturalExt.substring(1,4);
	document.getElementById("Nobz").value = worldObject.noblesExt;
	document.getElementById("Bases").value = worldObject.bases;
	document.getElementById("Zone").value = worldObject.travelZone;
	document.getElementById("Pop_Multi").value = worldObject.popMulti;
	document.getElementById("Planetoid").value = worldObject.belts;
	document.getElementById("Gas_Giants").value = worldObject.gas_giants;
	document.getElementById("Worlds").value = worldObject.worlds;
	document.getElementById("allegiance").value = worldObject.allegiance;
	document.getElementById("Stellar_Data").value = worldObject.stars;
	document.getElementById("seed").value = worldObject.standardSeed;
}

function readURL(flagFnc)
{
	var URLParams = new URLSearchParams(window.location.search);
	if(URLParams.toString() == "")
		return false;
	var myWorld = new mainWorld();
	myWorld.hex = URLParams.get("hex");
	myWorld.sector = URLParams.get("sector");
	myWorld.name = URLParams.get("name");
	try
	{
		myWorld.uwp.readUWP(URLParams.get("uwp"));
	}
	catch(errorE)
	{
		myWorld.uwp.createUWP();
	}
	myWorld.tcs.generate();
	var tc = URLParams.getAll("tc");
	for(var i=0;i<tc.length;i++)
		myWorld.tcs.add(tc[i]);
	var iX = parseInt(URLParams.get("iX"));
	if(isNaN(iX) || iX < -4 || iX > 5)
	{
		myWorld.generateIx();
	}
	else
		myWorld.iX = iX;
	var pbgString = URLParams.get("pbg");
	if(pbgString !== null)
	{
		myWorld.popMulti = parseInt(pbgString.substr(0,1));
		myWorld.belts = parseInt(pbgString.substr(1,1));
		myWorld.gas_giants = parseInt(pbgString.substr(2,1));
	}
	else
	{
		myWorld.popMulti = parseInt(URLParams.get("popMulti"));
		if(isNaN(myWorld.popMulti))
			myWorld.popMulti = rng(9);
		myWorld.belts = URLParams.get("belts") || Math.max(0, dice(1)-3);
		myWorld.gas_giants = URLParams.get("gas_giants") || Math.max(0, Math.floor(dice(2)/2-2));
	}
	myWorld.worlds = parseInt(URLParams.get("worlds"));
	if(isNaN(myWorld.worlds))
		myWorld.worlds = dice(2);
	try
	{
		myWorld.economicExt.readString(URLParams.get("eX"));
	}
	catch(errorE)
	{
		myWorld.economicExt.generate();
	}
	try
	{
		myWorld.culturalExt.readString(URLParams.get("cX"));
	}
	catch(errorE)
	{
		myWorld.culturalExt.generate();
	}
	var basesString = URLParams.get("bases");
	if(basesString === null)
		myWorld.bases.generate();
	else
		if(basesString)
			myWorld.bases.readString(basesString);
	var nobz = URLParams.get("nobz");
	if(nobz === null)
		myWorld.noblesExt.generate();
	else
		myWorld.noblesExt.readString(nobz);
	myWorld.allegiance = URLParams.get("allegiance");
	var stellar = URLParams.get("stellar");
	if(stellar === null)
		myWorld.stars.generate();
	else
		if(stellar)
			myWorld.stars.readString(stellar);
	myWorld.standardSeed = URLParams.get("seed") || ("" + myWorld.hex + myWorld.hex);
	myWorld.travelZone = URLParams.get("travelZone");
	myWorld.system = URLParams.get("system") || (myWorld.name + " (" + myWorld.hex + " " + myWorld.sector + ")");
	if(arguments.length > 0)
		flagFnc(URLParams);
	myWorld.nativeIntLife.generate();
	return myWorld;
}

function systemMap()
{
	document.body.appendChild(mySystem.toSymbolMap());
	window.alert("Symbolic system map generated.  Scroll down to see it.");
}

function blankMap()
{
	var size = parseInt(document.getElementById("blank_map_size").value);
	var myWorld = new mainWorld();
	myWorld.uwp.size = size;
	myWorld.uwp.atmos = 0;
	myWorld.uwp.hydro = 0;
	myWorld.uwp.popul = 0;
	myWorld.uwp.gov = 0;
	myWorld.uwp.law = 0;
	myWorld.uwp.TL = 0;
	myWorld.uwp.port = "X";
	BLANK_MAP = true;
	BLACK_AND_WHITE = true;
	window.open("t5_map.html" + myWorld.buildGet() + mapFlags());
}