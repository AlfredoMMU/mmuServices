// Copyright 2024 enzoames. All Rights Reserved.

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const log = require('../utils/log');
const config = require('../utils/config');
const { MMU_MEMBER } = require('../utils/constants');

const credentials = new AWS.SharedIniFileCredentials({ profile: 'rt' });
AWS.config.credentials = credentials;
const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

async function run() {
  log.message('[LOG] Run');

  const stream = fs
    .createReadStream(path.resolve(__dirname, './data/backfillData.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', (error) => log.error(error))
    .on('data', async (row) => {
      stream.pause();
      try {
        const startDate = new Date(row.date);
        const startDateString = startDate.toISOString().split('T')[0];
        const endDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
        const endDateString = endDate.toISOString().split('T')[0];
        const tableName = `rtmanager-db-${config.env}-roles`.toLocaleLowerCase();

        const putData = {
          TableName: tableName,
          Item: {
            roleId: `ROLE_ID#${MMU_MEMBER}`,
            userId: `USER_ID#${row.userId}`,
            startDate: startDateString,
            endDate: endDateString,
          },
        };
        log.message('\n[LOG] data', putData.Item);
        await dynamoDB.put(putData).promise();
        log.message('[LOG] saved discord user', row.discordName);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        throw Error(e);
      } finally {
        stream.resume();
      }
    })
    .on('end', (rowCount) => log.message(`Parsed ${rowCount} rows`));
}

run().catch((e) => log.error(`[ERROR] Encountered error: ${e}\n${e.stack}`));
