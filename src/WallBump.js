/**
 * WallBump sound plugin
 * Makes a wall bump noise when your character tries to pass through impassable terrain
 * Author: Craig Brett
 */

(function() {
    var soundDelay = 500;
    var pauseSound = false;
    var wallBumpSound = { name: "Earth3", pan: 0, pitch: 100, volume: 30 };
    var interactSound = { name: "Saint5", pan: 0, pitch: 100, volume: 30 };
    
    var overrides = {
        Game_Player_moveStraight: Game_Player.prototype.moveStraight
    };

    // override the moveStraight to check if the player canPass. If cannot pass, play the sound
    Game_Player.prototype.moveStraight = function(d) {
        if (!pauseSound && !this.canPass(this.x, this.y, d)) {
            // Check if there's an event at the destination and if it can be activated
            if (isBumpingInteractable(this.x, this.y, d)) {
                AudioManager.playStaticSe(interactSound);
            } else {
                AudioManager.playStaticSe(wallBumpSound);
            }
            
            pauseSound = true;

            setTimeout(() => {
                pauseSound = false;
            }, soundDelay);
        }

        overrides.Game_Player_moveStraight.call(this, d);
    }

    function isBumpingInteractable(x, y, d) {
        let x2 = $gameMap.roundXWithDirection(x, d);
        let y2 = $gameMap.roundYWithDirection(y, d);
        const targetIsCounter = $gameMap.isCounter(x2, y2);

        if (targetIsCounter) {
            // increment by another tile to account for the counter
            x2 = $gameMap.roundXWithDirection(x2, d);
            y2 = $gameMap.roundYWithDirection(y2, d);
        }

        const events = $gameMap.eventsXy(x2, y2);
        for (const event of events) {
            if (event.isTriggerIn([0, 2])) { // "Touch" or "Player Touch"
                return true;
            }
        }

        return false;
    }
})();