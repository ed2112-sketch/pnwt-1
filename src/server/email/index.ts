import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: "PNWTickets <noreply@pnwtickets.com>",
    to: email,
    subject: "Verify your email — PNWTickets",
    html: `
      <h2>Welcome to PNWTickets!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "PNWTickets <noreply@pnwtickets.com>",
    to: email,
    subject: "Reset your password — PNWTickets",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
