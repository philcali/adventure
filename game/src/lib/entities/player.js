
const SwordAttack = me.Entity.extend({
  init: function(x, y, settings) {
    let points;
    if (settings.source.isOnTheGround()) {
      let xAdjust = settings.source.faceRight ? 0 : -15;
      points = [
        new me.Vector2d(xAdjust, 0),
        new me.Vector2d(xAdjust + settings.width + 13, 0),
        new me.Vector2d(xAdjust + settings.width + 13, settings.height + 5),
        new me.Vector2d(xAdjust, settings.height + 5)
      ];
    } else {
      let xAdjust = settings.source.faceRight ? -10 : -15;
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
    this.maxExistence = 300;
  },

  update: function(dt) {
    this.pos.add(this.source.body.vel);
    this.maxExistence -= dt;
    if (this.maxExistence <= 0 || (this.source.isOnTheGround() && this.inTheAir)) {
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
    let frames = 0;
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

    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");
    me.input.bindKey(me.input.KEY.J, "attack", true);
    me.input.bindKey(me.input.KEY.K, "jump", true);

    me.game.viewport.follow(this, me.game.viewport.AXIS.BOTH, 0.4);
  },

  isOnTheGround: function() {
    return !this.body.jumping && !this.body.falling;
  },

  stand: function() {
    this.body.vel.x = 0;
    if (this.isStationary() && !this.isStandingAttack && !this.renderable.isCurrentAnimation("stand")) {
      this.renderable.setCurrentAnimation("stand");
      return true;
    }
    return false;
  },

  takeHit: function() {
    if (!this.renderable.isFlickering() && !this.takingDamaage) {
      this.takingDamaage = true;
      this.renderable.flicker(1000);
      this.renderable.setCurrentAnimation("hit", () => {
        this.takingDamaage = false;
        return false;
      });
      this.renderable.setAnimationFrame();
      return true;
    }
    return false;
  },

  walk: function(left) {
    this.faceRight = !left;
    this.renderable.flipX(left);
    let multiplier = left ? -1 : 1;
    this.body.vel.x = multiplier * this.body.maxVel.x * me.timer.tick;
    return this.doConditionalRender(this.isOnTheGround(), "walk", true);
  },

  isStationary: function() {
    return this.body.vel.x === 0 && this.isOnTheGround();
  },

  doConditionalRender: function(condition, action, repeat) {
    if (condition && !this.renderable.isCurrentAnimation(action)) {
      this.renderable.setCurrentAnimation(action, () => {
        return repeat || false;
      });
      this.renderable.setAnimationFrame();
      return true;
    }
    return false;
  },

  createSwordAttack: function() {
    let attack = me.pool.pull("attackSword",
      this.pos.x,
      this.pos.y - 5,
      {  width: 20, height: 32, source: this });
    me.game.world.addChild(attack);
    return attack;
  },

  groundAttack: function() {
    this.isStandingAttack = true;
    this.renderable.setAnimationFrame();
    this.renderable.setCurrentAnimation("startAttack", () => {
      this.createSwordAttack();
      this.renderable.setCurrentAnimation("attack", () => {
        this.isStandingAttack = false;
        this.renderable.setCurrentAnimation("stand");
        return false;
      });
      this.renderable.setAnimationFrame();
    });
    return true;
  },

  airAttack: function() {
    this.isJumpingAttack = true;
    this.createSwordAttack();
    this.renderable.setCurrentAnimation("jumpAttack", () => {
      this.isJumpingAttack = false;
      return false;
    });
    this.renderable.setAnimationFrame();
    return true;
  },

  /**
   * update the entity
   */
  update: function(dt) {
    let frameUpdate = false;
    if (!this.takingDamaage) {
      if (me.input.isKeyPressed("left") && !this.isStandingAttack) {
        frameUpdate = this.walk(true) || frameUpdate;
      } else if (me.input.isKeyPressed("right") && !this.isStandingAttack) {
        frameUpdate = this.walk(false) || frameUpdate;
      } else {
        frameUpdate = this.stand() || frameUpdate;
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
          frameUpdate = this.groundAttack() || frameUpdate;
        } else if (!this.isOnTheGround()) {
          frameUpdate = this.airAttack() || frameUpdate;
        }
      }

      frameUpdate = this.doConditionalRender(this.body.jumping && !this.isJumpingAttack, "jump")
        || this.doConditionalRender(this.body.falling && !this.isJumpingAttack, "fall")
        || frameUpdate;
    }

    // apply physics to the body (this moves the entity)
    this.body.update(dt);

    // handle collisions against other shapes
    me.collision.check(this);

    // return true if we moved or if the renderable was updated
    return (this._super(me.Entity, 'update', [dt]) || frameUpdate || this.body.vel.x !== 0 || this.body.vel.y !== 0);
  },

 /**
   * (called when colliding with other objects)
   */
  onCollision: function (response, other) {
    if (response.b.body.collisionType === me.collision.types.ENEMY_OBJECT) {
      let overlappingX = Math.abs(response.overlapV.x);
      let overlappingY = Math.abs(response.overlapV.y);
      response.overlapV.x = 0;
      response.overlapV.y = 0;
      if (other.alive
        && (overlappingX > 1 || overlappingY > 1)
        && (!other.renderable
          || (other.renderable && !other.renderable.isFlickering()))) {
        this.takeHit();
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
