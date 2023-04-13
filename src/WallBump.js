/**
 * WallBump sound plugin
 * Makes a wall bump noise when your character tries to pass through impassable terrain
 * Author: Craig Brett
 */

(function() {
    var soundDelay = 300;
    var pauseSound = false;
    
    var overrides = {
        Game_Player_moveStraight: Game_Player.prototype.moveStraight
    };

    // override the moveStraight to check if the player canPass. If cannot pass, play the sound
    Game_Player.prototype.moveStraight = function(d) {
        if (!pauseSound && !this.canPass(this.x, this.y, d)) {
            SoundManager.playCancel ();
            pauseSound = true;

            setTimeout(() => {
                pauseSound = false;
            }, soundDelay);
        }

        overrides.Game_Player_moveStraight.call(this, d);
    }
})();