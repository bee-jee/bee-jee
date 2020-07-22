class PageResponse {
  static modulus = 5;

  items = [];
  totalCount = 0;
  countPerPage = 0;
  currentPage = 1;
  numPages = 1;

  constructor(payload) {
    const { items, totalCount, countPerPage, currentPage } = (payload || {});
    this.items = items || [];
    this.totalCount = totalCount || 0;
    this.countPerPage = countPerPage || 1;
    this.currentPage = parseFloat(currentPage) || 1;

    if (countPerPage !== 0) {
      this.numPages = Math.ceil(this.totalCount / this.countPerPage);
    }
  }

  getItems() {
    return this.items;
  }

  getNumPages() {
    return this.numPages;
  }

  getCurrentPage() {
    return parseFloat(this.currentPage);
  }

  getPages() {
    let isFarFromFirst = false;
    let isFarFromLast = false;
    let pages = [];
    const pageCount = this.getNumPages();
    const page = this.getCurrentPage();
    let start = 0, end = 0;
    const modulus = PageResponse.modulus;

    if (pageCount > modulus) {
      const half = Math.floor(modulus / 2);
      end = page + half;
      start = page - half;
      if (start < 1) {
        end = Math.min(pageCount, end + (1 - start));
        start = 1;
      }
      if (end > pageCount) {
        start = Math.max(1, start - (end - pageCount));
        end = pageCount;
      }
      if (start > 2) {
        isFarFromFirst = true;
      }
      if (end < (pageCount - 1)) {
        isFarFromLast = true;
      }
    } else {
      start = 1;
      end = pageCount;
    }
    if (start !== 1) {
      pages.push({
        id: 'page-1',
        page: 1,
        label: '1',
      });
      if (isFarFromFirst) {
        pages.push({
          id: 'left-...',
          label: '...',
        });
      }
    }
    if (end < start) {
      end = start;
    }
    for (let i = start; i <= end; i++) {
      pages.push({
        id: `page-${i}`,
        page: i,
        label: `${i}`,
      });
    }
    if (pageCount > 0 && end !== pageCount) {
      if (isFarFromLast) {
        pages.push({
          id: `right-...`,
          label: '...',
        });
      }
      pages.push({
        id: `page-${pageCount}`,
        page: pageCount,
        label: `${pageCount}`,
      });
    }

    return pages;
  }
}

export default PageResponse;
