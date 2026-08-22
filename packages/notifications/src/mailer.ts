import "server-only";

import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import type { SmtpConfig } from "./types";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendMailFn = (
  smtp: SmtpConfig,
  mail: SendMailInput,
) => Promise<void>;

/**
 * Gmail en Vercel: preferir puerto 587 + STARTTLS (`secure: false`).
 * `family: 4` evita stalls IPv6 ("Greeting never received").
 */
type SmtpTransportOptions = SMTPTransport.Options & {
  family?: 4 | 6;
};

const SMTP_CONNECTION_TIMEOUT_MS = 30000;
const SMTP_GREETING_TIMEOUT_MS = 30000;
const SMTP_SOCKET_TIMEOUT_MS = 30000;

export const sendMail: SendMailFn = async (smtp, mail) => {
  const options: SmtpTransportOptions = {
    host: smtp.host,
    port: 587,
    secure: false,
    family: 4,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  };

  const transporter = nodemailer.createTransport(options);

  try {
    await transporter.sendMail({
      from: smtp.from,
      ...(smtp.replyTo ? { replyTo: smtp.replyTo } : {}),
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } finally {
    transporter.close();
  }
};
