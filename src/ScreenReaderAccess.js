/**
 * ScreenReaderAccess plugin
 * Provides screen readers access to text in the game
 * Author: Craig Brett
 */

(function() {
    // nice easy way to specify the css
    var srOnlyCss = `position: absolute; 
        width: 1px; 
        height: 1px; 
        position: absolute; 
        padding: 0; 
        margin: -1px; 
        overflow: hidden; 
        border: 0;`;

    function createSrElement() {
        var srOnlyElement = document.createElement('div');
        srOnlyElement.id = "sr-only";
        srOnlyElement.setAttribute('aria-live', 'polite');
        srOnlyElement.setAttribute('aria-atomic', 'true');
        srOnlyElement.setAttribute('style', srOnlyCss);
        document.body.appendChild(srOnlyElement);
    }

    function getSrElement() {
        return document.getElementById('sr-only');
    }

    function sanitizeForScreenReader(text) {
        // a bunch of these may be Yanfly only, will need a non-Yanfly game to verify
        const displayEscapeCharactersRegex = /[\{\}^]/g;
        const colourOnlyRegex = /\\*c\[\d+\]/g;
        const resetColorRegex = /RESETCOLOR/g;
        const unprintableSymbolsRegex = /[]/g;
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
        const colourOnlyRegex = /\\{1,2}c\[\d+\]/g;
        const loneColourRegex = /\\{1,2}c/g;
        const resetColourRegex = /RESETCOLOR/g;
        const nonAlphaNumericOrPunctuationRegex = /[^\w.,?!*_ -]+/g;
        return text
            .replace(colourOnlyRegex, "")
            .replace(loneColourRegex, "")
            .replace(resetColourRegex, "")
            .replace(nonAlphaNumericOrPunctuationRegex, "");
    }

    function replaceIconsWithNames(text) {
        const iconRegex = /\\{1,2}I\[(\d+)\]/g;
        return text
            .replace(iconRegex, function (match, iconIndex) {
                var name = findNameByIconIndex(iconIndex);
                if (name) {
                    return name;
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

        for (const db of databases) {
            for (const item of db) {
                if (item.iconIndex == iconIndex) {
                    return item.name;
                }
            }
        }

        return null;
    }

    function setTextTo(message) {
        const formattedMessage = sanitizeForScreenReader(message);
        getSrElement().innerText = "";
        getSrElement().innerText = formattedMessage;
    }

    // attempted core engine overrides

    const originalMessageWindowStartMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        originalMessageWindowStartMessage.call(this);
        const allText = $gameMessage.allText();
        let output = this.convertEscapeCharacters(allText);
        // in Yanfly message windows, name is separate
        if (typeof Yanfly !== 'undefined' && Yanfly && typeof Yanfly.nameWindow !== 'undefined' && Yanfly.nameWindow && 
                typeof this.hasDifferentNameBoxText !== 'undefined' && this.hasDifferentNameBoxText()) {
            // the _text indicates that it should be private/internal, however, there's no public field for the text, so we'll take it
            const name = sanitizeNameBoxText(Yanfly.nameWindow._text);
            output = `${name}: ${output}`;
        }

        setTextTo(output);
    }

    var originalScrollTextStartMessage = Window_ScrollText.prototype.startMessage;
    Window_ScrollText.prototype.startMessage = function() {
        originalScrollTextStartMessage.call(this);
        const allText = $gameMessage.allText();
        const output = this.convertEscapeCharacters(allText);
        setTextTo(output);
    }

    var originalCommandSelect = Window_Command.prototype.select;
    Window_Command.prototype.select = function(index) {
        originalCommandSelect.call(this, index);
        var command = this.currentData();
        if (command) {
            setTextTo(command.name);
        }
    }

    var originalSkillListSelect = Window_SkillList.prototype.select;
    Window_SkillList.prototype.select = function(index) {
        originalSkillListSelect.call(this, index);
        var item = this.item();
        if (item) {
            var description = replaceIconsWithNames(item.description);
            setTextTo(item.name + ": " + description);
        }
    }

    var originalOptionsSelect = Window_Options.prototype.select;
    Window_Options.prototype.select = function(index) {
        originalOptionsSelect.call(this, index);
        var command = this.currentData();
        if (command) {
            var optionText = `${this.commandName(index)}: ${this.statusText(index)}`;
            setTextTo(optionText);
        }
    }

    var originalBattleLogAddText = Window_BattleLog.prototype.addText;
    Window_BattleLog.prototype.addText = function(text) {
        originalBattleLogAddText.call(this, text);
        setTextTo(text);
    }

    var originalBattleActorSelect = Window_BattleActor.prototype.select;
    Window_BattleActor.prototype.select = function(index) {
        originalBattleActorSelect.call(this, index);
        var actor = this.actor();
        if (actor) {
            setTextTo(`${actor.name()}: ${actor.hp} / ${actor.mhp}`);
        }
    }

    var originalBattleEnemySelect = Window_BattleEnemy.prototype.select;
    Window_BattleEnemy.prototype.select = function(index) {
        originalBattleEnemySelect.call(this, index);
        var enemy = this.enemy();
        if (enemy) {
            setTextTo(`${enemy.name()}: ${enemy.hp} / ${enemy.mhp}`);
        }
    }

    // actually add the sr-only element to the game document

    if (document) {
        createSrElement();
    } else {
        console.log("Unable to create sr-only element: Cannot find document.");
    }
})();