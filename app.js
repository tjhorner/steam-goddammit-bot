var Steam = require('steam');
var fs = require('fs');
var os = require('os');

var app = require('./base.js');
var config = require('./config.js');
var chatRooms = [];

function bashEscape(s){
	return s.replace(/\$/g, "\\$")
	        .replace(/'/g, "\\'")
	        .replace(/"/g, "\\\"");
}

var bot = new Steam.SteamClient();

app.Command(/3/gi, "3", "No", function(src, msg, steamId){
	bot.sendMessage(src, 'NO FUCK YOU');
});

app.Command(/^!trade\b/, "!trade", "Send a trade request", function(src, msg, steamId){
	bot.sendMessage(src, "I can't send trade requests right now, sorry."); // Change this message and uncomment below line if account has unlimited access
	// bot.trade(steamId);
});

app.Command(/^!eval\b/, "!eval [statement]", "Evaluate a statement in the JavaScript V8 engine (only available to elevated users)", function(src, msg, steamId){
	if(app.isElevated(steamId)){
		try{
			bot.sendMessage(src, ("" + eval("" + msg.substr(6))));
		}catch(e){
			bot.sendMessage(src, "You broke something: \n" + e);
		}
	}else{
		bot.sendMessage(src, "You don't have permission to do that!");
	}
});

app.Command(/^!name\b/, "!name [newname]", "Set my name (only available to elevated users)", function(src, msg, steamId){
	if(app.isElevated(steamId)){
		bot.setPersonaName(msg.substr(6));
	}else{
		bot.sendMessage(src, "You don't have permission to do that!");
	}
});

app.Command(/^!myrank\b/, "!myrank", "Gets your rank (elevated or default)", function(src, msg, steamId){
	if(app.isElevated(steamId)){
		bot.sendMessage(src, "elevated");
	}else{
		bot.sendMessage(src, "default");
	}
});

app.Command(/^!status\b/, "!status [Online|Away|Busy|Offline|LookingToTrade|LookingToPlay|Snooze]", "Set my status", function(src, msg, steamId){
	var status = msg.substr(8);
	bot.setPersonaState(Steam.EPersonaState[status] || 1);
});

app.Command(/^!game\b/, "!game [appid]", "Make me play a game (must be free to play)", function(src, msg, steamId){
	bot.gamesPlayed([parseInt(msg.substr(6))]);
});

app.Command(/^!friend\b/, "!friend [steamid]", "Send a friend request to the specified SteamID (please don't abuse this!)", function(src, msg, steamId){
	bot.addFriend(msg.substr(8));
	bot.sendMessage(src, "Attempting to friend " + msg.substr(8));
});

app.Command(/^!myid\b/, "!id", "Shows the SteamID of yourself and, if in a chat room, the current room you are in", function(src, msg, steamId){
	bot.sendMessage(src, "Your SteamID is " + steamId);
	if(src !== steamId){
		bot.sendMessage(src, "This chat room's SteamID is " + src);
	}
});

app.Command(/node.js/gi, "node.js", "The only real dev language", function(src, msg, steamId){
	bot.sendMessage(src, "Node.js is the only real dev language");
});

fs.readFile('.sentry', function(e, d){
	if(e){
		console.warn("No sentry file found, you may need to use a SteamGuard code.");
		bot.logOn({
			accountName: config.steamUsername,
			password: config.steamPassword
		});
	}else{
		bot.logOn({
			accountName: config.steamUsername,
			password: config.steamPassword,
			shaSentryfile: d
		});
	}
});

bot.on('loggedOn', function(){
	console.log("Successfully logged in! Clearing Steam password from config...");
	config.steamPassword = null;
	bot.setPersonaState(Steam.EPersonaState.Online);
	bot.setPersonaName(config.botName); // You may want to comment this out if you're restarting a lot.
	console.log("Joining bot community chat...");
	bot.joinChat(config.communityChatId);
});

bot.on('sentry', function(s){
	fs.writeFile('.sentry', s);
});

bot.on('message', function(source, message, type, chatter){
	app.processChatMessage(source, chatter, message, bot);
});

bot.on('chatInvite', function(chatId, chatName, inviterId){
	bot.joinChat(chatId);
	console.log("Joining chat room " + chatId + " (" + chatName + ")");
	bot.sendMessage(inviterId, "Joining " + chatName + "...");
	chatRooms[chatId] = inviterId;
});

bot.on('friend', function(steamId, relation){
	switch(relation){
		case Steam.EFriendRelationship.PendingInvitee:
			bot.addFriend(steamId);
			setTimeout(function(){
				var newFriend = bot.users[steamId].playerName;
				bot.sendMessage(steamId, "Hi " + newFriend + "! I'm " + config.botName + ". I can do many things. Type !help for more info.");
				console.log("New friend! " + steamId + " (" + newFriend + ")");
				// exec('notify-send "' + bashEscape('New Friend!') + '" "' + bashEscape(newFriend) + '"');
			}, 2000);
			break;
	}
});

bot.on('chatEnter', function(chatId, response){
	if(response !== 1){
		console.warn("Could not join " + chatId + "! Error code " + response);
		bot.sendMessage(chatRooms[chatId], "Couldn't enter chat room: " + app.ChatErrors[String(response)]);
		chatRooms[chatId] = "";
	}else{
		console.log("Joined chat room " + chatId);
		bot.sendMessage(chatId, "\n" + config.botName + " online with Node.js " + process.version + ".\nBuilt by TJ Horner. (http://horner.tj/hello)\nType !help for help.");
	}
});