import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Listing } from '../entities/listing.entity.js';
import { ListingsController } from './listing.controller.js';
import { ListingsService } from './listing.service.js';

const ListingRepoMock = {
  create: vi.fn(),
  insert: vi.fn(),
};

describe('ListingsController', () => {
  let controller: ListingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: getRepositoryToken(Listing), useValue: ListingRepoMock },
        ListingsService,
      ],
      controllers: [ListingsController],
    }).compile();

    controller = module.get<ListingsController>(ListingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
