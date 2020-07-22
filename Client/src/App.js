import React, { Component, Fragment } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import Toolbar from './components/Toolbar/Toolbar';
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation';
import MobileNavigation from './components/Navigation/MobileNavigation/MobileNavigation';
import PostsPage from './pages/Transaction/Transaction';
import CallbackPage from './pages/Callback/Callback';

import './App.css';

class App extends Component {
  state = {
    error: null
  };

  componentDidMount() {
    //
  }

  errorHandler = () => {
    this.setState({ error: null });
  };
  render() {
      let routes = (
        <Switch>
          <Route
            path="/"
            exact
            component = { PostsPage }
          />
          <Route 
            path="/Callback/" 
            component ={ CallbackPage }
          />
        </Switch>
      );
    return (
      <Fragment>
        <Layout
          header={
            <Toolbar>
              <MainNavigation
              />
            </Toolbar>
          }
          mobileNav={
            <MobileNavigation
              mobile
            />
          }
        />
        {routes}
      </Fragment>
    );
  }
}

export default withRouter(App);
