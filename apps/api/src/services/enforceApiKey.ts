export default function (token: string | null) {
  if (!process.env.API_KEY) {
    console.warn('API_KEY is not set');
    return true;
  }

  if (!token) {
    return false;
  }

  return token === `Bearer ${process.env.API_KEY}`;
}
