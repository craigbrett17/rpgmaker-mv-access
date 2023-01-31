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
        var characterRegex = /<(\\c\[\d+\])?(\w+)>/g;
        var colourOnlyRegex = /\\c\[\d+\](\w+)\\c/g;
        var playerRegex = /<(\\c\[\d+\])?\\N\[1\]>/g;
        var escapeSequencesRegex = /\\[nr]/g;
        var nonTextRegex = /[^\w.,?!':_ -]+/g;
        return text
            .replace("<WordWrap>", " ")
            .replace("<SIMPLE>", " ")
            .replace("<CENTER>", " ")
            .replace("<br>", " ")
            .replace("<BR>", " ")
            .replace(characterRegex, "$2: ")
            .replace(colourOnlyRegex, "$1")
            .replace(playerRegex, "Me: ")
            .replace(escapeSequencesRegex, " ")
            .replace(nonTextRegex, " ");
    }

    function setTextTo(message) {
        var formattedMessage = sanitizeForScreenReader(message);
        getSrElement().innerText = "";
        getSrElement().innerText = formattedMessage;
    }

    // attempted core engine overrides

    var originalMessageAdd = Game_Message.prototype.add;
    Game_Message.prototype.add = function(text) {
        originalMessageAdd.call(this, text);
        var allText = this.allText();
        setTextTo(allText);
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
            setTextTo(item.name + ": " + item.description);
        }
    }

    var originalBattleLogAddText = Window_BattleLog.prototype.addText;
    Window_BattleLog.prototype.addText = function(text) {
        originalBattleLogAddText.call(this, text);
        setTextTo(text);
    }

    // actually add the sr-only element to the game document

    if (document) {
        createSrElement();
    } else {
        console.log("Unable to create sr-only element: Cannot find document.");
    }
})();