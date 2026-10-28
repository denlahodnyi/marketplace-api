import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';

import { ListingResponse, DeclineListingDto } from '../listing/listing.dto.js';
import { ListingsService } from '../listing/listing.service.js';

@Controller('admin')
export class AdminController {
  constructor(private readonly listingService: ListingsService) {}
  // TODO: only admin can see this
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ListingResponse })
  @Get('moderation/listings')
  viewOnReviewListings(): Promise<ListingResponse[]> {
    return this.listingService.getOnReviewListings();
  }
  // TODO: only admin can see this
  @Put('moderation/listings/:listingId/actions/decline')
  declineListing(
    @Param('listingId', new ParseUUIDPipe({ version: '7' })) listingId: string,
    @Body() body: DeclineListingDto,
  ) {
    // TODO: remove hardcoded admin
    const adminId = '01a0f36f-82b6-79ad-8432-ad8cdbb63994';
    return this.listingService.declineListing(listingId, adminId, body.reason);
  }

  // TODO: only admin can see this
  @Put('moderation/listings/:listingId/actions/approve')
  approveListing(
    @Param('listingId', new ParseUUIDPipe({ version: '7' })) listingId: string,
  ) {
    // TODO: remove hardcoded admin
    const adminId = '01a0f36f-82b6-79ad-8432-ad8cdbb63994';
    return this.listingService.approveListing(listingId, adminId);
  }
}
