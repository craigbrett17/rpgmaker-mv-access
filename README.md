# RPGMaker MV ScreenReaderAccess

An RPGMaker MV plugin to make it easy for RPGMaker authors to make games accessible to screen reader users

## How to use

Copy the ScreenReaderAccess.js file from this repository into the plugins directory of your game. You may modify it as needed, or have your own code that uses it, just please keep the attribution in that file.

Then, enable it in your plugins.js file:

```
... plugins
{"name":"ScreenReaderAccess","status":true,"description":"Provides access to screen readers for the game","parameters":{}}
```

Then, launch the game with a screen reader enabled. Interact with the menu or else a character talking to the player. Textual messages should be read out through the screen reader.