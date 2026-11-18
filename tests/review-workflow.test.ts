import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import type { ContractDocument } from '../src/types/contract.ts';
import type { Finding, FindingsDataset } from '../src/types/finding.ts';
import {
  applyTextEditOperations,
  buildFindingEditOperations,
  hasConflictingEdits,
} from '../src/utils/amendments.ts';
import {
  getNextOverlappingFindingId,
  getParagraphFindingRanges,
  mapFindingRangesToAmendedText,
  splitParagraphIntoSegments,
} from '../src/utils/spanSplitter.ts';
import {
  restoreReviewDraft,
  sanitizeOriginalParagraphs,
  sanitizeReviews,
} from '../src/utils/reviewPersistence.ts';
import { isSupportedReviewDocument } from '../src/utils/documentReview.ts';
import type { DocumentItem } from '../src/types/document.ts';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

const testStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: testStorage,
  configurable: true,
});
Object.defineProperty(globalThis, 'window', {
  value: { localStorage: testStorage },
  configurable: true,
});

const contract = JSON.parse(
  await readFile(new URL('../src/assets/sample-contract.json', import.meta.url), 'utf8')
) as ContractDocument;
const findingsDataset = JSON.parse(
  await readFile(new URL('../src/assets/findings.json', import.meta.url), 'utf8')
) as FindingsDataset;
const findings = findingsDataset.findings;
const paragraphs = contract.sections.flatMap((section) => section.paragraphs);

function finding(id: string): Finding {
  const result = findings.find((item) => item.id === id);
  assert.ok(result, `Expected fixture finding ${id}`);
  return result;
}

function paragraphText(paragraphId: string): string {
  const result = paragraphs.find((paragraph) => paragraph.id === paragraphId);
  assert.ok(result, `Expected fixture paragraph ${paragraphId}`);
  return result.text;
}

function makeFinding(
  id: string,
  paragraphId: string,
  text: string,
  replacement: string,
  paragraphTextValue: string
): Finding {
  const start = paragraphTextValue.indexOf(text);
  assert.notEqual(start, -1);
  return {
    id,
    severity: 'medium',
    category: 'Test',
    title: id,
    explanation: id,
    anchor: { paragraphId, start, end: start + text.length, quote: text },
    suggestedEdit: replacement,
    confidence: 1,
  };
}

test('F-02 spans both paragraphs and intermediate text is highlighted for three-paragraph anchors', () => {
  const f02 = finding('f-02');
  const f02Ranges = ['p-3.4', 'p-3.5'].map((paragraphId) =>
    getParagraphFindingRanges(paragraphId, paragraphText(paragraphId), [f02], paragraphs)
  );
  assert.equal(f02Ranges[0][0]?.start, f02.anchor?.start);
  assert.equal(f02Ranges[1][0]?.end, f02.anchor?.end);

  const threeParagraphs = [
    { id: 'p-start', number: null, text: 'prefix quoted start' },
    { id: 'p-middle', number: null, text: 'entire middle paragraph' },
    { id: 'p-end', number: null, text: 'quoted end suffix' },
  ];
  const crossFinding: Finding = {
    ...f02,
    anchor: {
      paragraphId: 'p-start',
      start: 7,
      endParagraphId: 'p-end',
      end: 11,
      quote: 'quoted start entire middle paragraph quoted end',
    },
  };
  const middleRanges = getParagraphFindingRanges(
    'p-middle',
    threeParagraphs[1].text,
    [crossFinding],
    threeParagraphs
  );
  assert.deepEqual(
    middleRanges.map(({ start, end }) => [start, end]),
    [[0, threeParagraphs[1].text.length]]
  );

  const invalidOrder = {
    ...crossFinding,
    anchor: { ...crossFinding.anchor!, paragraphId: 'p-end', endParagraphId: 'p-start' },
  };
  assert.deepEqual(
    getParagraphFindingRanges(
      'p-middle',
      threeParagraphs[1].text,
      [invalidOrder],
      threeParagraphs
    ),
    []
  );
  assert.deepEqual(
    getParagraphFindingRanges('missing', 'x', [crossFinding], threeParagraphs),
    []
  );
  assert.deepEqual(
    getParagraphFindingRanges(
      'p-start',
      threeParagraphs[0].text,
      [crossFinding],
      [threeParagraphs[0], threeParagraphs[0], threeParagraphs[2]]
    ),
    []
  );
});

test('F-04 and F-05 retain overlapping finding metadata', () => {
  const text = paragraphText('p-6.2');
  const ranges = getParagraphFindingRanges(
    'p-6.2',
    text,
    [finding('f-04'), finding('f-05')],
    paragraphs
  );
  const overlapping = splitParagraphIntoSegments(text, ranges).find(
    (segment) =>
      segment.findingIds.includes('f-04') &&
      segment.findingIds.includes('f-05')
  );
  assert.ok(overlapping);
  assert.equal(overlapping.isOverlapping, true);
  assert.equal(getNextOverlappingFindingId(['f-04', 'f-05'], 'f-04'), 'f-05');
  assert.equal(getNextOverlappingFindingId(['f-04', 'f-05'], 'f-05'), 'f-04');
});

test('only the supported primary document can open the review workspace', () => {
  const primary: DocumentItem = {
    id: contract.id,
    name: contract.title,
    type: 'Master Services Agreement',
    vendor: 'Vendor',
    counterparty: 'Customer',
    uploadDate: '2026-01-01',
    effectiveDate: contract.effectiveDate,
    riskLevel: 'High',
    status: 'In Progress',
    findingCount: findings.length,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: findings.length,
    isPrimary: true,
  };
  const demo = { ...primary, id: 'demo-document', isPrimary: false };
  assert.equal(isSupportedReviewDocument(primary, contract.id, contract.id), true);
  assert.equal(isSupportedReviewDocument(demo, demo.id, contract.id), false);
  assert.equal(isSupportedReviewDocument(null, 'unknown', contract.id), false);
  assert.equal(isSupportedReviewDocument(primary, 'different-id', contract.id), false);
});

test('F-09 remains document-wide and F-20 resolves a stale offset by its quote', () => {
  const f09 = finding('f-09');
  assert.equal(f09.anchor, null);
  assert.deepEqual(
    getParagraphFindingRanges('p-1.1', paragraphText('p-1.1'), [f09], paragraphs),
    []
  );

  const f20 = finding('f-20');
  assert.ok(f20.anchor);
  const text = paragraphText(f20.anchor.paragraphId);
  const ranges = getParagraphFindingRanges(
    f20.anchor.paragraphId,
    text,
    [f20],
    paragraphs
  );
  assert.equal(ranges.length, 1);
  assert.equal(text.slice(ranges[0].start, ranges[0].end), f20.anchor.quote);
});

test('multiple non-overlapping amendments map original ranges into amended text', () => {
  const text = 'Alpha clause. Middle clause. Omega clause.';
  const first = makeFinding('f-a', 'p-test', 'Alpha clause.', 'A longer replacement clause.', text);
  const second = makeFinding('f-b', 'p-test', 'Omega clause.', 'Omega.', text);
  const testParagraphs = [{ id: 'p-test', number: null, text }];
  const operations = [
    ...buildFindingEditOperations(first, testParagraphs, {})!,
    ...buildFindingEditOperations(second, testParagraphs, {})!,
  ];
  assert.equal(hasConflictingEdits(operations), false);

  const edited = applyTextEditOperations(
    {
      ...contract,
      sections: [{ id: 'section-test', number: null, heading: 'Test', paragraphs: testParagraphs }],
    },
    { 'p-test': text },
    operations,
    new Set(['p-test'])
  );
  const editedText = edited.sections[0].paragraphs[0].text;
  assert.equal(editedText, 'A longer replacement clause. Middle clause. Omega.');

  const ranges = getParagraphFindingRanges('p-test', text, [first, second], testParagraphs);
  const mapped = mapFindingRangesToAmendedText(ranges, 'p-test', operations);
  const segments = splitParagraphIntoSegments(editedText, mapped);
  assert.ok(segments.some((segment) => segment.findingIds.includes('f-a') && segment.text.includes('A longer replacement')));
  assert.ok(segments.some((segment) => segment.findingIds.includes('f-b') && segment.text === 'Omega.'));
});

test('applying and reverting an amendment restores text while preserving independent review status and notes', () => {
  const originalText = paragraphText('p-3.3');
  const reviews = sanitizeReviews(
    JSON.parse(
      JSON.stringify({
        'f-01': {
          status: 'accepted',
          notes: [{ id: 'note-1', author: 'Reviewer', text: 'Keep', timestamp: 'now' }],
          isEditApplied: true,
        },
      })
    ),
    findings
  );
  const originalParagraphs = sanitizeOriginalParagraphs(
    { 'p-3.3': originalText },
    contract
  );
  const restored = restoreReviewDraft(contract, findings, reviews, originalParagraphs);
  const changedText = restored.contract.sections
    .flatMap((section) => section.paragraphs)
    .find((paragraph) => paragraph.id === 'p-3.3')?.text;
  assert.notEqual(changedText, originalText);
  assert.equal(restored.reviews['f-01'].status, 'accepted');
  assert.equal(restored.reviews['f-01'].notes[0].text, 'Keep');

  const reverted = restoreReviewDraft(
    contract,
    findings,
    { ...restored.reviews, 'f-01': { ...restored.reviews['f-01'], isEditApplied: false } },
    restored.originalParagraphs
  );
  const revertedText = reverted.contract.sections
    .flatMap((section) => section.paragraphs)
    .find((paragraph) => paragraph.id === 'p-3.3')?.text;
  assert.equal(revertedText, originalText);
  assert.deepEqual(reverted.originalParagraphs, {});
});

test('Zustand persistence restores statuses, comments, amendments, reverts, dismissals, and resets', async () => {
  const storage = testStorage;
  storage.clear();
  const storageKey = 'northwind_ai_document_review_v1';
  let moduleNumber = 0;
  const loadStore = async () => {
    moduleNumber++;
    return import(`../src/store/useReviewStore.ts?refresh=${moduleNumber}`);
  };

  const first = await loadStore();
  const firstStore = first.useReviewStore;
  firstStore.getState().setStatus('f-20', 'accepted');
  firstStore.getState().addNote('f-20', 'Persist this note', 'Test Reviewer');
  const afterAccept = await loadStore();
  assert.equal(afterAccept.useReviewStore.getState().reviews['f-20'].status, 'accepted');
  assert.equal(afterAccept.useReviewStore.getState().reviews['f-20'].notes[0].text, 'Persist this note');

  const original = paragraphText('p-3.3');
  assert.equal(afterAccept.useReviewStore.getState().applySuggestedEdit('f-01'), true);
  assert.equal(afterAccept.useReviewStore.getState().reviews['f-01'].status, 'pending');
  const afterApply = await loadStore();
  assert.equal(afterApply.useReviewStore.getState().reviews['f-01'].isEditApplied, true);
  assert.notEqual(
    afterApply.useReviewStore.getState().contract.sections.flatMap((section) => section.paragraphs)
      .find((paragraph) => paragraph.id === 'p-3.3')?.text,
    original
  );

  afterApply.useReviewStore.getState().revertSuggestedEdit('f-01');
  const afterRevert = await loadStore();
  assert.equal(afterRevert.useReviewStore.getState().reviews['f-01'].isEditApplied, false);
  assert.equal(
    afterRevert.useReviewStore.getState().contract.sections.flatMap((section) => section.paragraphs)
      .find((paragraph) => paragraph.id === 'p-3.3')?.text,
    original
  );

  assert.equal(afterRevert.useReviewStore.getState().applySuggestedEdit('f-03'), true);
  afterRevert.useReviewStore.getState().setStatus('f-03', 'dismissed');
  const afterDismiss = await loadStore();
  assert.equal(afterDismiss.useReviewStore.getState().reviews['f-03'].status, 'dismissed');
  assert.equal(afterDismiss.useReviewStore.getState().reviews['f-03'].isEditApplied, false);
  afterDismiss.useReviewStore.getState().resetAllReviews();
  const afterReset = await loadStore();
  assert.deepEqual(afterReset.useReviewStore.getState().reviews, {});
  assert.equal(
    afterReset.useReviewStore.getState().contract.sections.flatMap((section) => section.paragraphs)
      .find((paragraph) => paragraph.id === 'p-3.3')?.text,
    original
  );

  afterReset.useReviewStore.getState().setStatus('f-20', 'accepted');
  afterReset.useReviewStore.getState().updateUserSettings({ autoSaveReviewDrafts: false });
  const autosaveDisabled = await loadStore();
  assert.equal(autosaveDisabled.useReviewStore.getState().userSettings.autoSaveReviewDrafts, false);
  assert.deepEqual(autosaveDisabled.useReviewStore.getState().reviews, {});

  storage.setItem(
    storageKey,
    JSON.stringify({
      version: 1,
      state: {
        reviews: {
          'f-20': {
            status: 'accepted',
            notes: [{ id: 'legacy-note', author: 'Legacy', text: 'Preserved', timestamp: 'now' }],
          },
          'f-01': {
            status: 'accepted',
            notes: [],
            isEditApplied: true,
            appliedText: finding('f-01').suggestedEdit,
          },
        },
        originalParagraphs: { 'p-3.3': paragraphText('p-3.3') },
        userSettings: { ...autosaveDisabled.useReviewStore.getState().userSettings, autoSaveReviewDrafts: true },
      },
    })
  );
  const migrated = await loadStore();
  assert.equal(migrated.useReviewStore.getState().reviews['f-20'].status, 'accepted');
  assert.equal(migrated.useReviewStore.getState().reviews['f-20'].notes[0].text, 'Preserved');
  assert.equal(migrated.useReviewStore.getState().reviews['f-01'].status, 'pending');
  assert.equal(migrated.useReviewStore.getState().reviews['f-01'].isEditApplied, true);

  storage.setItem(
    storageKey,
    JSON.stringify({
      version: 2,
      state: {
        reviews: { 'f-20': { status: 'invalid', notes: 'not-an-array' } },
        originalParagraphs: null,
        documents: [{ id: 'broken' }],
        activityLog: 'broken',
        userSettings: { autoSaveReviewDrafts: true },
        zenMode: 'yes',
      },
    })
  );
  const recovered = await loadStore();
  assert.deepEqual(recovered.useReviewStore.getState().reviews, {});
  assert.ok(
    recovered.useReviewStore
      .getState()
      .getDynamicDocuments()
      .some((document) => document.id === contract.id && document.isPrimary)
  );

  storage.setItem(storageKey, '{invalid JSON');
  const originalConsoleError = console.error;
  let hydrationErrors = 0;
  console.error = () => {
    hydrationErrors++;
  };
  try {
    const invalidJson = await loadStore();
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(invalidJson.useReviewStore.getState().reviews, {});
    assert.equal(hydrationErrors, 1);
  } finally {
    console.error = originalConsoleError;
  }
});
