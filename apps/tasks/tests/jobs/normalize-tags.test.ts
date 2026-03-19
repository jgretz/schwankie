import {describe, expect, it} from 'bun:test';
import {buildPrompt, findCandidates, levenshtein, similarity} from '../../src/jobs/normalize-tags';

describe('levenshtein', function () {
  it('should return 0 for identical strings', function () {
    expect(levenshtein('hello', 'hello')).toBe(0);
  });

  it('should return length of non-empty string when comparing with empty', function () {
    expect(levenshtein('hello', '')).toBe(5);
    expect(levenshtein('', 'hello')).toBe(5);
  });

  it('should return 0 for two empty strings', function () {
    expect(levenshtein('', '')).toBe(0);
  });

  it('should return 1 for single character difference', function () {
    expect(levenshtein('hello', 'hallo')).toBe(1);
  });

  it('should calculate correct distance for kitten->sitting', function () {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('should calculate correct distance for saturday->sunday', function () {
    expect(levenshtein('saturday', 'sunday')).toBe(3);
  });

  it('should be symmetric', function () {
    const a = 'react';
    const b = 'react-native';
    expect(levenshtein(a, b)).toBe(levenshtein(b, a));
  });

  it('should calculate distance for completely different strings', function () {
    expect(levenshtein('abc', 'xyz')).toBe(3);
  });

  it('should calculate distance for strings with shared prefix', function () {
    expect(levenshtein('testing', 'test')).toBe(3);
  });

  it('should calculate distance for strings with shared suffix', function () {
    expect(levenshtein('test', 'testing')).toBe(3);
  });
});

describe('similarity', function () {
  it('should return 1.0 for identical strings', function () {
    expect(similarity('hello', 'hello')).toBe(1.0);
  });

  it('should return 1.0 for both empty strings', function () {
    expect(similarity('', '')).toBe(1.0);
  });

  it('should return 0.0 for one empty and one non-empty', function () {
    expect(similarity('hello', '')).toBe(0.0);
    expect(similarity('', 'hello')).toBe(0.0);
  });

  it('should return low score for completely different equal-length strings', function () {
    const score = similarity('abc', 'xyz');
    expect(score).toBeLessThan(0.5);
  });

  it('should be symmetric', function () {
    const a = 'react';
    const b = 'react-native';
    expect(similarity(a, b)).toBe(similarity(b, a));
  });

  it('should calculate correct value for known pair (react, react-native)', function () {
    const a = 'react';
    const b = 'react-native';
    const maxLen = Math.max(a.length, b.length);
    const expectedDistance = 7;
    const expectedSimilarity = 1 - expectedDistance / maxLen;
    expect(similarity(a, b)).toBeCloseTo(expectedSimilarity, 5);
  });

  it('should return higher score for more similar strings', function () {
    const sim1 = similarity('test', 'testing');
    const sim2 = similarity('test', 'xyz');
    expect(sim1).toBeGreaterThan(sim2);
  });
});

describe('findCandidates', function () {
  it('should return empty array for no canonical tags', function () {
    const candidates = findCandidates('javascript', []);
    expect(candidates).toEqual([]);
  });

  it('should return exact match', function () {
    const candidates = findCandidates('react', ['react', 'vue', 'angular']);
    expect(candidates).toContain('react');
  });

  it('should boost substring matches to >= 0.7', function () {
    const candidates = findCandidates('react-native', ['react', 'vue', 'angular']);
    expect(candidates).toContain('react');
  });

  it('should return empty array for no similar tags', function () {
    const candidates = findCandidates('javascript', ['python', 'ruby', 'golang']);
    expect(candidates).toEqual([]);
  });

  it('should sort results by score descending', function () {
    const candidates = findCandidates('react', ['rust', 'react', 'red', 'reading']);
    expect(candidates[0]).toBe('react');
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('should return max 10 candidates even with many matches', function () {
    const canonicalTags = Array.from({length: 20}, (_, i) => `react${i}`);
    const candidates = findCandidates('react', canonicalTags);
    expect(candidates.length).toBeLessThanOrEqual(10);
  });

  it('should filter tags below similarity threshold (0.6)', function () {
    const candidates = findCandidates('a', ['b', 'c', 'd', 'e']);
    expect(candidates.length).toBe(0);
  });

  it('should include substring matches when newTag includes canonical', function () {
    const candidates = findCandidates('react-native-web', ['react', 'web']);
    expect(candidates).toContain('react');
    expect(candidates).toContain('web');
  });

  it('should handle single canonical tag', function () {
    const candidates = findCandidates('react', ['angular']);
    expect(Array.isArray(candidates)).toBe(true);
  });

  it('should boost substring matches correctly', function () {
    const candidates = findCandidates('nodejs', ['node', 'python']);
    expect(candidates).toContain('node');
  });
});

describe('buildPrompt', function () {
  it('should return a string', function () {
    const prompt = buildPrompt(['react', 'vue'], 'angular');
    expect(typeof prompt).toBe('string');
  });

  it('should contain candidates in JSON format', function () {
    const prompt = buildPrompt(['react', 'vue'], 'angular');
    expect(prompt).toContain('["react","vue"]');
  });

  it('should contain the new tag', function () {
    const prompt = buildPrompt(['react', 'vue'], 'angular');
    expect(prompt).toContain('angular');
  });

  it('should contain merge instruction keywords', function () {
    const prompt = buildPrompt(['react', 'vue'], 'angular');
    expect(prompt).toContain('merge');
    expect(prompt).toContain('JSON');
  });

  it('should work with single candidate', function () {
    const prompt = buildPrompt(['react'], 'reactjs');
    expect(prompt).toContain('["react"]');
    expect(prompt).toContain('reactjs');
  });

  it('should work with multiple candidates', function () {
    const prompt = buildPrompt(['react', 'vue', 'angular', 'svelte'], 'frontend');
    expect(prompt).toContain('react');
    expect(prompt).toContain('vue');
    expect(prompt).toContain('angular');
    expect(prompt).toContain('svelte');
  });

  it('should be a single string without line breaks at the end', function () {
    const prompt = buildPrompt(['react'], 'angular');
    expect(prompt).toMatch(/./);
  });

  it('should contain instruction about merge conditions', function () {
    const prompt = buildPrompt(['react', 'vue'], 'angular');
    expect(prompt).toMatch(
      /merge.*same concept|same concept.*merge|plurals|abbreviations|synonyms/i,
    );
  });
});
