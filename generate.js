var worldMapCounter = 0;
var SAVED_SYSTEMS = [];

var user_pref_db, mySystem, originalMainWorld, request, sys_db, sysDiv, symbolDiv, detailDiv, upDiv, mapDiv, mapSVG, sysDetailsDiv, genDiv, blankMapDiv;

function initLoad()
{
	init_rng(Date.now());
	sysDiv = document.getElementById("sys_table");
	symbolDiv = document.getElementById("symbol_map");
	detailDiv = document.getElementById(WORLD_DETAILS_DIV_NAME);
	upDiv = document.getElementById(USER_PREF_DIV_NAME);
	mapDiv = document.getElementById(WORLD_MAP_DIV_NAME);
	mapSVG = document.getElementById(WORLD_MAP_SVG_NAME);
	sysDetailsDiv = document.getElementById(SYSTEM_DETAILS_DIV_NAME);
	genDiv = document.getElementById("gen_new");
	blankMapDiv = document.getElementById("blankMapDiv");
	uPObj = new userPreferences();


	if(!window.indexedDB)
		window.alert("Your browser does not support a stable version of IndexedDB.  Saving of your preferences may not be available.");
	var r = window.indexedDB.open("traveller_worlds_prefs",4);

	r.onerror = function(event)
	{
		// no error handling yet
	};

	r.onsuccess = function(event)
	{
		user_pref_db = event.target.result;
		user_pref_db.transaction(["userPreferences"]).objectStore("userPreferences").get("Default").onsuccess = function(event)
				{
					uPObj.read_dbObj(event.target.result.prefs);
					initialSystem();
				};
	};

	r.onupgradeneeded = function(event)
	{
		user_pref_db = event.target.result;
		if(user_pref_db.objectStoreNames.contains("userPreferences"))
			user_pref_db.deleteObjectStore("userPreferences");
		var objectStore = user_pref_db.createObjectStore("userPreferences", { keyPath: "profile_name" });
		objectStore.createIndex("profile_name","profile_name",{unique:true});
		objectStore.transaction.oncomplete = function(event)
		{
			var profileObjectStore = user_pref_db.transaction("userPreferences","readwrite").objectStore("userPreferences");
			profileObjectStore.add({profile_name:"Default", prefs:uPObj.toObj() });
		};
	};

	request = window.indexedDB.open("saved_systems_db",1);
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

function worldLoadSpin(worldListDoc)
{
	var worldList = parseSector(worldListDoc).worlds;
	worldArray = [];
	for(worldEntry in worldList)
	{
		aWorld = new mainWorld();
		aWorld.readDataObj(worldList[worldEntry]);
		aWorld.sector = "Spinward Marches";
		aWorld.standardSeed = aWorld.hex + aWorld.hex;
		aWorld.system = aWorld.name + " (" + aWorld.hex + " " + aWorld.sector + ")";
		worldArray.push(aWorld);
	}
	var randomWorld = worldArray[rng(worldArray.length-1)];
	originalMainWorld = Object.assign({}, randomWorld);
	mySystem = new fullSystem(randomWorld, sysDiv, symbolDiv, detailDiv, true);
	loadSystemOntoPage(mySystem);
}

function initialSystem()
{
	var givenWorld = readURL();
	if(!givenWorld)
		loadDoc("https://travellermap.com/data/Spinward%20Marches/tab", worldLoadSpin); // the code under 'else' also runs in worldLoadSpin because loadDoc is asynchronous
	else // most straightforward case - go ahead and compute the details on the given data
	{
		mySystem = new fullSystem(givenWorld, sysDiv, symbolDiv, detailDiv, true);
		originalMainWorld = Object.assign({}, givenWorld);
		loadSystemOntoPage(mySystem);
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
		mySystem = new fullSystem(temp_mainWorld, sysDiv, symbolDiv, detailDiv, false);
		mySystem.read_dbObj(sys_obj);
		mySystem.loadKey = k;
		init_rng(mySystem.mainWorld.standardSeed);
		loadSystemOntoPage(mySystem);
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
		mySystem = new fullSystem(temp_mainWorld, sysDiv,symbolDiv,detailDiv,false);
		mySystem.read_dbObj(sys_obj);
		init_rng(mySystem.mainWorld.standardSeed);
		loadSystemOntoPage(mySystem);
	},false);

	reader.onerror = function(ev)
	{
		console.log("Error encountered: " + ev);
		reader.abort();
	}

	reader.readAsText(selFile);

}

function giveRandomSeed()
{
	var newSeed = rng(4294967295);
	document.getElementById('mapSeed').value = newSeed;
}

function svgToPng(worldMapSVGID, fileName)
{
	saveSvgAsPng(document.querySelector("#" + worldMapSVGID), fileName, {scale: 3.0}); //user-defined scale to be added later
}

function readURL()
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
		myWorld.belts = URLParams.get("belts") !== null ? parseInt(URLParams.get("belts")) : Math.max(0, dice(1)-3);
		myWorld.gas_giants = URLParams.get("gas_giants") !== null ? parseInt(URLParams.get("gas_giants")) : Math.max(0, Math.floor(dice(2)/2-2));
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
	myWorld.nativeIntLife.generate();
	return myWorld;
}

function regenerateMap()
{
	currentWorld.mapSeed = parseInt(document.getElementById("mapSeed").value);
	currentWorld.createMap();
	document.getElementById("mapSeed").value = currentWorld.mapSeed;
}

function renegerateMapRS()
{
	currentWorld.mapSeed = false;
	currentWorld.createMap();
	document.getElementById("mapSeed").value = currentWorld.mapSeed;
}

function removeTZ()
{
	currentWorld.noTZ();
}

function loadSystemOntoPage(systemObj)
{
	while(systemObj.sysDiv.hasChildNodes())
		systemObj.sysDiv.removeChild(systemObj.sysDiv.childNodes[0]);
	var sTables = systemObj.toTable();
	for(var i=0;i<sTables.length;i++)
		systemObj.sysDiv.appendChild(sTables[i]);
	systemObj.toSymbolMap();
	document.getElementById("mapSeed").value = systemObj.mainWorld.mapSeed = systemObj.mainWorld.standardSeed;
	divsToShow(2);
	systemObj.mainWorld.editDetails();
	document.getElementById("mapPlaceholder").style.display = "none";
}


function editUserPrefs()
{
	divsToShow(3);
	uPObj.writeDocument();
}

function saveUserPrefs()
{
	uPObj.readDocument();

	var r = window.indexedDB.open("traveller_worlds_prefs",4);

	r.onerror = function(event)
	{
		// no error handling yet
	};

	r.onsuccess = function(event)
	{
		user_pref_db = event.target.result;
		var profileObjectStore = user_pref_db.transaction("userPreferences","readwrite").objectStore("userPreferences");
		var objStoreTitleReq = profileObjectStore.get("Default");
		objStoreTitleReq.onsuccess = function()
		{
			var info = objStoreTitleReq.result;
			info.prefs = uPObj.toObj();
			var updateRequest = profileObjectStore.put(info);
			alert("New preferences have been saved");
		}
	};
}

function resetPrefs()
{
	uPObj.resetPrefs();
	uPObj.writeDocument();
	saveUserPrefs();
}

function cancelUserPrefs()
{
	upDiv.style.display = "none";
	mapDiv.style.display = divsOpen[0];
	detailDiv.style.display = divsOpen[1];
	sysDetailsDiv.style.display = divsOpen[2];
	genDiv.style.display = divsOpen[3];
	blankMapDiv.style.display = divsOpen[4];
}

function divsToShow(optionChosen)
{
	sysDetailsDiv.style.display="none";
	mapDiv.style.display="none";
	detailDiv.style.display="none";
	upDiv.style.display = "none";
	genDiv.style.display = "none";
	blankMapDiv.style.display = "none";
	document.getElementById("APIdoco").style.display = "none";
	document.getElementById("changeLog").style.display = "none";
	document.getElementById("credits").style.display = "none";
	document.getElementById("legal").style.display = "none";
	document.getElementById("contact_me").style.display = "none";
	switch(optionChosen)
	{
		case 1:
			sysDetailsDiv.style.display="block";
			break;
		case 2:
			mapDiv.style.display="block";
			detailDiv.style.display="block";
			break;
		case 3:
			upDiv.style.display = "block";
			break;
		case 4:
			genDiv.style.display = "block";
			break;
		case 5:
			blankMapDiv.style.display = "block";
			break;
		case 6:
			document.getElementById("APIdoco").style.display = "block";
			break;
		case 7:
			document.getElementById("changeLog").style.display = "block";
			break;
		case 8:
			document.getElementById("credits").style.display = "block";
			break;
		case 9:
			document.getElementById("legal").style.display = "block";
			break;
		case 10:
			document.getElementById("contact_me").style.display = "block";
			break;

	}
}

function apiDoco()
{
	sysDetailsDiv.style.display='none';
	mapDiv.style.display='none';
	detailDiv.style.display='none';
	upDiv.style.display = "none";
	genDiv.style.display = "none";
	blankMapDiv.style.display = "none";
	document.getElementById("APIdoco").style.display = "none";

}

function giveHelpMessage(helpID)
{
	upDiv.style.display = "none";
	sysDetailsDiv.style.display='none';
	mapDiv.style.display='block';
	detailDiv.style.display='none';
	mapSVG.style.display = 'none';
	genDiv.style.display = "none";
	blankMapDiv.style.display = "none";
	document.getElementById("APIdoco").style.display = "none";

	switch(helpID)
	{
		case 1:
			mapDiv.innerHTML = "<p class='white'>The current default sector in your user preferences has no star systems, so a map and star system have not been automatically generated.</p><p class='white'>Please edit your user preferences to choose a sector WITH star systems so I can show you the TRUE power of the dar... *cough*, TravellerWorlds.</p><p class='white'>A beautiful world map with full star system details will be presented every time you come here - selected randomly from your chosen sector.  Oh yeah.</p><p class='white'>Did you know I made Spinward Marches the default-default sector - MY favourite sector.  OK, not by much, I admit - there's a lot of great sectors out there.  But no, it's not a coincidence.</p>";
			break;
		default: // convention we'll adopt: helpID=0 falls through to the default
			mapDiv.innerHTML = "Well, something REALLY unanticipated has occured!"
	}
}

var SECTORS_LOADED = false;
function generateNew()
{
	divsToShow(4);
	if(!SECTORS_LOADED)
	{
		if(uPObj.prefs.default_sector == "")
			uPObj.prefs.default_sector = encodeURIComponent("Spinward Marches");
		loadDoc("https://travellermap.com/api/universe", loadSectors);
	}
}

function loadSectors(sectorListText)
{
	SECTORS_LOADED = true;
	var defaultSectorSelect = document.getElementById("default_sector");
	while(defaultSectorSelect.options.length > 0)
		defaultSectorSelect.remove(0);
	var sectors = JSON.parse(sectorListText);
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
		var myOption = document.createElement("option");
		myOption.text = sectorList[i].text;
		myOption.value = sectorList[i].value;
		defaultSectorSelect.add(myOption);
	}
	defaultSectorSelect.value = uPObj.prefs.default_sector;
	loadWorlds(defaultSectorSelect);
}

var worldArray;
function loadWorlds(selectObject)
{
	var urlString = "https://travellermap.com/data/" + selectObject.value + "/tab";
	loadDoc(urlString, worldLoadParse, selectObject);
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
		aWorld.system = aWorld.name + " (" + aWorld.hex + " " + aWorld.sector + ")";
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
		document.getElementById("chooseOTUWorld").disabled = true;
	}
	else
		document.getElementById("chooseOTUWorld").disabled = false;
}

function readUserInput()
{
	var worldHex = document.getElementById("element_7").value.substr(0,4);
	var sectorName = document.getElementById("element_7").value.substr(5).trim();
	var worldName = document.getElementById("element_1").value;
	var uwpString = document.getElementById("element_2").value;
	var additionalTradeCodes = checkboxSelect(document.getElementsByName("TradeCode"));
	var iX = parseInt(document.getElementById("iX").value);
	var eX = "(" + document.getElementById("eX_input").value + ")";
	var cX = "[" + document.getElementById("cX_input").value + "]";
	var nobz = document.getElementById("Nobz").value;
	var basesString = document.getElementById("Bases").value;
	var zone = document.getElementById("Zone").value;
	var popMulti = parseInt(document.getElementById("Pop_Multi").value);
	var belts = parseInt(document.getElementById("Planetoid").value);
	var gas_giants = parseInt(document.getElementById("Gas_Giants").value);
	var worlds = parseInt(document.getElementById("Worlds").value);
	var allegiance = document.getElementById("allegiance").value;
	var stellar_data = document.getElementById("Stellar_Data").value;
	var userSeed = document.getElementById("mapSeed").value;
	if(userSeed)
	{
		init_rng(userSeed);
		seedUsed = userSeed;
	}
	else
	{
		seedUsed = Date.now() >>> 0;
		init_rng(seedUsed);
		document.getElementById("mapSeed").value = seedUsed;
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
		document.getElementById("eX_input").style.color = "red";
		document.getElementById("guide_3").style.color = "red";
		thereIsAnError = true;
		console.log(errorE);
	}
	try
	{
		myWorld.culturalExt.readString(cX);
	}
	catch(errorE)
	{
		document.getElementById("cX_input").style.color = "red";
		document.getElementById("guide_5").style.color = "red";
		thereIsAnError = true;
		console.log(errorE);
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
	return myWorld;
}

function loadWorld(worldObject)
{
	document.getElementById("element_7").value = worldObject.hex + " " + worldObject.sector;
	document.getElementById("element_1").value = worldObject.name;
	document.getElementById("element_2").value = worldObject.uwp.toString();
	document.getElementById("tcs_input").innerHTML = worldObject.tcs;
	setAdditionalTCs(worldObject);
	document.getElementById("iX_input").value = worldObject.iX();
	document.getElementById("eX_input").value = worldObject.economicExt.toString().substr(1,5);
	document.getElementById("cX_input").value = worldObject.culturalExt.toString().substr(1,4);
	document.getElementById("Nobz").value = worldObject.noblesExt.toString();
	document.getElementById("Bases").value = worldObject.bases.toString();
	document.getElementById("Zone").value = worldObject.travelZone;
	document.getElementById("Pop_Multi").value = worldObject.popMulti;
	document.getElementById("Planetoid").value = worldObject.belts;
	document.getElementById("Gas_Giants").value = worldObject.gas_giants;
	document.getElementById("Worlds").value = worldObject.worlds;
	document.getElementById("allegiance").value = worldObject.allegiance;
	document.getElementById("Stellar_Data").value = worldObject.stars.toString();
	document.getElementById('mapSeed').value = worldObject.standardSeed;
}

function setAdditionalTCs(worldObj)
{
	var addTCCheckboxes = document.getElementsByName("TradeCode");
	for(var i=0;i<addTCCheckboxes.length;i++)
		addTCCheckboxes[i].checked = worldObj.tcs.has(addTCCheckboxes[i].value);
}

function doOTUGeneration()
{
	selectObject = document.getElementById("WorldSelect");
	if(selectObject.value == "ERROR")
	{
		return;
	}
	var selectedWorld = worldArray.find(function(v) { return v.hex == selectObject.value } );
	loadWorld(selectedWorld);
}

function setAdditionalTCs(worldObj)
{
	var addTCCheckboxes = document.getElementsByName("TradeCode");
	for(var i=0;i<addTCCheckboxes.length;i++)
		addTCCheckboxes[i].checked = worldObj.tcs.has(addTCCheckboxes[i].value);
}

function generateMissing()
{
	var worldHex = document.getElementById("element_7").value.substr(0,4);
	var sectorName = document.getElementById("element_7").value.substr(4);
	var worldName = document.getElementById("element_1").value;
	var uwpString = document.getElementById("element_2").value;
	var additionalTradeCodes = checkboxSelect(document.getElementsByName("TradeCode"));
	var iX = parseInt(document.getElementById("iX_input").value);
	var eX = "(" + document.getElementById("eX_input").value + ")";
	if(eX == "(000+0)")
		eX = 123;
	var cX = "[" + document.getElementById("cX_input").value + "]";
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
	document.getElementById("tcs_input").innerHTML = myWorld.tcs;
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
		document.getElementById("eX_input").value = myWorld.economicExt.toString().substr(1,5);
	}
	try
	{
		myWorld.culturalExt.readString(cX);
	}
	catch(errorE)
	{
		myWorld.culturalExt.generate();
		document.getElementById("cX_input").value = myWorld.culturalExt.toString().substr(1,4);
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
	document.getElementById("iX_input").value = myWorld.iX();
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
	document.getElementById("tcs_input").innerHTML = "";
	document.getElementById("iX_input").value = "";
	document.getElementById("eX_input").value = "";
	document.getElementById("cX_input").value = "";
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

function makeMyWorld()
{
	var myWorld = readUserInput();
	if(!myWorld)
		return;
	mySystem = new fullSystem(myWorld, sysDiv, symbolDiv, detailDiv, true);
	loadSystemOntoPage(mySystem);
	worldDetailsDiv();
}

function blankMapGen()
{
	document.getElementById("saveAreaBlank").style.backgroundColor = "#ffffff";
	var blankMapSVG = document.getElementById("blankMapSVG");
	while(blankMapSVG.hasChildNodes())
		blankMapSVG.removeChild(blankMapSVG.childNodes[0]);

	var blankMapSize = parseInt(document.getElementById("blankSize").value);
	var blankWorld = new mainWorld();
	blankWorld.uwp.size = blankMapSize;
	var blankMap = new worldMap(blankWorld, blankMapSVG, blankMapDiv, true);
	blankMap.generate();
	blankMap.render();
	blankMap.outline();
}

function downloadBlankMapSVG()
{
	var blankMapSize = parseInt(document.getElementById("blankSize").value);
	var fileName = "Blank World Map Size " + blankMapSize + ".svg";
	downloadMap("saveAreaBlank",fileName);
}

function downloadBlankMapPNG()
{
	var blankMapSize = parseInt(document.getElementById("blankSize").value);
	var fileName = "Blank World Map Size " + blankMapSize + ".png";
	svgToPng("blankMapSVG", fileName);
}

function regenerateSystem()
{
	mySystem = new fullSystem(originalMainWorld, sysDiv, symbolDiv, detailDiv, true);
	loadSystemOntoPage(mySystem);
}

function regenerateSystemRS()
{
	init_rng(Date.now() + rng(10000));
	var newSeed = rng(4294967295);
	document.getElementById("mapSeed").value = newSeed;
	originalMainWorld.standardSeed = newSeed;
	originalMainWorld.mapSeed = newSeed;
	init_rng(newSeed);
	mySystem = new fullSystem(originalMainWorld, sysDiv, symbolDiv, detailDiv, true);
	loadSystemOntoPage(mySystem);
}