// Copyright 2024 enzoames. All Rights Reserved.

const { MMU_MEMBER, TIMS_MEMBER, TRIAD_MEMBER } = require('./constants');

const PROD = 'PROD';
const QA = 'QA';
const QA_ROLE_1 = '1223331193085235280';
const QA_ROLE_2 = '1223332060769554462';
const ROLES = [MMU_MEMBER, TIMS_MEMBER, TRIAD_MEMBER];
const QA_ROLES = [QA_ROLE_1, QA_ROLE_2];

const getConfig = () => {
  const env = process.argv[2] === '--prod' ? PROD : QA;
  return {
    env,
    baseUrl: process.env[`${env}_BASE_URL`],
    botToken: process.env[`${env}_BOT_TOKEN`],
    serverId: process.env[`${env}_SERVER_ID`],
    roles: env == PROD ? ROLES : QA_ROLES,
  };
};

module.exports = getConfig();
