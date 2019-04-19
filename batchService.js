const express = require('express');
const request = require('request-promise-native');
const bodyParser = require('body-parser');

// just and example
// use it as body for your POST request
const bodyFormat = {
  "endpoint": {
    "url": "https://guesty-user-service.herokuapp.com/user/{userId}",
    "method": "PUT"
  }, 
  "params": [
    {
      "pathParams": [ { "key": "{userId}", "value": "ja2S-hs81-ksn3-iQI9" } ],
      "requestBody": { "age": 30 }
    },
    {
      "pathParams": [ { "key": "{userId}", "value": 99 } ],
      "requestBody": { "age": 30 }
    },
    {
      "pathParams": [ { "key": "{userId}", "value": 103 } ],
      "requestBody": { "age": 30 }
    }
  ]
}

const app = express();
app.use(bodyParser.json());

app.post('/batch', async (req, res) => {
  const task = req.body;

  const requests = [];
  for(let param of task.params) {

    const urlWithParams = param.pathParams.reduce((acc, cur) => {
      return acc.replace(cur.key, cur.value);
    }, task.endpoint.url);

    requests.push(makeRequest(task.endpoint.method, urlWithParams, param.requestBody));
  };

  const results = await Promise.all(requests); 

  const finalResponse = results
    .map(r => `${r.statusCode}: ${r.request ? r.request.href : r.options.url}`);

  res.send(finalResponse);
});

function makeRequest(method, url, body, retryCount = 1) {
  return request({
    url: url,
    method: method,
    body: JSON.stringify(body),
    resolveWithFullResponse: true
  })
  .then(response => {
    console.log('success ', url);
    return Promise.resolve(response);
  })
  .catch(err => {
    console.log('error ', err.statusCode ,url);
    if (err.statusCode === 429) {
      return wait(5).then(() => makeRequest(method, url, body, retryCount))
    }
    if (retryCount > 0) {
      console.log('retrying ', url);
      return makeRequest(method, url, body, retryCount - 1)
    }
    console.log('fail ', url);
    return Promise.resolve(err);
  });
}

function wait(seconds) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

app.listen(5000);