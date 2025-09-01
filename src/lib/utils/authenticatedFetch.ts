interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function authenticatedFetch(url: string, options?: FetchOptions): Promise<Response> {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const defaultOptions: FetchOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    },
  };
  const mergedOptions = { ...defaultOptions, ...options };
  return fetch(url, mergedOptions);
}


export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}


export function isLoggedIn(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('access_token');
  }
  return false;
}
