import resources from './resources';
// Screens
import TitleScreen from './screens/title';
import PlayScreen from './screens/play';
// Entities
import { PlayerEntity, SwordAttack } from './entities/player';
import { Skeleton, SkeletonAttack } from './entities/enemies/skeleton';

/* Game namespace */
const game = {

  // an object where to store game information
  data : {
    // score
    score : 0
  },


  // Run on page load.
  "onload" : function () {
    // Initialize the video.
    if (!me.video.init(320, 240, { wrapper : "screen", scale : "auto" })) {
        alert("Your browser does not support HTML5 canvas.");
        return;
    }

    // Initialize the audio.
    me.audio.init("mp3,ogg");

    // set and load all resources.
    // (this will also automatically switch to the loading screen)
    me.loader.preload(resources, this.loaded.bind(this));

    // me.debug.renderHitBox = true;
  },

  // Run on game resources loaded.
  "loaded" : function () {
    me.state.set(me.state.MENU, new TitleScreen());
    me.state.set(me.state.PLAY, new PlayScreen());

    // add our player entity in the entity pool
    me.pool.register("mainPlayer", PlayerEntity);
    me.pool.register("basicSkeleton", Skeleton);
    me.pool.register("attackSword", SwordAttack);
    me.pool.register("enemySlashAttack", SkeletonAttack);
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");
    me.input.bindKey(me.input.KEY.J, "attack", true);
    me.input.bindKey(me.input.KEY.K, "jump", true);

    // Start the game.
    me.state.change(me.state.PLAY);
  }
};

export default game;
