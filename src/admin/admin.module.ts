import { Module } from '@nestjs/common';

import { ListingsModule } from '../listing/listing.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [ListingsModule],
  controllers: [AdminController],
})
export class AdminModule {}
