import HttpException from './HttpException';

class InvalidAuthenticationTokenException extends HttpException {
  constructor() {
    super(401, 'Invalid authentication token');
  }
}

export default InvalidAuthenticationTokenException;
