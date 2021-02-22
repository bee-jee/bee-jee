export function getElementHeight(el) {
  let height, margin;
  if (document.all) {
    // IE
    height = el.currentStyle.height;
    margin = parseInt(el.currentStyle.marginTop, 10) + parseInt(el.currentStyle.marginBottom, 10);
  } else {
    // Mozilla
    height = parseFloat(document.defaultView.getComputedStyle(el, '').height);
    margin =
      parseInt(document.defaultView.getComputedStyle(el, '').getPropertyValue('margin-top')) +
      parseInt(document.defaultView.getComputedStyle(el, '').getPropertyValue('margin-bottom'));
  }
  return height + margin;
}

export function offset(el) {
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left };
}

export function closest(el, selector) {
  let matchesFn;

  // find vendor prefix
  ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (
    fn,
  ) {
    if (typeof document.body[fn] == 'function') {
      matchesFn = fn;
      return true;
    }
    return false;
  });

  let parent;

  // traverse parents
  while (el) {
    parent = el.parentElement;
    if (parent && parent[matchesFn](selector)) {
      return parent;
    }
    el = parent;
  }

  return null;
}
