import {Controller, Get, Header} from '@nestjs/common';

const SITEMAP = `
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    <url>
      <loc>https://www.schwankie.com/</loc>
    </url>
    <url>
      <loc>https://www.schwankie.com/about</loc>
    </url>
  </urlset>
`;

@Controller('sitemap.xml')
export default class SitemapController {
  @Header('Content-Type', 'text/xml')
  @Get()
  async get() {
    return SITEMAP;
  }
}
