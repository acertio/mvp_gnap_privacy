import React, { Component, Fragment } from 'react';

import Post from '../../components/Post/Post';
import Button from '../../components/Button/Button';
import './Transaction.css';

class Transaction extends Component {
  
  generateRandomString = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  postTransaction = async() => {
    let tx = {
      display: {
        name: "XYZ Redirect Client",
        uri: "http://localhost:3000"
      },
      interact: {
        redirect: true,
        callback: {
            uri: "http://localhost:3000/Callback",
            nonce: this.generateRandomString(20)
        }
      },
      resources : {
        token1 : [
          {
            action : ["open", "check_availability"],
            locations : ["http://localhost:8080/as/room1"],
            datatypes : []
          }
        ],
        token2 : [
          {
            action : ["open", "check_availability"],
            locations : ["http://localhost:8080/as/room2"],
            datatypes : []
          }
        ]
      },
      claims: {
        subject: "02F861EA250FE40BB393AAF978C6E2A4",
        email: "user@example.com"
      },
      user: {
        assertion: "",
        type: "oidc_id_token"
      },
      keys: {
        proof : "OAUTHPOP",
        jwk : {
          "kty":"RSA",
          "e":"AQAB",
          "kid":"xyz-client",
          "alg":"RS256",
          "n":"zwCT_3bx-glbbHrheYpYpRWiY9I-nEaMRpZnRrIjCs6b_emyTkBkDDEjSysi38OC73hj1-WgxcPdKNGZyIoH3QZen1MKyyhQpLJG1-oLNLqm7pXXtdYzSdC9O3-oiyy8ykO4YUyNZrRRfPcihdQCbO_OC8Qugmg9rgNDOSqppdaNeas1ov9PxYvxqrz1-8Ha7gkD00YECXHaB05uMaUadHq-O_WIvYXicg6I5j6S44VNU65VBwu-AlynTxQdMAWP3bYxVVy6p3-7eTJokvjYTFqgDVDZ8lUXbr5yCTnRhnhJgvf3VjD_malNe8-tOqK5OSDlHTy6gD9NqdGCm-Pm3Q"
        }
      }
    }
    localStorage.setItem('txTransaction', JSON.stringify(tx))
    let url = 'http://localhost:8080/as/transaction';
    let method = 'POST'
    await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tx)

    }) 
    .then(res => {
      return res.json();
    })
    .then(resultData => {
      localStorage.setItem('txResponse', JSON.stringify(resultData))
    })
  };

  render() {
    return (
      <Fragment>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={ async () => {
            await this.postTransaction(); 
            window.location.reload(false);
          }}>
            New Transaction
          </Button>
        </section>
        <section>
          <div>
            <Post />
          </div>
        </section>
      </Fragment>
    )
  }
}

export default Transaction;
