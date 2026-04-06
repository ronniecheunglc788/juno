import { Composio } from 'composio-core';

export const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// Apps we ask users to connect, in order of importance for detection
export const APPS = [
  { id: 'gmail',            label: 'Gmail',             required: true  },
  { id: 'googlecalendar',   label: 'Google Calendar',   required: true  },
  { id: 'notion',           label: 'Notion',             required: false },
  { id: 'slack',            label: 'Slack',              required: false },
  { id: 'linkedin',         label: 'LinkedIn',           required: false },
  { id: 'github',           label: 'GitHub',             required: false },
  { id: 'discord',          label: 'Discord',            required: false },
  { id: 'twitterv2',        label: 'Twitter / X',        required: false },
  { id: 'instagram',        label: 'Instagram',          required: false },
  { id: 'youtube',          label: 'YouTube',            required: false },
  { id: 'googledrive',      label: 'Google Drive',       required: false },
  { id: 'googlesheets',     label: 'Google Sheets',      required: false },
  { id: 'todoist',          label: 'Todoist',            required: false },
  { id: 'asana',            label: 'Asana',              required: false },
  { id: 'whatsapp',         label: 'WhatsApp',           required: false },
  { id: 'spotify',          label: 'Spotify',            required: false },
  { id: 'strava',           label: 'Strava',             required: false },
];

// Generate a stable entity ID from email (Composio entity = one user's connected apps)
export function entityIdFromEmail(email) {
  return 'breeze_' + email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
