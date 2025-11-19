
export function getTokenFromUrl(url) {
  const params = new URLSearchParams(url.search);
  const token = params.get('token');
  
  if (token) {
    params.delete('token');
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.replaceState({}, document.title, newUrl);
    
    return token;
  }
  
  return null;
}
