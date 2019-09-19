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

const CONNECTION_TIMEOUT_DURATION = 10000;
const RENDER_TIMEOUT_DURATION = 2000;

const noop = () => {};

export const ERROR_CODES = {
  CONNECTION_TIMEOUT: 'connectionTimeout',
  RENDER_TIMEOUT: 'renderTimeout',
  DESTROYED: 'destroyed'
};

let destroy;

/**
 * Loads a plugin iframe and connects all the necessary APIs.
 * @param {Object} options
 * @param {string} options.iframe The iframe loading the plugin.
 * @param {Object} [options.pluginInitOptions={}] The options to be passed to the initial init()
 * call on the plugin view.
 * @param {Function} [options.annotateEvent] The function to call when the plugin view requests
 * that an event should be annotated. It should return a promise to be resolved with the
 * result of the request.
 * @param {Function} [options.selectEvent] The function to call when a main plugin view requests
 * that an event should be selected. This will toggle selectedEvents for a secondary plugin view.
 * This function should return a promise to be resolved with the result of the selection.
 * result of the request.
 * @param {number} [options.connectionTimeoutDuration=10000] The amount of time, in milliseconds,
 * that must pass while attempting to establish communication with the iframe before rejecting
 * the returned promise with a CONNECTION_TIMEOUT error code.
 * @param {number} [options.renderTimeoutDuration=2000] The amount of time, in milliseconds,
 * that must pass while attempting to render the iframe before rejecting the returned promise
 * with a RENDER_TIMEOUT error code. This duration begins after communication with the iframe
 * has been established.
 */
export const loadIframe = (options) => {
  const {
    annotateEvent = noop,
    connectionTimeoutDuration = CONNECTION_TIMEOUT_DURATION,
    debug = false,
    iframe,
    pluginInitOptions,
    renderTimeoutDuration = RENDER_TIMEOUT_DURATION,
    selectEvent = noop
  } = options;

  const loadPromise = new Promise((resolve, reject) => {
    let renderTimeoutId;

    const connection = connectToChild({
      iframe,
      timeout: connectionTimeoutDuration,
      methods: {
        annotateEvent,
        pluginRegistered: () => {
          connection.promise.then((child) => {
            child.init(pluginInitOptions).then(() => {
              clearTimeout(renderTimeoutId);
              resolve({
                // We hand init back even though we just called init(). This is really for
                // the sandbox tool's benefit so a developer testing their plugin view can
                // initialize multiple times with different info.
                init: child.init,
                receiveEvents: child.receiveEvents,
                selectedEvents: child.selectedEvents
              });
            }).catch((error) => {
              clearTimeout(renderTimeoutId);
              reject(error);
            });
          });
        },
        selectEvent
      },
      debug
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

    destroy = () => {
      reject(ERROR_CODES.DESTROYED);
      connection.destroy();
    };
  });

  return {
    destroy,
    promise: loadPromise
  };
};
