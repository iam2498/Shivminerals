const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export async function api(path, opts = {}) {
  const cleanPath = path.startsWith('/') ? path : `/api/${path}`;
  const url = `${API_BASE}${cleanPath}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };

  const res = await fetch(url, {
    ...opts,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = (data && data.error) || (data && data.detail) || (typeof data === 'string' ? data : res.statusText);
    throw new Error(errorMsg || 'API Error');
  }

  return data;
}

export async function post(path, body) {
  return api(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function del(kind, id) {
  return api(`${kind}/${id}`, {
    method: 'DELETE',
  });
}
