class ValidationErrors {
  errors = {};

  constructor(errors) {
    if (typeof errors !== 'undefined') {
      this.errors = errors;
    }
  }

  addError(key, message) {
    if (!(key in this.errors)) {
      this.errors[key] = [];
    }
    this.errors[key].push(message);
  }

  has(key) {
    return key in this.errors && this.errors[key].length;
  }

  getErrors(key) {
    return this.errors[key];
  }

  getFirst(key) {
    return this.errors[key][0];
  }

  reset() {
    this.errors = {};
  }
}

export default ValidationErrors;
