// Copyright 2024 enzoames. All Rights Reserved.

require('dotenv').config();
const axios = require('axios');
const { CronJob } = require('cron');
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

const ADD = '$add';
const REMOVE = '$remove';
const ROLE_ID = '1223332060769554462'; // TODO: update to desired roleId

const getEasterDateTime = () =>
  new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

const getConfig = () => {
  const env = process.argv[2] === '--prod' ? 'PROD' : 'QA';
  return {
    baseUrl: process.env[`${env}_BASE_URL`],
    botToken: process.env[`${env}_BOT_TOKEN`],
    serverId: process.env[`${env}_SERVER_ID`],
  };
};

const getExpiredRoles = async () => {
  try {
    const config = getConfig();
    const resp = await axios({
      method: 'get',
      url: `${config.baseUrl}/rt/roles/${ROLE_ID}/expired`,
    });
    return resp.data;
  } catch (e) {
    console.error('[ERROR] status:', e?.response?.status);
    console.error('[ERROR] response data:', e?.response?.data || e);
  }
};

const postAuditLog = async (data) => {
  try {
    const config = getConfig();
    const resp = await axios({ method: 'post', url: `${config.baseUrl}/rt/auditlogs`, data });
    console.log('[LOG] response status:', resp.status);
  } catch (e) {
    console.error('[ERROR] status:', e?.response?.status);
    console.error('[ERROR] response data:', e?.response?.data || e);
  }
};

client.on(Events.ClientReady, async () => {
  console.log('[LOG] Logged in as:', client.user.tag);

  // every day at 07:00 => 0 7 * * 0-6
  // every minute => */1 * * * *

  const job = new CronJob('0 7 * * 0-6', async () => {
    console.log('\n[LOG] running job: checking for expired roles');
    console.log('[LOG] current time', getEasterDateTime());
    const expiredRoles = await getExpiredRoles();
    const config = getConfig();
    const guild = await client.guilds.fetch(config.serverId);
    console.log(`[LOG] number of expired roles: ${expiredRoles.length}`);

    expiredRoles.forEach(async (eR) => {
      const guildMember = await guild.members.fetch(eR.userId);
      console.log('[LOG] removing username:', guildMember.user.username);
      guildMember.roles.remove(eR.roleId, `role expired ${eR.endDate}`);
    });
  });

  job.start();
});

client.on(Events.GuildAuditLogEntryCreate, async (auditLog) => {
  const { changes, targetId, action } = auditLog;
  const currentChange = changes[0] || {};

  if (action !== AuditLogEvent.MemberRoleUpdate) {
    console.log('\n[LOG] event not processed', action);
    return;
  }
  if (changes.length > 1) {
    console.log('\n[LOG] only process one change at a time');
    return;
  }
  if (currentChange?.new.length > 1) {
    console.log('\n[LOG] only process one role update per user');
    return;
  }

  if (currentChange.key === ADD || currentChange.key === REMOVE) {
    const data = {
      userId: targetId,
      operation: currentChange.key,
      change: { ...currentChange },
    };

    console.log('\n[LOG] operation:', currentChange.key);
    console.log('[LOG] execution time:', getEasterDateTime());
    console.log('[LOG] post data:', JSON.stringify(data));
    await postAuditLog(data);
  }
});

// this line must be at the very end. Signs the bot in with token
client.login(getConfig().botToken);
