# RPGMaker MV Access

A series (eventually) of RPGMaker MV plugins to improve the accessibility of RPGMaker MV games.

## Current plugins

* ScreenReaderAccess: Interacts between a user's screen reader and RPGMaker games, reading out textual information (dialog, battle changes, menus)
* WallBump: When moving around on the map, will make a small bump noise when a player attempts to walk anywhere that they are not allowed to walk.
* InteractableElementsMenu: Allows the player to press a hotkey to bring up a menu of interactable elements on the map to then choose one to be guided to.

### ScreenReaderAccess

A plugin that will allow players (or game creators) to add screen reader accessibility into the textual elements of their games.

Note: This plugin, as it makes use of the aria-live attribute for it to function, will not work correctly in games with a Chromium version lower than around 65 (exact number to be determined). This particularly effects nw.js games from before around 0.2.9. 

### WallBump

A pretty simple plugin that reacts to the player character walking. If the player character tries to walk somewhere that they are not supposed to walk (i.e a wall, water, etc), it will make a small noise to signify that this is impossible, so that a blind or visually impaired player knows that they will not progress this way.

This is configurable with the parameters wallBumpSound (for the noise of hitting something impassable but non-interactive) and interactSoundName (for when the player encounters something that could potentially be interactable)

### InteractableElementsMenu

Allows a player to press a hotkey to bring up a list of interactable elements on the map. It will display their coordinates and if the player selects that element, the pitch and pan of the music will guide the player towards that item. 

* Music coming out from the left: Target is to the left
* Music coming out from the right: Target is to the right
* Music is higher pitched: Item is above you
* Music is lower pitched: Item is below you
* Exiting out from this menu without selecting anything will reset the music

The hotkey is configurable as the parameter "Trigger Key". This will need to be a keycode.

Naturally, this will not work in its current form on maps with no music.

## How to use

Copy the plugin's file from src (i.e ScreenReaderAccess.js) from this repository into the plugins directory of your game. You may modify it as needed, or have your own code that uses it, just please keep the attribution in that file.

Then, enable it in your plugins.js file. An example using the ScreenReaderAccess plugin.

```
... plugins
{"name":"ScreenReaderAccess","status":true,"description":"Provides access to screen readers for the game","parameters":{}}
```

Then, launch the game with a screen reader enabled. Interact with the menu or else a character talking to the player. Textual messages should be read out through the screen reader.