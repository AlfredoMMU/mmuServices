// Copyright 2024 enzoames. All Rights Reserved.

require('dotenv').config();
const axios = require('axios');
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

const postLogEvent = async (data) => {
  try {
    const resp = await axios({ method: 'post', url: `${process.env.BASE_URL}/rt/auditlogs`, data });
    console.log('[LOG] response status:', resp.status);
  } catch (e) {
    console.error('[ERROR] status:', e?.response?.status);
    console.error('[ERROR] response data:', e?.response?.data || e);
  }
};

client.on(Events.ClientReady, async () => {
  console.log('Logged in as:', client.user.tag);
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
    console.log('[LOG] execution time:', new Date().toUTCString());
    console.log('[LOG] post data:', JSON.stringify(data));
    postLogEvent(data);
  }
});

// this line must be at the very end. Signs the bot in with token
client.login(process.env.BOT_TOKEN);
