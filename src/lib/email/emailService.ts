import nodemailer from "nodemailer";
import { env } from "$env/dynamic/private";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  // port: Number(465),
  port: Number(SMTP_PORT),
  secure: false, // TLS requires secureConnection to be false
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  },
});

export interface EmailAttachment {
  filename: string;
  content: Buffer | Uint8Array;
}

export interface EmailOptions {
  from?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

/**
 * Sends an email using the configured SMTP server
 */
export async function sendEmail(options: EmailOptions) {
  return transporter.sendMail({
    from: options.from ?? `${SMTP_USER}@user.dsek.se`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.isBuffer(attachment.content)
        ? attachment.content
        : Buffer.from(attachment.content),
    })),
  });
}
