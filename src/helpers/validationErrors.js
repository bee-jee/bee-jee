class ValidationErrors {
  errors = {};
  formError = '';

  constructor(errors) {
    if (typeof errors !== 'undefined') {
      this.setErrors(errors);
    }
  }

  addError(key, message) {
    let errors = [];
    if (key in this.errors) {
      errors = this.errors[key];
    }
    if (Array.isArray(message)) {
      errors = errors.concat(message);
    } else {
      errors.push(message);
    }
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
    this.formError = '';
  }

  setErrors(errors) {
    this.errors = errors;
  }

  setFormError(formError) {
    this.formError = formError;
  }
}

export default ValidationErrors;
