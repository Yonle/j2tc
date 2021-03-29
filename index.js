console.log("[Module] Now Loading Modules....");
require("dotenv").config();
console.log("[Module] dotenv Loaded.");
const { Telegraf } = require("telegraf");
console.log("[Module] telegraf Loaded.");
const { BOT_TOKEN } = process.env;
console.log("[Config] Loaded config from .env File with dotenv");
var commandJson = require("./commands.json");
console.log("[Command] Loaded command JSON");
var command = new Map(Object.entries(commandJson));
console.log("[Command] Ready");

var refreshCommand = (() => {
	try {
		delete require.cache[require.resolve("./commands.json")];
		commandJson = require("./commands.json");
	} catch (error) {
		console.error(error);
	} finally {
		command = new Map(Object.entries(commandJson));
	}
});

if (!BOT_TOKEN) {
	console.error("[TOKEN] Missing Token.");
	return process.exit(1);
}
var bot = new Telegraf(BOT_TOKEN);
console.log("[BOT] Client Loaded.");
bot.launch().then(() => {
	console.log("[BOT] Logged as @" + bot.botInfo.username);
}).catch(console.error);

bot.catch(console.error);
bot.on('debug', console.log);
bot.on('warn', console.warn);
bot.on('error', console.error);
bot.on('message', (ctx) => {

	var message = ctx.update.message;
	if (!message) return;

	// Required Object
	var chatID = message.chat.id;
	var userID = message.from.id;
	var userName = message.from.first_name;
	var robotID = bot.botInfo.id;
	var isBot = message.from.isBot;
	var text = message.text || message.caption;
	if (!text) return;
	var cmd = text.slice(1).split(" ")[0];

	// Required Functions
	message.say = (content => {
		return ctx.replyWithMarkdown(content);
	});

	if (userID === robotID) return;
	if (isBot) return;
	if (!text.startsWith("/")) return;
	if (!command) refreshCommand();

	var response = command.get(cmd);
	if (!response) return;
	// If the response startsWith "eval:", Slice and eval the code instead of sending message.
	if (response.startsWith("eval:")) {
		try {
			eval(response.slice(5));
		} catch (error) {
			message.say("Something went wrong when executing this command. If you're the owner of this bot, Check your console and JSON exec code and try again.").catch(console.error);
			console.error(error);
		}
	} else {
		message.say(response).catch(console.error);
	}
	console.log(`[Command] ${userName}(${userID}) is Executing '${cmd}' command.`);

});

// Refresh command every 100ms
setInterval(refreshCommand, 100);
