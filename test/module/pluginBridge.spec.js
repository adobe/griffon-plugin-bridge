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

import { loadIframe, ERROR_CODES, NOOP } from '../../src/parent';

describe('parent', () => {
  let bridge;

  const createAndLoadIframe = (fixture, options) => {
    const iframe = document.createElement('iframe');
    iframe.src = `http://${window.location.hostname}:9800/${fixture}`;
    document.body.appendChild(iframe);

    return loadIframe({ iframe, ...options });
  };

  afterEach(() => {
    if (bridge) {
      bridge.destroy();
    }
  });

  it('loads an iframe and provides API', (done) => {
    bridge = createAndLoadIframe('registerPlugin.html');

    expect(bridge.destroy).toEqual(jasmine.any(Function));
    expect(bridge.promise).toEqual(jasmine.any(Promise));

    bridge.promise.then((child) => {
      expect(child.init).toEqual(jasmine.any(Function));
      expect(child.receiveEvents).toEqual(jasmine.any(Function));
      expect(child.selectedEvents).toEqual(jasmine.any(Function));
      done();
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
      expect(err).toBe(ERROR_CODES.CONNECTION_TIMEOUT);
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
    let selectEvent;

    beforeEach(() => {
      annotateEvent = jasmine.createSpy();
      selectEvent = jasmine.createSpy();
    });

    it('proxies the parent APIs', (done) => {
      bridge = createAndLoadIframe('griffonAPIs.html', {
        annotateEvent,
        selectEvent
      });

      bridge.promise.then((child) => {
        child.receiveEvents().then(() => {
          expect(annotateEvent).toHaveBeenCalled();
          expect(selectEvent).toHaveBeenCalled();
          done();
        });
      });
    });

    it('does not fail if child calls NOOP parent methods', (done) => {
      bridge = createAndLoadIframe('griffonAPIs.html');

      bridge.promise.then((child) => {
        child.receiveEvents().then(() => {
          expect(annotateEvent).toHaveBeenCalled();
          expect(selectEvent).toHaveBeenCalled();
          done();
        });
      });
    });
  });
});
