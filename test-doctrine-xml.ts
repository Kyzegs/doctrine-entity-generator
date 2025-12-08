import { SQLParser } from './lib/sql-parser';
import { DoctrineXMLGenerator } from './lib/doctrine-xml-generator';
import { DatabaseDialect } from './lib/example-queries';
import { GenerationOptions } from './lib/types';

const testQuery = `CREATE TABLE \`idin_transactions\` (
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  \`pin\` char(4) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`type\` varchar(16) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`data_map\` int(11) DEFAULT NULL,
  \`data_array\` text COLLATE utf8_unicode_ci,
  \`issuer_id\` varchar(16) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`sub_id\` int(11) unsigned DEFAULT NULL,
  \`company_id\` int(11) unsigned DEFAULT NULL,
  \`program_id\` int(11) unsigned DEFAULT NULL,
  \`website_id\` int(11) unsigned DEFAULT NULL,
  \`location_id\` int(11) unsigned DEFAULT NULL,
  \`real_website_location_id\` int(11) unsigned DEFAULT NULL,
  \`profile_id\` int(11) unsigned DEFAULT NULL,
  \`merchant_reference\` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`entrance_code\` varchar(40) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`transaction_id\` varchar(64) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`transaction_time\` timestamp NULL DEFAULT NULL,
  \`status\` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`status_code\` varchar(16) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`status_message\` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`status_message_desc\` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`status_time\` timestamp NULL DEFAULT NULL,
  \`language\` char(2) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`consumer_data\` text COLLATE utf8_unicode_ci,
  \`consumer_name\` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`consumer_bin\` text COLLATE utf8_unicode_ci,
  \`consumer_iban\` varchar(64) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`consumer_address\` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`consumer_email\` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  \`return_url\` text COLLATE utf8_unicode_ci,
  \`exchange_url\` text COLLATE utf8_unicode_ci,
  \`external_check_count\` int(11) unsigned DEFAULT '0',
  \`external_check_last\` int(11) DEFAULT NULL,
  \`created\` int(11) DEFAULT NULL,
  \`created_by\` int(11) DEFAULT NULL,
  \`deleted\` int(11) unsigned DEFAULT NULL,
  \`deleted_by\` int(11) unsigned DEFAULT NULL,
  \`date\` date DEFAULT NULL,
  PRIMARY KEY (\`id\`) USING BTREE,
  KEY \`IDX_transaction_id\` (\`transaction_id\`,\`entrance_code\`) USING BTREE,
  KEY \`IDX_company_reference\` (\`company_id\`,\`merchant_reference\`) USING BTREE,
  KEY \`real_website_location_id\` (\`real_website_location_id\`),
  KEY \`status\` (\`status\`),
  KEY \`date\` (\`date\`,\`status\`,\`company_id\`,\`type\`)
) ENGINE=InnoDB AUTO_INCREMENT=820352 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci`;

const options: GenerationOptions = {
  namespace: 'AntiCorruptionLayer\\Tinpay\\Entity',
  entityPrefix: '',
  entitySuffix: '',
  entityName: '',
  databaseDialect: DatabaseDialect.MYSQL,
  customDataTypes: [
    { name: 'timestamp', phpType: '\\DateTimeImmutable' },
    { name: 'integer_string_conversion', phpType: 'int' }
  ],
  columnFieldMappings: [
    { field: 'createdAt', column: 'created', selectedType: 'timestamp' },
    { field: 'createdBy', column: 'created_by', selectedType: 'integer_string_conversion' },
    { field: 'deletedAt', column: 'deleted', selectedType: 'timestamp' },
    { field: 'deletedBy', column: 'deleted_by', selectedType: 'integer_string_conversion' }
  ],
  explicitlyDefineColumns: false,
  useAttributeMapping: false,
  publicProperties: false,
  generateGetters: true,
  generateSetters: true,
  generateFluentSetters: true,
  relationships: [],
  customTraits: [],
  selectedTraits: []
};

try {
  console.log('Parsing SQL...');
  const schema = SQLParser.parseCreateTable(testQuery, DatabaseDialect.MYSQL);
  
  console.log('Generating XML...');
  const xml = DoctrineXMLGenerator.generate(schema, options);
  
  console.log('\n=== Generated XML ===\n');
  console.log(xml);
  
  console.log('\n=== Test completed successfully ===');
} catch (error) {
  console.error('Error:', error);
  if (error instanceof Error) {
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
  process.exit(1);
}
