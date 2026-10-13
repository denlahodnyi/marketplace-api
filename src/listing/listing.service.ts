import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Listing } from '../entities/listing.entity.js';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingsRepo: Repository<Listing>,
  ) {}

  async createListing(body: Partial<Listing>) {
    const l = this.listingsRepo.create(body);
    l.status = 'on_review';
    return await this.listingsRepo.save(l);
  }

  findListingById(listingId: string) {
    return this.listingsRepo.findOne({
      where: { listingId },
      select: {
        listingId: true,
        userId: true,
        categoryId: true,
        title: true,
        description: true,
        itemCondition: true,
        sellingMethod: true,
        status: true,
        price: true,
        currency: true,
        quantity: true,
        createdAt: true,
        deletedAt: true,
        searchVector: true,
      },
    });
  }
}
