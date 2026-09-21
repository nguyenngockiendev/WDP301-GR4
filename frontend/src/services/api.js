let csrf = '';
export async function api(path, options = {}) {
  const response = await fetch('/api' + path, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  if (data.csrf) csrf = data.csrf;
  return data;
}
export const send = (path, body, method = 'POST') =>
  api(path, { method, body: JSON.stringify(body) });
