export const loader = () => {
  const robotText = `
    User-agent: *
    Disallow: /*?*

    Sitemap: http://www.schwankie.com/sitemap.xml
    `;

  return new Response(robotText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};
