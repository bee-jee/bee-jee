import Automerge from 'automerge';
import { applyNoteContentChanges, patchesFromDiffs } from '../../common/patch';
import { DIFF_INSERT, DIFF_EQUAL, DIFF_DELETE } from '../../common/diff';
import { assert } from 'chai';

describe('mixins/noteMixins.js', () => {
  it('apply changes correctly', () => {
    let content = Automerge.from({
      text: new Automerge.Text('ABC'),
    });
    let diffs = [
      { op: DIFF_INSERT, text: 'A' },
      { op: DIFF_EQUAL, text: 'AB' },
      { op: DIFF_DELETE, text: 'C' },
    ];
    let changes = patchesFromDiffs(diffs);
    content = applyNoteContentChanges(content, changes);
    assert.equal(content.text.toString(), 'AAB');
    assert.deepEqual(changes, [
      { op: DIFF_INSERT, cps: Array.from('A'), offset: 0 },
      { op: DIFF_DELETE, cps: Array.from('C'), offset: 3 },
    ]);

    content = Automerge.from({
      text: new Automerge.Text('ABC'),
    });
    diffs = [
      { op: DIFF_DELETE, text: 'ABC' },
      { op: DIFF_INSERT, text: 'This is a content' },
    ];
    changes = patchesFromDiffs(diffs);
    content = applyNoteContentChanges(content, changes);
    assert.equal(content.text.toString(), 'This is a content');
    assert.deepEqual(changes, [
      { op: DIFF_DELETE, cps: Array.from('ABC'), offset: 0 },
      { op: DIFF_INSERT, cps: Array.from('This is a content'), offset: 0 },
    ]);

    content = Automerge.from({
      text: new Automerge.Text('AABBCC'),
    });
    diffs = [
      { op: DIFF_EQUAL, text: 'A' },
      { op: DIFF_DELETE, text: 'AB' },
      { op: DIFF_INSERT, text: 'DDD' },
      { op: DIFF_EQUAL, text: 'BC' },
      { op: DIFF_INSERT, text: 'D' },
      { op: DIFF_EQUAL, text: 'C' },
      { op: DIFF_INSERT, text: ' Yes' },
    ];
    changes = patchesFromDiffs(diffs);
    content = applyNoteContentChanges(content, changes);
    assert.equal(content.text.toString(), 'ADDDBCDC Yes');
    assert.deepEqual(changes, [
      { op: DIFF_DELETE, cps: Array.from('AB'), offset: 1 },
      { op: DIFF_INSERT, cps: Array.from('DDD'), offset: 1 },
      { op: DIFF_INSERT, cps: Array.from('D'), offset: 6 },
      { op: DIFF_INSERT, cps: Array.from(' Yes'), offset: 8 },
    ]);
  });
})
