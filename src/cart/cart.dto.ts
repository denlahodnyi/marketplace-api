import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateCartItemDto {
  @IsUUID()
  listingId: string;

  @IsInt()
  @Min(1)
  // TODO: add max???
  quantity: number;
}

export class UpdateCartItemDto extends CreateCartItemDto {}
