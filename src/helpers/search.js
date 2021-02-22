export function fuzzysearch(needle, haystack) {
  let tlen = haystack.length;
  let qlen = needle.length;
  let indexes = [];
  if (qlen > tlen) {
    return [false, indexes];
  }
  if (qlen === tlen) {
    const isEqual = needle === haystack;
    if (isEqual) {
      indexes = new Array(tlen);
      for (let i = 0; i < tlen; i++) {
        indexes[i] = i;
      }
    }
    return [isEqual, indexes];
  }
  outer: for (let i = 0, j = 0; i < qlen; i++) {
    let nch = needle.charCodeAt(i);
    while (j < tlen) {
      if (haystack.charCodeAt(j++) === nch) {
        indexes.push(j - 1);
        continue outer;
      }
    }
    return [false, indexes];
  }
  return [true, indexes];
}
