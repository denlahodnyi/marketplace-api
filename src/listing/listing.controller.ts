import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';

import { CreateListingDto, ListingResponse } from './listing.dto.js';
import { ListingsService } from './listing.service.js';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ListingResponse })
  @Post()
  createListing(@Body() body: CreateListingDto): Promise<ListingResponse> {
    return this.listingsService.createListing(body);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ListingResponse })
  @Get(':listingId')
  viewListingWithId(
    @Param('listingId', new ParseUUIDPipe({ version: '7' })) listingId: string,
  ): Promise<ListingResponse | null> {
    return this.listingsService.findListingById(listingId);
  }
}
