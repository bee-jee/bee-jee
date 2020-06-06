import { IsString, IsEmpty } from 'class-validator';

class CreateNoteDto {
  @IsString()
  @IsEmpty()
  public title: string;

  @IsString()
  public content: string;
}

export default CreateNoteDto;
