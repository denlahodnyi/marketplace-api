import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { Listing } from './listing.entity.js';
import { User } from './user.entity.js';

@Entity('listing_admin_reviews')
@Check(
  'check_decline_has_reason',
  `"status" != 'decline' OR "decline_reason" IS NOT NULL`,
)
@Check(`"status" IN ('accept', 'decline')`)
export class ListingAdminReview {
  @PrimaryColumn('uuid', { default: () => 'uuidv7()' })
  listingId: string;

  @PrimaryColumn('uuid', { default: () => 'uuidv7()' })
  adminId: string;

  @ManyToOne(() => Listing, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column('text', { nullable: false })
  status: 'accept' | 'decline';

  @Column('text', { nullable: true })
  declineReason: string | null;

  @Column('timestamp with time zone', { nullable: false })
  reviewedAt: string;
}
