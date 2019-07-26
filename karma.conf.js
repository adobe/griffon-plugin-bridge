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

const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const webpackConfig = require('./webpack.config');

/**
 * We're going to serve fixtures (our mock plugin views) from a port that's different from
 * the tests running on Karma. This is so we can test that cross-domain communication is
 * functioning as expected.
 */
const serveFixtures = () => {
  const childIframes = connect()
    .use(serveStatic('dist'))
    .use(serveStatic('test/module/fixtures'));

  http.createServer(childIframes).listen(9800);
};

module.exports = function (config) {
  serveFixtures();

  config.set({
    browsers: ['Chrome'],
    frameworks: ['jasmine'],
    files: [
      { pattern: 'test/**/*.js', watched: false },
      // Re-run tests when fixtures change.
      { pattern: 'test/module/fixtures/*', watched: true, included: false, served: false },
      // Re-run tests when dist files change (the fixtures use these).
      { pattern: 'dist/*', watched: true, included: false, served: true }
    ],
    // We use this proxy so that when pluginBridge.min.js loads
    // /pluginBridge/pluginBridge-child.min.js (which is the path Griffon
    // serves pluginBridge-child.min.js from), the file will be found.
    proxies: {
      '/pluginBridge/': '/base/dist/'
    },
    preprocessors: {
      'test/**/*.js': ['webpack']
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      check: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100
        }
      },
      dir: 'coverage/',
      reporters: [
        { type: 'html', subdir: '.' },
        { type: 'text', subdir: '.' }
      ]
    },
    webpack: webpackConfig(),
    webpackServer: {
      noInfo: true
    },
    autoWatch: true,
    singleRun: true
  });
};
