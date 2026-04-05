import { createClient } from './supabase-browser';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pkekuxksofbzjrieesqm.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch(`${SUPABASE_URL}/functions/v1/send-email-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.error('Email notification error:', err);
  }
}
