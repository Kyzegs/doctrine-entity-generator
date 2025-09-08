'use client';

import { useState, useEffect } from 'react';
import { SQLParser } from '@/lib/sql-parser';
import { DoctrineXMLGenerator } from '@/lib/doctrine-xml-generator';
import { PHPEntityGenerator } from '@/lib/php-entity-generator';
import { GenerationOptions, ShareableConfiguration } from '@/lib/types';
import { CodeOutput } from '@/components/code-output';
import { OptionsForm } from '@/components/options-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, Upload, Clipboard, FileText } from 'lucide-react';

const EXAMPLE_SQL = {
  mysql: `CREATE TABLE \`boarding\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`company_id\` int(11) DEFAULT NULL,
  \`supplier_id\` int(11) DEFAULT NULL,
  \`status_id\` int(11) DEFAULT NULL,
  \`pin\` varchar(2) COLLATE utf8_unicode_ci NOT NULL,
  \`unique_key\` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  \`unique_data\` text COLLATE utf8_unicode_ci NOT NULL,
  \`created\` int(11) NOT NULL,
  \`created_by\` int(11) NOT NULL,
  \`send_data\` text COLLATE utf8_unicode_ci NOT NULL,
  \`send_data_valid\` tinyint(1) NOT NULL,
  \`sent\` int(11) DEFAULT NULL,
  \`sent_by\` int(11) DEFAULT NULL,
  \`receive_data\` text COLLATE utf8_unicode_ci NOT NULL,
  \`receive_data_valid\` tinyint(1) NOT NULL,
  \`received\` int(11) DEFAULT NULL,
  \`received_by\` int(11) DEFAULT NULL,
  \`deleted\` int(11) DEFAULT NULL,
  \`deleted_by\` int(11) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`IDX_114209DA2ADD6D8C\` (\`supplier_id\`),
  KEY \`IDX_114209DA6BF700BD\` (\`status_id\`),
  KEY \`b_idx_company_id\` (\`company_id\`),
  KEY \`b_idx_status_deleted\` (\`status_id\`,\`deleted\`),
  CONSTRAINT \`FK_114209DA2ADD6D8C\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`),
  CONSTRAINT \`FK_114209DA6BF700BD\` FOREIGN KEY (\`status_id\`) REFERENCES \`status\` (\`id\`),
  CONSTRAINT \`FK_114209DA979B1AD6\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=182192 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci`,

  postgresql: `CREATE TABLE boarding (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  status_id INTEGER REFERENCES status(id),
  pin VARCHAR(2) NOT NULL,
  unique_key VARCHAR(40) NOT NULL,
  unique_data TEXT NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,
  send_data TEXT NOT NULL,
  send_data_valid BOOLEAN NOT NULL DEFAULT false,
  sent TIMESTAMP,
  sent_by INTEGER,
  receive_data TEXT NOT NULL,
  receive_data_valid BOOLEAN NOT NULL DEFAULT false,
  received TIMESTAMP,
  received_by INTEGER,
  deleted TIMESTAMP,
  deleted_by INTEGER
)`,

  sqlite: `CREATE TABLE boarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  supplier_id INTEGER,
  status_id INTEGER,
  pin TEXT NOT NULL,
  unique_key TEXT NOT NULL,
  unique_data TEXT NOT NULL,
  created INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  send_data TEXT NOT NULL,
  send_data_valid INTEGER NOT NULL,
  sent INTEGER,
  sent_by INTEGER,
  receive_data TEXT NOT NULL,
  receive_data_valid INTEGER NOT NULL,
  received INTEGER,
  received_by INTEGER,
  deleted INTEGER,
  deleted_by INTEGER,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (status_id) REFERENCES status(id)
)`,

  mariadb: `CREATE TABLE \`boarding\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`company_id\` int(11) DEFAULT NULL,
  \`supplier_id\` int(11) DEFAULT NULL,
  \`status_id\` int(11) DEFAULT NULL,
  \`pin\` varchar(2) COLLATE utf8_unicode_ci NOT NULL,
  \`unique_key\` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  \`unique_data\` text COLLATE utf8_unicode_ci NOT NULL,
  \`created\` int(11) NOT NULL,
  \`created_by\` int(11) NOT NULL,
  \`send_data\` text COLLATE utf8_unicode_ci NOT NULL,
  \`send_data_valid\` tinyint(1) NOT NULL,
  \`sent\` int(11) DEFAULT NULL,
  \`sent_by\` int(11) DEFAULT NULL,
  \`receive_data\` text COLLATE utf8_unicode_ci NOT NULL,
  \`receive_data_valid\` tinyint(1) NOT NULL,
  \`received\` int(11) DEFAULT NULL,
  \`received_by\` int(11) DEFAULT NULL,
  \`deleted\` int(11) DEFAULT NULL,
  \`deleted_by\` int(11) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`b_idx_company_id\` (\`company_id\`),
  CONSTRAINT \`FK_boarding_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci`
};

const DEFAULT_SQL = EXAMPLE_SQL.mysql;

const DEFAULT_OPTIONS: GenerationOptions = {
  namespace: '',
  entityPrefix: '',
  entitySuffix: '',
  entityName: '', // Manual override for entity name (not shareable)
  databaseDialect: 'mysql',
  
  // ORM mapping settings
  customDataTypes: [
    { name: 'timestamp', phpType: '\\DateTimeImmutable' },
    { name: 'money', phpType: 'Money' },
    { name: 'uuid', phpType: 'string' },
    { name: 'pin', phpType: 'int' }
  ],
  columnFieldMappings: [
    { field: 'createdAt', column: 'created', selectedType: 'timestamp' },
    { field: 'sentAt', column: 'sent', selectedType: 'timestamp' },
    { field: 'receivedAt', column: 'received', selectedType: 'timestamp' },
    { field: 'deletedAt', column: 'deleted', selectedType: 'timestamp' }
  ],
  explicitlyDefineColumns: false,
  
  // PHP Entity Class settings
  publicProperties: false,
  generateGetters: true,
  generateSetters: true,
  generateFluentSetters: true,
  
  // Relationship settings
  relationships: [],
  
  // Trait settings
  customTraits: [],
  selectedTraits: []
};

export default function Home() {
  const [sqlInput, setSqlInput] = useState(DEFAULT_SQL);
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_OPTIONS);
  const [xmlOutput, setXmlOutput] = useState('');
  const [phpOutput, setPhpOutput] = useState('');
  const [error, setError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [relationshipSuggestions, setRelationshipSuggestions] = useState<any[]>([]);

  // Load from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('entityGeneratorConfig');
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        // Merge shareable config with DEFAULT_OPTIONS (relationships come from defaults)
        const mergedOptions = { 
          ...DEFAULT_OPTIONS, 
          namespace: parsedConfig.namespace ?? DEFAULT_OPTIONS.namespace,
          entityPrefix: parsedConfig.entityPrefix ?? DEFAULT_OPTIONS.entityPrefix,
          entitySuffix: parsedConfig.entitySuffix ?? DEFAULT_OPTIONS.entitySuffix,
          customDataTypes: parsedConfig.customDataTypes || DEFAULT_OPTIONS.customDataTypes,
          columnFieldMappings: parsedConfig.columnFieldMappings || DEFAULT_OPTIONS.columnFieldMappings,
          explicitlyDefineColumns: parsedConfig.explicitlyDefineColumns ?? DEFAULT_OPTIONS.explicitlyDefineColumns,
          customTraits: parsedConfig.customTraits || DEFAULT_OPTIONS.customTraits
        };
        setOptions(mergedOptions);
      } catch (e) {
        console.warn('Failed to parse saved config, using defaults');
        setOptions(DEFAULT_OPTIONS);
      }
    } else {
      setOptions(DEFAULT_OPTIONS);
    }
    setIsHydrated(true);
  }, []);

  const updateSqlForDialect = (dialect: 'mysql' | 'postgresql' | 'sqlite' | 'mariadb') => {
    setSqlInput(EXAMPLE_SQL[dialect] || EXAMPLE_SQL.mysql);
  };

  const saveOptionsToLocalStorage = (newOptions: GenerationOptions) => {
    if (typeof window !== 'undefined') {
      // Only save shareable configuration (exclude relationships as they're query-specific)
      const shareableConfig = {
        namespace: newOptions.namespace,
        entityPrefix: newOptions.entityPrefix,
        entitySuffix: newOptions.entitySuffix,
        customDataTypes: newOptions.customDataTypes,
        columnFieldMappings: newOptions.columnFieldMappings,
        explicitlyDefineColumns: newOptions.explicitlyDefineColumns,
        customTraits: newOptions.customTraits
      };
      localStorage.setItem('entityGeneratorConfig', JSON.stringify(shareableConfig));
    }
  };

  const createShareableConfig = (): ShareableConfiguration => ({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    namespace: options.namespace,
    entityPrefix: options.entityPrefix,
    entitySuffix: options.entitySuffix,
    customDataTypes: options.customDataTypes,
    columnFieldMappings: options.columnFieldMappings,
    explicitlyDefineColumns: options.explicitlyDefineColumns,
    customTraits: options.customTraits
  });

  const exportToFile = () => {
    const shareableConfig = createShareableConfig();
    const dataStr = JSON.stringify(shareableConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `entity-generator-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToClipboard = async () => {
    try {
      const shareableConfig = createShareableConfig();
      const dataStr = JSON.stringify(shareableConfig, null, 2);
      await navigator.clipboard.writeText(dataStr);
      alert('Configuration copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard. Please try exporting to file instead.');
    }
  };

  const applyImportedConfig = (configStr: string) => {
    try {
      const importedConfig: ShareableConfiguration = JSON.parse(configStr);
      
      // Validate the imported configuration
      if (!importedConfig.version || !importedConfig.customDataTypes || !importedConfig.customTraits) {
        throw new Error('Invalid configuration file');
      }

      // Merge imported config with current options (keeping current relationships)
      const newOptions: GenerationOptions = {
        ...options,
        namespace: importedConfig.namespace,
        entityPrefix: importedConfig.entityPrefix,
        entitySuffix: importedConfig.entitySuffix,
        customDataTypes: importedConfig.customDataTypes,
        columnFieldMappings: importedConfig.columnFieldMappings,
        explicitlyDefineColumns: importedConfig.explicitlyDefineColumns,
        customTraits: importedConfig.customTraits
      };

      setOptions(newOptions);
      saveOptionsToLocalStorage(newOptions);
      
      alert('Configuration imported successfully!');
    } catch (error) {
      console.error('Failed to import configuration:', error);
      alert('Failed to import configuration. Please check the format.');
    }
  };

  const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const configStr = e.target?.result as string;
      applyImportedConfig(configStr);
    };
    
    reader.readAsText(file);
    // Reset the input so the same file can be imported again
    event.target.value = '';
  };

  const importFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      applyImportedConfig(clipboardText);
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      alert('Failed to read from clipboard. Please try importing from file instead.');
    }
  };

  const suggestRelationships = (schema: any) => {
    const suggestions: any[] = [];
    
    // Find columns ending with _id that aren't already configured as relationships
    const idColumns = schema.columns.filter((col: any) => 
      col.name.endsWith('_id') && 
      col.name !== 'id' &&
      !options.relationships.some(rel => rel.joinColumn === col.name)
    );
    
    for (const column of idColumns) {
      const baseName = column.name.replace(/_id$/, '');
      const entityName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      
      suggestions.push({
        column: column.name,
        field: baseName,
        targetEntity: entityName,
        type: 'many-to-one' as const,
        joinColumn: column.name,
        cascade: ['persist', 'merge'],
        fetch: 'LAZY' as const,
        isNullable: column.nullable
      });
    }
    
    return suggestions;
  };

  const addSuggestedRelationship = (suggestion: any) => {
    const newRelationship = {
      id: `relationship-${Date.now()}-${suggestion.field}`,
      field: suggestion.field,
      type: suggestion.type,
      targetEntity: suggestion.targetEntity,
      joinColumn: suggestion.joinColumn,
      cascade: suggestion.cascade,
      fetch: suggestion.fetch,
      // Note: The nullability will be determined by the SQL column when generating the entity
    };
    
    const newOptions = {
      ...options,
      relationships: [...(options.relationships || []), newRelationship]
    };
    
    setOptions(newOptions);
    saveOptionsToLocalStorage(newOptions);
    
    // Remove the suggestion from the list
    setRelationshipSuggestions(prev => prev.filter(s => s.column !== suggestion.column));
  };

  const generateCode = () => {
    try {
      setError('');
      
      console.log('Generating code with options:', options);
      
      // Parse the SQL with the selected database dialect
      const schema = SQLParser.parseCreateTable(sqlInput, options.databaseDialect);
      
      // Generate relationship suggestions
      const suggestions = suggestRelationships(schema);
      setRelationshipSuggestions(suggestions);
      
      // Generate Doctrine XML mapping
      const xml = DoctrineXMLGenerator.generate(schema, options);
      setXmlOutput(xml);
      
      // Generate PHP entity class
      const php = PHPEntityGenerator.generate(schema, options);
      setPhpOutput(php);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error generating code:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Doctrine Entity Generator
          </h1>
          <p className="text-xl text-gray-600">
            Generate Doctrine PHP entities and ORM XML mappings from SQL CREATE TABLE statements
          </p>
          
          {/* Configuration Import/Export */}
          <div className="flex justify-center space-x-4 mt-6">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                  <Download className="w-4 h-4" />
                  <span>Export Configuration</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToFile}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export to File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToClipboard}>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Export to Clipboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Import Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  <span>Import Configuration</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => document.getElementById('file-import')?.click()}>
                  <FileText className="w-4 h-4 mr-2" />
                  Import from File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={importFromClipboard}>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Import from Clipboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file input */}
            <input
              id="file-import"
              type="file"
              accept=".json"
              onChange={importFromFile}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="sql-input" className="block text-sm font-medium text-gray-700 mb-2">
                SQL CREATE TABLE Statement
              </label>
              <textarea
                id="sql-input"
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-black"
                placeholder="Paste your CREATE TABLE statement here..."
              />
            </div>

            {!isHydrated ? (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ) : (
              <OptionsForm 
                options={options} 
                onChange={(newOptions) => {
                  setOptions(newOptions);
                  saveOptionsToLocalStorage(newOptions);
                  // Update SQL example when dialect changes
                  if (newOptions.databaseDialect !== options.databaseDialect) {
                    updateSqlForDialect(newOptions.databaseDialect);
                  }
                }} 
              />
            )}

            <div className="flex gap-4">
              <button
                onClick={generateCode}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Generate Code
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Relationship Suggestions */}
            {relationshipSuggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-3">
                  Suggested Relationships
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  The following fields ending with "_id" were detected and can be configured as relationships:
                </p>
                <div className="space-y-2">
                  {relationshipSuggestions.map((suggestion, index) => (
                    <div key={`suggestion-${suggestion.field}-${suggestion.column}-${index}`} className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.field} → {suggestion.targetEntity}
                        </div>
                        <div className="text-xs text-gray-600">
                          Column: {suggestion.column} | Type: {suggestion.type}
                          {suggestion.isNullable && ' | Nullable'}
                        </div>
                      </div>
                      <button
                        onClick={() => addSuggestedRelationship(suggestion)}
                        className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Add Relationship
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {xmlOutput && (
              <CodeOutput
                title="Doctrine XML Mapping"
                code={xmlOutput}
                language="xml"
              />
            )}
            {phpOutput && (
              <CodeOutput
                title="PHP Entity Class"
                code={phpOutput}
                language="php"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
