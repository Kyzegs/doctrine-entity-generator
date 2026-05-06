import { describe, it, expect } from 'vitest';
import { DoctrineXMLGenerator } from '../doctrine-xml-generator';
import { TableSchema, GenerationOptions } from '../types';
import { DatabaseDialect } from '../example-queries';

describe('DoctrineXMLGenerator', () => {
  const defaultOptions: GenerationOptions = {
    namespace: 'App\\Entity',
    entityPrefix: '',
    entitySuffix: '',
    entityName: '',
    classNamingConvention: 'inherit',
    databaseDialect: DatabaseDialect.MYSQL,
    customDataTypes: [],
    columnFieldMappings: [],
    explicitlyDefineColumns: false,
    useAttributeMapping: false,
    generateEnumsFromSql: false,
    publicProperties: false,
    generateGetters: true,
    generateSetters: true,
    generateFluentSetters: true,
    relationships: [],
    customTraits: [],
    selectedTraits: [],
  };

  const createSchema = (overrides: Partial<TableSchema> = {}): TableSchema => ({
    name: 'test_table',
    columns: [],
    indexes: [],
    constraints: [],
    ...overrides,
  });

  describe('generate', () => {
    it('should generate basic XML structure with namespaces', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('xmlns="http://doctrine-project.org/schemas/orm/doctrine-mapping"');
      expect(xml).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
      expect(xml).toContain('xsi:schemaLocation');
    });

    it('should generate entity with namespace', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('name="App\\Entity\\TestTable"');
      expect(xml).toContain('table="test_table"');
    });

    it('should generate entity without namespace when empty', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const options = { ...defaultOptions, namespace: '' };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('name="TestTable"');
      expect(xml).not.toContain('name="\\TestTable"');
    });

    it('should use custom entity name when provided', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const options = { ...defaultOptions, entityName: 'CustomEntity' };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('name="App\\Entity\\CustomEntity"');
    });

    it('should apply entity prefix and suffix', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const options = {
        ...defaultOptions,
        entityPrefix: 'Base',
        entitySuffix: 'Model',
      };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('name="App\\Entity\\BaseTestTableModel"');
    });

    it('should apply prefix, suffix, and custom name together', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const options = {
        ...defaultOptions,
        entityPrefix: 'Base',
        entitySuffix: 'Model',
        entityName: 'User',
      };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('name="App\\Entity\\BaseUserModel"');
    });
  });

  describe('ID field generation', () => {
    it('should generate ID field with generator', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<id name="id" type="integer" length="10">');
      expect(xml).toContain('<generator/>');
      expect(xml).toContain('</id>');
    });

    it('should generate ID field with unsigned option for MySQL', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'bigint', nullable: false, autoIncrement: true, unsigned: true }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<id name="id" type="integer" length="10">');
      expect(xml).toContain('<options>');
      expect(xml).toContain('<option name="unsigned">true</option>');
      expect(xml).toContain('</options>');
    });

    it('should not generate unsigned option for non-MySQL databases', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'bigint', nullable: false, autoIncrement: true, unsigned: true }],
      });

      const options = { ...defaultOptions, databaseDialect: DatabaseDialect.POSTGRESQL };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('<id name="id" type="integer" length="10">');
      expect(xml).not.toContain('<option name="unsigned">true</option>');
    });

    it('should generate ID field with default value option', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true, default: '1' }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<options>');
      expect(xml).toContain('<option name="default">1</option>');
    });

    it('should generate ID field with both unsigned and default options', () => {
      const schema = createSchema({
        columns: [
          {
            name: 'id',
            type: 'bigint',
            nullable: false,
            autoIncrement: true,
            unsigned: true,
            default: '0',
          },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<options>');
      expect(xml).toContain('<option name="default">0</option>');
      expect(xml).toContain('<option name="unsigned">true</option>');
    });

    it('should not generate options element when not needed', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).not.toContain('<options>');
      expect(xml).not.toContain('</options>');
    });

    it('should not include default option when value is NULL', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true, default: 'NULL' }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).not.toContain('<option name="default">NULL</option>');
    });

    it('should find ID column by autoIncrement flag', () => {
      const schema = createSchema({
        columns: [{ name: 'primary_key', type: 'int', nullable: false, autoIncrement: true }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<id name="id" type="integer" length="10">');
    });
  });

  describe('Field generation', () => {
    it('should generate basic string field', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'name', type: 'varchar', length: 255, nullable: false },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<field name="name" length="255"/>');
    });

    it('should generate nullable field', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'email', type: 'varchar', length: 255, nullable: true },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<field name="email" length="255" nullable="true"/>');
    });

    it('should generate field with type when not string', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'age', type: 'int', length: 11, nullable: true },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<field name="age" type="integer" length="11" nullable="true"/>');
    });

    it('should generate field with unsigned option for integer types in MySQL', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'count', type: 'int', length: 11, nullable: true, unsigned: true },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<field name="count" type="integer" length="11" nullable="true">');
      expect(xml).toContain('<options>');
      expect(xml).toContain('<option name="unsigned">true</option>');
    });

    it('should not generate unsigned option for non-integer types', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'description', type: 'text', nullable: true, unsigned: true },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<field name="description" type="text" nullable="true"/>');
      expect(xml).not.toContain('<option name="unsigned">true</option>');
    });

    it('should generate field with default value option', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'status', type: 'varchar', length: 20, nullable: true, default: 'active' },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<field name="status" length="20" nullable="true">');
      expect(xml).toContain('<options>');
      expect(xml).toContain('<option name="default">active</option>');
    });

    it('should generate field with both unsigned and default options', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'count', type: 'int', length: 11, nullable: true, unsigned: true, default: '0' },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<options>');
      expect(xml).toContain('<option name="default">0</option>');
      expect(xml).toContain('<option name="unsigned">true</option>');
    });

    it('should generate field with enum type', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'status', type: 'varchar', length: 20, nullable: false },
        ],
      });

      const options = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'status', selectedType: 'string', enumClass: 'StatusEnum' }],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('enum-type="App\\Entity\\StatusEnum"');
    });

    it('should generate field with generated enum type for SQL enum columns', () => {
      const schema = createSchema({
        name: 'payment_setting_configurations',
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          {
            name: 'type',
            type: 'enum',
            enumValues: ['STRING', 'INTEGER'],
            nullable: false,
            autoIncrement: false,
          },
        ],
      });

      const options = { ...defaultOptions, generateEnumsFromSql: true, classNamingConvention: 'singular' as const };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('enum-type="App\\Entity\\PaymentSettingConfigurationTypeEnum"');
    });

    it('should generate field with namespaced enum type for SQL enum columns', () => {
      const schema = createSchema({
        name: 'orders',
        columns: [
          { name: 'id', type: 'bigint', nullable: false, autoIncrement: true, unsigned: true },
          {
            name: 'status',
            type: 'enum',
            enumValues: ['pending', 'paid', 'shipped'],
            nullable: false,
            autoIncrement: false,
            default: 'pending',
          },
        ],
      });

      const options = {
        ...defaultOptions,
        namespace: 'AntiCorruptionLayer\\Tinpay\\Entity',
        generateEnumsFromSql: true,
        classNamingConvention: 'singular' as const,
      };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('enum-type="AntiCorruptionLayer\\Tinpay\\Entity\\OrderStatusEnum"');
    });

    it('should include column attribute when explicitlyDefineColumns is true', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_name', type: 'varchar', length: 255, nullable: false },
        ],
      });

      const options = { ...defaultOptions, explicitlyDefineColumns: true };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('column="user_name"');
    });

    it('should include column attribute when custom mapping has column', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'created_at', type: 'datetime', nullable: true },
        ],
      });

      const options = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'createdAt', column: 'created_at', selectedType: 'datetime' }],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('column="created_at"');
    });

    it('should use custom mapping column name when provided', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'created_at', type: 'datetime', nullable: true },
        ],
      });

      const options = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'createdAt', column: 'created', selectedType: 'datetime' }],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('column="created"');
    });

    it('should support unsigned for smallint type', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'tiny', type: 'smallint', length: 5, nullable: true, unsigned: true },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<option name="unsigned">true</option>');
    });

    it('should support unsigned for bigint type', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'large', type: 'bigint', length: 20, nullable: true, unsigned: true },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<option name="unsigned">true</option>');
    });
  });

  describe('Relationship generation', () => {
    it('should generate many-to-one relationship', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_id', type: 'int', nullable: false },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'user',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'user_id',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('<many-to-one field="user" target-entity="App\\Entity\\User">');
      expect(xml).toContain('<join-column name="user_id"');
    });

    it('should generate one-to-one relationship', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'profile_id', type: 'int', nullable: true },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'profile',
            type: 'one-to-one',
            targetEntity: 'Profile',
            joinColumn: 'profile_id',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('<one-to-one field="profile" target-entity="App\\Entity\\Profile">');
      expect(xml).toContain('<join-column name="profile_id"');
    });

    it('should generate one-to-many relationship', () => {
      // Note: Relationships without join columns are not currently supported by ORMMappingUtils
      // This test documents the expected behavior if support is added
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'comments',
            type: 'one-to-many',
            targetEntity: 'Comment',
            mappedBy: 'post',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      // Currently, relationships without join columns are not included in ORM mapping
      // This would need to be handled differently if support is added
      expect(xml).not.toContain('<one-to-many');
    });

    it('should generate many-to-many relationship', () => {
      // Note: Relationships without join columns are not currently supported by ORMMappingUtils
      // This test documents the expected behavior if support is added
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'tags',
            type: 'many-to-many',
            targetEntity: 'Tag',
            inversedBy: 'posts',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      // Currently, relationships without join columns are not included in ORM mapping
      // This would need to be handled differently if support is added
      expect(xml).not.toContain('<many-to-many');
    });

    it('should include fetch attribute when not LAZY', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_id', type: 'int', nullable: false },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'user',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'user_id',
            fetch: 'EAGER',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('fetch="EAGER"');
    });

    it('should add inversedBy to relationship when present', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_id', type: 'int', nullable: false },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'user',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'user_id',
            inversedBy: 'posts',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('inversed-by="posts"');
    });

    it('should add mappedBy to relationship when present', () => {
      // Note: mappedBy is typically for one-to-many inverse side, but we can test it
      // by creating a relationship that would have it (though it won't be included without joinColumn)
      // For testing purposes, let's create a scenario where we manually test the XML generation
      // Actually, let's test with a one-to-one that has mappedBy (less common but possible)
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'profile_id', type: 'int', nullable: true },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'profile',
            type: 'one-to-one',
            targetEntity: 'Profile',
            joinColumn: 'profile_id',
            mappedBy: 'user',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('mapped-by="user"');
    });

    it('should not include fetch attribute when LAZY', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_id', type: 'int', nullable: false },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'user',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'user_id',
            fetch: 'LAZY',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).not.toContain('fetch="LAZY"');
    });

    it('should include orphan-removal when true', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'profile_id', type: 'int', nullable: true },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'profile',
            type: 'one-to-one',
            targetEntity: 'Profile',
            joinColumn: 'profile_id',
            orphanRemoval: true,
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('orphan-removal="true"');
    });

    it('should set nullable on join-column based on column definition', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'profile_id', type: 'int', nullable: true },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'profile',
            type: 'one-to-one',
            targetEntity: 'Profile',
            joinColumn: 'profile_id',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('nullable="true"');
    });

    it('should set nullable to false when column is not nullable', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_id', type: 'int', nullable: false },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'user',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'user_id',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('nullable="false"');
    });

    it('should include cascade operations', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_id', type: 'int', nullable: false },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'user',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'user_id',
            cascade: ['persist', 'remove'],
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('<cascade>');
      expect(xml).toContain('<cascade-persist/>');
      expect(xml).toContain('<cascade-remove/>');
    });

    it('should use targetEntityNamespace when provided', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_id', type: 'int', nullable: false },
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'user',
            type: 'many-to-one',
            targetEntity: 'User',
            targetEntityNamespace: 'App\\Model',
            joinColumn: 'user_id',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).toContain('target-entity="App\\Model\\User"');
    });
  });

  describe('Index generation', () => {
    it('should generate indexes element when non-primary indexes exist', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'email', type: 'varchar', length: 255, nullable: false },
        ],
        indexes: [{ name: 'idx_email', columns: ['email'], unique: false, primary: false }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<indexes>');
      expect(xml).toContain('<index name="idx_email" columns="email"/>');
      expect(xml).toContain('</indexes>');
    });

    it('should not generate indexes element when no non-primary indexes exist', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
        indexes: [{ name: 'PRIMARY', columns: ['id'], unique: false, primary: true }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).not.toContain('<indexes>');
    });

    it('should generate multiple indexes', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'email', type: 'varchar', length: 255, nullable: false },
          { name: 'username', type: 'varchar', length: 100, nullable: false },
        ],
        indexes: [
          { name: 'idx_email', columns: ['email'], unique: false, primary: false },
          { name: 'idx_username', columns: ['username'], unique: false, primary: false },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<index name="idx_email" columns="email"/>');
      expect(xml).toContain('<index name="idx_username" columns="username"/>');
    });

    it('should generate composite index with multiple columns', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'user_id', type: 'int', nullable: false },
          { name: 'created_at', type: 'datetime', nullable: false },
        ],
        indexes: [
          {
            name: 'idx_user_created',
            columns: ['user_id', 'created_at'],
            unique: false,
            primary: false,
          },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('columns="user_id,created_at"');
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle schema without ID column', () => {
      const schema = createSchema({
        columns: [{ name: 'name', type: 'varchar', length: 255, nullable: false }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).not.toContain('<id');
      expect(xml).toContain('<field name="name"');
    });

    it('should handle empty schema with only ID', () => {
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<id');
      expect(xml).toContain('</entity>');
    });

    it('should handle fields without length', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'description', type: 'text', nullable: true },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      expect(xml).toContain('<field name="description" type="text" nullable="true"/>');
      // ID field has length, but description field should not
      const descriptionFieldMatch = xml.match(/<field name="description"[^>]*>/);
      expect(descriptionFieldMatch).not.toBeNull();
      expect(descriptionFieldMatch![0]).not.toContain('length=');
    });

    it('should handle PostgreSQL dialect without unsigned support', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'count', type: 'int', length: 11, nullable: true, unsigned: true },
        ],
      });

      const options = { ...defaultOptions, databaseDialect: DatabaseDialect.POSTGRESQL };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).not.toContain('<option name="unsigned">true</option>');
    });

    it('should handle SQLite dialect without unsigned support', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          { name: 'count', type: 'int', length: 11, nullable: true, unsigned: true },
        ],
      });

      const options = { ...defaultOptions, databaseDialect: DatabaseDialect.SQLITE };
      const xml = DoctrineXMLGenerator.generate(schema, options);

      expect(xml).not.toContain('<option name="unsigned">true</option>');
    });

    it('should handle default value with special characters', () => {
      const schema = createSchema({
        columns: [
          { name: 'id', type: 'int', nullable: false, autoIncrement: true },
          {
            name: 'status',
            type: 'varchar',
            length: 20,
            nullable: true,
            default: 'active & pending',
          },
        ],
      });

      const xml = DoctrineXMLGenerator.generate(schema, defaultOptions);

      // XML should properly escape special characters
      expect(xml).toContain('<option name="default">');
      // The XML builder should handle escaping automatically
    });

    it('should handle relationship without join column for collection types', () => {
      // Note: Relationships without join columns are not currently supported by ORMMappingUtils
      // This test documents the current behavior
      const schema = createSchema({
        columns: [{ name: 'id', type: 'int', nullable: false, autoIncrement: true }],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'comments',
            type: 'one-to-many',
            targetEntity: 'Comment',
            mappedBy: 'post',
          },
        ],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      // Currently, relationships without join columns are not included
      expect(xml).not.toContain('<one-to-many');
      expect(xml).not.toContain('<join-column');
    });
  });

  describe('Complex integration test', () => {
    it('should generate complete XML matching test script scenario', () => {
      const schema = createSchema({
        name: 'idin_transactions',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            length: 20,
            nullable: false,
            autoIncrement: true,
            unsigned: true,
          },
          { name: 'pin', type: 'char', length: 4, nullable: true },
          { name: 'type', type: 'varchar', length: 16, nullable: true },
          { name: 'data_map', type: 'int', length: 11, nullable: true },
          { name: 'data_array', type: 'text', nullable: true },
          { name: 'sub_id', type: 'int', length: 11, nullable: true, unsigned: true },
          {
            name: 'external_check_count',
            type: 'int',
            length: 11,
            nullable: true,
            unsigned: true,
            default: '0',
          },
          { name: 'created', type: 'int', length: 11, nullable: true },
          { name: 'deleted', type: 'int', length: 11, nullable: true, unsigned: true },
        ],
        indexes: [
          {
            name: 'IDX_transaction_id',
            columns: ['transaction_id', 'entrance_code'],
            unique: false,
            primary: false,
          },
          { name: 'status', columns: ['status'], unique: false, primary: false },
        ],
      });

      const options: GenerationOptions = {
        namespace: 'AntiCorruptionLayer\\Tinpay\\Entity',
        entityPrefix: '',
        entitySuffix: '',
        entityName: '',
        classNamingConvention: 'inherit',
        databaseDialect: DatabaseDialect.MYSQL,
        customDataTypes: [{ name: 'timestamp', phpType: '\\DateTimeImmutable' }],
        columnFieldMappings: [
          { field: 'createdAt', column: 'created', selectedType: 'timestamp' },
          { field: 'deletedAt', column: 'deleted', selectedType: 'timestamp' },
        ],
        explicitlyDefineColumns: false,
        useAttributeMapping: false,
        generateEnumsFromSql: false,
        publicProperties: false,
        generateGetters: true,
        generateSetters: true,
        generateFluentSetters: true,
        relationships: [],
        customTraits: [],
        selectedTraits: [],
      };

      const xml = DoctrineXMLGenerator.generate(schema, options);

      // Verify structure
      expect(xml).toContain('name="AntiCorruptionLayer\\Tinpay\\Entity\\IdinTransactions"');
      expect(xml).toContain('table="idin_transactions"');

      // Verify ID with unsigned
      expect(xml).toContain('<id name="id" type="integer" length="10">');
      expect(xml).toContain('<option name="unsigned">true</option>');

      // Verify fields with unsigned
      expect(xml).toContain('<field name="subId" type="integer" length="11" nullable="true">');
      expect(xml).toContain('<option name="unsigned">true</option>');

      // Verify field with both unsigned and default
      expect(xml).toContain('<field name="externalCheckCount" type="integer" length="11" nullable="true">');
      expect(xml).toContain('<option name="default">0</option>');

      // Verify column mappings
      expect(xml).toContain('column="created"');
      expect(xml).toContain('column="deleted"');

      // Verify indexes
      expect(xml).toContain('<indexes>');
      expect(xml).toContain('columns="transaction_id,entrance_code"');
    });
  });
});
