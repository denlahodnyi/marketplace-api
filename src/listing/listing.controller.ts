import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  Session,
  UseInterceptors,
} from '@nestjs/common';

import type { UserInRequest } from '../common/app.js';

import { IsPublic } from '../auth/public.decorator.js';
import { User } from '../auth/user.decorator.js';
import {
  CatalogListingResponse,
  CreateListingDto,
  ListingResponse,
  UpdateListingDto,
} from './listing.dto.js';
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

  @IsPublic()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: CatalogListingResponse })
  @Get('all')
  viewCatalog(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.listingsService.getAllListings({
      pagination: { limit, offset },
    });
  }

  @IsPublic()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ListingResponse })
  @Get(':listingId')
  viewListingWithId(
    @Param('listingId', new ParseUUIDPipe({ version: '7' })) listingId: string,
    @Session() session: Record<string, any>,
  ): Promise<ListingResponse | null> {
    session.visits = session.visits ? session.visits + 1 : 1; // for the demo:session
    return this.listingsService.findListingById(listingId);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: ListingResponse })
  @Patch(':listingId')
  modifyListingWithId(
    @Param('listingId', new ParseUUIDPipe({ version: '7' })) listingId: string,
    @Body() body: UpdateListingDto,
    @User() user: UserInRequest,
  ): Promise<ListingResponse> {
    return this.listingsService.updateListing(listingId, body, user);
  }
}
