<template>
  <div class="editor h-100">
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar" v-if="!readOnly">
        <button
          class="menubar__button"
          @click="$parent.handleShowEditTitle"
          title="Change title"
          v-if="isOwner"
        >Edit title</button>

        <button
          class="menubar__button"
          @click="$parent.handleShowEditShare"
          title="Share"
          v-if="isOwner"
        >
          <i class="fas fa-share-alt"></i>
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.bold() }"
          @click="commands.bold"
          title="Bold"
        >
          <mt-icon :path="mdiFormatBold"></mt-icon>
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.italic() }"
          @click="commands.italic"
          title="Italic"
        >
          <mt-icon :path="mdiFormatItalic" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.strike() }"
          @click="commands.strike"
          title="Strikethrough"
        >
          <mt-icon :path="mdiFormatStrikethroughVariant" :classNames="['sm']" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.underline() }"
          @click="commands.underline"
          title="Underline"
        >
          <mt-icon :path="mdiFormatUnderline" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.heading({ level: 1 }) }"
          @click="commands.heading({ level: 1 })"
        >H1</button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.heading({ level: 2 }) }"
          @click="commands.heading({ level: 2 })"
        >H2</button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.heading({ level: 3 }) }"
          @click="commands.heading({ level: 3 })"
        >H3</button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.bullet_list() }"
          @click="commands.bullet_list"
          title="Unordered list"
        >
          <mt-icon :path="mdiFormatListBulleted" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.ordered_list() }"
          @click="commands.ordered_list"
          title="Ordered list"
        >
          <mt-icon :path="mdiFormatListNumbered" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.blockquote() }"
          @click="commands.blockquote"
        >
          <icon name="quote" title="Quote" />
        </button>

        <button class="menubar__button" @click="commands.horizontal_rule">
          <icon name="hr" title="Horizontal line" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isAlign(isActive, { align: 'left' }) }"
          @click="commands.paragraph({ align: 'left' })"
          title="Align left"
        >
          <mt-icon :path="mdiFormatAlignLeft" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isAlign(isActive, { align: 'center' }) }"
          @click="commands.paragraph({ align: 'center' })"
          title="Align center"
        >
          <mt-icon :path="mdiFormatAlignCenter" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isAlign(isActive, { align: 'right' }) }"
          @click="commands.paragraph({ align: 'right' })"
          title="Align right"
        >
          <mt-icon :path="mdiFormatAlignRight" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isAlign(isActive, { align: 'justify' }) }"
          @click="commands.paragraph({ align: 'justify' })"
          title="Align justify"
        >
          <mt-icon :path="mdiFormatAlignJustify" />
        </button>

        <button class="menubar__button" @click="commands.undo">
          <icon name="undo" title="Undo" />
        </button>

        <button class="menubar__button" @click="commands.redo">
          <icon name="redo" title="Redo" />
        </button>
      </div>
    </editor-menu-bar>
    <editor-content :editor="editor" ref="editor" class="contenteditable-wrapper" />
  </div>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar, Doc, Text } from 'tiptap';
import {
  Blockquote,
  Bold,
  BulletList,
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
} from '@mdi/js';
import Realtime from '../../tiptap/Realtime';
import { Paragraph } from '../../tiptap/nodes/paragraph';
import { Heading } from '../../tiptap/nodes/heading';
import { ListItem } from '../../tiptap/nodes/listItem';
import { OrderedList } from '../../tiptap/nodes/orderedList';
import TextSelection from '../../tiptap/marks/textSelection';
import MarkdownPreview from '../../tiptap/MarkdownPreview';
import Cursor from '../../tiptap/Cursor';

export default {
  props: {
    note: { type: Object },
    readOnly: { type: Boolean, default: false },
    isOwner: { type: Boolean, default: true },
  },
  components: {
    EditorContent,
    EditorMenuBar,
  },
  data() {
    return {
      editor: null,
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
    };
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
    ];
    const { note } = this;
    if (note) {
      extensions.push(new Realtime(note));
      extensions.push(new Cursor({ note, store: this.$store }));
    }
    const editor = new Editor({
      useBuiltInExtensions: false,
      extensions,
      editable: !this.readOnly,
      onUpdate: () => {
        this.$store.commit('incrementSelectedNoteContentVersion');
      },
      disableInputRules: true,
      disablePasteRules: true,
    });
    this.editor = editor;
  },
  beforeDestroy() {
    this.editor.destroy();
  },
  methods: {
    isAlign(isActive, value) {
      return isActive.paragraph(value)
        || isActive.heading(value);
    },
  },
};
</script>
