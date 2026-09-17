import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateMechanicDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @IsOptional()
  @IsString()
  shiftHours?: string;

  @IsOptional()
  @IsNumber()
  dailySalary?: number;

  @IsOptional()
  @IsNumber()
  monthlySalary?: number;
}
