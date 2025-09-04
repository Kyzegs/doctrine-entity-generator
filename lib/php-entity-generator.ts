import { TableSchema, TableColumn, GenerationOptions } from './types';

export class PHPEntityGenerator {
  static generate(schema: TableSchema, options: GenerationOptions): string {
    const entityName = this.getEntityName(schema.name, options);
    const className = `${options.entityPrefix}${entityName}${options.entitySuffix}`;
    
    let php = `<?php

declare(strict_types=1);

namespace ${options.namespace};

use AntiCorruptionLayer\\Tinpay\\Helper\\EntityTrait;
use App\\Shared\\Domain\\Enum\\ScrambleCodeEnum;
use App\\Shared\\Domain\\Model\\Identity\\ScrambleCodeEntityInterface;
use DateTimeImmutable;`;

    // Add trait imports based on timestamp columns
    const timestampColumns = schema.columns.filter(col => this.isSpecialTimestampColumn(col.name));
    const hasCreated = timestampColumns.some(col => col.name === 'created');
    const hasDeleted = timestampColumns.some(col => col.name === 'deleted');
    
    if (hasCreated) {
      php += `
use PayNL\\UserActions\\Contract\\CreatedAtInterface;
use PayNL\\UserActions\\Contract\\CreatedByInterface;
use PayNL\\UserActions\\Trait\\CreatedAtTrait;
use PayNL\\UserActions\\Trait\\CreatedByTrait;`;
    }
    
    if (hasDeleted) {
      php += `
use PayNL\\UserActions\\Contract\\DeletedAtInterface;
use PayNL\\UserActions\\Contract\\DeletedByInterface;
use PayNL\\UserActions\\Trait\\DeletedAtTrait;
use PayNL\\UserActions\\Trait\\DeletedByTrait;`;
    }

    // Add relationship imports
    const foreignKeyConstraints = schema.constraints.filter(c => c.type === 'FOREIGN KEY');
    for (const constraint of foreignKeyConstraints) {
      if (constraint.referencedTable) {
        const relatedEntityName = this.getEntityName(constraint.referencedTable, options);
        php += `
use ${options.namespace}\\${relatedEntityName};`;
      }
    }

    php += `

class ${className} implements
    ScrambleCodeEntityInterface`;

    if (hasCreated) {
      php += `,
    CreatedAtInterface,
    CreatedByInterface`;
    }
    
    if (hasDeleted) {
      php += `,
    DeletedAtInterface,
    DeletedByInterface`;
    }

    php += `
{
    use EntityTrait;`;

    if (hasCreated) {
      php += `
    use CreatedAtTrait;
    use CreatedByTrait;`;
    }
    
    if (hasDeleted) {
      php += `
    use DeletedAtTrait;
    use DeletedByTrait;`;
    }

    // Add private properties for nullable timestamp fields
    const nullableTimestampColumns = timestampColumns.filter(col => 
      col.nullable && !['created', 'deleted'].includes(col.name)
    );
    
    for (const column of nullableTimestampColumns) {
      const fieldName = this.getTimestampFieldName(column.name);
      php += `

    private ?DateTimeImmutable $${fieldName} = null;`;
    }

    // Add private properties for nullable _by fields
    const byColumns = schema.columns.filter(col => 
      col.name.endsWith('_by') && 
      col.nullable && 
      !['created_by', 'deleted_by'].includes(col.name)
    );
    
    for (const column of byColumns) {
      const fieldName = this.toCamelCase(column.name);
      php += `

    private ?string $${fieldName} = null;`;
    }

    // Generate constructor
    php += this.generateConstructor(schema, options);

    // Generate getScrambleCode method
    const scrambleCodeName = schema.name.toUpperCase();
    php += `

    public function getScrambleCode(): ScrambleCodeEnum
    {
        return ScrambleCodeEnum::${scrambleCodeName};
    }`;

    // Generate getters and setters for constructor parameters
    const constructorColumns = this.getConstructorColumns(schema);
    for (const column of constructorColumns) {
      php += this.generateGetterSetter(column, schema, options);
    }

    // Generate getters and setters for nullable timestamp fields
    for (const column of nullableTimestampColumns) {
      php += this.generateTimestampGetterSetter(column);
    }

    // Generate getters and setters for nullable _by fields
    for (const column of byColumns) {
      php += this.generateByFieldGetterSetter(column);
    }

    php += `
}`;

    return php;
  }

  private static generateConstructor(schema: TableSchema, options: GenerationOptions): string {
    const constructorColumns = this.getConstructorColumns(schema);
    
    if (constructorColumns.length === 0) {
      return `

    public function __construct()
    {
    }`;
    }

    let constructor = `

    public function __construct(`;

    const params: string[] = [];
    for (const column of constructorColumns) {
      const param = this.generateConstructorParameter(column, schema, options);
      if (param) {
        params.push(param);
      }
    }

    constructor += `
        ${params.join(',\n        ')}
    ) {
    }`;

    return constructor;
  }

  private static generateConstructorParameter(
    column: TableColumn, 
    schema: TableSchema, 
    options: GenerationOptions
  ): string | null {
    // Check if this is a foreign key column
    const foreignKeyConstraint = schema.constraints.find(c => 
      c.type === 'FOREIGN KEY' && c.columns.includes(column.name)
    );

    if (foreignKeyConstraint && foreignKeyConstraint.referencedTable) {
      const fieldName = this.getRelationshipFieldName(column.name);
      const relatedEntityName = this.getEntityName(foreignKeyConstraint.referencedTable, options);
      return `private ${relatedEntityName} $${fieldName}`;
    }

    // Skip special columns handled by traits
    if (this.isSpecialTimestampColumn(column.name) || 
        column.name.endsWith('_by') || 
        column.name === 'id' || 
        column.autoIncrement) {
      return null;
    }

    const fieldName = this.toCamelCase(column.name);
    const phpType = this.mapToPHPType(column);
    
    return `private ${phpType} $${fieldName}`;
  }

  private static generateGetterSetter(
    column: TableColumn, 
    schema: TableSchema, 
    options: GenerationOptions
  ): string {
    // Check if this is a foreign key column
    const foreignKeyConstraint = schema.constraints.find(c => 
      c.type === 'FOREIGN KEY' && c.columns.includes(column.name)
    );

    if (foreignKeyConstraint && foreignKeyConstraint.referencedTable) {
      return this.generateRelationshipGetterSetter(column, foreignKeyConstraint, options);
    }

    // Skip special columns handled by traits
    if (this.isSpecialTimestampColumn(column.name) || 
        column.name.endsWith('_by') || 
        column.name === 'id' || 
        column.autoIncrement) {
      return '';
    }

    const fieldName = this.toCamelCase(column.name);
    const getterName = this.getGetterName(column);
    const phpType = this.mapToPHPType(column);
    const pascalFieldName = this.toPascalCase(fieldName);

    let methods = `

    public function ${getterName}(): ${phpType}
    {
        return $this->${fieldName};
    }

    public function set${pascalFieldName}(${phpType} $${fieldName}): self
    {
        $this->${fieldName} = $${fieldName};

        return $this;
    }`;

    return methods;
  }

  private static generateRelationshipGetterSetter(
    column: TableColumn,
    foreignKeyConstraint: any,
    options: GenerationOptions
  ): string {
    const fieldName = this.getRelationshipFieldName(column.name);
    const relatedEntityName = this.getEntityName(foreignKeyConstraint.referencedTable, options);
    const pascalFieldName = this.toPascalCase(fieldName);

    return `

    public function get${pascalFieldName}(): ${relatedEntityName}
    {
        return $this->${fieldName};
    }

    public function set${pascalFieldName}(${relatedEntityName} $${fieldName}): self
    {
        $this->${fieldName} = $${fieldName};

        return $this;
    }`;
  }

  private static generateTimestampGetterSetter(column: TableColumn): string {
    const fieldName = this.getTimestampFieldName(column.name);
    const pascalFieldName = this.toPascalCase(fieldName);

    return `

    public function get${pascalFieldName}(): ?DateTimeImmutable
    {
        return $this->${fieldName};
    }

    public function set${pascalFieldName}(?DateTimeImmutable $${fieldName} = null): self
    {
        $this->${fieldName} = $${fieldName};

        return $this;
    }`;
  }

  private static generateByFieldGetterSetter(column: TableColumn): string {
    const fieldName = this.toCamelCase(column.name);
    const pascalFieldName = this.toPascalCase(fieldName);

    return `

    public function get${pascalFieldName}(): ?string
    {
        return $this->${fieldName};
    }

    public function set${pascalFieldName}(?string $${fieldName} = null): self
    {
        $this->${fieldName} = $${fieldName};

        return $this;
    }`;
  }

  private static getConstructorColumns(schema: TableSchema): TableColumn[] {
    return schema.columns.filter(column => {
      // Skip ID and auto-increment columns
      if (column.name === 'id' || column.autoIncrement) {
        return false;
      }
      
      // Skip special timestamp columns handled by traits
      if (this.isSpecialTimestampColumn(column.name)) {
        return false;
      }
      
      // Skip nullable _by columns (they're handled separately)
      if (column.name.endsWith('_by') && column.nullable) {
        return false;
      }
      
      // Include required columns and foreign key columns
      return !column.nullable || this.isForeignKeyColumn(column.name, schema);
    });
  }

  private static mapToPHPType(column: TableColumn): string {
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

  private static getGetterName(column: TableColumn): string {
    const fieldName = this.toCamelCase(column.name);
    
    // Use 'is' prefix for boolean fields
    if (column.type.toLowerCase() === 'tinyint' && column.length === 1) {
      return `is${this.toPascalCase(fieldName)}`;
    }
    
    return `get${this.toPascalCase(fieldName)}`;
  }

  private static isForeignKeyColumn(columnName: string, schema: TableSchema): boolean {
    return schema.constraints.some(constraint => 
      constraint.type === 'FOREIGN KEY' && 
      constraint.columns.includes(columnName)
    );
  }

  private static isSpecialTimestampColumn(columnName: string): boolean {
    const timestampPatterns = ['created', 'sent', 'received', 'deleted', 'updated'];
    return timestampPatterns.some(pattern => 
      columnName === pattern || 
      columnName.startsWith(pattern + '_') ||
      columnName.endsWith('_' + pattern)
    );
  }

  private static getTimestampFieldName(columnName: string): string {
    // Convert timestamp columns to camelCase with 'At' suffix
    if (columnName === 'created') return 'createdAt';
    if (columnName === 'sent') return 'sentAt';
    if (columnName === 'received') return 'receivedAt';
    if (columnName === 'deleted') return 'deletedAt';
    if (columnName === 'updated') return 'updatedAt';
    
    return this.toCamelCase(columnName);
  }

  private static getRelationshipFieldName(columnName: string): string {
    // Remove _id suffix and convert to camelCase
    const baseName = columnName.replace(/_id$/, '');
    return this.toCamelCase(baseName);
  }

  private static getEntityName(tableName: string, options: GenerationOptions): string {
    // Convert table name to PascalCase entity name
    const baseName = this.toPascalCase(tableName);
    return `${options.entityPrefix}${baseName}${options.entitySuffix}`;
  }

  private static toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private static toPascalCase(str: string): string {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }
}
