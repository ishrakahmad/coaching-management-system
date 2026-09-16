import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateAcademicSessionDto {
  @ApiProperty({ example: '2026-2027' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @ApiProperty({ required: false, nullable: true, example: '2026-01-01' })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDateString({ strict: true })
  startDate?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '2026-12-31' })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDateString({ strict: true })
  endDate?: string | null;

  @ApiProperty({ required: false, description: 'Making a session current un-marks the previous one' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

export class UpdateAcademicSessionDto extends PartialType(CreateAcademicSessionDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
