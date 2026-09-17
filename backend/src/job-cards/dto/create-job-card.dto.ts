import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PartDto {
  @IsString()
  partId: string;

  @IsNumber()
  qty: number;
}

export class CreateJobCardDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  mechanicName?: string;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartDto)
  parts?: PartDto[];
}
