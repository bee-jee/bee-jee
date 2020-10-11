<template>
  <div class="editor h-100">
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar d-flex justify-content-center" v-if="!readOnly" ref="menubar">
        <button class="menubar__button" @click="$parent.handleShowEditShare" title="Share" v-if="isOwner">
          <i class="fas fa-share-alt"></i>
        </button>

        <group-button :position="tableMenuPosition" @hidden="onTableMenuHidden">
          <template v-slot:button-content>
            <mt-icon :path="mdiGrid" />
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
          <mt-icon :path="mdiFormatStrikethroughVariant" :classNames="['sm']" />
        </button>

        <button
          class="menubar__button"
          :class="{ active: isActive.underline() }"
          @click="commands.underline"
          title="Underline"
        >
          <mt-icon :path="mdiFormatUnderline" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.code_block() }"
          @click="commands.code_block"
          title="Code block"
        >
          <mt-icon :path="mdiCodeTags" />
        </button>

        <button
          class="menubar__button"
          :class="{ active: isActive.heading({ level: 1 }) }"
          @click="commands.heading({ level: 1 })"
        >
          H1
        </button>

        <button
          class="menubar__button"
          :class="{ active: isActive.heading({ level: 2 }) }"
          @click="commands.heading({ level: 2 })"
        >
          H2
        </button>

        <button
          class="menubar__button"
          :class="{ active: isActive.heading({ level: 3 }) }"
          @click="commands.heading({ level: 3 })"
        >
          H3
        </button>

        <button
          class="menubar__button"
          :class="{ active: isActive.bullet_list() }"
          @click="commands.bullet_list"
          title="Unordered list"
        >
          <mt-icon :path="mdiFormatListBulleted" />
        </button>

        <button
          class="menubar__button"
          :class="{ active: isActive.ordered_list() }"
          @click="commands.ordered_list"
          title="Ordered list"
        >
          <mt-icon :path="mdiFormatListNumbered" />
        </button>

        <button class="menubar__button" :class="{ active: isActive.blockquote() }" @click="commands.blockquote">
          <icon name="quote" title="Quote" />
        </button>

        <button class="menubar__button" @click="commands.horizontal_rule">
          <icon name="hr" title="Horizontal line" />
        </button>

        <button
          class="menubar__button"
          :class="{ active: isAlign(isActive, { align: 'left' }) }"
          @click="commands.paragraph({ align: 'left' })"
          title="Align left"
        >
          <mt-icon :path="mdiFormatAlignLeft" />
        </button>

        <button
          class="menubar__button"
          :class="{ active: isAlign(isActive, { align: 'center' }) }"
          @click="commands.paragraph({ align: 'center' })"
          title="Align center"
        >
          <mt-icon :path="mdiFormatAlignCenter" />
        </button>

        <button
          class="menubar__button"
          :class="{ active: isAlign(isActive, { align: 'right' }) }"
          @click="commands.paragraph({ align: 'right' })"
          title="Align right"
        >
          <mt-icon :path="mdiFormatAlignRight" />
        </button>

        <button
          class="menubar__button"
          :class="{ active: isAlign(isActive, { align: 'justify' }) }"
          @click="commands.paragraph({ align: 'justify' })"
          title="Align justify"
        >
          <mt-icon :path="mdiFormatAlignJustify" />
        </button>

        <button class="menubar__button" @click="commands.undo" title="Undo">
          <mt-icon :path="mdiUndoVariant" />
        </button>

        <button class="menubar__button" @click="commands.redo" title="Redo">
          <mt-icon :path="mdiRedoVariant" />
        </button>
      </div>
    </editor-menu-bar>
    <div class="editor-top-shadow" ref="editorTopShadow"></div>
    <div class="editor-container position-relative" ref="editorContainer">
      <div ref="editor" class="editor-wrapper">
        <div class="editor-note-title">
          <input
            type="text"
            v-model="editedNoteTitle"
            @input="changeTitle"
            placeholder="Enter note title here"
            :readonly="!isOwner"
          />
        </div>
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
  mdiUndoVariant,
  mdiRedoVariant,
  mdiCodeTags,
  mdiGrid,
} from '@mdi/js';
import GeminiScrollbar from 'gemini-scrollbar';
import { debounce } from 'vue-debounce';
import { mapGetters } from 'vuex';
import {
  Paragraph,
  Heading,
  ListItem,
  OrderedList,
  Tab,
  TextSelection,
  MarkdownPreview,
  Cursor,
  Image,
  BulletList,
  Realtime,
  TableCellMenu,
} from '../../tiptap';
import GroupButton from './GroupButton';
import SubMenu from './SubMenu';
import TableGridSizeEditor from './TableGridSizeEditor';
import ColorSelector from './ColorSelector';

const SHADOW_SCROLL_TOP_THRESHOLD = 200;

export default {
  props: {
    note: { type: Object },
    readOnly: { type: Boolean, default: false },
    isOwner: { type: Boolean, default: true },
  },
  components: {
    EditorMenuBar,
    GroupButton,
    SubMenu,
    TableGridSizeEditor,
    ColorSelector,
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
      mdiUndoVariant,
      mdiRedoVariant,
      mdiCodeTags,
      mdiGrid,
    };
  },
  computed: {
    ...mapGetters(['tableMenuPosition']),
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
      new TextSelection(),
      new MarkdownPreview(),
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
    ];
    const { note } = this;
    if (note) {
      extensions.push(new Realtime(note));
      extensions.push(new Cursor({ note, store: this.$store }));
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
    initialiseScrollbar() {
      this.scrollbar = new GeminiScrollbar({
        element: this.$refs.editorContainer,
        createElements: true,
      });
      this.scrollbar.create();
      this.scrollbar.update();
      this.scrollbar.getViewElement().onscroll = () => {
        this.updateTopShadow();
      };
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
            this.initialiseScrollbar();
          });
        }
      },
    },
  },
};
</script>
