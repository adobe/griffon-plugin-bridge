/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import connectToParent from 'penpal/lib/connectToParent';

let pluginViewMethods = {};

const getPluginMethod = (name) => {
  const method = pluginViewMethods[name];
  if (!method) {
    throw new Error(`Unable to call ${name}. The plugin must register a ${name} function using pluginBridge.register().`);
  }

  return method.bind(pluginViewMethods);
};

const init = (...args) => {
  getPluginMethod('init')(...args);
};

const receiveEvents = (...args) => {
  getPluginMethod('receiveEvents')(...args);
};

const connectionPromise = connectToParent({
  methods: {
    init,
    receiveEvents
  }
}).promise;

const pluginBridge = {
  register: (methods) => {
    pluginViewMethods = {
      ...methods
    };
    connectionPromise.then(parent => parent.pluginRegistered());
  }
};

const executeQueuedCall = call => Promise.resolve(pluginBridge[call.methodName](...call.args))
  .then(call.resolve, call.reject);

/* eslint-disable no-underscore-dangle */
const callQueue = window.pluginBridge._callQueue;

while (callQueue.length) {
  executeQueuedCall(callQueue.shift());
}

callQueue.push = executeQueuedCall;
