import {
  IsString, IsOptional, Length, IsEnum, IsArray, IsBoolean,
} from 'class-validator';
import { Visibility, Permission } from '../share/share.interface';

class EditNoteDto {
  @IsString()
  @IsOptional()
  @Length(0, 255)
  public title?: string;

  @IsString()
  @IsOptional()
  public content?: string;

  @IsBoolean()
  @IsOptional()
  public guestAccess?: boolean;

  @IsString()
  @IsOptional()
  @IsEnum(Visibility)
  public visibility?: Visibility;

  @IsArray()
  @IsOptional()
  public sharedUsers?: {
    username: string;
    permission: Permission;
  }[];
}

export default EditNoteDto;
