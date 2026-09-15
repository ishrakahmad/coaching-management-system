import { IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  session?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  monthlyFee?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  schedule?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  leadTeacherId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  subjectIds?: string[];
}
