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

export interface CustomDataType {
  name: string;
  phpType: string;
}

export interface ColumnFieldMapping {
  field: string;
  column?: string; // Optional - if not specified, only the field and type are used
  selectedType: string; // Can be a Doctrine type or custom type name
  enumClass?: string; // Optional - enum class name (e.g., 'StatusEnum')
}

export interface Relationship {
  field: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  targetEntity: string;
  mappedBy?: string; // For one-to-many and many-to-many (inverse side)
  inversedBy?: string; // For one-to-many and many-to-many (owning side)
  joinColumn?: string; // For many-to-one and one-to-one
  cascade?: ('persist' | 'remove' | 'merge' | 'detach' | 'refresh')[];
  fetch?: 'LAZY' | 'EAGER' | 'EXTRA_LAZY';
  orphanRemoval?: boolean;
  targetEntityNamespace?: string; // Optional, defaults to main namespace
}

export interface CustomTrait {
  id: string;
  name: string;
  displayName: string;
  description: string;
  namespace: string;
  properties: TraitProperty[];
  methods: TraitMethod[];
  requiredInterfaces: string[];
}

export interface TraitProperty {
  name: string;
  type: string;
  visibility: 'public' | 'protected' | 'private';
  nullable: boolean;
  defaultValue?: string;
  description: string;
}

export interface TraitMethod {
  name: string;
  returnType: string;
  parameters: TraitParameter[];
  visibility: 'public' | 'protected' | 'private';
  description: string;
}

export interface TraitParameter {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface GenerationOptions {
  namespace: string;
  entityPrefix: string;
  entitySuffix: string;
  databaseDialect: 'mysql' | 'postgresql' | 'sqlite' | 'mariadb';
  
  // ORM mapping settings
  customDataTypes: CustomDataType[];
  columnFieldMappings: ColumnFieldMapping[];
  explicitlyDefineColumns: boolean;
  
  // PHP Entity Class settings
  publicProperties: boolean;
  generateGetters: boolean;
  generateSetters: boolean;
  generateFluentSetters: boolean;
  
  // Relationship settings
  relationships: Relationship[];
  
  // Trait settings
  customTraits: CustomTrait[];
  selectedTraits: string[];
}
