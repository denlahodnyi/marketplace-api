import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Listing } from '../entities/listing.entity.js';
import { ListingsService } from './listing.service.js';

const ListingRepoMock = {
  create: vi.fn(),
  insert: vi.fn(),
};

describe('ListingsService', () => {
  let service: ListingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: getRepositoryToken(Listing), useValue: ListingRepoMock },
        ListingsService,
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
