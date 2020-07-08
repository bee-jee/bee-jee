import { IsString } from 'class-validator';

class LoginDto {
  @IsString()
  public username: string;

  @IsString()
  public password: string;
}

export default LoginDto;
