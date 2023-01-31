/**
 * ScreenReaderAccess plugin
 * Provides screen readers access to text in the game
 * Author: Craig Brett
 */

(function() {
    function getSrElement() {
        return document.getElementById('sr-only');
    }

    function sanitizeForScreenReader(text) {
        var characterRegex = /<\\c\[\d+\](\w+)>/g;
        var playerRegex = /<\\c\[\d+\]\\N\[1\]>/g;
        var escapeSequencesRegex = /\\[nr]/g;
        var nonTextRegex = /[^\w.,:_ -]+/g;
        return text
            .replace("<WordWrap>", " ")
            .replace("<br>", " ")
            .replace("<BR>", " ")
            .replace(characterRegex, "$1: ")
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

    var originalAdd = Game_Message.prototype.add;
    Game_Message.prototype.add = function(text) {
        originalAdd.call(this, text);
        setTextTo(text);
    }
})();