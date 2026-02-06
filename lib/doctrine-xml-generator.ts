import { TableSchema, GenerationOptions } from './types';
import { ORMMappingUtils } from './orm-mapping-utils';
import { toPascalCase, singularize, pluralize } from './utils';
import { DatabaseDialect } from './example-queries';
import { create } from 'xmlbuilder2';

export class DoctrineXMLGenerator {
  static generate(schema: TableSchema, options: GenerationOptions): string {
    const entityName = this.getEntityName(schema.name, options);
    const entityClass = options.namespace ? `${options.namespace}\\${entityName}` : entityName;

    // Create ORM mapping for field generation
    const ormMapping = ORMMappingUtils.createORMMapping(schema, options);

    // Create XML document
    const doc = create({ version: '1.0', encoding: 'UTF-8' });

    // Define namespaces
    const doctrineNs = 'http://doctrine-project.org/schemas/orm/doctrine-mapping';
    const xsiNs = 'http://www.w3.org/2001/XMLSchema-instance';

    // Create root element with namespaces
    const root = doc
      .ele(doctrineNs, 'doctrine-mapping')
      .att(
        xsiNs,
        'xsi:schemaLocation',
        'http://doctrine-project.org/schemas/orm/doctrine-mapping\n                        http://doctrine-project.org/schemas/orm/doctrine-mapping.xsd'
      );

    // Create entity element
    const entity = root.ele(doctrineNs, 'entity').att('name', entityClass).att('table', schema.name);

    // Generate ID field
    const idColumn = schema.columns.find((col) => col.name === 'id' || col.autoIncrement);
    if (idColumn) {
      const idElement = entity.ele(doctrineNs, 'id').att('name', 'id').att('type', 'integer').att('length', '10');

      // Add options if needed
      const hasUnsigned = !!(idColumn.unsigned && options.databaseDialect === DatabaseDialect.MYSQL);
      this.addOptionsElement(idElement, hasUnsigned, idColumn.default, doctrineNs);

      idElement.ele(doctrineNs, 'generator');
    }

    // Generate all fields based on the ORM mapping
    for (const field of ormMapping.fields) {
      this.generateFieldXMLFromMapping(entity, field, options, doctrineNs);
    }

    // Generate relationships
    for (const relationship of ormMapping.relationships) {
      const targetEntity = relationship.targetEntityNamespace
        ? `${relationship.targetEntityNamespace}\\${relationship.targetEntity}`
        : `${options.namespace}\\${relationship.targetEntity}`;

      const relationshipElement = entity
        .ele(doctrineNs, relationship.type)
        .att('field', relationship.field)
        .att('target-entity', targetEntity);

      if (relationship.fetch && relationship.fetch !== 'LAZY') {
        relationshipElement.att('fetch', relationship.fetch);
      }

      if (relationship.mappedBy) {
        relationshipElement.att('mapped-by', relationship.mappedBy);
      }

      if (relationship.inversedBy) {
        relationshipElement.att('inversed-by', relationship.inversedBy);
      }

      if (relationship.orphanRemoval) {
        relationshipElement.att('orphan-removal', 'true');
      }

      // Add join-column for many-to-one and one-to-one relationships
      if (relationship.joinColumn && (relationship.type === 'many-to-one' || relationship.type === 'one-to-one')) {
        const correspondingColumn = schema.columns.find((col) => col.name === relationship.joinColumn);
        const isNullable = correspondingColumn && correspondingColumn.nullable;

        relationshipElement
          .ele(doctrineNs, 'join-column')
          .att('name', relationship.joinColumn)
          .att('nullable', isNullable ? 'true' : 'false');
      }

      // Add cascade operations
      if (relationship.cascade && relationship.cascade.length > 0) {
        const cascadeElement = relationshipElement.ele(doctrineNs, 'cascade');
        for (const cascadeType of relationship.cascade) {
          cascadeElement.ele(doctrineNs, `cascade-${cascadeType}`);
        }
      }
    }

    // Generate indexes
    const nonPrimaryIndexes = schema.indexes.filter((idx) => !idx.primary);
    if (nonPrimaryIndexes.length > 0) {
      const indexesElement = entity.ele(doctrineNs, 'indexes');
      for (const index of nonPrimaryIndexes) {
        indexesElement.ele(doctrineNs, 'index').att('name', index.name).att('columns', index.columns.join(','));
      }
    }

    // Serialize with pretty printing
    // Use custom formatting to match Doctrine XML style
    return doc.end({
      format: 'xml',
      prettyPrint: true,
      indent: '    ',
      newline: '\n',
    } as any);
  }

  private static generateFieldXMLFromMapping(
    parent: any,
    field: any,
    options: GenerationOptions,
    doctrineNs: string
  ): void {
    const fieldElement = parent.ele(doctrineNs, 'field').att('name', field.name);

    // Only include column attribute if explicitly requested or if there's a custom mapping with a column specified
    const customMapping = options.columnFieldMappings.find((mapping) => mapping.field === field.name);
    const shouldIncludeColumn = options.explicitlyDefineColumns || (customMapping && customMapping.column);

    if (shouldIncludeColumn) {
      const columnName = customMapping?.column || field.columnName;
      fieldElement.att('column', columnName);
    }

    if (field.doctrineType !== 'string') {
      fieldElement.att('type', field.doctrineType);
    }

    if (field.length) {
      fieldElement.att('length', String(field.length));
    }

    if (field.nullable) {
      fieldElement.att('nullable', 'true');
    }

    // Add enum class if specified
    if (field.enumClass) {
      fieldElement.att('enum-type', field.enumClass);
    }

    // Check if we need to add options (unsigned or default)
    const integerTypes = ['integer', 'smallint', 'bigint'];
    const hasUnsignedForField = !!(
      field.unsigned &&
      options.databaseDialect === DatabaseDialect.MYSQL &&
      integerTypes.includes(field.doctrineType)
    );
    this.addOptionsElement(fieldElement, hasUnsignedForField, field.default, doctrineNs);
  }

  /**
   * Adds options element to a field or ID element if unsigned or default values are needed
   * @param parentElement The parent XML element (field or id)
   * @param hasUnsigned Whether the unsigned option should be added (already validated for MySQL and type)
   * @param defaultValue The default value from the column
   * @param doctrineNs Doctrine namespace URI
   */
  private static addOptionsElement(
    parentElement: any,
    hasUnsigned: boolean,
    defaultValue: string | undefined,
    doctrineNs: string
  ): void {
    const hasDefault = defaultValue && defaultValue !== 'NULL';
    const needsOptions = hasUnsigned || hasDefault;

    if (needsOptions) {
      const optionsElement = parentElement.ele(doctrineNs, 'options');

      // Add default value if present
      if (hasDefault) {
        optionsElement.ele(doctrineNs, 'option').att('name', 'default').txt(defaultValue);
      }

      // Add unsigned option for MySQL if applicable
      if (hasUnsigned) {
        optionsElement.ele(doctrineNs, 'option').att('name', 'unsigned').txt('true');
      }
    }
  }

  private static getEntityName(tableName: string, options: GenerationOptions): string {
    // Use custom entity name if provided, otherwise convert table name to PascalCase
    if (options.entityName && options.entityName.trim()) {
      return `${options.entityPrefix}${options.entityName.trim()}${options.entitySuffix}`;
    }

    let baseName = tableName;

    // Apply naming convention
    if (options.classNamingConvention === 'singular') {
      baseName = singularize(tableName);
    } else if (options.classNamingConvention === 'plural') {
      baseName = pluralize(tableName);
    }
    // 'inherit' uses the table name as-is

    // Convert table name to PascalCase entity name
    return `${options.entityPrefix}${toPascalCase(baseName)}${options.entitySuffix}`;
  }
}
