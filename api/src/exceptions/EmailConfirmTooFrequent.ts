import HttpException from './HttpException';

class EmailConfirmTooFrequent extends HttpException {
  constructor() {
    super(400, 'Your request to re-send confirmation email is too frequent, please try again in 5 minutes.');
  }
}

export default EmailConfirmTooFrequent;
