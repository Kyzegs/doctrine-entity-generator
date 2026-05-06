'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { SQLParser } from '@/lib/sql-parser';
import { DoctrineXMLGenerator } from '@/lib/doctrine-xml-generator';
import { PHPEntityGenerator } from '@/lib/php-entity-generator';
import { GenerationOptions, ShareableConfiguration, GeneratedEntity, Relationship } from '@/lib/types';
import { EntityCodeOutput } from '@/components/entity-code-output';
import { OptionsForm } from '@/components/options-form';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CodeMirror from '@uiw/react-codemirror';
import { sql, MySQL, PostgreSQL, SQLite } from '@codemirror/lang-sql';
import { tomorrowNight } from '@/lib/codemirror-theme-tomorrow-night';
import { toast } from 'sonner';
import {
  createShareUrl,
  copyToClipboard,
  ShareableCode,
  toPascalCase,
  toCamelCase,
  getErrorMessage,
  computeEntityName,
  buildShareableConfiguration,
  mergeShareableConfigIntoOptions,
} from '@/lib/utils';
import { downloadBlob, downloadEntitiesAsZip } from '@/lib/bulk-entity-zip';
import { DEFAULT_QUERY, exampleQueries, DatabaseDialect } from '@/lib/example-queries';

const DEFAULT_OPTIONS: GenerationOptions = {
  namespace: '',
  entityPrefix: '',
  entitySuffix: '',
  entityName: '', // Manual override for entity name (not shareable)
  classNamingConvention: 'inherit', // Use table name as-is by default
  databaseDialect: DatabaseDialect.MYSQL,

  // ORM mapping settings
  customDataTypes: [
    { name: 'timestamp', phpType: '\\DateTimeImmutable' },
    { name: 'money', phpType: 'Money' },
    { name: 'uuid', phpType: 'string' },
    { name: 'pin', phpType: 'int' },
  ],
  columnFieldMappings: [
    { field: 'createdAt', column: 'created', selectedType: 'timestamp' },
    { field: 'sentAt', column: 'sent', selectedType: 'timestamp' },
    { field: 'receivedAt', column: 'received', selectedType: 'timestamp' },
    { field: 'deletedAt', column: 'deleted', selectedType: 'timestamp' },
  ],
  explicitlyDefineColumns: false,
  useAttributeMapping: false,

  // PHP Entity Class settings
  publicProperties: false,
  generateGetters: true,
  generateSetters: true,
  generateFluentSetters: true,

  // Relationship settings
  relationships: [],

  // Trait settings
  customTraits: [],
  selectedTraits: [],
};

const CODEMIRROR_SQL_DIALECTS = {
  [DatabaseDialect.MYSQL]: MySQL,
  [DatabaseDialect.POSTGRESQL]: PostgreSQL,
  [DatabaseDialect.SQLITE]: SQLite,
} as const;

export default function Home() {
  const [sqlInput, setSqlInput] = useState(DEFAULT_QUERY);
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_OPTIONS);
  const [xmlOutput, setXmlOutput] = useState('');
  const [phpOutput, setPhpOutput] = useState('');
  const [generatedEntityName, setGeneratedEntityName] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [relationshipSuggestions, setRelationshipSuggestions] = useState<any[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkEntities, setBulkEntities] = useState<GeneratedEntity[]>([]);
  const hasMultipleTables = useMemo(() => {
    const createTableCount = (sqlInput.match(/create\s+table/gi) || []).length;
    return createTableCount > 1;
  }, [sqlInput]);
  const [savedRelationships, setSavedRelationships] = useState<Relationship[]>([]);
  const [savedTraits, setSavedTraits] = useState<string[]>([]);

  const sqlEditorExtensions = useMemo(() => {
    const dialect = CODEMIRROR_SQL_DIALECTS[options.databaseDialect] ?? MySQL;
    return [sql({ dialect })];
  }, [options.databaseDialect]);

  const STORAGE_KEY = 'entityGeneratorConfig';

  // Load from localStorage after hydration
  useEffect(() => {
    queueMicrotask(() => {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<ShareableConfiguration>;
          const merged = { ...DEFAULT_OPTIONS, ...mergeShareableConfigIntoOptions(parsed) };
          setOptions(merged);
        } catch {
          console.warn('Failed to parse saved config, using defaults');
          setOptions(DEFAULT_OPTIONS);
        }
      } else {
        setOptions(DEFAULT_OPTIONS);
      }
      setIsHydrated(true);
    });
  }, []);

  const updateSqlForDialect = (dialectName: string) => {
    const example = exampleQueries.find((q) => q.name === dialectName);
    if (example) {
      setSqlInput(example.query);
      setOptions((prev) => ({ ...prev, databaseDialect: example.dialect }));
    }
  };

  const saveOptionsToLocalStorage = (newOptions: GenerationOptions) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildShareableConfiguration(newOptions)));
    }
  };

  const createShareableConfig = (): ShareableConfiguration => buildShareableConfiguration(options);

  const exportToFile = () => {
    const shareableConfig = createShareableConfig();
    const dataStr = JSON.stringify(shareableConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const filename = `entity-generator-config-${new Date().toISOString().split('T')[0]}.json`;
    downloadBlob(dataBlob, filename);
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
        useAttributeMapping: importedConfig.useAttributeMapping,
        customTraits: importedConfig.customTraits,
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

  const handleSqlFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    const validExtensions = ['.sql', '.txt'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid File Type', {
        description: 'Please upload a .sql or .txt file',
      });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setSqlInput(content);
        toast.success('SQL File Loaded', {
          description: `Loaded ${file.name}`,
        });
      }
    };
    reader.onerror = () => {
      toast.error('Failed to Read File', {
        description: 'An error occurred while reading the file',
      });
    };
    reader.readAsText(file);

    // Reset input so the same file can be uploaded again
    event.target.value = '';
  };

  const relationshipIdSeq = useRef(0);

  // Update multiple tables detection when SQL input changes
  // Effect intentionally only depends on sqlInput to trigger when SQL changes
  // It captures current values of options, savedRelationships, and savedTraits at that moment
  useEffect(() => {
    queueMicrotask(() => {
      if (hasMultipleTables) {
        // Clear relationship suggestions so they can't be used in bulk mode
        setRelationshipSuggestions([]);

        // Save current relationships and traits before clearing
        if (options.relationships.length > 0 || options.selectedTraits.length > 0) {
          setSavedRelationships([...options.relationships]);
          setSavedTraits([...options.selectedTraits]);

          const clearedOptions = {
            ...options,
            relationships: [],
            selectedTraits: [],
          };
          setOptions(clearedOptions);
          saveOptionsToLocalStorage(clearedOptions);

          // Show notification about cleared configurations
          const clearedItems = [];
          if (options.relationships.length > 0) clearedItems.push('relationships');
          if (options.selectedTraits.length > 0) clearedItems.push('traits');

          toast.info('Configurations Cleared', {
            description: `Previous ${clearedItems.join(' and ')} have been cleared for bulk generation.`,
          });
        }
      } else {
        // Restore saved relationships and traits when switching back to single table
        if (savedRelationships.length > 0 || savedTraits.length > 0) {
          const restoredOptions = {
            ...options,
            relationships: savedRelationships,
            selectedTraits: savedTraits,
          };
          setOptions(restoredOptions);
          saveOptionsToLocalStorage(restoredOptions);

          // Clear saved configurations
          setSavedRelationships([]);
          setSavedTraits([]);

          toast.success('Configurations Restored', {
            description: 'Previous relationships and traits have been restored.',
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sqlInput, hasMultipleTables]);

  const suggestRelationships = (schema: any) => {
    const suggestions: any[] = [];

    // Safety check for schema structure
    if (!schema || !schema.columns || !Array.isArray(schema.columns)) {
      console.warn('Invalid schema structure:', schema);
      return suggestions;
    }

    // Find columns ending with _id that aren't already configured as relationships
    const idColumns = schema.columns.filter((col: any) => {
      // Add safety checks
      if (!col || typeof col !== 'object') {
        console.warn('Invalid column object:', col);
        return false;
      }

      // Extract column name using the utility function
      const columnName = SQLParser.extractColumnName(col.name);

      return (
        columnName.endsWith('_id') &&
        columnName !== 'id' &&
        !options.relationships.some((rel) => rel.joinColumn === columnName)
      );
    });

    for (const column of idColumns) {
      // Extract the actual column name using the utility function
      const columnName = SQLParser.extractColumnName(column.name);
      const baseName = columnName.replace(/_id$/, '');

      // Convert snake_case to camelCasefor field names and PascalCase for entity names
      const fieldName = toCamelCase(baseName);
      const entityName = toPascalCase(baseName);

      suggestions.push({
        column: columnName,
        field: fieldName,
        targetEntity: entityName,
        type: 'many-to-one' as const,
        joinColumn: columnName,
        cascade: ['persist', 'merge'],
        fetch: 'LAZY' as const,
        isNullable: column.nullable,
      });
    }

    return suggestions;
  };

  const addSuggestedRelationship = (suggestion: any) => {
    relationshipIdSeq.current += 1;
    const newRelationship = {
      id: `relationship-${relationshipIdSeq.current}-${suggestion.field}`,
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
      relationships: [...(options.relationships || []), newRelationship],
    };

    setOptions(newOptions);
    saveOptionsToLocalStorage(newOptions);

    // Remove the suggestion from the list
    setRelationshipSuggestions((prev) => prev.filter((s) => s.column !== suggestion.column));
  };

  const handleShare = async () => {
    try {
      const entitiesToShare: GeneratedEntity[] = isBulkMode
        ? bulkEntities
        : [
            (() => {
              let tableName = 'table';
              try {
                const schema = SQLParser.parseCreateTable(sqlInput, options.databaseDialect);
                tableName = schema.name;
              } catch {
                // use defaults
              }
              return {
                tableName,
                entityName: computeEntityName(options, tableName),
                xmlOutput: xmlOutput || undefined,
                phpOutput: phpOutput ?? '',
                hasError: false,
              };
            })(),
          ];

      const shareData: ShareableCode = {
        entities: entitiesToShare,
        sqlInput,
        options,
      };

      const shareUrl = await createShareUrl(shareData);
      await copyToClipboard(shareUrl);

      toast.success('Share link copied!', {
        description: isBulkMode
          ? `Shared ${entitiesToShare.length} entities`
          : 'Share this link to show your generated code to others.',
      });
    } catch (error) {
      console.error('Failed to create share link:', error);
      toast.error('Failed to create share link', {
        description: 'Please try again.',
      });
    }
  };

  const generateBulkEntities = () => {
    try {
      // Parse multiple tables
      const tables = SQLParser.parseMultipleTables(sqlInput, options.databaseDialect);

      // Bulk generation never uses relationships or traits (single-table-only features)
      const bulkOptions = {
        ...options,
        relationships: [],
        selectedTraits: [],
      };

      const entities: GeneratedEntity[] = [];

      for (const schema of tables) {
        try {
          const entityName = computeEntityName(bulkOptions, schema.name);

          let xmlOutput: string | undefined;
          if (!bulkOptions.useAttributeMapping) {
            xmlOutput = DoctrineXMLGenerator.generate(schema, bulkOptions);
          }

          const phpOutput = PHPEntityGenerator.generate(schema, bulkOptions);

          entities.push({
            tableName: schema.name,
            entityName,
            xmlOutput,
            phpOutput,
            hasError: false,
          });
        } catch (err) {
          entities.push({
            tableName: schema.name,
            entityName: computeEntityName(bulkOptions, schema.name),
            xmlOutput: undefined,
            phpOutput: '',
            hasError: true,
            errorMessage: getErrorMessage(err),
          });
        }
      }

      setBulkEntities(entities);
      setIsBulkMode(true);
      setGeneratedEntityName(null);

      const successCount = entities.filter((e) => !e.hasError).length;
      const failCount = entities.filter((e) => e.hasError).length;

      toast.success(`Generated ${successCount} entities` + (failCount > 0 ? ` (${failCount} failed)` : ''));
    } catch (err) {
      console.error('Error generating bulk entities:', err);
      toast.error('Bulk Generation Failed', {
        description: getErrorMessage(err),
      });
    }
  };

  const handleDownloadAll = async () => {
    if (bulkEntities.length === 0) return;
    try {
      const count = await downloadEntitiesAsZip(bulkEntities, 'entities.zip');
      if (count > 0) toast.success(`Downloaded ${count} entities as ZIP`);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      toast.error('Failed to create download');
    }
  };

  const generateCode = () => {
    try {
      // Check if there are multiple CREATE TABLE statements
      if (hasMultipleTables) {
        // Switch to bulk mode
        generateBulkEntities();
        return;
      }

      // Single table mode
      setIsBulkMode(false);

      // Parse the SQL with the selected database dialect
      const schema = SQLParser.parseCreateTable(sqlInput, options.databaseDialect);

      // Check if the SQL is a CREATE TABLE statement
      const trimmedSql = sqlInput.trim().toLowerCase();
      if (!trimmedSql.startsWith('create table')) {
        toast.error('Invalid SQL Statement', {
          description: 'Please provide a valid CREATE TABLE statement. Only CREATE TABLE statements are supported.',
        });
        return;
      }

      // Generate relationship suggestions
      try {
        const suggestions = suggestRelationships(schema);
        setRelationshipSuggestions(suggestions);
      } catch (suggestionError) {
        console.warn('Failed to generate relationship suggestions:', suggestionError);
        setRelationshipSuggestions([]);
      }

      setGeneratedEntityName(computeEntityName(options, schema.name));

      // Generate Doctrine XML mapping (only if not using attribute mapping)
      if (!options.useAttributeMapping) {
        const xml = DoctrineXMLGenerator.generate(schema, options);
        setXmlOutput(xml);
      } else {
        setXmlOutput('');
      }

      // Generate PHP entity class
      const php = PHPEntityGenerator.generate(schema, options);
      setPhpOutput(php);
    } catch (err) {
      console.error('Error generating code:', err);
      toast.error('Code Generation Failed', {
        description: getErrorMessage(err),
      });
    }
  };

  return (
    <>
      {isHydrated && (
        <AppSidebar
          currentOptions={options}
          onLoadPreset={(loadedOptions) => {
            setOptions(loadedOptions);
            saveOptionsToLocalStorage(loadedOptions);
            // Update SQL example if dialect changed
            if (loadedOptions.databaseDialect !== options.databaseDialect) {
              updateSqlForDialect(loadedOptions.databaseDialect);
            }
          }}
          onExportToFile={exportToFile}
          onExportToClipboard={exportToClipboard}
          onImportFromFile={() => document.getElementById('file-import')?.click()}
          onImportFromClipboard={importFromClipboard}
        />
      )}
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 flex-1">
            <h1 className="text-xl font-semibold">Doctrine Entity Generator</h1>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="text-center mb-4">
            <p className="text-muted-foreground">
              Generate Doctrine PHP entities and ORM XML mappings from SQL CREATE TABLE statements
            </p>
          </div>

          {/* Hidden file inputs */}
          <input id="file-import" type="file" accept=".json" onChange={importFromFile} className="hidden" />
          <input
            id="sql-file-upload"
            type="file"
            accept=".sql,.txt"
            onChange={handleSqlFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="sql-input" className="text-sm font-medium">
                    SQL CREATE TABLE Statement
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={updateSqlForDialect}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Load example SQL..." />
                      </SelectTrigger>
                      <SelectContent>
                        {exampleQueries.map((example) => (
                          <SelectItem key={example.name} value={example.name}>
                            {example.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('sql-file-upload')?.click()}
                      className="h-9"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload SQL File
                    </Button>
                  </div>
                </div>
                <div
                  id="sql-input"
                  className="flex w-full min-h-64 resize-y flex-col rounded-md border border-input overflow-hidden [&>div]:min-h-0 [&>div]:flex-1 [&_.cm-editor]:outline-none [&_.cm-editor]:h-full [&_.cm-editor]:min-h-0 [&_.cm-scroller]:overflow-auto [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-sm [&_.cm-scroller]:min-h-0"
                  style={{ height: '16rem' }}
                >
                  <CodeMirror
                    value={sqlInput}
                    onChange={setSqlInput}
                    height="100%"
                    minHeight="16rem"
                    theme="none"
                    extensions={[...sqlEditorExtensions, ...tomorrowNight]}
                    placeholder="Paste your CREATE TABLE statement here or upload a .sql file..."
                    basicSetup={{ lineNumbers: true, foldGutter: false }}
                  />
                </div>
              </div>

              {!isHydrated ? (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted-foreground/20 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-10 bg-muted-foreground/20 rounded"></div>
                      <div className="h-10 bg-muted-foreground/20 rounded"></div>
                      <div className="h-10 bg-muted-foreground/20 rounded"></div>
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
                  hasMultipleTables={hasMultipleTables}
                />
              )}
            </div>

            <div className="space-y-6">
              <EntityCodeOutput
                entities={
                  isBulkMode && bulkEntities.length > 0
                    ? bulkEntities
                    : xmlOutput || phpOutput
                      ? [
                          {
                            tableName: '',
                            entityName: generatedEntityName ?? 'Entity',
                            xmlOutput: xmlOutput || undefined,
                            phpOutput: phpOutput ?? '',
                            hasError: false,
                          },
                        ]
                      : []
                }
                onDownloadAll={isBulkMode ? handleDownloadAll : undefined}
                onShare={handleShare}
              />
            </div>
          </div>

          {/* Add padding at bottom to prevent content from being hidden behind fixed footer */}
          <div className="h-24" />
        </div>

        {/* Fixed Bottom Container */}
        <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sidebar-width)] z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-4">
            <div className="flex items-center gap-4">
              {/* Generate Code Button */}
              <Button onClick={generateCode} size="lg" className="shrink-0">
                Generate Code
              </Button>

              {/* Relationship Suggestions Popover (single table only) */}
              {!hasMultipleTables && relationshipSuggestions.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      Relationship Suggestions
                      <span className="ml-1 px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                        {relationshipSuggestions.length}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="start" side="top">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Suggested Relationships</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRelationshipSuggestions([])}
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        >
                          Dismiss All
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Fields ending with &quot;_id&quot; detected in your SQL
                      </p>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-2">
                      {relationshipSuggestions.map((suggestion, index) => (
                        <button
                          key={`suggestion-${suggestion.field}-${index}`}
                          onClick={() => addSuggestedRelationship(suggestion)}
                          className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors border border-transparent hover:border-border"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {suggestion.field} → {suggestion.targetEntity}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Column: {suggestion.column} | Type: {suggestion.type}
                                {suggestion.isNullable && ' | Nullable'}
                              </div>
                            </div>
                            <div className="ml-2 text-xs text-primary">Add →</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
