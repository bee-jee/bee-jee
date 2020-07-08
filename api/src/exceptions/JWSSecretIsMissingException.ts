import HttpException from './HttpException';

class JWTSecretIsMissingException extends HttpException {
  constructor() {
    super(500, 'JWS_SECRET is missing');
  }
}

export default JWTSecretIsMissingException;
