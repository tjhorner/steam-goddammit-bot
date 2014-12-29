var config = require('./config.js');

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
	if(msg.startsWith("!help")){
		bot.sendMessage(src, "---- " + config.botName + " Commands ----");
		Commands.forEach(function(c){
			bot.sendMessage(src, c.params + " - " + c.help);
		});
	}else{
		Commands.forEach(function(c){
			if(c.regex.test(msg)){
				if(src2 !== undefined){
					c.action(src, msg, src2);
				}else{
					c.action(src, msg, src);
				}
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
	}
};