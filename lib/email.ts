import nodemailer from 'nodemailer';

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // Use secure configuration for port 465, otherwise standard TLS
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // SSL options for reliability
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export async function sendVerificationEmail(toEmail: string, token: string) {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;
  const fromEmail = process.env.EMAIL_FROM || '"candyEco" <noreply@example.com>';

  const transporter = getTransporter();

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: 'Activez votre compte - Délices d’Eva',
    text: `Bienvenue chez Délices d’Eva ! Veuillez copier et coller le lien suivant dans votre navigateur pour activer votre compte : ${verificationUrl}\n\nCe lien expirera dans 24 heures.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9ff;
            color: #1a1b23;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(48, 4, 141, 0.05);
            border: 1px border-solid #e1e2ec;
          }
          .header {
            background-color: #30048d;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .welcome {
            font-size: 18px;
            font-weight: 600;
            color: #30048d;
            margin-bottom: 20px;
          }
          .cta-container {
            text-align: center;
            margin: 35px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #30048d;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 35px;
            border-radius: 9999px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(48, 4, 141, 0.2);
            transition: all 0.2s ease;
          }
          .cta-button:hover {
            background-color: #5021af;
            transform: translateY(-1px);
          }
          .footer {
            background-color: #f1f3f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #45464f;
            border-top: 1px solid #e1e2ec;
          }
          .note {
            font-size: 13px;
            color: #757682;
            margin-top: 25px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Délices d’Eva</h1>
          </div>
          <div class="content">
            <div class="welcome">Bienvenue chez Délices d’Eva !</div>
            <p>Merci d'avoir créé un compte sur notre boutique. Pour finaliser votre inscription et activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
            
            <div class="cta-container">
              <a href="${verificationUrl}" class="cta-button">Activer mon compte</a>
            </div>
            
            <p>Si le bouton ci-dessus ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
            <p style="word-break: break-all; color: #30048d;"><a href="${verificationUrl}">${verificationUrl}</a></p>
            
            <div class="note">
              <strong>Remarque :</strong> Ce lien d'activation expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Délices d’Eva. Tous droits réservés.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}
