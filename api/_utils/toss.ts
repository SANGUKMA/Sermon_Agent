const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;
const TOSS_BASE_URL = 'https://api.tosspayments.com';

export async function tossRequest(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
): Promise<any> {
  const encoded = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

  const res = await fetch(`${TOSS_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.message || `Toss API error: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
