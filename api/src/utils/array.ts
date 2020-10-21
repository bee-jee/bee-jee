export function arrayIncludes<T>(haystack: T[], needle: T, fn: (v: T) => string): boolean {
  const needleKey = fn(needle);
  for (let i = 0; i < haystack.length; i++) {
    if (fn(haystack[i]) === needleKey) {
      return true;
    }
  }
  return false;
}

export function arrayDiff<T>(arr1: T[], arr2: T[], fn: (v: T) => string): T[] {
  return arr1.filter((value) => !arrayIncludes<T>(arr2, value, fn));
}
