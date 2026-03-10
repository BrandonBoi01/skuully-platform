import { IsString, MinLength } from "class-validator";

export class CreateProgramDto {
  @IsString()
  @MinLength(2)
  templateCode: string;

  @IsString()
  @MinLength(2)
  name: string;
}