var PREC_ORDINAL = ["Primary","Secondary","Tertiary","Quaternary"];
var rng;

function init_rng(seed)
{
	var prng = new Burtle(seed);
	rng = function(n)
	{
		return Math.floor(prng.ranval()/4294967295*n)+1;
	}
}

function dice(numDice)
{
	var result = 0;
	for(var i=0;i<numDice;i++)
		result += rng(6);
	return result;
}

function d100()
{
	return rng(100);
}

function d10()
{
	return rng(10);
}


function d20()
{
	return rng(20);
}

function d3()
{
	return rng(3);
}

function d2()
{
	return rng(2);
}

function flux()
{
	return dice(1)-dice(1);
}

function radioSelect(buttonSet)
{
	for(var i=0;i<buttonSet.length;i++)
		if(buttonSet[i].checked)
			return buttonSet[i].value;
	return false;
}

function checkboxSelect(checkboxSet)
{
	var returnSet = [];
	for(var i=0;i<checkboxSet.length;i++)
		if(checkboxSet[i].checked)
			returnSet.push(checkboxSet[i].value);
	return returnSet.length == 0 ? false : returnSet;
}

var E_HEX_STRING = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ?";
function pseudoHex(someInteger)
{
	if(someInteger < 0 || someInteger > 34 || !Number.isInteger(someInteger))
		throw new Error("Illegal value passed to pseudoHex: " + someInteger + ". A pseudo hexadecimal must be an integer from 0 to 34");
	return E_HEX_STRING.substr(someInteger,1);
}

function readPseudoHex(c)
{
	if(arguments.length < 1 || c == "")
		c = " ";
	r = E_HEX_STRING.indexOf(c);
	if(r != -1)
		return r;
	throw new Error("Illegal value '" + c + "' passed to readPseudoHex.");
}

array_fnc = {
	random: function()
	{
		var i = rng(this.length)-1;
		return this[i];
	},

	randomIndex: function()
	{
		return rng(this.length)-1;
	},

	pushUnique: function(newElement)
	{
		if(this.find(function(v) { return v == newElement }) === undefined)
		{
			this.push(newElement);
			return true;
		}
		else
			return false;
	},

	copy: function()
	{
		var copyOf = [];
		this.map(function(item) { copyOf.push(item) });
		return copyOf;
	}
}

function pad(s, l)
{
	s = s.toString();
	if(s.length > l)
		return s.substr(0,l);
	return s + " ".repeat(l-s.length);
}

function pad_left(s, l)
{
	if(s.length > l)
		return s.substr(l-1);
	return " ".repeat(l-s.length) + s;
}

function array_sort_by_name(a, b)
{
	return a.name.localeCompare(b.name);
}

function dice_table(table_data_object, objWithProperties, specialValue)
{
	var me = this;
	me.table = table_data_object;
	me.diceFnc = table_data_object.dice;
	me.min = table_data_object.min;
	me.max = table_data_object.max;
	me.modData = table_data_object.mods;
	me.DM = 0;
	me.rollResult = 0;

	me.roll = function()
	{
		var diceRoll = 0;
		diceRoll = me.diceFnc(me.specialValue);
		diceRoll += me.DM;
		diceRoll = Math.max(me.min, Math.min(me.max, diceRoll));
		me.rollResult = diceRoll;
		return me.table[diceRoll];
	}

	me.selection = function(index)
	{
		return me.table[Math.max(me.min, Math.min(me.max, index+me.DM))];
	}

	me.setDMs = function(objWithProperties)
	{
		for(var i=0;i<me.modData.length;i++)
			me.DM += me.modData[i][objWithProperties[me.modData[i].property]];
	}

	me.result = function()
	{
		return me.table[me.rollResult];
	}

	if(arguments.length > 1 && objWithProperties != null)
		me.setDMs(objWithProperties);

	if(arguments.length > 2)
		me.specialValue = specialValue;

}

function triangleNumber(n)
{
	if(n>0)
		return n + triangleNumber(n-1);
	else
		return 0;
}

function loadDoc(urlString, parseFunc, parseArg)
{
  if(arguments.length < 3)
	  parseArg = null;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function()
  {
    if (this.readyState == 4 && this.status == 200)
	{
      parseFunc(this.responseText, parseArg);
    }
  };
  xhttp.open("GET", urlString, true);
  xhttp.send();
}

function shuffle(arrayIn) {
  var array = array_fnc.copy.call(arrayIn);
  var m = array.length, t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = rng(m--)-1;

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

function dms(t)
{
	var minutes = (t - Math.floor(t)) * 60;
	var seconds = (minutes - Math.floor(minutes)) * 60;

	return Math.floor(t) + "&deg;C " + Math.floor(minutes) + "' " + Math.floor(seconds) + '"';
}

function hms(t)
{
	var minutes = (t - Math.floor(t)) * 60;
	var seconds = (minutes - Math.floor(minutes)) * 60;

	return Math.floor(t) + " hours " + Math.floor(minutes) + " minutes " + Math.floor(seconds) + " seconds";
}

function dhms(t)
{
	var hours = (t - Math.floor(t)) * 24;
	return Math.floor(t) + " days " + hms(hours);
}

function mdhms(t)
{
	var days = (t - Math.floor(t)) * 28;
	return Math.floor(t) + " Lunar months " + dhms(days);
}

function ydhms(t)
{
	var days = (t - Math.floor(t)) * 365;
	return Math.floor(t) + " years " + dhms(days);

}

var codeDigits = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function codeKey(numDigits)
{
	var s = "";
	for(var i=0;i<numDigits;i++)
		s += codeDigits.charAt(rng(codeDigits.length-1));
	return s;
}

//paramObj = {d:, t:, a: } and can have any two defined; the third must be 'false'
function intraSystemTravel(paramObj)
{
	var me = this;
	me.d = paramObj.d;
	me.t = paramObj.t;
	me.a = paramObj.a;

	if((!me.d && !me.t) || (!me.d && !me.a) || (!me.t && !me.a))
		throw new Error("Calculating Intra System travel requires at least 2 parameters out of time, distance and acceleration.  Time = " + me.t + " Distance = " + me.d + " Accelration = " + me.a);


	me.solve = function()
	{
		if(!me.d)
			me.d = me.a * Math.pow(me.t,2) / 4;
		if(!me.t)
			me.t = 2*Math.sqrt(me.d/me.a);
		if(!me.a)
			me.a = 4*me.d/Math.pow(me.t,2);
	}

	me.timeString = function()
	{
		if(me.t < 90)
			return me.t + "s";
		if(me.t < 5400)
			return Math.floor(me.t/60) + "m " + Math.floor(me.t%60) + "s";
		if(me.t < 129600)
			return Math.floor(me.t/3600) + "h " + Math.floor(me.t%3600/60) + "m " + Math.floor(me.t%60) + "s";
		if(me.t < 691200)
			return Math.floor(me.t/86400) + "d " + Math.floor(me.t%86400/3600) + "h " + Math.floor(me.t%3600/60) + "m " + Math.floor(me.t%60) + "s";
		return Math.floor(me.t/604800) + "w " + Math.floor(me.t%604800/86400) + "d " + Math.floor(me.t%86400/3600) + "h " + Math.floor(me.t%3600/60) + "m " + Math.floor(me.t%60) + "s";
	}

	me.accelerationString = function()
	{
		return me.a / 9.81 + "G";
	}

	me.distanceString = function()
	{
		return Math.floor(me.d/1000) + "km";
	}

	me.solve();

}
