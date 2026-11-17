import type { RedisClientType } from '@keyv/redis';

import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { Repository, DataSource } from 'typeorm';

import { Listing } from '../entities/listing.entity.js';
import { ListingAdminReview } from '../entities/listingAdminReview.entity.js';
import { REDIS_CACHE_CLIENT } from '../redis/redis.module.js';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingsRepo: Repository<Listing>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject(REDIS_CACHE_CLIENT) private readonly redis: RedisClientType,
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
    const result = await this.listingsRepo.save(listing);
    await this.cache.del(`listing:${listingId}`);
    return result;
  }

  async findListingById(listingId: string) {
    const cacheKey = `listing:${listingId}`;
    const isDemo = process.env.ENABLE_CACHE_DEMO_STATS === 'true';
    if (isDemo) {
      await this.redis.increx(cacheKey + ':reqCount', {
        expiration: { type: 'PX', value: 30_000 },
      });
    }
    const hit = await this.cache.get(cacheKey);
    if (hit) return hit as Listing | null;
    // Stampede protection via lock
    const token = randomUUID();
    const lockKey = `lock:listing:${listingId}`;
    const lock = await this.redis.set(lockKey, token, {
      condition: 'NX',
      expiration: { type: 'PX', value: 5000 },
    });
    // TODO: add fencing token
    if (lock === 'OK') {
      try {
        const result = await this.listingsRepo.findOne({
          where: { listingId },
        });
        if (isDemo) {
          await this.redis.increx(cacheKey + ':dbHits', {
            expiration: { type: 'PX', value: 30_000 },
          });
        }
        this.cache.set(
          cacheKey,
          result,
          300_000 + Math.floor(Math.random() * 60_000), // ttl: 5m + jitter: 0-1m
        );
        return result;
      } finally {
        await this.redis.delEx(lockKey, {
          condition: 'IFEQ',
          matchValue: token,
        });
      }
    }

    for (let i = 0; i < 5; i++) {
      await setTimeout(1000);
      const retryHit = await this.cache.get(cacheKey);
      if (retryHit) return hit as Listing | null;
    }

    // Fallback
    const result = await this.listingsRepo.findOne({
      where: { listingId },
    });
    if (isDemo) {
      await this.redis.increx(cacheKey + ':dbHits', {
        expiration: { type: 'PX', value: 30_000 },
      });
    }
    return result;
  }

  getOnReviewListings() {
    return this.listingsRepo.find({ where: { status: 'on_review' }, take: 20 });
  }

  async getAllListings(query: {
    pagination: { offset: number; limit: number };
  }) {
    const cacheKey = `catalog:offset:${query.pagination.offset}:limit:${query.pagination.limit}`;
    const hit = await this.cache.get(cacheKey);
    if (hit) return hit;
    const result = await this.listingsRepo.find({
      where: { status: 'active' },
      take: query.pagination.limit,
      skip: query.pagination.offset,
      relations: { category: { parentCategory: true } },
    });
    // Cache only first page
    if (query.pagination.offset === 0)
      this.cache.set(
        cacheKey,
        result,
        60_000 + Math.floor(Math.random() * 60_000), // ttl: 1m + jitter: 0-1m
      );
    return result;
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
