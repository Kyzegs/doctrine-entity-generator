import { TableSchema, TableColumn, GenerationOptions } from './types';
import { ORMMappingUtils } from './orm-mapping-utils';
import { toPascalCase } from './utils';
import { DatabaseDialect } from './example-queries';

export class DoctrineXMLGenerator {
  static generate(schema: TableSchema, options: GenerationOptions): string {
    const entityName = this.getEntityName(schema.name, options);
    const entityClass = options.namespace ? `${options.namespace}\\${entityName}` : entityName;
    
    // Create ORM mapping for field generation
    const ormMapping = ORMMappingUtils.createORMMapping(schema, options);
    
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
      const hasUnsigned = idColumn.unsigned && options.databaseDialect === DatabaseDialect.MYSQL;
      const hasDefault = idColumn.default && idColumn.default !== 'NULL';
      const needsOptions = hasUnsigned || hasDefault;
      
      xml += `
        <id name="id" type="integer" length="10"`;
      
      if (needsOptions) {
        xml += `>`;
        xml += `
            <options>`;
        
        // Add default value if present
        if (hasDefault) {
          xml += `
                <option name="default">${this.escapeXmlValue(idColumn.default)}</option>`;
        }
        
        // Add unsigned option for MySQL if applicable
        if (hasUnsigned) {
          xml += `
                <option name="unsigned">true</option>`;
        }
        
        xml += `
            </options>`;
        xml += `
            <generator/>`;
        xml += `
        </id>`;
      } else {
        xml += `>
            <generator/>
        </id>`;
      }
    }

    // Generate all fields based on the ORM mapping
    for (const field of ormMapping.fields) {
      xml += this.generateFieldXMLFromMapping(field, options);
    }
    
    // Generate relationships
    for (const relationship of ormMapping.relationships) {
      const targetEntity = relationship.targetEntityNamespace 
        ? `${relationship.targetEntityNamespace}\\${relationship.targetEntity}`
        : `${options.namespace}\\${relationship.targetEntity}`;
      
      let relationshipXml = `
        <${relationship.type} field="${relationship.field}" target-entity="${targetEntity}"`;
      
      if (relationship.fetch && relationship.fetch !== 'LAZY') {
        relationshipXml += ` fetch="${relationship.fetch}"`;
      }
      
      if (relationship.mappedBy) {
        relationshipXml += ` mapped-by="${relationship.mappedBy}"`;
      }
      
      if (relationship.inversedBy) {
        relationshipXml += ` inversed-by="${relationship.inversedBy}"`;
      }
      
      if (relationship.orphanRemoval) {
        relationshipXml += ` orphan-removal="true"`;
      }
      
      relationshipXml += `>`;
      
      // Add join-column for many-to-one and one-to-one relationships
      if (relationship.joinColumn && (relationship.type === 'many-to-one' || relationship.type === 'one-to-one')) {
        // Check if the corresponding SQL column is nullable
        const correspondingColumn = schema.columns.find(col => col.name === relationship.joinColumn);
        const isNullable = correspondingColumn && correspondingColumn.nullable;
        
        relationshipXml += `
            <join-column name="${relationship.joinColumn}"${isNullable ? ' nullable="true"' : ' nullable="false"'}/>`;
      }
      
      // Add cascade operations
      if (relationship.cascade && relationship.cascade.length > 0) {
        relationshipXml += `
            <cascade>`;
        for (const cascadeType of relationship.cascade) {
          relationshipXml += `
                <cascade-${cascadeType}/>`;
        }
        relationshipXml += `
            </cascade>`;
      }
      
      relationshipXml += `
        </${relationship.type}>`;
      
      xml += relationshipXml;
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

    // Relationships are now handled in the main field loop above
    // This ensures they appear in the same order as the CREATE TABLE statement

    xml += `
    </entity>
</doctrine-mapping>`;

    return xml;
  }

  private static generateFieldXMLFromMapping(field: any, options: GenerationOptions): string {
    let xml = `
        <field name="${field.name}"`;
    
    // Only include column attribute if explicitly requested or if there's a custom mapping with a column specified
    const customMapping = options.columnFieldMappings.find(mapping => mapping.field === field.name);
    const shouldIncludeColumn = options.explicitlyDefineColumns || (customMapping && customMapping.column);
    
    if (shouldIncludeColumn) {
      // Use the custom mapping column if it exists, otherwise use the field's column name
      const columnName = customMapping?.column || field.columnName;
      xml += ` column="${columnName}"`;
    }
    
    if (field.doctrineType !== 'string') {
      xml += ` type="${field.doctrineType}"`;
    }
    
    if (field.length) {
      xml += ` length="${field.length}"`;
    }
    
    if (field.nullable) {
      xml += ` nullable="true"`;
    }
    
    // Add enum class if specified
    if (field.enumClass) {
      xml += ` enum-type="${field.enumClass}"`;
    }
    
    // Check if we need to add options (unsigned or default)
    const integerTypes = ['integer', 'smallint', 'bigint'];
    const hasUnsigned = field.unsigned && options.databaseDialect === DatabaseDialect.MYSQL && integerTypes.includes(field.doctrineType);
    const hasDefault = field.default && field.default !== 'NULL';
    const needsOptions = hasUnsigned || hasDefault;
    
    if (needsOptions) {
      xml += `>`;
      xml += `
            <options>`;
      
      // Add default value if present
      if (hasDefault) {
        xml += `
                <option name="default">${this.escapeXmlValue(field.default)}</option>`;
      }
      
      // Add unsigned option for MySQL if applicable
      if (hasUnsigned) {
        xml += `
                <option name="unsigned">true</option>`;
      }
      
      xml += `
            </options>`;
      xml += `
        </field>`;
    } else {
      xml += `/>`;
    }
    
    return xml;
  }

  private static escapeXmlValue(value: string): string {
    // Escape XML special characters
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }





  private static getEntityName(tableName: string, options: GenerationOptions): string {
    // Use custom entity name if provided, otherwise convert table name to PascalCase
    if (options.entityName && options.entityName.trim()) {
      return `${options.entityPrefix}${options.entityName.trim()}${options.entitySuffix}`;
    }
    
    // Convert table name to PascalCase entity name
    const baseName = toPascalCase(tableName);
    return `${options.entityPrefix}${baseName}${options.entitySuffix}`;
  }
}
