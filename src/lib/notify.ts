import { sendEmail, emailShell, siteUrl, isEmailConfigured } from "@/lib/email";

/**
 * The specific messages JOC sends.
 *
 * Each returns whether it actually went out, so a caller can tell the truth
 * about it. None of them throw — a school invitation is still a real
 * invitation when the mail service is down; it just has to be passed on by
 * hand, and the console says so.
 */

export const JOC_INBOX = "education@justonechesed.org";

/** Someone at a school has been invited to make a login. */
export async function sendInvitation(input: {
  to: string;
  schoolName: string;
  invitedBy?: string | null;
  role: string;
}): Promise<boolean> {
  if (!isEmailConfigured) return false;

  const link = `${siteUrl()}/signup?email=${encodeURIComponent(input.to)}`;
  const from = input.invitedBy ? ` by ${input.invitedBy}` : "";
  const roleWord = input.role === "SCHOOL_ADMIN" ? "an administrator" : "a teacher";

  const r = await sendEmail({
    to: input.to,
    subject: `You've been added to ${input.schoolName} on JOC Education`,
    replyTo: JOC_INBOX,
    text:
      `You have been added${from} to ${input.schoolName} on JOC Education as ${roleWord}.\n\n` +
      `Create your login here:\n${link}\n\n` +
      `JOC Education is where your school's chesed lesson plans, resources and programs live.\n`,
    html: emailShell({
      heading: `You've been added to ${input.schoolName}`,
      body: [
        `You have been added${from} to ${input.schoolName} on JOC Education as ${roleWord}.`,
        "JOC Education is where your school's chesed lesson plans, resources and programs live. Create your login to get in.",
      ],
      action: { label: "Create your login", href: link },
      footnote: "If you were not expecting this, you can ignore it.",
    }),
  });
  return r.ok;
}

/** A school asked for a demo. Confirm to them, and tell JOC. */
export async function sendDemoRequestEmails(input: {
  name: string;
  email: string;
  schoolName: string;
  role?: string | null;
  phone?: string | null;
  message?: string | null;
  preferred?: string | null;
}): Promise<boolean> {
  if (!isEmailConfigured) return false;

  const toSchool = sendEmail({
    to: input.email,
    subject: "We got your request — JOC Education",
    replyTo: JOC_INBOX,
    text:
      `Hello ${input.name},\n\n` +
      `Thank you for asking about JOC Education for ${input.schoolName}. Someone from Just One Chesed will be in touch to arrange a time.\n\n` +
      `If anything changes, reply to this message.\n`,
    html: emailShell({
      heading: "We got your request",
      body: [
        `Hello ${input.name},`,
        `Thank you for asking about JOC Education for ${input.schoolName}. Someone from Just One Chesed will be in touch to arrange a time that suits you.`,
        "If anything changes in the meantime, reply to this message.",
      ],
    }),
  });

  const toJoc = sendEmail({
    to: JOC_INBOX,
    subject: `Demo request — ${input.schoolName}`,
    replyTo: input.email,
    text: [
      `School:    ${input.schoolName}`,
      `Name:      ${input.name}`,
      `Email:     ${input.email}`,
      input.role ? `Role:      ${input.role}` : null,
      input.phone ? `Phone:     ${input.phone}` : null,
      input.preferred ? `Preferred: ${input.preferred}` : null,
      "",
      input.message ? `Message:\n${input.message}` : "No message.",
      "",
      `In the console: ${siteUrl()}/admin/demos`,
    ]
      .filter((l) => l !== null)
      .join("\n"),
  });

  const [a, b] = await Promise.all([toSchool, toJoc]);
  return a.ok && b.ok;
}

/** The contact form. */
export async function sendContactMessage(input: {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}): Promise<boolean> {
  if (!isEmailConfigured) return false;

  const r = await sendEmail({
    to: JOC_INBOX,
    subject: input.subject?.trim() || `Message from ${input.name}`,
    replyTo: input.email,
    text: `From: ${input.name} <${input.email}>\n\n${input.message}\n`,
  });
  return r.ok;
}
