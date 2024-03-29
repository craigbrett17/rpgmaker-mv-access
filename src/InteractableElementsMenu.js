/*:
 * @plugindesc Interactable Elements Menu
 * @param Trigger Key
 * @desc The keycode used to trigger the interactable elements menu
 * @type text
 * @default 73
 *
 * @help
 * ...
 */

(function () {
    var parameters = PluginManager.parameters('InteractableElementsMenu');
    var triggerKey = parameters['Trigger Key'];
    var isKeyPressed = false;
    var currentPosX = 0, currentPosY = 0;
    var trackingTarget = null;
    
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function () {
        _Scene_Map_update.call(this);
        if (this.isInteractableElementsMenuTriggered()) {
            if (trackingTarget) {
                trackingTarget = null;
                SoundManager.playCancel();
                resetBgm();
            } else {
                SceneManager.push(Scene_InteractableElementsMenu);
            }
        }

        if (trackingTarget) {
            // calculate panning and pitch for the tracking sound based on player's position relative to the target
            updateTrackingSound(trackingTarget);
        }
    };

    document.addEventListener('keypress', function(event) {
        if (event.keyCode === triggerKey) {
            isKeyPressed = true;
        }
    });

    document.addEventListener('keyup', function(event) {
        if (event.keyCode === triggerKey) {
            isKeyPressed = false;
        }
    });

    Scene_Map.prototype.isInteractableElementsMenuTriggered = function () {
        return isKeyPressed;
    };

    function Scene_InteractableElementsMenu() {
        this.initialize.apply(this, arguments);
    }

    Scene_InteractableElementsMenu.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_InteractableElementsMenu.prototype.constructor = Scene_InteractableElementsMenu;

    Scene_InteractableElementsMenu.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_InteractableElementsMenu.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createInteractableElementsWindow();
    };

    Scene_InteractableElementsMenu.prototype.createInteractableElementsWindow = function () {
        // Create a new window to display the interactable elements menu
        var interactableElementsWindow = new Window_InteractableElementsMenu();
        interactableElementsWindow.setHandler('cancel', interactableElementsWindow.processCancel.bind(interactableElementsWindow));
        this.addWindow(interactableElementsWindow);
    };

    function Window_InteractableElementsMenu() {
        this.initialize.apply(this, arguments);
      }
      
      Window_InteractableElementsMenu.prototype = Object.create(Window_Command.prototype);
      Window_InteractableElementsMenu.prototype.constructor = Window_InteractableElementsMenu;
      
      Window_InteractableElementsMenu.prototype.initialize = function() {
        Window_Command.prototype.initialize.call(this, 0, 0);
        this.filter = "";
        this.select(0);
      };

      Window_InteractableElementsMenu.prototype.numVisibleRows = function() {
        return 10;
    };

      Window_InteractableElementsMenu.prototype.makeCommandList = function() {
        var interactableElements = $gameMap.interactableElements();

        // sortby id
        interactableElements.sort(function (a, b) {
            return a._eventId - b._eventId;
        });

        if (this.filter === "characterName") {
            // update the items to be the interactable elements with a character name
            interactableElements = interactableElements.filter(function (element) {
                return element._characterName && element._characterName != "";
            });
        }

        for (var i = 0; i < interactableElements.length; i++) {
          var element = interactableElements[i];
          this.createCommandFromInteractableElement(element);
        }

        if (this._list.length === 0) {
            this.addCommand("No interactable elements", null, false);
        } else if (this.filter != "") {
            this.addCommand("Show all elements", "", true, { filter: "" });
        } else {
            this.addCommand("Only show elements with a name", "", true, { filter: "characterName" });
        }
      };
      
      Window_InteractableElementsMenu.prototype.drawItem = function(index) {
        var element = this._list[index];
        if (!element) return;

        var rect = this.itemRect(index);
        this.drawText(element.name, rect.x, rect.y, rect.width);
      };
      
      Window_InteractableElementsMenu.prototype.processOk = function() {
        var element = this._list[this.index()].ext;
        if (!element) return;

        if (element.filter != undefined) {
            // get the current filter
            var currentFilter = element.filter;
            this.filter = currentFilter;
            this.refresh();
            this.select(0);
            SoundManager.playOk();
            return;
        }

        trackingTarget = element;
        SoundManager.playOk();
        SceneManager.pop();
      };
      
      Window_InteractableElementsMenu.prototype.processCancel = function() {
        SoundManager.playCancel();
        SceneManager.pop();
    };

    Window_InteractableElementsMenu.prototype.createCommandFromInteractableElement = function(element) {
        var elementProjection = {
            x: element.x,
            y: element.y,
            name: element._name,
            id: element._eventId,
            characterName: element._characterName
        };
        var name = (elementProjection.name)
            ? elementProjection.name
            : (elementProjection.characterName && elementProjection.characterName != "")
                ? "Event " + elementProjection.id + " " + elementProjection.characterName + " at " + element.x + " " + element.y
                : "Event " + elementProjection.id + " at " + element.x + " " + element.y;
        this.addCommand(name, elementProjection.id, true, elementProjection);
    }

    function updateTrackingSound() {
        var player = $gamePlayer;
        if (player.x === currentPosX && player.y === currentPosY) {
            return;
        }
        currentPosX = player.x;
        currentPosY = player.y;

        var target = trackingTarget;
        var dx = player.x - target.x;
        var dy = player.y - target.y;
        var pan = 0;
        var pitch = 100;
    
        if (dx < 0) {
            pan = 100;
        } else if (dx > 0) {
            pan = -100;
        }
    
        if (dy < 0) {
            pitch = 120;
        } else if (dy > 0) {
            pitch = 80;
        }
    
        var currentBgm = AudioManager.saveBgm();
        if (currentBgm && currentBgm.name) {
            AudioManager.updateBgmParameters({
                name: currentBgm.name,
                pan: pan,
                pitch: pitch,
                volume: currentBgm.volume
            });
        }
    }
    
    function resetBgm() {
        var currentBgm = AudioManager.saveBgm();
        if (currentBgm && currentBgm.name) {
            AudioManager.updateBgmParameters({
                name: currentBgm.name,
                pan: 0,
                pitch: 100,
                volume: currentBgm.volume
            });
        }
    }

    Game_Map.prototype.interactableElements = function () {
        return this.events().filter(function (event) {
            return event.isInteractable();
        });
    };

    Game_Event.prototype.isInteractable = function () {
        return this.isTriggerIn([0, 1, 2]) && this.isNormalPriority();
    };
})();