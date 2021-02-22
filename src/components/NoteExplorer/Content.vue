<template>
  <div class="note-explorer-content pane-wrapper">
    <collapsible-pane
      title="My notes"
      :expanded="myNotesExpanded"
      @setExpanded="
        (value) => {
          setExpanded('myNotesExpanded', value);
        }
      "
      ref="myNotes"
    >
      <div class="position-relative search-box">
        <input type="text" class="form-control" placeholder="Search" v-model="searchKeyword" />
        <button
          class="btn-icon btn-secondary search-clear btn-grow"
          v-if="searchKeyword"
          @click.prevent="
            () => {
              searchKeyword = '';
            }
          "
        >
          <mt-icon :path="mdiClose" class="icon-clear sm" />
        </button>
      </div>
      <div v-if="isLoading" class="px-3">Loading . . .</div>
      <div v-else-if="allMyNotesTree.length === 0" class="px-3">No notes, you can create one by click "+" button</div>
      <note-explorer-item
        v-for="note in allMyNotesTree"
        :id="`my-note-${note._id}`"
        :key="`note-${note._id}`"
        :note="note"
        :class="{ 'd-none': !note.isShown }"
      />

      <template #actions>
        <div class="actions text-right">
          <button
            type="button"
            class="btn btn-icon btn-grow"
            title="Navigate to note (Ctrl + p)"
            @click.stop="handleShowNavigateToNote"
          >
            <i class="fas fa-search fa-xs"></i>
          </button>
          <button type="button" class="btn btn-icon btn-grow" @click.stop="handleShowCreateNote">
            <i class="fas fa-plus fa-xs"></i>
          </button>
        </div>
      </template>
    </collapsible-pane>

    <collapsible-pane
      ref="sharedNotesPane"
      title="Shared notes"
      :expanded="sharedNotesExpanded"
      @setExpanded="(value) => setExpanded('sharedNotesExpanded', value)"
    >
      <div v-if="isLoadingSharedNotes" class="px-3">Loading . . .</div>
      <div v-if="allSharedNotesTree.length === 0" class="px-3">You don't have any shared notes</div>
      <note-explorer-item
        v-for="note in allSharedNotesTree"
        :key="`shared-note-${note._id}`"
        :note="note"
        :urlBuilder="(note) => `/view-shared/${note._id}`"
      />

      <template v-slot:actions>
        <span v-if="numOfUnviewed > 0" class="badge badge-warning ml-1">{{ numOfUnviewed }}</span>
      </template>
    </collapsible-pane>

    <modal name="createNote" height="auto" draggable=".modal-mover" :adaptive="true" @closed="handleCloseCreateNote">
      <div class="p-3">
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="m-0"><i class="fas fa-arrows-alt modal-mover"></i> Create a new note</h5>
          </div>
        </div>
        <form @submit.prevent="handleCreateNote">
          <div class="card mb-3">
            <div class="card-body">
              <input
                type="text"
                class="form-control"
                v-model="newNoteTitle"
                :class="{ 'is-invalid': newNoteErrors.has('newNoteTitle') }"
                placeholder="Title"
              />
              <p v-if="newNoteErrors.has('newNoteTitle')" class="invalid-feedback">
                {{ newNoteErrors.getFirst('newNoteTitle') }}
              </p>
            </div>
          </div>
          <share-selector
            class="form-group"
            :errors="newNoteErrors"
            v-model="permission"
            :note="{}"
            @cancel="handleCloseCreateNote"
          />
          <div v-if="isCreatingNote">Loading . . .</div>
        </form>
      </div>
    </modal>

    <div class="input-widget pb-1" id="navigate-to-note" v-if="showNavigateNoteWidget">
      <div class="input-widget-header p-1">
        <input
          type="text"
          class="form-control"
          ref="searchNavigateInput"
          v-shortkey="{ up: ['arrowup'], down: ['arrowdown'], enter: ['enter'], esc: ['esc'] }"
          @shortkey="navigateNoteWidgetAction"
          @input="searchNavigate($event.target.value)"
        />
      </div>
      <div class="input-widget-body">
        <navigate-item
          v-for="(note, index) in localNotesForNavigate"
          :key="note._id"
          :note="note"
          :isSelected="index === selectedNavigateNoteWidgetIndex"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { mdiClose } from '@mdi/js';
import hotkeys from 'hotkeys-js';
import CollapsiblePane from './CollapsiblePane';
import NoteExplorerItem from './Item';
import ShareSelector from '../Note/ShareSelector';
import ValidationErrors from '../../helpers/validationErrors';
import MtIcon from '../utilities/MtIcon.vue';
import NavigateItem from './NavigateItem.vue';
import { closest } from '../../helpers/dom';
import { getNoteUrl } from '../../helpers/url';

export default {
  components: {
    CollapsiblePane,
    NoteExplorerItem,
    ShareSelector,
    MtIcon,
    NavigateItem,
  },
  data() {
    return {
      container: null,
      indexedPanes: {},
      newNoteTitle: '',
      newNoteErrors: new ValidationErrors(),
      permission: {},
      initMyNotesScroll: true,
      mdiClose,
      searchKeyword: '',
      localNotesForNavigate: [],
    };
  },
  computed: {
    numOfUnviewed() {
      // return 3;
      // console.log(this.$store.getters.numOfAllUnviewedNotes);
      return this.$store.getters.numOfAllUnviewedNotes;
    },
    sharedNotes() {
      // console.log(this.$store.getters.allSharedNotes);
      return this.$store.getters.allSharedNotes;
    },
    myNotesExpanded: {
      get() {
        return this.$store.getters.config('myNotesExpanded');
      },
      set(value) {
        this.$store.dispatch('setConfig', {
          key: 'myNotesExpanded',
          value,
        });
      },
    },
    sharedNotesExpanded: {
      get() {
        if (this.$store.getters.config('sharedNotesExpanded')) {
          if (this.$refs.sharedNotesPane) {
            this.$refs.sharedNotesPane.invalidate();
          }
        }
        return this.$store.getters.config('sharedNotesExpanded');
      },
      set(value) {
        this.$store.dispatch('setConfig', {
          key: 'sharedNotesExpanded',
          value,
        });
      },
    },
    showNavigateNoteWidget: {
      get() {
        return this.$store.state.notes.showNavigateNoteWidget;
      },
      set(value) {
        this.$store.commit('setShowNavigateNoteWidget', value);
      },
    },
    ...mapGetters([
      'isLoading',
      'isCreatingNote',
      'isLoadingSharedNotes',
      'selectedNote',
      'showCreateNoteModal',
      'newNoteParent',
      'allMyNotesTree',
      'allSharedNotesTree',
      'allNotesForNavigate',
      'selectedNavigateNoteWidgetIndex',
    ]),
  },
  methods: {
    handleCloseCreateNote() {
      this.$modal.hide('createNote');
      this.newNoteTitle = '';
      this.permission = {};
      this.newNoteErrors.reset();
      this.$store.commit('setNewNoteParent', {});
      this.$store.commit('setShowCreateNoteModal', false);
    },
    handleCreateNote() {
      this.newNoteErrors.reset();
      if (this.newNoteTitle.trim() === '') {
        this.newNoteErrors.addError('newNoteTitle', 'Note title cannot be empty');
        return;
      }
      const self = this;
      this.$store
        .dispatch('createNote', {
          title: this.newNoteTitle,
          permission: this.permission,
          parentNoteId: this.newNoteParent._id,
        })
        .then(() => {
          self.handleCloseCreateNote();
        })
        .catch((err) => {
          if (err && err.response) {
            this.newNoteErrors.setErrors(err.response.data.errors);
          }
        });
    },
    setExpanded(name, value) {
      this[name] = value;
    },
    handleShowCreateNote() {
      this.$store.commit('setShowCreateNoteModal', true);
    },
    searchMyNotes(keyword) {
      this.$store.commit('setMyNoteSearchKeyword', keyword);
    },
    handleShowNavigateToNote() {
      this.showNavigateNoteWidget = true;
    },
    hideNavigateNoteWidget(e) {
      if (!closest(e.target, '#navigate-to-note')) {
        this.showNavigateNoteWidget = false;
      }
    },
    setupHotkeys() {
      hotkeys('ctrl+p', (e) => {
        e.preventDefault();
        this.handleShowNavigateToNote();
        this.showNavigateNoteWidget = true;
      });
      document.querySelector('body').addEventListener('click', this.hideNavigateNoteWidget);
    },
    destroyHotkeys() {
      hotkeys.unbind('ctrl+p');
      document.querySelector('body').removeEventListener('click', this.hideNavigateNoteWidget);
    },
    searchNavigate(value) {
      this.$store.commit('setSearchNavigateKeyword', value);
    },
    navigateNoteWidgetAction(e) {
      switch (e.srcKey) {
        case 'up':
          this.$store.commit('decSelectedNavigateNoteWidgetIndex');
          break;
        case 'down':
          this.$store.commit('incSelectedNavigateNoteWidgetIndex');
          break;
        case 'enter': {
          const nodeToNavigate = this.allNotesForNavigate[this.selectedNavigateNoteWidgetIndex];
          if (nodeToNavigate) {
            this.$router.push(getNoteUrl(nodeToNavigate));
          }
          break;
        }
        case 'esc':
          this.$store.commit('setShowNavigateNoteWidget', false);
          break;
      }
    },
    validateNavigateNoteWidgetIndex(notes) {
      let selectedInAllNotesForNavigateIndex = -1;
      if (this.selectedNote) {
        selectedInAllNotesForNavigateIndex = notes.indexOf((note) => note._id === this.selectedNote._id);
      }
      if (selectedInAllNotesForNavigateIndex >= 0) {
        this.$store.commit('setSelectedNavigateNoteWidgetIndex', selectedInAllNotesForNavigateIndex);
      } else if (this.selectedNavigateNoteWidgetIndex < 0) {
        this.$store.commit('setSelectedNavigateNoteWidgetIndex', 0);
      } else if (this.selectedNavigateNoteWidgetIndex >= notes.length) {
        this.$store.commit('setSelectedNavigateNoteWidgetIndex', notes.length - 1);
      }
    },
  },
  mounted() {
    this.$store.dispatch('fetchNumOfUnviewedSharedNutes');
    this.setupHotkeys();
  },
  beforeDestroy() {
    this.destroyHotkeys();
  },
  updated() {
    if (this.initMyNotesScroll) {
      const selectedNoteEl = document.getElementById(`my-note-${this.selectedNote._id}`);
      if (selectedNoteEl) {
        this.$refs.myNotes.scroll((scrollView) => {
          scrollView.scrollTop =
            selectedNoteEl.offsetTop - scrollView.offsetHeight / 2 + selectedNoteEl.offsetHeight / 2;
        });
        this.initMyNotesScroll = false;
      }
    }
  },
  watch: {
    showCreateNoteModal(show) {
      if (show) {
        this.$modal.show('createNote');
      }
    },
    searchKeyword(keyword) {
      this.searchMyNotes(keyword);
    },
    showNavigateNoteWidget(show) {
      if (show) {
        this.$nextTick(() => {
          if (this.$refs.searchNavigateInput) {
            this.$refs.searchNavigateInput.focus();
          }
        });
      } else {
        this.$store.commit('setSearchNavigateKeyword', '');
      }
    },
    allNotesForNavigate(notes) {
      this.localNotesForNavigate = notes;
      this.validateNavigateNoteWidgetIndex(notes);
    },
  },
};
</script>
