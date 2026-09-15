import {
  IsArray, IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

// Creates the underlying User (role=teacher) together with the Teacher profile.
export class CreateTeacherDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  qualification?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlySalary?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  subjectIds?: string[];
}

// Email and password changes get their own flows later (they affect login).
export class UpdateTeacherDto extends PartialType(OmitType(CreateTeacherDto, ['email', 'password'] as const)) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
