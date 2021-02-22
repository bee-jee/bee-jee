export function groupIndexes(indexes) {
  return indexes.reduce((r, n) => {
    const lastSubArray = r[r.length - 1];

    if (!lastSubArray || lastSubArray[lastSubArray.length - 1] !== n - 1) {
      r.push([]);
    }

    r[r.length - 1].push(n);

    return r;
  }, []);
}
