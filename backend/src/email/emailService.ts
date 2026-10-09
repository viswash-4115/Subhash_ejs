import nodemailer from "nodemailer";
import { config } from "../config";

interface EtherealAccount {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

let transporter: nodemailer.Transporter | null = null;
let testAccount: EtherealAccount | null = null;

export async function initializeEmailService(): Promise<void> {
  if (config.ethereal.host && config.ethereal.user && config.ethereal.pass) {
    testAccount = {
      host: config.ethereal.host,
      port: config.ethereal.port,
      secure: config.ethereal.port === 465,
      auth: {
        user: config.ethereal.user,
        pass: config.ethereal.pass,
      },
    };
  } else {
    const account = await nodemailer.createTestAccount();
    testAccount = {
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    };
    console.log("[Email] Ethereal test account created:");
    console.log(`  User: ${account.user}`);
    console.log(`  Pass: ${account.pass}`);
  }

  transporter = nodemailer.createTransport(testAccount);

  console.log("[Email] Transporter ready");
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | null;
}

export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  if (!transporter) {
    throw new Error("Email transporter not initialized");
  }

  const info = await transporter.sendMail({
    from: `"ScheduledMail" <${testAccount?.auth.user || "noreply@scheduledmail.dev"}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  console.log(`[Email] Sent: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[Email] Preview: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
