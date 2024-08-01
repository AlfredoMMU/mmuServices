export const getCourseInviteTemplate = ({
  userName,
  courseName,
  inviteLink,
  roleName,
}) => ({
  subject: `Welcome to MMU - Discord Invitation`,
  html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            .highlight {
              font-weight: bold;
              color: #3498db;
            }
            .steps {
              background-color: #f8f9fa;
              border-left: 4px solid #3498db;
              padding: 15px;
              margin: 20px 0;
            }
            .steps ol {
              padding-left: 20px;
            }
            .footer {
              margin-top: 30px;
              font-style: italic;
              color: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <h1>${courseName}</h1>
          <p>Hello <span class="highlight">${userName}</span> trader!</p>
          <p>For the live Q&A session, daily watchlist, daytrading gameplan, ultra-low-latency LIVE streaming, 1-on-1 Mentor session access, MMU scanners, and our conversation channels, we will be utilizing our Discord chatroom.</p>
          <div class="steps">
            <h2>JOIN THE CHATROOM</h2>
            <p>Powered By: Discord</p>
            <ol>
              <li>Click This Link: <a href="${inviteLink}">${inviteLink}</a></li>
              <li>Sign-In to Discord utilizing the same email you used to purchase the MMU Program</li>
              <li>Join The Relentless Trading Server through the link. <span class="highlight">This link is unique, one-time use, and will automatically grant you the ${roleName} role. Don't share it with anyone else.</span></li>
            </ol>
          </div>
          <p>We will see you in Discord to help you with the rest.</p>
          <p class="footer">
            Best Regards,<br><br>
            Merciless Markets University<br>
            MMU Team
          </p>
        </body>
      </html>
    `,
  text: `
  ${courseName}
  
  Hello ${userName} trader!
  
  For the live Q&A session, daily watchlist, daytrading gameplan, ultra-low-latency LIVE streaming, 1-on-1 Mentor session access, MMU scanners, and our conversation channels, we will be utilizing our Discord chatroom. The steps to join are the following:
  
  JOIN THE CHATROOM
  Powered By: Discord
  
  1. Click This Link: ${inviteLink}
  2. Join The Relentless Trading Server through the link. This link is unique, one-time use, and will automatically grant you the ${roleName} role. Don't share it with anyone else.
  
  We will see you in Discord to help you with the rest.
  
  Best Regards,
  
  Merciless Markets University
  
  MMU Team
    `,
});
