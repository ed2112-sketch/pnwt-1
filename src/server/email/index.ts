import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await getResend().emails.send({
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

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderName: string;
  orderId: string;
  eventTitle: string;
  eventDate: Date;
  venueName: string;
  tickets: Array<{ ticketNumber: string; ticketTypeName: string }>;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const ticketListHtml = params.tickets
    .map((t) => `<li><strong>${t.ticketTypeName}</strong> — ${t.ticketNumber}</li>`)
    .join("");

  const dateStr = params.eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  await getResend().emails.send({
    from: "PNWTickets <noreply@pnwtickets.com>",
    to: params.to,
    subject: `Your tickets for ${params.eventTitle} — PNWTickets`,
    html: `
      <h2>Order Confirmed!</h2>
      <p>Hi ${params.orderName},</p>
      <p>Your order for <strong>${params.eventTitle}</strong> has been confirmed.</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Venue:</strong> ${params.venueName}</p>
      <h3>Your Tickets</h3>
      <ul>${ticketListHtml}</ul>
      <p><a href="${appUrl}/checkout/confirmation?orderId=${params.orderId}">View & download your tickets</a></p>
      <p>See you there!</p>
    `,
  });
}

export async function sendWaitlistNotificationEmail(params: {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: Date;
  venueName: string;
  purchaseUrl: string;
  expiresAt: Date;
}) {
  const dateStr = params.eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const expiresStr = params.expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  await getResend().emails.send({
    from: "PNWTickets <noreply@pnwtickets.com>",
    to: params.to,
    subject: `Tickets available for ${params.eventTitle}!`,
    html: `
      <h2>Great news, ${params.name}!</h2>
      <p>Tickets are now available for <strong>${params.eventTitle}</strong>.</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Venue:</strong> ${params.venueName}</p>
      <p><a href="${params.purchaseUrl}">Purchase your tickets now</a></p>
      <p><strong>Important:</strong> This offer expires on ${expiresStr}. After that, the next person on the waitlist will be notified.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
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
