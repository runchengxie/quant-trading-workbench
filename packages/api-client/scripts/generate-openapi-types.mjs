import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';
import { exportOpenApiSchema } from './export-openapi-schema.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '../..');
const outputPath = resolve(packageRoot, 'src/generated/openapi.d.ts');
const mode = process.argv[2];

if (mode !== '--write' && mode !== '--check') {
  throw new Error('Expected --write or --check');
}

const generated = `// Generated from the local Market Data Service OpenAPI schema. Do not edit manually.\n\n${astToString(
  await openapiTS(exportOpenApiSchema(repoRoot)),
).trimEnd()}\n`;

if (mode === '--write') {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, generated);
  process.stdout.write(`Generated ${outputPath}\n`);
} else {
  let current;
  try {
    current = readFileSync(outputPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (current !== generated) {
    process.stderr.write(
      'Generated OpenAPI types are missing or stale. Run `pnpm api:generate` and commit the result.\n',
    );
    process.exitCode = 1;
  } else {
    process.stdout.write('Generated OpenAPI types are up to date.\n');
  }
}
