# Griffon Plugin Bridge

## Usage

The Project Griffon UI consumes the bridge via the `@adobe/griffon-plugin-bridge` npm package while plugin views consume the bridge by loading a CDN-hosted script

The communication layer consists three different pieces:

* **Parent (lib/parent.js):** This is the portion of the communication layer that Project Griffon UI uses by importing it directly:

  `import { loadIframe } from '@adobe/griffon-plugin-bridge';`

  The arguments, return value, and behavior of `loadIframe` can be found within the code documentation in [parent.js](src/parent.js).

* **Child (dist/pluginBridge.min.js):** This is the portion of the communication layer that plugin views use by including the script:

`<script src="https://ui.griffon.adobe.com/pluginBridge/pluginBridge.min.js"></script>`

### API

#### Griffon UI Methods

The bridge provides a plugin (child) to call methods into the Griffon UI (parent).

##### annotateEvent

Allows a plugin to annotate an event. Annotations are additional data to events that need to be persisted - like third-party API results. The annotation is stored as an object with two properties: `type` and `payload`. The plugin UUID is used as the type and the data provided in the annotateEvent call is stored in the payload property. An event will have an array of annotations.

##### annotateSession

Allows a plugin to annotate a session.

##### flushConnection

Allows a plugin to rerun a connector. Flush connection takes a `namespace` and  `context` parameter. The exact connection that fully matches both the `namespace` and `context` will be cleared, causing the downstream Connector to reload the data.

##### deletePlugin

Allows a plugin to delete a validation or view plugin that is owned by the user's organization. The payload needs to be the uuid of a plugin. This operation is currently restricted to Adobe first-party plugins only.

##### navigateTo

Allows a plugin to navigate to another view for deep linking.

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

##### uploadPlugin

Allows a plugin to upload a validation or view plugin. The payload to upload a plugin needs to look like the following:
```
{
  uuid: '1234567890', // optional
  file: Blob
}
```
If a uuid is not provided, then a new plugin is created. Otherwise, the plugin is updated.

#### Plugin Methods

The bridge provides a plugin (child) the ability to implement the following APIs by calling `window.pluginBridge.register` and passing in an object

```
window.pluginBridge.register({
  init: (configuration) => {
    // do something
  },
  navigateTo: (path) => {
    // do something based on the current path
  },
  receiveEvents: (events) => {
    // array of session events
  },
  receivePlugins: (events) => {
    // array of view plugins
  },
  receiveSelectedEvents: (events) => {
    // subset of session events
  },
  receiveSession: (session) => {
    // session information including session annotations
  },
  receiveSettings: (settings) => {
    // new settings
  },
  receiveValidation: (results) => {
    // validation results from the validation plugins
  }
});
```

##### init

The parent (Project Griffon UI) calls init once the plugin is registered. Here, Project Griffon UI will pass in any applicable configuration settings.

Example Payload
```
{
  imsAccessToken: 'LongEncodedTokenGoesHere',
  imsOrg: 'testOrg@AdobeOrg',
  environment: 'prod',
  settings: {
    global: {
      theme: 'light',
      locale: 'en-US'
    }
  }
```

**Configiration Values**
- *imsAccessToken*: token string used to make calls to Adobe services
- *imsOrg*: string that identifies the user's active org id
- *environment*: environment that the plugin is running against. Possible values are  `local`/`dev`/`qa`/`stage`/`prod`
- *settings*: object contain the following settings. Settings can be updated using `receiveSettings`.

**Settings**

Settings determine how the plugin should look and feel. These settings are scoped to a namespace. The `global` namespace contains the following:

- *theme*: (light/dark) specifies the theme the parent's UI is using
- *locale*: (en-US, etc) specifies which localization to use in the UI

You may also provide plugin specific settings using your plugins specific namespace.

##### receiveSettings

Passes a new set of settings data. The structure matches the `settings` field from the `init` command above.

Example Payload
```
{ global: { theme: 'light', locale: 'en-US' }, 'aep-places': { defaultZoom: 7 } }
```

**Supported Values**
- *theme*: (light/dark) specifies the theme the parent's UI is using
- *locale*: (en-US, etc) specifies which localization to use in the UI
- *showTimeline*: (true/false) many Griffon Plugins show a timeline at the bottom by default. Setting this to `false` will hide that timeline.

##### navigateTo

The parent (Project Griffon UI) calls navigateTo whenever the URL is updated. The intent here is to provide deep linking capabilities as well as an opportunity for plugins to be good citizens and limit resources when not visible.

##### receiveConnections

Project Griffon UI sends an array of connections. A connection will look like:
```
{
  namespace, // the namespace of the connector
  context, // object containing parameters needed to run the connector
  loaded, // has the connection data finished loading
  loading, // is the connection currently loading
  error, // error object resulting from the query (if applicable)
  data // the resulting data from the api call
}
```

##### receiveEvents

Currently, Project Griffon UI will send all events via this method on all registered plugins in the following scenarios:
  * Upon initial load of the plugin
  * Any time a new event is received while the session with the client (Mobile SDK) is active
  * Any time an event is annotated by a plugin

##### receivePlugins

Project Griffon UI calls receivePlugins when the visibility of a view is changed or when a view is uploaded or deleted. The payload will contain an array of plugin object metadata.

##### receiveSelectedEvents

Project Griffon UI sends an array of event uuids selected from the result of a plugin calling `selectEvents` on the bridge.

##### receiveValidation

The parent (Project Griffon UI) calls receiveValidation when the validation plugins have been executed. The payload will contain an object of results each keyed by the namespace of the plugin. Each result will have a payload similar to the following:

```
{
  "category": "Adobe Analytics"
  "description": "Validates each analytics event has post-processed data."
  "displayName": "Adobe Analytics Post-Processed Data"
  "level": "off"
  "namespace": "adobe-analytics-post-processed"
  "results": {
    "message": "Valid! All Analytics events have post-processed data!",
    "events": [],
    "result": "matched"
  }
}
```

## Scripts

To run tests, run the following command:
```
npm run test:browsers
```

To run a ci test:
```
npm run test
```

To create a build, run the following command:
```
npm run build
```

## Contributing

Contributions are welcomed! Read the [Contributing Guide](CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE.md) for more information.
