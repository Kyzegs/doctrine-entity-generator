import { TableSchema, TableColumn, GenerationOptions, Relationship } from './types';
import { ORMMappingUtils, ORMFieldMapping } from './orm-mapping-utils';


export class PHPEntityGenerator {


  static generate(schema: TableSchema, options: GenerationOptions): string {
    const entityName = this.getEntityName(schema.name, options);
    const className = `${options.entityPrefix}${entityName}${options.entitySuffix}`;
    
    let php = `<?php

declare(strict_types=1);

namespace ${options.namespace};

use App\\Shared\\Domain\\Enum\\ScrambleCodeEnum;
use App\\Shared\\Domain\\Model\\Identity\\ScrambleCodeEntityInterface;
use DateTimeImmutable;
use Doctrine\\Common\\Collections\\Collection;
use Doctrine\\Common\\Collections\\ArrayCollection;`;

    // Add trait imports based on selected traits
    const selectedTraits = options.selectedTraits || [];
    const traitImports = new Set<string>();
    const traitInterfaces = new Set<string>();
    
    for (const traitName of selectedTraits) {
      const trait = options.customTraits.find(t => t.name === traitName);
      if (trait) {
        traitImports.add(`use ${trait.namespace}\\${trait.name};`);
        trait.requiredInterfaces.forEach(iface => traitInterfaces.add(iface));
      }
    }
    
    // Add relationship imports
    for (const relationship of options.relationships) {
      const targetEntity = relationship.targetEntityNamespace 
        ? relationship.targetEntityNamespace
        : options.namespace;
      php += `
use ${targetEntity}\\${relationship.targetEntity};`;
    }
    
    // Add trait imports
    for (const importStatement of traitImports) {
      php += `
${importStatement}`;
    }
    


    // Add relationship imports
    for (const relationship of options.relationships) {
      const targetEntity = relationship.targetEntityNamespace 
        ? relationship.targetEntityNamespace
        : options.namespace;
      php += `
use ${targetEntity}\\${relationship.targetEntity};`;
    }

    php += `

class ${className} implements
    ScrambleCodeEntityInterface`;

    // Add required interfaces from selected traits
    for (const interfaceName of traitInterfaces) {
      php += `,
    ${interfaceName}`;
    }

    php += `
{`;

    // Add selected traits
    for (const traitName of selectedTraits) {
      php += `
    use ${traitName};`;
    }

    // Create ORM mapping for property generation
    const ormMapping = ORMMappingUtils.createORMMapping(schema, options);
    
    // Get properties and methods already provided by traits
    const traitProperties = this.getTraitProperties(selectedTraits, options);
    const traitMethods = this.getTraitMethods(selectedTraits, options);
    
    // Generate properties based on the ORM mapping, excluding those provided by traits
    for (const field of ormMapping.fields) {
      // Skip if this property is already provided by a trait
      if (traitProperties.has(field.name)) {
        continue;
      }
      
      const visibility = options.publicProperties ? 'public' : 'private';
      const nullable = field.nullable ? '?' : '';
      const defaultValue = field.nullable ? ' = null' : '';
      
      php += `

    ${visibility} ${nullable}${field.phpType} $${field.name}${defaultValue};`;
    }

    // Add relationship properties
    for (const relationship of options.relationships) {
      const visibility = options.publicProperties ? 'public' : 'private';
      
      // Determine if the relationship should be nullable based on the SQL column
      let nullable = '';
      if (relationship.joinColumn) {
        const correspondingColumn = schema.columns.find(col => col.name === relationship.joinColumn);
        if (correspondingColumn && correspondingColumn.nullable) {
          nullable = '?';
        }
      }
      
      // For collection types, they're always nullable
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        nullable = '?';
      }
      
      const collectionType = relationship.type === 'one-to-many' || relationship.type === 'many-to-many' ? 'Collection' : relationship.targetEntity;
      
      php += `

    ${visibility} ${nullable}${collectionType} $${relationship.field};`;
    }


    
    // Add properties from custom traits (if any)
    if (selectedTraits.length > 0) {
      for (const traitName of selectedTraits) {
        const trait = options.customTraits.find(t => t.name === traitName);
        if (trait && trait.properties.length > 0) {
          for (const property of trait.properties) {
            const nullable = property.nullable ? '?' : '';
            const defaultValue = property.nullable && property.defaultValue ? ` = ${property.defaultValue}` : '';
            php += `

    ${property.visibility} ${nullable}${property.type} $${property.name}${defaultValue};`;
          }
        }
      }
    }


    
    // Add methods from custom traits
    if (selectedTraits.length > 0) {
      for (const traitName of selectedTraits) {
        const trait = options.customTraits.find(t => t.name === traitName);
        if (trait && trait.methods.length > 0) {
          for (const method of trait.methods) {
            const params = method.parameters.map(param => {
              const nullable = param.nullable ? '?' : '';
              const defaultValue = param.defaultValue ? ` = ${param.defaultValue}` : '';
              return `${nullable}${param.type} $${param.name}${defaultValue}`;
            }).join(', ');
            
            const returnType = method.returnType === 'self' ? 'self' : method.returnType;
            
            php += `

    ${method.visibility} function ${method.name}(${params}): ${returnType}
    {
        // Method implementation would be in the trait
        // This is just a placeholder for the generated entity
    }`;
          }
        }
      }
    }

    // Generate constructor
    php += this.generateConstructor(schema, options, traitProperties);

    // Generate getScrambleCode method
    const scrambleCodeName = schema.name.toUpperCase();
    php += `

    public function getScrambleCode(): ScrambleCodeEnum
    {
        return ScrambleCodeEnum::${scrambleCodeName};
    }`;

    // Generate getters and setters based on the ORM mapping, excluding those provided by traits
    if (options.generateGetters || options.generateSetters) {
      for (const field of ormMapping.fields) {
        // Skip if this property is already provided by a trait
        if (traitProperties.has(field.name)) {
          continue;
        }
        
        // Find the corresponding column for additional metadata
        const column = schema.columns.find(col => ORMMappingUtils.getFieldName(col.name, options) === field.name);
        if (!column) continue;
        
        // Generate getter/setter for this field, excluding methods already provided by traits
        const getterName = this.getGetterName(column);
        const setterName = `set${ORMMappingUtils.toPascalCase(field.name)}`;
        
        // Skip if getter or setter is already provided by a trait
        if ((options.generateGetters && traitMethods.has(getterName)) || 
            (options.generateSetters && traitMethods.has(setterName))) {
          continue;
        }
        
        php += this.generateGetterSetter(column, schema, options);
      }
    }

    // Generate getters and setters for relationships, excluding those provided by traits
    for (const relationship of options.relationships) {
      if (options.generateGetters || options.generateSetters) {
        const getterName = `get${ORMMappingUtils.toPascalCase(relationship.field)}`;
        const setterName = `set${ORMMappingUtils.toPascalCase(relationship.field)}`;
        
        // Skip if getter or setter is already provided by a trait
        if ((options.generateGetters && traitMethods.has(getterName)) || 
            (options.generateSetters && traitMethods.has(setterName))) {
          continue;
        }
        
        php += this.generateRelationshipGetterSetter(relationship, options, schema);
      }
    }



    php += `
}`;

    return php;
  }

  private static generateConstructor(schema: TableSchema, options: GenerationOptions, traitProperties?: Set<string>): string {
    const constructorColumns = this.getConstructorColumns(schema, options, traitProperties);
    
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
    const fieldName = ORMMappingUtils.getFieldName(column.name, options);
    
    // Skip system columns
    if (column.name === 'id' || column.autoIncrement) {
      return null;
    }

    // Skip _id columns that are configured as relationships
    if (column.name.endsWith('_id') && ORMMappingUtils.isConfiguredAsRelationship(column.name, options)) {
      return null;
    }
    const phpType = ORMMappingUtils.mapToPHPType(column, options);
    const visibility = options.publicProperties ? 'public' : 'private';
    
    // Use constructor property promotion for required properties
    return `${visibility} ${phpType} $${fieldName}`;
  }

  private static getTraitProperties(selectedTraits: string[], options: GenerationOptions): Set<string> {
    const traitProperties = new Set<string>();
    
    for (const traitName of selectedTraits) {
      const trait = options.customTraits.find(t => t.name === traitName);
      if (trait && trait.properties.length > 0) {
        for (const property of trait.properties) {
          traitProperties.add(property.name);
        }
      }
    }
    
    return traitProperties;
  }

  private static getTraitMethods(selectedTraits: string[], options: GenerationOptions): Set<string> {
    const traitMethods = new Set<string>();
    
    for (const traitName of selectedTraits) {
      const trait = options.customTraits.find(t => t.name === traitName);
      if (trait && trait.methods.length > 0) {
        for (const method of trait.methods) {
          traitMethods.add(method.name);
        }
      }
    }
    
    return traitMethods;
  }

  private static generateGetterSetter(
    column: TableColumn, 
    schema: TableSchema, 
    options: GenerationOptions
  ): string {
    const fieldName = ORMMappingUtils.getFieldName(column.name, options);
    
    // Skip system columns
    if (column.name === 'id' || column.autoIncrement) {
      return '';
    }
    
    const getterName = this.getGetterName(column);
    const phpType = ORMMappingUtils.mapToPHPType(column, options);
    const pascalFieldName = ORMMappingUtils.toPascalCase(fieldName);

    let methods = '';

    if (options.generateGetters) {
      methods += `

    public function ${getterName}(): ${phpType}
    {
        return $this->${fieldName};
    }`;
    }

    if (options.generateSetters) {
      const returnType = options.generateFluentSetters ? 'self' : 'void';
      const returnStatement = options.generateFluentSetters ? '\n\n        return $this;' : '';
      
      methods += `

    public function set${pascalFieldName}(${phpType} $${fieldName}): ${returnType}
    {
        $this->${fieldName} = $${fieldName};${returnStatement}
    }`;
    }

    return methods;
  }







  private static generateRelationshipGetterSetter(relationship: Relationship, options: GenerationOptions, schema: TableSchema): string {
    const fieldName = relationship.field;
    const pascalFieldName = ORMMappingUtils.toPascalCase(fieldName);
    const targetEntity = relationship.targetEntity;
    const isCollection = relationship.type === 'one-to-many' || relationship.type === 'many-to-many';
    const collectionType = isCollection ? 'Collection' : targetEntity;

    let methods = '';

    if (options.generateGetters) {
      methods += `

    public function get${pascalFieldName}(): ${isCollection ? 'Collection' : targetEntity}
    {
        return $this->${fieldName};
    }`;
    }

    if (options.generateSetters) {
      const returnType = options.generateFluentSetters ? 'self' : 'void';
      const returnStatement = options.generateFluentSetters ? '\n\n        return $this;' : '';
      
      methods += `

    public function set${pascalFieldName}(${isCollection ? 'Collection' : targetEntity} $${fieldName}): ${returnType}
    {
        $this->${fieldName} = $${fieldName};${returnStatement}
    }`;
    }

    return methods;
  }

  private static getConstructorColumns(schema: TableSchema, options: GenerationOptions, traitProperties?: Set<string>): TableColumn[] {
    return schema.columns.filter(column => {
      // Skip ID and auto-increment columns
      if (column.name === 'id' || column.autoIncrement) {
        return false;
      }
      
      // Skip _id columns that are configured as relationships
      if (column.name.endsWith('_id') && ORMMappingUtils.isConfiguredAsRelationship(column.name, options)) {
        return false;
      }
      
      // Skip properties that are already provided by traits
      if (traitProperties) {
        const fieldName = ORMMappingUtils.getFieldName(column.name, options);
        if (traitProperties.has(fieldName)) {
          return false;
        }
      }
      
      // Include only required (non-nullable) columns
      return !column.nullable;
    });
  }









  private static getGetterName(column: TableColumn): string {
    const fieldName = ORMMappingUtils.toCamelCase(column.name);
    
    // Use 'is' prefix for boolean fields
    if (column.type.toLowerCase() === 'tinyint' && column.length === 1) {
      return `is${ORMMappingUtils.toPascalCase(fieldName)}`;
    }
    
    return `get${ORMMappingUtils.toPascalCase(fieldName)}`;
  }





  private static getEntityName(tableName: string, options: GenerationOptions): string {
    // Convert table name to PascalCase entity name
    const baseName = ORMMappingUtils.toPascalCase(tableName);
    return `${options.entityPrefix}${baseName}${options.entitySuffix}`;
  }










} 