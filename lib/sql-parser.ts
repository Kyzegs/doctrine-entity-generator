import { Parser } from 'node-sql-parser';
import { TableSchema, TableColumn, TableIndex, TableConstraint } from './types';
import { DatabaseDialect } from './example-queries';

export class SQLParser {
  private static parser = new Parser();
  /**
   * Parse multiple CREATE TABLE statements from SQL input
   */
  static parseMultipleTables(sql: string, dialect: DatabaseDialect = DatabaseDialect.MYSQL): TableSchema[] {
    try {
      const parserOptions = {
        database: dialect,
      };

      const ast = this.parser.astify(sql, parserOptions);

      if (!ast) {
        throw new Error('Invalid SQL statement');
      }

      // Handle both single statement and multiple statements
      const statements = Array.isArray(ast) ? ast : [ast];

      // Filter only CREATE TABLE statements
      const createTableStatements = statements.filter(
        (stmt) => stmt && stmt.type === 'create' && (stmt as any).keyword === 'table'
      );

      if (createTableStatements.length === 0) {
        throw new Error('No CREATE TABLE statements found');
      }

      // Parse each CREATE TABLE statement
      const tables: TableSchema[] = [];
      for (const createTable of createTableStatements) {
        const tableName = this.extractTableName(createTable);
        const columns = this.extractColumns(createTable);
        const indexes = this.extractIndexes(createTable);
        const constraints = this.extractConstraints(createTable);
        const tableOptions = this.extractTableOptions(createTable);

        tables.push({
          name: tableName,
          columns,
          indexes,
          constraints,
          engine: tableOptions.engine,
          charset: tableOptions.charset,
          collation: tableOptions.collation,
          autoIncrement: tableOptions.autoIncrement,
        });
      }

      return tables;
    } catch (error) {
      console.error('SQL parsing error:', error);

      if (error instanceof Error) {
        throw new Error(`SQL parsing error: ${error.message}`);
      }
      throw new Error('Failed to parse SQL statements');
    }
  }

  static parseCreateTable(sql: string, dialect: DatabaseDialect = DatabaseDialect.MYSQL): TableSchema {
    try {
      console.log('Dialect:', dialect);
      const parserOptions = {
        database: dialect,
      };

      const ast = this.parser.astify(sql, parserOptions);

      if (!ast || typeof ast !== 'object') {
        throw new Error('Invalid SQL statement');
      }

      // Handle both single object and array of objects
      const createTable = Array.isArray(ast) ? ast[0] : ast;

      if (!createTable || createTable.type !== 'create' || (createTable as any).keyword !== 'table') {
        throw new Error('Not a CREATE TABLE statement');
      }

      const tableName = this.extractTableName(createTable);
      const columns = this.extractColumns(createTable);
      const indexes = this.extractIndexes(createTable);
      const constraints = this.extractConstraints(createTable);
      const tableOptions = this.extractTableOptions(createTable);

      return {
        name: tableName,
        columns,
        indexes,
        constraints,
        engine: tableOptions.engine,
        charset: tableOptions.charset,
        collation: tableOptions.collation,
        autoIncrement: tableOptions.autoIncrement,
      };
    } catch (error) {
      console.error('SQL parsing error:', error);

      if (error instanceof Error) {
        throw new Error(`SQL parsing error: ${error.message}`);
      }
      throw new Error('Failed to parse SQL statement');
    }
  }

  /**
   * Extract column name from node-sql-parser format
   * Handles both string and object formats according to node-sql-parser documentation
   */
  static extractColumnName(columnDef: any): string {
    if (typeof columnDef === 'string') {
      return columnDef;
    }

    if (columnDef && typeof columnDef === 'object') {
      // Handle node-sql-parser format: {expr: {type: "column_ref", column: "name"}}
      if (columnDef.expr && columnDef.expr.type === 'column_ref' && columnDef.expr.column) {
        return columnDef.expr.column;
      } else if (columnDef.expr && columnDef.expr.value) {
        // Fallback for other expr structures
        return columnDef.expr.value;
      } else if (columnDef.column) {
        return columnDef.column;
      } else {
        console.warn('Unexpected column name structure:', columnDef);
        return String(columnDef);
      }
    }

    console.warn('Unexpected column name structure:', columnDef);
    return String(columnDef);
  }

  private static extractTableName(createTable: any): string {
    if (createTable.table && createTable.table[0]) {
      const table = createTable.table[0];
      return table.table || table.db + '.' + table.table;
    }
    throw new Error('Could not extract table name');
  }

  private static extractColumns(createTable: any): TableColumn[] {
    const columns: TableColumn[] = [];

    if (!createTable.create_definitions) {
      return columns;
    }

    for (const def of createTable.create_definitions) {
      if (def.resource === 'column') {
        const column = this.parseColumnDefinition(def);
        if (column) {
          columns.push(column);
        }
      }
    }

    return columns;
  }

  private static parseColumnDefinition(def: any): TableColumn | null {
    if (!def.column) {
      return null;
    }

    // Extract column name using the utility function
    const name = this.extractColumnName(def.column.column);
    const typeInfo = this.parseDataType(def.definition); // Data type info is in def.definition

    // Parse column attributes
    const nullable = !this.hasAttribute(def, 'not null');
    const autoIncrement = this.hasAttribute(def, 'auto_increment');
    // Check for unsigned in typeInfo first, then fall back to hasAttribute
    const unsigned = typeInfo.unsigned || this.hasAttribute(def, 'unsigned');
    const defaultValue = this.extractDefaultValue(def);
    const collation = this.extractCollation(def);

    return {
      name,
      type: typeInfo.type,
      length: typeInfo.length,
      nullable,
      autoIncrement,
      unsigned,
      default: defaultValue,
      collation,
    };
  }

  private static parseDataType(dataType: any): {
    type: string;
    length?: number;
    unsigned?: boolean;
  } {
    if (!dataType || !dataType.dataType) {
      return { type: 'unknown', length: undefined, unsigned: undefined };
    }

    const type = dataType.dataType.toLowerCase();

    // Extract length if present
    let length: number | undefined;
    if (dataType.length) {
      length = parseInt(dataType.length);
    }

    // Check for unsigned in suffix array
    const unsigned = Array.isArray(dataType.suffix) && dataType.suffix.includes('UNSIGNED');

    return { type, length, unsigned };
  }

  private static hasAttribute(def: any, attribute: string): boolean {
    if (attribute === 'not null') {
      return def.nullable && def.nullable.type === 'not null';
    }

    if (attribute === 'auto_increment') {
      return def.auto_increment === 'auto_increment';
    }

    if (attribute === 'unsigned') {
      // Check if unsigned is in the definition.suffix array
      if (def.definition && Array.isArray(def.definition.suffix)) {
        return def.definition.suffix.includes('UNSIGNED');
      }
    }

    return false;
  }

  private static extractDefaultValue(def: any): string | undefined {
    if (def.default_val && def.default_val.value) {
      if (def.default_val.value.type === 'null') {
        return 'NULL';
      }
      return def.default_val.value.value;
    }
    return undefined;
  }

  private static extractCollation(def: any): string | undefined {
    if (def.collate && def.collate.collate) {
      return def.collate.collate.name;
    }
    return undefined;
  }

  private static extractIndexes(createTable: any): TableIndex[] {
    const indexes: TableIndex[] = [];

    if (!createTable.create_definitions) {
      return indexes;
    }

    for (const def of createTable.create_definitions) {
      if (def.resource === 'index') {
        const index = this.parseIndexDefinition(def);
        if (index) {
          indexes.push(index);
        }
      }
    }

    return indexes;
  }

  private static parseIndexDefinition(def: any): TableIndex | null {
    if (!def.index) {
      return null;
    }

    const name = def.index;
    const columns = def.definition.map((col: any) => col.column);
    const unique = false; // Default to false, can be enhanced later
    const primary = def.constraint_type === 'primary key';

    return {
      name,
      columns,
      unique,
      primary,
    };
  }

  private static extractConstraints(createTable: any): TableConstraint[] {
    const constraints: TableConstraint[] = [];

    if (!createTable.create_definitions) {
      return constraints;
    }

    for (const def of createTable.create_definitions) {
      if (def.resource === 'constraint') {
        const constraint = this.parseConstraintDefinition(def);
        if (constraint) {
          constraints.push(constraint);
        }
      }
    }

    return constraints;
  }

  private static parseConstraintDefinition(def: any): TableConstraint | null {
    if (!def.constraint) {
      return null;
    }

    const name = def.constraint;
    const type = def.constraint_type.toUpperCase();

    if (type === 'FOREIGN KEY') {
      const columns = def.definition.map((col: any) => col.column);
      const referencedTable = def.reference_definition.table[0].table;
      const referencedColumns = def.reference_definition.definition.map((col: any) => col.column);

      return {
        name,
        type: 'FOREIGN KEY',
        columns,
        referencedTable,
        referencedColumns,
      };
    } else if (type === 'PRIMARY KEY') {
      const columns = def.definition.map((col: any) => col.column);
      return {
        name: name || 'PRIMARY',
        type: 'PRIMARY KEY',
        columns,
      };
    } else if (type === 'UNIQUE') {
      const columns = def.definition.map((col: any) => col.column);
      return {
        name,
        type: 'UNIQUE',
        columns,
      };
    }

    return null;
  }

  private static extractTableOptions(createTable: any): {
    engine?: string;
    charset?: string;
    collation?: string;
    autoIncrement?: number;
  } {
    const options: any = {};

    if (createTable.table_options) {
      for (const opt of createTable.table_options) {
        switch (opt.keyword) {
          case 'engine':
            options.engine = opt.value;
            break;
          case 'default charset':
            options.charset = opt.value.value;
            break;
          case 'collate':
            options.collation = opt.value.value;
            break;
          case 'auto_increment':
            options.autoIncrement = parseInt(opt.value);
            break;
        }
      }
    }

    return options;
  }
}
