class HttpException extends Error {
  constructor(public status: number, public message: string, public errorCode: string = 'not_defined') {
    super(message);
  }
}

export default HttpException;
