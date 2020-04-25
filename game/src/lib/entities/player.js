
const SwordAttack = me.Entity.extend({
  init: function(x, y, settings) {
    var points;
    if (settings.source.isOnTheGround()) {
      var xAdjust = settings.source.faceRight ? 0 : -15;
      points = [
        new me.Vector2d(xAdjust, 0),
        new me.Vector2d(xAdjust + settings.width + 13, 0),
        new me.Vector2d(xAdjust + settings.width + 13, settings.height + 5),
        new me.Vector2d(xAdjust, settings.height + 5)
      ];
    } else {
      var xAdjust = settings.source.faceRight ? -10 : -15;
      points = [
        new me.Vector2d(xAdjust, 0),
        new me.Vector2d((settings.width + 23) + xAdjust, 0),
        new me.Vector2d((settings.width + 23) + xAdjust, settings.height * 0.75),
        new me.Vector2d(xAdjust, settings.height * 0.75)
      ];
    }
    settings.shapes = [
      new me.Polygon(0, 0, points)
    ];
    settings.collisionMask = (me.collision.types.ENEMY_OBJECT);
    this._super(me.Entity, 'init', [x, y, settings]);
    this.source = settings.source;
    this.inTheAir = !settings.source.isOnTheGround();
    this.hitPower = settings.source.strength;
    this.body.collisionType = me.collision.types.PROJECTILE_OBJECT;
    this.maxExistence = (me.sys.fps / 20) * 6;
  },

  update: function(dt) {
    this.pos.add(this.source.body.vel);
    if (this.maxExistence-- <= 0 || (this.source.isOnTheGround() && this.inTheAir)) {
      me.game.world.removeChild(this);
      return false;
    }
    return this._super(me.Entity, 'update', [dt]);
  }
});

const PlayerEntity = me.Entity.extend({
  /**
   * constructor
   */
  init: function(x, y, settings) {
    // call the constructor
    this._super(me.Entity, 'init', [x, y, settings]);

    this.alwaysUpdate = true;
    var frames = 0;
    this.renderable.addAnimation("jumpAttack", [frames++, frames++, frames++, frames++]);
    this.renderable.addAnimation("attack2", [frames++, frames++, frames++, frames++, frames++, frames++]);
    this.renderable.addAnimation("hit", [frames++, frames++, frames++]);
    this.renderable.addAnimation("startAttack", [frames++, frames++]);
    this.renderable.addAnimation("attack", [frames++, frames++, frames++]);
    this.renderable.addAnimation("fall", [frames++, frames++]);
    this.renderable.addAnimation("stand", [frames++, frames++, frames++, frames++], 200);
    this.renderable.addAnimation("stand2", [frames++, frames++, frames++, frames++], 200);
    this.renderable.addAnimation("jump", [frames++, frames++, frames++, frames++]);
    this.renderable.addAnimation("walk", [frames++, frames++, frames++, frames++, frames++, frames++]);
    this.renderable.addAnimation("sheath", [frames++, frames++, frames++, frames++]);
    this.renderable.setCurrentAnimation("stand");

    this.anchorPoint.set(-0.80,-0.2);
    this.body.setMaxVelocity(1.5, 7.5);
    this.body.setFriction(0.4, 0);
    this.body.gravity = new me.Vector2d(0, 0.45);
    this.body.collisionType = me.collision.types.PLAYER_OBJECT;
    this.isKinematic = false;
    this.isJumpingAttack = false;
    this.isStandingAttack = false;
    this.faceRight = true;
    this.takingDamaage = false;
    this.strength = 10;

    me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH, 0.4);
  },

  isOnTheGround: function() {
    return !this.body.jumping && !this.body.falling;
  },

  doStand: function() {
    if (this.isStationary() && !this.isStandingAttack && !this.renderable.isCurrentAnimation("stand")) {
      this.renderable.setCurrentAnimation("stand");
    }
  },

  doHit: function() {
    if (!this.renderable.isFlickering() && !this.takingDamaage) {
      this.takingDamaage = true;
      this.renderable.flicker(1000);
      this.renderable.setCurrentAnimation("hit", (function() {
        this.takingDamaage = false;
        return false;
      }).bind(this));
      this.renderable.setAnimationFrame();
    }
  },

  doWalk: function() {
    this.doConditionalRender(this.body.vel.x !== 0 && this.isOnTheGround(), "walk", true);
  },

  isStationary: function() {
    return this.body.vel.x === 0 && this.isOnTheGround();
  },

  doConditionalRender: function(condition, action, repeat) {
    if (condition && !this.renderable.isCurrentAnimation(action)) {
      this.renderable.setCurrentAnimation(action, function() {
        return repeat || false;
      });
      this.renderable.setAnimationFrame();
    }
  },

  /**
   * update the entity
   */
  update: function(dt) {
    if (!this.takingDamaage) {
      if (!this.isStandingAttack && me.input.isKeyPressed("left")) {
        this.faceRight = false;
        this.renderable.flipX(!this.faceRight);
        this.body.vel.x = -this.body.maxVel.x * me.timer.tick;
        this.doWalk();
      } else if (!this.isStandingAttack && me.input.isKeyPressed("right")) {
        this.faceRight = true;
        this.renderable.flipX(!this.faceRight);
        this.body.vel.x = this.body.maxVel.x * me.timer.tick;
        this.doWalk();
      } else {
        this.body.vel.x = 0;
        this.doConditionalRender(!this.isStandingAttack && this.isStationary(), "stand", true);
      }

      if (this.isOnTheGround() && this.isJumpingAttack) {
        this.isJumpingAttack = false;
      }

      if (me.input.isKeyPressed("jump")) {
        if (!this.isStandingAttack && this.isOnTheGround()) {
          this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
          this.body.jumping = true;
        }
      }

      if (me.input.isKeyPressed("attack")) {
        if (this.isOnTheGround()) {
          this.isStandingAttack = true;
          this.renderable.setAnimationFrame();
          this.renderable.setCurrentAnimation("startAttack", (function() {
            var attack = me.pool.pull("attackSword",
              this.pos.x,
              this.pos.y - 5,
              {  width: 20, height: 32, source: this });
            me.game.world.addChild(attack);
            this.renderable.setCurrentAnimation("attack", (function() {
              this.isStandingAttack = false;
              this.renderable.setCurrentAnimation("stand");
              return false;
            }).bind(this));
            this.renderable.setAnimationFrame();
          }).bind(this));
        } else if (!this.isOnTheGround()) {
          this.isJumpingAttack = true;
          var attack = me.pool.pull("attackSword",
            this.pos.x,
            this.pos.y - 5,
            {  width: 20, height: 32, source: this });
          me.game.world.addChild(attack);
          this.renderable.setCurrentAnimation("jumpAttack", (function() {
            this.isJumpingAttack = false;
            return false;
          }).bind(this));
          this.renderable.setAnimationFrame();
        }
      }

      this.doConditionalRender(this.body.jumping && !this.isJumpingAttack, "jump");
      this.doConditionalRender(this.body.falling && !this.isJumpingAttack, "fall");
      // Always check if we're standing
      // this.doStand();
    }

    // apply physics to the body (this moves the entity)
    this.body.update(dt);

    // handle collisions against other shapes
    me.collision.check(this);

    // return true if we moved or if the renderable was updated
    return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
  },

 /**
   * (called when colliding with other objects)
   */
  onCollision: function (response, other) {
    if (response.b.body.collisionType === me.collision.types.ENEMY_OBJECT) {
      var overlappingX = Math.abs(response.overlapV.x);
      var overlappingY = Math.abs(response.overlapV.y);
      response.overlapV.x = 0;
      response.overlapV.y = 0;
      if (other.alive
        && (overlappingX > 1 || overlappingY > 1)
        && (!other.renderable
          || (other.renderable && !other.renderable.isFlickering()))) {
        this.doHit();
      }
      return false;
    }
    return true;
  }
});

export {
  PlayerEntity,
  SwordAttack
};
