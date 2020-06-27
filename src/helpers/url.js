export function apiUrl(path) {
  return `${process.env.REACT_APP_API_URL}${path}`;
}
