export const getConfigState = (store) => store.config;

export const getConfig = (store, key) =>
  getConfigState(store) ? getConfigState(store)[key] : null;

export const toContentType = (value) => {
  switch (value) {
    case 'wysiwyg':
      return 'html';
    default:
      return value;
  }
};

export const toEditType = (value) => {
  switch (value) {
    case 'html':
      return 'wysiwyg';
    default:
      return value;
  }
};
