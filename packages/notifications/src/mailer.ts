import "server-only";

import nodemailer from "nodemailer";

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

export const sendMail: SendMailFn = async (smtp, mail) => {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    ...(smtp.replyTo ? { replyTo: smtp.replyTo } : {}),
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
};
