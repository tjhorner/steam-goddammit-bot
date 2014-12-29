if (typeof String.prototype.startsWith !== 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

Commands = {
	
};

function processChatMessage(src, msg){
	Commands.forEach(function(c){
		if(c.command.test(m.data.content)){
			c.action(m);
		}
	});
}

module.exports = {
	processChatMessage: processChatMessage	
};