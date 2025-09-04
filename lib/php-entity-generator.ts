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

    // Add selected traits in the same order as they appear in the UI
    const selectedTraitsInOrder = (options.customTraits || [])
      .filter(trait => selectedTraits.includes(trait.name))
      .map(trait => trait.name);
    
    for (const traitName of selectedTraitsInOrder) {
      php += `
    use ${traitName};`;
    }

    // Create ORM mapping for property generation
    const ormMapping = ORMMappingUtils.createORMMapping(schema, options);
    
    // Get properties and methods already provided by traits
    const traitProperties = this.getTraitProperties(selectedTraits, options);
    const traitMethods = this.getTraitMethods(selectedTraits, options);
    
    // Generate ID field property first (if it exists and not provided by traits)
    const idColumn = schema.columns.find(col => col.name === 'id' || col.autoIncrement);
    if (idColumn && !traitProperties.has('id')) {
      const visibility = options.publicProperties ? 'public' : 'private';
      const nullable = idColumn.nullable ? '?' : '';
      const defaultValue = idColumn.nullable ? ' = null' : '';
      const phpType = ORMMappingUtils.mapToPHPType(idColumn, options);
      
      php += `

    ${visibility} ${nullable}${phpType} $id${defaultValue};`;
    }
    
    // Generate properties based on the ORM mapping, excluding those provided by traits
    // Only generate optional (nullable) properties here - required properties will be in constructor
    for (const field of ormMapping.fields) {
      // Skip if this property is already provided by a trait
      if (traitProperties.has(field.name)) {
        continue;
      }
      
      // Skip required (non-nullable) properties - they'll be in constructor
      if (!field.nullable) {
        continue;
      }
      
      const visibility = options.publicProperties ? 'public' : 'private';
      const nullable = field.nullable ? '?' : '';
      const defaultValue = field.nullable ? ' = null' : '';
      
      // Regular field
      php += `

    ${visibility} ${nullable}${field.phpType} $${field.name}${defaultValue};`;
    }
    
    // Generate relationship properties in the same order as they appear in the CREATE TABLE
    for (const relationship of ormMapping.relationships) {
      // Skip if this relationship is already provided by a trait
      if (traitProperties.has(relationship.field)) {
        continue;
      }
      
      const visibility = options.publicProperties ? 'public' : 'private';
      let nullable = '';
      let isNullable = false;
      
      // Determine if the relationship should be nullable based on the SQL column
      if (relationship.joinColumn) {
        const correspondingColumn = schema.columns.find(col => col.name === relationship.joinColumn);
        if (correspondingColumn && correspondingColumn.nullable) {
          nullable = '?';
          isNullable = true;
        }
      }
      
      // For collection types, they're always nullable
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        nullable = '?';
        isNullable = true;
      }
      
      // Skip required relationships - they'll be in constructor
      if (!isNullable) {
        continue;
      }
      
      const collectionType = relationship.type === 'one-to-many' || relationship.type === 'many-to-many' ? 'Collection' : relationship.targetEntity;
      
      php += `

    ${visibility} ${nullable}${collectionType} $${relationship.field};`;
    }

    // Relationship properties are now handled in the main field loop above
    // This ensures they appear in the same order as the CREATE TABLE statement


    
    // Trait properties and methods are already provided by the trait itself
    // No need to duplicate them in the generated entity

    // Generate constructor
    php += this.generateConstructor(schema, options, traitProperties);

    // Generate getScrambleCode method
    const scrambleCodeName = schema.name.toUpperCase();
    php += `

    public function getScrambleCode(): ScrambleCodeEnum
    {
        return ScrambleCodeEnum::${scrambleCodeName};
    }`;

    // Generate ID field getters and setters first (if enabled and not provided by traits)
    if (options.generateGetters || options.generateSetters) {
      const idColumn = schema.columns.find(col => col.name === 'id' || col.autoIncrement);
      if (idColumn && !traitProperties.has('id')) {
        const getterName = this.getGetterName(idColumn);
        const setterName = 'setId';
        
        // Skip if getter or setter is already provided by a trait
        if ((options.generateGetters && traitMethods.has(getterName)) || 
            (options.generateSetters && traitMethods.has(setterName))) {
          // Skip
        } else {
          php += this.generateGetterSetter(idColumn, schema, options);
        }
      }
    }
    
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
        
        // Regular field
        php += this.generateGetterSetter(column, schema, options);
      }
        }
    
    // Generate relationship getters and setters in the same order as they appear in the CREATE TABLE
    for (const relationship of ormMapping.relationships) {
      // Skip if this relationship is already provided by a trait
      if (traitProperties.has(relationship.field)) {
        continue;
      }
      
      // Check for trait method conflicts for relationships
      const getterName = `get${ORMMappingUtils.toPascalCase(relationship.field)}`;
      const setterName = `set${ORMMappingUtils.toPascalCase(relationship.field)}`;
      
      // Skip if getter or setter is already provided by a trait
      if ((options.generateGetters && traitMethods.has(getterName)) || 
          (options.generateSetters && traitMethods.has(setterName))) {
        continue;
      }
      
      // Generate getters and setters for all relationships when enabled
      php += this.generateRelationshipGetterSetter(relationship, options, schema);
    }



    php += `
}`;

    return php;
  }

  private static generateConstructor(schema: TableSchema, options: GenerationOptions, traitProperties?: Set<string>): string {
    const constructorData = this.getConstructorColumns(schema, options, traitProperties);
    
    if (constructorData.columns.length === 0 && constructorData.relationships.length === 0) {
      return `

    public function __construct()
    {
    }`;
    }

    let constructor = `

    public function __construct(`;

    const params: string[] = [];
    
    // Add required column parameters
    for (const column of constructorData.columns) {
      const param = this.generateConstructorParameter(column, schema, options);
      if (param) {
        params.push(param);
      }
    }
    
    // Add required relationship parameters
    for (const relationship of constructorData.relationships) {
      const param = this.generateRelationshipConstructorParameter(relationship, options);
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
    
    // Skip _id columns that are configured as relationships
    if (column.name.endsWith('_id') && ORMMappingUtils.isConfiguredAsRelationship(column.name, options)) {
      return null;
    }
    
    const phpType = ORMMappingUtils.mapToPHPType(column, options);
    const visibility = options.publicProperties ? 'public' : 'private';
    
    // Use constructor property promotion for required properties
    return `${visibility} ${phpType} $${fieldName}`;
  }

  private static generateRelationshipConstructorParameter(
    relationship: Relationship, 
    options: GenerationOptions
  ): string | null {
    const fieldName = relationship.field;
    const targetEntity = relationship.targetEntity;
    const isCollection = relationship.type === 'one-to-many' || relationship.type === 'many-to-many';
    const collectionType = isCollection ? 'Collection' : targetEntity;
    const visibility = options.publicProperties ? 'public' : 'private';
    
    // Use constructor property promotion for required relationships
    return `${visibility} ${collectionType} $${fieldName}`;
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
    
    // Get selected traits in the same order as they appear in the UI
    const selectedTraitsInOrder = (options.customTraits || [])
      .filter(trait => selectedTraits.includes(trait.name));
    
    for (const trait of selectedTraitsInOrder) {
      if (trait.methods.length > 0) {
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

  private static getConstructorColumns(schema: TableSchema, options: GenerationOptions, traitProperties?: Set<string>): { columns: TableColumn[], relationships: Relationship[] } {
    // Use the ORM mapping to get fields in the correct order
    const ormMapping = ORMMappingUtils.createORMMapping(schema, options);
    
    const columns: TableColumn[] = [];
    const relationships: Relationship[] = [];
    
    // Check if ID field should be in constructor (if it's required and not provided by traits)
    const idColumn = schema.columns.find(col => col.name === 'id' || col.autoIncrement);
    if (idColumn && !idColumn.nullable && !traitProperties?.has('id')) {
      columns.unshift(idColumn); // Add ID at the beginning
    }
    
    for (const field of ormMapping.fields) {
      // Skip if this field is already provided by a trait
      if (traitProperties && traitProperties.has(field.name)) {
        continue;
      }
      
      // Skip optional (nullable) fields - they go as class properties
      if (field.nullable) {
        continue;
      }
      
      if (field.isRelationship && field.relationship) {
        // This is a required relationship field
        relationships.push(field.relationship);
      } else {
        // This is a required regular field, find the corresponding column
        const column = schema.columns.find(col => ORMMappingUtils.getFieldName(col.name, options) === field.name);
        if (column) {
          columns.push(column);
        }
      }
    }

    return { columns, relationships };
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