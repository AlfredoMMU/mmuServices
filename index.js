require('dotenv').config();
const { Client, GatewayIntentBits, Events, AuditLogEvent } = require('discord.js');

// creates new client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});

const OPERATION = '$add';
const ROLE_ID = '1245568783351943199'; // Test Role

const getMemberRoleUpdateLogCollection = async (guild) => {
  const collection = await guild.fetchAuditLogs({
    type: AuditLogEvent.MemberRoleUpdate,
  });
  return Array.from(collection.entries.values());
};

const getMembersWithRole = (logs) => {
  return logs.filter((log) => {
    return log.changes.some((change) => {
      const hasAddKey = change.key === OPERATION;
      const hasRoleId = change.new.some((n) => n.id === ROLE_ID);
      return hasAddKey && hasRoleId;
    });
  });
};

const getMembersOverOneYearOld = (membersWithRole) => {
  const today = new Date();
  const lastYearToday = today.setFullYear(today.getFullYear() - 1);

  return membersWithRole.filter((mR) => {
    console.log('\nToday:', today.toLocaleDateString('en-US'));
    console.log('Last Year Today:', new Date(lastYearToday).toLocaleDateString('en-US'));
    console.log('Role Created:', new Date(mR.createdTimestamp).toLocaleDateString('en-US'));
    return lastYearToday > mR.createdTimestamp;
  });
};

const removeRoleFromMembers = (membersWithRole) => {
  membersWithRole.forEach(async (mR) => {
    const guildMember = await guild.members.fetch(mR.target.id);
    console.log('guildMember', guildMember);
    // TODO: test remove
    // guildMember.roles.remove(ROLE_ID);
  });
};

client.on(Events.ClientReady, async (data) => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = await client.guilds.fetch(process.env.SERVER_ID);
  const logs = await getMemberRoleUpdateLogCollection(guild);
  const membersWithRole = getMembersWithRole(logs);
  const membersWithRoleAndOverOneYearOld = getMembersOverOneYearOld(membersWithRole);
  removeRoleFromMembers(membersWithRoleAndOverOneYearOld);
});

client.on(Events.MessageCreate, (msg) => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
});

// this line must be at the very end. Signs the bot in with token
client.login(process.env.BOT_TOKEN);

// NOTE: ouputs the date user joined the server
// const collection = await guild.members.fetch();
// const guildMembers = Array.from(collection.values());
// guildMembers.map((member) => {
//   console.log(
//     `${member.user.username} joined server ${new Date(member.joinedTimestamp).toLocaleDateString(
//       'en-US'
//     )}`
//   );
// });

// NOTE: fetch role
// const role = await guild.roles.fetch(ROLE_ID);
