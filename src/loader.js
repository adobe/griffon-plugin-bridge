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

// Prevent double-loading of plugin bridge.
if (!window.pluginBridge) {
  const childPath = '/pluginBridge/pluginBridge-child.min.js';

  window.pluginBridge = { _callQueue: [] };

  const anchor = document.createElement('a');
  anchor.href = document.referrer;

  const port = anchor.port ? `:${anchor.port}` : '';
  const childURL = `${anchor.protocol}//${anchor.hostname}${port}${childPath}`;

  [
    'register'
  ].forEach((methodName) => {
    window.pluginBridge[methodName] = (...args) => new Promise((resolve, reject) => {
      /* eslint-disable no-underscore-dangle */
      window.pluginBridge._callQueue.push({
        methodName,
        args,
        resolve,
        reject
      });
    });
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = childURL;

  const firstDocScript = document.getElementsByTagName('script')[0];
  firstDocScript.parentNode.insertBefore(script, firstDocScript);
}
