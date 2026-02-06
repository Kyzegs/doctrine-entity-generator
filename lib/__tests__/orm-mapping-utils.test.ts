import { describe, it, expect } from 'vitest';
import { ORMMappingUtils } from '../orm-mapping-utils';
import { TableSchema, TableColumn, GenerationOptions } from '../types';
import { DatabaseDialect } from '../example-queries';

describe('ORMMappingUtils', () => {
  const createSchema = (overrides: Partial<TableSchema> = {}): TableSchema => ({
    name: 'test_table',
    columns: [],
    indexes: [],
    constraints: [],
    ...overrides,
  });

  const createColumn = (overrides: Partial<TableColumn> = {}): TableColumn => ({
    name: 'test_column',
    type: 'varchar',
    nullable: true,
    autoIncrement: false,
    ...overrides,
  });

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
    publicProperties: false,
    generateGetters: true,
    generateSetters: true,
    generateFluentSetters: true,
    relationships: [],
    customTraits: [],
    selectedTraits: [],
  };

  describe('createORMMapping', () => {
    it('should create basic field mapping', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'name', type: 'varchar', length: 255, nullable: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields).toHaveLength(1);
      expect(mapping.fields[0].name).toBe('name');
      expect(mapping.fields[0].columnName).toBe('name');
      expect(mapping.fields[0].doctrineType).toBe('string');
      expect(mapping.fields[0].phpType).toBe('string');
      expect(mapping.fields[0].nullable).toBe(true);
      expect(mapping.fields[0].isRequired).toBe(false);
      expect(mapping.fields[0].length).toBe(255);
    });

    it('should skip ID columns', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'id', type: 'int', nullable: false, autoIncrement: true }),
          createColumn({ name: 'name', type: 'varchar', nullable: true }),
        ],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields).toHaveLength(1);
      expect(mapping.fields[0].name).toBe('name');
      expect(mapping.fields.find((f) => f.name === 'id')).toBeUndefined();
    });

    it('should skip auto-increment columns', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'pk', type: 'int', nullable: false, autoIncrement: true }),
          createColumn({ name: 'name', type: 'varchar', nullable: true }),
        ],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields).toHaveLength(1);
      expect(mapping.fields[0].name).toBe('name');
      expect(mapping.fields.find((f) => f.name === 'pk')).toBeUndefined();
    });

    it('should convert column names to camelCase field names', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'user_name', type: 'varchar', nullable: true }),
          createColumn({ name: 'created_at', type: 'datetime', nullable: true }),
          createColumn({ name: 'is_active', type: 'boolean', nullable: true }),
        ],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].name).toBe('userName');
      expect(mapping.fields[1].name).toBe('createdAt');
      expect(mapping.fields[2].name).toBe('isActive');
    });

    it('should handle nullable and non-nullable fields', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'nullable_field', type: 'varchar', nullable: true }),
          createColumn({ name: 'required_field', type: 'varchar', nullable: false }),
        ],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].nullable).toBe(true);
      expect(mapping.fields[0].isRequired).toBe(false);
      expect(mapping.fields[1].nullable).toBe(false);
      expect(mapping.fields[1].isRequired).toBe(true);
    });

    it('should preserve unsigned property', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'count', type: 'int', nullable: true, unsigned: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].unsigned).toBe(true);
    });

    it('should preserve default value', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar', nullable: true, default: 'active' })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].default).toBe('active');
    });

    it('should preserve length property', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'code', type: 'varchar', length: 10, nullable: true }),
          createColumn({ name: 'description', type: 'text', nullable: true }),
        ],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].length).toBe(10);
      expect(mapping.fields[1].length).toBeUndefined();
    });

    it('should skip relationship columns', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'user_id', type: 'int', nullable: true })],
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

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.fields).toHaveLength(0);
      expect(mapping.relationships).toHaveLength(1);
      expect(mapping.relationships[0].field).toBe('user');
    });

    it('should include relationships in order', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'user_id', type: 'int', nullable: true }),
          createColumn({ name: 'name', type: 'varchar', nullable: true }),
          createColumn({ name: 'profile_id', type: 'int', nullable: true }),
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
          {
            id: '2',
            field: 'profile',
            type: 'one-to-one',
            targetEntity: 'Profile',
            joinColumn: 'profile_id',
          },
        ],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.relationships).toHaveLength(2);
      expect(mapping.relationships[0].field).toBe('user');
      expect(mapping.relationships[1].field).toBe('profile');
    });

    it('should not include relationships without matching columns', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'name', type: 'varchar', nullable: true })],
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

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.relationships).toHaveLength(0);
    });

    it('should not include _id columns that are not configured as relationships', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'user_id', type: 'int', nullable: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      // Should be included as a regular field since it's not configured as a relationship
      expect(mapping.fields).toHaveLength(1);
      expect(mapping.fields[0].name).toBe('userId');
      expect(mapping.relationships).toHaveLength(0);
    });

    it('should handle relationship column without matching relationship in options', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'user_id', type: 'int', nullable: true })],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'user',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'profile_id', // Different column name
          },
        ],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      // user_id is not configured as a relationship (no matching joinColumn)
      // So it should be a regular field
      expect(mapping.fields).toHaveLength(1);
      expect(mapping.relationships).toHaveLength(0);
    });

    it('should handle relationship column where relationship is not found', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'user_id', type: 'int', nullable: true })],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [], // Empty relationships array
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      // Should be included as a regular field
      expect(mapping.fields).toHaveLength(1);
      expect(mapping.relationships).toHaveLength(0);
    });
  });

  describe('getFieldName', () => {
    it('should convert snake_case to camelCase', () => {
      expect(ORMMappingUtils.getFieldName('user_name', defaultOptions)).toBe('userName');
      expect(ORMMappingUtils.getFieldName('created_at', defaultOptions)).toBe('createdAt');
      expect(ORMMappingUtils.getFieldName('is_active', defaultOptions)).toBe('isActive');
    });

    it('should handle already camelCase names', () => {
      expect(ORMMappingUtils.getFieldName('userName', defaultOptions)).toBe('userName');
      expect(ORMMappingUtils.getFieldName('createdAt', defaultOptions)).toBe('createdAt');
    });

    it('should use custom mapping when provided', () => {
      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'customFieldName', column: 'user_name', selectedType: 'string' }],
      };

      expect(ORMMappingUtils.getFieldName('user_name', options)).toBe('customFieldName');
    });

    it('should fall back to camelCase if no custom mapping', () => {
      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'otherField', column: 'other_column', selectedType: 'string' }],
      };

      expect(ORMMappingUtils.getFieldName('user_name', options)).toBe('userName');
    });
  });

  describe('mapToDoctrineType', () => {
    it('should map integer types', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'int' }))).toBe('integer');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'integer' }))).toBe('integer');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'bigint' }))).toBe('integer');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'smallint' }))).toBe('integer');
    });

    it('should map string types', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'varchar' }))).toBe('string');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'char' }))).toBe('string');
    });

    it('should map text types', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'text' }))).toBe('text');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'longtext' }))).toBe('text');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'mediumtext' }))).toBe('text');
    });

    it('should map tinyint to boolean when length is 1', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'tinyint', length: 1 }))).toBe('boolean');
    });

    it('should map tinyint to integer when length is not 1', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'tinyint', length: 2 }))).toBe('integer');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'tinyint' }))).toBe('integer');
    });

    it('should map boolean type', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'boolean' }))).toBe('boolean');
    });

    it('should map datetime types', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'datetime' }))).toBe('datetime');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'timestamp' }))).toBe('datetime');
    });

    it('should map date type', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'date' }))).toBe('date');
    });

    it('should map time type', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'time' }))).toBe('time');
    });

    it('should map decimal types', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'decimal' }))).toBe('decimal');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'numeric' }))).toBe('decimal');
    });

    it('should map float types', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'float' }))).toBe('float');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'double' }))).toBe('float');
    });

    it('should map json type', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'json' }))).toBe('json');
    });

    it('should map blob type', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'blob' }))).toBe('blob');
    });

    it('should default to string for unknown types', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'unknown_type' }))).toBe('string');
    });

    it('should handle case-insensitive type matching', () => {
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'INT' }))).toBe('integer');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'VARCHAR' }))).toBe('string');
      expect(ORMMappingUtils.mapToDoctrineType(createColumn({ type: 'Boolean' }))).toBe('boolean');
    });
  });

  describe('mapToPHPType', () => {
    it('should map integer types to int', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'int' }), defaultOptions)).toBe('int');
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'integer' }), defaultOptions)).toBe('int');
    });

    it('should map string types to string', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'varchar' }), defaultOptions)).toBe('string');
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'char' }), defaultOptions)).toBe('string');
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'text' }), defaultOptions)).toBe('string');
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'longtext' }), defaultOptions)).toBe('string');
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'mediumtext' }), defaultOptions)).toBe('string');
    });

    it('should map tinyint(1) to bool', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'tinyint', length: 1 }), defaultOptions)).toBe('bool');
    });

    it('should map tinyint to int when length is not 1', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'tinyint', length: 2 }), defaultOptions)).toBe('int');
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'tinyint' }), defaultOptions)).toBe('int');
    });

    it('should map boolean to bool', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'boolean' }), defaultOptions)).toBe('bool');
    });

    it('should map datetime types to DateTimeImmutable', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'datetime' }), defaultOptions)).toBe(
        'DateTimeImmutable'
      );
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'timestamp' }), defaultOptions)).toBe(
        'DateTimeImmutable'
      );
    });

    it('should map date to DateTimeImmutable', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'date' }), defaultOptions)).toBe('DateTimeImmutable');
    });

    it('should map decimal to string', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'decimal' }), defaultOptions)).toBe('string');
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'numeric' }), defaultOptions)).toBe('string');
    });

    it('should map float types to float', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'float' }), defaultOptions)).toBe('float');
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'double' }), defaultOptions)).toBe('float');
    });

    it('should map json to array', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'json' }), defaultOptions)).toBe('array');
    });

    it('should default to string for unknown types', () => {
      expect(ORMMappingUtils.mapToPHPType(createColumn({ type: 'unknown_type' }), defaultOptions)).toBe('string');
    });

    it('should use custom mapping when provided', () => {
      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'status', column: 'status', selectedType: 'StatusEnum' }],
        customDataTypes: [{ name: 'StatusEnum', phpType: 'App\\Enum\\StatusEnum' }],
      };

      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar' })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, options);
      expect(mapping.fields[0].phpType).toBe('App\\Enum\\StatusEnum');
    });

    it('should use enum class when provided', () => {
      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'status', column: 'status', selectedType: 'string', enumClass: 'StatusEnum' }],
      };

      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar' })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, options);
      expect(mapping.fields[0].phpType).toBe('StatusEnum');
      expect(mapping.fields[0].enumClass).toBe('StatusEnum');
    });

    it('should use custom data type by field name', () => {
      const options: GenerationOptions = {
        ...defaultOptions,
        customDataTypes: [{ name: 'status', phpType: 'App\\Enum\\StatusEnum' }],
      };

      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar' })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, options);
      expect(mapping.fields[0].doctrineType).toBe('status');
    });
  });

  describe('mapDoctrineTypeToPHP', () => {
    it('should map integer types to int', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('integer')).toBe('int');
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('bigint')).toBe('int');
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('smallint')).toBe('int');
    });

    it('should map string types to string', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('string')).toBe('string');
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('text')).toBe('string');
    });

    it('should map boolean to bool', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('boolean')).toBe('bool');
    });

    it('should map datetime types to DateTimeImmutable', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('datetime')).toBe('DateTimeImmutable');
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('date')).toBe('DateTimeImmutable');
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('time')).toBe('DateTimeImmutable');
    });

    it('should map decimal to float', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('decimal')).toBe('float');
    });

    it('should map float to float', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('float')).toBe('float');
    });

    it('should map json to array', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('json')).toBe('array');
    });

    it('should default to string for unknown types', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('unknown')).toBe('string');
    });

    it('should handle case-insensitive type matching', () => {
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('INTEGER')).toBe('int');
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('String')).toBe('string');
      expect(ORMMappingUtils.mapDoctrineTypeToPHP('BOOLEAN')).toBe('bool');
    });
  });

  describe('isConfiguredAsRelationship', () => {
    it('should return true when column matches a relationship joinColumn', () => {
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

      expect(ORMMappingUtils.isConfiguredAsRelationship('user_id', options)).toBe(true);
    });

    it('should return false when column does not match any relationship', () => {
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

      expect(ORMMappingUtils.isConfiguredAsRelationship('profile_id', options)).toBe(false);
    });

    it('should return false when no relationships are configured', () => {
      expect(ORMMappingUtils.isConfiguredAsRelationship('user_id', defaultOptions)).toBe(false);
    });

    it('should return false when relationships array is empty', () => {
      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [],
      };

      expect(ORMMappingUtils.isConfiguredAsRelationship('user_id', options)).toBe(false);
    });
  });

  describe('createORMMapping - Custom mappings', () => {
    it('should use custom field name from column mapping', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'user_name', type: 'varchar', nullable: true })],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'fullName', column: 'user_name', selectedType: 'string' }],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.fields[0].name).toBe('fullName');
      expect(mapping.fields[0].columnName).toBe('user_name');
    });

    it('should use custom Doctrine type from column mapping', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar', nullable: true })],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'status', column: 'status', selectedType: 'integer' }],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.fields[0].doctrineType).toBe('integer');
    });

    it('should use custom data type when referenced in column mapping', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar', nullable: true })],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'status', column: 'status', selectedType: 'StatusEnum' }],
        customDataTypes: [{ name: 'StatusEnum', phpType: 'App\\Enum\\StatusEnum' }],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.fields[0].doctrineType).toBe('StatusEnum');
      expect(mapping.fields[0].phpType).toBe('App\\Enum\\StatusEnum');
    });

    it('should use custom data type by field name when no column mapping', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar', nullable: true })],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        customDataTypes: [{ name: 'status', phpType: 'App\\Enum\\StatusEnum' }],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.fields[0].doctrineType).toBe('status');
    });

    it('should prioritize column mapping over field name custom data type', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar', nullable: true })],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'status', column: 'status', selectedType: 'integer' }],
        customDataTypes: [{ name: 'status', phpType: 'App\\Enum\\StatusEnum' }],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      // Column mapping should take precedence
      expect(mapping.fields[0].doctrineType).toBe('integer');
    });

    it('should handle enum class in column mapping', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'status', type: 'varchar', nullable: true })],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        columnFieldMappings: [{ field: 'status', column: 'status', selectedType: 'string', enumClass: 'StatusEnum' }],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.fields[0].enumClass).toBe('StatusEnum');
      expect(mapping.fields[0].phpType).toBe('StatusEnum');
    });
  });

  describe('createORMMapping - Edge cases', () => {
    it('should handle empty schema', () => {
      const schema = createSchema({ columns: [] });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields).toHaveLength(0);
      expect(mapping.relationships).toHaveLength(0);
    });

    it('should handle schema with only ID column', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'id', type: 'int', nullable: false, autoIncrement: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields).toHaveLength(0);
      expect(mapping.relationships).toHaveLength(0);
    });

    it('should maintain column order in fields', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'first', type: 'varchar', nullable: true }),
          createColumn({ name: 'second', type: 'varchar', nullable: true }),
          createColumn({ name: 'third', type: 'varchar', nullable: true }),
        ],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields).toHaveLength(3);
      expect(mapping.fields[0].name).toBe('first');
      expect(mapping.fields[1].name).toBe('second');
      expect(mapping.fields[2].name).toBe('third');
    });

    it('should handle columns without length', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'description', type: 'text', nullable: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].length).toBeUndefined();
    });

    it('should handle columns without default value', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'name', type: 'varchar', nullable: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].default).toBeUndefined();
    });

    it('should handle columns without unsigned property', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'count', type: 'int', nullable: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].unsigned).toBeUndefined();
    });

    it('should set isTimestamp to false', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'created_at', type: 'datetime', nullable: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].isTimestamp).toBe(false);
    });

    it('should set isByField to false', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'created_by', type: 'int', nullable: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].isByField).toBe(false);
    });

    it('should set isRelationship to false for regular fields', () => {
      const schema = createSchema({
        columns: [createColumn({ name: 'name', type: 'varchar', nullable: true })],
      });

      const mapping = ORMMappingUtils.createORMMapping(schema, defaultOptions);

      expect(mapping.fields[0].isRelationship).toBe(false);
    });
  });

  describe('createORMMapping - Complex scenarios', () => {
    it('should handle mixed columns with relationships', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'id', type: 'int', nullable: false, autoIncrement: true }),
          createColumn({ name: 'user_id', type: 'int', nullable: true }),
          createColumn({ name: 'name', type: 'varchar', length: 255, nullable: false }),
          createColumn({ name: 'email', type: 'varchar', length: 255, nullable: true }),
          createColumn({ name: 'profile_id', type: 'int', nullable: true }),
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
          {
            id: '2',
            field: 'profile',
            type: 'one-to-one',
            targetEntity: 'Profile',
            joinColumn: 'profile_id',
          },
        ],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.fields).toHaveLength(2);
      expect(mapping.fields[0].name).toBe('name');
      expect(mapping.fields[1].name).toBe('email');
      expect(mapping.relationships).toHaveLength(2);
      expect(mapping.relationships[0].field).toBe('user');
      expect(mapping.relationships[1].field).toBe('profile');
    });

    it('should handle multiple custom data types', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'status', type: 'varchar', nullable: true }),
          createColumn({ name: 'priority', type: 'varchar', nullable: true }),
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        customDataTypes: [
          { name: 'status', phpType: 'App\\Enum\\StatusEnum' },
          { name: 'priority', phpType: 'App\\Enum\\PriorityEnum' },
        ],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.fields[0].doctrineType).toBe('status');
      expect(mapping.fields[1].doctrineType).toBe('priority');
    });

    it('should handle relationships with same target entity', () => {
      const schema = createSchema({
        columns: [
          createColumn({ name: 'created_by_id', type: 'int', nullable: true }),
          createColumn({ name: 'updated_by_id', type: 'int', nullable: true }),
        ],
      });

      const options: GenerationOptions = {
        ...defaultOptions,
        relationships: [
          {
            id: '1',
            field: 'createdBy',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'created_by_id',
          },
          {
            id: '2',
            field: 'updatedBy',
            type: 'many-to-one',
            targetEntity: 'User',
            joinColumn: 'updated_by_id',
          },
        ],
      };

      const mapping = ORMMappingUtils.createORMMapping(schema, options);

      expect(mapping.relationships).toHaveLength(2);
      expect(mapping.relationships[0].targetEntity).toBe('User');
      expect(mapping.relationships[1].targetEntity).toBe('User');
    });
  });
});
