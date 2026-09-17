export class CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: string;
  vehicles?: {
    model: string;
    registrationNo: string;
    fuelType?: string;
    make?: string;
  }[];
}
