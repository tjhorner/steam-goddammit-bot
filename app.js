var app = require('./base.js'),
	Steam = require('steam'),
	os = require('os'),
	fs = require('fs'),
	colors = require('colors'),
	express = require('express')(),
	mustache = require('mustache');

var pageTemplate = "<h1>{{botName}} is online!</h1>Running node.js version {{nodeVersion}}" +
				   "<h2>Commands</h2>{{{commands}}}" +
				   "{{#communityGroupId}}<h2>Community</h2><a href='http://steamcommunity.com/groups/{{communityGroupId}}'>{{botName}} Steam Group</a>{{/communityGroupId}}";

var chatRooms = [];

if (typeof String.prototype.startsWith !== 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

function bashEscape(s){
	return s.replace(/\$/g, "\\$")
	        .replace(/'/g, "\\'")
	        .replace(/"/g, "\\\"");
}

var bot = new Steam.SteamClient();

// app.Command(/3/gi, "3", "No", function(src, msg, steamId){
// 	bot.sendMessage(src, 'NO FUCK YOU');
// });

app.Command(/^!bcast\b/, "!bcast [message]", "Broadcast a message to all encountered users (only available to elevated users)", function(src, msg, steamId){
	if(app.isElevated(steamId)){
		var users = 0;
		for(var id in bot.users) {
			users++;
			bot.sendMessage(id, msg.substr(7));
			app.log("Sent broadcast message to " + bot.users[id].playerName + " (" + id + ")");
		}
		app.log("Finished sending broadcast message to " + users + " users.");
	}else{
		bot.sendMessage(src, "You don't have permission to do that!");
	}
});

app.Command(/^!tell\b/, "!tell [steamid] [message]", "Tell a user something (only available to elevated users)", function(src, msg, steamId){
	if(app.isElevated(steamId)){
		var args = msg.substr(6).split(" ");
		if(args.length < 2){
			bot.sendMessage(src, "This command requires 2 arguments!");
			return;
		}
		var id = args[0];
		args[0] = "";
		bot.sendMessage(id, args.join(" ").trim());
		bot.sendMessage(src, "Sending message to " + id);
	}else{
		bot.sendMessage(src, "You don't have permission to do that!");
	}
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

app.Command(/^!myid\b/, "!myid", "Shows the SteamID of yourself and, if in a chat room, the current room you are in", function(src, msg, steamId){
	bot.sendMessage(src, "Your SteamID is " + steamId);
	if(src !== steamId){
		bot.sendMessage(src, "This chat room's SteamID is " + src);
	}
});

app.Command(/^!lookup\b/, "!lookup [partial username]", "Find a user's SteamID by the first part of their username (I must have met them as a friend or in a group chat)", function(src, msg, steamId){
	app.findUserByName(msg.substr(8), bot, function(user){
		bot.sendMessage(src, "\nMatch:\nUsername: " + user.playerName + "\nSteamID: " + user.friendid);
	});
});

app.Command(/^!elevatedusers\b/, "!elevatedusers", "Get the profile URLs of current elevated users.", function(src, msg, steamId){
	var message = "\nProfile URLs of elevated users:";
	app.getElevatedUsers().forEach(function(user){
		message += "\nhttp://steamcommunity.com/profiles/" + user;
	});
	bot.sendMessage(src, message);
});

app.Command(/node.js/gi, "node.js", "The only real dev language", function(src, msg, steamId){
	bot.sendMessage(src, "Node.js is the only real dev language");
});

fs.readFile('.sentry', function(e, d){
	if(e){
		app.warn("No sentry file found, you may need to use a SteamGuard code.");
		bot.logOn({
			accountName: app.config.steamUsername,
			password: app.config.steamPassword
		});
	}else{
		bot.logOn({
			accountName: app.config.steamUsername,
			password: app.config.steamPassword,
			shaSentryfile: d
		});
	}
});

bot.on('loggedOn', function(){
	app.log("Successfully logged in! Clearing Steam password from app.config...");
	app.config.steamPassword = null;
	bot.setPersonaState(Steam.EPersonaState.Online);
	bot.setPersonaName(app.config.botName); // You may want to comment this out if you're restarting a lot.
	app.log("Joining bot community chat...");
	bot.joinChat(app.config.communityChatId);
});

bot.on('sentry', function(s){
	fs.writeFile('.sentry', s);
});

bot.on('message', function(source, message, type, chatter){
	app.processChatMessage(source, chatter, message, bot);
});

bot.on('chatInvite', function(chatId, chatName, inviterId){
	bot.joinChat(chatId);
	app.log("Joining chat room " + chatId + " (" + chatName + ")");
	bot.sendMessage(inviterId, "Joining " + chatName + "...");
	chatRooms[chatId] = inviterId;
});

bot.on('friend', function(steamId, relation){
	switch(relation){
		case Steam.EFriendRelationship.PendingInvitee:
			bot.addFriend(steamId);
			setTimeout(function(){
				var newFriend = bot.users[steamId].playerName;
				bot.sendMessage(steamId, "Hi " + newFriend + "! I'm " + app.config.botName + ". I can do many things. Type !help for more info.");
				app.log("New friend! " + steamId + " (" + newFriend + ")");
				// exec('notify-send "' + bashEscape('New Friend!') + '" "' + bashEscape(newFriend) + '"');
			}, 2000);
			break;
	}
});

bot.on('chatEnter', function(chatId, response){
	if(response !== 1){
		app.warn("Could not join " + chatId + "! Error code " + response);
		bot.sendMessage(chatRooms[chatId], "Couldn't enter chat room: " + app.ChatErrors[String(response)]);
		chatRooms[chatId] = "";
	}else{
		app.log("Joined chat room " + chatId);
		bot.sendMessage(chatId, "\n" + app.config.botName + " online with Node.js " + process.version + ".\nBuilt by TJ Horner. (http://horner.tj/hello)\nType !help for help.");
	}
});

express.get('/', function(req, res){
	res.send(mustache.render(pageTemplate, { botName: app.config.botName,
											 commands: app.getCommandHelp("<br>"),
											 communityGroupId: app.config.communityGroupId,
											 nodeVersion: process.version }));
});

var server = express.listen(parseInt(process.env.ENV_PORT) || 3000, function(){
	app.log("Web server is up and running");
});