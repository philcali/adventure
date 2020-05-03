
const TitleScreen = me.Stage.extend({
    /**
     *  action to perform on state change
     */
    onResetEvent: function() {
      const particles = new me.ParticleEmitter(0, me.video.renderer.getHeight() - 1, {
        floating: true,
        totalParticles: 100,
        width: me.video.renderer.getWidth(),
        maxParticles: 10,
        minLife: 1000,
        maxLife: 3000
      });
      particles.streamParticles();
      me.game.world.addChild(new me.ColorLayer("background", "#000", 0), 1);
      me.game.world.addChild(particles, 2);
      me.game.world.addChild(new (me.Renderable.extend({
        init: function() {
          this._super(me.Renderable, 'init', [0, 0,
            me.video.renderer.getWidth(),
            me.video.renderer.getHeight()
          ]);
          this.font = new me.BitmapText(0, 0, { font: "mago1" });
        },

        update: function(dt) {
          return true;
        },

        draw: function(renderer) {
          this.font.draw(renderer, "Untitled Adventure Game", 250, 150);
          this.font.draw(renderer, "Press Enter", 285, 250);
        }
      })), 10);

      me.input.bindKey(me.input.KEY.ENTER, "start", true);
      this.handler = me.event.subscribe(me.event.KEYDOWN, (action, keyCode, edge) => {
        if (action === "start") {
          me.input.unbindKey(me.input.KEY.ENTER);
          me.state.transition("fade", "#FFF", 1000);
          particles.totalParticles = 500;
          particles.maxParticles = 50;
          setTimeout(() => {
            me.state.change(me.state.PLAY);
          }, 500);
        }
      });
    },

    /**
     *  action to perform when leaving this screen (state change)
     */
    onDestroyEvent: function() {
      me.event.unsubscribe(this.handler);
    }
});

export default TitleScreen;
