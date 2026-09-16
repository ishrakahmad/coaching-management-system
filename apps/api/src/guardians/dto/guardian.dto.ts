import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

// Bangladeshi mobile: 01XXXXXXXXX, optionally with +88 / 88 prefix. Stored normalised as 01XXXXXXXXX.
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

export class CreateGuardianDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ required: false, example: '01711111111' })
  @IsOptional()
  @Matches(BD_PHONE, { message: 'phone must be a valid Bangladeshi mobile number (01XXXXXXXXX)' })
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;
}

export class UpdateGuardianDto extends PartialType(CreateGuardianDto) {}

export class CreateGuardianAccountDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}
