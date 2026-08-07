import { Resend } from 'resend';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<{ id?: string; error?: any }>;
}

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const FROM_EMAIL = process.env.EMAIL_FROM || 'notifications@senyx-erp.local';

export class ResendProvider implements EmailProvider {
  async send(options: EmailOptions, retries = 1): Promise<{ id?: string; error?: any }> {
    try {
      if (process.env.NODE_ENV === 'test' || !process.env.RESEND_API_KEY) {
        console.log(`[Email Mock] To: ${options.to} | Subject: ${options.subject}`);
        return { id: `mock_${Date.now()}` };
      }

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        throw error;
      }

      return { id: data?.id };
    } catch (error) {
      if (retries > 0) {
        console.warn(`Email delivery failed, retrying... (${retries} retries left)`);
        return this.send(options, retries - 1);
      }
      console.error('Email delivery failed after retries:', error);
      return { error };
    }
  }
}

export const emailProvider = new ResendProvider();

export function renderTemplate(templateName: string, variables: Record<string, string>): { html: string; text: string } {
  // A simple robust string replacement for basic templating
  let html = '';
  let text = '';

  switch (templateName) {
    case 'due-date-reminder':
      html = `<p>Hello,</p><p>This is a reminder for: <strong>{{target}}</strong>.</p><p>It is due on {{dueDate}}.</p>`;
      text = `Reminder: ${variables.target} is due on ${variables.dueDate}.`;
      break;
    case 'assignment-notification':
      html = `<p>Hello,</p><p>You have been assigned to: <strong>{{target}}</strong>.</p>`;
      text = `You have been assigned to: ${variables.target}.`;
      break;
    case 'approval-request':
      html = `<p>Action needed: <strong>{{target}}</strong> requires your approval.</p>`;
      text = `Action needed: ${variables.target} requires your approval.`;
      break;
    case 'status-update':
      html = `<p>Status update: <strong>{{target}}</strong> is now <strong>{{status}}</strong>.</p>`;
      text = `Status update: ${variables.target} is now ${variables.status}.`;
      break;
    default:
      html = `<p>You have a new notification regarding {{target}}.</p>`;
      text = `New notification regarding ${variables.target}.`;
  }

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
    text = text.replace(regex, value);
  }

  return { html, text };
}
