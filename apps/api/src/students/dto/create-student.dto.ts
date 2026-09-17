import {
  IsArray, IsBoolean, IsDateString, IsNumber, Min, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength,
  ValidateIf, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { GuardianRelation, StudentStatus } from '../entities/student.entity';
import { CreateGuardianDto } from '../../guardians/dto/guardian.dto';

export class CreateStudentDto {
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

  @ApiProperty({ required: false, description: 'Link an existing guardian. Use either guardianId or guardian, not both.' })
  @IsOptional()
  @IsUUID()
  guardianId?: string;

  @ApiProperty({
    required: false,
    type: CreateGuardianDto,
    description: 'New guardian details. If a guardian with the same phone already exists (a sibling), that record is reused.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGuardianDto)
  guardian?: CreateGuardianDto;

  @ApiProperty({ required: false, enum: GuardianRelation })
  @IsOptional()
  @IsEnum(GuardianRelation)
  guardianRelation?: GuardianRelation;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiProperty({ required: false, example: '2010-05-21' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ required: false, type: [String], description: 'Batches to enroll in on admission (enrolled today)' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  batchIds?: string[];

  @ApiProperty({ required: false, example: 500, description: 'One-off admission fee, added as a due right away' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  admissionFee?: number;

  @ApiProperty({ required: false, description: "Bill this month's batch fees now instead of waiting for the daily run" })
  @IsOptional()
  @IsBoolean()
  billCurrentMonth?: boolean;
}

// Batch changes go through /students/:id/enrollments; email/password get their own flows later.
export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['email', 'password', 'guardian', 'guardianId', 'batchIds', 'admissionFee', 'billCurrentMonth'] as const),
) {
  @ApiProperty({ required: false, nullable: true, description: 'Send null to unlink the guardian' })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  guardianId?: string | null;

  @ApiProperty({ required: false, enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
