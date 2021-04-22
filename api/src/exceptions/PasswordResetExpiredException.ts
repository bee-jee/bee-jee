import HttpException from './HttpException';

class PasswordResetExpiredException extends HttpException {
  constructor() {
    super(400, 'Your request to reset password has expired, please try resetting your password again.', 'passResetExpired');
  }
}

export default PasswordResetExpiredException;
