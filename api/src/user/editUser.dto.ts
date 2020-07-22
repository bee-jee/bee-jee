import { IsString } from 'class-validator';

class EditUserDto {
  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsString()
  public role: string;
}

export default EditUserDto;
