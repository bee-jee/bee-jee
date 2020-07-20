import { IsString, Length } from 'class-validator';

class CreateUserDto {
  @IsString()
  @Length(4, 64)
  public username: string;

  @IsString()
  @Length(7, 72)
  public password: string;

  @IsString()
  public email: string;

  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;
}

export default CreateUserDto;
