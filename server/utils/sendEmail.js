const { createTransporter } = require('../config/nodemailer');

const BRAND = '#c9a84c';
const BG = '#0a0a0a';
const CARD = '#1a1a1a';
const TEXT = '#f5f5f5';
const MUTED = '#888888';

/**
 * Wrap content in the shared dark/gold LUXE email shell.
 */
const layout = (title, bodyHtml) => `
  <div style="background:${BG};padding:32px 0;font-family:Inter,Arial,sans-serif;color:${TEXT};">
    <div style="max-width:560px;margin:0 auto;background:${CARD};border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
      <div style="padding:24px 32px;border-bottom:1px solid #2a2a2a;text-align:center;">
        <span style="font-family:Georgia,'Playfair Display',serif;font-size:28px;letter-spacing:2px;color:${BRAND};">LUXE</span>
      </div>
      <div style="padding:32px;">
        <h1 style="font-family:Georgia,'Playfair Display',serif;font-size:22px;margin:0 0 16px;color:${TEXT};">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center;color:${MUTED};font-size:12px;">
        © ${new Date().getFullYear()} LUXE — Modern Ecommerce. All rights reserved.
      </div>
    </div>
  </div>`;

const button = (label, url) =>
  `<a href="${url}" style="display:inline-block;background:${BRAND};color:#0a0a0a;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;margin:12px 0;">${label}</a>`;

const paragraph = (text) =>
  `<p style="color:${MUTED};font-size:14px;line-height:1.7;margin:0 0 16px;">${text}</p>`;

// ── Templates ──────────────────────────────────────────────────────────
const templates = {
  welcome: ({ name }) => ({
    subject: 'Welcome to LUXE',
    html: layout(
      `Welcome, ${name}!`,
      paragraph('Thank you for joining LUXE — where modern style meets timeless luxury.') +
        paragraph('Explore our latest collection and enjoy a curated shopping experience.')
    ),
  }),

  verifyEmail: ({ name, url }) => ({
    subject: 'Verify your LUXE account',
    html: layout(
      `Hi ${name}, confirm your email`,
      paragraph('Please verify your email address to activate your account.') +
        button('Verify Email', url) +
        paragraph('This link expires in 24 hours. If you didn’t create an account, ignore this email.')
    ),
  }),

  resetPassword: ({ name, url }) => ({
    subject: 'Reset your LUXE password',
    html: layout(
      `Hi ${name}, reset your password`,
      paragraph('We received a request to reset your password. Click below to choose a new one.') +
        button('Reset Password', url) +
        paragraph('This link expires in 30 minutes. If you didn’t request this, you can safely ignore it.')
    ),
  }),

  orderConfirmation: ({ name, order }) => {
    const rows = order.items
      .map(
        (i) => `
        <tr>
          <td style="padding:8px 0;color:${TEXT};font-size:14px;">${i.name} ${
          i.size ? `· ${i.size}` : ''
        } ${i.color ? `· ${i.color}` : ''} × ${i.quantity}</td>
          <td style="padding:8px 0;color:${TEXT};font-size:14px;text-align:right;">$${i.subtotal.toFixed(
          2
        )}</td>
        </tr>`
      )
      .join('');

    return {
      subject: `Order Confirmed — ${order.orderNumber}`,
      html: layout(
        `Thank you, ${name}!`,
        paragraph(`Your order <strong style="color:${BRAND};">${order.orderNumber}</strong> has been received and is now being processed.`) +
          `<table style="width:100%;border-collapse:collapse;margin:16px 0;border-top:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a;">${rows}</table>` +
          `<table style="width:100%;font-size:14px;color:${MUTED};">
            <tr><td style="padding:4px 0;">Subtotal</td><td style="text-align:right;">$${order.itemsTotal.toFixed(2)}</td></tr>
            <tr><td style="padding:4px 0;">Shipping</td><td style="text-align:right;">$${order.shippingCost.toFixed(2)}</td></tr>
            <tr><td style="padding:4px 0;">Tax</td><td style="text-align:right;">$${order.tax.toFixed(2)}</td></tr>
            ${order.couponDiscount ? `<tr><td style="padding:4px 0;">Discount</td><td style="text-align:right;color:${BRAND};">- $${order.couponDiscount.toFixed(2)}</td></tr>` : ''}
            <tr><td style="padding:12px 0 0;color:${TEXT};font-weight:600;">Total</td><td style="text-align:right;padding:12px 0 0;color:${BRAND};font-weight:700;font-size:16px;">$${order.totalAmount.toFixed(2)}</td></tr>
          </table>`
      ),
    };
  },

  orderStatus: ({ name, order, status }) => ({
    subject: `Order ${order.orderNumber} — ${status}`,
    html: layout(
      `Order update`,
      paragraph(`Hi ${name}, your order <strong style="color:${BRAND};">${order.orderNumber}</strong> is now <strong style="color:${BRAND};">${status}</strong>.`)
    ),
  }),
};

/**
 * Send a templated email. In dev (no SMTP configured) the email is logged to
 * the console and the function resolves without throwing.
 *
 * @param {string} to        recipient email
 * @param {string} template  one of the keys in `templates`
 * @param {object} data      template data
 */
const sendEmail = async (to, template, data = {}) => {
  const tpl = templates[template];
  if (!tpl) throw new Error(`Unknown email template: ${template}`);

  const { subject, html } = tpl(data);
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n📧 [email:dev] →', to, '|', subject);
    if (data.url) console.log('   link:', data.url);
    return { dev: true };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'LUXE Store <no-reply@luxe.com>',
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
