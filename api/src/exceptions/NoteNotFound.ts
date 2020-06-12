import HttpException from './HttpException';

class NoteNotFoundException extends HttpException {
  constructor(id: string) {
    super(404, `Note ${id} is not found`);
  }
}

export default NoteNotFoundException;
