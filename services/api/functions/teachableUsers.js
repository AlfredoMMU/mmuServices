import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import nodemailer from "nodemailer";
import https from "http";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = process.env.TEACHABLE_TABLE;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function createDiscordInvite(channelId, roleName) {
  const data = JSON.stringify({
    channelId: channelId,
    roleName: roleName,
  });

  const options = {
    hostname: process.env.SERVER_HOSTNAME,
    port: process.env.SERVER_PORT,
    path: "/create-invite",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log("Discord invite link:", data);
        resolve(data);
      });
    });

    req.on("error", (error) => {
      console.error("Error creating Discord invite link:", error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function sendEmailWithInviteLink(
  userEmail,
  userName,
  courseName,
  inviteLink
) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: `Your Exclusive Discord Invite for ${courseName}`,
    html: `
      <html>
        <body>
          <h1>Welcome, ${userName}!</h1>
          <p>Thank you for purchasing the course "${courseName}".</p>
          <p>As a valued student, you're invited to join our exclusive Discord community. Here's your personalized invite link:</p>
          <p><a href="${inviteLink}">Click here to join our Discord</a></p>
          <p>${inviteLink}</p>
          <p>This link is unique to you and will expire in 24 hours. Don't share it with anyone else.</p>
          <p>We're excited to have you in our community!</p>
          <p>Best regards,<br>MMU Team</p>
        </body>
      </html>
    `,
    text: `
Welcome, ${userName}!

Thank you for purchasing the course "${courseName}".

As a valued student, you're invited to join our exclusive Discord community. Here's your personalized invite link:

${inviteLink}

This link is unique to you and will expire in 24 hours. Don't share it with anyone else.

We're excited to have you in our community!

Best regards,
MMU Team
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  try {
    let payload;
    if (typeof event.body === "string") {
      payload = JSON.parse(event.body);
    } else if (typeof event.body === "object") {
      payload = event.body;
    } else {
      payload = event;
    }
    console.log("Parsed payload:", JSON.stringify(payload, null, 2));

    let saleData;
    if (Array.isArray(payload) && payload.length > 0) {
      saleData = payload[0].object;
    } else if (payload.object) {
      saleData = payload.object;
    } else {
      throw new Error("Unable to find sale data in the payload");
    }
    console.log("Extracted sale data:", JSON.stringify(saleData, null, 2));

    // Generate Discord invite link with role
    const discordInviteLink = await createDiscordInvite(
      process.env.DISCORD_CHANNEL_ID,
      process.env.DISCORD_ROLE_NAME
    );

    // Send email with invite link
    await sendEmailWithInviteLink(
      saleData.user.email,
      saleData.user.name,
      saleData.course.name,
      discordInviteLink
    );

    // Prepare item for DynamoDB
    const item = {
      userId: saleData.user.id.toString(),
      userEmail: saleData.user.email,
      userName: saleData.user.name,
      courseFriendlyUrl: saleData.course.friendly_url,
      purchaseDate: saleData.created,
      purchasePrice: saleData.final_price,
      purchaseCurrency: saleData.currency,
      couponCode: saleData.coupon ? saleData.coupon.code : null,
      discordInviteLink: discordInviteLink,
      discordJoined: false,
      discordUserId: "",
    };

    const params = {
      TableName: tableName,
      Item: item,
    };

    await dynamo.send(new PutCommand(params));

    body = {
      message: "Data stored successfully",
      item: item,
    };
  } catch (err) {
    console.error("Error:", err);
    statusCode = 500;
    body = { error: err.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  };
};
