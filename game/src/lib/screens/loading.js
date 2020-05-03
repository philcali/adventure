const ProgressBar = me.Renderable.extend({
  /**
   * @ignore
   */
  init: function (x, y, w, h) {
    this._super(me.Renderable, "init", [x, y, w, h]);
    // flag to know if we need to refresh the display
    this.invalidate = false;
    // current progress
    this.progress = 0;

    this.anchorPoint.set(0, 0);
  },

  /**
   * make sure the screen is refreshed every frame
   * @ignore
   */
  onProgressUpdate : function (progress) {
    this.progress = ~~(progress * this.width);
    this.invalidate = true;
  },

  /**
   * @ignore
   */
  update : function () {
      if (this.invalidate === true) {
          // clear the flag
          this.invalidate = false;
          // and return true
          return true;
      }
      // else return false
      return false;
  },

  /**
   * draw function
   * @ignore
   */
  draw : function (renderer) {
      const color = renderer.getColor();
      const height = renderer.getHeight();
      // draw the progress bar
      renderer.setColor("black");
      renderer.fillRect(this.pos.x, height / 2, this.width, this.height / 2);

      renderer.setColor("red");
      renderer.fillRect(this.pos.x, height / 2, this.progress, this.height / 2);

      renderer.setColor(color);
  }
});

const CustomLoadingScreen = me.Stage.extend({
    onResetEvent : function() {
        // background color
        me.game.world.addChild(new me.ColorLayer("background", "#202020", 0), 0);

        // progress bar
        const progressBar = new ProgressBar(
            0,
            me.video.renderer.getHeight() / 2,
            me.video.renderer.getWidth(),
            8 // bar height
        );

        this.loaderHdlr = me.event.subscribe(
            me.event.LOADER_PROGRESS,
            progressBar.onProgressUpdate.bind(progressBar)
        );

        this.resizeHdlr = me.event.subscribe(
            me.event.VIEWPORT_ONRESIZE,
            progressBar.resize.bind(progressBar)
        );

        me.game.world.addChild(progressBar, 1);
    },

    onDestroyEvent : function () {
        // cancel the callback
        me.event.unsubscribe(this.loaderHdlr);
        me.event.unsubscribe(this.resizeHdlr);
        this.loaderHdlr = this.resizeHdlr = null;
    }
});

export default CustomLoadingScreen;
