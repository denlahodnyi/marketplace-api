import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import type { Offer } from './offer.entity.js';

import { Category } from './category.entity.js';
import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

@Entity('listings')
@Check(`"item_condition" IN ('new', 'used')`)
@Check(`"selling_method" IN ('fixed_price', 'best_offer', 'auction')`)
@Check(`"price" >= 0`)
@Check(`length("currency") = 3`)
@Check(`"quantity" > 0`)
@Check(`"status" IN ('on_review', 'declined', 'active', 'inactive')`)
export class Listing extends primaryAsUuidEntityFactory('listingId') {
  @OneToMany('Offer', (offer: Offer) => offer.listing)
  offers: Offer[];

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { nullable: false })
  userId: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column('uuid', { nullable: false })
  categoryId: string;

  @Column('text', { nullable: false })
  title: string;

  @Column('text', { nullable: false })
  itemCondition: 'new' | 'used';

  @Column('text', { nullable: false })
  sellingMethod: 'fixed_price' | 'best_offer' | 'auction';

  @Column('text', { nullable: false })
  description: string;

  @Column('integer', { nullable: false })
  price: number;

  @Column('text', { nullable: false })
  currency: string;

  @Column('int', { nullable: false })
  quantity: number;

  @Column('text', { nullable: false })
  status: 'on_review' | 'declined' | 'active' | 'inactive';

  @Index({ type: 'gin' })
  @Column({
    type: 'tsvector',
    generatedIdentity: 'ALWAYS',
    generatedType: 'STORED',
    asExpression: `to_tsvector('simple', coalesce("title", '')) || to_tsvector('simple', coalesce("description", ''))`,
  })
  searchVector: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: string | null;
}
