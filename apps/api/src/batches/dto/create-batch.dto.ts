import {
  IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateIf,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  session?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  schedule?: string;

  @ApiProperty({ required: false, nullable: true, description: 'Send null to remove the lead teacher' })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  leadTeacherId?: string | null;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  subjectIds?: string[];
}

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
