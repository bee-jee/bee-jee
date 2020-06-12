import HttpException from './HttpException';

class InvalidObjectIdException extends HttpException {
  constructor(id: string) {
    super(400, `${id} is not a valid ObjectId`);
  }
}

export default InvalidObjectIdException;
