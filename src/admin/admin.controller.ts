import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ListingResponse, DeclineListingDto } from '../listing/listing.dto.js';
import { ListingsService } from '../listing/listing.service.js';

@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly listingService: ListingsService) {}

  @Roles(['admin'])
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ListingResponse })
  @Get('moderation/listings')
  viewOnReviewListings(): Promise<ListingResponse[]> {
    return this.listingService.getOnReviewListings();
  }

  @Roles(['admin'])
  @Put('moderation/listings/:listingId/actions/decline')
  declineListing(
    @Param('listingId', new ParseUUIDPipe({ version: '7' })) listingId: string,
    @Body() body: DeclineListingDto,
  ) {
    // TODO: remove hardcoded admin
    const adminId = '01a0f36f-82b6-79ad-8432-ad8cdbb63994';
    return this.listingService.declineListing(listingId, adminId, body.reason);
  }

  @Roles(['admin'])
  @Put('moderation/listings/:listingId/actions/approve')
  approveListing(
    @Param('listingId', new ParseUUIDPipe({ version: '7' })) listingId: string,
  ) {
    // TODO: remove hardcoded admin
    const adminId = '01a0f36f-82b6-79ad-8432-ad8cdbb63994';
    return this.listingService.approveListing(listingId, adminId);
  }
}
