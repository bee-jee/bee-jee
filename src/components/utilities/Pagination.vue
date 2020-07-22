<template>
  <ul class="pagination">
    <li class="page-item" :class="{ disabled: !hasPrev }">
      <router-link class="page-link" :to="pageUrl(prevPage)" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
        <span class="sr-only">Previous</span>
      </router-link>
    </li>
    <li
      class="page-item"
      v-for="page in pages"
      :key="page.id"
      :class="{ disabled: !page.page, active: page.page === currentPage }"
    >
      <router-link class="page-link" :to="pageUrl(page.page)">{{page.label}}</router-link>
    </li>
    <li class="page-item" :class="{ disabled: !hasNext }">
      <router-link class="page-link" :to="pageUrl(nextPage)" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
        <span class="sr-only">Next</span>
      </router-link>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    currentPage: { type: Number },
    pages: { type: Array },
    pageUrl: { type: Function },
  },
  computed: {
    hasPrev() {
      return this.currentPage > 1;
    },
    prevPage() {
      if (this.hasPrev) {
        return this.currentPage - 1;
      }
      return this.currentPage;
    },
    hasNext() {
      return this.currentPage < this.pages[this.pages.length - 1].page;
    },
    nextPage() {
      if (this.hasNext) {
        return this.currentPage + 1;
      }
      return this.currentPage;
    },
  },
};
</script>
