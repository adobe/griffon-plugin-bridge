# Griffon Plugin Bridge

## Usage

The Project Griffon UI consumes the bridge via the `@nebula/griffon-plugin-bridge` npm package while plugin views consume the bridge by loading a CDN-hosted script

The communication layer consists three different pieces:

* **Parent (lib/parent.js):** This is the portion of the communication layer that Project Griffon UI uses by importing it directly:

  `import { loadIframe } from '@nebula/griffon-plugin-bridge';`
  
  The arguments, return value, and behavior of `loadIframe` can be found within the code documentation in [parent.js](src/parent.js).

* **Child (dist/pluginBridge-child.min.js):** This is the portion of the communication layer that plugin views use, though plugin views don't load it directly (see Loader). This file is hosted by the Project Griffon UI which means it may be different based on the environment. This is important since it needs to be compatible with the Parent that is being used by the Project Griffon UI in the same environment.

* **Loader (dist/pluginBridge.min.js):** This loads Child. Loader will be loaded by plugins via a `script` tag. Plugins will always load the same Loader regardless of the environment they are running in. Loader then loads the environment-specific Child.

## Scripts

To run tests, run the following command:
```
npm run test
```

To run a ci test:
```
npm run test:ci
```

To create a build, run the following command:
```
npm run build
```

## Contributing

Contributions are welcomed! Read the [Contributing Guide](CONTRIBUTING.md) for more information.