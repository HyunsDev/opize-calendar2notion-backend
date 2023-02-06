import { IsString } from 'class-validator';

export class NotionDatabaseDTO {
  @IsString()
  id: string;
}
