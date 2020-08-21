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
  const rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}
