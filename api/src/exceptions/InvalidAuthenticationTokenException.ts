import HttpException from './HttpException';

class InvalidAuthenticationTokenException extends HttpException {
  constructor(message?: string) {
    super(401, message || 'Invalid authentication token');
  }
}

export default InvalidAuthenticationTokenException;
