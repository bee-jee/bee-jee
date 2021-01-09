import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Match } from '../validation/match.decorator';
import { UniqueDB } from '../validation/uniqueDB.decorator';

export class RegisterUserDto {
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
  @IsNotEmpty({ message: 'First name should not be empty' })
  public firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name should not be empty' })
  public lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @UniqueDB({ modelName: 'User', field: 'email' })
  public email: string;
}
