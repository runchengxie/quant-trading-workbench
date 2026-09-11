import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const here = new URL('.', import.meta.url);
const read = (name) => readFileSync(new URL(name, here), 'utf8');

test('research editorial layer uses shared Workbench tokens and scoped evidence accent', () => {
  const source = read('editorial.css');
  const research = read('research.css');

  assert.match(source, /--research-heading-family:/);
  assert.match(source, /--research-meta-family:/);
  assert.match(research, /--surface-primary/);
  assert.match(research, /--evidence-accent/);
});

test('research editorial modifier flattens research cards without changing operation surfaces', () => {
  const source = read('research.css');

  assert.match(source, /\.research-editorial/);
  assert.match(source, /\.research-editorial[\s\S]*border-radius:\s*0/);
  assert.match(source, /\.research-editorial[\s\S]*font-family:\s*var\(--research-meta-family\)/);
  assert.match(source, /\.research-editorial[\s\S]*--evidence-accent/);
});

test('strategy research is explicitly marked as the editorial research surface', () => {
  const source = read('components/StrategyResearchView.tsx');
  assert.match(source, /className="strategy-research-view research-editorial"/);
});

test('operation shell keeps the existing base-before-editorial stylesheet order', () => {
  const source = read('main.tsx');
  assert.match(source, /import ['"]\.\/styles\.css['"];\s*import ['"]\.\/editorial\.css['"];/);
});
