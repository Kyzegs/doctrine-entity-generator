import { TableSchema, TableColumn, GenerationOptions } from './types';

export class DoctrineXMLGenerator {
  static generate(schema: TableSchema, options: GenerationOptions): string {
    const entityName = this.getEntityName(schema.name, options);
    const entityClass = `${options.namespace}\\${entityName}`;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<doctrine-mapping
        xmlns="http://doctrine-project.org/schemas/orm/doctrine-mapping"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://doctrine-project.org/schemas/orm/doctrine-mapping
                        http://doctrine-project.org/schemas/orm/doctrine-mapping.xsd"
>
    <entity
            name="${entityClass}"
            table="${schema.name}"
    >`;

    // Generate ID field
    const idColumn = schema.columns.find(col => col.name === 'id' || col.autoIncrement);
    if (idColumn) {
      xml += `
        <id name="id" type="integer" length="10">
            <generator/>
        </id>`;
    }

    // Generate regular fields
    const regularColumns = schema.columns.filter(col => 
      col.name !== 'id' && 
      !col.autoIncrement && 
      !this.isForeignKeyColumn(col.name, schema) &&
      !this.isSpecialTimestampColumn(col.name)
    );

    for (const column of regularColumns) {
      xml += this.generateFieldXML(column);
    }

    // Generate special timestamp fields
    const timestampColumns = schema.columns.filter(col => this.isSpecialTimestampColumn(col.name));
    for (const column of timestampColumns) {
      xml += this.generateTimestampFieldXML(column);
    }

    // Generate indexes
    const nonPrimaryIndexes = schema.indexes.filter(idx => !idx.primary);
    if (nonPrimaryIndexes.length > 0) {
      xml += `

        <indexes>`;
      for (const index of nonPrimaryIndexes) {
        xml += `
            <index name="${index.name}" columns="${index.columns.join(',')}"/>`;
      }
      xml += `
        </indexes>`;
    }

    // Generate relationships
    const foreignKeyConstraints = schema.constraints.filter(c => c.type === 'FOREIGN KEY');
    for (const constraint of foreignKeyConstraints) {
      if (constraint.referencedTable && constraint.columns.length === 1) {
        const fieldName = this.getRelationshipFieldName(constraint.columns[0]);
        const targetEntity = this.getEntityName(constraint.referencedTable, options);
        xml += `
        <many-to-one field="${fieldName}" target-entity="${options.namespace}\\${targetEntity}"/>`;
      }
    }

    xml += `
    </entity>
</doctrine-mapping>`;

    return xml;
  }

  private static generateFieldXML(column: TableColumn): string {
    const fieldName = this.toCamelCase(column.name);
    const doctrineType = this.mapToDoctrineType(column);
    
    let xml = `
        <field name="${fieldName}"`;
    
    if (column.name !== fieldName) {
      xml += ` column="${column.name}"`;
    }
    
    if (doctrineType !== 'string') {
      xml += ` type="${doctrineType}"`;
    }
    
    if (column.length) {
      xml += ` length="${column.length}"`;
    }
    
    if (column.nullable) {
      xml += ` nullable="true"`;
    }
    
    xml += `/>`;
    
    return xml;
  }

  private static generateTimestampFieldXML(column: TableColumn): string {
    const fieldName = this.getTimestampFieldName(column.name);
    
    let xml = `
        <field name="${fieldName}" column="${column.name}" type="timestamp"`;
    
    if (column.nullable) {
      xml += ` nullable="true"`;
    }
    
    xml += `/>`;
    
    return xml;
  }

  private static mapToDoctrineType(column: TableColumn): string {
    const type = column.type.toLowerCase();
    
    switch (type) {
      case 'int':
      case 'integer':
        // Check for special integer string conversion pattern
        if (column.name.endsWith('_by')) {
          return 'integer_string_conversion';
        }
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
        return 'smallint';
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
        return 'float';
      case 'double':
        return 'float';
      case 'json':
        return 'json';
      default:
        return 'string';
    }
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
