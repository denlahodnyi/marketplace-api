import { Entity, JoinColumn, OneToMany, OneToOne, Unique } from 'typeorm';

import type { CartDetail } from './cart-details.entity.js';

import { primaryAsUuidEntityFactory } from './shared.js';
import { User } from './user.entity.js';

@Entity('carts')
@Unique(['user'])
export class Cart extends primaryAsUuidEntityFactory('cartId') {
  @OneToMany('CartDetail', (detail: CartDetail) => detail.cart)
  details: CartDetail[];

  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
