import { IsEmail, IsNotEmpty, IsOptional, IsNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Creates the underlying User (role=teacher) together with the Teacher profile.
export class CreateTeacherDto {
  @ApiProperty()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  designation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  qualification?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  monthlySalary?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  subjectIds?: string[];
}
