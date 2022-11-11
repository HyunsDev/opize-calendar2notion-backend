import { IsString } from 'class-validator';

export class NotionAccountDTO {
  @IsString()
  code: string;
}
