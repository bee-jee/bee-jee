import React from 'react';
import { connect } from 'react-redux';
import { changeNoteTitle, changeNoteContent, setSelectedNote } from '../actions/notes';
import { getSelectedNote } from '../selectors/notes';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import { getConfig, toContentType, toEditType } from '../selectors/config';

class NoteEditor extends React.Component {
  editorRef = React.createRef();

  updateTitle = (title) => {
    this.props.changeNoteTitle({
      _id: this.props.note._id,
      title,
    });
  }

  handleContentUpdate = () => {
    const tuiEditor = this.editorRef.current.getInstance();
    const contentType = toContentType(tuiEditor.currentMode);
    let content = () => {
      return '';
    };
    switch (contentType) {
      case 'html':
        content = () => tuiEditor.getHtml();
        break;
      case 'markdown':
        content = () => tuiEditor.getMarkdown();
        break;
      default:
        break;
    }
    this.props.changeNoteContent({
      _id: this.props.note._id,
      content,
      contentType,
    });
  }

  getEditType = (note) => {
    return note.contentType ? toEditType(note.contentType) : this.props.defaultEditorEditType;
  }

  componentDidMount() {
    this.props.setSelectedNote({
      _id: this.props.match.params.id,
    });
  }

  componentWillUnmount() {
    this.props.setSelectedNote({
      _id: '',
    });
  }

  render() {
    const { note } = this.props;
    return (
      <div className="note-editor container-fluid py-3">
        {note._id ? (
          <div className="row note-editor-container">
            <div className="col-12 form-group">
              <input
                type="text"
                className="title"
                placeholder="Title"
                onChange={(e) => { this.updateTitle(e.target.value) }}
                value={note.title}
              />
            </div>
            <div className="col-12 form-group note-content-editor-container">
              <Editor
                height="100%"
                initialEditType={this.getEditType(note)}
                ref={this.editorRef}
                onChange={(param) => this.handleContentUpdate(param)}
                initialValue={note.content}
                usageStatistics={false}
                previewHighlight={true}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  note: getSelectedNote(state),
  defaultEditorEditType: getConfig(state, 'defaultEditorEditType'),
});

export default connect(
  mapStateToProps,
  {
    changeNoteTitle,
    changeNoteContent,
    setSelectedNote,
  },
)(NoteEditor);
