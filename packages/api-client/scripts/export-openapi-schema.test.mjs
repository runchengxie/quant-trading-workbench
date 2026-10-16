import assert from 'node:assert/strict';
import test from 'node:test';
import { exportOpenApiSchema } from './export-openapi-schema.mjs';

test('accepts a successful export when spawnSync reports a sandbox EPERM error', () => {
  const schema = { openapi: '3.1.0', paths: {} };
  const spawn = () => ({ status: 0, stdout: JSON.stringify(schema), error: new Error('EPERM') });

  assert.deepEqual(exportOpenApiSchema('/repo', spawn), schema);
});

test('rejects an exporter that exits unsuccessfully even when it produced JSON', () => {
  const spawn = () => ({ status: 1, stdout: '{"openapi":"3.1.0"}', stderr: 'export failed' });

  assert.throws(() => exportOpenApiSchema('/repo', spawn), /status 1\): export failed/);
});

test('rejects invalid JSON from a successful exporter', () => {
  const spawn = () => ({ status: 0, stdout: '<html>not a schema</html>' });

  assert.throws(() => exportOpenApiSchema('/repo', spawn), SyntaxError);
});
