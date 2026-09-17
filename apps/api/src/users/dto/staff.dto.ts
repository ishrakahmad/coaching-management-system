import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

// Roles an institute admin can hand out. Teachers, students and guardians have their own flows.
export const ASSIGNABLE_STAFF_ROLES = [Role.MANAGER, Role.ACCOUNTANT, Role.EMPLOYEE] as const;

export class CreateStaffDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ASSIGNABLE_STAFF_ROLES })
  @IsIn(ASSIGNABLE_STAFF_ROLES)
  role: Role;
}

export class UpdateStaffDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ required: false, enum: ASSIGNABLE_STAFF_ROLES })
  @IsOptional()
  @IsIn(ASSIGNABLE_STAFF_ROLES)
  role?: Role;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
