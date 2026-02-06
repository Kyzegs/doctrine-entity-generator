import { describe, it, expect } from 'vitest';
import { PHPEntityGenerator } from '../php-entity-generator';
import { SQLParser } from '../sql-parser';
import { GenerationOptions } from '../types';
import { DatabaseDialect } from '../example-queries';

describe('Class Naming Convention', () => {
  const baseOptions: GenerationOptions = {
    namespace: 'App\\Entity',
    entityPrefix: '',
    entitySuffix: '',
    entityName: '',
    classNamingConvention: 'inherit',
    databaseDialect: DatabaseDialect.MYSQL,
    customDataTypes: [],
    columnFieldMappings: [],
    explicitlyDefineColumns: false,
    useAttributeMapping: true,
    publicProperties: false,
    generateGetters: true,
    generateSetters: true,
    generateFluentSetters: false,
    relationships: [],
    customTraits: [],
    selectedTraits: [],
  };

  describe('with plural table name (users)', () => {
    const sql = `
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `;

    it('should inherit table name as-is when convention is inherit', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'inherit' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class Users');
    });

    it('should singularize when convention is singular', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'singular' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class User');
    });

    it('should not double-pluralize when convention is plural (already plural)', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'plural' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      // Should recognize that 'users' is already plural and keep it as 'Users'
      expect(output).toContain('class Users');
      expect(output).not.toContain('class Userses');
    });
  });

  describe('with plural table name (orders)', () => {
    const sql = `
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        total DECIMAL(10,2) NOT NULL
      )
    `;

    it('should inherit table name as-is when convention is inherit', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'inherit' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class Orders');
    });

    it('should singularize when convention is singular', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'singular' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class Order');
    });

    it('should not double-pluralize when convention is plural (already plural)', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'plural' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      // Should recognize that 'orders' is already plural and keep it as 'Orders'
      expect(output).toContain('class Orders');
      expect(output).not.toContain('class Ordseres');
      expect(output).not.toContain('class Orderses');
    });
  });

  describe('with singular table name (user)', () => {
    const sql = `
      CREATE TABLE user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `;

    it('should inherit table name as-is when convention is inherit', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'inherit' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class User');
    });

    it('should singularize when convention is singular (already singular)', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'singular' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class User');
    });

    it('should pluralize when convention is plural', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'plural' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class Users');
    });
  });

  describe('with table ending in "y" (category)', () => {
    const sql = `
      CREATE TABLE category (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `;

    it('should pluralize to "categories" when convention is plural', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'plural' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class Categories');
    });
  });

  describe('with plural table ending in "ies" (categories)', () => {
    const sql = `
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `;

    it('should singularize to "category" when convention is singular', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'singular' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class Category');
    });
  });

  describe('with snake_case table name (order_items)', () => {
    const sql = `
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quantity INT NOT NULL
      )
    `;

    it('should convert to PascalCase and singularize when convention is singular', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'singular' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class OrderItem');
    });

    it('should convert to PascalCase and inherit when convention is inherit', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = { ...baseOptions, classNamingConvention: 'inherit' as const };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class OrderItems');
    });
  });

  describe('entityName override', () => {
    const sql = `
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `;

    it('should use entityName override regardless of convention', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = {
        ...baseOptions,
        entityName: 'CustomUser',
        classNamingConvention: 'singular' as const,
      };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class CustomUser');
    });
  });

  describe('with prefix and suffix', () => {
    const sql = `
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `;

    it('should apply prefix and suffix after singularization', () => {
      const schema = SQLParser.parseCreateTable(sql, DatabaseDialect.MYSQL);
      const options = {
        ...baseOptions,
        entityPrefix: 'Base',
        entitySuffix: 'Entity',
        classNamingConvention: 'singular' as const,
      };
      const output = PHPEntityGenerator.generate(schema, options);

      expect(output).toContain('class BaseUserEntity');
    });
  });
});
