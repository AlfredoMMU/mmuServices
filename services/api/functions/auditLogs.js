// Copyright 2024 enzoames. All Rights Reserved.

const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const ADD = '$add';
const REMOVE = '$remove';

exports.handler = async (event) => {
  console.log('[LOG] event.body', event.body);

  const { userId, operation, change } = JSON.parse(event.body);
  const roleId = change?.new[0]?.id;

  if (operation === ADD) {
    const startDate = new Date();
    const startDateString = startDate.toISOString().split('T')[0];
    const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    const endDateString = endDate.toISOString().split('T')[0];

    const addData = {
      TableName: process.env.ROLES_TABLE,
      ConditionExpression: 'attribute_not_exists(#roleId) and attribute_not_exists(#userId)',
      ExpressionAttributeNames: { '#roleId': 'roleId', '#userId': 'userId' },
      Item: {
        roleId: `ROLE_ID#${roleId}`,
        userId: `USER_ID#${userId}`,
        startDate: startDateString,
        endDate: endDateString,
      },
    };

    try {
      await dynamoDB.put(addData).promise();
      console.log(`[LOG] successful add: roleId ${roleId}, userId ${userId}`);

      return { statusCode: 200 };
    } catch (e) {
      if (e.code === 'ConditionalCheckFailedException') {
        const errorMessage = `item already exists for roleId ${roleId} userId ${userId}`;
        console.error('[ERROR]', errorMessage);

        return {
          statusCode: 400,
          body: JSON.stringify({ message: errorMessage }),
        };
      }

      console.error(e);
      throw Error('[ERROR]', e);
    }
  }

  if (operation === REMOVE) {
    const removeData = {
      TableName: process.env.MEMBERSHIP_TABLE,
      ReturnValues: 'ALL_OLD',
      Key: {
        roleId: `ROLE_ID#${roleId}`,
        userId: `USER_ID#${userId}`,
      },
    };

    try {
      const resp = await dynamoDB.delete(removeData).promise();
      if (!resp.Attributes) {
        const warnMessage = `no item found for roleId ${roleId} and userId ${userId}`;
        console.war('[WARN]', warnMessage);

        return {
          statusCode: 404,
          body: JSON.stringify({
            message: warnMessage,
          }),
        };
      }

      console.log(`[LOG] successful remove: roleId ${roleId}, userId ${userId}`);
      return { statusCode: 200 };
    } catch (e) {
      console.error(e);
      throw Error('[ERROR]', e);
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: 'invalid operation' }),
  };
};
