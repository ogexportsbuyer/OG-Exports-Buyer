import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { hasUiTranslation } from './strings.ts';

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['ru', 'zh-CN', 'fr', 'es', 'de'];
const visibleTextProps = new Set([
  'title', 'subtitle', 'label', 'placeholder', 'accessibilityLabel', 'helper',
  'description', 'message', 'body', 'confirmLabel', 'emptyTitle', 'emptyBody',
  'primaryLabel', 'secondaryLabel', 'prompt', 'caption', 'error', 'detail', 'hint',
]);

function collectTsxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTsxFiles(fullPath);
    return fullPath.endsWith('.tsx') ? [fullPath] : [];
  });
}

function tagName(tag) {
  return ts.isIdentifier(tag) ? tag.text : '';
}

function importedLocalizedTextNames(sourceFile) {
  const names = new Set();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement)
      || !ts.isStringLiteral(statement.moduleSpecifier)
      || !statement.importClause?.namedBindings
      || !ts.isNamedImports(statement.importClause.namedBindings)
    ) continue;

    for (const element of statement.importClause.namedBindings.elements) {
      if (element.propertyName?.text === 'LocalizedText' || element.name.text === 'LocalizedText') {
        names.add(element.name.text);
      }
    }
  }
  return names;
}

test('all visible app text and accessibility labels are localized in the five added languages', () => {
  const files = [
    ...collectTsxFiles(path.join(mobileRoot, 'app')),
    ...collectTsxFiles(path.join(mobileRoot, 'components')),
  ];
  const missing = new Set();
  const nonLocalizedTextFiles = new Set();

  function check(value) {
    const phrase = value.replace(/\s+/g, ' ').trim();
    if (phrase.length < 3 || phrase.length > 4000 || !/[A-Za-z\p{L}]/u.test(phrase)) return;
    if (locales.some(language => !hasUiTranslation(phrase, language))) missing.add(phrase);
  }

  for (const file of files) {
    const sourceText = readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const localizedTextNames = importedLocalizedTextNames(sourceFile);

    function visit(node) {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const opening = ts.isJsxElement(node) ? node.openingElement : node;
        const tag = tagName(opening.tagName);
        if (tag === 'Text' && !localizedTextNames.has(tag)) nonLocalizedTextFiles.add(file);

        for (const attribute of opening.attributes.properties) {
          if (
            !ts.isJsxAttribute(attribute)
            || !visibleTextProps.has(attribute.name.getText(sourceFile))
            || !attribute.initializer
          ) continue;

          const initializer = attribute.initializer;
          if (ts.isStringLiteral(initializer)) check(initializer.text);
          else if (
            ts.isJsxExpression(initializer)
            && initializer.expression
            && ts.isStringLiteral(initializer.expression)
          ) check(initializer.expression.text);
        }

        if (ts.isJsxElement(node) && localizedTextNames.has(tag)) {
          for (const child of node.children) {
            if (ts.isJsxText(child)) check(child.text);
            else if (
              ts.isJsxExpression(child)
              && child.expression
              && ts.isStringLiteral(child.expression)
            ) check(child.expression.text);
          }
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  assert.deepEqual([...nonLocalizedTextFiles], [], 'app screens should use LocalizedText for user-facing copy');
  assert.deepEqual([...missing], [], 'every visible English phrase must have a translation for each added language');
});
