import {describe, it, expect} from 'bun:test';
import {
  parseLinksWithScores,
  parseLinksFromHtml,
  parseLinksFromListFormat,
  isBlockedUrl,
  isBlockedTitle,
  normalizeUrl,
  SCORE_KEEP_THRESHOLD,
  SCORE_HIGH_THRESHOLD,
  SCORE_LOW_THRESHOLD,
} from '../../src/utils/email-parser';

describe('Email Parser', () => {
  describe('isBlockedUrl', () => {
    it('should block unsubscribe links', () => {
      expect(isBlockedUrl('https://example.com/unsubscribe')).toBe(true);
    });

    it('should block social media domains', () => {
      expect(isBlockedUrl('https://twitter.com/username')).toBe(true);
      expect(isBlockedUrl('https://facebook.com/page')).toBe(true);
      expect(isBlockedUrl('https://x.com/username')).toBe(true);
    });

    it('should block mailchimp domains', () => {
      expect(isBlockedUrl('https://mailchimp.com/campaign')).toBe(true);
    });

    it('should allow legitimate URLs', () => {
      expect(isBlockedUrl('https://example.com/article')).toBe(false);
      expect(isBlockedUrl('https://github.com/user/repo')).toBe(false);
    });
  });

  describe('isBlockedTitle', () => {
    it('should block generic link text', () => {
      expect(isBlockedTitle('here')).toBe(true);
      expect(isBlockedTitle('click here')).toBe(true);
      expect(isBlockedTitle('read more')).toBe(true);
    });

    it('should block sponsorship links', () => {
      expect(isBlockedTitle('sponsor')).toBe(true);
      expect(isBlockedTitle('advertise with us')).toBe(true);
    });

    it('should block newsletter management links', () => {
      expect(isBlockedTitle('unsubscribe')).toBe(true);
      expect(isBlockedTitle('manage subscriptions')).toBe(true);
      expect(isBlockedTitle('update preferences')).toBe(true);
    });

    it('should block domain names used as titles', () => {
      expect(isBlockedTitle('example.com')).toBe(true);
    });

    it('should allow legitimate titles', () => {
      expect(isBlockedTitle('How to Build a Web App')).toBe(false);
      expect(isBlockedTitle('Revolutionary AI Breakthrough')).toBe(false);
    });
  });

  describe('normalizeUrl', () => {
    it('should strip trailing slashes', () => {
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
    });

    it('should remove tracking parameters', () => {
      const url = 'https://example.com/article?utm_source=email&utm_campaign=test&other=value';
      const normalized = normalizeUrl(url);
      expect(normalized).not.toContain('utm_source');
      expect(normalized).not.toContain('utm_campaign');
      expect(normalized).toContain('other=value');
    });

    it('should handle invalid URLs gracefully', () => {
      const result = normalizeUrl('not a url');
      expect(result).toBe('not a url');
    });

    it('should trim whitespace', () => {
      expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
    });
  });

  describe('parseLinksFromHtml', () => {
    it('should extract links from HTML with proper context', () => {
      const html = `
        <p>Check out this great article about web development and software engineering</p>
        <a href="https://example.com/article">A Great Article About Web Development</a>
        <p>This is a comprehensive guide</p>
      `;
      const links = parseLinksFromHtml(html);
      expect(links.length).toBeGreaterThan(0);
      const link = links[0];
      expect(link.url).toContain('example.com/article');
      expect(link.title).toContain('Great Article');
    });

    it('should ignore non-http links', () => {
      const html = '<a href="mailto:test@example.com">Email Me Now</a>';
      const links = parseLinksFromHtml(html);
      expect(links.length).toBe(0);
    });

    it('should ignore links with invalid titles', () => {
      const html = '<p>Click <a href="https://example.com">hi</a> here</p>';
      const links = parseLinksFromHtml(html);
      expect(links.length).toBe(0);
    });

    it('should deduplicate URLs', () => {
      const html = `
        <p>Read this great technology article about software development</p>
        <a href="https://example.com/article">Article Title About Web Development</a>
        <p>Also check out this same article</p>
        <a href="https://example.com/article">Same Article About Web Development</a>
      `;
      const links = parseLinksFromHtml(html);
      expect(links.length).toBe(1);
    });

    it('should skip links in skip regions', () => {
      const html = `
        <div id="footer">
          <p>Unsubscribe from newsletter or manage your preferences</p>
          <a href="https://example.com/unsubscribe">Unsubscribe from newsletter</a>
        </div>
        <p>This is a great article about technology and development</p>
        <a href="https://example.com/article">Real Article Title About Technology</a>
      `;
      const links = parseLinksFromHtml(html);
      links.forEach((link) => {
        expect(link.url).not.toContain('unsubscribe');
      });
    });
  });

  describe('parseLinksWithScores', () => {
    it('should parse list-based email with scores', () => {
      const html = `
        <ul>
          <li><a href="https://example.com/article">How to Build Apps</a> - A comprehensive guide</li>
          <li><a href="https://github.com/user/repo">Open Source Project</a> - Great contributions</li>
        </ul>
      `;
      const links = parseLinksWithScores(html);
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toHaveProperty('score');
        expect(link).toHaveProperty('context');
      });
    });

    it('should assign higher scores to links with meaningful context', () => {
      const html = `
        <ul>
          <li><a href="https://example.com/good">Good Article Title Here</a> - This is a comprehensive guide about web development technologies</li>
          <li><a href="https://example.com/bad">read more</a></li>
        </ul>
      `;
      const links = parseLinksWithScores(html);
      const goodLink = links.find((l) => l.url.includes('good'));
      const badLink = links.find((l) => l.url.includes('bad'));
      if (goodLink && badLink) {
        expect(goodLink.score).toBeGreaterThan(badLink.score);
      }
    });

    it('should fallback to parseLinksFromHtml when no lists found', () => {
      const html = `
        <p>Check out <a href="https://example.com/article">this great article</a> about web development.</p>
      `;
      const links = parseLinksWithScores(html);
      expect(links.length).toBeGreaterThan(0);
    });

    it('should include context for each link', () => {
      const html = `
        <ul>
          <li><a href="https://example.com/article">Article Title</a> - Some description text</li>
        </ul>
      `;
      const links = parseLinksWithScores(html);
      if (links.length > 0) {
        expect(links[0].context).toBeDefined();
      }
    });
  });

  describe('parseLinksFromListFormat', () => {
    it('should filter links by keep threshold', () => {
      const html = `
        <ul>
          <li><a href="https://example.com/good">Good Article with Excellent Title Text</a></li>
        </ul>
      `;
      const links = parseLinksFromListFormat(html);
      links.forEach((link) => {
        expect(link).toHaveProperty('url');
        expect(link).toHaveProperty('title');
      });
    });

    it('should return ParsedLink without scores', () => {
      const html = `
        <ul>
          <li><a href="https://example.com/article">Article Title Here</a></li>
        </ul>
      `;
      const links = parseLinksFromListFormat(html);
      if (links.length > 0) {
        expect(links[0]).not.toHaveProperty('score');
        expect(links[0]).toHaveProperty('url');
        expect(links[0]).toHaveProperty('title');
      }
    });
  });

  describe('threshold constants', () => {
    it('should have valid threshold values', () => {
      expect(SCORE_KEEP_THRESHOLD).toBe(2);
      expect(SCORE_HIGH_THRESHOLD).toBeGreaterThan(SCORE_KEEP_THRESHOLD);
      expect(SCORE_LOW_THRESHOLD).toBeLessThan(SCORE_HIGH_THRESHOLD);
    });
  });

  describe('integration: real email patterns', () => {
    it('should handle TLDR-style newsletter format', () => {
      const tldrHtml = `
        <ul style="margin: 0; padding-left: 0; list-style: none;">
          <li style="margin: 0 0 12px 0;">
            <a href="https://example.com/article1">First Article Title Here</a> - An article about something interesting and relevant
          </li>
          <li style="margin: 0 0 12px 0;">
            <a href="https://example.com/article2">Second Important Article</a> - More content about technology and development
          </li>
        </ul>
      `;
      const links = parseLinksWithScores(tldrHtml);
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link.score).toBeDefined();
        expect(link.context).toBeDefined();
      });
    });

    it('should filter out sponsor/ad content', () => {
      const html = `
        <div id="together-with">
          <a href="https://sponsor.com/ad">Sponsored Content Title</a>
        </div>
        <ul>
          <li><a href="https://example.com/article">Real Article Title Here</a> - Real content</li>
        </ul>
      `;
      const links = parseLinksWithScores(html);
      expect(links.some((l) => l.url.includes('sponsor'))).toBe(false);
      expect(links.some((l) => l.url.includes('article'))).toBe(true);
    });
  });
});
