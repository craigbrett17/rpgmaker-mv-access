/**
 * WallBump sound plugin
 * Makes a wall bump noise when your character tries to pass through impassable terrain
 * Author: Craig Brett
 */

(function() {
    var overrides = {
        Game_Player_moveStraight: Game_Player.prototype.moveStraight
    };

    // override the moveStraight to check canPass. If cannot pass, play the sound
    Game_Player.prototype.moveStraight = function(d) {
        if (!this.canPass(this.x, this.y, d)) {
            SoundManager.playCancel ();
        }

        overrides.Game_Player_moveStraight.call(this, d);
    }
})();