import { IsString, IsOptional, Length } from 'class-validator';

class CreateNoteDto {
  @IsString()
  @IsOptional()
  @Length(0, 255)
  public title: string;

  @IsString()
  public content: string;

  @IsString()
  public contentType: string;

  @IsString({ each: true })
  @IsOptional()
  public drawings: string[];
}

export default CreateNoteDto;
