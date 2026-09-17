import { PartialType } from '@nestjs/mapped-types';
import { CreateJobCardDto } from './create-job-card.dto';

export class UpdateJobCardDto extends PartialType(CreateJobCardDto) {}
