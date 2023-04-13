/**
 * WallBump sound plugin
 * Makes a wall bump noise when your character tries to pass through impassable terrain
 * Author: Craig Brett
 */

(function() {
    var soundDelay = 500;
    var pauseSound = false;
    var wallBumpSound = { name: "Earth3", pan: 0, pitch: 100, volume: 30 };
    
    var overrides = {
        Game_Player_moveStraight: Game_Player.prototype.moveStraight
    };

    // override the moveStraight to check if the player canPass. If cannot pass, play the sound
    Game_Player.prototype.moveStraight = function(d) {
        if (!pauseSound && !this.canPass(this.x, this.y, d)) {
            AudioManager.playStaticSe(wallBumpSound);
            pauseSound = true;

            setTimeout(() => {
                pauseSound = false;
            }, soundDelay);
        }

        overrides.Game_Player_moveStraight.call(this, d);
    }
})();