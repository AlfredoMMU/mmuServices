// Copyright 2024 enzoames. All Rights Reserved.

const { MMU_MEMBER, TIMS_MEMBER, TRIAD_MEMBER } = require('./constants');

const PROD = 'PROD';
const QA = 'QA';
const QA_ROLE_1 = '1223331193085235280';
const QA_ROLE_2 = '1223332060769554462';
const ROLES = [MMU_MEMBER, TIMS_MEMBER, TRIAD_MEMBER];
// const QA_ROLES = [QA_ROLE_1, QA_ROLE_2];

// QA Configuration
const QA_GUILD = "1265413878737535079";
const QA_ROLES = ["Twitter"];
const QA_CHANNEL = ["1265414223647866910"];

const getConfig = () => {
  const env = process.argv[2] === "--prod" ? PROD : QA;
  return {
    env,
    baseUrl: process.env[`${env}_BASE_URL`],
    botToken: process.env[`${env}_BOT_TOKEN`],
    serverId: process.env[`${env}_SERVER_ID`],
    roles: env == PROD ? ROLES : QA_ROLES,
    channels: env == PROD ? [] : QA_CHANNEL,
    guild: env == PROD ? "" : QA_GUILD,
  };
};

module.exports = getConfig();