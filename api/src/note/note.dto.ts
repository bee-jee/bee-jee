import { IsString, IsOptional } from 'class-validator';

class CreateNoteDto {
  @IsString()
  @IsOptional()
  public title: string;

  @IsString()
  public content: string;
}

export default CreateNoteDto;
