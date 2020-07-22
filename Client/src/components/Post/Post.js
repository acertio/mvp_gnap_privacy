import React, { Component, Fragment } from 'react';

import './Post.css';

class Post extends Component {
  state = {
    interact_url_list: []
  };
  
  componentDidMount () {
    const txResponse = JSON.parse(localStorage.getItem('txResponse'))
    this.setState({
      interact_url_list: [...this.state.interact_url_list, txResponse]
    })
  }

  render () {
    return (
      <Fragment>
        <section>
          {localStorage.getItem('txResponse') && (
            <div>
              {this.state.interact_url_list.map((url, index) => (
                <article className="post" key={index}>
                  <header className="post__header">
                    <h3 className="post__meta">
                      Posted on {new Date().toLocaleDateString('fr-DE')}
                    </h3>
                    <h3 className="post__title">Transaction Handle : 
                      <dd>
                        <span>
                          {url.handle.value}
                        </span>
                      </dd>
                    </h3>
                    <h3 className="post__title">Interaction URL :
                      <dd>
                        <span className="post__url">
                          <a href={url.interaction_url}>{url.interaction_url}</a>
                        </span>
                      </dd>
                    </h3>
                  </header>
                </article>
              ))}
            </div>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Post;
