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
    
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function () {
        _Scene_Map_update.call(this);
        if (this.isInteractableElementsMenuTriggered()) {
            SceneManager.push(Scene_InteractableElementsMenu);
        }
    };

    var isKeyPressed = false;

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
        this.select(0);
      };
      
      Window_InteractableElementsMenu.prototype.makeCommandList = function() {
        var interactableElements = $gameMap.interactableElements();

        // sortby id
        interactableElements.sort(function (a, b) {
            return a.id - b.id;
        });

        for (var i = 0; i < interactableElements.length; i++) {
          var element = interactableElements[i];
          var name = (element.name) ? element.name : "Event " + i + " at " + element.x + " " + element.y;
          this.addCommand(name, element.id, true, element);
        }

        if (this._list.length === 0) {
            this.addCommand("No interactable elements", null, false);
        }
      };
      
      Window_InteractableElementsMenu.prototype.drawItem = function(index) {
        var element = this._list[index];
        if (!element) return;

        var rect = this.itemRect(index);
        this.drawText(element.name, rect.x, rect.y, rect.width);
      };
      
      Window_InteractableElementsMenu.prototype.processOk = function() {
        SoundManager.playCancel();
        SceneManager.pop();
      };
      
      Window_InteractableElementsMenu.prototype.processCancel = function() {
        SoundManager.playCancel();
        SceneManager.pop();
    };

    Game_Map.prototype.interactableElements = function () {
        return this.events().filter(function (event) {
            return event.isInteractable();
        });
    };

    Game_Event.prototype.isInteractable = function () {
        return this.isTriggerIn([0, 1, 2]) && this.isNormalPriority();
    };
})();