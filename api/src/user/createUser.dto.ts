import { IsString, Length, IsNotEmpty } from 'class-validator';
import { Match } from '../validation/match.decorator';

class CreateUserDto {
  @IsString()
  @Length(4, 64)
  public username: string;

  @IsString()
  @Length(7, 72)
  public password: string;

  @IsString()
  @IsNotEmpty()
  @Match('password')
  public passwordConfirm: string;

  @IsString()
  @IsNotEmpty()
  public role: string;

  @IsString()
  @IsNotEmpty()
  public firstName: string;

  @IsString()
  @IsNotEmpty()
  public lastName: string;
}

export default CreateUserDto;
