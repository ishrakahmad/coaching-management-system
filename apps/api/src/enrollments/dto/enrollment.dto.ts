import { IsDateString, IsNumber, IsOptional, IsUUID, Min, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsUUID()
  batchId: string;

  @ApiProperty({ required: false, example: '2026-09-01', description: 'Defaults to today' })
  @IsOptional()
  @IsDateString({ strict: true })
  enrolledAt?: string;

  @ApiProperty({ required: false, nullable: true, description: 'Monthly fee for this student; null/omitted = batch fee' })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  feeOverride?: number | null;
}

export class UpdateEnrollmentDto {
  @ApiProperty({ required: false, example: '2026-09-01' })
  @IsOptional()
  @IsDateString({ strict: true })
  enrolledAt?: string;

  @ApiProperty({ required: false, nullable: true, description: 'Send null to go back to the batch fee' })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  feeOverride?: number | null;
}

export class LeaveEnrollmentDto {
  @ApiProperty({ required: false, example: '2026-12-31', description: 'Defaults to today' })
  @IsOptional()
  @IsDateString({ strict: true })
  leftAt?: string;
}
