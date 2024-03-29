/**
 * ScreenReaderAccess plugin
 * Provides screen readers access to text in the game
 * Author: Craig Brett
 */

(function() {
    var maxNumOfLogEntries = 20;

    var lastLogMessage = null;

    // nice easy way to specify the css
    var srOnlyCss = `position: absolute; 
        width: 1px; 
        height: 1px; 
        position: absolute; 
        padding: 0; 
        margin: -1px; 
        overflow: hidden; 
        border: 0;`;

    function createSrAnnounceElement() {
        var srOnlyElement = document.createElement('div');
        srOnlyElement.id = "sr-announce";
        srOnlyElement.setAttribute('aria-live', 'polite');
        srOnlyElement.setAttribute('aria-atomic', 'true');
        srOnlyElement.setAttribute('style', srOnlyCss);
        document.body.appendChild(srOnlyElement);
    }

    function createSrLogElement() {
        var logElement = document.createElement('div');
        logElement.id = "sr-log";
        logElement.setAttribute('style', srOnlyCss);
        document.body.appendChild(logElement);
    }

    function getSrElement() {
        return document.getElementById('sr-announce');
    }

    function getSrLogElement() {
        return document.getElementById('sr-log');
    }

    function sanitizeForScreenReader(text) {
        // a bunch of these may be Yanfly only, will need a non-Yanfly game to verify
        var displayEscapeCharactersRegex = /[\{\}^]/g;
        var colourOnlyRegex = /\\*c\[\d+\]/g;
        var resetColorRegex = /RESETCOLOR/g;
        var unprintableSymbolsRegex = /[]/g;
        return text
            .replace("<WordWrap>", " ")
            .replace("<SIMPLE>", " ")
            .replace("<CENTER>", " ")
            .replace("<br>", " ")
            .replace("<BR>", " ")
            .replace(resetColorRegex, "")
            .replace(unprintableSymbolsRegex, "")
            .replace(displayEscapeCharactersRegex, "")
            .replace(colourOnlyRegex, "");
    }

    function sanitizeNameBoxText(text) {
        // Yanfly nameboxes come with their own weird formats and no convenient way of just having the plaintext
        var colourOnlyRegex = /\\{1,2}c\[\d+\]/g;
        // have spotted these in the wild where an unprintable character takes over from the "\"
        var malformedColourRegex = /[^ -~]{1,2}c\[\d+\]/g;
        var loneColourRegex = /\\{1,2}c/g;
        var resetColourRegex = /RESETCOLOR/g;
        var nonAlphaNumericOrPunctuationRegex = /[^\w.,?!*_ -]+/g;
        return text
            .replace(colourOnlyRegex, "")
            .replace(malformedColourRegex, "")
            .replace(loneColourRegex, "")
            .replace(resetColourRegex, "")
            .replace(nonAlphaNumericOrPunctuationRegex, "");
    }

    function replaceIconsWithNames(text) {
        var iconRegex = /\\{1,2}[iI]\[(\d+)\]/g;
        return text
            .replace(iconRegex, function (match, iconIndex) {
                var name = findNameByIconIndex(iconIndex);
                if (name) {
                    return name + " ";
                } else {
                    return "";
                }
            });
    }

    function findNameByIconIndex(iconIndex) {
        // since a call to icon will often just rely on the icon's position in the sprite sheet
        // and not necessarily come with any useful context, we have to do a reverse lookup in all the databases
        // to see if we can find the name of the item that the icon is for
        var databases = [
            $dataItems,
            $dataWeapons,
            $dataArmors,
            $dataSkills,
            $dataStates
        ];

        for (var db of databases) {
            var match = db.find(function(item) { return item != null && item.iconIndex == iconIndex });

            if (match) {
                return match.name;
            }
        }

        return null;
    }

    function addToLog(text) {
        var logContainer = getSrLogElement();
        if (logContainer.childElementCount >= maxNumOfLogEntries) {
            // remove the last log entry
            logContainer.removeChild(logContainer.childNodes.item(logContainer.childElementCount - 1));
        }

        if (text == lastLogMessage) {
            return; // duplicate log, possibly caused by override hierarchy
        }

        var entry = document.createElement('div');
        entry.innerText = text;
        logContainer.insertBefore(entry, logContainer.firstChild);
        lastLogMessage = text;
    }

    function setTextTo(message) {
        var formattedMessage = sanitizeForScreenReader(message);
        getSrElement().innerText = "";
        getSrElement().innerText = formattedMessage;
        addToLog(formattedMessage);
    }

    // attempted core engine overrides

    // an object containing the original functions
    // used in the override functions to call the underlying code
    var overrides = {
        Window_Message_startMessage: Window_Message.prototype.startMessage,
        Window_ScrollText_startMessage: Window_ScrollText.prototype.startMessage,
        Window_MapName_open: Window_MapName.prototype.open,
        Window_Command_select: Window_Command.prototype.select,
        Window_SkillList_select: Window_SkillList.prototype.select,
        Window_Options_select: Window_Options.prototype.select,
        Window_BattleLog_addText: Window_BattleLog.prototype.addText,
        Window_BattleActor_select: Window_BattleActor.prototype.select,
        Window_BattleEnemy_select: Window_BattleEnemy.prototype.select,
        Window_ItemList_select: Window_ItemList.prototype.select,
        Window_ShopBuy_select: Window_ShopBuy.prototype.select,
        Window_ShopBuy_select: Window_ShopBuy.prototype.select,
        Window_ShopNumber_changeNumber: Window_ShopNumber.prototype.changeNumber,
        Window_BattleLog_displayHpDamage: Window_BattleLog.prototype.displayHpDamage,
        Window_BattleLog_displayMpDamage: Window_BattleLog.prototype.displayMpDamage,
        Window_BattleLog_displayTpDamage: Window_BattleLog.prototype.displayTpDamage,
        Window_BattleLog_displayCurrentState: Window_BattleLog.prototype.displayCurrentState,
        Window_BattleLog_displayAddedStates: Window_BattleLog.prototype.displayAddedStates,
        Window_BattleLog_displayRemovedStates: Window_BattleLog.prototype.displayRemovedStates
    };

    Window_Message.prototype.startMessage = function() {
        overrides.Window_Message_startMessage.call(this);
        var allText = $gameMessage.allText();
        var output = this.convertEscapeCharacters(allText);
        // in Yanfly message windows, name is separate
        if (typeof Yanfly !== 'undefined' && Yanfly && typeof Yanfly.nameWindow !== 'undefined' && Yanfly.nameWindow && 
                typeof this.hasDifferentNameBoxText !== 'undefined' && this.hasDifferentNameBoxText()) {
            // the _text indicates that it should be private/internal, however, there's no public field for the text, so we'll take it
            var name = sanitizeNameBoxText(Yanfly.nameWindow._text);
            output = `${name}: ${output}`;
        } else if ($gameMessage.faceName()) {
            var actorWithFace = $dataActors.find(function(a) { return a != null && a.faceName == $gameMessage.faceName() });
            var faceText = (actorWithFace) ? actorWithFace.name : $gameMessage.faceName();
            output = `${faceText}: ${output}`;
        }

        setTextTo(output);
    }

    Window_ScrollText.prototype.startMessage = function() {
        overrides.Window_ScrollText_startMessage.call(this);
        var allText = $gameMessage.allText();
        var output = this.convertEscapeCharacters(allText);
        setTextTo(output);
    }

    Window_MapName.prototype.open = function() {
        overrides.Window_MapName_open.call(this);
        if ($gameMap.displayName()) {
            setTextTo($gameMap.displayName());
        }
    }

    Window_Command.prototype.select = function(index) {
        overrides.Window_Command_select.call(this, index);
        var command = this.currentData();
        if (command) {
            setTextTo(command.name);
        }
    }

    Window_SkillList.prototype.select = function(index) {
        overrides.Window_SkillList_select.call(this, index);
        var item = this.item();
        if (item) {
            if (item.description) {
                var description = replaceIconsWithNames(item.description);
                setTextTo(item.name + ": " + description);
            } else {
                setTextTo(item.name);
            }
        }
    }

    Window_Options.prototype.select = function(index) {
        overrides.Window_Options_select.call(this, index);
        var command = this.currentData();
        if (command) {
            var optionText = `${this.commandName(index)}: ${this.statusText(index)}`;
            setTextTo(optionText);
        }
    }

    Window_BattleLog.prototype.addText = function(text) {
        overrides.Window_BattleLog_addText.call(this, text);
        setTextTo(text);
    }

    Window_BattleActor.prototype.select = function(index) {
        overrides.Window_BattleActor_select.call(this, index);
        var actor = this.actor();
        if (actor) {
            setTextTo(`${actor.name()}: ${actor.hp} / ${actor.mhp}`);
        }
    }

    Window_BattleEnemy.prototype.select = function(index) {
        overrides.Window_BattleEnemy_select.call(this, index);
        var enemy = this.enemy();
        if (enemy) {
            setTextTo(`${enemy.name()}: ${enemy.hp} / ${enemy.mhp}`);
        }
    }

    Window_ItemList.prototype.select = function(index) {
        overrides.Window_ItemList_select.call(this, index);
        var item = this.item();

        if (item) {
            var output = `${item.name} 
                ${this.needsNumber() ? ": " + $gameParty.numItems(item) : ""}. 
                ${item.description ? replaceIconsWithNames(item.description) : ""}`;
            setTextTo(output);
        }
    }

    Window_ShopBuy.prototype.select = function(index) {
        overrides.Window_ShopBuy_select.call(this, index);
        // seems to be a bug in the implementation of ShopBuy.item where it doesn't check for valid index
        var item = this._data && index >= 0 ? this.item() : null;

        if (item) {
            var output = `${item.name}, 
                ${this.price(item)} ${TextManager.currencyUnit}, 
                ${this.isCurrentItemEnabled() ? "" : "unavailable, "}
                ${item.description ? replaceIconsWithNames(item.description) : ""}`;
            setTextTo(output);
        }
    }

    Window_ShopNumber.prototype.changeNumber = function(amount) {
        overrides.Window_ShopNumber_changeNumber.call(this, amount);
        var number = this.number();

        if (number >= 0) {
            var output = `${number}, 
                ${this._price * number} ${TextManager.currencyUnit}`;
            setTextTo(output);
        }
    }

    if (typeof Yanfly !== 'undefined' && typeof Imported !== 'undefined' && Imported) {
        // Yanfly overrides

        if (Imported.YEP_BattleEngineCore) {
            // Yanfly's BattleEngineCore allows people to turn off the BattleLog text changes that explain what's happened in a battle
            // which is great visually (I think), but we need that info, so we'll re-implement it here, but only output it to screen readers (if set)
            if (!Yanfly.Param.BECShowHpText) {
                // hp text suppressed
                Window_BattleLog.prototype.displayHpDamage = function (target) {
                    overrides.Window_BattleLog_displayHpDamage.call(this, target);
                    if (target.result().hpAffected) {
                        setTextTo(this.makeHpDamageText(target));
                    }
                }
            }

            if (!Yanfly.Param.BECShowMpText) {
                // mp text suppressed
                Window_BattleLog.prototype.displayMpDamage = function (target) {
                    overrides.Window_BattleLog_displayMpDamage.call(this, target);
                    if (target.isAlive() && target.result().mpDamage !== 0) {
                        setTextTo(this.makeMpDamageText(target));
                    }
                }
            }

            if (!Yanfly.Param.BECShowTpText) {
                // tp text suppressed
                Window_BattleLog.prototype.displayTpDamage = function (target) {
                    overrides.Window_BattleLog_displayTpDamage.call(this, target);
                    if (target.isAlive() && target.result().tpDamage !== 0) {
                        setTextTo(this.makeTpDamageText(target));
                    }
                }
            }

            if (!Yanfly.Param.BECShowStateText) {
                // state text suppressed
                Window_BattleLog.prototype.displayCurrentState = function (subject) {
                    overrides.Window_BattleLog_displayCurrentState.call(this, subject);
                    var stateText = subject.mostImportantStateText();
                    if (stateText) {
                        setTextTo(subject.name() + stateText);
                    }
                }

                Window_BattleLog.prototype.displayAddedStates = function (target) {
                    overrides.Window_BattleLog_displayAddedStates.call(this, target);
                    target.result().addedStateObjects().forEach(function (state) {
                        var stateMsg = target.isActor() ? state.message1 : state.message2;
                        if (stateMsg) {
                            setTextTo(target.name() + stateMsg);
                        }
                    }, this);
                }

                Window_BattleLog.prototype.displayRemovedStates = function (target) {
                    overrides.Window_BattleLog_displayRemovedStates.call(this, target);
                    target.result().removedStateObjects().forEach(function (state) {
                        if (state.message4) {
                            setTextTo(target.name() + state.message4);
                        }
                    }, this);
                }
            }
        }

        if (Imported.YEP_GabWindow) {
            var originalDrawText = Window_Gab.prototype.drawGabText;
            Window_Gab.prototype.drawGabText = function () {
                originalDrawText.call(this);
                if (this._text && this._text.length > 0) {
                    setTextTo(this._text);
                }
            }
        }
    }

    // actually add the sr elements to the game document

    if (document) {
        createSrAnnounceElement();
        createSrLogElement();

        if (process.versions.chromium) {
            var majorVersionRegex = /^\d+/;
            var majorVersion = parseInt(process.versions.chromium.match(majorVersionRegex));
            if (majorVersion < 65) {
                addToLog(`Warning: The game you are playing is built using an old version of Chromium, ${process.versions.chromium}, which is less than the recommended version, 65. You may face degraded or no support from the screen reader access plugin.`);
            }
        }
    } else {
        console.log("Unable to create sr-only elements: Cannot find document.");
    }
})();
