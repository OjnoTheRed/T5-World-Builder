function generate_subsector()
{
	init_rng(Date.now());
	var ssDiv = document.getElementById("subsector");
	var allWorlds = [];
	var worldNames = ["zinvaehines","riphecarro","gophurn","tithonoe","eilara","pephus","gnanicury","gnuater","siea 26Z","villon QR","otrulia","eccunus","sanzoth","kennilia","niter","nehiri","miulia","ceduwei","deshan X381","drora 3BV","biphautune","tanraoturn","bundars","yelagua","xiacury","eugawa","grualea","chogilara","ziuq BT","gapus P67","rastrugawa","lebobos","hotherth","detrilia","ketov","tuetera","ciyanides","zeohiri","chichi 9A5","sides G312","nograclite","thagougawa","ucrurn","invichi","oturn","unides","miponov","chipigawa","voria I9","strao SB0","alrecarro","zuphuabos","tibbippe","dacrilia","ketania","pihiri","llibuter","louvis","vapus AZ4","gypso ","cucroihines","ponnienus","gileon","chicides","nuitania","eatune","phedirilia","nucaphus","greron TKOF","drypso 8XX","tugniogantu","pullatis","bagnara","yindorth","cheria","poaria","greritania","vidinerth","vora 3R2O","carvis OQF"];
	var ssName = "Glory Box";
	var secName = "Corona";
	var wnP = 0;
	var density = 2
	var ssTable = document.createElement("TABLE");
	//ssTable.className = "white";
	var hdrRow = document.createElement("TR");
	var hdrContents = ["Hex","Name","UWP","TCs & Remarks","iX","eX","cX","Nobles","Bases","Zone","PBG","Worlds", "Allegnience","Stellar"];
	hdrContents.map(function(h)
	{
		var hdr_cell = document.createElement("TD");
		var hdr_txt = document.createTextNode(h);
		hdr_cell.appendChild(hdr_txt);
		hdrRow.appendChild(hdr_cell);
	});
	ssTable.appendChild(hdrRow);
	for(var col=1;col<9;col++)
		for(var row=1;row<11;row++)
		{
			if(dice(1) > density)
				continue;
			var hexID = getHexID(col, row);
			var aWorld = new mainWorld();
			aWorld.generate();
			aWorld.hex = hexID;
			aWorld.name = worldNames[wnP++];
			aWorld.subSector = ssName;
			aWorld.sector = secName;
			allWorlds.push(aWorld);
		}
	allWorlds.map(function(w) 
	{ 
		var w_tr = w.toTR();
		var btn_cell = document.createElement("TD");
		btn_cell.appendChild(getLink(w));
		w_tr.appendChild(btn_cell);
		ssTable.appendChild(w_tr);
	});
	
	document.body.appendChild(ssTable);
	
}

function getHexID(col,row)
{
	var sCol = col < 10 ? "0" + col : col.toString();
	var sRow = row < 10 ? "0" + row : row.toString();
	return sCol + sRow;
}

function getLink(w)
{
	var sysLink = document.createElement("A");
	sysLink.href = "index.htm" + w.buildGet();
	sysLink.target = "_blank";
	sysLink.text = "Details";
	return sysLink;		
}

/*							if(uPObj.prefs.default_sector == "")
								uPObj.prefs.default_sector = "Spinward Marches";
							loadDoc("https://travellermap.com/api/universe", loadSectors);

			<p class="guidelines">Default Sector:</p>
			<p><select id="default_sector" onchange="loadWorlds(this); saveUserPrefs()">
				<option value="ERROR">Error: sectors not loaded</option>
			</select></p>
			<p class="guidelines">Select a world:</p>
			<p><select id="WorldSelect" style="max-width:100%;">
				<option value="ERROR">Error: worlds not loaded</option>
			</select></p>
			<p><input id="chooseOTUWorld" type="button" value="Generate This World" class="btn2" onclick="doOTUGeneration();" disabled /> 
			(Data imported directly from <a href="https://travellermap.com/">travellermap.com</a>).</p>
*/


function loadSectors(sectorListText)
{
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

function doOTUGeneration()
{
	selectObject = document.getElementById("WorldSelect");
	if(selectObject.value == "ERROR")
	{
		return;
	}
	var selectedWorld = worldArray.find(function(v) { return v.hex == selectObject.value } );
	mySystem = new fullSystem(selectedWorld, sysDiv, symbolDiv, detailDiv, true);
	loadSystemOntoPage(mySystem);
}

function setAdditionalTCs(worldObj)
{
	var addTCCheckboxes = document.getElementsByName("TradeCode");
	for(var i=0;i<addTCCheckboxes.length;i++)
		addTCCheckboxes[i].checked = worldObj.tcs.has(addTCCheckboxes[i].value);
}
