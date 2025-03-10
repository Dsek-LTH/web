import nodemailer from "nodemailer";
import { env } from "$env/dynamic/private";
import type Mail from "nodemailer/lib/mailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false, // TLS requires secureConnection to be false
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export interface EmailAttachment {
  filename: string;
  content: Buffer | Uint8Array;
}

export type EmailOptions = {
  from?: string;
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
} & Omit<Mail.Options, "from" | "to" | "subject" | "text" | "attachments">;

/**
 * Sends an email using the configured SMTP server
 */
export async function sendEmail({
  from,
  to,
  subject,
  text,
  attachments,
  ...options
}: EmailOptions) {
  return transporter.sendMail({
    from: from ?? `${SMTP_USER}@user.dsek.se`,
    to: to,
    subject: subject,
    text: text,
    attachments: attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.isBuffer(attachment.content)
        ? attachment.content
        : Buffer.from(attachment.content),
    })),
    ...options,
  });
}
