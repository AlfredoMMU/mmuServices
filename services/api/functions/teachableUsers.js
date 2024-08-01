import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import nodemailer from "nodemailer";
import https from "http";
import { getCourseInviteTemplate } from "./templates/emailTemplates.js";

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

// Discord
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
        try {
          const parsedData = JSON.parse(data);
          console.log("Discord invite link:", parsedData.url);
          resolve(parsedData.url);
        } catch (error) {
          console.error("Error parsing Discord invite response:", error);
          reject(error);
        }
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

function determineRoleFromCourse(courseName) {
  const courseRoleMap = {
    "Triad's Trading Archives": "Tim's Member",
    "Tim's Trading Archives": "Triads's Member",
    "Merciless Markets (Gold)": "MMU Gold Member",
    "Merciless Markets (Diamond)": "MMU Diamond Member",
  };

  const defaultRole = "User";

  return courseRoleMap[courseName] || defaultRole;
}

// Email Invite
async function sendEmail(
  userEmail,
  userName,
  courseName,
  inviteLink,
  roleName
) {
  const template = getCourseInviteTemplate({
    userName,
    courseName,
    inviteLink,
    roleName,
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
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

    const discordRole = determineRoleFromCourse(saleData.course.name);

    let discordInviteLink = "";

    if (discordRole != "User") {
      // Generate Discord invite link with role
      discordInviteLink = await createDiscordInvite(
        process.env.DISCORD_CHANNEL_ID,
        discordRole
      );

      // Send email with invite link
      await sendEmail(
        saleData.user.email,
        saleData.user.name,
        saleData.course.name,
        discordInviteLink,
        discordRole
      );
    }

    // Prepare item for DynamoDB
    const item = {
      userId: saleData.user.id.toString(),
      userEmail: saleData.user.email,
      userName: saleData.user.name,
      courseName: saleData.course.name,
      purchaseDate: saleData.created,
      purchasePrice: saleData.final_price,
      purchaseCurrency: saleData.currency,
      couponCode: saleData.coupon ? saleData.coupon.code : null,
      discordInviteLink: discordInviteLink,
      discordUserId: "",
      discordRole: discordRole,
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
