import type { Repository, SaveOptions } from 'typeorm';

import { Category } from '../../src/entities/category.entity.js';
import { Listing } from '../../src/entities/listing.entity.js';
import { User } from '../../src/entities/user.entity.js';

let userSeq = 0;

class UserBuilder {
  private seq = ++userSeq;
  private id?: string;
  private name = `Test user #${this.seq}`;
  private email = `test${this.seq}@example.com`;
  private role: User['userRole'] = 'customer';

  withId(userId: string) {
    this.id = userId;
    return this;
  }

  withName(name: string) {
    this.name = name;
    return this;
  }

  withEmail(email: string) {
    this.email = email;
    return this;
  }

  withRole(role: User['userRole']) {
    this.role = role;
    return this;
  }

  build() {
    const u = new User();
    if (this.id) u.userId = this.id;
    u.name = this.name;
    u.email = this.email;
    u.userRole = this.role;
    return u;
  }

  async insertVia(repo: Repository<User>, opts: SaveOptions = {}) {
    return repo.save(this.build(), { transaction: false, ...opts });
  }
}

export const aUser = () => new UserBuilder();

let catSeq = 0;

class CategoryBuilder {
  private seq = ++catSeq;
  private id?: string;
  private name = `Test category #${this.seq}`;
  private parentCategory: Category;

  private constructor() {}

  static create() {
    return new CategoryBuilder();
  }

  withId(catId: string) {
    this.id = catId;
    return this;
  }

  withParentCategory(cat: Category) {
    this.parentCategory = cat;
    return this;
  }

  withName(name: string) {
    this.name = name;
    return this;
  }

  build() {
    const c = new Category();
    if (this.id) c.categoryId = this.id;
    c.name = this.name;
    c.parentCategory = this.parentCategory;
    return c;
  }

  async insertVia(repo: Repository<Category>, opts: SaveOptions = {}) {
    return repo.save(this.build(), { transaction: false, ...opts });
  }

  async insertManyVia(repo: Repository<Category>, n: number) {
    return repo.save(
      Array({ length: n }).map(() => this.build()),
      { transaction: false },
    );
  }
}

export const aCategory = () => CategoryBuilder.create();

let listingSeq = 0;

type ListingBRequiredStep = Pick<ListingBuilder, 'withCategory' | 'withUser'>;
type ListingBUserStep = Pick<ListingBuilder, 'withUser'> & {
  withCategory: never;
};
type ListingBCategoryStep = Pick<ListingBuilder, 'withCategory'> & {
  withUser: never;
};
type ListingBOtherStep = Omit<ListingBuilder, 'withCategory' | 'withUser'>;

class ListingBuilder {
  private seq = ++listingSeq;
  private listingId?: string;
  private user?: User;
  private category?: Category;
  private userId: string;
  private categoryId: string;
  private title = `Test listing #${this.seq}`;
  private itemCondition: Listing['itemCondition'] = 'used';
  private sellingMethod: Listing['sellingMethod'] = 'fixed_price';
  private description = `Lorem ipsum ${this.seq}`;
  private price = 500_00;
  private currency = 'UAH';
  private quantity = 1;
  private status: Listing['status'] = 'active';

  private constructor() {}

  static create(): ListingBRequiredStep {
    return new ListingBuilder();
  }

  withCategory<T extends ListingBRequiredStep | ListingBCategoryStep>(
    this: T,
    catOrId: Category | string,
  ): T extends ListingBCategoryStep ? ListingBOtherStep : ListingBUserStep {
    const ctx = this as unknown as ListingBuilder;
    if (typeof catOrId === 'string') ctx.categoryId = catOrId;
    else if (catOrId instanceof Category) ctx.category = catOrId;
    return ctx as unknown as T extends ListingBCategoryStep
      ? ListingBOtherStep
      : ListingBUserStep;
  }

  withUser<T extends ListingBRequiredStep | ListingBUserStep>(
    this: T,
    userOrId: User | string,
  ): T extends ListingBUserStep ? ListingBOtherStep : ListingBCategoryStep {
    const ctx = this as unknown as ListingBuilder;
    if (typeof userOrId === 'string') ctx.userId = userOrId;
    else if (userOrId instanceof User) ctx.user = userOrId;
    return ctx as unknown as T extends ListingBUserStep
      ? ListingBOtherStep
      : ListingBCategoryStep;
  }

  withId(listingId: string) {
    this.listingId = listingId;
    return this;
  }

  withTitle(title: string) {
    this.title = title;
    return this;
  }

  withCondition(cond: Listing['itemCondition']) {
    this.itemCondition = cond;
    return this;
  }

  withSellingMethod(m: Listing['sellingMethod']) {
    this.sellingMethod = m;
    return this;
  }

  withDescription(d: string) {
    this.description = d;
    return this;
  }

  withPrice(p: number) {
    this.price = p;
    return this;
  }

  withCurrency(c: string) {
    this.currency = c;
    return this;
  }

  withQty(qty: number) {
    this.quantity = qty;
    return this;
  }

  withStatus(s: Listing['status']) {
    this.status = s;
    return this;
  }

  build() {
    const l = new Listing();
    if (this.listingId) l.listingId = this.listingId;
    l.userId = this.user?.userId ?? this.userId;
    l.categoryId = this.category?.categoryId ?? this.categoryId;
    if (!l.userId) throw new Error('userId is required');
    if (!l.categoryId) throw new Error('categoryId is required');
    l.title = this.title;
    l.itemCondition = this.itemCondition;
    l.sellingMethod = this.sellingMethod;
    l.description = this.description;
    l.price = this.price;
    l.currency = this.currency;
    l.quantity = this.quantity;
    l.status = this.status;
    return l;
  }

  async insertVia(repo: Repository<Listing>, opts: SaveOptions = {}) {
    return repo.save(this.build(), { transaction: false, ...opts });
  }
}

export const aListing = () => ListingBuilder.create();
