require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');

//creates new client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const permissionInteger = '268435456'; // manage roles

client.on(Events.ClientReady, async (data) => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = await client.guilds.fetch(process.env.SERVER_ID);
  const collection = await guild.members.fetch();
  const guildMembers = Array.from(collection.values());

  guildMembers.map((member) => {
    console.log(
      `${member.user.username} joined server ${new Date(member.joinedTimestamp).toLocaleDateString(
        'en-US'
      )}`
    );
  });
});

client.on(Events.MessageCreate, (msg) => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
});

//this line must be at the very end
client.login(process.env.BOT_TOKEN); //signs the bot in with token
