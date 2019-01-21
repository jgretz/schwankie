// This is a maintenance file for when sites that I
// want to use different images switch their default

const imageUrl =
  'https://assets-cdn.github.com/images/search-key-slash.svg';
const replacementUrl =
  'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png';

export default async col => {
  const query = `
  SELECT l.id, l.url, l.title, l.description, l.tags, l.image
  FROM links l
  WHERE l.image = "${imageUrl}"
`;

  const results = await col.query(query);

  const updates = results.map(async link => {
    await col.replace(link.id, {
      ...link,
      image: replacementUrl,
    });
  });

  await Promise.all(updates);
};
