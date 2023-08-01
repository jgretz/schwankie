export const loader = () => {
  const robotText = `
    User-agent: Googlebot
    User-agent: Petalbot
    User-agent: bingbot
    Disallow: /

    User-agent: *
    Allow: /

    Sitemap: http://www.schwankie.com/sitemap.xml
    `;

  return new Response(robotText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};
