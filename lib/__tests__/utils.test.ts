import { describe, it, expect } from 'vitest';
import { toPascalCase, toCamelCase } from '../utils';

describe('utils', () => {
  describe('toPascalCase', () => {
    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('user_name')).toBe('UserName');
      expect(toPascalCase('billing_address')).toBe('BillingAddress');
      expect(toPascalCase('created_at')).toBe('CreatedAt');
    });

    it('should handle single word', () => {
      expect(toPascalCase('user')).toBe('User');
      expect(toPascalCase('name')).toBe('Name');
    });

    it('should handle multiple underscores', () => {
      expect(toPascalCase('user_name_email')).toBe('UserNameEmail');
      expect(toPascalCase('test_field_name')).toBe('TestFieldName');
    });

    it('should handle empty string', () => {
      expect(toPascalCase('')).toBe('');
    });

    it('should handle already PascalCase', () => {
      expect(toPascalCase('UserName')).toBe('UserName');
      expect(toPascalCase('BillingAddress')).toBe('BillingAddress');
    });

    it('should handle lowercase single word', () => {
      expect(toPascalCase('user')).toBe('User');
    });
  });

  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('user_name')).toBe('userName');
      expect(toCamelCase('billing_address')).toBe('billingAddress');
      expect(toCamelCase('created_at')).toBe('createdAt');
    });

    it('should handle single word', () => {
      expect(toCamelCase('user')).toBe('user');
      expect(toCamelCase('name')).toBe('name');
    });

    it('should handle multiple underscores', () => {
      expect(toCamelCase('user_name_email')).toBe('userNameEmail');
      expect(toCamelCase('test_field_name')).toBe('testFieldName');
    });

    it('should handle empty string', () => {
      expect(toCamelCase('')).toBe('');
    });

    it('should handle already camelCase', () => {
      expect(toCamelCase('userName')).toBe('userName');
      expect(toCamelCase('billingAddress')).toBe('billingAddress');
    });

    it('should convert first letter to lowercase', () => {
      expect(toCamelCase('User')).toBe('user');
      expect(toCamelCase('UserName')).toBe('userName');
    });
  });
});
