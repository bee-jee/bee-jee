import { IsString, IsOptional } from 'class-validator';

class CreateNoteDto {
  @IsString()
  @IsOptional()
  public title: string;

  @IsString()
  public content: string;

  @IsString({ each: true })
  @IsOptional()
  public drawings: string[];
}

export default CreateNoteDto;
