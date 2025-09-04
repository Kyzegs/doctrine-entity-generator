export interface TableColumn {
  name: string;
  type: string;
  length?: number;
  nullable: boolean;
  autoIncrement: boolean;
  default?: string;
  collation?: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
  primary: boolean;
}

export interface TableConstraint {
  name: string;
  type: 'FOREIGN KEY' | 'PRIMARY KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  indexes: TableIndex[];
  constraints: TableConstraint[];
  engine?: string;
  charset?: string;
  collation?: string;
  autoIncrement?: number;
}

export interface GenerationOptions {
  namespace: string;
  generateFluentSetters: boolean;
  generateInterfaces: boolean;
  generateTraits: boolean;
  entityPrefix: string;
  entitySuffix: string;
  databaseDialect: 'mysql' | 'postgresql' | 'sqlite' | 'mariadb';
}
