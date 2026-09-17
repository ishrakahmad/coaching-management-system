import {
  IsDateString, IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, MaxLength, Min, ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeeStatus, FeeType } from '../entities/student-fee.entity';
import { PERIOD_PATTERN } from '../../common/utils/period';

export class GenerateMonthlyFeesDto {
  @ApiProperty({ example: '2026-10', description: 'Billing month, YYYY-MM. Up to next month.' })
  @Matches(PERIOD_PATTERN, { message: 'period must look like YYYY-MM' })
  period: string;

  @ApiProperty({ required: false, description: 'Only this batch' })
  @IsOptional()
  @IsUUID()
  batchId?: string;
}

const ONE_OFF_TYPES = [FeeType.ADMISSION, FeeType.EXAM, FeeType.OTHER] as const;

export class CreateFeeDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: ONE_OFF_TYPES, description: 'Monthly fees come from generation, not this endpoint' })
  @IsIn(ONE_OFF_TYPES)
  type: FeeType;

  @ApiProperty({ example: 'Admission fee' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiProperty({ required: false, example: '2026-10-10' })
  @IsOptional()
  @IsDateString({ strict: true })
  dueDate?: string;

  @ApiProperty({ required: false, description: 'Batch this fee belongs to, if any' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class UpdateFeeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false, description: 'Discount or scholarship on this fee' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiProperty({ required: false, nullable: true })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDateString({ strict: true })
  dueDate?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class WaiveFeeDto {
  @ApiProperty({ example: 'Sibling concession approved by director' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;
}

export class DuesQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiProperty({ required: false, description: 'Student name, student ID or guardian phone' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiProperty({ required: false, description: 'Only fees whose due date has passed' })
  @IsOptional()
  @IsIn(['true', 'false'])
  overdueOnly?: 'true' | 'false';
}

export class FeesQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(PERIOD_PATTERN, { message: 'period must look like YYYY-MM' })
  period?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiProperty({ required: false, enum: FeeStatus })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;
}

export class SummaryQueryDto {
  @ApiProperty({ required: false, example: '2026-09', description: 'Defaults to the current month' })
  @IsOptional()
  @Matches(PERIOD_PATTERN, { message: 'period must look like YYYY-MM' })
  period?: string;
}
