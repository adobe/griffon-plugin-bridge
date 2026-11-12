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
import { loadIframe, ERROR_CODES } from '../../src/parent';

const NOOP = () => {};

// The no-outcome guard in waitForTrackEventOutcome (4s) must sit comfortably inside
// the spec timeout, so allow slow CI more budget than Jasmine's 5s default. The
// fake-clock spec below ticks manually and is unaffected.
jasmine.DEFAULT_TIMEOUT_INTERVAL = 8000;

// The griffonAPIs fixture reports back how its trackEvent call settled, so a
// spec can assert that the child's promise actually resolved rather than the
// call failing silently. Only messages from the given iframe count, so a
// delayed outcome from another spec's fixture cannot satisfy this assertion.
const waitForTrackEventOutcome = iframe => new Promise((resolve) => {
  let timeoutId;
  const onMessage = (event) => {
    if (event.source === iframe.contentWindow
      && event.data
      && event.data.type === 'trackEventOutcome') {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeoutId);
      resolve(event.data.outcome);
    }
  };
  // If the message never arrives (broken fixture or lost connection), drop
  // the listener and let the assertion fail with a clear value instead of
  // waiting for jasmine's spec timeout.
  timeoutId = setTimeout(() => {
    window.removeEventListener('message', onMessage);
    resolve('no-outcome');
  }, 4000);
  window.addEventListener('message', onMessage);
});

describe('parent', () => {
  let bridge;

  const createAndLoadIframe = (fixture, options) => {
    const iframe = document.createElement('iframe');
    iframe.src = `http://${window.location.hostname}:9800/${fixture}`;
    document.body.appendChild(iframe);

    const result = loadIframe({ iframe, ...options });
    result.iframe = iframe;
    return result;
  };

  afterEach(() => {
    if (bridge) {
      bridge.destroy();
      bridge.iframe.remove();
    }
  });

  it('loads an iframe and provides API', (done) => {
    bridge = createAndLoadIframe('registerPlugin.html');

    expect(bridge.destroy).toEqual(jasmine.any(Function));
    expect(bridge.promise).toEqual(jasmine.any(Promise));

    bridge.promise.then((child) => {
      expect(child.init).toEqual(jasmine.any(Function));
      expect(child.navigateTo).toEqual(jasmine.any(Function));
      expect(child.receiveConnections).toEqual(jasmine.any(Function));
      expect(child.receiveEvents).toEqual(jasmine.any(Function));
      expect(child.receivePlugins).toEqual(jasmine.any(Function));
      expect(child.receiveSelectedEvents).toEqual(jasmine.any(Function));
      expect(child.receiveSession).toEqual(jasmine.any(Function));
      expect(child.receiveSettings).toEqual(jasmine.any(Function));
      expect(child.receiveValidation).toEqual(jasmine.any(Function));
      done();
    });
  });

  it('loads an iframe and provides noop APIs', (done) => {
    bridge = createAndLoadIframe('optional.html');

    expect(bridge.destroy).toEqual(jasmine.any(Function));
    expect(bridge.promise).toEqual(jasmine.any(Promise));

    bridge.promise.then((child) => {
      Promise.all([
        child.navigateTo(),
        child.receivePlugins(),
        child.receiveValidation()
      ]).then(() => {
        done();
      });
    });
  });

  it('times out if plugin view does not register with bridge', (done) => {
    bridge = createAndLoadIframe('unregistered.html');

    bridge.promise.then(
      () => {}, (error) => {
        expect(error).toBe('renderTimeout');
        done();
      }
    );
  });

  it('rejects promise if plugin view init function throws an error', (done) => {
    bridge = createAndLoadIframe('initFailure.html');

    bridge.promise.then(
      () => {}, (error) => {
        expect(error.message).toBe('I AM ERROR');
        done();
      }
    );
  });

  it('rejects promise when connection fails', (done) => {
    jasmine.clock().install();

    bridge = createAndLoadIframe('connectionFailure.html');

    bridge.promise.then(() => {}, (err) => {
      expect(err.toString()).toContain(ERROR_CODES.CONNECTION_TIMEOUT);
      jasmine.clock().uninstall();
      done();
    });

    jasmine.clock().tick(10000);
  });

  it('rejects promise when destroyed', (done) => {
    bridge = createAndLoadIframe('registerPlugin.html');

    bridge.promise.then(() => {}, (err) => {
      expect(err).toBe(ERROR_CODES.DESTROYED);
      done();
    });

    bridge.destroy();
  });

  describe('parent APIs', () => {
    let annotateEvent;
    let annotateSession;
    let deletePlugin;
    let flushConnection;
    let navigateTo;
    let selectEvents;
    let sendCommand;
    let trackEvent;
    let uploadPlugin;

    beforeEach(() => {
      annotateEvent = jasmine.createSpy();
      annotateSession = jasmine.createSpy();
      deletePlugin = jasmine.createSpy();
      flushConnection = jasmine.createSpy();
      navigateTo = jasmine.createSpy();
      selectEvents = jasmine.createSpy();
      sendCommand = jasmine.createSpy();
      trackEvent = jasmine.createSpy();
      uploadPlugin = jasmine.createSpy();
    });

    it('proxies the parent APIs', (done) => {
      bridge = createAndLoadIframe('griffonAPIs.html', {
        annotateEvent,
        annotateSession,
        deletePlugin,
        flushConnection,
        navigateTo,
        selectEvents,
        sendCommand,
        trackEvent,
        uploadPlugin
      });

      bridge.promise.then((child) => {
        child.receiveEvents().then(() => {
          expect(annotateEvent).toHaveBeenCalled();
          expect(annotateSession).toHaveBeenCalled();
          expect(deletePlugin).toHaveBeenCalled();
          expect(flushConnection).toHaveBeenCalled();
          expect(navigateTo).toHaveBeenCalled();
          expect(selectEvents).toHaveBeenCalled();
          expect(sendCommand).toHaveBeenCalled();
          expect(trackEvent).toHaveBeenCalledWith({
            action: 'select',
            element: 'Test element',
            feature: 'test-plugin',
            type: 'list-item',
            widget: { name: 'test-widget', type: 'dialog' }
          });
          expect(uploadPlugin).toHaveBeenCalled();
          done();
        });
      });
    });

    it('does not fail if child calls NOOP parent methods', (done) => {
      bridge = createAndLoadIframe('griffonAPIs.html');
      const outcome = waitForTrackEventOutcome(bridge.iframe);

      bridge.promise.then((child) => {
        child.receiveEvents().then(() => {
          outcome.then((result) => {
            expect(annotateEvent).not.toHaveBeenCalled();
            expect(annotateSession).not.toHaveBeenCalled();
            expect(deletePlugin).not.toHaveBeenCalled();
            expect(flushConnection).not.toHaveBeenCalled();
            expect(navigateTo).not.toHaveBeenCalled();
            expect(selectEvents).not.toHaveBeenCalled();
            expect(sendCommand).not.toHaveBeenCalled();
            expect(trackEvent).not.toHaveBeenCalled();
            expect(uploadPlugin).not.toHaveBeenCalled();
            expect(result).toBe('fulfilled');
            done();
          });
        });
      });
    });
  });
});

describe('older host without a trackEvent method', () => {
  let connection;
  let iframe;

  afterEach(() => {
    if (connection) {
      connection.destroy();
    }
    if (iframe) {
      iframe.remove();
    }
  });

  it('resolves trackEvent when the host does not advertise it', (done) => {
    iframe = document.createElement('iframe');
    iframe.src = `http://${window.location.hostname}:9800/griffonAPIs.html`;
    document.body.appendChild(iframe);

    const outcome = waitForTrackEventOutcome(iframe);

    // The method set a pre-0.5.0 host advertises: everything except trackEvent.
    // This mirrors the loadIframe handshake in src/parent.js by hand so the fixture
    // talks to a pre-0.5.0 parent — if that handshake changes, update both together.
    connection = connectToChild({
      iframe,
      methods: {
        annotateEvent: NOOP,
        annotateSession: NOOP,
        deletePlugin: NOOP,
        flushConnection: NOOP,
        navigateTo: NOOP,
        pluginRegistered: () => {
          connection.promise.then((child) => {
            child.init({}).then(() => {
              child.receiveEvents();
            });
          });
        },
        selectEvents: NOOP,
        sendCommand: NOOP,
        uploadPlugin: NOOP
      }
    });

    outcome.then((result) => {
      expect(result).toBe('fulfilled');
      done();
    });
  });
});
