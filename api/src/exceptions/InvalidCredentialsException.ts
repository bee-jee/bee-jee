import HttpException from './HttpException';

class InvalidCredentialsException extends HttpException {
  constructor() {
    super(401, 'Invalid username or password');
  }
}

export default InvalidCredentialsException;
