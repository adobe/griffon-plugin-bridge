# Griffon Plugin Bridge

## Usage

The Project Griffon UI consumes the bridge via the `@adobe/griffon-plugin-bridge` npm package while plugin views consume the bridge by loading a CDN-hosted script

The communication layer consists three different pieces:

* **Parent (lib/parent.js):** This is the portion of the communication layer that Project Griffon UI uses by importing it directly:

  `import { loadIframe } from '@adobe/griffon-plugin-bridge';`
  
  The arguments, return value, and behavior of `loadIframe` can be found within the code documentation in [parent.js](src/parent.js).

* **Child (dist/pluginBridge-child.min.js):** This is the portion of the communication layer that plugin views use, though plugin views don't load it directly (see Loader). This file is hosted by the Project Griffon UI which means it may be different based on the environment. This is important since it needs to be compatible with the Parent that is being used by the Project Griffon UI in the same environment.

* **Loader (dist/pluginBridge.min.js):** This loads Child. Loader will be loaded by plugins via a `script` tag. Plugins will always load the same Loader regardless of the environment they are running in. Loader then loads the environment-specific Child.

### API

#### Griffon UI Methods

The bridge provides a plugin (child) to call methods into the Griffon UI (parent).

##### annotateEvent

Allows a plugin to annotate an event. Annotations are additional data to events that need to be persisted - like third-party API results. The annotation is stored as an object with two properties: `type` and `payload`. The plugin UUID is used as the type and the data provided in the annotateEvent call is stored in the payload property. An event will have an array of annotations.

##### annotateSession

Allows a plugin to annotate a session

##### navigateTo

Allows a plugin to navigate to another view for deep linking

##### selectEvents

Allows a plugin to toggle selected events to pass to other plugins via `receiveSelectedEvents`. The payload needs to be an array of event uuids.

##### sendCommand

Sends a command to the SDK via the Griffon server. The format should be:
```
{
  type: 'command to trigger',
  payload: { ... }
}
```
where the payload is an object containing data for the SDK to process when running the command.


#### Plugin Methods

The bridge provides a plugin (child) the ability to implement the following APIs by calling `window.pluginBridge.register` and passing in an object

```
window.pluginBridge.register({
  init: (settings) => {
    // do something
  },
  navigateTo: (path) => {
    // do something based on the current path
  },
  receiveEvents: (events) => {
    // array of session events
  },
  receiveSelectedEvents: (events) => {
    // subset of session events
  },
  receiveSession: (session) => {
    // session information including session annotations
  }
});
```

##### init

The parent (Project Griffon UI) calls init once the plugin is registered. Here, Project Griffon UI will pass in any applicable configuration settings.

##### navigateTo

The parent (Project Griffon UI) calls navigateTo whenever the URL is updated. The intent here is to provide deep linking capabilities as well as an opportunity for plugins to be good citizens and limit resources when not visible.

##### receiveEvents

Currently, Project Griffon UI will send all events via this method on all registered plugins in the following scenarios:
  * Upon initial load of the plugin
  * Any time a new event is received while the session with the client (Mobile SDK) is active
  * Any time an event is annotated by a plugin

##### receiveSelectedEvents

Project Griffon UI sends an array of event uuids selected from the result of a plugin calling `selectEvents` on the bridge.

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

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE.md) for more information.
