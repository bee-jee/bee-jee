import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import NoteExplorer from './components/NoteExplorer';
import NoteEditor from './components/NoteEditor';
import Settings from './components/Settings';
import SplitPane from 'react-split-pane';
import { getConfig } from './selectors/config';
import { connect } from 'react-redux';
import { retrieveConfig, setConfig } from './actions/config';

class App extends React.Component {
  handleExplorerResized = (newSize) => {
    this.props.setConfig('explorerSize', newSize);
  };

  componentDidMount() {
    this.props.retrieveConfig();
  }

  render() {
    return (
      <HashRouter>
        <SplitPane
          split="vertical"
          minSize={200}
          maxSize={500}
          defaultSize={this.props.explorerSize}
          onDragFinished={this.handleExplorerResized}
        >
          <NoteExplorer />
          <Switch>
            <Route exact path="/settings" component={Settings} />
            <Route
              exact path="/:id"
              render={(props) => <NoteEditor key={props.match.params.id} {...props} />}
            />
          </Switch>
        </SplitPane>
      </HashRouter>
    );
  }
}

const mapStateToProps = (state) => ({
  explorerSize: getConfig(state, 'explorerSize'),
});

export default connect(
  mapStateToProps,
  {
    retrieveConfig,
    setConfig,
  },
)(App);
