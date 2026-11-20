// The visitor's country, as Vercel detects it from the IP address (ISO alpha-2 in lower case, or null).
// Used by the seller dashboard so a Pakistani visitor sees plan prices in Rs (display only).
export default function handler(request, response) {
  const raw = request.headers['x-vercel-ip-country'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const country = typeof value === 'string' && /^[A-Za-z]{2}$/.test(value) ? value.toLowerCase() : null;
  response.setHeader('Cache-Control', 'private, no-store');
  response.status(200).json({ country });
}
