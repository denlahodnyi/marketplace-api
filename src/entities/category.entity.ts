import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { primaryAsUuidEntityFactory } from './shared.js';

@Entity('categories')
export class Category extends primaryAsUuidEntityFactory('categoryId') {
  @OneToOne(() => Category, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory: Category | null;

  @Column('text', { nullable: false })
  name: string;
}
