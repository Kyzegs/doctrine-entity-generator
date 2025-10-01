import { TableSchema, TableColumn, GenerationOptions, Relationship } from './types';
import { ORMMappingUtils, ORMFieldMapping } from './orm-mapping-utils';
import { PhpFile, PhpNamespace, ClassType, Method, Property, Parameter, PromotedParameter, PsrPrinter, Literal } from 'js-php-generator';


export class PHPEntityGenerator {

  static generate(schema: TableSchema, options: GenerationOptions): string {
    const entityName = this.getEntityName(schema.name, options);
    const className = `${options.entityPrefix}${entityName}${options.entitySuffix}`;
    
    // Create PHP file
    const file = new PhpFile();
    file.setStrictTypes();
    
    // Add namespace if provided
    let namespace_: PhpNamespace;
    if (options.namespace) {
      namespace_ = file.addNamespace(options.namespace);
    } else {
      namespace_ = file.addNamespace('');
    }
    
    // Add common imports
    namespace_.addUse('DateTimeImmutable');
    namespace_.addUse('Doctrine\\Common\\Collections\\Collection');
    namespace_.addUse('Doctrine\\Common\\Collections\\ArrayCollection');
    
    // Add Doctrine ORM attribute imports if using attribute mapping
    if (options.useAttributeMapping) {
      namespace_.addUse('Doctrine\\ORM\\Mapping', 'ORM');
    }
    
    // Add trait imports and collect interfaces
    const selectedTraits = options.selectedTraits || [];
    const traitInterfaces = new Set<string>();
    
    for (const traitName of selectedTraits) {
      const trait = options.customTraits.find(t => t.name === traitName);
      if (trait) {
        namespace_.addUse(`${trait.namespace}\\${trait.name}`);
        trait.requiredInterfaces.forEach(iface => traitInterfaces.add(iface));
      }
    }
    
    // Add relationship imports
    for (const relationship of options.relationships) {
      const targetEntity = relationship.targetEntityNamespace || options.namespace;
      if (targetEntity) {
        namespace_.addUse(`${targetEntity}\\${relationship.targetEntity}`);
      } else {
        namespace_.addUse(relationship.targetEntity);
      }
    }
    
    // Create the class
    const class_ = namespace_.addClass(className);
    
    // Add Doctrine Entity attribute if using attribute mapping
    if (options.useAttributeMapping) {
      class_.addAttribute('ORM\\Entity');
      class_.addAttribute('ORM\\Table', [new Literal(`name: '${schema.name}'`)]);
    }
    
    // Add interfaces from traits
    for (const interfaceName of traitInterfaces) {
      class_.addImplement(interfaceName);
    }
    
    // Add traits
    const selectedTraitsInOrder = (options.customTraits || [])
      .filter(trait => selectedTraits.includes(trait.name))
      .map(trait => trait.name);
    
    for (const traitName of selectedTraitsInOrder) {
      class_.addTrait(traitName);
    }
    
    // Create ORM mapping for field generation
    const ormMapping = ORMMappingUtils.createORMMapping(schema, options);
    
    // Get properties and methods already provided by traits
    const traitProperties = this.getTraitProperties(selectedTraits, options);
    const traitMethods = this.getTraitMethods(selectedTraits, options);
    
    // Generate properties
    this.generateProperties(class_, schema, ormMapping, options, traitProperties);
    
    // Generate constructor
    this.generateConstructorNew(class_, schema, options, traitProperties);
    
    // Generate getters and setters
    if (options.generateGetters || options.generateSetters) {
      this.generateAccessors(class_, schema, ormMapping, options, traitProperties, traitMethods);
    }
    
    // Use PSR-12 compliant printer for better formatting
    const printer = new PsrPrinter();
    
    // Customize printer settings for better entity formatting
    printer.wrapLength = 120; // Allow longer lines for better readability
    printer.linesBetweenMethods = 1; // Single line between methods (PSR-12 standard)
    printer.linesBetweenProperties = 0; // No extra lines between properties
    printer.linesBetweenUseTypes = 1; // Single line between use statements
    
    return printer.printFile(file);
  }

  private static generateProperties(
    class_: ClassType, 
    schema: TableSchema, 
    ormMapping: { fields: ORMFieldMapping[], relationships: Relationship[] },
    options: GenerationOptions,
    traitProperties: Set<string>
  ): void {
    const visibility = options.publicProperties ? 'public' : 'private';
    
    // Generate ID field property only if it's nullable (required properties go in constructor)
    const idColumn = schema.columns.find(col => col.name === 'id' || col.autoIncrement);
    if (idColumn && !traitProperties.has('id') && idColumn.nullable) {
      const phpType = ORMMappingUtils.mapToPHPType(idColumn, options);
      const property = class_.addProperty('id');
      this.setVisibilityOnElement(property, visibility);
      property.setType(idColumn.nullable ? `?${phpType}` : phpType);
      
      // Add Doctrine attributes for ID if using attribute mapping
      if (options.useAttributeMapping) {
        property.addAttribute('ORM\\Id');
        property.addAttribute('ORM\\Column', [new Literal("type: 'integer'")]);
        if (idColumn.autoIncrement) {
          property.addAttribute('ORM\\GeneratedValue');
        }
      }
      
      if (idColumn.nullable) {
        property.setValue(null);
      }
    }
    
    // Generate properties for optional fields
    for (const field of ormMapping.fields) {
      if (traitProperties.has(field.name) || !field.nullable) {
        continue;
      }
      
      const property = class_.addProperty(field.name);
      this.setVisibilityOnElement(property, visibility);
      property.setType(field.nullable ? `?${field.phpType}` : field.phpType);
      
      // Add Doctrine Column attribute if using attribute mapping
      if (options.useAttributeMapping) {
        this.addColumnAttribute(property, field, options);
      }
      
      if (field.nullable) {
        property.setValue(null);
      }
    }
    
    // Generate relationship properties
    for (const relationship of ormMapping.relationships) {
      if (traitProperties.has(relationship.field)) {
        continue;
      }
      
      let isNullable = false;
      
      // Determine if the relationship should be nullable
      if (relationship.joinColumn) {
        const correspondingColumn = schema.columns.find(col => col.name === relationship.joinColumn);
        if (correspondingColumn && correspondingColumn.nullable) {
          isNullable = true;
        }
      }
      
      // For collection types, they're always nullable
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        isNullable = true;
      }
      
      let propertyType: string;
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        propertyType = isNullable ? '?Collection' : 'Collection';
      } else {
        propertyType = isNullable ? `?${relationship.targetEntity}` : relationship.targetEntity;
      }
      
      const property = class_.addProperty(relationship.field);
      this.setVisibilityOnElement(property, visibility);
      property.setType(propertyType);
      
      // Add Doctrine relationship attributes if using attribute mapping
      if (options.useAttributeMapping) {
        this.addRelationshipAttribute(property, relationship, schema, options);
      }
      
      if (isNullable) {
        property.setValue(null);
      }
    }
  }

  private static generateConstructorNew(
    class_: ClassType,
    schema: TableSchema,
    options: GenerationOptions,
    traitProperties: Set<string>
  ): void {
    const constructorData = this.getConstructorColumns(schema, options, traitProperties);
    
    if (constructorData.columns.length === 0 && constructorData.relationships.length === 0) {
      return;
    }
    
    const constructor = class_.addMethod('__construct');
    const visibility = options.publicProperties ? 'public' : 'private';
    const ormMapping = ORMMappingUtils.createORMMapping(schema, options);
    
    // Add required field parameters with property promotion using addPromotedParameter method
    for (const column of constructorData.columns) {
      const fieldName = ORMMappingUtils.getFieldName(column.name, options);
      const phpType = ORMMappingUtils.mapToPHPType(column, options);
      
      // Use addPromotedParameter method and set type and visibility
      const param = constructor.addPromotedParameter(fieldName);
      param.setType(phpType);
      this.setVisibilityOnElement(param, visibility);
      
      // Add Doctrine attributes if using attribute mapping
      if (options.useAttributeMapping) {
        if (column.name === 'id' || column.autoIncrement) {
          // Add ID attributes
          param.addAttribute('ORM\\Id');
          param.addAttribute('ORM\\Column', [new Literal("type: 'integer'")]);
          if (column.autoIncrement) {
            param.addAttribute('ORM\\GeneratedValue');
          }
        } else {
          // Add regular column attributes
          const field = ormMapping.fields.find(f => f.name === fieldName);
          if (field) {
            this.addColumnAttribute(param, field, options);
          }
        }
      }
    }
    
    // Add required relationship parameters with property promotion using addPromotedParameter method
    for (const relationship of constructorData.relationships) {
      let paramType: string;
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        paramType = 'Collection';
      } else {
        paramType = relationship.targetEntity;
      }
      
      // Use addPromotedParameter method and set type and visibility
      const param = constructor.addPromotedParameter(relationship.field);
      param.setType(paramType);
      this.setVisibilityOnElement(param, visibility);
      
      // Add Doctrine relationship attributes if using attribute mapping
      if (options.useAttributeMapping) {
        this.addRelationshipAttribute(param, relationship, schema, options);
      }
    }
  }

  private static generateAccessors(
    class_: ClassType,
    schema: TableSchema,
    ormMapping: { fields: ORMFieldMapping[], relationships: Relationship[] },
    options: GenerationOptions,
    traitProperties: Set<string>,
    traitMethods: Set<string>
  ): void {
    // Generate ID getters and setters
    const idColumn = schema.columns.find(col => col.name === 'id' || col.autoIncrement);
    if (idColumn && !traitProperties.has('id')) {
      const phpType = ORMMappingUtils.mapToPHPType(idColumn, options);
      
      if (options.generateGetters && !traitMethods.has('getId')) {
        const getter = class_.addMethod('getId');
        getter.setVisibility('public');
        getter.setReturnType(phpType);
        getter.setBody('return $this->id;');
      }
      
      if (options.generateSetters && !traitMethods.has('setId')) {
        const returnType = options.generateFluentSetters ? 'self' : 'void';
        const returnStatement = options.generateFluentSetters ? 'return $this;' : '';
        
        const setter = class_.addMethod('setId');
        setter.setVisibility('public');
        setter.setReturnType(returnType);
        
        const param = setter.addParameter('id');
        param.setType(phpType);
        setter.setBody(`$this->id = $id;${returnStatement ? '\n        ' + returnStatement : ''}`);
      }
    }
    
    // Generate field accessors
    for (const field of ormMapping.fields) {
      const shouldGenerateGetter = options.generateGetters && this.shouldGenerateGetter(field, options.selectedTraits || [], options);
      const shouldGenerateSetter = options.generateSetters && this.shouldGenerateSetter(field, options.selectedTraits || [], options);
      
      if (shouldGenerateGetter) {
        const getterName = this.getGetterNameFromField(field.name, { name: field.name } as TableColumn);
        if (!traitMethods.has(getterName)) {
          const getter = class_.addMethod(getterName);
          getter.setVisibility('public');
          getter.setReturnType(field.nullable ? `?${field.phpType}` : field.phpType);
          getter.setBody(`return $this->${field.name};`);
        }
      }
      
      if (shouldGenerateSetter) {
        const setterName = `set${this.toPascalCase(field.name)}`;
        if (!traitMethods.has(setterName)) {
          const returnType = options.generateFluentSetters ? 'self' : 'void';
          const returnStatement = options.generateFluentSetters ? 'return $this;' : '';
          
          const setter = class_.addMethod(setterName);
          setter.setVisibility('public');
          setter.setReturnType(returnType);
          
          const param = setter.addParameter(field.name);
          param.setType(field.nullable ? `?${field.phpType}` : field.phpType);
          setter.setBody(`$this->${field.name} = $${field.name};${returnStatement ? '\n        ' + returnStatement : ''}`);
        }
      }
    }
    
    // Generate relationship accessors
    for (const relationship of ormMapping.relationships) {
      if (traitProperties.has(relationship.field)) {
        continue;
      }
      
      const getterName = this.getGetterNameFromField(relationship.field, { name: relationship.field } as TableColumn);
      const setterName = `set${this.toPascalCase(relationship.field)}`;
      
      // Determine types and nullability
      let isNullable = false;
      if (relationship.joinColumn) {
        const correspondingColumn = schema.columns.find(col => col.name === relationship.joinColumn);
        if (correspondingColumn && correspondingColumn.nullable) {
          isNullable = true;
        }
      }
      
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        isNullable = true;
      }
      
      let returnType: string;
      let paramType: string;
      
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        returnType = isNullable ? '?Collection' : 'Collection';
        paramType = isNullable ? '?Collection' : 'Collection';
      } else {
        returnType = isNullable ? `?${relationship.targetEntity}` : relationship.targetEntity;
        paramType = isNullable ? `?${relationship.targetEntity}` : relationship.targetEntity;
      }
      
      // Generate getter
      if (options.generateGetters && !traitMethods.has(getterName)) {
        const getter = class_.addMethod(getterName);
        getter.setVisibility('public');
        getter.setReturnType(returnType);
        getter.setBody(`return $this->${relationship.field};`);
      }
      
      // Generate setter
      if (options.generateSetters && !traitMethods.has(setterName)) {
        const setterReturnType = options.generateFluentSetters ? 'self' : 'void';
        const returnStatement = options.generateFluentSetters ? 'return $this;' : '';
        
        const setter = class_.addMethod(setterName);
        setter.setVisibility('public');
        setter.setReturnType(setterReturnType);
        
        const param = setter.addParameter(relationship.field);
        param.setType(paramType);
        setter.setBody(`$this->${relationship.field} = $${relationship.field};${returnStatement ? '\n        ' + returnStatement : ''}`);
      }
    }
  }

  /**
   * Sets visibility on a property or parameter using the appropriate method
   */
  private static setVisibilityOnElement(element: any, visibility: string): void {
    if (visibility === 'public') {
      element.setPublic();
    } else if (visibility === 'private') {
      element.setPrivate();
    } else if (visibility === 'protected') {
      element.setProtected();
    }
  }

  // Helper methods from the original implementation
  private static getTraitProperties(selectedTraits: string[], options: GenerationOptions): Set<string> {
    const traitProperties = new Set<string>();
    
    for (const traitName of selectedTraits) {
      const trait = options.customTraits.find(t => t.name === traitName);
      if (trait) {
        trait.properties.forEach(property => {
          traitProperties.add(property.name);
        });
      }
    }
    
    return traitProperties;
  }

  private static getTraitMethods(selectedTraits: string[], options: GenerationOptions): Set<string> {
    const traitMethods = new Set<string>();
    
    for (const traitName of selectedTraits) {
      const trait = options.customTraits.find(t => t.name === traitName);
      if (trait) {
        trait.properties.forEach(property => {
          if (property.hasGetter === true) {
            const getterName = this.getGetterNameFromField(property.name, { name: property.name } as TableColumn);
            traitMethods.add(getterName);
          }
          if (property.hasSetter === true) {
            const setterName = `set${this.toPascalCase(property.name)}`;
            traitMethods.add(setterName);
          }
        });
      }
    }
    
    return traitMethods;
  }

  private static shouldGenerateGetter(field: ORMFieldMapping, selectedTraits: string[], options: GenerationOptions): boolean {
    // Check if any trait provides this getter
    for (const traitName of selectedTraits) {
      const trait = options.customTraits.find(t => t.name === traitName);
      if (trait) {
        const traitProperty = trait.properties.find(p => p.name === field.name);
        if (traitProperty && traitProperty.hasGetter === true) {
          return false; // Trait provides the getter
        }
      }
    }
    return true; // No trait provides it, so we should generate it
  }

  private static shouldGenerateSetter(field: ORMFieldMapping, selectedTraits: string[], options: GenerationOptions): boolean {
    // Check if any trait provides this setter
    for (const traitName of selectedTraits) {
      const trait = options.customTraits.find(t => t.name === traitName);
      if (trait) {
        const traitProperty = trait.properties.find(p => p.name === field.name);
        if (traitProperty && traitProperty.hasSetter === true) {
          return false; // Trait provides the setter
        }
      }
    }
    return true; // No trait provides it, so we should generate it
  }

  private static getConstructorColumns(schema: TableSchema, options: GenerationOptions, traitProperties?: Set<string>): { columns: TableColumn[], relationships: Relationship[] } {
    const ormMapping = ORMMappingUtils.createORMMapping(schema, options);
    
    const columns: TableColumn[] = [];
    const relationships: Relationship[] = [];
    
    // Check if ID field should be in constructor (if it's required and not provided by traits)
    const idColumn = schema.columns.find(col => col.name === 'id' || col.autoIncrement);
    if (idColumn && !idColumn.nullable && !traitProperties?.has('id')) {
      columns.unshift(idColumn); // Add ID at the beginning
    }
    
    for (const field of ormMapping.fields) {
      if (traitProperties && traitProperties.has(field.name)) {
        continue;
      }
      
      if (field.nullable) {
        continue;
      }
      
      if (field.isRelationship && field.relationship) {
        relationships.push(field.relationship);
      } else {
        const column = schema.columns.find(col => ORMMappingUtils.getFieldName(col.name, options) === field.name);
        if (column && column.name !== 'id') { // ID is already handled above
          columns.push(column);
        }
      }
    }
    
    for (const relationship of ormMapping.relationships) {
      if (traitProperties && traitProperties.has(relationship.field)) {
        continue;
      }
      
      let isRequired = true;
      if (relationship.joinColumn) {
        const correspondingColumn = schema.columns.find(col => col.name === relationship.joinColumn);
        if (correspondingColumn && correspondingColumn.nullable) {
          isRequired = false;
        }
      }
      
      if (relationship.type === 'one-to-many' || relationship.type === 'many-to-many') {
        isRequired = false;
      }
      
      if (isRequired && !relationships.find(r => r.field === relationship.field)) {
        relationships.push(relationship);
      }
    }
    
    return { columns, relationships };
  }

  private static getGetterNameFromField(fieldName: string, column: TableColumn): string {
    const pascalCaseName = this.toPascalCase(fieldName);
    
    if (fieldName.toLowerCase() === 'id') {
      return 'getId';
    }
    
    return `get${pascalCaseName}`;
  }

  private static getGetterName(column: TableColumn): string {
    return this.getGetterNameFromField(column.name, column);
  }

  private static toPascalCase(str: string): string {
    return str.replace(/(?:^|_)(.)/g, (_, char) => char.toUpperCase());
  }

  private static getEntityName(tableName: string, options: GenerationOptions): string {
    // Use custom entity name if provided, otherwise convert table name to PascalCase
    if (options.entityName && options.entityName.trim()) {
      return options.entityName.trim();
    }
    
    // Convert table name to PascalCase entity name
    return ORMMappingUtils.toPascalCase(tableName);
  }

  /**
   * Converts an object to named parameters syntax for PHP attributes
   */
  private static createNamedParams(params: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      let valueStr: string;
      if (typeof value === 'string' && !value.endsWith('::class')) {
        valueStr = `'${value}'`;
      } else if (typeof value === 'boolean') {
        valueStr = value ? 'true' : 'false';
      } else if (Array.isArray(value)) {
        valueStr = '[' + value.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ') + ']';
      } else {
        valueStr = String(value);
      }
      parts.push(`${key}: ${valueStr}`);
    }
    return parts.join(', ');
  }

  /**
   * Adds Doctrine Column attribute to a property or parameter
   */
  private static addColumnAttribute(element: any, field: ORMFieldMapping, options: GenerationOptions): void {
    const attributeArgs: any = {};
    
    // Only add type if it's not string (default)
    if (field.doctrineType !== 'string') {
      attributeArgs.type = field.doctrineType;
    }
    
    // Add column name if explicitly defined or if it differs from field name
    const customMapping = options.columnFieldMappings.find(mapping => mapping.field === field.name);
    const shouldIncludeColumn = options.explicitlyDefineColumns || (customMapping && customMapping.column);
    if (shouldIncludeColumn) {
      attributeArgs.name = field.columnName;
    }
    
    // Add length for string/text types if available
    if (field.length && (field.doctrineType === 'string' || field.doctrineType === 'text')) {
      attributeArgs.length = field.length;
    }
    
    // Add nullable if true
    if (field.nullable) {
      attributeArgs.nullable = true;
    }
    
    // Add enum class if specified
    if (field.enumClass) {
      attributeArgs.enumType = field.enumClass;
    }
    
    // Only add the attribute if there are arguments
    if (Object.keys(attributeArgs).length > 0) {
      element.addAttribute('ORM\\Column', [new Literal(this.createNamedParams(attributeArgs))]);
    } else {
      element.addAttribute('ORM\\Column');
    }
  }

  /**
   * Adds Doctrine relationship attribute to a property or parameter
   */
  private static addRelationshipAttribute(element: any, relationship: Relationship, schema: TableSchema, options: GenerationOptions): void {
    const targetEntity = relationship.targetEntityNamespace 
      ? `${relationship.targetEntityNamespace}\\\\${relationship.targetEntity}`
      : `${options.namespace}\\\\${relationship.targetEntity}`;
    
    // Map relationship type to Doctrine attribute name
    const relationshipTypeMap: Record<string, string> = {
      'one-to-one': 'OneToOne',
      'one-to-many': 'OneToMany',
      'many-to-one': 'ManyToOne',
      'many-to-many': 'ManyToMany'
    };
    
    const attributeName = relationshipTypeMap[relationship.type];
    const attributeArgs: any = { targetEntity: `${relationship.targetEntity}::class` };
    
    // Add mappedBy or inversedBy
    if (relationship.mappedBy) {
      attributeArgs.mappedBy = relationship.mappedBy;
    }
    if (relationship.inversedBy) {
      attributeArgs.inversedBy = relationship.inversedBy;
    }
    
    // Add fetch if not LAZY (default)
    if (relationship.fetch && relationship.fetch !== 'LAZY') {
      attributeArgs.fetch = relationship.fetch;
    }
    
    // Add orphanRemoval if true
    if (relationship.orphanRemoval) {
      attributeArgs.orphanRemoval = true;
    }
    
    // Add cascade operations
    if (relationship.cascade && relationship.cascade.length > 0) {
      attributeArgs.cascade = relationship.cascade;
    }
    
    element.addAttribute(`ORM\\${attributeName}`, [new Literal(this.createNamedParams(attributeArgs))]);
    
    // Add JoinColumn for many-to-one and one-to-one relationships
    if (relationship.joinColumn && (relationship.type === 'many-to-one' || relationship.type === 'one-to-one')) {
      const joinColumnArgs: any = { name: relationship.joinColumn };
      
      // Check if the corresponding SQL column is nullable
      const correspondingColumn = schema.columns.find(col => col.name === relationship.joinColumn);
      if (correspondingColumn) {
        joinColumnArgs.nullable = correspondingColumn.nullable;
      }
      
      element.addAttribute('ORM\\JoinColumn', [new Literal(this.createNamedParams(joinColumnArgs))]);
    }
  }
}