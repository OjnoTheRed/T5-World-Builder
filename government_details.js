// Government Details using Matt Stevens' articles

var MATT_STEVENS_LINK_PARA = "mattStevensLinkPara";
var MATT_STEVENS_LINK = "mattStevensLink";

function govDetail(world)
{
	var me = this;
	me.world = world;
	me.title = GOV_DESCRIPTIONS[me.world.uwp.gov].title;
	me.desc = GOV_DESCRIPTIONS[me.world.uwp.gov].desc;
	me.detail = GOV_DESCRIPTIONS[me.world.uwp.gov].detail;
	me.link = GOV_DESCRIPTIONS[me.world.uwp.gov].link;
	me.textDetail = "";
	var mattStevensLinkPara = document.getElementById(MATT_STEVENS_LINK_PARA);
	var mattStevensLink = document.getElementById(MATT_STEVENS_LINK);

	if(me.detail)
	{
		var govDetailObj = new me.detail(world);
		me.textDetail = govDetailObj.toString();
	}
	else
		me.textDetail = "No further detail available."
		
	if(me.link)
	{
		mattStevensLinkPara.style.display = "block";
		mattStevensLink.href = me.link;
	}
	else
		mattStevensLinkPara.style.display = "none";
	
	me.toString = function()
	{
		return me.textDetail;
	}

}

// Government 0: no detail object

// Government 1: no detail object

// Government 3: no detail object

// Government 6: no detail object

// Government 2 and 4 - democracy
function democracy(world)
{
	var me = this;
	me.world = world;
	me.leadershipInstitutions = [];
	me.directDemocracyInst = {};
	me.suffrageRestrictions = [];
	me.parties = [];
	me.partiesDescription = "";
	me.participation = "";
	
	me.generate = function()
	{
		var numLI = new dice_table(numLITbl).roll();
		var all_appointed = true;
		for(var i=0;i<numLI;i++)
		{
			var newLI = {};

			var newLIsizeTbl = new dice_table(LI_Size_Tbl, null, me.world);
			newLIsizeTbl.DM -= (i+1);
			newLI.size = newLIsizeTbl.roll();

			var newLIHowTbl = new dice_table(LI_How_Chosen_Tbl);
			if(me.world.uwp.gov == 2)
				newLIHowTbl.DM = -3;
			newLI.howChosen = newLIHowTbl.roll();
			if(!newLI.howChosen.appointed) all_appointed = false; // if at least any one are not appointed, the flag can be false
			me.leadershipInstitutions.push(newLI);
		}
		if(all_appointed)
		{
			var appointedLI = [];
			me.leadershipInstitutions.map(function(anLI) { if(anLI.howChosen.appointed) appointedLI.push(anLI) });
			var randomLI = appointedLI[rng(appointedLI.length)-1];
			do
			{
				randomLI.howChosen = newLIHowTbl.roll();
			}
			while(randomLI.howChosen.appointed);
		}
		me.directDemocracyInst = new dice_table(Direct_Democracy_Tbl, null, me.world).roll();
		if(me.directDemocracyInst.techVote)
			me.directDemocracyInst.techVote = (dice(2) <= me.world.uwp.TL);
		var suffrageRolls = new dice_table(Suffrage_Rolls_Tbl, null, me.world).roll();
		for(i=0;i<suffrageRolls;i++)
		{
			var suffRestTbl = new dice_table(Suffrage_Restrictions_Tbl, null, (i+1));
			me.suffrageRestrictions.push(suffRestTbl.roll());
		}
		if(dice(1) <= me.world.uwp.popul)
		{
			var numPartiesResult = new dice_table(Num_Parties_Tbl, null, me.world).roll();
			var numParties = typeof(numPartiesResult) == "function" ? numPartiesResult() : numPartiesResult;
			var numDetailedParties = Math.min(numParties, 6);
			for(i=0;i<numDetailedParties;i++)
				me.parties.push(new party());
			switch(numParties)
			{
				case 0:
					me.partiesDescription = "Political Parties are banned.  Candidates run as individuals, without clear ideological position.";
					break;
				case 1:
					me.partiesDescription = "There is one party; either a voluntary union of old parties, or a party that is so overwhelmingly popular that it has no significant opposition.";
					break;
				default:
					me.partiesDescription = "There are multiple competing political parties.";
			}
		}
		else
		{
			me.partiesDescription = "Candidates run as individuals with no clear political party system.";
			var numParties = 0;
			me.parties = [];
		}
		var participationRoll = dice(2);
		if(me.world.uwp.gov == 4)
			participationRoll++;
		if(me.world.uwp.gov != 2 && me.world.uwp.gov != 4)
			participationRoll--;
		if(numParties==0)
			participationRoll -= 3;
		if(numParties==1)
			participationRoll--;
		if(numParties > 5)
			participationRoll++;
		if(participationRoll < 1)
			participationRoll = 0.5;
		participationRoll = Math.min(participationRoll,10);
		me.participation = "Around " + (participationRoll*10) + "% of the eligible electorate participate. ";
		if(participationRoll == 10 && dice(2) <= me.world.uwp.law)
			me.participation += "Voting is mandatory.";
	}
	
	me.toString = function()
	{
	
		var s = "The government is characterised as a " + (me.world.uwp.gov == 2 ? "participatory" : "representative") + " democracy. Leadership institutions include: ";
		me.leadershipInstitutions.map(function(LI) 
		{
			s += LI.size + " which is " + LI.howChosen.how + ". ";
		});
		s += "When major laws need to be changed, there is a " + me.directDemocracyInst.desc + ". ";
		s += me.directDemocracyInst.techVote ? "This takes place electronically. " : "";
		var suff_rest_string = "";
		me.suffrageRestrictions.map(function(suff_rest)
		{
			if(suff_rest.restriction && suff_rest_string.search(suff_rest.desc) == -1)
				suff_rest_string += suff_rest.desc + "; ";
		});
		if(suff_rest_string == "")
			s += "There are no restrictions on suffrage. ";
		else
			s += "The following restrictions on suffrage apply: " + suff_rest_string.replace(/;\s$/,"") + ". ";
		s += me.partiesDescription;
		me.parties.map(function (p) 
		{
			s += p;
		});
		s += me.participation;
		return s;
	}
	
	me.generate();
}

var numLITbl = {dice:function() { return dice(2); }, min:2, max:12, mods:[], 2:1, 3:1, 4:2, 5:2, 6:2, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4 };
var LI_Size_Tbl = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, mods:[], 2:"Large group (assembly), 10 or more people", 3:"Large group (assembly), 10 or more people", 4:"Small group (council), 4 to 9 people", 5:"Small group (council), 4 to 9 people", 6:"Triumvirate", 7:"Two people", 8:"One person", 9:"One person", 10:"One person", 11:"One person", 12:"One person" };
var LI_How_Chosen_Tbl = {dice:function() { return dice(2); }, min:2, max:12, mods:[], 2:{how:"Chosen by lot", appointed:false}, 3:{how:"Elected directly", appointed:false}, 4:{how:"Elected directly",appointed:false}, 5:{how:"Elected directly",appointed:false}, 6:{how:"Elected directly", appointed:false}, 7:{how:"Elected indirectly", appointed:false}, 8:{how:"Appointed by another institution, but given significant job security", appointed:true}, 9:{how:"Appointed by another institution, but given significant job security", appointed:true}, 10:{how:"Appointed by another institution, but given significant job security", appointed:true}, 11:{how:"A hereditary position", appointed:true}, 12:{how:"A hereditary position", appointed:true} };
var Direct_Democracy_Tbl = {dice:function(world) { return world.uwp.popul + flux(); }, min:4, max:8, mods:[], 4:{desc:"is a world meeting. All citizens gather at a central meeting place when summoned to vote on legislation.",techVote:false}, 5:{desc:"are regional meetings. Citizens gather together at local or regional meeting-places to vote on legislation of regional or worldwide importance.", techVote:false}, 6:{desc:"is a draft-lottery legislature. A random group of citizens is summoned to participate in a legislative body whose approval is necessary for legislation. (These issues may be submitted to the population in referenda when these votes lie within a certain margin of error.)", techVote:false}, 7:{desc:"is a draft-lottery legislature. A random group of citizens is summoned to participate in a legislative body whose approval is necessary for legislation. (These issues may be submitted to the population in referenda when these votes lie within a certain margin of error.)", techVote:false}, 8:{desc:"are referenda. Citizens report to their local polling stations and vote on a variety of issues by secret ballot.",techVote:true} };
var Suffrage_Rolls_Tbl = {dice:function(world) { return world.uwp.law; }, min:1, max:6, mods:[], 1:1, 2:2, 3:2, 4:3, 5:3, 6:4};
var Suffrage_Restrictions_Tbl = {dice:function(numDice) { return dice(numDice); }, min:1, max:23, mods:[], 1:{desc:"No restriction", restriction:false}, 2:{desc:"Must be an adult", restriction:true}, 3:{desc:"Must be an adult", restriction:true}, 4:{desc:"Must be an adult", restriction:true}, 5:{desc:"Must be an adult", restriction:true}, 6:{desc:"Must be a citizen/long-term resident", restriction:true}, 7:{desc:"Must be a citizen/long-term resident", restriction:true}, 8:{desc:"Must be literate", restriction:true}, 9:{desc:"No restriction", restriction:false}, 10:{desc:"Cannot have a criminal record", restriction:true}, 11:{desc:"Must be ", restriction:true, choice:["male","female"]}, 12:{desc:"Must meet property qualifications", restriction:true}, 13:{desc:"No restriction", restriction:false}, 14:{desc:"Must belong to official religion", restriction:true}, 15:{desc:"Must serve in the Army", restriction:true}, 16:{desc:"Must be the child of a citizen", restriction:true}, 17:{desc:"Must be an Imperial noble", restriction:true}, 18:{desc:"No restriction", restriction:false}, 19:{desc:"Cannot belong to a certain ethnic group", restriction:true}, 20:{desc:"Cannot be affiliated with certain political groups", restriction:true}, 21:{desc:"Must 'buy' his or her vote, or pay a special tax", restriction:true}, 22:{desc:"Must 'buy' his or her vote, or pay a special tax", restriction:true}, 23:{desc:"Must pass a test", restriction:true} };
var Num_Parties_Tbl = {dice:function(world) { return dice(2) - (world.law > 8 ? dice(1) : 0 ) }, min:3, max:12, mods:[], 3:0, 4:1, 5:1, 6:2, 7:2, 8:3, 9:function() { return dice(1)+3;}, 10:function() { return dice(1)+4; }, 11:function() { return dice(2)+4; }, 12:function() { return dice(3)+4; } };
var Ideology_Tbl = {dice:function(partyObj) { return dice(5) + partyObj.medianSocial; }, min:7, max:42, mods:[], 7:{desc:"", rollTwice:true, combine:true}, 8:{desc:"Communist", rollTwice:false, combine:false}, 9:{desc:"Anarchist", rollTwice:false, combine:false}, 10:{desc:"Revolutionary", rollTwice:false, combine:false}, 11:{desc:"Worker's", rollTwice:false, combine:false}, 12:{desc:"Socialist", rollTwice:false, combine:false}, 13:{desc:"Labor", rollTwice:false, combine:false}, 14:{desc:"Progressive", rollTwice:false, combine:false}, 15:{desc:["Popular","Populist","People's"], rollTwice:false, combine:true}, 16:{desc:"Radical", rollTwice:false, combine:false}, 17:{desc:["Social","Socialist"], rollTwice:false, combine:true}, 18:{desc:"Reform", rollTwice:false, combine:false}, 19:{desc:"New", rollTwice:false, combine:true}, 20:{desc:["January","February","March","April","May","June","July","August","September","October","November","December"], rollTwice:false, combine:false}, 21:{desc:"(name of country)", rollTwice:false, combine:true}, 22:{desc:"Unusual - make it up!", rollTwice:false, combine:false}, 23:{desc:["Red","Green","Blue","Yellow","White","Black","Pink","Brown","Orange","Purple"], rollTwice:false, combine:false}, 24:{desc:"Democratic", rollTwice:false, combine:false}, 25:{desc:"Democratic", rollTwice:false, combine:true}, 26:{desc:"Republican", rollTwice:false, combine:false}, 27:{desc:["Independent","Independence"], rollTwice:false, combine:true}, 28:{desc:"(region or ethnic group)", rollTwice:false, combine:false}, 29:{desc:["Liberal","Liberty","Liberation","Libertarian"], rollTwice:false, combine:true}, 30:{desc:"(person's name)", rollTwice:false, combine:false}, 31:{desc:["National","Nationalist"], rollTwice:false, combine:false}, 32:{desc:["National","Nationalist"], rollTwice:false, combine:true}, 33:{desc:"(named after religion)", rollTwice:false, combine:false}, 34:{desc:["Popular","Populist","People's"], rollTwice:false, combine:false}, 35:{desc:"Freedom", rollTwice:false, combine:false}, 36:{desc:"Free", rollTwice:false, combine:true}, 37:{desc:["Liberal","Liberation","Liberty","Libertarian"], rollTwice:false, combine:false}, 38:{desc:["Agrarian","Farmer's"], rollTwice:false, combine:false}, 39:{desc:"Conservative", rollTwice:false, combine:false}, 40:{desc:"Fascist", rollTwice:false, combine:false},  41:{desc:"Nazi", rollTwice:false, combine:false}, 42:{desc:"", rollTwice:true, combine:true}  };
var Org_Type = {dice:function() { return dice(2); }, min:3, max:12, mods:[], 3:"Alliance",4:"League",5:"Movement",6:"Party",7:"Party",8:"Party",9:"Party",10:"Union",11:"Congress",12:"(other - make it up)"};

function party()
{  
	var me = this;
	me.medianSocial = dice(2);
	me.ideology = "";
	me.type = "";
	me.name = "";
	var ideologyTbl = new dice_table(Ideology_Tbl, null, me);
	
	me.generate = function()
	{
		var ideologies = me.getIdeology();
		ideologies.map(function(i)
		{
			me.ideology += (typeof(i.desc) == "string" ? i.desc : i.desc[rng(i.desc.length)-1]) + " ";
			while(i.combine)
			{
				i = ideologyTbl.roll();	
				me.ideology += (typeof(i.desc) == "string" ? i.desc : i.desc[rng(i.desc.length)-1]) + " ";
			}	
		});
		me.type = new dice_table(Org_Type).roll();
		me.name = me.ideology + me.type;
	}
	
	me.getIdeology = function()
	{
		var ideologyRoll = ideologyTbl.roll();
		var ideologyRoll2;
		var returnRolls = [];
		if(ideologyRoll.rollTwice)
		{
			do
			{
				ideologyRoll = ideologyTbl.roll();
				ideologyRoll2 = ideologyTbl.roll();
			}
			while(ideologyRoll.rollTwice || ideologyRoll2.rollTwice);
			returnRolls.push(ideologyRoll);
			returnRolls.push(ideologyRoll2);
		}
		else
			returnRolls.push(ideologyRoll);
		return returnRolls;
	}
	
	me.toString = function()
	{
		return me.name + " with a median social standing of " + me.medianSocial + ". ";
	}
	
	me.generate();
}

// end of Government 2 and Government 4

// Government 7 (balkanised)
/* 
govTypeReq:[3] "At least one government of type <3> is required" - always expressed as an array of required governments
conflictDM:1 DM to apply to the level of conflict table
subPortDM:-2 DM to apply to the secondary / sub starport table
languageDM:-3 DM to apply to languages roll for speaking Anglic
*/
var balkHistory = [
{id:11, desc:"Years ago, either the Imperium or a megacorporation wanted to purchase some territory on this world (for a Naval or Scout base, for a research station, a mining colony or whatever). When the local government refused to make a deal, these outside interests organized a phony 'revolution' in that territory. A new government was established there, and it was immediately recognized by the Imperium. The world has remained divided to this day.", numStates:function() { return (rng(3)+1); }}, 
{id:12, desc:"The world was naturally divided into different economic 'zones.' Perhaps agricultural dominated one zone, while mining or industry was predominant in another, so people in different regions had vastly different economic interests. Conflicts over trade or labor policy became so fierce that a civil war broke out between the different regions. Eventually the war ended with a truce, and the world was divided.", numStates:function() { return (rng(3)+1); }}, 
{id:13, desc:"The world was naturally divided into different economic 'zones.' Perhaps agricultural dominated one zone, while mining or industry was predominant in another, so people in different regions had vastly different economic interests. Conflicts over trade or labor policy became so fierce that a civil war broke out between the different regions. Eventually the war ended with a truce, and the world was divided.", numStates:function() { return (rng(3)+1); }}, 
{id:14, desc:"Years ago, the government on this planet was defeated in an interplanetary war. The occupying power then divided the world into several different states, hoping to leave it divided and weak.", numStates:function() { return (dice(1)+1); }}, 
{id:15, desc:"Years ago, the government on this planet was defeated in an interplanetary war. The occupying power then divided the world into several different states, hoping to leave it divided and weak.", numStates:function() { return (dice(1)+1); }}, 
{id:16, desc:"High-tech raiders came upon this world during the Long Night and established themselves as an aristocratic elite. Eventually the exploited masses revolted against these rulers. The rebels won, and the aristocracy only maintained control over a small area of the world, where they and their more loyal subjects made up a majority of the population.", numStates:function() { (dice(1)+1); }, govTypeReq:[3], conflictDM:1, subPortDM:-2}, 
{id:21, desc:"While many colonists came to this world to make money, others came to establish one or more Utopias. These may have been theocracies, communist collectives, nudist colonies or what have you. These people wanted to be left alone in their 'perfect' little societies, while other colonists tried to avoid the 'weirdoes' next door. Over time, the Utopians and the materialists peacefully developed separate and independent states.", numStates:function() { return (rng(3)+1); }, govTypeReq:[2, 5, 13], conflictDM:-1}, 
{id:22, desc:"This world was once claimed by a number of different multi-world empires. These empires settled their differences diplomatically, by dividing the world up into separate 'zones,' each dominated by a different colonial power. Eventually, these 'zones' were granted autonomy, then independence, but the rulers of these new states saw no great reason to unite them under a single-planetary government. ", numStates:function() { return (rng(3)+1); }, conflictDM:-1}, 
{id:23, desc:"This world was once claimed by a number of different multi-world empires. These empires settled their differences diplomatically, by dividing the world up into separate 'zones,' each dominated by a different colonial power. Eventually, these 'zones' were granted autonomy, then independence, but the rulers of these new states saw no great reason to unite them under a single-planetary government. ", numStates:function() { return (rng(3)+1); }, conflictDM:-1}, 
{id:24, desc:"This world was once claimed by a number of different multi-world empires. These empires settled their differences diplomatically, by dividing the world up into separate 'zones,' each dominated by a different colonial power. Eventually, these 'zones' were granted autonomy, then independence, but the rulers of these new states saw no great reason to unite them under a single-planetary government. ", numStates:function() { return (rng(3)+1); }, conflictDM:-1}, 
{id:25, desc:"This world used to be a colonial regime, with a captive government. It was peaceful, for the most part, until the colonial regime decided to make the world a home for a homeless population (this may be a persecuted ethnic group, an alien race or a population that had escaped from a worldwide catastrophe). The original colonists resented these immigrants, and eventually a civil war broke out. Having gotten itself into a huge mess, the colonial government decided to abandon the world, but only after splitting it into two (or more) separate governments, one made up of the persecuted minority group, the other(s) dominated by the original colonists. ", numStates:function() { return (rng(3)+1); }, conflictDM:2}, 
{id:26, desc:"This world used to be a colonial regime, with a captive government. It was peaceful, for the most part, until the colonial regime decided to make the world a home for a homeless population (this may be a persecuted ethnic group, an alien race or a population that had escaped from a worldwide catastrophe). The original colonists resented these immigrants, and eventually a civil war broke out. Having gotten itself into a huge mess, the colonial government decided to abandon the world, but only after splitting it into two (or more) separate governments, one made up of the persecuted minority group, the other(s) dominated by the original colonists. ", numStates:function() { return (rng(3)+1); }, conflictDM:2}, 
{id:31, desc:"This world was conquered and colonized by a another multi-world empire years ago. It was then acquired by the current empire and settled by speakers of the current empire's language. The original colonists spoke a different language and became an isolated minority with less commercial power than the new colonists. Eventually, members of this minority held a referendum in their province and voted in favor of independence. The empire's language will be the official language at least one of these states; another language will be used in at least one other state.", numStates:function() { return (rng(3)+1); }, conflictDM:-1, languages:["Anglic","Non-Anglic"]}, 
{id:32, desc:"This world was conquered and colonized by a another multi-world empire years ago. It was then acquired by the current empire and settled by speakers of the current empire's language. The original colonists spoke a different language and became an isolated minority with less commercial power than the new colonists. Eventually, members of this minority held a referendum in their province and voted in favor of independence. The empire's language will be the official language at least one of these states; another language will be used in at least one other state.", numStates:function() { return (rng(3)+1); }, conflictDM:-1, languages:["Anglic","Non-Anglic"]}, 
{id:33, desc:"This world was conquered and colonized by a another multi-world empire years ago. It was then acquired by the current empire and settled by speakers of the current empire's language. The original colonists spoke a different language and became an isolated minority with less commercial power than the new colonists. Eventually, members of this minority held a referendum in their province and voted in favor of independence. The empire's language will be the official language at least one of these states; another language will be used in at least one other state.", numStates:function() { return (rng(3)+1); }, conflictDM:-1, languages:["Anglic","Non-Anglic"]}, 
{id:34, desc:"At one point a single royal family ruled this world. At one point the children of the dying Emperor decided to divide the world up between them, into a number of smaller states, rather than place the whole planet under a single throne. ", numStates:function() { return dice(1)+1; }, conflictDM:-1}, 
{id:35, desc:"The world was independent state under a weak but unified government of colonists, but it was taken over by an outside force and placed under captive rule. Many of the colonists refused to accept the new authority and 'took to the hills,' living far from the starport and other major cities. Eventually they set up their own, rival governments in the hinterlands. When the colonial power left the world, they left a puppet regime behind, which now competes with the frontier regimes for control of the planet. ", numStates:function() { return dice(1)+2; }, conflictDM:2, subPortDM:-2, govReqType:[2,4]}, 
{id:36, desc:"The world was independent state under a weak but unified government of colonists, but it was taken over by an outside force and placed under captive rule. Many of the colonists refused to accept the new authority and 'took to the hills,' living far from the starport and other major cities. Eventually they set up their own, rival governments in the hinterlands. When the colonial power left the world, they left a puppet regime behind, which now competes with the frontier regimes for control of the planet. ", numStates:function() { return dice(1)+2; }, conflictDM:2, subPortDM:-2, govReqType:[2,4]}, 
{id:41, desc:"This world used to have a unified federal government. Then at one point the federal government made a huge mess of things -- the exact details are left up to the referee. The provincial governors got together and dissolved the federal government, just to get rid of the screw-ups. Since that point, however, the provincial governments haven't been able to re-unify their world: so it remains permanently Balkanized. ", numStates:function() { return dice(1)+2; }}, 
{id:42, desc:"This world used to have a unified federal government. Then at one point the federal government made a huge mess of things -- the exact details are left up to the referee. The provincial governors got together and dissolved the federal government, just to get rid of the screw-ups. Since that point, however, the provincial governments haven't been able to re-unify their world: so it remains permanently Balkanized. ", numStates:function() { return dice(1)+2; }}, 
{id:43, desc:"Years ago, a charismatic provincial governor proclaimed independence from the world government. His territory was isolated enough to defend from the central government, which eventually granted it independence. Other provinces might have been granted independence as well during this period.", numStates:function() { return rng(3)+1; }, govTypeReq:[11]}, 
{id:44, desc:"Most sophonts on this world belong to one particular ethnic group, political party or religious sect. Most of the army, however, belongs to another sect, party or ethnic group. (You could explain this any number of ways. Perhaps a previous colonial government thought that this group was more 'warlike' and recruited from them exclusively. Perhaps a military career doesn't pay very much, and members of the dominant group are rich enough not to join. A third possibility is that the dominant group is somewhat pacifist and it looks down on military careers.) At some point the military staged a coup, but the majority stayed loyal to the old civilian regime. These loyalists seized control of certain provinces in the countryside, therefore splitting the world in a number of different states. ", numStates:function() { return dice(1)+1; }, conflictDM:3, govTypeReq:[10]}, 
{id:45, desc:"Most sophonts on this world belong to one particular ethnic group, political party or religious sect. Most of the army, however, belongs to another sect, party or ethnic group. (You could explain this any number of ways. Perhaps a previous colonial government thought that this group was more 'warlike' and recruited from them exclusively. Perhaps a military career doesn't pay very much, and members of the dominant group are rich enough not to join. A third possibility is that the dominant group is somewhat pacifist and it looks down on military careers.) At some point the military staged a coup, but the majority stayed loyal to the old civilian regime. These loyalists seized control of certain provinces in the countryside, therefore splitting the world in a number of different states. ", numStates:function() { return dice(1)+1; }, conflictDM:3, govTypeReq:[10]}, 
{id:46, desc:"Most sophonts on this world belong to one particular ethnic group, political party or religious sect. Most of the army, however, belongs to another sect, party or ethnic group. (You could explain this any number of ways. Perhaps a previous colonial government thought that this group was more 'warlike' and recruited from them exclusively. Perhaps a military career doesn't pay very much, and members of the dominant group are rich enough not to join. A third possibility is that the dominant group is somewhat pacifist and it looks down on military careers.) At some point the military staged a coup, but the majority stayed loyal to the old civilian regime. These loyalists seized control of certain provinces in the countryside, therefore splitting the world in a number of different states. ", numStates:function() { return dice(1)+1; }, conflictDM:3, govTypeReq:[10]}, 
{id:51, desc:"The world once had a unified government, until vast mineral resources were discovered several centuries ago. These deposits were concentrated in limited geographic areas, and a megacorporation came in and purchased those areas from the colonists, ruling them without interference from the rest of the population. The megacorporation may still rule in its old domain, or it may have left government in the hands of its old employees once the resources ran out. ", numStates:function() { return rng(3)+1; }, conflictDM:-1}, 
{id:52, desc:"The world once had a unified government, until vast mineral resources were discovered several centuries ago. These deposits were concentrated in limited geographic areas, and a megacorporation came in and purchased those areas from the colonists, ruling them without interference from the rest of the population. The megacorporation may still rule in its old domain, or it may have left government in the hands of its old employees once the resources ran out. ", numStates:function() { return rng(3)+1; }, conflictDM:-1}, 
{id:53, desc:"At some point this world revolted against the interstellar government, yet some citizens remained loyal, and these loyalists were concentrated in small geographical areas. During the war to reclaim this planet, the Imperium set up one or more independent states for the loyalist population. These states kept their independence once the war ended, thus leaving the planet permanently Balkanized. ", numStates:function() { return rng(3)+1; }}, 
{id:54, desc:"At some point this world revolted against the interstellar government, yet some citizens remained loyal, and these loyalists were concentrated in small geographical areas. During the war to reclaim this planet, the Imperium set up one or more independent states for the loyalist population. These states kept their independence once the war ended, thus leaving the planet permanently Balkanized. ", numStates:function() { return rng(3)+1; }}, 
{id:55, desc:"A group of revolutionaries have seized the capital, but the rest of the world remains largely outside their control. Military leaders, stationed outside the capital, have set up their own, counter-revolutionary regimes. Other revolutionaries, with somewhat different interests than those at the capital, may have also set up their own states. In any case, a civil war has probably broken out between these different micro-states. ", numStates:function() { return rng(3)+2; }, govReqType:[10,12], conflictDM:3, subPortDM:-1}, 
{id:56, desc:"A group of revolutionaries have seized the capital, but the rest of the world remains largely outside their control. Military leaders, stationed outside the capital, have set up their own, counter-revolutionary regimes. Other revolutionaries, with somewhat different interests than those at the capital, may have also set up their own states. In any case, a civil war has probably broken out between these different micro-states. ", numStates:function() { return rng(3)+2; }, govReqType:[10,12], conflictDM:3, subPortDM:-1}, 
{id:61, desc:"This world was settled simultaneously by several ethnic groups from Terra during the Rule of Man or the Long Night. They came to this world precisely so they could establish different states and preserve their different cultures, and have remained in separate states ever since. ", numStates:function() { return dice(1)+1; }, conflictDM:-1, languageDM:-3, languages:["Old Terran languages"]}, 
{id:62, desc:"This world was settled simultaneously by several ethnic groups from Terra during the Rule of Man or the Long Night. They came to this world precisely so they could establish different states and preserve their different cultures, and have remained in separate states ever since. ", numStates:function() { return dice(1)+1; }, conflictDM:-1, languageDM:-3, languages:["Old Terran languages"]}, 
{id:63, desc:"This world regressed into barbarism during the Long Night. As the economy collapsed, the government found it could no longer keep order. Gradually, in the face of mounting anarchy, various groups -- vigilantes, army officers, survivalists, bandits -- created states of their own. These states have remained to this day. ", numStates:function() { return dice(2); }, conflictDM:2}, 
{id:64, desc:"This world regressed into barbarism during the Long Night. As the economy collapsed, the government found it could no longer keep order. Gradually, in the face of mounting anarchy, various groups -- vigilantes, army officers, survivalists, bandits -- created states of their own. These states have remained to this day. ", numStates:function() { return dice(2); }, conflictDM:2}, 
{id:65, desc:"This is not a colony world; it is the home of a minor alien race. It has never been unified, and it has always been divided into different ethnic, linguistic or religious groups, each with its own rulers.", numStates:function() { return dice(3); }, languageDM:-6, languages:["Alien language"]}, 
{id:66, desc:"This is not a colony world; it is the home of a minor human race since the days of the Ancients. It has never been unified, and it has always been divided into different ethnic, linguistic or religious groups, each with its own rulers.", numStates:function() { return dice(3); }, languageDM:-6, languages:["Minor human language"]} 
];

var conflict_table = {dice:function(historyObj){ return dice(2)+historyObj.conflictDM; }, min:4, max:10, mods:[], 4:{title:"Low",desc:"The nations of the world are at peace."}, 5:{title:"Moderate", desc:"There are occasional skirmishes here and there, but no state is at full military mobilization, and conflicts are easily contained with few civilian casualties."}, 6:{title:"Moderate", desc:"There are occasional skirmishes here and there, but no state is at full military mobilization, and conflicts are easily contained with few civilian casualties."}, 7:{title:"Moderate", desc:"There are occasional skirmishes here and there, but no state is at full military mobilization, and conflicts are easily contained with few civilian casualties."}, 8:{title:"High", desc:"The world is in the grip of a cold war between rival powers. Military spending is high, and there is a sense that a hot war between the major powers could break out at any time. For the moment, though, competition is channeled into low-intensity conflicts (largely revolutions and civil wars) within smaller, less powerful states, and direct superpower confrontation is avoided."}, 9:{title:"High", desc:"The world is in the grip of a cold war between rival powers. Military spending is high, and there is a sense that a hot war between the major powers could break out at any time. For the moment, though, competition is channeled into low-intensity conflicts (largely revolutions and civil wars) within smaller, less powerful states, and direct superpower confrontation is avoided."}, 10:{title:"Very High", desc:"The world is facing total war between rival powers and societies are fully mobilized for national defense. Civilian casualties tend to be high, often as the result of deliberate policy to destroy productive capacity."}};

var subPortTbl = {
	"A":["E","D","C","C","B","A"],
	"B":["E","E","D","C","C","B"],
	"C":["X","E","E","D","C","C"],
	"D":["X","X","E","E","D","D"],
	"E":["X","X","X","E","E","E"],
	"F":["Y","H","H","G","F","F"],
	"G":["Y","Y","H","H","G","G"],
	"H":["Y","Y","Y","H","H","H"],
	"X":["X","X","X","X","X","X"],
	"Y":["Y","Y","Y","Y","Y","Y"] };
	
var TLmodTbl = { 
	"A":{"A":0, "B":-1, "C":-2, "D":-3, "E":-4},
	"B":{"B":0, "C":-1, "D":-2, "E":-3},
	"C":{"C":0, "D":-1, "E":-2, "X":-3},
	"D":{"D":0, "E":-1, "X:":-2},
	"E":{"E":0, "X":-2},
	"X":{"X":0},
	"F":{"F":0, "G":-1, "H":-2, "Y":-2 },
	"G":{"G":0, "H":-1, "Y":-2 },
	"H":{"H":0, "Y":-2},
	"Y":{"Y":0} };
	
function get_anglic_mod(world)
{
	var dm = 0;
	if(world.constructor.name == "mainWorld" && world.allegiance.search("Im") != -1)
		dm -= 3;
	if(world.constructor.name == "minorWorld" && world.mainWorld.allegiance.search("Im") != -1)
		dm -= 3;
	switch(world.uwp.port)
	{
		case "A": 
			dm += 3;
			break;
		case "B":
			dm += 2;
			break;
		case "C":
			dm += 1;
			break;
		case "X":
		case "Y":
			dm -= 4;
			break;
		default:
			dm += 0;
	}
	return dm;
}
	
var anglic_table = {dice:function(world) { return dice(2) + get_anglic_mod(world); }, min:3, max:6, mods:[], 3:"No one speaks Anglic as their first language, and very few (if any) speak it at all", 4:"The world's elite speak Anglic, perhaps as their first language, but the majority speaks something else", 5:"The world's elite speak Anglic, perhaps as their first language, but the majority speaks something else", 6:"The vast majority of citizens speak Anglic as their first language"};
var spoken_language = {dice:function() { return dice(2); }, min:2, max:12, mods:[], 2:"Artificial language. An invented language such as Esperanto or Basic English.", 3:"Alien language. The language of a non-Human race, such as Aslan or a Vargr society.", 4:"Language of a minor human race, such as the Dynchia of the Old Expanses or the Ilthara of Reaver's Deep.", 5:"Obscure dialect of Anglic. Derived from Anglic but only barely intelligible to the Anglic speakers of the Imperium.", 6:"Old Terran language. Spanish, Hindi, Arabic and Mandarin are common.", 7:"Creole mix of Anglic and some other language (roll a second time to determine)", 8:"High Vilani, the official language of the First Imperium.", 9:"Language of a minor human race, such as the Darrians or the Syleans.", 10:"Artificial language. An invented language such as Esperanto or Basic English.", 11:"Old Vilani language. A language once spoken on Vland which has survived in isolated pockets to the present day.", 12:"Alien language. The language of a non-Human race, such as the Aslan or the K'Kree."};

function balkanised(world)
{
	var me = this;
	me.world = world;
	me.states = [];
	me.history = "";
	me.numStates = 0;
	me.govOverflowMsg = "";

	me.toString = function()
	{

		var s = me.history.desc;
		s += " There are " + me.numStates + " states on this world.";
		s += " The conflict level is " + me.conflict.title + ". " + me.conflict.desc;
		s += me.allNations();
		s += me.govOverflowMsg;
		return s;
	}
	
	me.addHistory = function(historyWhy)
	{
		if(!historyWhy.govTypeReq)
			historyWhy.govTypeReq = [];
		if(!historyWhy.conflictDM)
			historyWhy.conflictDM = 0;
		if(!historyWhy.subPortDM)
			historyWhy.subPortDM = 0;
		if(!historyWhy.languageDM)
			historyWhy.languageDM = 0;
		if(!historyWhy.languages)
			historyWhy.languages = [];
		me.numStates += historyWhy.numStates();
		me.history = historyWhy;
	}
	

	me.historyRoll = function()
	{
		var firstRoll = dice(1);
		if(me.world.uwp.port == "E")

			firstRoll++;
		if(me.world.uwp.port == "X")
			firstRoll = 6;
		var secondRoll = dice(1);

		if(me.world.uwp.law <=4)
			secondRoll--;
		if(me.world.uwp.law >=10)
			secondRoll++;

		firstRoll = Math.min(6,Math.max(firstRoll, 1));
		secondRoll = Math.min(6,Math.max(secondRoll, 1));
		return firstRoll*10 + secondRoll;
	}

	
	me.allNations = function()
	{
		var s = "\n\nThese are the characteristics for each state:";

		for(var i=0;i<me.states.length;i++)
		{
			s += "\n\tNation " + (i+1) + ": ";
			s += me.states[i].toString() + " ";

		}
		return s;

	}
	
		
	var hRoll = me.historyRoll();
	me.addHistory(balkHistory.find(function(v) { return v.id == hRoll; }));
	me.conflict = new dice_table(conflict_table, null, me.history).roll();
	if(me.conflict.title == "High" || me.conflict.title == "Very High")
		me.world.constructor == "minorWorld" ? me.world.mainWorld.traveZone = "A" : me.world.travelZone = "A";
	if(me.world.uwp.TL >=7 && me.conflict.title == "Very High")
		me.conflict.desc += (dice(1) == 6 ? " At least one nation has used nuclear weapons on another." : "");
	if(dice(2) > me.conflict.rollResult)
		me.conflict.desc += "\n\n(There is a supra-national body similar to the United Nations.)";
	var i = 0;
	while(i < me.numStates)
	{
		if(i >= uPObj.prefs.balkanised_gov_max)
		{
			me.govOverflowMsg = "\n\n(There are more governments, but only the first " + uPObj.prefs.balkanised_gov_max + " have been generated.)";
			break;
		}
		var newGov = flux() + me.world.uwp.popul;
		if(me.numStates > 1 && me.numStates < 5)
			newGov++;
		if(me.numStates > 49)
			newGov--;
		if(newGov < 1) newGov = 1;
		if(newGov == 7)
		{
			me.numStates += me.history.numStates();
			continue;
		}
		me.states.push(new nationState(me, newGov));
		i++;
	}
	me.states[0].port = me.world.uwp.port;
	me.states.sort(function(state1, state2)
						{
							return state1.port.localeCompare(state2.port);
						});
}

function nationState(govDetailObj, gov)
{
	var me = this;
	me.world = govDetailObj.world;
	me.balk = govDetailObj;
	me.gov = gov;
	me.law = Math.max(0,me.gov + flux());
	me.port = subPortTbl[me.world.uwp.port][Math.min(6,Math.max(1,dice(1)+me.balk.history.subPortDM))-1];
	me.TL = Math.max(0,me.world.uwp.TL + TLmodTbl[me.world.uwp.port][me.port]);
	me.anglic_status = new dice_table(anglic_table, null, me.world).roll();
	if(me.anglic_status == "The vast majority of citizens speak Anglic as their first language")
		me.language = "Anglic";
	else
	{
		switch(me.balk.history.languages.length)
		{
			case 1:
				me.language = me.balk.history.languages[0];
				break;
			default:
				me.language = new dice_table(spoken_language).roll();				
		}
	}
	
	me.toString = function()
	{
		var s = "This nation has government type " + me.gov + " (" + GOV_DESCRIPTIONS[me.gov].title + ": " + GOV_DESCRIPTIONS[me.gov].desc + "). ";
		s += "The local law level is " + me.law + ". ";
		s += (me.port == "X" ? "There is no local starport" : ("There is a local starport of class " + me.port)) + ". ";
		s += "The local technology level is " + me.TL + ". ";
		s += me.anglic_status + ". ";
		if(me.language != "Anglic")
			s += "The local language spoken is " + me.language;
		return s;
	}	
}	

// end of government 7 (balkanised) stuff

// Government 8 - Civil Service Bureaucracy and Government 9 - Impersonal Bureaucracy

function bureaucracy(world)
{
	var me = this;
	me.world = world;
	me.controlText = "";
	// add full explanations from tables below 
	
	if(me.world.uwp.gov == 8)
		me.controlText = "Under a civil service bureaucracy, the government's non-bureaucratic leaders really do rule, at least when they're united, although administrators still shape policy through discreet and indirect means.";
	else
		me.controlText = "The government is an impersonal bureaucracy. " + new dice_table(OUT_OF_CONTROL).roll();
	
	var details_tbl = new dice_table(NON_BUREAUCRATIC_LEADERS, null, me.world);
	me.details = details_tbl.roll();
	
	me.toString = function()
	{
		var s = me.controlText + " ";
		s += "While the real power rests with ";
		s += me.world.uwp.gov == 8 ? "a civil service bureauracy" : "an impersonal bureaucracy";
		s += ", the apparent political leadership is " + me.details.title + ". " + me.details.desc;
		return s;
	}
	
	
}

var NBL_2 = {title:"a Participatory Democracy",desc:"While the government as a whole is bureaucratic, ordinary citizens have a great deal of input into law making and other major decisions. The leadership is elected, as in a representative democracy, but the public has the right to veto laws or propose new ones through periodic referenda. The average citizen has a fair amount of power, but it's only exercised in the voting booth. There's little of the face to face discussion or debate that one would find in a true participatory democracy (government type 2)."};
var NBL_4 = {title:"a Representative Democracy",desc:"Citizens elect the world's leaders. These leaders tend to be lawyers or other well to do citizens, and most are members of large bureaucratized political parties. Citizens have little direct contact with their leaders in bureaucratic representative regimes, and what little they know about them, they learn from political advertising or the news media."};
var NBL_U = {title:"an Unusual Government",desc:"This is a catchall category for any other kind of leadership, especially the more exotic kinds. Examples can include rule by computer, a council of elders, a random selection of citizens, fortune-tellers, a genetically engineered 'master race,' a group of nobles, a group of high-paying 'share-holders' or any other kind of arrangement. Referees who are interested in unusual leadership can turn to the excellent BITS supplement, 101 Governments, for plenty of wonderful ideas."};
var NBL_Prof = {title:"a Professional Government",desc:"Citizens formally elect a legislature or a Board of Supervisors on this world, but executive authority is invested in a professional World Manager. These professionals are trained in World Management programs in major universities, and are hired by the Board or the legislature on the basis of their accomplishments or their academic credentials."};
var NBL_3 = {title:"a Monarchy",desc:"Ultimate executive power rests in the hands of a hereditary monarch. There may also be a weak legislature of some sort, made up of hereditary peers, elected representatives or 'advisors' appointed directly by the monarch. Bureaucratized monarchies tend to be much more 'open' and meritocratic than the more aristocratic monarchies found under government type 3 (self-perpetuating oligarchy)."};
var NBL_Mil = {title:"a Military Government",desc:"In this world the military has a constitutionally protected role in the political system. The current leader is a military officer, but an officer who came to power through purely legal means (rather than a coup d'etat), who plans on leaving office as soon as the latest crisis has past."};
var NBL_OPA = {title:"a One-Party Autocracy",desc:"When the leaders of this world step down, they have the power to appoint their successors. They may appoint them directly, or they may choose members of a committee, who then select a successor when the ruler dies or retires. "};
var NON_BUREAUCRATIC_LEADERS = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, mods:[], 2:NBL_2,3:NBL_4,4:NBL_4,5:NBL_4,6:NBL_4,7:NBL_U,8:NBL_Prof,9:NBL_3,10:NBL_3,11:NBL_Mil,12:NBL_OPA };

var OUT_OF_CONTROL = {dice:function() { return dice(1); }, min:1, max:6, mods:[], 1:"An agency may be given an enormously wide jurisdiction, so wide that it can do just about anything. Give the top administrator civil service job protection as well, and he can force politicians to do his bidding. (Otherwise he will shut the oxygen off in their districts, close down all the schools, send a wrecking crew through their homes, or whatever else strikes his fancy.)",2:"Certain positions in the cabinet may be reserved for bureaucrats such as army officers; the government will fall apart if these agency leaders refuse to serve. If the bureaucracy is united this gives it a complete veto over any policy it doesn't like. (Japan suffered under this arrangement in the 1930s.)",3:"The constitution may give bureaucrats a mediating role in the government. When different branches of government (such as the president and the legislature) can't get along, the agency steps in and resolves the dispute. If politicians never agree on anything, the bureaucrats will run things all the time. (See Brazil before the 1960s for an example.)",4:"A crafty bureaucrat can accumulate so much political power than no politician will oppose him. He might become a media darling, for example, and use the press to discredit his critics. He could make friends in high places, who make sure his agency well-financed. Or he could track down incriminating documents and blackmail well-placed politicians.",5:"Some rulers will encourage their bureaucrats to run things. These leaders might be lazy, and leave the real work to the paper-pushes while they hangout at the golf club. They might feel incompetent, and do what their officials suggest out of fear of making mistakes. Or they might be senile or crazy, leaving administrators without coherent instructions and with no choice but to make their policies.", 6:"Under single-party states or other non-democratic regimes, the political leadership may be recruited directly from the bureaucracy: When a ruler steps down, he appoints a trusted bureaucrat to take his place. The bureaucracy doesn't rule directly, but it doesn't have to, since the new ruler probably agrees with them anyway."};


// end Government 8 and Government 9

// Government A - Charismatic Dictatorship, Government B - Non-charismatic, Government C - charismatic oligarchy

function dictator(world)
{
	var me = this;
	me.world = world;
	me.type = "";
	var typeTbl;
	
	switch(me.world.uwp.gov)
	{
		case 10:
			typeTbl = new dice_table(MATT_STEVENS_GOV_A, null, me.world);
			break;
		case 11:
			typeTbl = new dice_table(MATT_STEVENS_GOV_B, null, me.world);
			break;
		default:
			typeTbl = new dice_table(MATT_STEVENS_GOV_C, null, me.world);
			break;			
	}
	
	me.type = typeTbl.roll();
	
	me.toString = function()
	{
		var s = "The dictactorship on this world can be characterised as " + me.type.type + ". ";
		s += me.type.desc;
		return s;
	}
	
	// add full explanations from tables below
}

var DICTATOR_TYPES = [
{type:"a Party Machine", desc:"Outwardly this resembles Government Type 4 (Representative Democracy). The law level is reasonably low and there are periodic elections, which seem free and fair at first glance. Yet many natives will tell you that their 'democracy' is something of a sham. They point out that the same party wins all elections all the time, and despite the elaborate 'checks and balances' in their government, one man (the Governor, the President, or whoever) seems to make all the decisions. They also complain about widespread fraud and corruption, and refer to the ruling party as if it's nothing but a gang of thieves. This is a kind of charismatic government known as a Party Machine.The leaders of a Party Machine dominate their worlds by liberally dispensing favors and jobs to anyone who supports them on Election Day. They justify their rule by reminding their constituents of all the wonderful things they've done for them. 'Who let your cousin Timmy out of jail? Who got your Uncle Joe a job at the post office? Who paid your debts to the bookie?' So what if they took kickbacks from megacorporations? Everybody's entitled to take advantage of a good deal.Party Machines are conservative. They want to keep control so they can continue to skim money off the treasury and provide government jobs for their supporters. Government is seen as a business, and they want to keep low levels of order so that everyone can continue to make money. Otherwise they have no grand plans and they're happy to leave people alone. Adventurers should have few problems with these regimes, and if they get into trouble they can always bribe their way out."},
{type:"a Strongman", desc:"The Strongman (or Strong-woman) is often a man with limited education, who rose through the enlisted ranks of the army before he came to power in a military coup. He seized control with the help of his army buddies, and he rewards them handsomely every chance he gets. While all governments try to keep the army happy, the Strongman does nothing but keep the army happy. Like the Party Machine leader, the Strongman uses generosity to justify his rule, but while the Machine leader is being generous to his supporters (who are ordinary citizens), the Strongman is dispensing largesse to his fellow army officers, making sure they have a hell of party under his watch.Civilian life under a strongman can be precarious. The laws themselves aren't particularly harsh, but the police and the armed forces are allowed to run wild and can steal or kill on a whim without fear of punishment. Police harassment is a constant danger under these regimes, and it doesn't matter if you've done anything illegal or not! Most law enforcement officials can be turned away with a bribe, although some will take your money and shoot you anyway. A strongman can survive in power for a long time, maybe even long enough for a son or a colleague to inherit his office. Typically the army is so disorganized and undisciplined under strongman rule that it's unable to overthrow the regime. The greatest dangers to a strongman would be guerrilla forces on his own world, or the armed forces of another. The strongman's military would put up little resistance to an organized invasion; they would probably do little more than loot valuables and go into hiding on another planet where they could continue to cause trouble."},
{type:"a War Hero", desc:"Like the Strongman, the War Hero is a military officer who seizes power in a coup, but the War Hero justifies his putsch in different terms, and he seizes power for different reasons. While the Strongman offers money and license to the army, the War Hero promises glory and adventure. Like Caesar or Napoleon, the War Hero tends to be a talented general, who proves his skill on the battlefield, wins the undying loyalty of his troops and then uses them against the old regime. The War Hero then uses his proven brilliance and leadership skills to legitimate his rule. Many War Heroes really are competent rulers, implementing a number of inspired and thoughtful reforms. They can be popular enough to rule without heavy-handed censorship or ludicrously high Law Levels. Unfortunately, charismatic War Heroes quickly grow restless and bored with domestic politics, and before long they seek additional glory and power on the battlefield. War Heroes end up militarizing their own worlds to conquer others, which they feel would be much better off under the guiding hand of their genius. It's possible, but unlikely, that the War Hero will survive these adventures. If he does, he's more likely to pass his position onto a son or another relative than to set up a political party. Once institutionalized, the established dynasty will probably become stuffily conservative, with a taste for pomp and glory, keeping the memory of the glorious War Hero alive for decades if not centuries."},
{type:"a Revolutionary Military", desc:"A Revolutionary Military regime also begins with a coup, but it's a coup not only against the previous regime but also against the army leadership itself. The rebels tend to be middle-rank or junior-level officers (or even NCOs) and when they take power they send both the politicians and the high-ranking officers off to jail. These revolts tend to be populist or left wing, and the new leadership tends to identify itself with The People against The Interests, The Politicians, The Imperialists or other nefarious no-gooders. They justify their revolt, and their rule, by claiming to be part of a genuine revolution and the only authentic representatives of a popular movement. Revolutionary Military regimes encourage limited political participation, and some degree of pluralism and dissent can be tolerated. These regimes are dictatorships, however, and they usually impose draconian punishments against lawbreakers. Merchants who hoard supplies could be publicly flogged, for example, or bureaucrats who are accused of corruption could be shot without trial. (Vigilantes may be encouraged to impose this kind of 'justice' on their own.) Player characters who break the law in even minor ways could find themselves in life-threatening trouble with the authorities. Eventually these regimes may 'institutionalize the revolution' by setting up a nationalist or left wing political party. These parties may go on to contest democratic elections, or they may maintain their position under a one-party state. In either case, their 'revolutionary' fervor will quickly die out, to the disappointment of some citizens but to the vast relief of most."},
{type:"an Institutional Military", desc:"When the military as an institution seizes power, typically the highest-ranking officers are put in charge (after removing a few loyalists to the old regime). The Joint Chiefs of Staff may rule collectively as a junta or they might choose a single, high-ranking officer to serve as president while the others retreat to the barracks. Military coups like these are typically staged to clamp down on disorder or to prevent some 'undesirables' from seizing power. Their justifications are conservative; they claim to be saving the world from Communism, anarchy, the Psionic Menace or some other threat to Imperial virtues, and they usually raise the Law Level to punishing levels in an effort to restore 'order' on the world. These regimes tend to see themselves as temporary 'guardians' of their worlds. Their stated intention is to purge them of unruly elements and return to civilian rule as soon as the people are 'ready.' However if the public is restless under this state of emergency, the military may see this as a sign that the people aren't 'ready,' so they might impose martial law indefinitely. Eventually they may institutionalize their rule by establishing a civilian party that promises to continue their conservative policies. Visitors to these worlds will encounter few problems at first. They'll find that streets are clean, lawbreakers are few, and tourist money is openly welcomed. The real victims of military rule -- such as students, journalists and the poor -- will be hidden from view. Of course if these visitors run afoul of the law they will discover how harsh the regime really is."},
{type:"an Elected Tyrant", desc:"An Elected Tyrant came to power through openly legal, democratic means, but then he proceeded to strip away democratic freedoms and impose authoritarian rule. He's a politician, much like the Party Machine boss, but he's interested in far more than 'jobs for the boys.' The Elected Tyrant is a man (or woman) with a mission and a messianic self-image, who seeks absolute control in order to remake society according to his master plan. He calls himself a genius, an expert on every subject, and like the War Hero he uses his personal 'genius' to justify his rule. Elected Tyrants have no tolerance for dissent, and law levels tend to be high (at least after the old democratic freedoms are stripped away). However they can be enormously popular if they deliver on their promises, and they leave most people more or less alone. Their real victims tend to be unpopular ethnic or religious minorities, who are singled out for persecution, expulsion or even more hideous penalties. Anyone without a role to play in the Elected Tyrant's master plan is to be ruthlessly eliminated. Elected dictators tend to come to power as leaders of political parties, and if their regimes survive, these parties may be able to institutionalize their rule by electing successors (who would be considered non-charismatic leaders). These new leaders may continue the oppressive policies of their predecessors, but without the same messianic fervor."},
{type:"a Revolutionary Party", desc:"A Revolutionary Party is a well-organized group of civilians who have managed to seize through force. Typically made up of students and other intellectuals, the Party may have taken power in the midst of street protests or they have done so through a long, protracted guerrilla war (possibly against a Strongman, see above). At first they may have joined in coalition with other opposition parties, but eventually these parties were either relegated to subordinate positions or forced out of power. Today the Revolutionary Party rules alone, legitimizing its actions in the name of the People or the Historical Forces it claims to represent. Law levels under a Revolutionary Party tend to be high but not overwhelmingly so. Typically there is some degree of pluralism within the Party (if not actual democracy), and the government tolerates a very limited degree of dissent. Nevertheless the regime is highly authoritarian. It has a blueprint for the 'proper' way to organize a society, and it's willing to radically disrupt the lives of its citizens to realize this vision. Such efforts inevitably provoke strong resistance, which is labeled 'counter-revolutionary' and ruthlessly suppressed. Ultimately these Master Plans do not work as well as expected, and the Party can then go in one of two directions. It can accept its failures, repudiate its old policies and pursue a less radical course. Or it can argue that 'traitors' or 'counter-revolutionaries' were responsible for its failures, in which case a Revolutionary Tyrant will likely come to power."},
{type:"a Revolutionary Tyrant", desc:"The Revolutionary Tyrant is perhaps the most dangerous and ruthless charismatic dictator. The Tyrant comes to power as one leader (possibly among many) in a victorious Revolutionary Party. Once the party has achieved absolute control, he begins a bloody reign of terror against the party itself. He justifies his rule and his ruthless purges by claiming to be the only true revolutionary in the party, the only one who genuinely speaks for The People. His opponents, real or imagined, both inside and outside the party, are denounced as traitors, reactionaries and counter-revolutionaries. No one is safe under a Revolutionary Tyrant -- neither the police, nor the Army, nor the Party nor the average citizen. Anyone, guilty or innocent, can be charged with an obscure crime and dragged off into the night. A successful rebellion is almost impossible: No one dares speak out against the regime, and the secret police are so powerful, and their presence is so pervasive, that no one can organize covertly without being discovered. The only real danger to the regime would be an outside force; the armed forces, crippled by purges, may be too disorganized to defend the world successfully. Most of the time, however, the Revolutionary Tyrant will be able to rule unchallenged until his or her death. At that point the remnants of the old Party will meet and elect a successor. This new leader will rarely continue the policies of the old tyrant; after all, some of his friends or relatives no doubt suffered in the purges. Instead, he will probably put an end to the Terror and reduce the Law Level a bit without completely liberalizing the regime."}
];

var MATT_STEVENS_GOV_A = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, mods:[], 2:DICTATOR_TYPES[0], 3:DICTATOR_TYPES[1], 4:DICTATOR_TYPES[1], 5:DICTATOR_TYPES[2], 6:DICTATOR_TYPES[3], 7:DICTATOR_TYPES[3], 8:DICTATOR_TYPES[4], 9:DICTATOR_TYPES[5], 10:DICTATOR_TYPES[5], 11:DICTATOR_TYPES[7], 12:DICTATOR_TYPES[7]};
var MATT_STEVENS_GOV_B = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, mods:[], 2:DICTATOR_TYPES[1], 3:DICTATOR_TYPES[1], 4:DICTATOR_TYPES[2], 5:DICTATOR_TYPES[3], 6:DICTATOR_TYPES[4], 7:DICTATOR_TYPES[5], 8:DICTATOR_TYPES[5], 9:DICTATOR_TYPES[6], 10:DICTATOR_TYPES[6], 11:DICTATOR_TYPES[7], 12:DICTATOR_TYPES[7]};
var MATT_STEVENS_GOV_C = {dice:function(world) { return world.uwp.law + flux(); }, min:2, max:12, mods:[], 2:DICTATOR_TYPES[0], 3:DICTATOR_TYPES[0], 4:DICTATOR_TYPES[0], 5:DICTATOR_TYPES[3], 6:DICTATOR_TYPES[3], 7:DICTATOR_TYPES[4], 8:DICTATOR_TYPES[4], 9:DICTATOR_TYPES[4], 10:DICTATOR_TYPES[6], 11:DICTATOR_TYPES[6], 12:DICTATOR_TYPES[6]};
// end Government A, Government B and Government C



function religious(world)
{
	var me = this;
	me.world = world;
	// use tables below to make up a full description
	
	me.churchStateRel = new dice_table(MATT_STEVENS_GOV_D, null, me.world).roll();
	if(me.churchStateRel.substr(0,9) != "Theocracy")
	{
		me.officialGov = new dice_table(GOV_D_OFFICIAL_GOV, null, me.world).roll();
	}
	else
		me.officialGov = false;
	
	if(me.officialGov)
	{
		var temp_officialGov = "Although the world is administered by a religious movement, there is an official government. ";
		if(typeof(me.officialGov.detail) != "string")
			temp_officialGov += new me.officialGov.detail(me.world).toString();
		else
			temp_officialGov += me.officialGov.detail;
		me.officialGov = temp_officialGov;		
	}
	
	me.officialReligion = new religion(me.world);
	
	me.toString = function()
	{
		var s = "The relationship between the religion and political power could be described as " + me.churchStateRel + " ";
		s += (me.officialGov ? me.officialGov : "") + " ";
		s += me.officialReligion;
		return s;
	}
}

var MATT_STEVENS_GOV_D = {dice:function(world) { return world.uwp.law + flux(); }, min:8, max:13, mods:[], 8:"Church guardianship. The Church has been given an explicit role in the world's Constitution. This gives the Church an explicit veto on any policy it dislikes, along with any additional powers it might have.", 9:"Parallel state. The church has a broad independent power base, allowing it in practice to enforce its own laws, veto policies it dislikes, and/or dominate the bureaucracy.",10:"Parallel state. The church has a broad independent power base, allowing it in practice to enforce its own laws, veto policies it dislikes, and/or dominate the bureaucracy.",11:"Parallel state. The church has a broad independent power base, allowing it in practice to enforce its own laws, veto policies it dislikes, and/or dominate the bureaucracy.",12:"Secret society. The government appears to be independent of the Church, at least on paper. In reality, the government is controlled by a religious secret society, like the Templars or the Bavarian Illuminati.  This society may or may not be controlled by the 'official' Church.", 13:"Theocracy. The church (or a charismatic cult) rules directly, without a clear distinction between church and state." };
/* NB: object has two properties, and 'detail' property is either object or string*/
var GOV_D_OFFICIAL_GOV = {dice:function(world) { return world.uwp.law + flux();}, min:8, max:16, mods:[], 8:{type:"Representative Democracy", detail:democracy}, 9:{type:"Unusual",detail:"Government positions may be filled by lot, they may be awarded to contest winners, they may be inherited by the 'reincarnation' of the previous ruler… The GM can use his or her imagination."}, 10:{type:"Monarchy",detail:"A hereditary monarch serves as the nominal head of state. This monarch may legitimate his rule in explicitly religious terms. For example, he may claim to rule with the 'mandate from heaven,' or he may claim to be descended from a god."}, 11:{type:"Monarchy",detail:"A hereditary monarch serves as the nominal head of state. This monarch may legitimate his rule in explicitly religious terms. For example, he may claim to rule with the 'mandate from heaven,' or he may claim to be descended from a god."},12:{type:"Monarchy",detail:"A hereditary monarch serves as the nominal head of state. This monarch may legitimate his rule in explicitly religious terms. For example, he may claim to rule with the 'mandate from heaven,' or he may claim to be descended from a god."},13:{type:"Monarchy",detail:"A hereditary monarch serves as the nominal head of state. This monarch may legitimate his rule in explicitly religious terms. For example, he may claim to rule with the 'mandate from heaven,' or he may claim to be descended from a god."},14:{type:"Military Government",detail:dictator}, 15:{type:"Military Government",detail:dictator}, 16:{type:"One-Party Autocracy",detail:"A right wing, authoritarian political party rules the world, at least on paper."}};

function religion(world)
{
	var me = this;
	me.world = world;
	var churchOrg_tbl = new dice_table(churchOrg, null, me.world);
	me.org = churchOrg_tbl.roll();
	var godView_tbl = new dice_table(godView, null, me.world);
	me.godV = godView_tbl.roll();
	me.godVDigit = godView_tbl.rollResult;
	me.rules = [];
	var numRules = Math.round((me.world.uwp.law-1)/2);
	var rulesTbl = new dice_table(religiousRules);
	var dm = 0;
	for(var i=0;i<numRules;i++)
	{
		rulesTbl.DM = dm;
		me.rules.push(rulesTbl.roll());
		dm += rulesTbl.rollResult;
	}
	var breaking_rules_tbl = new dice_table(breakingRules);
	if(me.godV == gV[6] || me.godV == gV[7])
		breaking_rules_tbl.DM = -4;
	if(me.godV == gV[2] || me.godV == gV[2])
		breaking_rules_tbl.DM = 4;
	me.breakingRulesConsequence = breaking_rules_tbl.roll();
	var afterLifeViewTbl = new dice_table(afterLife, null, me.godVDigit);
	me.afterLifeView = afterLifeViewTbl.roll();
	var secondView = Object.assign({},me.afterLifeView);
	while(secondView.reroll)
	{
		secondView = afterLifeViewTbl.roll();
	}
	if(me.afterLifeView.reroll)
		me.afterLifeView.desc = secondView.desc + " " + me.afterLifeView.desc;
	
	me.toString = function()
	{
		var s = "The religion is organised on a " + me.org.org + " basis. " + me.org.desc;
		s += " Its god view is " + me.godV;
		s += " There are " + me.rules.length + " distinctive rules: ";
		me.rules.map(function(rule) 
							{
								s += rule + ". ";
							});
		s += me.breakingRulesConsequence + " ";
		s += me.afterLifeView.desc;
		return s;
	}
	
}

var churchOrg = {dice:function(world) { return world.uwp.law + flux(); }, min:6, max:14, mods:[], 6:{org:"Congregational", desc:"The church is decentralized, and priests (or 'ministers') are elected by their congregations. These ministers, in turn, may elect a central church assembly."}, 7:{org:"Presbyterian", desc:"The church is decentralized, and priests (or 'ministers') are elected by their congregations, but are responsible to lay 'elders' within the church rather than the congregation as a whole. These ministers, in turn, may elect a central church assembly."}, 8:{org:"Mystery cult", desc:"A highly secretive and centralized cult, only open to a select group of 'initiates.'"}, 9:{org:"Episcopal", desc:"The church is a hierarchical organization, under a Supreme Leader who is elected for life by a college of high priests."}, 10:{org:"Episcopal", desc:"The church is a hierarchical organization, under a Supreme Leader who is elected for life by a college of high priests."}, 11:{org:"Monastic", desc:"Monastic organizations, with minimal contact with the laity, dominate the leadership of a highly decentralized church."}, 12:{org:"Hereditary caste", desc:"A highly decentralized religion, in which ritual duties are reserved for a revered, hereditary caste."}, 13:{org:"Religious dynasty", desc:"The church is a hierarchical organization, under the control of a hereditary leader (possibly a descendant of a god or a revered prophet)."}, 14:{org:"Charismatic", desc:"The church has no formal organization at all. There is simply a single messianic leader and his followers. This leader claims unique insights, powers, or a privileged relationship with God. ", qualifier:function(world) { return dice(1) >= world.uwp.TL ? "The leader claims to be a god. " : "This leader does not claim to be a god."; } } };
var gV = [];
gV[0] = "Animism. Every object (or at least living object) or natural phenomena has a spirit that needs to be honored, or at least placated.";
gV[1] = "Polytheism. There are multiple gods, either arranged in a hierarchy or of more-or-less equal importance.";
gV[2] = "Dualism. There are two mutually antagonistic gods, each representing mutually exclusive 'universal' qualities, such as good and evil, light and darkness, life and death, male and female.";
gV[3] = "Monotheism. There is a single, all-powerful (or nearly all-powerful) divinity.";
gV[4] = "Deism. God created the universe, but takes no part in the daily affairs of His creation.";
gV[5] = "Pantheism. God and the universe are one. 'All is God, and God is All.'";
gV[6] = "Agnosticism. It is impossible to know whether or not there is a God. In any event, it doesn't matter; deliverance from suffering can be achieved with or without His help.";
gV[7] = "Atheism. There is no God or gods, and humans have to rely on their own efforts.";
var godView = {dice:function(world) { return dice(2)-2+world.uwp.TL; }, min:0, max:16, mods:[], 0:gV[0], 1:gV[0], 2:gV[0], 3:gV[1], 4:gV[1], 5:gV[2], 6:gV[2], 7:gV[3], 8:gV[3], 9:gV[3], 10:gV[3], 11:gV[3], 12:gV[4], 13:gV[5], 14:gV[6], 15:gV[6], 16:gV[7]  };
var religiousRules = {dice:function() { return dice(2); }, min:2, max: 72, mods:[], 2:"Photographs, paintings and other 'representational' artworks are prohibited",3:"Prostration before religious icons, symbols or statues is required",4:"Photographs, paintings and other 'representational' artworks are prohibited",5:"Regular ritual bathing is required",6:"Adultery and/or premarital sex is criminalized",7:"Adultery and/or premarital sex is criminalized",8:"Mandatory fasting periods",9:"It is illegal to charge interest",10:"Mandatory fasting periods",11:"Mandatory daily prayer times",12:"Mandatory daily prayer times",13:"Taboos against touching 'dirty' things (such as dead bodies or animals)",14:"All forms of birth control and abortion are outlawed",15:"The giving of alms is required",16:"Mandatory fasting periods",17:"The giving of alms is required",18:"Contact with 'unbelievers' is restricted",19:"There are mandatory 'days of rest,' in which citizens must stay indoors",20:"There are mandatory 'days of rest,' in which citizens must stay indoors",21:"Dancing, singing and/or theater going are prohibited",22:"Dancing, singing and/or theater going are prohibited",23:"Meat-eating is prohibited",24:"Meat-eating is prohibited",25:"Strict (non-vegetarian) dietary rules",26:"Strict (non-vegetarian) dietary rules",27:"Divorce is not available",28:"Divorce is not available",29:"Prohibitions against mentioning dead relatives",30:"Periodic animal sacrifices are required",31:"Killing of animals prohibited",32:"Killing of animals prohibited",33:"No liquor allowed",34:"No liquor allowed",35:"Cutting hair and/or clipping fingernails is prohibited",36:"Cutting hair and/or clipping fingernails is prohibited",37:"Physical violence is prohibited in all circumstances",38:"Physical violence is prohibited in all circumstances",39:"Regular human sacrifices are performed, using criminals, POWs or randomly selected victims",40:"Physical violence is prohibited in all circumstances",41:"Ritual weapons must be carried at all times",42:"Citizens must regularly go to confession and repent for their sins (whether they sinned or not!)",43:"Citizens must regularly go to confession and repent for their sins (whether they sinned or not!)",44:"Certain colors are prohibited (or prescribed) for clothing",45:"Cutting hair and/or clipping fingernails is prohibited",46:"Cutting hair and/or clipping fingernails is prohibited",47:"The brains of the dead are eaten for their knowledge",48:"Certain forms of genital mutilation required",49:"Children are regarded as more 'pure' and given special ritual duties",50:"Men and women are prohibited from looking at each other, or seeing each other privately",51:"Men and women are prohibited from looking at each other, or seeing each other privately",52:"There are taboos against contact with 'high manna' figures",53:"Makeup, 'ostentatious' clothes or other ornamentation is prohibited",54:"Makeup, 'ostentatious' clothes or other ornamentation is prohibited",55:"Advanced technology restricted (reroll if TL 7+)",56:"Advanced technology restricted (reroll if TL 7+)",57:"Women (or men) must be completely covered whenever they venture outdoors",59:"Women (or men) must be completely covered whenever they venture outdoors",60:"It's a crime to look directly at religious leaders",61:"It's a crime to look directly at religious leaders",62:"Citizens are prohibited from seeking non-religious medical services",63:"Citizens are prohibited from seeking non-religious medical services",64:"Sex is completely outlawed",66:"Sex is completely outlawed",67:"Women (or men) must join in sexual congress with religious leaders",68:"Women (or men) must join in sexual congress with religious leaders",69:"Contact with 'unbelievers' is completely outlawed",70:"Contact with 'unbelievers' is completely outlawed",71:"Mass suicide will soon be demanded of all world residents",72:"Mass suicide will soon be demanded of all world residents"};
var breakingRules = {dice:function() { return dice(2); }, min:2, max:15, mods:[], 2:"People who break the rules aren't necessarily 'punished' at all. Worshippers are expected to follow rules out of a desire to be good, rather than out of fear of punishment.",3:"No specific figure is enforcing these rules. It's simply a Law of Nature that bad things will happen to you if you break these rules. If you step in a puddle your feet will get wet; if you eat meat on Friday's you'll explode into flames (or whatever); it's simple physics.",4:"No specific figure is enforcing these rules. It's simply a Law of Nature that bad things will happen to you if you break these rules. If you step in a puddle your feet will get wet; if you eat meat on Friday's you'll explode into flames (or whatever); it's simple physics.",5:"No specific figure is enforcing these rules. It's simply a Law of Nature that bad things will happen to you if you break these rules. If you step in a puddle your feet will get wet; if you eat meat on Friday's you'll explode into flames (or whatever); it's simple physics.",6:"No specific figure is enforcing these rules. It's simply a Law of Nature that bad things will happen to you if you break these rules. If you step in a puddle your feet will get wet; if you eat meat on Friday's you'll explode into flames (or whatever); it's simple physics.",7:"No specific figure is enforcing these rules. It's simply a Law of Nature that bad things will happen to you if you break these rules. If you step in a puddle your feet will get wet; if you eat meat on Friday's you'll explode into flames (or whatever); it's simple physics.",8:"No specific figure is enforcing these rules. It's simply a Law of Nature that bad things will happen to you if you break these rules. If you step in a puddle your feet will get wet; if you eat meat on Friday's you'll explode into flames (or whatever); it's simple physics.",9:"A god (or gods) imposed these rules, and those who break them are defying God's (or the Gods') authority. No excuses are accepted; those who defy the god(s) are punished, regardless of their intentions.",10:"A god (or gods) imposed these rules, and those who break them are defying God's (or the Gods') authority. No excuses are accepted; those who defy the god(s) are punished, regardless of their intentions.",11:"A god (or gods) imposed these rules, and those who break them are defying God's (or the Gods') authority, but God (or the gods) will forgive rule-breakers if they broke their commandments unwittingly, or were coerced into doing so.",12:"A god (or gods) imposed these rules, and those who break them are defying God's (or the Gods') authority, but God (or the gods) will forgive rule-breakers if they broke their commandments unwittingly, or were coerced into doing so.",13:"A god (or gods) imposed these rules, and those who break them are defying God's (or the Gods') authority, but God (or the gods) never laid down any specific 'rules'; their instructions were either very general ('be kind to animals') or very obscure ('those who sow bitter fruit will reap a cruel harvest'). Religious philosophers interpreted these sayings as best they could in an effort to establish specific guidelines.",14:"God or the gods demand devotion and worship, which is far more important than slavish observation of the rules. Rule breaking is frowned upon largely because it shows a lack of devotion.",15:"You cannot get on God's (or the gods') good side simply by following the rules. God has already decided who He likes and who He doesn't. Rule-breaking is seen as a sign that one has 'fallen from grace,' but it isn't a cause of that fall."};
var afterLife = {dice:function(godViewDigit) { return godViewDigit + flux(); }, min:4, max:12, mods:[], 4:{desc:"There is life after death. Most spirits go to the same (fairly unpleasant) underworld, regardless of how their hosts behaved. If someone was denied a proper burial, however, his spirit might stay behind and haunt the living.",reroll:false},5:{desc:"In addition, religious rituals offer the possibility of genuine immortality.",reroll:false},6:{desc:"In addition, religious rituals offer the possibility of genuine immortality.",reroll:false},7:{desc:"There is no life after death -- except for the devout. God or the gods will resurrect the righteous after the coming Apocalypse.",reroll:false},8:{desc:"There is a Heaven and a Hell. Those who behave piously will be accepted into Heaven, while the wicked will go to Hell for an eternity of torment.",reroll:false},9:{desc:"There is a Heaven and a Hell. Those who behave piously will be accepted into Heaven, while the wicked will go to Hell for an eternity of torment.",reroll:false},10:{desc:"There is a Heaven and a Hell. Those who behave piously will be accepted into Heaven, while the wicked will go to Hell, but Hell is only a temporary abode. Eventually even the wicked will be accepted into Heaven (for a just God would not let souls suffer for an eternity).",reroll:false},11:{desc:"Reincarnation: After death, a person's soul is reborn in another body. The just are reborn as powerful humans, spirits or even gods, while the wicked are reborn into 'lower' forms (animals, monsters, demons or what have you).",reroll:false},12:{desc:"Reincarnation: After death, a person's soul is reborn in another body. The just are reborn as powerful humans, spirits or even gods, while the wicked are reborn into 'lower' forms (animals, monsters, demons or what have you).",reroll:false}};
