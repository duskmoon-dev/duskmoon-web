const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function docsPath(path = '') {
  return `${base}/${path}`;
}
