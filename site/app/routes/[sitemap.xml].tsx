export const loader = () => {
  const content = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://www.schwankie.com/</loc>
        <lastmod>2023-07-37T00:15:16+01:00</lastmod>
        <priority>1.0</priority>
      </url>
    </urlset>
    `;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'xml-version': '1.0',
      encoding: 'UTF-8',
    },
  });
};
