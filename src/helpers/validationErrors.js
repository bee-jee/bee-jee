class ValidationErrors {
  errors = {};

  constructor(errors) {
    if (typeof errors !== 'undefined') {
      this.errors = errors;
    }
  }

  addError(key, message) {
    let errors = [];
    if (key in this.errors) {
      errors = this.errors[key];
    }
    errors.push(message);
    this.errors = {
      ...this.errors,
      [key]: errors,
    };
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
