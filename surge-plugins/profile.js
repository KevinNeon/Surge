'use strict';

let geoip = require('geoip-lite-country');
let serverIp = Config.serverIp;

function isVIP(user) {
	if (!user) return;
	if (typeof user === 'object') user = user.userid;
	let vip = Db.vips.get(toId(user));
	if (vip === 1) return true;
	return false;
}

function isDev(user) {
	if (!user) return;
	if (typeof user === 'object') user = user.userid;
	let dev = Db.devs.get(toId(user));
	if (dev === 1) return true;
	return false;
}

function showTitle(userid) {
	userid = toId(userid);
	if (Db.customtitles.has(userid)) {
		return '<font color="' + Db.customtitles.get(userid)[1] +
			'">(<b>' + Db.customtitles.get(userid)[0] + '</b>)</font>';
	}
	return '';
}

function devCheck(user) {
	if (isDev(user)) return '<font color="#009320">(<b>Developer</b>)</font>';
	return '';
}

function vipCheck(user) {
	if (isVIP(user)) return '<font color="#6390F0">(<b>VIP User</b>)</font>';
	return '';
}

function showBadges(user) {
	if (Db.userBadges.has(toId(user))) {
		let badges = Db.userBadges.get(toId(user));
		let css = 'border:none;background:none;padding:0;';
		if (typeof badges !== 'undefined' && badges !== null) {
			let output = '<td><div style="float: right; background: rgba(69, 76, 80, 0.4); text-align: center; border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset; margin: 0px 3px;">';
			output += ' <table style="' + css + '"> <tr>';
			for (let i = 0; i < badges.length; i++) {
				if (i !== 0 && i % 4 === 0) output += '</tr> <tr>';
				output += '<td><button style="' + css + '" name="send" value="/badges info, ' + badges[i] + '">' +
				'<img src="' + Db.badgeData.get(badges[i])[1] + '" height="16" width="16" alt="' + badges[i] + '" title="' + badges[i] + '" >' + '</button></td>';
			}
			output += '</tr> </table></div></td>';
			return output;
		}
	}
	return '';
}

//Stored up here for a later chance to make the Last Active command
function lastActive(user) {
	if (!Users(user)) return false;
	user = Users(user);
	return (user && user.lastMessageTime ? Chat.toDurationString(Date.now() - user.lastMessageTime, {precision: true}) : "hasn't talked yet");
}

exports.commands = {
	vip: {
		give: function (target, room, user) {
			if (!this.can('declare')) return false;
			if (!target) return this.parse('/help', true);
			let vipUsername = toId(target);
			if (vipUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (isVIP(vipUsername)) return this.errorReply(vipUsername + " is already a VIP user.");
			Db.vips.set(vipUsername, 1);
			this.sendReply("|html|" + WL.nameColor(vipUsername, true) + " has been given VIP status.");
			if (Users.get(vipUsername)) Users(vipUsername).popup("|html|You have been given VIP status by " + WL.nameColor(user.name, true) + ".");
		},
		take: function (target, room, user) {
			if (!this.can('declare')) return false;
			if (!target) return this.parse('/help', true);
			let vipUsername = toId(target);
			if (vipUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (!isVIP(vipUsername)) return this.errorReply(vipUsername + " isn't a VIP user.");
			Db.vips.remove(vipUsername);
			this.sendReply("|html|" + WL.nameColor(vipUsername, true) + " has been demoted from VIP status.");
			if (Users.get(vipUsername)) Users(vipUsername).popup("|html|You have been demoted from VIP status by " + WL.nameColor(user.name, true) + ".");
		},
		users: 'list',
		list: function (target, room, user) {
			if (!Db.vips.keys().length) return this.errorReply('There seems to be no user with VIP status.');
			let display = [];
			Db.vips.keys().forEach(vipUser => {
				display.push(WL.nameColor(vipUser, (Users(vipUser) && Users(vipUser).connected)));
			});
			this.popupReply('|html|<b><u><font size="3"><center>VIP Users:</center></font></u></b>' + display.join(','));
		},
		'': 'help',
		help: function (target, room, user) {
			this.sendReplyBox(
				'<div style="padding: 3px 5px;"><center>' +
				'<code>/vip</code> commands.<br />These commands are nestled under the namespace <code>vip</code>.</center>' +
				'<hr width="100%">' +
				'<code>give [username]</code>: Gives <code>username</code> VIP status. Requires: & ~' +
				'<br />' +
				'<code>take [username]</code>: Takes <code>username</code>\'s VIP status. Requires: & ~' +
				'<br />' +
				'<code>list</code>: Shows list of users with VIP Status' +
				'</div>'
			);
		},
	},
	favoritetype: {
		add: "set",
		set: function (target, room, user) {
		   let type = target.toLowerCase();
			if (!target) return this.parse("/help favoritetype");
			if (!['grass', 'fire', 'water', 'poison', 'ground', 'rock', 'bug', 'electric', 'ice', 'ghost', 'psychic', 'dragon', 'dark', 'fairy', 'steel', 'flying', 'normal', 'fighting'].includes(type)) return this.sendReply('Valid types are: fire, water, grass, electric, normal, fighting, rock, ice, ground, dragon, fairy, psychic, ghost, dark, flying, poison, steel and bug.');
			Db.type.set(user.userid, type);
			this.sendReply("You have successfully set your Favorite Type onto your profile.");
		},

		del: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			if (!Db.type.has(user.userid)) return this.errorReply("Your favorite Type hasn't been set.");
			Db.type.remove(user.userid);
			return this.sendReply("Your favorite Type has been deleted from your profile.");
		},

		"": "help",
		help: function (target, room, user) {
			this.parse('/help favoritetype');
		},
	},
	favoritetypehelp: [
		"/favoritetype set [Type] - Sets your Favorite Type.",
		"/favoritetype delete - Removes your Favorite Type.",
	],
	music: {
	    add: "set",
	    give: "set",
	    set: function (target, room, user) {
	        if (!this.can('lock')) return false;
	        let parts = target.split(',');
	        let targ = parts[0].toLowerCase().trim();
	        if (!parts[2]) return this.errorReply('/help music');
	        let link = parts[1].trim();
	        let title = parts[2].trim();
	        Db.music.set([targ, 'link'], link);
	        Db.music.set([targ, 'title'], title);
	        this.sendReply(targ + '\'s song has been set to: ');
	        this.parse('/profile ' + targ);
	    },

	    take: "delete",
	    remove: "delete",
	    delete: function (target, room, user) {
	        if (!this.can('lock')) return false;
	        let targ = target.toLowerCase();
	        if (!target) return this.parse('/help music');
	        if (!Db.music.has(targ)) return this.errorReply('This user does not have any music on their profile.');
	        Db.music.remove(targ);
	        this.sendReply('This user\'s profile music has been deleted.');
	    },
	    '': 'help',
	    help: function (target, room, user) {
	        this.parse('/help music');
	    },
	},
	musichelp: [
	    "/music set [user], [link], [title of song] - Sets a user's profile music. Requires % and up.",
	    "/music take [user] - Removes a user's profile music. Requires % and up.",
	    ],
	pbg: 'profilebackground',
	profilebackground: {
	    add: 'set',
	    set: function (target, room, user) {
	        if (!Db.haspbg.has(user)) return this.errorReply('You don\'t have ability to set your profile background. Buy the profile background item from shop.');
	        let img = target;
	        if (!img) return this.parse('/pbg help');
	        Db.profilebg.set(user, img);
	        Db.haspbg.remove(user);
	        this.sendReply('You have set your profile background to: ');
	        this.parse('/profile');
	    },
	    remove: 'delete',
	    delete: function (target, room, user) {
	        if (!this.can('ban')) return false;
	        Db.profilebg.remove(target);
	        this.sendReply('You have removed ' + target + '\'s profile background due to');
	        this.parse('/tell ' + target + ', Your profile background has been deleted by ' + WL.nameColor(user, true) + '');
	    },
	    give: function (target, user, room) {
	        if (!this.can('eval')) return this.errorReply('Access Denied');
	        let targetUser = target;
	        if (!target) return this.parse('/pbg help');
	        Db.haspbg.set(targetUser, 1);
	        this.sendReply('You have given ' + targetUser + ' ability to set profile background.');
	        Users(targetUser).popup('You have been given ability to set your profile background.');
	    },
	    take: function (target, user, room) {
	        if (!this.can('eval')) return this.errorReply('access denied');
	        let targetUser = target;
	        if (!target) return this.parse('/pbg help');
	        Db.haspbg.remove(targetUser);
	        this.sendReply('You have taken ' + targetUser + '\'s ability of setting his own profile background');
	        Users(targetUser).popup('Your ability to set your profile background has been taken by ' + WL.nameColor(user, true) + '.');
	    },
	    '': 'help',
	    help: function (target, user, room) {
	        if (!this.runBroadcast()) return;
	        this.sendReplyBox(
	            '<center><b>All commands is nestled under namespace <code>pbg</code></center>' +
	            '<hr width="80%">' +
	            '<code>set [ImageLink]</code> - Set your profile background. (You need to buy item from shop before setting).<br>' +
	            '<code>delete [user]</code>- Remove use\'s profile background. Requires @ or higher.<br>' +
	            '<code>give [user] </code>- give a user ability to set profile background.<br>' +
	            '<code>take [user] </code>- take user\'s ability to set their profile background. Requires @ or higher.<br>' +
	            '<code>help </code>- Displays this command.'
	            );
	    },
	},
	pteam: 'profileteam',
	profileteam: {
		add: 'set',
		set: function (target, room, user) {
			if (!Db.hasteam.has(user.userid)) return this.errorReply('You don\'t have access to edit your team.');
			if (!target) return this.parse('/profileteam help');
			let parts = target.split(',');
			let mon = parts[1].trim();
			let slot = parts[0];
			if (!parts[1]) return this.parse('/profileteam help');
			let acceptable = ['one', 'two', 'three', 'four', 'five', 'six'];
			if (!acceptable.includes(slot)) return this.parse('/profileteam help');
			if (slot === 'one' || slot === 'two' || slot === 'three' || slot === 'four' || slot === 'five' || slot === 'six') {
				Db.teams.set([user.userid, slot], mon);
				this.sendReply('You have added this pokemon to your team.');
			}
		},
		give: function (target, room, user) {
			if (!this.can('broadcast')) return false;
			if (!target) return this.parse('/profileteam help');
			let targetId = toId(target);
			Db.hasteam.set(targetId, 1);
			this.sendReply(target + ' has been given the ability to set their team.');
			Users(target).popup('You have been given the ability to set your profile team.');
		},
		take: function (target, room, user) {
			if (!this.can('broadcast')) return false;
			if (!target) return this.parse('/profileteam help');
			if (!Db.hasteam.has(user)) return this.errorReply('This user does not have the ability to set their team.');
			Db.hasteam.remove(user);
			this.sendReply('This user has had their ability to change their team away.');
		},
		help: function (target, room, user) {
			if (!this.runBroadcast()) return;
			this.sendReplyBox(
				'<center><strong>Profile Team Commands</strong><br>' +
				'All commands are nestled under namespace <code>pteam</code></center><br>' +
				'<hr width="100%">' +
				'<code>add (slot), (dex number)</code>: The dex number must be the actual dex number of the pokemon you want.<br>' +
				'Slot - we mean what slot you want the pokemon to be. valid entries for this are: one, two, three, four, five, six.<br>' +
				'Chosing the right slot is crucial because if you chose a slot that already has a pokemon, it will overwrite that data and replace it. This can be used to replace / reorder what pokemon go where.<br>' +
				'If the Pokemon is in the first 99 Pokemon, do 0(number), and for Megas do (dex number)-m, -mx for mega x, -my for mega y.<br>' +
				'For example: Mega Venusaur would be 003-m<br>' +
				'<code>give</code>: Global staff can give user\'s ability to set their own team.<br>' +
				'<code>take</code>: Global staff can take user\'s ability to set their own team.<br>' +
				'<code>help</code>: Displays this command.'
			);
		},
	},
	dev: {
		give: function (target, room, user) {
			if (!this.can('declare')) return false;
			if (!target) return this.parse('/help', true);
			let devUsername = toId(target);
			if (devUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (isDev(devUsername)) return this.errorReply(devUsername + " is already a DEV user.");
			Db.devs.set(devUsername, 1);
			this.sendReply('|html|' + WL.nameColor(devUsername, true) + " has been given DEV status.");
			if (Users.get(devUsername)) Users(devUsername).popup("|html|You have been given DEV status by " + WL.nameColor(user.name, true) + ".");
		},
		take: function (target, room, user) {
			if (!this.can('declare')) return false;
			if (!target) return this.parse('/help', true);
			let devUsername = toId(target);
			if (devUsername.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
			if (!isDev(devUsername)) return this.errorReply(devUsername + " isn't a DEV user.");
			Db.devs.remove(devUsername);
			this.sendReply("|html|" + WL.nameColor(devUsername, true) + " has been demoted from DEV status.");
			if (Users.get(devUsername)) Users(devUsername).popup("|html|You have been demoted from DEV status by " + WL.nameColor(user.name, true) + ".");
		},
		users: 'list',
		list: function (target, room, user) {
			if (!Db.devs.keys().length) return this.errorReply('There seems to be no user with DEV status.');
			let display = [];
			Db.devs.keys().forEach(devUser => {
				display.push(WL.nameColor(devUser, (Users(devUser) && Users(devUser).connected)));
			});
			this.popupReply('|html|<b><u><font size="3"><center>DEV Users:</center></font></u></b>' + display.join(','));
		},
		'': 'help',
		help: function (target, room, user) {
			this.sendReplyBox(
				'<div style="padding: 3px 5px;"><center>' +
				'<code>/dev</code> commands.<br />These commands are nestled under the namespace <code>dev</code>.</center>' +
				'<hr width="100%">' +
				'<code>give [username]</code>: Gives <code>username</code> DEV status. Requires: & ~' +
				'<br />' +
				'<code>take [username]</code>: Takes <code>username</code>\'s DEV status. Requires: & ~' +
				'<br />' +
				'<code>list</code>: Shows list of users with DEV Status' +
				'</div>'
			);
		},
	},
	title: 'customtitle',
	customtitle: {
		set: 'give',
		give: function (target, room, user) {
			if (!this.can('declare')) return false;
			target = target.split(',');
			if (!target || target.length < 3) return this.parse('/help', true);
			let userid = toId(target[0]);
			let targetUser = Users.getExact(userid);
			let title = target[1].trim();
			if (Db.customtitles.has(userid) && Db.titlecolors.has(userid)) {
				return this.errorReply(userid + " already has a custom title.");
			}
			let color = target[2].trim();
			if (color.charAt(0) !== '#') return this.errorReply("The color needs to be a hex starting with '#'.");
			Db.customtitles.set(userid, [title, color]);
			if (Users.get(targetUser)) {
				Users(targetUser).popup(
					'|html|You have recieved a custom title from ' + WL.nameColor(user.name, true) + '.' +
					'<br />Title: ' + showTitle(toId(targetUser)) +
					'<br />Title Hex Color: ' + color
				);
			}
			this.logModCommand(user.name + " set a custom title to " + userid + "'s profile.");
			Monitor.adminlog(user.name + " set a custom title to " + userid + "'s profile.");
			return this.sendReply("Title '" + title + "' and color '" + color + "' for " + userid + "'s custom title have been set.");
		},
		take: 'remove',
		remove: function (target, room, user) {
			if (!this.can('declare')) return false;
			if (!target) return this.parse('/help', true);
			let userid = toId(target);
			if (!Db.customtitles.has(userid) && !Db.titlecolors.has(userid)) {
				return this.errorReply(userid + " does not have a custom title set.");
			}
			Db.titlecolors.remove(userid);
			Db.customtitles.remove(userid);
			if (Users.get(userid)) {
				Users(userid).popup(
					'|html|' + WL.nameColor(user.name, true) + " has removed your custom title."
				);
			}
			this.logModCommand(user.name + " removed " + userid + "'s custom title.");
			Monitor.adminlog(user.name + " removed " + userid + "'s custom title.");
			return this.sendReply(userid + "'s custom title and title color were removed from the server memory.");
		},
		'': 'help',
		help: function (target, room, user) {
			if (!user.autoconfirmed) return this.errorReply("You need to be autoconfirmed to use this command.");
			if (!this.canTalk()) return this.errorReply("You cannot do this while unable to talk.");
			if (!this.runBroadcast()) return;
			return this.sendReplyBox(
				'<center><code>/customtitle</code> commands<br />' +
				'All commands are nestled under the namespace <code>customtitle</code>.</center>' +
				'<hr width="100%">' +
				'- <code>[set|give] [username], [title], [hex color]</code>: Sets a user\'s custom title. Requires: & ~' +
				'- <code>[take|remove] [username]</code>: Removes a user\'s custom title and erases it from the server. Requires: & ~'
			);
		},
	},
	pokemon: {
		add: "set",
		set: function (target, room, user) {
			if (!target) return this.parse("/pokemon help");
			let pkmn = Dex.getTemplate(target);
			if (!pkmn.exists) return this.errorReply('Not a Pokemon. Check your spelling?');
			Db.pokemon.set(user.userid, pkmn.species);
			return this.sendReply("You have successfully set your Pokemon onto your profile.");
		},

		del: "delete",
		remove: "delete",
		delete: function (target, room, user) {
			if (!Db.pokemon.has(user.userid)) return this.errorReply("Your favorite Pokemon hasn't been set.");
			Db.pokemon.remove(user.userid);
			return this.sendReply("Your favorite Pokemon has been deleted from your profile.");
		},

		"": "help",
		help: function (target, room, user) {
			this.parse('/help pokemon');
		},
	},
	pokemonhelp: ['/pokemon set [name] - set your favorite pokemon',
	'/pokemon delete - delete your favorite pokemon.',
	],

	fc: 'friendcode',
	friendcode: {
		add: 'set',
		set: function (target, room, user) {
			if (room.battle) return this.errorReply("Please use this command outside of battle rooms.");
			if (!user.autoconfirmed) return this.errorReply("You must be autoconfirmed to use this command.");
			if (!target) return this.parse('/help', true);
			let fc = target;
			fc = fc.replace(/-/g, '');
			fc = fc.replace(/ /g, '');
			if (isNaN(fc)) {
				return this.errorReply("Your friend code needs to contain only numerical characters.");
			}
			if (fc.length < 12) return this.errorReply("Your friend code needs to be 12 digits long.");
			fc = fc.slice(0, 4) + '-' + fc.slice(4, 8) + '-' + fc.slice(8, 12);
			Db.friendcodes.set(toId(user), fc);
			return this.sendReply("Your friend code: " + fc + " has been saved to the server.");
		},
		remove: 'delete',
		delete: function (target, room, user) {
			if (room.battle) return this.errorReply("Please use this command outside of battle rooms.");
			if (!user.autoconfirmed) return this.errorReply("You must be autoconfirmed to use this command.");
			if (!target) {
				if (!Db.friendcodes.has(toId(user))) return this.errorReply("Your friend code isn't set.");
				Db.friendcodes.remove(toId(user));
				return this.sendReply("Your friend code has been deleted from the server.");
			} else {
				if (!this.can('lock')) return false;
				let userid = toId(target);
				if (!Db.friendcodes.has(userid)) return this.errorReply(userid + " hasn't set a friend code.");
				Db.friendcodes.remove(userid);
				return this.sendReply(userid + "'s friend code has been deleted from the server.");
			}
		},
		'': 'help',
		help: function (target, room, user) {
			if (room.battle) return this.errorReply("Please use this command outside of battle rooms.");
			if (!user.autoconfirmed) return this.errorReply("You must be autoconfirmed to use this command.");
			return this.sendReplyBox(
				'<center><code>/friendcode</code> commands<br />' +
				'All commands are nestled under the namespace <code>friendcode</code>.</center>' +
				'<hr width="100%">' +
				'<code>[add|set] [code]</code>: Sets your friend code. Must be in the format 111111111111, 1111 1111 1111, or 1111-1111-1111.' +
				'<br />' +
				'<code>[remove|delete]</code>: Removes your friend code. Global staff can include <code>[username]</code> to delete a user\'s friend code.' +
				'<br />' +
				'<code>help</code>: Displays this help command.'
			);
		},
	},
	'!profile': true,
	profile: function (target, room, user) {
		target = toId(target);
		if (!target) target = user.name;
		if (target.length > 18) return this.errorReply("Usernames cannot exceed 18 characters.");
		if (!this.runBroadcast()) return;
		let self = this;
		let targetUser = Users.get(target);
		let online = (targetUser ? targetUser.connected : false);
		let username = (targetUser ? targetUser.name : target);
		let userid = (targetUser ? targetUser.userid : toId(target));
		let avatar = (targetUser ? (isNaN(targetUser.avatar) ? "http://" + serverIp + ":" + Config.port + "/avatars/" + targetUser.avatar : "http://play.pokemonshowdown.com/sprites/trainers/" + targetUser.avatar + ".png") : (Config.customavatars[userid] ? "http://" + serverIp + ":" + Config.port + "/avatars/" + Config.customavatars[userid] : "http://play.pokemonshowdown.com/sprites/trainers/1.png"));
		if (targetUser && targetUser.avatar[0] === '#') avatar = 'http://play.pokemonshowdown.com/sprites/trainers/' + targetUser.avatar.substr(1) + '.png';
		let userSymbol = (Users.usergroups[userid] ? Users.usergroups[userid].substr(0, 1) : "Regular User");
		let userGroup = (Config.groups[userSymbol] ? 'Global ' + Config.groups[userSymbol].name : "Regular User");
		showProfile();

		function getLastSeen(userid) {
			if (Users(userid) && Users(userid).connected) return '<font color = "limegreen"><strong>Currently Online</strong></font>';
			let seen = Db.seen.get(userid);
			if (!seen) return '<font color = "red"><strong>Never</strong></font>';
			return Chat.toDurationString(Date.now() - seen, {precision: true}) + " ago.";
		}
		function getFlag(userid) {
			let ip = (Users(userid) ? geoip.lookup(Users(userid).latestIp) : false);
			if (!ip || ip === null) return '';
			return '<img src="http://flags.fmcdn.net/data/flags/normal/' + ip.country.toLowerCase() + '.png" alt="' + ip.country + '" title="' + ip.country + '" width="20" height="10">';
		}
		function showTeam(user) {
			let teamcss = 'float:center;border:none;background:none;';

			let noSprite = '<img src=http://play.pokemonshowdown.com/sprites/bwicons/0.png>';
			let one = Db.teams.get([user, 'one']);
			let two = Db.teams.get([user, 'two']);
			let three = Db.teams.get([user, 'three']);
			let four = Db.teams.get([user, 'four']);
			let five = Db.teams.get([user, 'five']);
			let six = Db.teams.get([user, 'six']);
			if (Db.teams.has(user)) return '<div style="' + teamcss + '" >' + noSprite + noSprite + noSprite + noSprite + noSprite + noSprite + '</div>';

			function iconize(link) {
				return '<button id="kek" style="background:transparent;border:none;"><img src="https://serebii.net/pokedex-sm/icon/' + link + '.png"></button>';
			}
			//return '<div style="' + teamcss + '">' + '<br>' + iconize(one) + iconize(two) + iconize(three) + '<br>' + iconize(four) + iconize(five) + iconize(six) + '</div>';*/
			let teamDisplay = '<center><div style="' + teamcss + '">';
			if (Db.teams.has([user, 'one'])) {
				teamDisplay += iconize(one);
			} else {
				teamDisplay += noSprite;
			}
			if (Db.teams.has([user, 'two'])) {
				teamDisplay += iconize(two);
			} else {
				teamDisplay += noSprite;
			}
			if (Db.teams.has([user, 'three'])) {
				teamDisplay += iconize(three);
			} else {
				teamDisplay += noSprite;
			}
			if (Db.teams.has([user, 'four'])) {
				teamDisplay += iconize(four);
			} else {
				teamDisplay += noSprite;
			}
			if (Db.teams.has([user, 'five'])) {
				teamDisplay += iconize(five);
			} else {
				teamDisplay += noSprite;
			}
			if (Db.teams.has([user, 'six'])) {
				teamDisplay += iconize(six);
			} else {
				teamDisplay += noSprite;
			}

			teamDisplay += '</div></center>';
			return teamDisplay;
		}
		function song(user) {
		    let song = Db.music.get([user, 'link']);
		    let title = Db.music.get([user, 'title']);
		    if (Db.music.has(user)) return '';
		    return '<acronym title="' + title + '"><br /><audio src="' + song + '" controls="" style="width:100%;"></audio></acronym>';
		}

		function showProfile() {
			Economy.readMoney(toId(username), currency => {
				let profile = '';
				profile += '<div style="background: url(' + Db.profilebg.get(toId(username)) + '); background-size: cover">' + showBadges(toId(username));
				profile += '<img src="' + avatar + '" height="80" width="80" align="left">';
				profile += '&nbsp;<font color="#24678d"><b>Name:</b></font> ' + WL.nameColor(username, true) + '&nbsp;' + getFlag(toId(username)) + ' ' + showTitle(username) + '<br />';
				profile += '&nbsp;<font color="#24678d"><b>Group:</b></font> ' + userGroup + ' ' + devCheck(username) + vipCheck(username) + '<br />';
				profile += '&nbsp;<font color="#24678d"><b>' + global.currencyPlural + ':</b></font> ' + currency + '<br />';
				if (Db.pokemon.has(toId(username))) {
					profile += '&nbsp;<font color="#24678d"><strong>Favorite Pokemon:</strong></font> ' + Db.pokemon.get(toId(username)) + '<br />';
				}
				if (Db.type.has(toId(username))) {
					profile += '&nbsp;<font color="#24678d"><strong>Favorite Type:</strong></font> <img src="https://www.serebii.net/pokedex-bw/type/' + Db.type.get(toId(username)) + '.gif"><br />';
				}
				profile += '&nbsp;<font color="#24678d"><strong>EXP Level:</strong></font> ' + WL.level(toId(username)) + '<br />';
				if (online && lastActive(toId(username))) {
					profile += '&nbsp;<font color="#24678d"><strong>Last Active:</strong></font> ' + lastActive(toId(username)) + '<br />';
				}
				profile += '&nbsp;<font color="#24678d"><b>Last Seen:</b></font> ' + getLastSeen(toId(username)) + '</font><br />';
				profile += '&nbsp;' + showTeam(toId(username)) + '<br />';
		    	profile += '&nbsp;' + song(toId(username)) + '';
				profile += '<br clear="all"></div>';
				self.sendReplyBox(profile);
			});
		}
	},
	 profilehelp: [
		"/profile [user] - Shows a user's profile. Defaults to yourself.",
		"/pteam help - Shows profile team commands.",
		"/pokemon help - Shows favorite pokemon commands.",
		"/favoritetype help - Shows favorite type commands.",
		"/pbg help - Shows profile background commands.",
		"/dev give [user] - Gives a user Dev Status. Requires @ or higher.",
		"/dev take [user] - Removes a user's Dev Status. Requires @ or higher.",
		"/vip give [user] - Gives a user VIP Status. Requires @ or higher.",
		"/vip take [user] - Removes a user's VIP Status. Requires @ or higher.",
		"/help music - Shows profile music commands.",
	],
};
