var fs = require('fs');

// clear log
fs.writeFile("log.txt", "");

function log(message){
	console.log("[LOG] ".green + message);
	fs.appendFile("log.txt", "[LOG] " + message + "\n", function (err) {
		if(err) console.warn("Couldn't write to log file!");
	});
}

function warn(message){
	console.log("[WARN] ".red + message);
	fs.appendFile("log.txt", "[WARN] " + message + "\n", function (err) {
		if(err) console.warn("Couldn't write to log file!");
	});
}

try{
	var config = require('./config.js');
}catch(e){
	warn('No config.js found, looking for config in STEAMBOT_CONFIG env variable...');
	if(process.env.STEAMBOT_CONFIG){
		var config = JSON.parse(process.env.STEAMBOT_CONFIG);
		log('Found config in STEAMBOT_CONFIG');
	}
}

if (typeof String.prototype.startsWith !== 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

Commands = [];

function findUserByName(name, bot, onMatch){
	for(var id in bot.users){
		var user = bot.users[id];
		if(user.playerName.toLowerCase().startsWith(name.toLowerCase())){
			onMatch(bot.users[id]);
		}
	}
}

function processChatMessage(src, src2, msg, bot){
	if(msg !== ""){
		if(src2 !== undefined){
			log(("[CHAT " + src + "]") + " [" + bot.users[src2].playerName + "] " + msg);
		}else{
			log("[CHAT]" + " [" + bot.users[src].playerName + "] " + msg);
		}
	}
	if(msg.startsWith("!help")){
		bot.sendMessage(src, "---- " + config.botName + " Commands ----");
		Commands.forEach(function(c){
			bot.sendMessage(src, c.params + " - " + c.help);
		});
	}else{
		Commands.forEach(function(c){
			if(c.regex.test(msg)){
				var steamId = src2 !== undefined ? src2 : src;
				try{
					c.action(src, msg, steamId);
				}catch(e){
					bot.sendMessage(src, "You broke something:\n" + e);
					warn("Error in command " + c.params + ": " + e);
				}
				log(bot.users[steamId].playerName + " did command " + c.params);
			}
		});
	}
}

function isElevated(id){
	if(config.elevatedUsers.indexOf(id) !== -1)
		return true;
	return false;
}

function Command(regex, params, help, action){
	Commands.push({regex: regex, action: action, help: help, params: params});
}

function getElevatedUsers(){
	var users = [];
	config.elevatedUsers.forEach(function(id){
		users.push(id);
	});
	return users;
}

function getCommandHelp(separator){
	separator = separator || "\n";
	var separated = "";
	Commands.forEach(function(c){
		separated += c.params + " - " + c.help + separator;
	});
	return separated;
}

module.exports = {
	Command: Command,
	processChatMessage: processChatMessage,
	isElevated: isElevated,
	getElevatedUsers: getElevatedUsers,
	log: log,
	warn: warn,
	getCommandHelp: getCommandHelp,
	ChatErrors: {
		"1": "Success",
		"2": "Room doesn't exist",
		"3": "I'm not allowed to do that",
		"4": "Room is full",
		"5": "Unknown error",
		"6": "I'm banned from that room",
		"7": "I have limited account access (see https://support.steampowered.com/kb_article.php?ref=3330-IAGK-7663)",
		"8": "Clan disabled",
		"9": "I have been community banned",
		"10": "I've been blocked by you",
		"11": "I blocked you",
		"12": "Ranking data was not set",
		"13": "Ranking data was not set",
		"14": "My rank is invalid"
	},
	config: config,
	findUserByName: findUserByName
};