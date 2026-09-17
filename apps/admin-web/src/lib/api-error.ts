import axios from 'axios';

/** Turns an API error into one readable sentence for the user. */
export function getErrorMessage(error: unknown, fallback = 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।') {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Server-এ পৌঁছানো যাচ্ছে না। Internet বা backend চলছে কিনা দেখুন।';
    if (error.response.status === 403) return 'এই কাজের অনুমতি আপনার নেই।';
    const message = (error.response.data as { message?: string | string[] })?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  }
  return fallback;
}
