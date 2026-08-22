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
 * Gmail (y varios SMTP en Vercel) a menudo cuelgan el handshake cuando Node
 * resuelve IPv6: el TCP abre pero el banner `220` nunca llega →
 * "Greeting never received". Forzar IPv4 + timeouts cortos evita ese stall.
 *
 * `family` es runtime de Nodemailer/Node net; @types/nodemailer no lo declara.
 */
type SmtpTransportOptions = SMTPTransport.Options & {
  family?: 4 | 6;
};

const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 30_000;

export const sendMail: SendMailFn = async (smtp, mail) => {
  const options: SmtpTransportOptions = {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    // Prefer STARTTLS on submission port (587); 465 uses implicit TLS above.
    requireTLS: smtp.port === 587,
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
