import { IsString, Length } from 'class-validator';
import { Match } from '../validation/match.decorator';

class ChangeOwnPasswordDto {
  @IsString()
  public currentPassword: string;

  @IsString()
  @Length(7, 72)
  public newPassword: string;

  @IsString()
  @Match('newPassword')
  public newPasswordConfirm: string;
}

export default ChangeOwnPasswordDto;
