import {
  ArrayMinSize, IsArray, IsDateString, IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength,
  Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment.entity';

export class AllocationDto {
  @ApiProperty()
  @IsUUID()
  feeId: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 3000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ required: false, description: 'bKash/Nagad transaction ID, bank reference...' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiProperty({ required: false, example: '2026-09-15', description: 'Defaults to today' })
  @IsOptional()
  @IsDateString({ strict: true })
  paidAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @ApiProperty({
    required: false,
    type: [AllocationDto],
    description: 'Which fees this pays. Omit to pay the oldest dues first. Amounts must add up to `amount`.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AllocationDto)
  allocations?: AllocationDto[];
}

export class VoidPaymentDto {
  @ApiProperty({ example: 'Entered twice by mistake' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;
}

export class PaymentsQueryDto {
  @ApiProperty({ required: false, example: '2026-09-01' })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiProperty({ required: false, example: '2026-09-30' })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @ApiProperty({ required: false, enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsIn(['true', 'false'])
  includeVoided?: 'true' | 'false';
}
