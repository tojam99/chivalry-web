import { createClient } from './supabase-browser';

interface EmailNotificationParams {
  type: 'match' | 'like' | 'date_request' | 'date_confirmed' | 'first_message';
  recipientProfileId: string;
  senderName?: string;
  dateTitle?: string;
  dateLocation?: string;
  dateTime?: string;
}

export async function sendEmailNotification(params: EmailNotificationParams) {
  try {
    const supabase = createClient();
    const { error } = await supabase.functions.invoke('send-email-notification', {
      body: params,
    });
    if (error) console.error('Email notification error:', error);
  } catch (err) {
    console.error('Email notification error:', err);
  }
}
