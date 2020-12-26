var habitableZoneUWP = {
							name:"Hospitable",
							size:function(uwp){ uwp.size = dice(2)-2; if(uwp.world.isSatellite) { uwp.size >= uwp.world.satelliteMaxSize ? uwp.size = Math.max(0, uwp.world.satelliteMaxSize-3) : uwp.size += 0; } }, 
							atmos:function(uwp){ uwp.atmos = uwp.size == 0 ? 0 : Math.min(15,Math.max(0,flux()+uwp.size)); }, 
							hydro:function(uwp) { uwp.hydro = uwp.size < 2 ? 0 : Math.max(0,Math.min(10,flux()+uwp.atmos + (uwp.atmos < 2 ? -4 : 0) + (uwp.atmos > 9 ? -4 : 0))); }, 
							popul:function(uwp, maxPop) { if(arguments.length<2) maxPop = 15; var p = dice(2)-2; if(p==10) p=dice(2)+3; uwp.popul = Math.max(0,Math.min(maxPop,p)); },
							gov:function(uwp) { uwp.gov = Math.min(15,Math.max(0,flux()+uwp.popul)); },
							law:function(uwp) { uwp.law = Math.min(18,Math.max(0,flux()+uwp.gov)); },
							port:function(uwp) { uwp.port = uwp.mainWorld ? (new dice_table(WORLD_STARPORT_TABLE)).roll() : (new dice_table(WORLD_SPACEPORT_TABLE,null,uwp.popul)).roll() },
							tech:function(uwp) { uwp.TL = dice(1) + uwp.totalTechDM(); }
};

var planetoidsUWP = { 	
							name:"Planetoids",
							size:function(uwp){ uwp.size = 0; }, 
							atmos:function(uwp){ uwp.atmos = 0; }, 
							hydro:function(uwp) { uwp.hydro = 0; }, 
							popul:function(uwp,maxPop) { if(arguments.length<2) maxPop = 15; var p = dice(2)-2; if(p==10) p=dice(2)+3; uwp.popul = Math.max(0,Math.min(maxPop,p)); },
							gov:function(uwp) { uwp.gov = Math.min(15,Math.max(0,flux()+uwp.popul)); },
							law:function(uwp) { uwp.law = Math.min(18,Math.max(0,flux()+uwp.gov)); },
							port:function(uwp) { uwp.port = uwp.mainWorld ? (new dice_table(WORLD_STARPORT_TABLE)).roll() : (new dice_table(WORLD_SPACEPORT_TABLE,null,uwp.popul)).roll() },
							tech:function(uwp) { uwp.TL = dice(1) + uwp.totalTechDM(); }
};

var iceWorldUWP = {
							name:"Ice world",
							size:function(uwp){ uwp.size = dice(2)-2; if(uwp.world.isSatellite) { uwp.size >= uwp.world.satelliteMaxSize ? uwp.size = Math.max(0, uwp.world.satelliteMaxSize-3) : uwp.size += 0; } }, 
							atmos:function(uwp){ uwp.atmos = uwp.size == 0 ? 0 : Math.min(15,Math.max(0,flux()+uwp.size)); }, 
							hydro:function(uwp) { uwp.hydro = uwp.size < 2 ? 0 : Math.max(0,Math.min(10,flux()+uwp.atmos + (uwp.atmos < 2 ? -4 : 0) + (uwp.atmos > 9 ? -4 : 0))); }, 
							popul:function(uwp,maxPop) { if(arguments.length<2) maxPop = 15; var p = Math.max(0,dice(2)-10); if(p==10) p=dice(2)+3; uwp.popul = Math.max(0,Math.min(maxPop,p)); },
							gov:function(uwp) { uwp.gov = Math.min(15,Math.max(0,flux()+uwp.popul)); },
							law:function(uwp) { uwp.law = Math.min(18,Math.max(0,flux()+uwp.gov)); },
							port:function(uwp) { uwp.port = uwp.mainWorld ? (new dice_table(WORLD_STARPORT_TABLE)).roll() : (new dice_table(WORLD_SPACEPORT_TABLE,null,uwp.popul)).roll() },
							tech:function(uwp) { uwp.TL = dice(1) + uwp.totalTechDM(); }
};

var radWorldUWP = { 	
							name:"Rad world",
							size:function(uwp){ uwp.size = dice(2); if(uwp.world.isSatellite) { uwp.size >= uwp.world.satelliteMaxSize ? uwp.size = Math.max(0, uwp.world.satelliteMaxSize-3) : uwp.size += 0; } }, 
							atmos:function(uwp){ uwp.atmos = uwp.size == 0 ? 0 : Math.min(15,Math.max(0,flux()+uwp.size)); }, 
							hydro:function(uwp) { uwp.hydro = uwp.size < 2 ? 0 : Math.max(0,Math.min(10,flux()+uwp.atmos + (uwp.atmos < 2 ? -4 : 0) + (uwp.atmos > 9 ? -4 : 0))); }, 
							popul:function(uwp,maxPop) { uwp.popul = 0; },
							gov:function(uwp) { uwp.gov = 0; },
							law:function(uwp) { uwp.law = 0; },
							port:function(uwp) { uwp.port = uwp.mainWorld ? (new dice_table(WORLD_STARPORT_TABLE)).roll() : (new dice_table(WORLD_SPACEPORT_TABLE,null,uwp.popul)).roll() },
							tech:function(uwp) { uwp.TL = 0; }
};

var infernoWorldUWP = {
							name:"Inferno",
							size:function(uwp){ uwp.size = dice(1)+6; if(uwp.world.isSatellite) { uwp.size >= uwp.world.satelliteMaxSize ? uwp.size = Math.max(0, uwp.world.satelliteMaxSize-3) : uwp.size += 0; } }, 
							atmos:function(uwp){ uwp.atmos = 11; }, 
							hydro:function(uwp) { uwp.hydro = 0; }, 
							popul:function(uwp,maxPop) { uwp.popul = 0; },
							gov:function(uwp) { uwp.gov = 0; },
							law:function(uwp) { uwp.law = 0; },
							port:function(uwp) { uwp.port = "Y"; },
							tech:function(uwp) { uwp.TL = 0; }
};

var bigWorldUWP = { 	
							name:"Big world",
							size:function(uwp){ uwp.size = dice(2)+7; if(uwp.world.isSatellite) { uwp.size >= uwp.world.satelliteMaxSize ? uwp.size = Math.max(0, uwp.world.satelliteMaxSize-3) : uwp.size += 0; } }, 
							atmos:function(uwp){ uwp.atmos = uwp.size == 0 ? 0 : Math.min(15,Math.max(0,flux()+uwp.size)); }, 
							hydro:function(uwp) { uwp.hydro = uwp.size < 2 ? 0 : Math.max(0,Math.min(10,flux()+uwp.atmos + (uwp.atmos < 2 ? -4 : 0) + (uwp.atmos > 9 ? -4 : 0))); }, 
							popul:function(uwp,maxPop) { if(arguments.length<2) maxPop = 15; var p = dice(2)-2; if(p==10) p=dice(2)+3; uwp.popul = Math.max(0,Math.min(maxPop,p)); },
							gov:function(uwp) { uwp.gov = Math.min(15,Math.max(0,flux()+uwp.popul)); },
							law:function(uwp) { uwp.law = Math.min(18,Math.max(0,flux()+uwp.gov)); },
							port:function(uwp) { uwp.port = uwp.mainWorld ? (new dice_table(WORLD_STARPORT_TABLE)).roll() : (new dice_table(WORLD_SPACEPORT_TABLE,null,uwp.popul)).roll() },
							tech:function(uwp) { uwp.TL = dice(1) + uwp.totalTechDM(); }
};

var worldletUWP = {
							name:"Worldlet",
							size:function(uwp){ uwp.size = Math.max(0,dice(1)-3); if(uwp.world.isSatellite) { uwp.size >= uwp.world.satelliteMaxSize ? uwp.size = Math.max(0, uwp.world.satelliteMaxSize-3) : uwp.size += 0; } }, 
							atmos:function(uwp){ uwp.atmos = uwp.size == 0 ? 0 : Math.min(15,Math.max(0,flux()+uwp.size)); }, 
							hydro:function(uwp) { uwp.hydro = uwp.size < 2 ? 0 : Math.max(0,Math.min(10,flux()+uwp.atmos + (uwp.atmos < 2 ? -4 : 0) + (uwp.atmos > 9 ? -4 : 0))); }, 
							popul:function(uwp,maxPop) { if(arguments.length<2) maxPop = 15; var p = dice(2)-2; if(p==10) p=dice(2)+3; uwp.popul = Math.max(0,Math.min(maxPop,p)); },
							gov:function(uwp) { uwp.gov = Math.min(15,Math.max(0,flux()+uwp.popul)); },
							law:function(uwp) { uwp.law = Math.min(18,Math.max(0,flux()+uwp.gov)); },
							port:function(uwp) { uwp.port = uwp.mainWorld ? (new dice_table(WORLD_STARPORT_TABLE)).roll() : (new dice_table(WORLD_SPACEPORT_TABLE,null,uwp.popul)).roll() },
							tech:function(uwp) { uwp.TL = dice(1) + uwp.totalTechDM(); }
};

var innerWorldUWP = { 
							name:"Inner world",
							size:function(uwp){ uwp.size = dice(2)-2; if(uwp.world.isSatellite) { uwp.size >= uwp.world.satelliteMaxSize ? uwp.size = Math.max(0, uwp.world.satelliteMaxSize-3) : uwp.size += 0; } }, 
							atmos:function(uwp){ uwp.atmos = uwp.size == 0 ? 0 : Math.min(15,Math.max(0,flux()+uwp.size)); }, 
							hydro:function(uwp) { uwp.hydro = uwp.size < 2 ? 0 : Math.max(0,Math.min(10,flux()+uwp.atmos-4 + (uwp.atmos < 2 ? -4 : 0) + (uwp.atmos > 9 ? -4 : 0))); }, 
							popul:function(uwp,maxPop) { if(arguments.length<2) maxPop = 15; var p = Math.max(0,dice(2)-6); if(p==10) p=dice(2)+3; uwp.popul = Math.max(0,Math.min(maxPop,p)); },
							gov:function(uwp) { uwp.gov = Math.min(15,Math.max(0,flux()+uwp.popul)); },
							law:function(uwp) { uwp.law = Math.min(18,Math.max(0,flux()+uwp.gov)); },
							port:function(uwp) { uwp.port = uwp.mainWorld ? (new dice_table(WORLD_STARPORT_TABLE)).roll() : (new dice_table(WORLD_SPACEPORT_TABLE,null,uwp.popul)).roll() },
							tech:function(uwp) { uwp.TL = dice(1) + uwp.totalTechDM(); }
};

var stormWorldUWP = {
							name:"Storm world",
							size:function(uwp){ uwp.size = dice(2); if(uwp.world.isSatellite) { uwp.size >= uwp.world.satelliteMaxSize ? uwp.size = Math.max(0, uwp.world.satelliteMaxSize-3) : uwp.size + 0; } }, 
							atmos:function(uwp){ uwp.atmos = uwp.size == 0 ? 0 : Math.min(15,Math.min(Math.max(0,flux()+uwp.size+4))); }, 
							hydro:function(uwp) { uwp.hydro = uwp.size < 2 ? 0 : Math.max(0,Math.min(10,flux()+uwp.atmos-4 + (uwp.atmos < 2 ? -4 : 0) + (uwp.atmos > 9 ? -4 : 0))); }, 
							popul:function(uwp,maxPop) { if(arguments.length<2) maxPop = 15; var p = Math.max(0,dice(2)-8); if(p==10) p=dice(2)+3; uwp.popul = Math.max(0,Math.min(maxPop,p)); },
							gov:function(uwp) { uwp.gov = Math.min(15,Math.max(0,flux()+uwp.popul)); },
							law:function(uwp) { uwp.law = Math.min(18,Math.max(0,flux()+uwp.gov)); },
							port:function(uwp) { uwp.port = uwp.mainWorld ? (new dice_table(WORLD_STARPORT_TABLE)).roll() : (new dice_table(WORLD_SPACEPORT_TABLE,null,uwp.popul)).roll() },
							tech:function(uwp) { uwp.TL = dice(1) + uwp.totalTechDM(); }
};

var ALL_GENERATION_OBJECTS = [habitableZoneUWP,planetoidsUWP,iceWorldUWP,radWorldUWP,infernoWorldUWP,bigWorldUWP,worldletUWP,innerWorldUWP,stormWorldUWP];

var GAS_GIANT_SIZES = { 20:20000, 21:30000, 22:40000, 23:50000, 24:60000, 25:70000, 26:80000, 27:90000, 28:125000, 29:180000, 30:220000, 31:250000, 32:250000};

var WORLD_STARPORT_TABLE = {dice: function() { return dice(2) }, min: 2, max: 12, 2:"A", 3:"A", 4:"A", 5:"B", 6:"B", 7:"C", 8:"C", 9:"D", 10:"D", 11:"E", 12:"X"};
var WORLD_SPACEPORT_TABLE = { dice: function(popul) { return popul - dice(1); }, min:0, max:4, 0:"Y",1:"H",2:"H",3:"G",4:"F"};
var WORLD_TECH_SP_MOD = {property:"port",A:6, B:4, C:2, D:0, E:0, F:1, G:0, H:0, X: -2, Y:0};
var WORLD_TECH_SI_MOD = {property:"size",0:2, 1:2, 2:1, 3:1, 4:1};
var WORLD_TECH_AT_MOD = {property:"atmos", 0:1, 1:1, 2:1, 3:1, 10:1, 11:1, 12:1, 13:1, 14:1, 15:1};
var WORLD_TECH_HY_MOD = {property:"hydro", 9:1, 10:2};
var WORLD_TECH_PO_MOD = {property:"popul", 1:1, 2:1, 3:1, 4:1, 5:1, 9:2, 10:4};
var WORLD_TECH_GV_MOD = {property:"gov", 0:1, 5:1, 13:-2};
var WORLD_TL_MODS = [WORLD_TECH_SP_MOD,WORLD_TECH_SI_MOD,WORLD_TECH_AT_MOD,WORLD_TECH_HY_MOD,WORLD_TECH_PO_MOD,WORLD_TECH_GV_MOD];

var STAR_SPECTRAL_CLASS_TABLE = {dice:function() { return dice(2); },min:1,max: 13, 1:"OB",2:"A",3:"A",4:"F",5:"F",6:"G",7:"G",8:"K",9:"K",10:"M",11:"M",12:"M",13:"BD",14:"BD",15:"BD" };
var STAR_CLASS_O_SIZE_TABLE = {dice:function() { return dice(2); },min:1,max:13, 1:"Ia",2:"Ia",3:"Ib,",4:"II",5:"III",6:"III",7:"III",8:"V",9:"V",10:"V",11:"IV",12:"D",13:"IV", 14:"IV", 15:"IV" };
var STAR_CLASS_B_SIZE_TABLE = {dice:function() { return dice(2); },min:1,max:13, 1:"Ia",2:"Ia",3:"Ib,",4:"II",5:"III",6:"III",7:"III",8:"III",9:"V",10:"V",11:"IV",12:"D",13:"D" };
var STAR_CLASS_A_SIZE_TABLE = {dice:function() { return dice(2); },min:1,max:13, 1:"Ia",2:"Ia",3:"Ib",4:"II",5:"III",6:"IV",7:"V",8:"V",9:"V",10:"V",11:"V",12:"D",13:"D" };
var STAR_CLASS_F_G_K_SIZE_TABLE = {dice: function() { return dice(2); },min:1,max:13, 1:"II",2:"II",3:"III",4:"IV",5:"V",6:"V",7:"V",8:"V",9:"V",10:"V",11:"VI",12:"D",13:"D" };
var STAR_CLASS_M_SIZE_TABLE = {dice:function() { return dice(2); },min:1,max:13,1:"II",2:"II",3:"II",4:"II",5:"III",6:"V",7:"V",8:"V",9:"V",10:"V",11:"VI",12:"D",13:"D" };


var TC_AS = {name:"Asteroid Belt", code:"As", rules:function(world) { return world.uwp.size == 0 && world.uwp.atmos == 0 && world.uwp.hydro == 0; }, mod:-3 };
var TC_DE = {name:"Desert", code:"De", rules:function(world) { return world.uwp.atmos > 1 && world.uwp.atmos < 10 && world.uwp.hydro == 0; }, mod:-2 };
var TC_FL = {name:"Fluid Oceans", code:"Fl", rules:function(world) { return world.uwp.atmos > 9 && world.uwp.atmos < 13 && world.uwp.hydro > 0; }, mod:-3 };
var TC_GA = {name:"Garden World", code:"Ga", rules:function(world) { return world.uwp.size > 5 && world.uwp.size < 9 && (world.uwp.atmos == 5 || world.uwp.atmos == 6 || world.uwp.atmos == 8) && world.uwp.hydro > 4 && world.uwp.hydro < 8; }, mod:2 };
var TC_HE = {name:"Hell World", code:"He", rules:function(world) { return world.uwp.size > 2 && world.uwp.size < 13 && (world.uwp.atmos == 2 || world.uwp.atmos == 4 || world.uwp.atmos == 7 || world.uwp.atmos == 9 || world.uwp.atmos == 10 || world.uwp.atmos == 11 || world.uwp.atmos == 12) && world.uwp.hydro < 3; }, mod:-2};
var TC_IC = {name:"Ice capped", code:"Ic", rules:function(world) { return world.uwp.atmos < 2 && world.uwp.hydro > 0 }, mod:-2 };
var TC_OC = {name:"Ocean World", code:"Oc", rules:function(world) { return world.uwp.size > 9 && ((world.uwp.atmos > 3 && world.uwp.atmos < 10) || world.uwp.atmos > 12) && world.uwp.hydro == 10; }, mod:-1 };
var TC_VA = {name:"Vacuum World", code:"Va", rules:function(world) { return world.uwp.size > 0 && world.uwp.atmos == 0; }, mod:-3 };
var TC_WA = {name:"Water World", code:"Wa", rules:function(world) { return world.uwp.size > 2 && world.uwp.size < 10 && ((world.uwp.atmos > 3 && world.uwp.atmos < 10) || world.uwp.atmos > 12) && world.uwp.hydro == 10; }, mod:-1 };
var TC_DI = {name:"Dieback", code:"Di", rules:function(world) { return world.uwp.popul == 0 && world.uwp.gov == 0 && world.uwp.law == 0 && world.uwp.TL > 0; }, mod:0 };
var TC_BA = {name:"Barren", code:"Ba",  rules:function(world) { return world.uwp.popul == 0 && world.uwp.gov == 0 && world.uwp.law == 0 && world.uwp.TL == 0; }, mod:0 };
var TC_LO = {name:"Low Population", code:"Lo", rules:function(world) { return world.uwp.popul < 4 && world.uwp.popul > 0; }, mod:-1 };
var TC_NI = {name:"Non Industrial", code:"Ni", rules:function(world) { return world.uwp.popul > 3 && world.uwp.popul < 7; }, mod:-1 };
var TC_PH = {name:"Pre High Population", code:"Ph", rules:function(world) { return world.uwp.popul == 8; }, mod:-1 };
var TC_HI = {name:"High Population", code:"Hi", rules:function(world) { return world.uwp.popul > 8; }, mod:-1 };
var TC_PA = {name:"Pre-Agricultural", code:"Pa", rules:function(world) { return world.uwp.atmos > 3 && world.uwp.atmos < 10 && world.uwp.hydro > 3 && world.uwp.hydro < 9 && (world.uwp.popul == 4 || world.uwp.popul == 8); }, mod:1 };
var TC_AG = {name:"Agricultural", code:"Ag", rules:function(world) { return world.uwp.atmos > 3 && world.uwp.atmos < 10 && world.uwp.hydro > 3 && world.uwp.hydro < 9 && world.uwp.popul > 4 && world.uwp.popul < 8; }, mod:2 };
var TC_NA = {name:"Non-Agricultural", code:"Na", rules:function(world) { return world.uwp.atmos < 4 && world.uwp.hydro < 4 && world.uwp.popul > 5}, mod:-2 };
var TC_PX = {name:"Prison or Exile Camp", code:"Px", rules:function(world) { return world.isMainWorld && (world.uwp.atmos == 2 || world.uwp.atmos == 3 || world.uwp.atmos == 10 || world.uwp.atmos == 11) && world.uwp.hydro > 0 && world.uwp.hydro < 6 && world.uwp.popul > 2 && world.uwp.popul < 7 && world.uwp.law > 5 && world.uwp.law < 10; }, mod:0 };
var TC_PI = {name:"Pre-Industrial", code:"Pi", rules:function(world) { return (world.uwp.atmos == 0 || world.uwp.atmos == 1 || world.uwp.atmos == 2 || world.uwp.atmos == 4 || world.uwp.atmos == 7 || world.uwp.atmos == 9) && (world.uwp.popul == 7 || world.uwp.popul == 8); }, mod:-1 };
var TC_IN = {name:"Industrial", code:"In", rules:function(world) { return (world.uwp.atmos == 0 || world.uwp.atmos == 1 || world.uwp.atmos == 2 || world.uwp.atmos == 4 || world.uwp.atmos == 7 || (world.uwp.atmos > 8  && world.uwp.atmos < 13)) && world.uwp.popul > 8; }, mod:-1 };
var TC_PO = {name:"Poor", code:"Po", rules:function(world) { return world.uwp.atmos > 1 && world.uwp.atmos < 6 && world.uwp.hydro < 4; }, mod:-2 };
var TC_PR = {name:"Pre-Rich", code:"Pr", rules:function(world) { return (world.uwp.atmos == 6 || world.uwp.atmos == 8) && (world.uwp.popul == 5 || world.uwp.popul == 9); }, mod:1 };
var TC_RI = {name:"Rich", code:"Ri", rules:function(world) { return (world.uwp.atmos == 6 || world.uwp.atmos == 8) && (world.uwp.popul > 5 && world.uwp.popul < 9); }, mod:2 };
var TC_FR = {name:"Frozen", code:"Fr", rules:function(world) { return world.zone == "O" && world.uwp.size > 1 && world.uwp.size < 10 && world.uwp.hydro > 0; }, mod:-1 };
var TC_HO = {name:"Hot", code:"Ho", rules:function(world) { return world.hz_rel == -1; }, mod:0 };
var TC_CO = {name:"Cold", code:"Co", rules:function(world) { return world.hz_rel == 1; }, mod:0 };
var TC_TR = {name:"Tropic", code:"Tr", rules:function(world) { return world.hz_rel == -1 && world.uwp.size > 5 && world.uwp.size < 10 && world.uwp.atmos > 3 && world.uwp.atmos < 10 && world.uwp.hydro > 2 && world.uwp.hydro < 8; }, mod:0 };
var TC_TU = {name:"Tundra", code:"Tu", rules:function(world) { return world.hz_rel == 1 && world.uwp.size > 5 && world.uwp.size < 10 && world.uwp.atmos > 3 && world.uwp.atmos < 10 && world.uwp.hydro > 2 && world.uwp.hydro < 8; }, mod:0 };
var TC_TZ = {name:"Twilight Zone", code:"Tz", rules:function(world) { return (world.systemOrbit == 0 || world.systemOrbit == 1) && world.uwp.size > 0; }, mod:-1 };
var TC_FA = {name:"Farming", code:"Fa", rules:function(world) { return !world.isMainWorld && world.uwp.atmos > 3 && world.uwp.atmos < 10 && world.uwp.hydro > 3 && world.uwp.hydro < 9 && world.uwp.popul > 1 && world.uwp.popul < 7 && world.zone == "H"; }, mod:1 };
var TC_MI = {name:"Mining", code:"Mi", rules:function(world) { return world.uwp.popul > 1 && world.uwp.popul < 7 && !world.isMainWorld && world.mainWorld.tcs.has("In"); }, mod:0 };
var TC_MR = {name:"Military Rule", code:"Mr", rules:function(world) {return false}, mod:0 };
var TC_PE = {name:"Penal Colony", code:"Pe", rules:function(world) { return !world.isMainWorld && (world.uwp.atmos ==2 || world.uwp.atmos ==3 || world.uwp.atmos == 10 || world.uwp.atmos == 11) && world.uwp.hydro > 0 && world.uwp.hydro < 6 && world.uwp.popul > 2 && world.uwp.popul < 7 && world.uwp.gov == 6 && world.uwp.law > 5 && world.uwp.law < 10; }, mod:0 };
var TC_RE = {name:"Reserve", code:"Re", rules:function(world) { return world.uwp.popul > 0 && world.uwp.popul < 5 && world.uwp.gov == 6 && (world.uwp.law ==4 || world.uwp.law ==5); }, mod:0 };
var TC_CY = {name:"Colony", code:"Cy", rules:function(world) { return world.uwp.popul > 4 && world.uwp.popul < 11 && world.uwp.gov == 6 && world.uwp.law < 4; }, mod:0 };
var TC_SA = {name:"Satellite", code:"Sa", rules:function(world) {return world.isSatellite}, mod:0 };
var TC_LK = {name:"Locked", code:"Lk", rules:function(world) {return world.isSatellite && (world.orbit && world.orbit.baseOrbit.m < 70)}, mod:0 };
var TC_PZ = {name:"Puzzle", code:"Pz", rules:function(world) { return world.travelZone == "A" && world.uwp.popul > 6; }, mod:0 };
var TC_DA = {name:"Dangerous", code:"Da", rules:function(world) { return world.travelZone == "A" && world.uwp.popul < 7; }, mod:0 };
var TC_FO = {name:"Forbidden", code:"Fo", rules:function(world) { return world.travelZone == "R"; }, mod:0 };

var ALL_TC = [ TC_AS,TC_DE,TC_FL,TC_GA,TC_HE,TC_IC,TC_OC,TC_VA,TC_WA,TC_DI,TC_BA,TC_LO,TC_NI,TC_PH,TC_HI,TC_PA,TC_AG,TC_NA,TC_PX,TC_PI,TC_IN,TC_PO,TC_PR,TC_RI,TC_FR,TC_HO,TC_CO,TC_TR,TC_TU,TC_TZ,TC_FA,TC_MI,TC_MR,TC_PE,TC_RE,TC_CY,TC_PZ,TC_DA,TC_FO,TC_SA,TC_LK];

var ALL_NIL = 	[ 
					{name:"Extinct Natives",natives:false,description:"Intelligent Life evolved here, but now extinct.",rules:function(world) { return world.uwp.popul == 0 && ((world.uwp.atmos >= 2 && world.uwp.atmos <= 9) || (world.uwp.atmos>=13 && world.uwp.atmos <=15)) && world.uwp.TL == 0; } },
					{name:"Extinct Exotic Natives",natives:false,description:"Exotic Intelligent Life evolved here, but now extinct.",rules:function(world) { return world.uwp.popul == 0 && world.uwp.atmos >= 10 && world.uwp.atmos <= 12 && world.uwp.TL == 0; } },
					{name:"Catastrophic Extinct Natives",natives:false,description:"Evidence of Extinct Natives remains.",rules:function(world) { return world.uwp.popul == 0 && ((world.uwp.atmos >= 2 && world.uwp.atmos <= 9) || (world.uwp.atmos>=13 && world.uwp.atmos <=15)) && world.uwp.TL > 0 } },
					{name:"Catastrophic Extinct Exotic Natives",natives:false,description:"Evidence of Exotic Extinct Natives remains.",rules:function(world) { return world.uwp.popul == 0 && world.uwp.atmos >= 10 && world.uwp.atmos <= 12 && world.uwp.TL > 0; } },
					{name:"Transients",natives:false,description:"Temporary commercial or scientific activity.",rules:function(world) { return world.uwp.popul >= 1 && world.uwp.popul <= 3 && world.uwp.TL > 0; } },
					{name:"Settlers",natives:false,description:"The initial steps of creating a colony.",rules:function(world) { return world.uwp.popul >= 4 && world.uwp.popul <= 6 && world.uwp.TL > 0; } },
					{name:"Transplants",natives:false,description:"Current locals evolved elsewhere.",rules:function(world) { return (world.uwp.popul >= 7 && (world.uwp.atmos == 0 || world.uwp.atmos == 1) && world.uwp.TL > 0); } },
					{name:"Vanished Transplants",natives:false,description:"Evidence of locals who evolved elsewhere now vanished.",rules:function(world) { return world.uwp.popul == 0 && (world.uwp.atmos == 0 || world.uwp.atmos == 1) && world.uwp.TL > 0; } },
					{name:"Exotic Natives",natives:true,description:"Intelligent life evolved on this world in an environment incompatible with humans.",rules:function(world) { return world.uwp.popul >= 7 && world.uwp.atmos >= 10 && world.uwp.atmos <= 12 && world.uwp.TL > 0 } },
					{name:"Natives",natives:true,description:"Intelligent life evolved on this world.",rules:function(world) { return world.uwp.popul >= 7 && ((world.uwp.atmos >= 2 && world.uwp.atmos <= 9) || (world.uwp.atmos>=13 && world.uwp.atmos <=15)) && world.uwp.TL > 0  } },
					{name:"Established Transplants",natives:false,description:"Transplants from elsewhere established themselves in an adaptable local environment.", rules:function(world) { return world.uwp.popul >= 7 && ((world.uwp.atmos >= 2 && world.uwp.atmos <= 9) || (world.uwp.atmos>=13 && world.uwp.atmos <=15)) && world.uwp.TL > 0 && !world.nativeLife(); } },
					{name:"Established Exotic Transplants",natives:false,description:"Exotic Transplants from elsewhere established themselves in an adaptable local environment.", rules:function(world) { return world.uwp.popul >= 7 && world.uwp.atmos >= 10 && world.uwp.atmos <= 12 && world.uwp.TL > 0 && !world.nativeLife(); } },
					{name:"No sign of intelligent life",natives:false,description:"It seems there was never any intelligent life, transplanted or native.",rules:function(world) { return world.uwp.popul == 0 && (world.uwp.atmos == 0 || world.uwp.atmos == 1) && world.uwp.TL == 0; } }
				];

var MAIN_WORLD_ORBIT_TABLE = {dice: function() { return dice(2); }, min:1, max:13, mods:[], 1:-2, 2:-1, 3:-1, 4:-1, 5:0, 6:0, 7:0, 8:0, 9:0, 10:1, 11:1, 12:1, 13:1 };
var MAIN_WORLD_SATELLITE_TABLE = {dice: function() { return dice(2); }, min:2, max:12, mods:[], 2:"Sa", 3:"Sa", 4:"Lk", 5:"", 6:"", 7:"", 8:"", 9:"", 10:"", 11:"", 12:"" };
var GAS_GIANT_SMALL_PLACE_TABLE = {dice: function() { return dice(2) }, min: 1, max:12, mods:[], 1:-3, 2:-2, 3:-1, 4:0, 5:1, 6:2, 7:3, 8:4, 9:5, 10:6, 11:7, 12:8 };
var GAS_GIANT_LARGE_PLACE_TABLE = {dice: function() { return dice(2) }, min: 1, max:12, mods:[], 1:-4, 2:-3, 3:-2, 4:-1, 5:0, 6:1, 7:2, 8:3, 9:4, 10:5, 11:6, 12:7 };
var GAS_GIANT_ICE_PLACE_TABLE = {dice: function() { return dice(2) }, min: 1, max:12, mods:[], 1:0, 2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:7, 9:8, 10:9, 11:10, 12:11 };
var BELT_PLACE_TABLE = {dice: function() { return dice(2) }, min: 1, max:12, mods:[], 1:-2, 2:-1, 3:0, 4:1, 5:2, 6:3, 7:4, 8:5, 9:6, 10:7, 11:8, 12:9 };
var WORLD1_PLACE_TABLE = { dice: function() { return dice(2) }, min: 1, max:12, mods:[], 1:11, 2:10, 3:8, 4:6, 5:4, 6:2, 7:0, 8:1, 9:3, 10:5, 11:7, 12:9 };
var WORLD2_PLACE_TABLE = { dice: function() { return dice(2) }, min: 1, max:12, mods:[], 1:18, 2:17, 3:16, 4:15, 5:14, 6:13, 7:12, 8:11, 9:10, 10:9, 11:8, 12:7 };

var WORLD_TYPE_INNER_PLANET = {dice: function() { return dice(1) }, min: 1, max:6, mods:[], 1:worldletUWP, 2:infernoWorldUWP, 3:innerWorldUWP, 4: bigWorldUWP, 5:stormWorldUWP, 6:radWorldUWP };
var WORLD_TYPE_HZ_PLANET = {dice: function() { return dice(1) }, min: 1, max:6, mods:[], 1:worldletUWP, 2:infernoWorldUWP, 3:habitableZoneUWP, 4: bigWorldUWP, 5:stormWorldUWP, 6:radWorldUWP };
var WORLD_TYPE_OUTER_PLANET = {dice: function() { return dice(1) }, min: 1, max:6, mods:[], 1:worldletUWP, 2:iceWorldUWP, 3:iceWorldUWP, 4: bigWorldUWP, 5:iceWorldUWP, 6:radWorldUWP };
var WORLD_TYPE_INNER_SATELLITE = {dice: function() { return dice(1) }, min: 1, max:6, mods:[], 1:worldletUWP, 2:infernoWorldUWP, 3:innerWorldUWP, 4: bigWorldUWP, 5:stormWorldUWP, 6:radWorldUWP, 7:bigWorldUWP };
var WORLD_TYPE_HZ_SATELLITE = {dice: function() { return dice(1) }, min: 1, max:6, mods:[], 1:worldletUWP, 2:infernoWorldUWP, 3:habitableZoneUWP, 4: bigWorldUWP, 5:stormWorldUWP, 6:radWorldUWP, 7:bigWorldUWP };
var WORLD_TYPE_OUTER_SATELLITE = {dice: function() { return dice(1) }, min: 1, max:6, mods:[], 1:worldletUWP, 2:iceWorldUWP, 3:iceWorldUWP, 4: bigWorldUWP, 5:iceWorldUWP, 6:radWorldUWP, 7:bigWorldUWP };

var WORLD_DENSITY_TYPE_SI_MOD = {property:"size", 0:1, 1:1, 2:1, 3:1, 4:1, 5:0, 6:-2, 7:-2, 8:-2, 9:-2, 10:-2, 11:-2, 12:-2, 13:-2, 14:-2, 15:-2, 16:-2, 17:-2, 18:-2, 19:-2, 20:-2};
var WORLD_DENSITY_TYPE_AT_MOD = {property:"atmos", 0:1, 1:1, 2:1, 3:1, 4:0, 5:0, 6:-2, 7:-2, 8:-2, 9:-2, 10:-2, 11:-2, 12:-2, 13:-2, 14:-2, 15:-2};
var WORLD_DENSITY_TYPE_ZONE_MOD = {property:"zone", I:0, H:0, O:6};
var WORLD_DENSITY_HEAVY_CORE_TABLE = {name:"Heavy Core", dice: function() { return dice(3) }, min: 3, max: 18, mods:[], 3:1.1, 4:1.15, 5:1.2, 6:1.25, 7:1.3, 8:1.35, 9:1.4, 10:1.45, 11:1.5, 12:1.55, 13:1.6, 14:1.7, 15:1.8, 16:1.9, 17:2.0, 18:2.25};
var WORLD_DENSITY_MOLTEN_CORE_TABLE = {name:"Molten Core", dice: function() { return dice(3) }, min: 3, max: 18, mods:[], 3:0.82, 4:0.84, 5:0.86, 6:0.88, 7:0.90, 8:0.92, 9:0.94, 10:0.96, 11:0.98, 12:1.0, 13:1.02, 14:1.04, 15:1.06, 16:1.08, 17:1.10, 18:1.12};
var WORLD_DENSITY_ROCKY_BODY_TABLE = {name:"Rocky Body", dice: function() { return dice(3) }, min: 3, max: 18, mods:[], 3:0.50, 4:0.52, 5:0.54, 6:0.56, 7:0.58, 8:0.60, 9:0.62, 10:0.64, 11:0.66, 12:0.68, 13:0.70, 14:0.72, 15:0.74, 16:0.76, 17:0.78, 18:0.80};
var WORLD_DENSITY_ICY_BODY_TABLE = {name:"Icy Body", dice: function() { return dice(3) }, min: 3, max: 18, mods:[], 3:0.18, 4:0.20, 5:0.22, 6:0.24, 7:0.26, 8:0.28, 9:0.30, 10:0.32, 11:0.34, 12:0.36, 13:0.38, 14:0.40, 15:0.42, 16:0.44, 17:0.46, 18:0.48};
var WORLD_DENSITY_GAS_GIANT = {name:"Gas Giant", dice: function() { return dice(3) }, min:3, max:18, mods:[], 3:0.1, 4:0.11, 5:0.12, 6:0.13, 7:0.14, 8:0.16, 9:0.18, 10:0.2, 11:0.22, 12:0.23, 13:0.24, 14:0.26, 15:0.27, 16:0.28, 17:0.29, 18:0.30}
var WORLD_DENSITY_TYPE_TABLE = {dice: function() { return dice(2) }, min: 1, max: 15, mods: [WORLD_DENSITY_TYPE_SI_MOD, WORLD_DENSITY_TYPE_AT_MOD], 1:WORLD_DENSITY_HEAVY_CORE_TABLE, 2:WORLD_DENSITY_MOLTEN_CORE_TABLE, 3:WORLD_DENSITY_MOLTEN_CORE_TABLE, 4:WORLD_DENSITY_MOLTEN_CORE_TABLE, 5:WORLD_DENSITY_MOLTEN_CORE_TABLE, 6:WORLD_DENSITY_MOLTEN_CORE_TABLE, 7:WORLD_DENSITY_MOLTEN_CORE_TABLE, 8:WORLD_DENSITY_MOLTEN_CORE_TABLE, 9:WORLD_DENSITY_MOLTEN_CORE_TABLE, 10:WORLD_DENSITY_MOLTEN_CORE_TABLE, 11:WORLD_DENSITY_ROCKY_BODY_TABLE, 12:WORLD_DENSITY_ROCKY_BODY_TABLE, 13:WORLD_DENSITY_ROCKY_BODY_TABLE, 14:WORLD_DENSITY_ROCKY_BODY_TABLE, 15:WORLD_DENSITY_ICY_BODY_TABLE};
var WORLD_DENSITY_TYPES_ALL = [WORLD_DENSITY_HEAVY_CORE_TABLE,WORLD_DENSITY_MOLTEN_CORE_TABLE,WORLD_DENSITY_ROCKY_BODY_TABLE,WORLD_DENSITY_ICY_BODY_TABLE,WORLD_DENSITY_GAS_GIANT];


var GREENHOUSE = {0:1,1:1,2:1,3:1,4:1.05,5:1.05,6:1.1,7:1.1,8:1.15,9:1.15,10:1,11:1,12:1,13:1.15,14:1.1,15:1};
var GH_ATM_10 = {dice: function() { return dice(2); }, min:2, max:12, mods:[], 2:1.2, 3:1.2, 4:1.3, 5:1.3, 6:1.4, 7:1.4, 8:1.5, 9:1.5, 10:1.6, 11:1.6, 12:1.7};
var GH_ATM_11 = {dice: function() { return dice(2); }, min:2, max:12, mods:[], 2:1.2, 3:1.3, 4:1.4, 5:1.5, 6:1.6, 7:1.7, 8:1.8, 9:1.9, 10:2, 11:2.1, 12:2.2};

var EXTREME_AXIAL_TILT_TABLE = {dice: function() { return dice(1); }, min:1, max:6, mods:[], 1:function(){return 50+dice(2)-2}, 2:function(){return 50+dice(2)-2}, 3:function(){return 60+dice(2)-2}, 4:function(){return 70+dice(2)-2}, 5:function(){return 80+dice(2)-2}, 6:function() { return 90; } }
var AXIAL_TILT_TABLE = {dice: function() { return dice(2); }, min:2, max:12, mods:[], 2:function(){return dice(2)-2}, 3:function(){return dice(2)-2}, 4:function(){return 10+dice(2)-2}, 5:function(){return 10+dice(2)-2}, 6:function(){return 20+dice(2)-2}, 7:function(){return 20+dice(2)-2}, 8:function(){return 30+dice(2)-2}, 9:function(){return 30+dice(2)-2}, 10:function(){return 40+dice(2)-2}, 11:function(){return 40+dice(2)-2}, 12:EXTREME_AXIAL_TILT_TABLE}

var ORBIT_ECCENTRICITY_TABLE = {dice: function() {return dice(2); }, min:2, max:12, mods:[], 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0.005, 9:0.01, 10:0.015, 11:0.020, 12:ORBIT_ECCENTRICITY_TABLE_EXTREME};
var ORBIT_ECCENTRICITY_TABLE_EXTREME = {dice: function() { return dice(1); }, min:1, max:6, mods:[], 1:0.025, 2:0.05, 3:0.1, 4:0.2, 5:0.25, 6:0.40};

var ROTATION_PERIOD_EXTREME_TABLE = {dice: function() { return dice(2); }, min:2, max:12, mods:[], 2:function(){ return dice(1)*-240; }, 3:function(){ return dice(1)*480; }, 4:function(){ return dice(1)*240; }, 5:function(){ return false; }, 6:function(){ return false; }, 7:function(){ return false; }, 8:function(){ return false; }, 9:function(){ return false; }, 10:function(){ return dice(1)*240; }, 11:function(){ return dice(1)*1200; }, 12:function(){ return dice(1)*-1200; }};

var ATM_PRESSURE_VACC = { name:"Vaccuum", day_plus:1, night_minus:-20, day_abs:0.1, night_abs:0.8, dice:function() { return 1;}, min:1, max:1, mods:[], 1:0};
var ATM_PRESSURE_TRACE = { name:"Trace", day_plus:0.9, night_minus:-15, day_abs:0.3, night_abs:0.7, dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:0.01, 3:0.05, 4:0.05, 5:0.06, 6:0.06, 7:0.07, 8:0.07, 9:0.07, 10:0.08, 11:0.08, 12:0.09};
var ATM_PRESSURE_VTHIN = { name:"Very Thin", day_plus:0.8, night_minus:-8, day_abs:0.8, night_abs:0.5, dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:0.10, 3:0.12, 4:0.14, 5:0.16, 6:0.18, 7:0.20, 8:0.23, 9:0.25, 10:0.30, 11:0.35, 12:0.40};
var ATM_PRESSURE_THIN = { name:"Thin", day_plus:0.6, night_minus:-3, day_abs:1.5, night_abs:0.3, dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:0.43, 3:0.45, 4:0.48, 5:0.5, 6:0.5, 7:0.5, 8:0.55, 9:0.6, 10:0.65, 11:0.7, 12:0.75};
var ATM_PRESSURE_STD = { name:"Standard", day_plus:0.5, night_minus:-1, day_abs:2.5, night_abs:0.15, dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:0.76, 3:0.8, 4:0.85, 5:0.90, 6:0.95, 7:1, 8:1, 9:1.1, 10:1.2, 11:1.3, 12:1.4};
var ATM_PRESSURE_DENSE = { name:"Dense", day_plus:0.4, night_minus:-0.5, day_abs:4, night_abs:0.1, dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:1.5, 3:1.6, 4:1.7, 5:1.8, 6:1.9, 7:2, 8:2, 9:2.2, 10:2.2, 11:2.4, 12:2.4};
var ATM_PRESSURE_VDENSE = { name:"Very Dense", day_plus:0.2, night_minus:-0.2, day_abs:5, night_abs:0.05, dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:2.5, 3:5, 4:10, 5:25, 6:50, 7:100, 8:150, 9:200, 10:250, 11:500, 12:750};
var ATM_PRESSURE_TABLE = [ ATM_PRESSURE_VACC, ATM_PRESSURE_TRACE, ATM_PRESSURE_VTHIN, ATM_PRESSURE_VTHIN, ATM_PRESSURE_THIN, ATM_PRESSURE_THIN, ATM_PRESSURE_STD, ATM_PRESSURE_STD, ATM_PRESSURE_DENSE, ATM_PRESSURE_DENSE ];

var ATM_COMPOSITION_TAINT = { dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:"Disease", 3:"Gas Mix", 4:"High Oxygen", 5:"Pollutants", 6:"Sulfur Compounds", 7:"Pollutants", 8:"Sulfur Compounds", 9:"Pollutants", 10:"Low Oxygen", 11:"Gas Mix", 12:"Disease"};
var EXOTIC_ATMOS_COMPOSITION = { dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:{pressure:ATM_PRESSURE_VTHIN, irritant:true}, 3:{pressure:ATM_PRESSURE_VTHIN, irritant:false}, 4:{pressure:ATM_PRESSURE_THIN, irritant:false}, 5:{pressure:ATM_PRESSURE_THIN, irritant:true}, 6:{pressure:ATM_PRESSURE_STD, irritant:false}, 7:{pressure:ATM_PRESSURE_STD, irritant:true}, 8:{pressure:ATM_PRESSURE_DENSE, irritant:false}, 9:{pressure:ATM_PRESSURE_DENSE, irritant:true}, 10:{pressure:ATM_PRESSURE_VDENSE, irritant:false}, 11:{pressure:ATM_PRESSURE_VDENSE, irritant:true}, 12:{pressure:null, irritant:null}}
var CORROSIVE_ATMOS_COMPOSITION = { dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:{pressure:ATM_PRESSURE_VTHIN, lowerTemp:-273, higherTemp:-100}, 3:{pressure:ATM_PRESSURE_VTHIN, lowerTemp:-100, higherTemp:-25}, 4:{pressure:ATM_PRESSURE_VTHIN, lowerTemp:-25, higherTemp:50}, 5:{pressure:ATM_PRESSURE_VTHIN, lowerTemp:50, higherTemp:100}, 6:{pressure:ATM_PRESSURE_STD, lowerTemp:-200, higherTemp:-25}, 7:{pressure:ATM_PRESSURE_STD, lowerTemp:-25, higherTemp:50}, 8:{pressure:ATM_PRESSURE_STD, lowerTemp:50, higherTemp:100}, 9:{pressure:ATM_PRESSURE_VDENSE, lowerTemp:-200, higherTemp:-25}, 10:{pressure:ATM_PRESSURE_VDENSE, lowerTemp:-25, higherTemp:50}, 11:{pressure:ATM_PRESSURE_VDENSE, lowerTemp:50, higherTemp:100}, 12:{pressure:ATM_PRESSURE_VDENSE, lowerTemp:100, higherTemp:2300}};
var INSIDIOUS_ATMOS_COMPOSITION = { dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:"Gas Mix", 3:"Gas Mix", 4:"Radiation", 5:"Temperature", 6:"Pressure", 7:"Gas Mix", 8:"Pressure", 9:"Temperature", 10:"Radiation", 11:"Gas Mix", 12:"Gas Mix"};
var INSIDIOUS_ATMOS_PRESSURE = { dice: function() { return dice(1); }, min:1, max:6, mods:[], 1:ATM_PRESSURE_VTHIN, 2:ATM_PRESSURE_THIN, 3:ATM_PRESSURE_STD, 4:ATM_PRESSURE_DENSE, 5:ATM_PRESSURE_VDENSE, 6:ATM_PRESSURE_VDENSE }; 

var LIQUID_H2O = {name:"Water",colour:"colorless",odor:"odorless",melts:273,boils:373,molecular_weight:18,inert:false,exotic:true,corrosive:false,insidious:false,notes:"Water is fundamental to life, is known as the universal solvent, and is a powerful greenhouse gas." };
var LIQUID_H2SO4 = { name:"Sulfuric Acid", colour:"colorless",odor:"odorless",melts:283,boils:610,molecular_weight:98,inert:false,exotic:false,corrosive:false,insidious:false,notes:"Sulfuric acid reacts with water to dehydrate substances and with most bases to produce sulfates.  It is highly dangerous and often in oceans in combination with water."};
var LIQUID_ALKANES = { name:"Ethane and other alkanes", colour:"colorless",odor:"odorless",melts:143,boils:309,molecular_weight:72,inert:false,exotic:false,corrosive:false,insidious:false,notes:"Ethane and heavier hydrocarbons can form as liquids in methane atmospheres or from decay of organic lifeforms." };
var LIQUID_HF = {name:"Hydrofluoric Acid", colour:"colorless",odor:"odorless",melts:189,boils:292,molecular_weight:20,inert:false,exotic:false,corrosive:30,insidious:300,notes:"Hydrofluoric Acid is produces lethal burns on skin although the burns do not show up straight away.  It is lethal to breathe as a gas in very small concentrations - as little as 30 ppm. It forms an acid in water that eats glass, ceramics and flesh and can be contained in plastic containers." };
var LIQUID_HCl = {name:"Hydrochloric Acid", colour:"colorless",odor:"odorless",melts:159,boils:188,molecular_weight:36,inert:false,exotic:false,corrosive:50,insidious:1200,notes:"Hydrochloric acid is found throughout nature - for example, in mammal stomachs.  It is a high reactive acid and eats at metals and dissolves flesh.  If breathed as a gas, it forms an acid immediatley on contact with bodily fluids." };
var LIQUID_HNO3 = {name:"Nitric Acid", colour:"colorless",odor:"odorless",melts:231,boils:356,molecular_weight:63,inert:false,exotic:false,corrosive:false,insidious:false,notes:"Nitric acid is highly corrosive but is subject to decomposition to Nitrous Dioxide.  It reacts corrosively with many metals and with flesh.  It is a precursor chemical to many explosives."};
var LIQUID_SCl2 = {name:"Sulfur Dichloride",colour:"red brown",odor:"pungent",melts:152,boils:332,molecular_weight:102.97,exotic:false,corrosive:300,insidious:1000,notes:"A variety of sulfur compounds can be found in various types of atmospheres, ranging from non-irritant to corrosive. These compounds can be found in atmospheres of otherwise perfectly Terran worlds, and indeed are one of the prime components of smog. Sulfur compounds in the atmosphere can result from prolonged heavy industrialization, or can occur naturally from heavy volcanic activity." };
var LIQUID_NH3 = {name:"Ammonia",colour:"colorless",odor:"sharp and pungent like concentrated urine",melts:196,boils:240,molecular_weight:17.031,exotic:true,corrosive:15000,insidious:false,notes:"Ammonia is an irritant gas.  In trace quantities mammals eliminate ammonia via urination.  But in small quantities - approximately 35 parts per million or more - it is toxic and eye protection must be worn.  It is lethal to humans if breathed even in small quantities, and the vapour from liquid ammonia leads to local concentrations of it.  However, its smell (detectable at 5 parts per million) alerts humans to its presence well before fatal levels." };

var LIQUID_ALL = [LIQUID_H2O, LIQUID_H2SO4, LIQUID_ALKANES, LIQUID_HF, LIQUID_HCl, LIQUID_HNO3, LIQUID_SCl2, LIQUID_NH3];

var GAS_He = {name:"Helium",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:true,melts:1,boils:5,molecular_weight:4.02,exotic:true,corrosive:false,insidious:false,notes:"Helium is a very light but inert gas.  It is not toxic, but of course is asphyxiating." };
var GAS_H = {name:"Hydrogen",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:false,melts:14,boils:21,molecular_weight:2.016,exotic:false,corrosive:false,insidious:1000,notes:"Not corrosive or toxic, but seeping can cause explosions" };
var GAS_Ne = {name:"Neon",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:true,melts:25,boils:27,molecular_weight:20.179,exotic:true,corrosive:false,insidious:false,notes:"Neon is an inert gas.  It is not toxic, but of course is asphyxiating." };
var GAS_Kr = {name:"Krypton",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:true,melts:22,boils:29,molecular_weight:83.8,exotic:true,corrosive:false,insidious:false,notes:"Krypton is an inert gas.  It is not toxic, but of course is asphyxiating." };
var GAS_N = {name:"Nitrogen",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:true,melts:63,boils:78,molecular_weight:28.0012,exotic:true,corrosive:false,insidious:false,notes:"" };
var GAS_CO = {name:"Carbon Monoxide",assoc_liquid:LIQUID_ALKANES,colour:"colorless",odor:"odorless",inert:false,melts:68,boils:82,molecular_weight:28.011,exotic:true,corrosive:false,insidious:false,notes:"Carbon monoxide is asphyxiating at very low concentrations (35 ppm at 1 Atmosphere pressure), but does not produce corrosion." };
var GAS_F = {name:"Fluorine",assoc_liquid:LIQUID_HF,colour:"yellow",odor:"sharp, pungent, burning",inert:false,melts:53,boils:85,molecular_weight:37.996,exotic:false,corrosive:10,insidious:100,notes:"A corrosive gas, fluorine is similiar in nature to chlorine. Atmospheres containing fluorine are considered corrosive at best. Fluorine shares many properties with chlorine, including the possiblility of supporting completely alien forms of life. It is easily detected by smell and color, but can be quickly lethal if a significant leak occurs.  The presence of free fluorine in the atmosphere indicates a lack of metals in the crust that would otherwise form salts." };
var GAS_Ar = {name:"Argon",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:true,melts:84,boils:88,molecular_weight:39.948,exotic:true,corrosive:false,insidious:false,notes:"Argon is an inert gas.  It is not toxic, but of course is asphyxiating." };
var GAS_O2 = {name:"Oxygen",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:false,melts:55,boils:91,molecular_weight:31.998,exotic:false,corrosive:false,insidious:false,notes:"" };
var GAS_CH4 = {name:"Methane",assoc_liquid:LIQUID_ALKANES,colour:"colorless",odor:"odorless",inert:false,melts:91,boils:109,molecular_weight:16.044,exotic:true,corrosive:false,insidious:false,notes:"A non-irritant gas, methane is quite dangerous if mixed at a low (7-14%) concentration with a standard oxygen-nitrogen atmosphere.  Any spark can cause the methane to explode and burn fiercely. Leaks into habitats, space ships, or vacc suits are a serious hazard. Pure methane is an odorless, colorless gas, making detection almost impossible." };
var GAS_Xe = {name:"Xenon",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:true,melts:104,boils:111,molecular_weight:131.3,exotic:true,corrosive:false,insidious:false,notes:"Xenon is an inert gas.  It is not toxic, but of course is asphyxiating." };
var GAS_NO = {name:"Nitric Oxide",assoc_liquid:LIQUID_HNO3,colour:"colorless",odor:"sharp sweet smelling",inert:false,melts:109,boils:121,molecular_weight:30.006,exotic:false,corrosive:100,insidious:1000,notes:"Produced in standard oxygen-nitrogen atmosphere through lightning and unusual pressure and temperature conditions. forming nitrides (nitrogen-oxygen compounds) and nitric acid." };
var GAS_O3 = {name:"Ozone",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"pungent clean",inert:false,melts:81,boils:161,molecular_weight:47.998,exotic:false,corrosive:0.1,insidious:1,notes:"Produced in standard atmosphere through lightning" };
var GAS_N2O = {name:"Nitrous Oxide",assoc_liquid:LIQUID_HNO3,colour:"colorless",odor:"slight metallic",inert:false,melts:183,boils:185,molecular_weight:44.012,exotic:false,corrosive:100,insidious:1000,notes:"Produced in standard atmosphere through lightning" };
var GAS_CO2 = {name:"Carbon Dioxide",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"odorless",inert:true,melts:195,boils:195,molecular_weight:44.01,exotic:true,corrosive:false,insidious:false,notes:"May be corrosive or insidious based on pressure and temperature.  Carbon Dioxide has the property of trapping heat." };
var GAS_H2S = {name:"Hydrogen Sulfide",assoc_liquid:LIQUID_H2SO4,colour:"colorless",odor:"rotten egg",inert:false,melts:191,boils:213,molecular_weight:34.08,exotic:false,corrosive:300,insidious:1000,notes:"A variety of sulfur compounds can be found in various types of atmospheres, ranging from non-irritant to corrosive. These compounds can be found in atmospheres of otherwise perfectly Terran worlds, and indeed are one of the prime components of smog. Sulfur compounds in the atmosphere can result from prolonged heavy industrialization, or can occur naturally from heavy volcanic activity." };
var GAS_Cl = {name:"Chlorine",assoc_liquid:LIQUID_HCl,colour:"green",odor:"bleach or swimming pools",inert:false,melts:172,boils:239,molecular_weight:70.9,exotic:true,corrosive:100,insidious:1000,notes:"An irritant gas, chlorine is geeenish-yellow in color, and a deadly poison even in small concentrations, although it can be detected by odor long before it reaches a lethal level. It is far more dangerous to exposed skin than ammonia, and requires head-to-toe protective clothing. An atmosphere with chlorine is corrosive in all but the smallest concentrations. A world with a significant amount of chlorine in its atmosphere would have a mysterious and eerie environment, with the shifting yellow-green haze causing the landscape to waver in a murky green half-light, hiding and distorting objects and shapes.  The presence of free chlorine in the atmosphere indicates a lack of metals in the crust that would otherwise form salts." };
var GAS_SO2 = {name:"Sulfur Dioxide",assoc_liquid:LIQUID_H2SO4,colour:"colorless",odor:"just struck match",inert:false,melts:201,boils:263,molecular_weight:64.066,exotic:false,corrosive:0.075,insidious:1000,notes:"A variety of sulfur compounds can be found in various types of atmospheres, ranging from non-irritant to corrosive. These compounds can be found in atmospheres of otherwise perfectly Terran worlds, and indeed are one of the prime components of smog. Sulfur compounds in the atmosphere can result from prolonged heavy industrialization, or can occur naturally from heavy volcanic activity." };
var GAS_SCl2 = {name:"Sulfur Dichloride",assoc_liquid:LIQUID_SCl2,colour:"red brown",odor:"pungent",inert:false,melts:152,boils:332,molecular_weight:102.97,exotic:false,corrosive:300,insidious:1000,notes:"A variety of sulfur compounds can be found in various types of atmospheres, ranging from non-irritant to corrosive. These compounds can be found in atmospheres of otherwise perfectly Terran worlds, and indeed are one of the prime components of smog. Sulfur compounds in the atmosphere can result from prolonged heavy industrialization, or can occur naturally from heavy volcanic activity." };
var GAS_NH3 = {name:"Ammonia",assoc_liquid:LIQUID_NH3,colour:"colorless",odor:"sharp and pungent like concentrated urine",inert:false,melts:196,boils:240,molecular_weight:17.031,exotic:true,corrosive:15000,insidious:false,notes:"Ammonia is an irritant gas.  In trace quantities mammals eliminate ammonia via urination.  But in small quantities - approximately 35 parts per million or more - it is toxic and eye protection must be worn.  It is lethal to humans if breathed even in small quantities, and the vapour from liquid ammonia leads to local concentrations of it.  However, its smell (detectable at 5 parts per million) alerts humans to its presence well before fatal levels." };
var GAS_CF4 = {name:"Tetrafluoromethane",assoc_liquid:LIQUID_HF,colour:"colorless",odor:"odorless",inert:true,melts:90,boils:146,molecular_weight:88,exotic:true,corrosive:false,insidious:false,notes:"A potent greenhouse gas but is otherwise very stable." };
var GAS_NO2 = {name:"Nitrogen Dioxide",assoc_liquid:LIQUID_HNO3,colour:"Reddish-brown",odor:"sharp and biting",inert:false,melts:262,boils:294,molecular_weight:46,exotic:true,corrosive:100,insidious:40000,notes:"A common pollutant caused by burning anything in a nitrogen-oxygen atmosphere or by lightning."  };
var GAS_HCN = {name:"Hydrogen Cyanide",assoc_liquid:LIQUID_H2O,colour:"colorless",odor:"bitter almond",inert:false,melts:259,boils:298,molecular_weight:27,exotic:true,corrosive:false,insidious:false,notes:"Highly toxic if inhaled in quantities of 270 ppm at one atmosphere pressure." };

var GAS_ALL = [GAS_He, GAS_H, GAS_Ne, GAS_Kr, GAS_N, GAS_CO, GAS_F, GAS_Ar, GAS_O2, GAS_CH4, GAS_Xe, GAS_NO, GAS_O3, GAS_N2O, GAS_CO2, GAS_H2S, GAS_Cl, GAS_SO2, GAS_SCl2, GAS_CF4, GAS_NH3, GAS_NO2, GAS_HCN];

var GAS_MIXES = [[GAS_CO2],[GAS_CO2,GAS_SO2],[GAS_CH4,GAS_NH3,GAS_H],[GAS_Cl,GAS_N],[GAS_F,GAS_CO2],[GAS_F,GAS_SCl2,GAS_SO2,GAS_H2S],[GAS_H],[GAS_CO2,GAS_N],[GAS_CH4,GAS_NH3],[GAS_Cl,GAS_CO2],[GAS_Cl,GAS_SCl2],[GAS_F,GAS_N]];

var LIQUID_H2O = {name:"Water",colour:"colorless",odor:"odorless",melts:273,boils:373,molecular_weight:18,inert:false,exotic:true,corrosive:false,insidious:false,notes:"Water is fundamental to life, is known as the universal solvent, and is a powerful greenhouse gas." };
var LIQUID_NH3 = GAS_NH3;
var LIQUID_SCl2 = GAS_SCl2;
var LIQUID_H2SO4 = { name:"Sulfuric Acid", colour:"colorless",odor:"odorless",melts:283,boils:610,molecular_weight:98,inert:false,exotic:false,corrosive:false,insidious:false,notes:"Sulfuric acid reacts with water to dehydrate substances and with most bases to produce sulfates.  It is highly dangerous and often in oceans in combination with water."};
var LIQUID_NO2 = GAS_NO2;
var LIQUID_ALKANES = { name:"Ethane and other alkanes", colour:"colorless",odor:"odorless",melts:143,boils:309,molecular_weight:72,inert:false,exotic:false,corrosive:false,insidious:false,notes:"Ethane and heavier hydrocarbons can form as liquids in methane atmospheres or from decay of organic lifeforms." };
var LIQUID_HF = {name:"Hydrofluoric Acid", colour:"colorless",odor:"odorless",melts:189,boils:292,molecular_weight:20,inert:false,exotic:false,corrosive:30,insidious:300,notes:"Hydrofluoric Acid is produces lethal burns on skin although the burns do not show up straight away.  It is lethal to breathe as a gas in very small concentrations - as little as 30 ppm. It forms an acid in water that eats glass, ceramics and flesh and can be contained in plastic containers." };
var LIQUID_HCl = {name:"Hydrochloric Acid", colour:"colorless",odor:"odorless",melts:159,boils:188,molecular_weight:36,inert:false,exotic:false,corrosive:50,insidious:1200,notes:"Hydrochloric acid is found throughout nature - for example, in mammal stomachs.  It is a high reactive acid and eats at metals and dissolves flesh.  If breathed as a gas, it forms an acid immediatley on contact with bodily fluids." };
var LIQUID_HNO3 = {name:"Nitric Acid", colour:"colorless",odor:"odorless",melts:231,boils:356,molecular_weight:63,inert:false,exotic:false,corrosive:false,insidious:false,notes:"Nitric acid is highly corrosive but is subject to decomposition to Nitrous Dioxide.  It reacts corrosively with many metals and with flesh.  It is a precursor chemical to many explosives."};

var NATIVE_LIFE_AT_MOD = {property:"atmos", 0:-3,4:4,5:4,6:4,7:4,8:4,9:4,10:0,11:0,12:0,13:0,14:0,15:0};
var NATIVE_LIFE_HY_MOD = {property:"hydro", 0:-2,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:0,10:0};
var NATIVE_LIFE_TBL = { dice: function(){ return dice(2); }, min:2, max:12, mods:[NATIVE_LIFE_AT_MOD,NATIVE_LIFE_HY_MOD], 2:false, 3:false, 4:false, 5:false, 6:false, 7:false, 8:false, 9:false, 10:false, 11:false, 12:true};


var RESOURCES_ALL_old = [
{ name:"Natural Agricultural Resources", id:"agri_check", examples:"wood, meat, spices, fruit, grain",number:{molten:4,rocky:4,icy:-4,atmos_good:1,atmos_bad:-3,pop_low:0,pop_good:0,tl_low:1,tech_low_mid:0,tech_up_mid:-1,tech_hi:-2,life:5,no_life:0} },
{ name:"Natural Ore Resources", id:"ores_check", examples:"iron ore, copper ore, tin ore, silver ore, alumina", number:{molten:7,rocky:3,icy:0,atmos_good:0,atmos_bad:1,pop_low:0,pop_good:0,tl_low:1,tech_low_mid:0,tech_up_mid:-1,tech_hi:-2,life:0,no_life:0} },
{ name:"Natural Radioactive Resources", id:"radi_check", examples:"uranium ore, thorium ore, radium ore", number:{molten:5,rocky:3,icy:0,atmos_good:0,atmos_bad:1,pop_low:0,pop_good:0,tl_low:1,tech_low_mid:0,tech_up_mid:-1,tech_hi:-2,life:0,no_life:0} },
{ name:"Natural Gem and Crystal Resources", id:"gems_check", examples:"diamond, emerald, ruby, quartz, opals, granite, sapphire, amethyst", number:{molten:5,rocky:2,icy:0,atmos_good:0,atmos_bad:0,pop_low:0,pop_good:0,tl_low:1,tech_low_mid:0,tech_up_mid:-1,tech_hi:-2,life:5,no_life:0} },
{ name:"Natural Petrochemical Resources", id:"chem_check", examples:"natural gas, oil, coal", number:{molten:4,rocky:1,icy:-4,atmos_good:0,atmos_bad:-3,pop_low:0,pop_good:0,tl_low:1,tech_low_mid:0,tech_up_mid:-2,tech_hi:-2,life:5,no_life:-5} },
{ name:"Processed Agricultural Resources", id:"agripr_check", examples:"liquor, dairy products, canned fruit, frozen vegetables, prepared food and sauces, confectionary, beverages, smoking products", number:{molten:5,rocky:5,icy:0,atmos_good:5,atmos_bad:-5,pop_low:1,pop_good:2,tl_low:-1,tech_low_mid:0,tech_up_mid:1,tech_hi:1,life:5,no_life:0} },
{ name:"Processed Alloy Resources", id:"allo_check", examples:"steel, tungsten, iron, copper, bronze, brass, silver, aluminium",number:{molten:4,rocky:4,icy:-1,atmos_good:0,atmos_bad:-5,pop_low:-1,pop_good:1,tl_low:-2,tech_low_mid:-1,tech_up_mid:0,tech_hi:1,life:0,no_life:0} },
{ name:"Processed Agroproducts", id:"agro_check", examples:"textiles, polymers, pharmaceuticals",number:{molten:4,rocky:4,icy:-1,atmos_good:3,atmos_bad:-5,pop_low:0,pop_good:1,tl_low:-1,tech_low_mid:0,tech_up_mid:1,tech_hi:2,life:5,no_life:0} },
{ name:"Weapons", id:"weap_check", examples:"firearms, ammunition, blades, body armor",number:{molten:4,rocky:4,icy:-1,atmos_good:0,atmos_bad:0,pop_low:-1,pop_good:1,tl_low:0,tech_low_mid:1,tech_up_mid:3,tech_hi:5,life:0,no_life:0} },
{ name:"Mechanical Parts and Goods", id:"part_check", examples:"tools, vehicle parts, vacc suits, white goods",number:{molten:4,rocky:4,icy:-1,atmos_good:0,atmos_bad:0,pop_low:-1,pop_good:1,tl_low:0,tech_low_mid:1,tech_up_mid:2,tech_hi:3,life:0,no_life:0} },
{ name:"Heavy Equipment", id:"equi_check", examples:"aircraft, ATV, AFV, machine tools, farm machinery",number:{molten:4,rocky:4,icy:-1,atmos_good:0,atmos_bad:0,pop_low:-1,pop_good:2,tl_low:0,tech_low_mid:1,tech_up_mid:2,tech_hi:3,life:0,no_life:0} },
{ name:"Electronics", id:"elec_check", examples:"computers, electronic parts, cybernetic parts, computer parts, security systems, communicators",number:{molten:4,rocky:4,icy:-1,atmos_good:0,atmos_bad:0,pop_low:-1,pop_good:1,tl_low:-10,tech_low_mid:-10,tech_up_mid:2,tech_hi:4,life:0,no_life:0} },
{ name:"Gravitics", id:"grav_check", examples:"anti-grav modules, grav belts, gravitic communicators",number:{molten:4,rocky:4,icy:-1,atmos_good:0,atmos_bad:0,pop_low:-1,pop_good:1,tl_low:-10,tech_low_mid:-10,tech_up_mid:1,tech_hi:2,life:0,no_life:0} }
];

var RESOURCES_ALL = [
{ name:"Natural Agricultural Resources", id:"agri_check", examples:"wood, meat, spices, fruit, grain", rules:function(world) { return (world.tcs.has("Fa") || world.tcs.has("Ag") || world.tcs.has("Ri")) && world.tcs.has("Ni") && world.economicExt.infrastructure > 0 && world.economicExt.labour > 3 && world.densityType().name != "Icy Body"; } },
{ name:"Natural Ore Resources", id:"ores_check", examples:"iron ore, copper ore, tin ore, silver ore, alumina", rules:function(world) { return world.tcs.has("Ni") && world.economicExt.infrastructure > 0 && world.economicExt.labour > 3 && world.densityType().name != "Icy Body"; } },
{ name:"Natural Radioactive Resources", id:"radi_check", examples:"uranium ore, thorium ore, radium ore", rules:function(world) { return world.tcs.has("Ni") && world.economicExt.infrastructure > 5 && world.economicExt.labour > 4 && world.densityType().name != "Icy Body"; } },
{ name:"Natural Gem and Crystal Resources", id:"gems_check", examples:"diamond, emerald, ruby, quartz, opals, granite, sapphire, amethyst", rules:function(world) { return world.tcs.has("Ni") && world.economicExt.infrastructure > 0 && world.economicExt.labour > 3 && world.densityType().name != "Icy Body"; } },
{ name:"Natural Petrochemical Resources", id:"chem_check", examples:"natural gas, oil, coal", rules:function(world) { return world.tcs.has("Ni") && world.economicExt.infrastructure > 4 && world.economicExt.labour > 3 && world.densityType.name != "Icy Body" && world.nativeLife(); } },
{ name:"Processed Agricultural Resources", id:"agripr_check", examples:"liquor, dairy products, canned fruit, frozen vegetables, prepared food and sauces, confectionary, beverages, smoking products", rules:function(world) { return (world.tcs.has("Ag") || world.tcs.has("Ri")) && !world.tcs.has("Ni") && world.economicExt.infrastructure > 4 && world.economicExt.labour > 4 && world.densityType().name != "Icy Body"; } },
{ name:"Processed Alloy Resources", id:"allo_check", examples:"steel, tungsten, iron, copper, bronze, brass, silver, aluminium", rules:function(world) { return !(world.tcs.has("Ni") || world.tcs.has("Lo")) && world.economicExt.infrastructure > 3 && world.economicExt.labour > 5 && world.densityType().name != "Icy Body"; } },
{ name:"Processed Agroproducts", id:"agro_check", examples:"textiles, polymers, pharmaceuticals", rules:function(world) { return (world.tcs.has("Ag") || world.tcs.has("Ri")) && !world.tcs.has("Ni") && world.economicExt.infrastructure > 6 && world.economicExt.labour > 6 && world.densityType().name != "Icy Body"; } },
{ name:"Weapons", id:"weap_check", examples:"firearms, ammunition, blades, body armor", rules:function(world) { return !(world.tcs.has("Lo") || world.tcs.has("Ni")) && world.economicExt.infrastructure > 7; } },
{ name:"Mechanical Parts and Goods", id:"part_check", examples:"tools, vehicle parts, vacc suits, white goods", rules:function(world) { return !(world.tcs.has("Lo") || world.tcs.has("Ni")) && world.economicExt.infrastructure > 8; } },
{ name:"Heavy Equipment", id:"equi_check", examples:"aircraft, ATV, AFV, machine tools, farm machinery", rules:function(world) { return world.tcs.has("In") && world.economicExt.infrastructure > 8; } },
{ name:"Electronics", id:"elec_check", examples:"computers, electronic parts, cybernetic parts, computer parts, security systems, communicators", rules:function(world) { return world.tcs.has("In") && world.economicExt.infrastructure > 7 && world.uwp.TL > 6; } },
{ name:"Gravitics", id:"grav_check", examples:"anti-grav modules, grav belts, gravitic communicators", rules:function(world) { return world.tcs.has("In") && world.economicExt.infrastructure > 7 && world.uwp.TL > 8; } },
{ name:"Information", id:"info_check", examples:"government paperwork, laws and regulations, histories, geography, commercial or scientific data, academic papers, experimental data", rules:function(world) { return !world.tcs.has("Lo") && world.economicExt.infrastructure > 2; } }
];


var LAT_TEMPS = [	{ size:1, 0:0, 1:-21 }, 
					{ size:2, 0:7, 1:0, 2:-14, 3:-28 }, 
					{ size:3, 0:9, 1:0, 2:-9, 3:-18, 4:-27 }, 
					{ size:4, 0:13, 1:4, 2:0, 3:-9, 4:-18, 5:-27, 6:-36 },
					{ size:5, 0:14, 1:7, 2:0, 3:-7, 4:-14, 5:-21, 6:-28, 7:-35 },
					{ size:6, 0:17, 1:14, 2:7, 3:0, 4:-7, 5:-14, 6:-21, 7:-28, 8:-35, 9:-42 },
					{ size:7, 0:18, 1:12, 2:6, 3:0, 4:-6, 5:-12, 6:-18, 7:-24, 8:-30, 9:-36, 10:-42 },
					{ size:8, 0:21, 1:18, 2:12, 3:6, 4:0, 5:-6, 6:-12, 7:-18, 8:-24, 9:-30, 10:-36, 11:-42, 12:-48 }, 
					{ size:9, 0:21, 1:15, 2:10, 3:5, 4:0, 5:-5, 6:-10, 7:-15, 8:-20, 9:-25, 10:-30, 11:-35, 12:-40, 13:-45 },
					{ size:10, 0:27, 1:24, 2:18, 3:12, 4:6, 5:0, 6:-6, 7:-12, 8:-18, 9:-24, 10:-30, 11:-36, 12:-42, 13:-48, 14:-54, 15:-60 },
					{ size:11, 0:25, 1:20, 2:15, 3:10, 4:5, 5:0, 6:-5, 7:-10, 8:-15, 9:-20, 10:-25, 11:-30, 12:-35, 13:-40, 14:-45, 15:-50, 16:-55 },
					{ size:12, 0:27, 1:25, 2:20, 3:15, 4:10, 5:5, 6:0, 7:-5, 8:-10, 9:-15, 10:-20, 11:-25, 12:-30, 13:-35, 14:-40, 15:-45, 16:-50, 17:-55, 18:-60 },
					{ size:13, 0:30, 1:25, 2:20, 3:15, 4:10, 5:5, 6:0, 7:-5, 8:-10, 9:-15, 10:-20, 11:-25, 12:-30, 13:-35, 14:-40, 15:-45, 16:-50, 17:-55, 18:-60, 19:-65 },
					{ size:14, 0:32, 1:30, 2:25, 3:20, 4:15, 5:10, 6:5, 7:0, 8:-5, 9:-10, 10:-15, 11:-20, 12:-25, 13:-30, 14:-35, 15:-40, 16:-45, 17:-50, 18:-55, 19:-60, 20:-65, 21:-70 },
					{ size:15, 0:35, 1:30, 2:25, 3:20, 4:15, 5:10, 6:5, 7:0, 8:-5, 9:-10, 10:-15, 11:-20, 12:-25, 13:-30, 14:-35, 15:-40, 16:-45, 17:-50, 18:-55, 19:-60, 20:-65, 21:-70, 22:-75 },
					{ size:16, 0:37, 1:35, 2:30, 3:25, 4:20, 5:15, 6:10, 7:5, 8:0, 9:-5, 10:-10, 11:-15, 12:-20, 13:-25, 14:-30, 15:-35, 16:-40, 17:-45, 18:-50, 19:-55, 20:-60, 21:-65, 22:-70, 23:-75, 24:-80 },
					{ size:17, 0:40, 1:35, 2:30, 3:25, 4:20, 5:15, 6:10, 7:5, 8:0, 9:-5, 10:-10, 11:-15, 12:-20, 13:-25, 14:-30, 15:-35, 16:-40, 17:-45, 18:-50, 19:-55, 20:-60, 21:-65, 22:-70, 23:-75, 24:-80, 25:-85 },
					{ size:18, 0:42, 1:40, 2:35, 3:30, 4:25, 5:20, 6:15, 7:10, 8:5, 9:0, 10:-5, 11:-10, 12:-15, 13:-20, 14:-25, 15:-30, 16:-35, 17:-40, 18:-45, 19:-50, 20:-55, 21:-60, 22:-65, 23:-70, 24:-75, 25:-80, 26:-85, 27:-90 },
					{ size:19, 0:36, 1:32, 2:28, 3:24, 4:20, 5:16, 6:12, 7:8, 8:4, 9:0, 10:-4, 11:-8, 12:-12, 13:-16, 14:-20, 15:-24, 16:-28, 17:-32, 18:-36, 19:-40, 20:-44, 21:-48, 22:-52, 23:-56, 24:-60, 25:-64, 26:-68, 27:-72, 28:-76 }
];

var HOMOGENEITY_DESCRIPTIONS = [{tm:"N/A",js:"N/A"},
								{tm:"very monolithic",js:"homogenous"},
								{tm:"monolithic", js:"united"},
								{tm:"quite monolithic",js:"harmonious"},
								{tm:"very harmonious",js:"amicable"},
								{tm:"harmonious",js:"sympathetic"},
								{tm:"somewhat harmonious",js:"tolerant"},
								{tm:"somewhat discordant",js:"varied"},
								{tm:"quite discordant",js:"disparate"},
								{tm:"discordant",js:"contrasting"},
								{tm:"very discordant",js:"dissimilar"},
								{tm:"extremely discordant",js:"diverse"},
								{tm:"fragmented",js:"discordant"},
								{tm:"very fragmented",js:"fractured"},
								{tm:"extremely fragmented",js:"fragmented"},
								{tm:"extremely fragmented", js:"atomised"}];
								
var ACCEPTANCE_DESCRIPTIONS = [	{tm:"N/A",js:"N/A"},
								{tm:"extremely xenophobic",js:"isolationist"},
								{tm:"very xenophobic",js:"xenophobic"},
								{tm:"xenophobic",js:"hostile"},
								{tm:"extremely aloof",js:"cold"},
								{tm:"very aloof",js:"distant"},
								{tm:"aloof",js:"civil"},
								{tm:"aloof",js:"cordial"},
								{tm:"friendly",js:"amiable"},
								{tm:"friendly",js:"congenial"},
								{tm:"very friendly",js:"friendly"},
								{tm:"extremely friendly",js:"welcoming"},
								{tm:"xenophilic",js:"hospitable"},
								{tm:"very xenophilic",js:"warm"},
								{tm:"extremely xenophilic",js:"sycophantic"},
								{tm:"extremely xenophilic",js:"sycophantic"}];
								
var STRANGENESS_DESCRIPTIONS = [{tm:"N/A",js:"N/A",numCustoms:0},
								{tm:"very typical",js:"unfeatured",numCustoms:0},
								{tm:"typical",js:"monotonous",numCustoms:0},
								{tm:"somewhat typical",js:"tedious",numCustoms:0},
								{tm:"somewhat distinct",js:"banal",numCustoms:1},
								{tm:"distinct",js:"normal",numCustoms:1},
								{tm:"very distinct",js:"unusual",numCustoms:2},
								{tm:"confusing",js:"strange",numCustoms:2},
								{tm:"very confusing",js:"weird",numCustoms:2},
								{tm:"extremely confusing",js:"outlandish",numCustoms:3},
								{tm:"incomprehensible",js:"bizarre",numCustoms:4}];

var SYMBOLS_DESCRIPTIONS = 		[	{level_low:0, level_high:0, symbols:"Totems, Spirits and Gods; Boundary stones; Transmission of information by language, poetry and song; Pictorial representations; Natural numbers; Barter trade; Singing and hand-made instruments."},
									{level_low:1, level_high:1, symbols:"Creation stories; Moral fables; Writing; Generational transmission of knowledge; Arithmetic operations; Fractional and irrational numbers; History; Legends; Group membership beyond family - e.g. city-state; Flags, banners; Trade records; Figurative language; Mapping by dead reckoning; Abstract reasoning; Sun-dials and water-clocks; Gold or other rare metals as currency; Calendars; Music specialists for the wealthy"},
									{level_low:2, level_high:2, symbols:"Algebra; Calculus; Widespread literature; Literary allusions; Transformation / challenge of earlier symbols; Nations and Empires; Complex measurements become routine; Early mechanical time pieces; Public music performances by professionals"},
									{level_low:3, level_high:3, symbols:"Paper / coin currency; Banking, bonds, cheques, ledgers; Calendars in daily life reconciled with sophisticated mechanical time pieces; Rights and liberties - political movements; Exchange and absorption of symbols; Early popular literature; Local musical collectives"},
									{level_low:4, level_high:4, symbols:"Agreed measuring systems; Time and scheduling in daily life; Mass transport; Mass media ; Universal education begins; World maps consolidated and accurate; Beginnings of mass produced popular music"},
									{level_low:5, level_high:5, symbols:"Accurate World maps commonplace; Circuit diagrams; Electronic mass media; Psychology and mass manipulation; Music shared by electronic mass media"},
									{level_low:6, level_high:6, symbols:"Representations of atoms and chemistry; Complex signage at public locations; Routine sampling of literature for education of children; Explosion of art and figurative language; Electronic mass media has thoroughly transformed popular culture; New music possibilities from new technologies thoroughly entrenched"},
									{level_low:7, level_high:7, symbols:"Mass media communication taken for granted; Computer programming languages; New mathematics exploits new technologies; Universal secondary education; Established mass produced popular culture - drama, music, comedy etc."},
									{level_low:8, level_high:8, symbols:"Commercial cultural icons; Literature and science icons; Shared platforms of information; Transformation of mass media again, more user interactivity; New forms of art (music, painting, drama, comedy etc.) take advantage of new technological platforms.; Almost universal tertiary education"},
									{level_low:9, level_high:9, symbols:"Architecture, roads and planning transformed; Perspectives change as more time spent flying or in space"},
									{level_low:10, level_high:12, symbols:"Representations of planets, stars and star systems; Explosion of cosmological discovery"},
									{level_low:13, level_high:15, symbols:"Shared dreams and shared direct subconscious lead to symbols incomprehensible to previous societies; Interstellar travel fades into background of most citizen’s lives; Art, sport and culture transformed by abundant energy and anti-grav technology."},
									{level_low:16, level_high:33, symbols:"Symbols generated directly by AI - that is, symbols are now self-creating.  Magical levels of technology make speculation of concrete examples pointless."}
								];

// var GAS_ = {name:"", melt:0, boil:0, molecular_weight: 0, exotic:true, corrosive:false, insidious:false, notes:"" };
// var some_dice_table = { dice: function(){ return dice(2); }, min:2, max:12, mods:[], 2:, 3:, 4:, 5:, 6:, 7:, 8:, 9:, 10:, 11:, 12:};
// var some_resource = { name:"", examples:"",number:{molten:,rocky:,icy:,atmos_good:,atmos_bad:,pop_low:,pop_good:,tl_low:,tech_low_mid:,tech_up_mid:,tech_hi:,life:,no_life:} };

var IMPORTANCE_DESCRIPTIONS = {	"-3":"Very Unimportant", 
								"-2":"Very Unimportant", 
								"-1":"Unimportant", 
								"0":"Unimportant", 
								"1":"Ordinary", 
								"2":"Ordinary", 
								"3":"Ordinary", 
								"4":"Important", 
								"5":"Very Important"};


var matt_stevens_gov_8 = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, 2:"Participatory Democracy",3:"Representative Democracy",4:"Representative Democracy",5:"Representative Democracy",6:"Representative Democracy",7:"Unusual",8:"Professional Government",9:"Monarchy",10:"Monarchy",11:"Military Government",12:"One-Party Autocracy"};
var matt_stevens_gov_9 = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, 2:"Participatory Democracy",3:"Representative Democracy",4:"Representative Democracy",5:"Representative Democracy",6:"Representative Democracy",7:"Unusual",8:"Professional Government",9:"Monarchy",10:"Monarchy",11:"Military Government",12:"One-Party Autocracy"};
var matt_stevens_gov_A = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, 2:"Party Machine", 3:"Strongman", 4:"Strongman", 5:"War Hero", 6:"Revolutionary Military", 7:"Revolutionary Military", 8:"Institutional Military", 9:"Elected Tyrant", 10:"Elected Tyrant", 11:"Revolutionary Tyrant", 12:"Revolutionary Tyrant"};
var matt_stevens_gov_B = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, 2:"Strongman", 3:"Strongman", 4:"War Hero", 5:"Revolutionary Military", 6:"Institutional Military", 7:"Elected Tyrant", 8:"Elected Tyrant", 9:"Revolutionary Party", 10:"Revolutionary Party", 11:"Revolutionary Tyrant", 12:"Revolutionary Tyrant"};
var matt_stevens_gov_C = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, 2:"Party Machine", 3:"Party Machine", 4:"Party Machine", 5:"Revolutionary Military", 6:"Revolutionary Military", 7:"Institutional Military", 8:"Institutional Military", 9:"Institutional Military", 10:"Revolutionary Party", 11:"Revolutionary Party", 12:"Revolutionary Party"};
