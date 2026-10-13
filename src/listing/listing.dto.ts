import { Exclude } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO4217CurrencyCode,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import type { Listing } from '../entities/listing.entity.js';

export class CreateListingDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsIn(['new', 'used'])
  itemCondition: 'new' | 'used';

  @IsIn(['fixed_price', 'best_offer', 'auction'])
  sellingMethod: 'fixed_price' | 'best_offer' | 'auction';

  @IsString()
  @MinLength(10)
  @MaxLength(10_000)
  description: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsISO4217CurrencyCode()
  currency: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsIn(['on_review', 'declined', 'active', 'inactive'])
  status: 'on_review' | 'declined' | 'active' | 'inactive';
}

export class ListingResponse {
  listingId: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  status: string;
  sellingMethod: string;
  itemCondition: string;
  createdAt: string;
  deletedAt: string | null;

  @Exclude()
  searchVector: string;

  constructor(partial: Partial<Listing>) {
    Object.assign(this, partial);
  }
}
