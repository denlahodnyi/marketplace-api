import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Listing } from '../entities/listing.entity.js';
import { ListingAdminReview } from '../entities/listingAdminReview.entity.js';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingsRepo: Repository<Listing>,
    private readonly dataSource: DataSource,
  ) {}

  createListing(body: Partial<Listing>) {
    const l = this.listingsRepo.create(body);
    l.status = 'on_review';
    return this.listingsRepo.save(l);
  }

  async updateListing(listingId: string, updatedListing: Partial<Listing>) {
    const listing = await this.listingsRepo.findOneBy({ listingId });
    if (!listing) throw new NotFoundException("Listing doesn't exist");
    if (updatedListing.categoryId)
      listing.categoryId = updatedListing.categoryId;
    if (updatedListing.currency) listing.currency = updatedListing.currency;
    if (updatedListing.description)
      listing.description = updatedListing.description;
    if (updatedListing.itemCondition)
      listing.itemCondition = updatedListing.itemCondition;
    if (updatedListing.price) listing.price = updatedListing.price;
    if (updatedListing.quantity) listing.quantity = updatedListing.quantity;
    if (updatedListing.sellingMethod)
      listing.sellingMethod = updatedListing.sellingMethod;
    if (updatedListing.title) listing.title = updatedListing.title;
    listing.status = 'on_review';
    return this.listingsRepo.save(listing);
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

  getOnReviewListings() {
    return this.listingsRepo.find({ where: { status: 'on_review' }, take: 20 });
  }

  /**
   * Admin declines listing
   */
  declineListing(listingId: string, adminId: string, reason: string) {
    return this.dataSource.transaction(async (tx) => {
      await tx
        .getRepository(Listing)
        .findOne({ where: { listingId }, lock: { mode: 'for_no_key_update' } });
      const review = new ListingAdminReview();
      review.listingId = listingId;
      review.adminId = adminId;
      review.status = 'decline';
      review.declineReason = reason;
      review.reviewedAt = new Date().toISOString();
      await tx.getRepository(ListingAdminReview).save(review);
      await tx.getRepository(Listing).update(listingId, { status: 'declined' });
    });
  }

  /**
   * Admin approves listing
   */
  approveListing(listingId: string, adminId: string) {
    return this.dataSource.transaction(async (tx) => {
      await tx
        .getRepository(Listing)
        .findOne({ where: { listingId }, lock: { mode: 'for_no_key_update' } });
      const review = new ListingAdminReview();
      review.listingId = listingId;
      review.adminId = adminId;
      review.status = 'accept';
      review.reviewedAt = new Date().toISOString();
      await tx.getRepository(ListingAdminReview).save(review);
      await tx.getRepository(Listing).update(listingId, { status: 'active' });
    });
  }
}
