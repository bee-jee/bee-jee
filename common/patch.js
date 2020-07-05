import * as Automerge from 'automerge';
import { DIFF_INSERT, DIFF_DELETE, DIFF_EQUAL } from './diff';

class Patch {
  constructor(op, cps, offset) {
    this.op = op;
    this.cps = cps;
    this.offset = offset;
  }
}

/**
 * @return {!Array.<!Patch>} Array of changes.
 */
export function patchesFromDiffs(diffs) {
  const changes = [];
  let offset = 0;
  diffs.forEach((diff) => {
    // The reason we want to do this is because a string can contain
    // unicode characters, if we use `.split('')` it will split into
    // bytes, and therefore unicode characters (multi-byte) will become
    // invalid. And since Automerge only accept unicode character so
    // the offset is the offset of the unicode character rather than
    // the byte offset
    const cps = Array.from(diff.text);
    switch (diff.op) {
      case DIFF_INSERT:
        changes.push(new Patch(diff.op, cps, offset));
        offset += cps.length;
        break;
      case DIFF_DELETE:
        changes.push(new Patch(diff.op, cps, offset));
        break;
      case DIFF_EQUAL:
        offset += cps.length;
        break;
    }
  });
  return changes;
}

export function applyNoteContentChanges(content, patches) {
  return Automerge.change(content, (doc) => {
    patches.forEach(({ cps, offset, op }) => {
      switch (op) {
        case DIFF_INSERT:
          doc.text.insertAt(offset, ...cps);
          break;
        case DIFF_DELETE:
          // Delete backwards to avoid issue with index changes
          // e.g. given the text ABC, and we want to delete BC
          // If we go forward then it will delete B (index 1) first,
          // and the string will become AC, after that we delete C (index 2)
          // which will trigger error because index 2 is outside of length 2.
          // But if we go backward then it will delete C (index 2) first,
          // and the string becomes AB, after that we delete B (index 1)
          // and now it is valid because index 1 is still inside length 2
          // therefore B is deleted, the string becomes A
          for (let i = cps.length - 1; i >= 0; i--) {
            doc.text.deleteAt(offset + i);
          }
          break;
      }
    });
  });
}
