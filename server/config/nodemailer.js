const nodemailer = require('nodemailer');

/**
 * Build a nodemailer transporter from env vars. When SMTP credentials are
 * missing (local dev), we return null and the sendEmail util logs the email
 * to the console instead of throwing — so flows like register / reset keep
 * working without a real mail server.
 */
let cachedTransporter;

const createTransporter = () => {
  if (cachedTransporter !== undefined) return cachedTransporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return cachedTransporter;
};

module.exports = { createTransporter };
