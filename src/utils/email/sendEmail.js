import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export default async function sendMail({ type, email, token, url }) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // logger: true,
      // transactionLog: true,
    });

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(
      path.join(__dirname, type === 'reset' ? 'reset.handlebars' : 'verify.handlebars'),
      'utf8'
    );
    const compiledTemplate = handlebars.compile(source);

    const message = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `${type} account`.toUpperCase(),
      html: compiledTemplate({ email, token, url }),
    };

    await transporter.sendMail(message, (error, info) => {
      if (error) return error;
    });
  } catch (error) {
    return error;
  }
}
