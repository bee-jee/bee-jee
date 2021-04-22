import HttpException from './HttpException';

class PasswordResetTooFrequentException extends HttpException {
  constructor() {
    super(429, 'You have requested to reset password too frequently, please wait up to 15 minutes before trying again.', 'tooFreqPassReset');
  }
}

export default PasswordResetTooFrequentException;
