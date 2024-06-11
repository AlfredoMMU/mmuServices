// Copyright 2024 enzoames. All Rights Reserved.

const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

exports.handler = async (event) => {
  console.log('event', event);
  const { pathParameters } = event;
  const roleId = pathParameters.roleId;
  const today = new Date().toISOString().split('T')[0];
  // const today = '2025/06/15'; // test

  const queryParams = {
    TableName: process.env.ROLES_TABLE,
    IndexName: 'GSI1--roleId-endDate',
    KeyConditionExpression: 'roleId = :roleId AND endDate < :endDate',
    ExpressionAttributeValues: { ':roleId': `ROLE_ID#${roleId}`, ':endDate': today },
  };

  try {
    const resp = await dynamoDB.query(queryParams).promise();

    const items = resp.Items.map((item) => ({
      ...item,
      roleId: item.roleId.split('#')[1],
      userId: item.userId.split('#')[1],
    }));

    return { statusCode: 200, body: JSON.stringify(items) };
  } catch (e) {
    console.error(e);
    throw Error('[ERROR]', e);
  }
};
