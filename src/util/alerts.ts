import nodemailer from "nodemailer";
import axios from "axios";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function sendLedgerAlert(inconsistencies: any[]) {
  const subject = `[Ledger Alert] ${inconsistencies.length} wallet inconsistencies detected`;

  const html = `
    <h3>Ledger Reconciliation Alert</h3>
    <p>${inconsistencies.length} wallets have mismatched balances.</p>
    <pre>${JSON.stringify(inconsistencies.slice(0, 10), null, 2)}</pre>
    <p>See <b>ledger_audit_log</b> for full details.</p>
  `;

  // Email (configure with your SMTP)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ALERT_EMAIL_USER,
      pass: process.env.ALERT_EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.ALERT_EMAIL_USER,
    to: process.env.IT_RISK_EMAIL || process.env.ALERT_EMAIL_USER,
    subject,
    html
  });

  // Slack (optional)
  if (SLACK_WEBHOOK_URL) {
    await axios.post(SLACK_WEBHOOK_URL, {
      text: `*${inconsistencies.length} wallet inconsistencies detected!*\nCheck ledger_audit_log for details.`
    });
  }

  console.log("Ledger alert dispatched.");
}
