import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const sesClient = new SESv2Client({});

const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

export const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.SES_FROM,
    to,
    subject,
    html,
  });
};