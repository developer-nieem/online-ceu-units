import { Controller, Get, Param, Query } from '@nestjs/common';

import { Public } from '../auth/decorators/public.decorator';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Public()
  @Get('courses')
  listCourses(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.catalog.listCourses({ search, category });
  }

  @Public()
  @Get('courses/:slug')
  getCourse(@Param('slug') slug: string) {
    return this.catalog.getCourseBySlug(slug);
  }

  @Public()
  @Get('insights')
  getInsights() {
    return this.catalog.getCatalogInsights();
  }
}
