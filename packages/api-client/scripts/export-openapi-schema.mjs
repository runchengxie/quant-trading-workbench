import { spawnSync } from 'node:child_process';

export function exportOpenApiSchema(repoRoot, spawn = spawnSync) {
  const result = spawn(
    'uv',
    [
      'run',
      '--locked',
      '--package',
      'market-data-service',
      'python',
      'apps/market-data-service/scripts/export_openapi.py',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  if (result.status !== 0) {
    const detail = result.error?.message ?? result.stderr?.trim() ?? 'unknown exporter failure';
    throw new Error(`OpenAPI schema export failed (status ${result.status}): ${detail}`);
  }

  if (typeof result.stdout !== 'string') {
    throw new Error('OpenAPI schema exporter did not return text output');
  }

  return JSON.parse(result.stdout);
}
