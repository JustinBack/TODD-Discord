import { Command, messageObj } from '../models';
import * as StripTags from 'striptags';
import * as fs from "fs";
import { Client, MessageEmbed } from 'discord.js';
import request = require('request');

module.exports = {
	name: 'service',
	description: 'Search for a service',
	syntax: "service {Query}",
	RLPointsConsume: 40,
	priviliged: false,
	execute: (message: messageObj, bot: Client) => {


		function truncate(str: any, n: number, useWordBoundary: boolean = false) {
			if (str.length <= n) { return str; }
			const subString = str.substr(0, n - 1); // the original check
			return (useWordBoundary
				? subString.substr(0, subString.lastIndexOf(" "))
				: subString) + "...";
		};

		message.message.channel.send("Hold on... Loading!").then((msg) => {
			var twirlTimer = (function () {
				var P = ["⡀⡁","⡂","⡃","⡄","⡅","⡆","⡇⡈","⡉","⡊","⡋","⡌","⡍","⡎","⡏","⡐","⡑","⡒","⡓","⡔","⡕","⡖","⡗","⡘","⡙","⡚","⡛","⡜","⡝","⡞","⡟","⡠","⡡","⡢","⡣","⡤","⡥","⡦","⡧","⡨","⡩","⡪","⡫","⡬","⡭","⡮","⡯","⡰","⡱","⡲","⡳","⡴","⡵","⡶","⡷","⡸","⡹","⡺","⡻","⡼","⡽","⡾","⡿","⢀","⢁","⢂","⢃","⢄","⢅","⢆","⢇","⢈","⢉","⢊","⢋","⢌","⢍","⢎","⢏","⢐","⢑","⢒","⢓","⢔","⢕","⢖","⢗","⢘","⢙","⢚","⢛","⢜","⢝","⢞","⢟","⢠","⢡","⢢","⢣","⢤","⢥","⢦","⢧","⢨","⢩","⢪","⢫","⢬","⢭","⢮","⢯","⢰","⢱","⢲","⢳","⢴","⢵","⢶","⢷","⢸","⢹","⢺","⢻","⢼","⢽","⢾","⢿","⣀","⣁","⣂","⣃","⣄","⣅","⣆","⣇","⣈","⣉","⣊","⣋","⣌","⣍","⣎","⣏","⣐","⣑","⣒","⣓","⣔","⣕","⣖","⣗","⣘","⣙","⣚","⣛","⣜","⣝","⣞","⣟","⣠","⣡","⣢","⣣","⣤","⣥","⣦","⣧","⣨","⣩","⣪","⣫","⣬","⣭","⣮","⣯","⣰","⣱","⣲","⣳","⣴","⣵","⣶","⣷","⣸","⣹","⣺","⣻","⣼","⣽","⣾","⣿"];
				var x = 0;
				return setInterval(function () {
					msg.edit("Hold on... Loading! " + P[x++]);
					x &= 3;
				}, 1000);
			})();

			request("https://beta.tosdr.org/api/2/" + message.argument + ".json", function (error, response, body) {
				if (error) {
					return false;
				}
				clearInterval(twirlTimer);
				let json = JSON.parse(body);

				if (json.error) {
					msg.edit("Hmm, seems that service does not exist!").then(() => {
						return true;
					}).catch(() => {
						return false;
					});
					return;
				}

				const embed = new MessageEmbed()
					.setColor('#0099ff')
					.setTitle(json.parameters.name)
					.setURL('https://beta.tosdr.org/en/service/' + json.parameters.id)
					.setDescription(`${json.parameters.name} has \`${Object.keys(json.parameters.links).length}\` Documents and \`${json.parameters.points.length}\` Points`)
					.setImage('https://beta.tosdr.org/api/badgepng/' + json.parameters.slug)
					.setThumbnail('https://beta.tosdr.org' + (json.parameters.image.endsWith(".svg") ? json.parameters.image.substr(0, json.parameters.image.length - 4) + ".png" : json.parameters.image))
					.setTimestamp()
					.setFooter("https://beta.tosdr.org/api/2/" + message.argument + ".json");

				for (var index in json.parameters.points.slice(0, 10)) {


					let pointData = json.parameters.pointsData[json.parameters.points[index]];

					embed.addField(
						truncate(pointData.title, 60),
						"[" + truncate(pointData.tosdr.tldr, 100) + "](https://edit.tosdr.org/points/" + pointData.id + ")",
						true
					);
				}

				msg.edit("Here is your result!", embed);

			});
		});
	},
} as Command;