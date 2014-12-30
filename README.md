# Goddammit Bot

![](http://puu.sh/dP4Bt/656a4fcf5c.png)

A running version is [here](http://horner.tj/steambot). By default, it accepts all friend requests sent to it.

## Configuring the Bot

1. `npm install`
2. Make a copy of `config.default.js` and rename it to `config.js`.
3. Make a Steam account for the bot. PROTIP: If you don't need the bot to trade, turn off SteamGuard on the account. It's too much of a hassle.
4. Fill in the values in `config.js`.
5. Start it up

## Adding Elevated Users

Elevated users have access to more commands. To add yourself as an elevated user, get your SteamID by using the `!myid` command on the bot. Add that to `elevatedUsers` in `config.js`. Restart the bot.

To see if that worked, type `!myrank`. It should reply with `elevated`.

## Adding Commands

Creating a command is simple if you know what you're doing. You can see all of the commands in `app.js`.

`app.Command(regex, params, help, action)`

- `regex` - The regex to trigger the command
- `params` - Shown in help
- `help` - A description of the command, also shown in help
- `action` - A function that gets the parameters `src, msg, steamId`
	- `src` - The SteamID of the user or chat room this message was sent
	- `msg` - The message that was sent
	- `steamId` - The SteamID of the user that sent the message

### Example Command - `!echo`

```javascript
app.Command(/^!echo\b/, "!echo [message]", "Echoes the text provided", function(src, msg, steamId){
	bot.sendMessage(src, msg.substr(6));
});
```