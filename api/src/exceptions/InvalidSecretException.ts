import HttpException from './HttpException';

class InvalidSecretException extends HttpException {
  constructor() {
    super(400, 'Your URL is invalid');
  }
}

export default InvalidSecretException;
