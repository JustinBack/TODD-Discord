import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
const queue = new Map();
const ytdl = require('ytdl-core');


module.exports = {
    name: 'music',
    description: 'Play a song from youtube',
    syntax: ["play `[youtube_link:Youtube Link]`- _Play the youtube video_", "stop - _Stop and empty the queue_", "skip - _Skip the song_", "queue - _View the current queue_"],
    Bitmask: Permissions.NONE,
    RLPointsConsume: 20,
    execute: async (message: messageObj, bot: Client) => {

        const serverQueue = queue.get(message.message.guild.id);

        function skip(message: any, serverQueue: any) {
            if (!message.member.voice.channel)
                return message.channel.send(
                    "You have to be in a voice channel to stop the music!"
                );
            if (!serverQueue)
                return message.channel.send("There is no song that I could skip!");
            serverQueue.connection.dispatcher.end();
        }

        function stop(message: any, serverQueue: any) {
            if (!message.member.voice.channel)
                return message.channel.send(
                    "You have to be in a voice channel to stop the music!"
                );

            if (!serverQueue)
                return message.channel.send("There is no song that I could stop!");

            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
        }

        function play(guild: any, song: any) {
            const serverQueue = queue.get(guild.id);
            if (!song[0]) {
                serverQueue.voiceChannel.leave();
                queue.delete(guild.id);
                return;
            }

            const dispatcher = serverQueue.connection
                .play(ytdl(song[0].url))
                .on("finish", () => {
                    serverQueue.songs.shift();
                    play(guild, serverQueue.songs);
                })
                .on("error", (error: any) => console.error(error));
            dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
            serverQueue.textChannel.send(`Start playing: **${song[0].title}**`);
        }


        function list(message: any, serverQueue: any) {
            if (!serverQueue) {
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Song Queue')
                    .setDescription(`Your song queue is empty!`);
                return message.channel.send(embed);
            }

            console.log(serverQueue.songs, serverQueue.songs.length);

            if (serverQueue.songs.length > 0) {

                let queue = "";
                for (var i in serverQueue.songs) {
                    if (Number.parseInt(i) === 0) continue;
                    queue += `${Number.parseInt(i)}. ${serverQueue.songs[i].title}\n`
                }

                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Song Queue')
                    .setDescription(`Currently Playing: ${serverQueue.songs[0].title}\n\nYou currently have ${serverQueue.songs.length - 1} song(s) in the queue, the next 5 are:\n\n${queue}`);
                serverQueue.textChannel.send(embed);
            }
        }

        async function init(message: any, serverQueue: any, msgarguments: any) {
            let args = msgarguments;

            args.shift();

            let songname = args.join(" ");

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.send("You need to be in a voice channel to play music!");
            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return message.channel.send("I need the permissions to join and speak in your voice channel!");
            }

            const songInfo = await ytdl.getInfo(songname);
            const song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
            };

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: voiceChannel,
                    connection: null as any,
                    songs: [] as any,
                    volume: 5,
                    playing: true
                };

                queue.set(message.guild.id, queueContruct);

                queueContruct.songs.push(song);

                try {
                    var connection = await voiceChannel.join();
                    queueContruct.connection = connection;
                    play(message.guild, queueContruct.songs);
                } catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(err);
                }
            } else {
                serverQueue.songs.push(song);
                return message.channel.send(`${song.title} has been added to the queue!`);
            }
        }


        switch (message.arguments[0]) {
            case "play":
            case "add":
            case "new":
                init(message.message, serverQueue, message.arguments);
                break;
            case "skip":
            case "next":
                skip(message.message, serverQueue);
                break;
            case "stop":
            case "leave":
                stop(message.message, serverQueue);
                break;
            case "info":
            case "queue":
                list(message.message, serverQueue);
                break;
            default:
                message.message.reply("Invalid arguments, refer to the help topic.")

        }
    },
} as Command;