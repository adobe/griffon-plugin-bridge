/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import connectToParent from 'penpal/lib/connectToParent';

const NOOP = () => {};

let viewPluginMethods = {};

const getPluginMethod = (name) => {
  const method = viewPluginMethods[name];
  if (!method) {
    throw new Error(`Unable to call ${name}. The plugin must register a ${name} function using pluginBridge.register().`);
  }

  return method.bind(viewPluginMethods);
};

const init = (...args) => {
  getPluginMethod('init')(...args);
};

const navigateTo = (...args) => {
  getPluginMethod('navigateTo')(...args);
};

const receiveEvents = (...args) => {
  getPluginMethod('receiveEvents')(...args);
};

const receivePlugins = (...args) => {
  getPluginMethod('receivePlugins')(...args);
};

const receiveSelectedEvents = (...args) => {
  getPluginMethod('receiveSelectedEvents')(...args);
};

const receiveSession = (...args) => {
  getPluginMethod('receiveSession')(...args);
};

const receiveValidation = (...args) => {
  getPluginMethod('receiveValidation')(...args);
};

const connectionPromise = connectToParent({
  methods: {
    init,
    navigateTo,
    receiveEvents,
    receiveSelectedEvents,
    receiveSession,
    receivePlugins,
    receiveValidation
  }
}).promise;

const getParentMethod = methodName => (...args) =>
  connectionPromise.then((parent) => {
    if (parent[methodName]) {
      return parent[methodName](...args);
    }

    throw new Error(`An error occured while calling ${methodName}. The method is unavailable`);
  });

const pluginBridge = {
  annotateEvent: getParentMethod('annotateEvent'),
  annotateSession: getParentMethod('annotateSession'),
  deletePlugin: getParentMethod('deletePlugin'),
  navigateTo: getParentMethod('navigateTo'),
  register: (methods) => {
    viewPluginMethods = {
      navigateTo: NOOP,
      receivePlugins: NOOP,
      receiveValidation: NOOP,
      ...methods
    };
    connectionPromise.then(parent => parent.pluginRegistered());
  },
  selectEvents: getParentMethod('selectEvents'),
  sendCommand:  getParentMethod('sendCommand'),
  uploadPlugin: getParentMethod('uploadPlugin')
};

const executeQueuedCall = call => Promise.resolve(pluginBridge[call.methodName](...call.args))
  .then(call.resolve, call.reject);

/* eslint-disable no-underscore-dangle */
const callQueue = window.pluginBridge._callQueue;

while (callQueue.length) {
  executeQueuedCall(callQueue.shift());
}

callQueue.push = executeQueuedCall;
