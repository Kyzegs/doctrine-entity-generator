import { TableSchema, TableColumn, GenerationOptions } from './types';
import { pluralize, singularize, toCamelCase, toPascalCase } from './utils';

export interface ORMFieldMapping {
  name: string;
  columnName: string;
  doctrineType: string;
  phpType: string;
  nullable: boolean;
  isRequired: boolean;
  length?: number;
  enumClass?: string;
  isTimestamp: boolean;
  isByField: boolean;
  isRelationship: boolean;
  relationship?: any; // Store the full relationship object for relationship fields
  unsigned?: boolean; // For MySQL: INT UNSIGNED, BIGINT UNSIGNED, etc.
  default?: string; // Default value from the column
}

export class ORMMappingUtils {
  /**
   * Creates a complete ORM mapping from the schema and options
   * This is shared between Doctrine XML generator and PHP entity generator
   */
  static createORMMapping(
    schema: TableSchema,
    options: GenerationOptions
  ): {
    fields: ORMFieldMapping[];
    relationships: any[];
  } {
    const fields: ORMFieldMapping[] = [];

    // Process all columns to create field mappings, maintaining original order
    for (const column of schema.columns) {
      // Skip ID columns for regular field mapping - they're handled separately in Doctrine XML
      if (column.name === 'id' || column.autoIncrement) {
        continue;
      }

      // Determine field name - use custom mapping if available, otherwise convert from column name
      let fieldName = this.getFieldName(column.name, options);

      // Check if there's a custom mapping that defines a different field name
      const fieldMapping = options.columnFieldMappings.find((mapping) => mapping.column === column.name);
      if (fieldMapping && fieldMapping.field) {
        fieldName = fieldMapping.field;
      }
      const isRelationship = column.name.endsWith('_id') && this.isConfiguredAsRelationship(column.name, options);

      if (isRelationship) {
        // This is a relationship column, add it to relationships array instead of fields
        const relationship = options.relationships?.find((r) => r.joinColumn === column.name);
        if (relationship) {
          // Don't add to fields array - relationships are handled separately
        }
        continue;
      }

      const isTimestamp = false; // No more hardcoded timestamp detection
      const isByField = false; // No more hardcoded _by detection

      // Get custom mapping for this field - first try by field name, then by column name
      let customMapping = options.columnFieldMappings.find((mapping) => mapping.field === fieldName);
      if (!customMapping && column.name) {
        // Also check if there's a mapping where the column matches
        customMapping = options.columnFieldMappings.find((mapping) => mapping.column === column.name);
      }

      // Determine Doctrine type
      let doctrineType = this.mapToDoctrineType(column);
      if (customMapping?.selectedType) {
        const customDataType = options.customDataTypes.find((dt) => dt.name === customMapping.selectedType);
        if (customDataType) {
          doctrineType = customDataType.name;
        } else {
          doctrineType = customMapping.selectedType;
        }
      } else {
        // Check if there's a custom data type that matches the field name
        const customDataType = options.customDataTypes.find((dt) => dt.name === fieldName);
        if (customDataType) {
          doctrineType = customDataType.name;
        }
      }

      // Determine PHP type
      let phpType = this.mapToPHPType(column, options, schema.name);
      if (customMapping?.selectedType) {
        const customDataType = options.customDataTypes.find((dt) => dt.name === customMapping.selectedType);
        if (customDataType) {
          phpType = customDataType.phpType;
        } else {
          phpType = this.mapDoctrineTypeToPHP(customMapping.selectedType);
        }
      }

      let enumClass = customMapping?.enumClass;
      if (!enumClass && this.shouldGenerateEnumForColumn(column, options)) {
        enumClass = this.getGeneratedEnumClassName(column, schema.name, options);
      }

      // Override with enum class if specified or generated
      if (enumClass) {
        phpType = enumClass;
      }

      fields.push({
        name: fieldName,
        columnName: column.name,
        doctrineType,
        phpType,
        nullable: column.nullable,
        isRequired: !column.nullable,
        length: column.length,
        enumClass,
        isTimestamp,
        isByField,
        isRelationship: false,
        unsigned: column.unsigned,
        default: column.default,
      });
    }

    // Get relationships in the same order as they appear in the columns
    const orderedRelationships: any[] = [];
    for (const column of schema.columns) {
      if (column.name === 'id' || column.autoIncrement) {
        continue;
      }

      if (column.name.endsWith('_id') && this.isConfiguredAsRelationship(column.name, options)) {
        const relationship = options.relationships?.find((r) => r.joinColumn === column.name);
        if (relationship) {
          orderedRelationships.push(relationship);
        }
      }
    }

    return { fields, relationships: orderedRelationships };
  }

  /**
   * Gets the field name for a column, respecting custom mappings
   */
  static getFieldName(columnName: string, options: GenerationOptions): string {
    const customMapping = options.columnFieldMappings.find((mapping) => mapping.column === columnName);
    if (customMapping) {
      return customMapping.field;
    }
    return toCamelCase(columnName);
  }

  /**
   * Maps SQL column type to Doctrine type
   */
  static mapToDoctrineType(column: TableColumn): string {
    const type = column.type.toLowerCase();

    switch (type) {
      case 'int':
      case 'integer':
      case 'bigint':
      case 'smallint':
        return 'integer';
      case 'varchar':
      case 'char':
        return 'string';
      case 'text':
      case 'longtext':
      case 'mediumtext':
        return 'text';
      case 'tinyint':
        if (column.length === 1) {
          return 'boolean';
        }
        return 'integer';
      case 'boolean':
        return 'boolean';
      case 'datetime':
      case 'timestamp':
        return 'datetime';
      case 'date':
        return 'date';
      case 'time':
        return 'time';
      case 'decimal':
      case 'numeric':
        return 'decimal';
      case 'float':
      case 'double':
        return 'float';
      case 'json':
        return 'json';
      case 'blob':
        return 'blob';
      default:
        return 'string';
    }
  }

  /**
   * Maps SQL column type to PHP type
   */
  static mapToPHPType(column: TableColumn, options: GenerationOptions, tableName?: string): string {
    const fieldName = this.getFieldName(column.name, options);

    // Check for custom type mapping first
    let customMapping = options.columnFieldMappings.find((mapping) => mapping.field === fieldName);
    if (!customMapping && column.name) {
      customMapping = options.columnFieldMappings.find((mapping) => mapping.column === column.name);
    }
    if (customMapping?.enumClass) {
      return customMapping.enumClass;
    }
    if (customMapping?.selectedType) {
      const customDataType = options.customDataTypes.find((dt) => dt.name === customMapping.selectedType);
      if (customDataType) {
        return customDataType.phpType;
      } else {
        return this.mapDoctrineTypeToPHP(customMapping.selectedType);
      }
    }

    // Check if there's a custom data type that matches the field name
    const customDataType = options.customDataTypes.find((dt) => dt.name === fieldName);
    if (customDataType) {
      return customDataType.phpType;
    }

    if (tableName && this.shouldGenerateEnumForColumn(column, options)) {
      return this.getGeneratedEnumClassName(column, tableName, options);
    }

    const type = column.type.toLowerCase();

    switch (type) {
      case 'int':
      case 'integer':
        return 'int';
      case 'varchar':
      case 'char':
      case 'text':
      case 'longtext':
      case 'mediumtext':
        return 'string';
      case 'tinyint':
        if (column.length === 1) {
          return 'bool';
        }
        return 'int';
      case 'boolean':
        return 'bool';
      case 'datetime':
      case 'timestamp':
        return 'DateTimeImmutable';
      case 'date':
        return 'DateTimeImmutable';
      case 'decimal':
      case 'numeric':
        return 'string'; // Often handled as string to avoid precision issues
      case 'float':
      case 'double':
        return 'float';
      case 'json':
        return 'array';
      default:
        return 'string';
    }
  }

  static shouldGenerateEnumForColumn(column: TableColumn, options: GenerationOptions): boolean {
    return !!(
      options.generateEnumsFromSql &&
      column.type.toLowerCase() === 'enum' &&
      column.enumValues &&
      column.enumValues.length > 0
    );
  }

  static getGeneratedEnumClassName(column: TableColumn, tableName: string, options: GenerationOptions): string {
    const entityName = this.getEntityName(tableName, options);
    return `${entityName}${toPascalCase(this.getFieldName(column.name, options))}Enum`;
  }

  private static getEntityName(tableName: string, options: GenerationOptions): string {
    if (options.entityName && options.entityName.trim()) {
      return `${options.entityPrefix}${options.entityName.trim()}${options.entitySuffix}`;
    }

    let baseName = tableName;
    if (options.classNamingConvention === 'singular') {
      baseName = singularize(tableName);
    } else if (options.classNamingConvention === 'plural') {
      baseName = pluralize(tableName);
    }

    return `${options.entityPrefix}${toPascalCase(baseName)}${options.entitySuffix}`;
  }

  /**
   * Maps Doctrine type to PHP type
   */
  static mapDoctrineTypeToPHP(doctrineType: string): string {
    switch (doctrineType.toLowerCase()) {
      case 'integer':
      case 'bigint':
      case 'smallint':
        return 'int';
      case 'string':
      case 'text':
        return 'string';
      case 'boolean':
        return 'bool';
      case 'datetime':
      case 'date':
      case 'time':
        return 'DateTimeImmutable';
      case 'decimal':
      case 'float':
        return 'float';
      case 'json':
        return 'array';
      default:
        return 'string';
    }
  }

  /**
   * Checks if a column is configured as a relationship
   */
  static isConfiguredAsRelationship(columnName: string, options: GenerationOptions): boolean {
    return (options.relationships || []).some((relationship) => relationship.joinColumn === columnName);
  }
}
