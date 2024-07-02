/* 
  Copyright 2024 enzoames. All Rights Reserved.

  [POST] /rt/roles/{id}/expired

  Given a roleId, the endpoint grabs all the roles that expired today.
  RT-Manager bot runs a job each day and calls this endpoint
*/

const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

exports.handler = async (event) => {
  const { pathParameters } = event;
  const roleId = pathParameters.roleId;
  const today = new Date().toISOString().split('T')[0];

  const queryParams = {
    TableName: process.env.ROLES_TABLE,
    IndexName: 'GSI1--roleId-endDate',
    KeyConditionExpression: 'roleId = :roleId AND endDate < :endDate',
    ExpressionAttributeValues: { ':roleId': `ROLE_ID#${roleId}`, ':endDate': today },
  };

  console.log('queryParams', queryParams);

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
