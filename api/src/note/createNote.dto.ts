import {
  IsString, IsOptional, Length, IsEnum, IsArray,
} from 'class-validator';
import { Visibility, Permission } from '../share/share.interface';

class CreateNoteDto {
  @IsString()
  @IsOptional()
  @Length(0, 255)
  public title: string;

  @IsString({ each: true })
  @IsOptional()
  public drawings: string[];

  @IsString()
  @IsOptional()
  @IsEnum(Visibility)
  public visibility: Visibility;

  @IsArray()
  @IsOptional()
  public sharedUsers: {
    username: string;
    permission: Permission;
  }[];

  @IsString()
  @IsOptional()
  public parentNoteId: string | undefined;
}

export default CreateNoteDto;
