import { describe, it, expect } from 'vitest';
import {
  toPascalCase,
  toCamelCase,
  getErrorMessage,
  computeEntityName,
  pluralize,
  singularize,
  buildShareableConfiguration,
  mergeShareableConfigIntoOptions,
} from '../utils';

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

  describe('getErrorMessage', () => {
    it('should return message from Error', () => {
      expect(getErrorMessage(new Error('Something failed'))).toBe('Something failed');
    });

    it('should return fallback for non-Error', () => {
      expect(getErrorMessage('oops')).toBe('An error occurred');
      expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    });
  });

  describe('computeEntityName', () => {
    it('should use entityName when set', () => {
      expect(
        computeEntityName(
          { entityName: 'User', entityPrefix: '', entitySuffix: '', classNamingConvention: 'inherit' },
          'orders'
        )
      ).toBe('User');
    });

    it('should use prefix + PascalCase(tableName) + suffix when entityName empty', () => {
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'inherit' },
          'order_items'
        )
      ).toBe('OrderItems');
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: 'App\\', entitySuffix: '', classNamingConvention: 'inherit' },
          'user'
        )
      ).toBe('App\\User');
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: 'Entity', classNamingConvention: 'inherit' },
          'user'
        )
      ).toBe('UserEntity');
    });

    it('should singularize table name when classNamingConvention is singular', () => {
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'singular' },
          'users'
        )
      ).toBe('User');
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'singular' },
          'categories'
        )
      ).toBe('Category');
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'singular' },
          'order_items'
        )
      ).toBe('OrderItem');
    });

    it('should pluralize table name when classNamingConvention is plural', () => {
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'plural' },
          'user'
        )
      ).toBe('Users');
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'plural' },
          'category'
        )
      ).toBe('Categories');
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'plural' },
          'order_item'
        )
      ).toBe('OrderItems');
    });

    it('should inherit table name when classNamingConvention is inherit', () => {
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'inherit' },
          'users'
        )
      ).toBe('Users');
      expect(
        computeEntityName(
          { entityName: '', entityPrefix: '', entitySuffix: '', classNamingConvention: 'inherit' },
          'user'
        )
      ).toBe('User');
    });
  });

  describe('shareable configuration', () => {
    it('should persist generateEnumsFromSql through shared config', () => {
      const config = buildShareableConfiguration({
        namespace: 'App\\Entity',
        entityPrefix: '',
        entitySuffix: '',
        entityName: '',
        classNamingConvention: 'inherit',
        databaseDialect: 'mysql',
        customDataTypes: [],
        columnFieldMappings: [],
        explicitlyDefineColumns: false,
        useAttributeMapping: false,
        generateEnumsFromSql: true,
        publicProperties: false,
        generateGetters: true,
        generateSetters: true,
        generateFluentSetters: true,
        relationships: [],
        customTraits: [],
        selectedTraits: [],
      } as any);

      expect(config.generateEnumsFromSql).toBe(true);
      expect(mergeShareableConfigIntoOptions(config).generateEnumsFromSql).toBe(true);
    });
  });

  describe('pluralize', () => {
    it('should pluralize regular words by adding s', () => {
      expect(pluralize('user')).toBe('users');
      expect(pluralize('order')).toBe('orders');
      expect(pluralize('item')).toBe('items');
    });

    it('should handle words ending in y preceded by consonant', () => {
      expect(pluralize('category')).toBe('categories');
      expect(pluralize('entity')).toBe('entities');
      expect(pluralize('company')).toBe('companies');
    });

    it('should handle words ending in y preceded by vowel', () => {
      expect(pluralize('boy')).toBe('boys');
      expect(pluralize('key')).toBe('keys');
    });

    it('should handle words ending in s, ss, sh, ch, x, z', () => {
      expect(pluralize('bus')).toBe('buses');
      expect(pluralize('class')).toBe('classes');
      expect(pluralize('dish')).toBe('dishes');
      expect(pluralize('watch')).toBe('watches');
      expect(pluralize('box')).toBe('boxes');
    });

    it('should handle words ending in f and fe', () => {
      expect(pluralize('leaf')).toBe('leaves');
      expect(pluralize('knife')).toBe('knives');
      expect(pluralize('wife')).toBe('wives');
    });

    it('should not double-pluralize already plural words', () => {
      expect(pluralize('users')).toBe('users');
      expect(pluralize('orders')).toBe('orders');
      expect(pluralize('categories')).toBe('categories');
    });

    it('should handle empty string', () => {
      expect(pluralize('')).toBe('');
    });
  });

  describe('singularize', () => {
    it('should singularize regular words by removing s', () => {
      expect(singularize('users')).toBe('user');
      expect(singularize('orders')).toBe('order');
      expect(singularize('items')).toBe('item');
    });

    it('should handle words ending in ies', () => {
      expect(singularize('categories')).toBe('category');
      expect(singularize('entities')).toBe('entity');
      expect(singularize('companies')).toBe('company');
    });

    it('should handle words ending in ves', () => {
      expect(singularize('leaves')).toBe('leaf');
      expect(singularize('knives')).toBe('knife');
      expect(singularize('wives')).toBe('wife');
    });

    it('should handle words ending in ses, shes, ches, xes, zes', () => {
      expect(singularize('buses')).toBe('bus');
      expect(singularize('classes')).toBe('class');
      expect(singularize('dishes')).toBe('dish');
      expect(singularize('watches')).toBe('watch');
      expect(singularize('boxes')).toBe('box');
    });

    it('should not modify already singular words', () => {
      expect(singularize('user')).toBe('user');
      expect(singularize('order')).toBe('order');
      expect(singularize('category')).toBe('category');
    });

    it('should handle empty string', () => {
      expect(singularize('')).toBe('');
    });
  });
});
