<template>
  <div class="editor h-100">
    <note-tabs-container />
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar" v-if="!readOnly" ref="menubar">
        <div class="editor-note-title clearfix">
          <input
            type="text"
            v-autowidth="{ maxWidth: '100%', comfortZone: 0 }"
            v-model="editedNoteTitle"
            @input="changeTitle"
            placeholder="Enter note title here"
            :readonly="!isOwner"
            class="rounded float-left"
          />
          <button
            class="btn btn-primary float-left"
            v-if="isOwner"
            @click="$parent.handleShowEditShare"
          >
            <mt-icon :path="mdiShareVariantOutline" /> Share
          </button>
          <span class="pl-2 status float-left">
            <small class="text-success" v-if="websocketIsConnected && isLoggedIn">
              <b>Connected</b>
            </small>
            <small class="text-danger" v-else>
              <b>{{disconnectedStatus}}</b>
            </small>
          </span>
          <span class="pl-2 status" v-if="isSyncing">
            Saving...
          </span>
        </div>
        <modal name="linkModal" height="auto" :adaptive="true">
          <form @submit.prevent="updateLink(commands)" class="p-3">
            <h3>{{isUpdateLink ? 'Update link' : 'Add a link'}}</h3>
            <div class="form-group">
              <input type="text" class="form-control" v-model="link" />
            </div>
            <div class="text-right">
              <button type="button" class="btn btn-secondary mr-2" @click="closeInsertLink">Cancel</button>
              <button class="btn btn-primary">Save changes</button>
            </div>
          </form>
        </modal>

        <div class="d-flex justify-content-center">
          <group-button :position="tableMenuPosition" @hidden="onTableMenuHidden">
            <template v-slot:button-content>
              <mt-icon class="icon-table" :path="mdiGrid" />
            </template>
            <sub-menu ref="tableMenu">
              <template v-slot:label>Insert table</template>
              <table-grid-size-editor
                @select="
                  commands.createTable({
                    rowsCount: $event.y + 1,
                    colsCount: $event.x + 1,
                    withHeaderRow: true,
                  })
                "
              />
            </sub-menu>

            <b-dropdown-divider />

            <sub-menu :disabled="!isActive.table()">
              <template v-slot:label>Fill color...</template>
              <color-selector @select="commands.tableBackground($event)" />
            </sub-menu>

            <b-dropdown-divider />

            <b-dropdown-item :disabled="!isActive.table()" @click="commands.addColumnBefore">
              <slot name="label">Insert column before</slot>
            </b-dropdown-item>
            <b-dropdown-item :disabled="!isActive.table()" @click="commands.addColumnAfter">
              <slot name="label">Insert column after</slot>
            </b-dropdown-item>
            <b-dropdown-item :disabled="!isActive.table()" @click="commands.deleteColumn">
              <slot name="label">Delete column</slot>
            </b-dropdown-item>

            <b-dropdown-divider />

            <b-dropdown-item :disabled="!isActive.table()" @click="commands.addRowBefore">
              <slot name="label">Insert row before</slot>
            </b-dropdown-item>
            <b-dropdown-item :disabled="!isActive.table()" @click="commands.addRowAfter">
              <slot name="label">Insert row after</slot>
            </b-dropdown-item>
            <b-dropdown-item :disabled="!isActive.table()" @click="commands.deleteRow">
              <slot name="label">Delete row</slot>
            </b-dropdown-item>

            <b-dropdown-divider />

            <b-dropdown-item :disabled="!isActive.table()" @click="commands.toggleCellMerge">
              <slot name="label">Merge cells</slot>
            </b-dropdown-item>
            <b-dropdown-item :disabled="!isActive.table()" @click="commands.deleteTable">
              <slot name="label">Delete table</slot>
            </b-dropdown-item>
          </group-button>

          <button class="menubar__button" :class="{ active: isActive.bold() }" @click="commands.bold" title="Bold">
            <mt-icon :path="mdiFormatBold"></mt-icon>
          </button>

          <button class="menubar__button" :class="{ active: isActive.italic() }" @click="commands.italic" title="Italic">
            <mt-icon :path="mdiFormatItalic" />
          </button>

          <button
            class="menubar__button"
            :class="{ active: isActive.strike() }"
            @click="commands.strike"
            title="Strikethrough"
          >
            <mt-icon :path="mdiFormatStrikethroughVariant" class="icon-strike" :classNames="['sm']" />
          </button>

          <button
            class="menubar__button"
            :class="{ active: isActive.underline() }"
            @click="commands.underline"
            title="Underline"
          >
            <mt-icon :path="mdiFormatUnderline" class="icon-underline" />
          </button>

          <group-button ref="colorText">
            <template v-slot:button-content>
              <mt-icon :path="mdiFormatColorText" class="icon-text-color" />
              <span class="color-under-bar" :style="{ background: getTextColor() }"></span>
            </template>
            <color-selector
              @select="selectColorText($event, commands)"
              :selectedColor="getTextColor()"
            > Default </color-selector>
          </group-button>

          <button
            class="menubar__button"
            :class="{ 'active': isActive.code_block() }"
            @click="commands.code_block"
            title="Code block"
          >
            <mt-icon :path="mdiCodeTags" />
          </button>

          <group-button
            :toggle-class="`button__text ${isActive.link() ? 'active' : ''}`"
            @click="insertLinkClick($event, isActive)"
            :disabled="!canLink(isActive)"
          >
            <template v-slot:button-content>
              <mt-icon :path="mdiLinkPlus" />
            </template>
            <template v-if="isActive.link()">
              <b-dropdown-item @click="showUpdateLink">
                <slot name="label">Update link</slot>
              </b-dropdown-item>
              <b-dropdown-item @click="removeLink(commands)">
                <slot name="label">Remove link</slot>
              </b-dropdown-item>
            </template>
          </group-button>

          <group-button :toggle-class="`button__text${isActive.heading() ? ' active' : ''}`">
            <template v-slot:button-content><strong>Heading</strong></template>
            <b-dropdown-item :active="isActive.heading({ level: 1 })" @click="commands.heading({ level: 1 })">
              <slot name="label">Heading 1</slot>
            </b-dropdown-item>
            <b-dropdown-item :active="isActive.heading({ level: 2 })" @click="commands.heading({ level: 2 })">
              <slot name="label">Heading 2</slot>
            </b-dropdown-item>
            <b-dropdown-item :active="isActive.heading({ level: 3 })" @click="commands.heading({ level: 3 })">
              <slot name="label">Heading 3</slot>
            </b-dropdown-item>
          </group-button>

          <group-button :toggle-class="`button__text${isAnyAlign(isActive) ? ' active' : ''}`">
            <template v-slot:button-content><strong>Align</strong></template>
            <b-dropdown-item
              :active="isAlign(isActive, { align: 'left' })"
              @click="commands.paragraph({ align: 'left' })"
            >
              <slot name="label">Left</slot>
            </b-dropdown-item>
            <b-dropdown-item
              :active="isAlign(isActive, { align: 'center' })"
              @click="commands.paragraph({ align: 'center' })"
            >
              <slot name="label">Center</slot>
            </b-dropdown-item>
            <b-dropdown-item
              :active="isAlign(isActive, { align: 'right' })"
              @click="commands.paragraph({ align: 'right' })"
            >
              <slot name="label">Right</slot>
            </b-dropdown-item>
            <b-dropdown-item
              :active="isAlign(isActive, { align: 'justify' })"
              @click="commands.paragraph({ align: 'justify' })"
            >
              <slot name="label">Justify</slot>
            </b-dropdown-item>
          </group-button>

          <button
            class="menubar__button"
            :class="{ active: isActive.bullet_list() }"
            @click="commands.bullet_list"
            title="Unordered list"
          >
            <mt-icon :path="mdiFormatListBulleted" class="icon-ul" />
          </button>

          <button
            class="menubar__button"
            :class="{ active: isActive.ordered_list() }"
            @click="commands.ordered_list"
            title="Ordered list"
          >
            <mt-icon :path="mdiFormatListNumbered" class="icon-ol" />
          </button>

          <button class="menubar__button" :class="{ active: isActive.blockquote() }" @click="commands.blockquote">
            <icon name="quote" title="Quote" />
          </button>

          <button class="menubar__button" @click="commands.horizontal_rule">
            <icon name="hr" title="Horizontal line" />
          </button>

          <button class="menubar__button" @click="commands.undo" title="Undo">
            <mt-icon :path="mdiUndoVariant" class="icon-undo" />
          </button>

          <button class="menubar__button" @click="commands.redo" title="Redo">
            <mt-icon :path="mdiRedoVariant" class="icon-redo" />
          </button>

          <div class="separator" v-if="allUserCursors.length"></div>

          <button
            class="menubar__button online-user my-1 font-weight-bold"
            v-for="userCursor in allUserCursors"
            :key="userCursor.id"
            :style="{
              backgroundColor: userCursor.color,
              color: getUserTextColor(userCursor.color),
            }"
            :id="`online-user-${userCursor.id}`"
          >
            <div class="user-initials">
              {{ userCursor.initials }}
            </div>
            <b-popover :target="`online-user-${userCursor.id}`" triggers="hover focus" placement="bottom">
              {{ userCursor.name }}
            </b-popover>
          </button>
        </div>
      </div>
    </editor-menu-bar>
    <div class="editor-top-shadow" ref="editorTopShadow"></div>
    <div
      class="editor-container position-relative"
      ref="editorContainer"
      :class="{ 'overflow-visible': isGuest }"
    >
      <div ref="editor" class="editor-wrapper">
      </div>
    </div>
  </div>
</template>

<script>
import { Editor, EditorMenuBar, Doc, Text } from 'tiptap';
import {
  Blockquote,
  Bold,
  Code,
  CodeBlock,
  HardBreak,
  History,
  HorizontalRule,
  Italic,
  Link,
  Strike,
  TodoItem,
  TodoList,
  Underline,
  TrailingNode,
  Table,
  TableHeader,
  TableCell,
  TableRow,
} from 'tiptap-extensions';
import {
  mdiFormatBold,
  mdiFormatItalic,
  mdiFormatStrikethroughVariant,
  mdiFormatUnderline,
  mdiFormatListBulleted,
  mdiFormatListNumbered,
  mdiFormatAlignLeft,
  mdiFormatAlignCenter,
  mdiFormatAlignRight,
  mdiFormatAlignJustify,
  mdiFormatColorText,
  mdiUndoVariant,
  mdiRedoVariant,
  mdiCodeTags,
  mdiGrid,
  mdiLinkPlus,
  mdiLink,
  mdiShareVariantOutline,
} from '@mdi/js';
import { debounce } from 'vue-debounce';
import { mapGetters } from 'vuex';
import {
  Paragraph,
  Heading,
  ListItem,
  OrderedList,
  Tab,
  Cursor,
  Image,
  BulletList,
  Realtime,
  TableCellMenu,
  TextColor,
  getTextColor,
  SelectionPlaceholder,
  getSelectedText,
  TextSelection,
  ForwardHotkeys,
} from '../../tiptap';
import GroupButton from './GroupButton';
import SubMenu from './SubMenu';
import TableGridSizeEditor from './TableGridSizeEditor';
import ColorSelector from './ColorSelector';
import { getTextColorFromBackground } from '../../../common/collab';
import { isValidURL } from '../../helpers/url';
import NoteTabsContainer from './NoteTabsContainer';

const SHADOW_SCROLL_TOP_THRESHOLD = 200;

export default {
  props: {
    note: { type: Object },
    readOnly: { type: Boolean, default: false },
    isOwner: { type: Boolean, default: true },
    isGuest: { type: Boolean, default: false },
  },
  components: {
    EditorMenuBar,
    GroupButton,
    SubMenu,
    TableGridSizeEditor,
    ColorSelector,
    NoteTabsContainer,
  },
  data() {
    return {
      editor: null,
      editedNoteTitle: '',
      mdiFormatBold,
      mdiFormatItalic,
      mdiFormatStrikethroughVariant,
      mdiFormatUnderline,
      mdiFormatListBulleted,
      mdiFormatListNumbered,
      mdiFormatAlignLeft,
      mdiFormatAlignCenter,
      mdiFormatAlignRight,
      mdiFormatAlignJustify,
      mdiFormatColorText,
      mdiUndoVariant,
      mdiRedoVariant,
      mdiCodeTags,
      mdiGrid,
      mdiLinkPlus,
      mdiLink,
      mdiShareVariantOutline,
      link: '',
      isUpdateLink: false,
    };
  },
  computed: {
    ...mapGetters([
      'tableMenuPosition',
      'allUserCursors',
      'isSyncing',
      'websocketIsConnected',
      'isLoggedIn',
    ]),
    disconnectedStatus() {
      if (!this.websocketIsConnected) {
        return 'Disconnected';
      }
      return 'Not logged in';
    },
  },
  mounted() {
    const extensions = [
      new Doc(),
      new Text(),
      new Paragraph(),
      new Heading({ levels: [1, 2, 3] }),
      new Blockquote(),
      new BulletList(),
      new CodeBlock(),
      new HardBreak(),
      new HorizontalRule(),
      new ListItem(),
      new OrderedList(),
      new TodoItem(),
      new TodoList(),
      new Link(),
      new Bold(),
      new Code(),
      new Italic(),
      new Strike(),
      new Underline(),
      new History(),
      new Image(),
      new Tab(),
      new TrailingNode({
        node: 'paragraph',
        notAfter: ['paragraph'],
      }),
      new Table({
        resizable: true,
      }),
      new TableHeader(),
      new TableCell(),
      new TableRow(),
      new TableCellMenu(),
      new TextColor(),
      new TextSelection(),
      new SelectionPlaceholder({
        store: this.$store,
      }),
      new ForwardHotkeys(this.$store),
    ];
    const { note } = this;
    if (note) {
      extensions.push(new Realtime(note));
      extensions.push(new Cursor({ awareness: this.$store.getters.wsProvider.awareness, }));
      this.editedNoteTitle = note.title;
    }
    const editor = new Editor({
      useBuiltInExtensions: false,
      extensions,
      editable: !this.readOnly,
      onUpdate: () => {
        this.$store.commit('incrementSelectedNoteContentVersion');
        if (this.scrollbar) {
          this.scrollbar.update();
          this.updateTopShadow();
        }
      },
      disableInputRules: true,
      disablePasteRules: true,
    });
    this.editor = editor;
  },
  updated() {
    if (this.$refs.tableMenu) {
      this.$store.commit('setDropdown', this.$refs.tableMenu.$parent);
    }
    if (this.$refs.menubar) {
      this.$store.commit('setMenubar', this.$refs.menubar);
    }
  },
  beforeDestroy() {
    this.editor.destroy();
  },
  methods: {
    isAlign(isActive, value) {
      return isActive.paragraph(value) || isActive.heading(value);
    },
    isAnyAlign(isActive) {
      const values = [
        'left', 'center', 'right', 'justify',
      ];
      return values.some((value) => this.isAlign(isActive, {
        align: value,
      }));
    },
    updateTopShadow() {
      const target = this.scrollbar.getViewElement();
      const shadowPercentage = Math.min(target.scrollTop / SHADOW_SCROLL_TOP_THRESHOLD, 1);
      this.$refs.editorTopShadow.style.opacity = shadowPercentage;
    },
    changeTitle: debounce(function changeTitle() {
      this.$store.dispatch('editNoteTitle', {
        _id: this.note._id,
        title: this.editedNoteTitle,
      });
    }, 500),
    onTableMenuHidden() {
      this.$store.commit('setPosition', { top: 0, left: 0 });
    },
    selectColorText(hexColor, commands) {
      this.$refs.colorText.hide();
      commands.markTextColor({ color: hexColor });
    },
    getTextColor() {
      if (this.editor) {
        return getTextColor(this.editor.state);
      }
    },
    getUserTextColor(bgColor) {
      return getTextColorFromBackground(bgColor).toHexString();
    },
    insertLinkClick(e, isActive) {
      if (!isActive.link()) {
        e.preventDefault();
        return this.showInsertLink();
      }
    },
    showInsertLink() {
      this.isUpdateLink = false;
      const selectedText = getSelectedText(this.editor);
      if (isValidURL(selectedText)) {
        this.link = selectedText;
      }
      this.$store.commit('setEditorSelection', this.editor.selection);
      this.$modal.show('linkModal');
    },
    showUpdateLink() {
      const { link } = this.editor.activeMarkAttrs;
      this.link = link.href;
      this.isUpdateLink = true;
      this.$modal.show('linkModal');
    },
    closeInsertLink() {
      this.link = '';
      this.$modal.hide('linkModal');
      this.editor.focus();
      this.$store.commit('setEditorSelection', {});
      this.isUpdateLink = false;
    },
    updateLink({ link }) {
      link({ href: this.link });
      this.closeInsertLink();
    },
    removeLink({ link }) {
      link({ href: null });
    },
    canLink(isActive) {
      if (isActive.link()) {
        return true;
      }
      const { selection } = this.editor;
      return selection.from !== selection.to;
    },
  },
  watch: {
    editor: {
      immediate: true,
      handler(editor) {
        if (editor && editor.element) {
          const el = this.$refs.editor;
          this.$nextTick(() => {
            el.appendChild(editor.element.firstChild);
            editor.setParentComponent(this);
          });
        }
      },
    },
  },
};
</script>

<style lang="scss">
.icon-table {
  padding: 3px;
  margin-top: -3px;
}
.icon-strike {
  margin-top: -3px;
  padding-bottom: 1px;
}
.icon-underline {
  padding: 2px;
  margin-top: -3px;
}
.icon-text-color {
  padding: 2px;
  margin-top: -5px;
}
.icon-ul,
.icon-ol {
  margin-top: -6px;
}
.icon-undo,
.icon-redo {
  padding: 2px;
  margin-top: -5px;
}
</style>
