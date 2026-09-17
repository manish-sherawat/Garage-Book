import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  registrationNo: string;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsString()
  fuelType: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  odometer?: number;

  @IsString()
  customerId: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  odometer?: number;

  @IsOptional()
  @IsString()
  customerId?: string;
}
