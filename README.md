# Teachable Discord Bot

The Discord bot integrated with AWS services to manage user sign-ups for a Teachable course.

## Features

- Discord Bot Functionality: Developed to interact with user roles and manage course sign-ups.
- Serverless Deployment: Utilizes AWS Lambda, DynamoDB, and API Gateway for efficient and scalable HTTP API endpoints using the Serverless Framework.

## Installation

1. Setup AWS Profile Credentials using AWS CLI

   ```bash
   aws configure
   ```

2. Deploy AWS Lambda functions to Production

   ```bash
   cd services/api
   serverless deploy --stage prod
   ```

3. Deploy DynamoDB tables to Production

   ```bash
   cd services/db
   serverless deploy --stage prod
   ```

## Environment Variables

1. **Bot Configuration**

   - **`QA_SERVER_ID`**: The server ID for the QA environment.
   - **`QA_BASE_URL`**: The base URL for the QA API endpoints.
   - **`QA_BOT_TOKEN`**: The token used for authentication with the QA bot.
   - **`PROD_BOT_TOKEN`**: The token used for authentication with the production bot.

2. **API Configuration**
   - **`SERVER_HOSTNAME`**: The hostname or IP address of the server.
   - **`SERVER_PORT`**: The port number on which the server will listen.
   - **`DISCORD_CHANNEL_ID`**: The ID of the Discord channel where messages will be sent.
   - **`GMAIL_USER`**: The Gmail address used for sending emails.
   - **`GMAIL_APP_PASSWORD`**: The application-specific password for the Gmail account.
