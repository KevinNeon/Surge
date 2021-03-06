/*
* symbolcolor.js
* Modified version of icons.s
*/
'use strict';

let sc = {};
const fs = require('fs');

function load() {
	fs.readFile('config/symbolcolors.json', 'utf8', function (err, file) {
		if (err) return;
		sc = JSON.parse(file);
	});
}
load();

function updateSC() {
	fs.writeFileSync('config/symbolcolors.json', JSON.stringify(sc));

	let newCss = '/* Symbol Colors START */\n';

	for (let name in sc) {
		newCss += generateCSS(name, sc[name]);
	}
	newCss += '/* Symbol Colors END */\n';

	let file = fs.readFileSync('config/custom.css', 'utf8').split('\n');
	if (~file.indexOf('/* Symbol Colors START */')) file.splice(file.indexOf('/* Symbol Colors START */'), (file.indexOf('/* Symbol Colors END */') - file.indexOf('/* Symbol Colos START */')) + 1);
	fs.writeFileSync('config/custom.css', file.join('\n') + newCss);
	WL.reloadCSS();
}

function generateCSS(name, sc) {
	let css = '';
	let rooms = [];
	name = toId(name);
	Rooms.rooms.forEach((curRoom, id) => {
		if (curRoom.id === 'global' || curRoom.type !== 'chat' || curRoom.isPersonal) return;
		if (!isNaN(Number(id.charAt(0)))) return;
		rooms.push('#' + id + '-userlist-user-' + name + ' em.group');
	});
	css = rooms.join(', ');
	css += '{\ncolor: ' + sc + ';\n}\n';
	return css;
}
exports.commands = {
	symbolcolor: 'sc',
	sc: {
		set: function (target, room, user) {
			if (!this.can('roomowner')) return false;
			target = target.split(',');
			for (let u in target) target[u] = target[u].trim();
			if (target.length !== 2) return this.parse('/help sc');
			if (toId(target[0]).length > 19) return this.errorReply("Usernames are not this long...");
			if (sc[toId(target[0])]) return this.errorReply("This user already has a custom sc.  Do /sc delete [user] and then set their new sc.");
			this.sendReply("|raw|You have given " + WL.nameColor(target[0], true) + " an sc.");
			Monitor.adminlog(target[0] + " has received an symbol color from " + user.name + ".");
			this.privateModCommand("|raw|(" + target[0] + " has recieved sc: <font color='" + target[1] + "'>" + target[1] + "</font> from " + user.name + ".)");
			if (Users(target[0]) && Users(target[0]).connected) Users(target[0]).popup("|html|" + WL.nameColor(user.name, true) + " has set your symbol color to: <font color='" + target[1] + "'>" + target[1] + "</font>.<br><center>Refresh, If you don't see it.</center>");
			sc[toId(target[0])] = target[1];
			updateSC();
		},
		remove: 'delete',
		delete: function (target, room, user) {
			if (!this.can('roomowner')) return false;
			target = toId(target);
			if (!sc[toId(target)]) return this.errorReply('/sc - ' + target + ' does not have an sc.');
			delete sc[toId(target)];
			updateSC();
			this.sendReply("You removed " + target + "'s sc.");
			Monitor.adminlog(user.name + " removed " + target + "'s sc.");
			this.privateModCommand("(" + target + "'s symbol color was removed by " + user.name + ".)");
			if (Users(target) && Users(target).connected) Users(target).popup("|html|" + WL.nameColor(user.name, true) + " has removed your symbol color.");
		},
	},
	 schelp: [
		"Commands Include:",
		"/sc set [user], [color] - Gives [user] an symbol color of color]",
		"/sc delete [user] - Deletes a user's symbol color.",
	],
};
