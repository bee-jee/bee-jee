import {
  IsEmail, IsNotEmpty, IsString, ValidateIf,
} from 'class-validator';

export class PasswordResetDto {
  @IsString()
  @ValidateIf((o: any) => !o.email)
  @IsNotEmpty()
  public username: string;

  @IsString()
  @ValidateIf((o: any) => !o.username)
  @IsNotEmpty()
  @IsEmail()
  public email: string;
}
