import HttpException from './HttpException';

export class CannotConfirmEmailException extends HttpException {
  constructor() {
    super(404, 'Invalid email confirmation URL, make sure you use the correct URL sent via email');
  }
}
