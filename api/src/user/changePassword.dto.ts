import { IsString, Length, IsNotEmpty } from 'class-validator';
import { Match } from '../validation/match.decorator';

class ChangePasswordDto {
  @IsString()
  @Length(7, 72)
  public newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Match('newPassword')
  public newPasswordConfirm: string;
}

export default ChangePasswordDto;
