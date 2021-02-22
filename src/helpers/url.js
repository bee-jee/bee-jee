export function apiUrl(path) {
  return `${process.env.VUE_APP_API_URL}${path}`;
}

export function isValidURL(str) {
  try {
    new URL(str);
  } catch {
    return false;
  }
  return true;
}

export function getNoteUrl(note) {
  return `/${note._id}`;
}
