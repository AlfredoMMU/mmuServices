// Copyright 2024 enzoames. All Rights Reserved.

require('dotenv').config();
const axios = require('axios');
const { CronJob } = require('cron');
const { Client, GatewayIntentBits, Events, AuditLogEvent } = require('discord.js');
const { PromisePool } = require('@supercharge/promise-pool');
const get = require('lodash.get');
const log = require('./log');

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

const PROD = 'PROD';
const QA = 'QA';
const ADD = '$add';
const REMOVE = '$remove';
const QA_ROLE_1 = '1223331193085235280';
const QA_ROLE_2 = '1223332060769554462';
const MMU_MEMBER = '1077337112640229548';
const TIMS_MEMBER = '1159520034331312329';
const TRIAD_MEMBER = '1249396310340145272';
const ROLES = [MMU_MEMBER, TIMS_MEMBER, TRIAD_MEMBER];
const QA_ROLES = [QA_ROLE_1, QA_ROLE_2];

const getEasterDateTime = () =>
  new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

const getConfig = () => {
  const env = process.argv[2] === '--prod' ? PROD : QA;
  return {
    baseUrl: process.env[`${env}_BASE_URL`],
    botToken: process.env[`${env}_BOT_TOKEN`],
    serverId: process.env[`${env}_SERVER_ID`],
    roles: env == PROD ? ROLES : QA_ROLES,
  };
};

const getExpiredRoles = async (roleId) => {
  try {
    const config = getConfig();
    const resp = await axios({
      method: 'get',
      url: `${config.baseUrl}/rt/roles/${roleId}/expired`,
    });
    return resp.data;
  } catch (e) {
    log.error('[ERROR] status:', e?.response?.status);
    log.error('[ERROR] response data:', e?.response?.data || e);
  }
};

const postAuditLog = async (data) => {
  try {
    const config = getConfig();
    const resp = await axios({ method: 'post', url: `${config.baseUrl}/rt/auditlogs`, data });
    log.message('[LOG] response status:', resp.status);
  } catch (e) {
    log.error('[ERROR] status:', e?.response?.status);
    log.error('[ERROR] response data:', e?.response?.data || e);
  }
};

client.on(Events.ClientReady, async () => {
  log.message('[LOG] Logged in as:', client.user.tag);

  // every day at 07:00 => 0 7 * * 0-6
  // every minute => */1 * * * *
  const job = new CronJob(
    '0 7 * * 0-6',
    async () => {
      log.message('\n[LOG] running job: checking for expired roles');
      log.message('[LOG]', getEasterDateTime());

      const config = getConfig();
      // get expired roles for each roleId
      const { results } = await PromisePool.for(config.roles)
        .withConcurrency(1)
        .process(async (r) => {
          log.message('[LOG] fetching expired roles for:', r);
          const resp = await getExpiredRoles(r);
          return resp;
        });

      const expiredRoles = results.flat();
      log.message(`[LOG] number of expired roles: ${expiredRoles.length}`);

      await PromisePool.for(expiredRoles)
        .withConcurrency(1)
        .process(async (eR) => {
          const guild = await client.guilds.fetch(config.serverId);
          const guildMember = await guild.members.fetch(eR.userId);
          log.message('\n[LOG] removing username:', guildMember.user.username);
          guildMember.roles.remove(eR.roleId, `role expired ${eR.endDate}`);
          // force await here for the time between network requests from discord api and our api
          await new Promise((resolve) => setTimeout(resolve, 3000));
        });
    },
    ...[, ,],
    'America/New_York'
  );

  job.start();
});

client.on(Events.GuildAuditLogEntryCreate, async (auditLog) => {
  const { changes, targetId, action } = auditLog;
  const validateAction = action !== AuditLogEvent.MemberRoleUpdate;

  if (validateAction) {
    log.message('\n[LOG] event not processed', action);
    return;
  }

  const currentChange = get(changes, '[0]', {});
  const validateChange = changes.length > 1 && currentChange?.new.length > 1;

  if (validateChange) {
    log.message('\n[LOG] invalid change');
    return;
  }

  const config = getConfig();
  const newRoleId = get(currentChange, 'new[0].id', '');
  const validateRoleId = !config.roles.includes(newRoleId);

  if (validateRoleId) {
    log.message('\n[LOG] role not processed');
    return;
  }

  const isValidOperation = currentChange.key === ADD || currentChange.key === REMOVE;

  if (isValidOperation) {
    const data = {
      userId: targetId,
      operation: currentChange.key,
      change: { ...currentChange },
    };

    log.message('\n[LOG] operation:', currentChange.key);
    log.message('[LOG] execution time:', getEasterDateTime());
    log.message('[LOG] post data:', JSON.stringify(data));
    await postAuditLog(data);
  }
});

// this line must be at the very end. Signs the bot in with token
client.login(getConfig().botToken);
