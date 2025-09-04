'use client';

import { useState } from 'react';
import { SQLParser } from '@/lib/sql-parser';
import { DoctrineXMLGenerator } from '@/lib/doctrine-xml-generator';
import { PHPEntityGenerator } from '@/lib/php-entity-generator';
import { GenerationOptions } from '@/lib/types';
import { CodeOutput } from '@/components/code-output';
import { OptionsForm } from '@/components/options-form';

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
  namespace: 'AntiCorruptionLayer\\Tinpay\\Entity',
  generateFluentSetters: true,
  generateInterfaces: true,
  generateTraits: true,
  entityPrefix: '',
  entitySuffix: '',
  databaseDialect: 'mysql'
};

export default function Home() {
  const [sqlInput, setSqlInput] = useState(DEFAULT_SQL);
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_OPTIONS);
  const [xmlOutput, setXmlOutput] = useState('');
  const [phpOutput, setPhpOutput] = useState('');
  const [error, setError] = useState('');

  const updateSqlForDialect = (dialect: 'mysql' | 'postgresql' | 'sqlite' | 'mariadb') => {
    setSqlInput(EXAMPLE_SQL[dialect] || EXAMPLE_SQL.mysql);
  };

  const generateCode = () => {
    try {
      setError('');
      
      // Parse the SQL with the selected database dialect
      const schema = SQLParser.parseCreateTable(sqlInput, options.databaseDialect);
      
      // Generate XML mapping
      const xml = DoctrineXMLGenerator.generate(schema, options);
      setXmlOutput(xml);
      
      // Generate PHP entity
      const php = PHPEntityGenerator.generate(schema, options);
      setPhpOutput(php);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating code');
      setXmlOutput('');
      setPhpOutput('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Doctrine Entity Generator
          </h1>
          <p className="text-gray-600">
            Generate Doctrine XML mappings and PHP entities from SQL CREATE TABLE statements
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label htmlFor="sql-input" className="block text-sm font-medium text-gray-700 mb-2">
                SQL CREATE TABLE Statement
              </label>
              <textarea
                id="sql-input"
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Paste your CREATE TABLE statement here..."
              />
            </div>

            <OptionsForm 
              options={options} 
              onChange={(newOptions) => {
                setOptions(newOptions);
                // Update SQL example when dialect changes
                if (newOptions.databaseDialect !== options.databaseDialect) {
                  updateSqlForDialect(newOptions.databaseDialect);
                }
              }} 
            />

            <div className="flex gap-4">
              <button
                onClick={generateCode}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Generate Code
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Output Section */}
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

            {!xmlOutput && !phpOutput && !error && (
              <div className="text-center py-12 text-gray-500">
                <p>Enter a SQL CREATE TABLE statement and click "Generate Code" to see the results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
