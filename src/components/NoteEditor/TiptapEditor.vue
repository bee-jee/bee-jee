<template>
  <div class="editor h-100">
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar">
        <button
          class="menubar__button"
          :class="{ 'active': isActive.bold() }"
          @click="commands.bold"
        >
          <icon name="bold" title="Bold" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.italic() }"
          @click="commands.italic"
        >
          <icon name="italic" title="Italic" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.strike() }"
          @click="commands.strike"
        >
          <icon name="strikethrough" title="Strikethrough" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.underline() }"
          @click="commands.underline"
        >
          <icon name="underline" title="Underline" />
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
        >
          <icon name="unordered-list" title="Unordered list" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'active': isActive.ordered_list() }"
          @click="commands.ordered_list"
        >
          <icon name="ordered-list" title="Ordered list" />
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

        <button class="menubar__button" @click="commands.undo">
          <icon name="undo" title="Undo" />
        </button>

        <button class="menubar__button" @click="commands.redo">
          <icon name="redo" title="Redo" />
        </button>
      </div>
    </editor-menu-bar>
    <editor-content :editor="editor" ref="editor" class="ql-container ql-snow" />
  </div>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar } from 'tiptap';
import {
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  HardBreak,
  Heading,
  History,
  HorizontalRule,
  Italic,
  Link,
  ListItem,
  OrderedList,
  Strike,
  TodoItem,
  TodoList,
  Underline,
} from 'tiptap-extensions';
import Realtime from '../../tiptap/Realtime';

export default {
  props: {
    note: { type: Object },
    readOnly: { type: Boolean, default: false },
  },
  components: {
    EditorContent,
    EditorMenuBar,
  },
  data() {
    return {
      editor: null,
    };
  },
  mounted() {
    const extensions = [
      new Blockquote(),
      new BulletList(),
      new CodeBlock(),
      new HardBreak(),
      new Heading({ levels: [1, 2, 3] }),
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
    ];
    const { note } = this;
    if (note) {
      extensions.push(new Realtime(note));
    }
    const editor = new Editor({
      extensions,
      editable: !this.readOnly,
      onUpdate: () => {
        this.$store.commit('incrementSelectedNoteContentVersion');
      },
    });
    this.editor = editor;
  },
  beforeDestroy() {
    this.editor.destroy();
  },
};
</script>
