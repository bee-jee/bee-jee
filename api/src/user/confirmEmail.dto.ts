import { IsString } from 'class-validator';

export class ConfirmEmailDto {
  @IsString()
  public username: string;

  @IsString()
  public secret: string;
}
