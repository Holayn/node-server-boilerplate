import dotenv from 'dotenv';

dotenv.config();

const { NOTIFY_SERVICE_URL, NOTIFY_SERVICE_USER } = process.env;

type NotifyData = {
  [key: string]: string;
  user: string;
};

export async function notify(
  message: string,
  data: NotifyData = {} as NotifyData,
) {
  if (!NOTIFY_SERVICE_URL) {
    throw new Error('Notify service URL is not defined.');
  }

  const { ok } = await fetch(NOTIFY_SERVICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      ...data,
      user: data.user || NOTIFY_SERVICE_USER,
    }),
  });

  if (!ok) {
    throw new Error('Failed to send notification');
  }
}
