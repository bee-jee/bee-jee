import {
  IsString,
  Length,
  IsNotEmpty,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { Match } from '../validation/match.decorator';
import { UniqueDB } from '../validation/uniqueDB.decorator';

class CreateUserDto {
  @IsString()
  @Length(4, 64)
  @UniqueDB({ modelName: 'User', field: 'username' })
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

  @IsEmail()
  @IsOptional()
  @UniqueDB({ modelName: 'User', field: 'email' })
  public email: string;
}

export default CreateUserDto;
