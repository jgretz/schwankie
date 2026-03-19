import {describe, it, expect} from 'bun:test';
import {validateSettingValue} from '../../src/lib/setting-schemas';

describe('validateSettingValue', () => {
  describe('tagCountFloor', () => {
    it('should pass with valid values: 1, 5, 100', () => {
      expect(validateSettingValue('tagCountFloor', '1')).toEqual({success: true});
      expect(validateSettingValue('tagCountFloor', '5')).toEqual({success: true});
      expect(validateSettingValue('tagCountFloor', '100')).toEqual({success: true});
    });

    it('should fail with 0', () => {
      const result = validateSettingValue('tagCountFloor', '0');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Must be >= 1');
      }
    });

    it('should fail with -1', () => {
      const result = validateSettingValue('tagCountFloor', '-1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Must be a positive integer');
      }
    });

    it('should fail with abc', () => {
      const result = validateSettingValue('tagCountFloor', 'abc');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Must be a positive integer');
      }
    });

    it('should fail with 1.5', () => {
      const result = validateSettingValue('tagCountFloor', '1.5');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Must be a positive integer');
      }
    });

    it('should fail with empty string', () => {
      const result = validateSettingValue('tagCountFloor', '');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Must be a positive integer');
      }
    });
  });

  describe('unknown keys', () => {
    it('should pass with any value for unknown keys', () => {
      expect(validateSettingValue('someNewSetting', 'anything')).toEqual({success: true});
      expect(validateSettingValue('anotherSetting', '')).toEqual({success: true});
      expect(validateSettingValue('randomKey', '123abc')).toEqual({success: true});
    });
  });
});
