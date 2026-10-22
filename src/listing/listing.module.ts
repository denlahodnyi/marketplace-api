import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Listing } from '../entities/listing.entity.js';
import { ListingsController } from './listing.controller.js';
import { ListingsService } from './listing.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Listing])],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService, TypeOrmModule],
})
export class ListingsModule {}
