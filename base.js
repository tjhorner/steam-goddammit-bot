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
	warn('No config.js found!');
}

if (typeof String.prototype.startsWith !== 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

Array.prototype.contains = function(k, callback) {
    var self = this;
    return (function check(i) {
        if (i >= self.length) {
            return callback(false);
        }

        if (self[i] === k) {
            return callback(true);
        }

        return process.nextTick(check.bind(null, i+1));
    }(0));
}

Commands = [];

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

module.exports = {
	Command: function(regex, params, help, action){
		Commands.push({regex: regex, action: action, help: help, params: params});
	},
	processChatMessage: processChatMessage,
	isElevated: function(id){
		if(config.elevatedUsers.indexOf(id) !== -1)
			return true;
		return false;
	},
	elevatedUsers: function(bot){
		var users = [];
		config.elevatedUsers.forEach(function(id){
			users.push(id);
		});
		return users;
	},
	log: log,
	warn: warn,
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
	config: config
};