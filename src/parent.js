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

import connectToChild from 'penpal/lib/connectToChild';
import { ERR_CONNECTION_TIMEOUT } from 'penpal/lib/errorCodes';

const RENDER_TIMEOUT_DURATION = 2000;

export const ERROR_CODES = {
  RENDER_TIMEOUT: 'renderTimeout',
  EXTENSION_RESPONSE_TIMEOUT: 'extensionResponseTimeout',
  DESTROYED: 'destroyed'
};

export const loadIframe = (options) => {
  const {
    iframe,
    renderTimeoutDuration = RENDER_TIMEOUT_DURATION
  } = options;

  const loadPromise = new Promise((resolve, reject) => {
    let renderTimeoutId;

    const connection = connectToChild({
      iframe,
      methods: {
        pluginRegistered: () => {
          connection.promise.then((child) => {
            clearTimeout(renderTimeoutId);
            resolve({
              receiveEvents: (...args) => child.receiveEvents(...args)
            });
          });
        }
      }
    });

    connection.promise.then(() => {
      renderTimeoutId = setTimeout(() => {
        reject(ERROR_CODES.RENDER_TIMEOUT);
        destroy();
      }, renderTimeoutDuration);
    }, (error) => {
      if (error.code === ERR_CONNECTION_TIMEOUT) {
        reject(ERROR_CODES.CONNECTION_TIMEOUT);
      } else {
        reject(error);
      }
    });

    const destroy = () => {
      reject(ERROR_CODES.DESTROYED);
      connection.destroy();
    };
  });

  return loadPromise;
};
