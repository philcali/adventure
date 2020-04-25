const COOL_DOWN = (me.sys.fps / 20) * 5;

const SkeletonAttack = me.Entity.extend({
  init: function(x, y, settings) {
    settings.collisionMask = (me.collision.types.PLAYER_OBJECT);
    this._super(me.Entity, 'init', [x, y, settings]);
    this.source = settings.source;
    this.hitPower = settings.source.strength;
    this.body.collisionType = me.collision.types.ENEMY_OBJECT;;
  },

  update: function(dt) {
    if (!this.source.isAttacking) {
      me.game.world.removeChild(this);
      return false;
    }
    return this._super(me.Entity, 'update', [dt]);
  }
});

/**
 * Basic Skeleton
 */
const Skeleton = me.Entity.extend({
  init: function(x, y, settings) {
    this._super(me.Entity, 'init', [x, y, settings]);

    this.body.setMaxVelocity(0.6, 6);
    this.body.setFriction(0.4, 0);
    this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT
      | me.collision.types.PROJECTILE_OBJECT
      | me.collision.types.WORLD_SHAPE);
    this.anchorPoint.set(-0.8, -0.4);
    this.isKinematic = false;

    var frames = 0;
    this.renderable.addAnimation("death", [frames++, frames++, frames++, frames++, frames++, frames++]);
    this.renderable.addAnimation("hit", [frames++, frames++, frames++], 150);
    this.renderable.addAnimation("stand", [frames++, frames++, frames++], 200);
    this.renderable.addAnimation("walk", [frames++, frames++, frames++, frames++, frames++, frames++]);
    this.renderable.setCurrentAnimation("stand");
    this.movementRenderable = this.renderable;
    frames = 0;
    this.attackRenderable = new me.Sprite(0, 0, {
      image: 'basic_skeleton_attack',
      framewidth: 100,
      frameheight: 65
    });
    this.attackRenderable.addAnimation("startAttack", [frames++, frames++, frames++]);
    this.attackRenderable.addAnimation("attack1", [frames++, frames++, frames++]);
    this.attackRenderable.addAnimation("startAttack2", [frames++, frames++, frames++]);
    this.attackRenderable.addAnimation("attack2", [frames++, frames++, frames++]);
    this.attackDistance = 25;

    this.mainPlayer = null;
    this.faceLeft = true;
    this.takingDamage = false;
    this.coolDown = COOL_DOWN;
    this.recordedAttack = null;
    this.isAttacking = false;
    this.faceRight = true;
    this.health = 30;
  },

  swapToMoveable: function() {
    this.anchorPoint.set(-0.8, -0.4);
    this.renderable = this.movementRenderable;
    this.isAttacking = false;
  },

  doHit: function(recordedAttack) {
    if (recordedAttack !== this.recordedAttack) {
      this.recordedAttack = recordedAttack;
      this.health -= recordedAttack.hitPower;
      this.takingDamage = true;
      this.coolDown = COOL_DOWN;
      this.swapToMoveable();
      this.renderable.flicker(200);
      if (this.health <= 0) {
        this.alive = false;
        this.renderable.setCurrentAnimation("death", (function() {
          me.game.world.removeChild(this);
          return false;
        }).bind(this));
      } else {
        this.renderable.setCurrentAnimation("hit", (function() {
          this.takingDamage = false;
          return false;
        }).bind(this));
      }
    }
  },

  doConditionalRender: function(condition, action) {
    if (condition && !this.renderable.isCurrentAnimation(action)) {
      this.renderable.setCurrentAnimation(action);
    }
  },

  update: function(dt) {
    if (!this.mainPlayer) {
      this.mainPlayer = me.game.world.getChildByProp("name", "mainPlayer")[0];
    }

    // left
    if (!this.isAttacking && !this.takingDamage && this.coolDown-- <= 0) {
      if (this.mainPlayer.pos.x < this.pos.x) {
        this.faceRight = false;
        this.renderable.flipX(true);
        this.attackRenderable.flipX(true);
        if (this.mainPlayer.pos.distance(this.pos) > this.attackDistance) {
          this.body.vel.x -= this.body.maxVel.x * me.timer.tick;
          this.doConditionalRender(true, "walk");
        } else {
          this.body.vel.x = 0;
        }
      } else if (this.mainPlayer.pos.x > this.pos.x) {
        this.faceRight = true;
        this.renderable.flipX(false);
        this.attackRenderable.flipX(false);
        if (this.mainPlayer.pos.distance(this.pos) > this.attackDistance) {
          this.body.vel.x += this.body.maxVel.x * me.timer.tick;
          this.doConditionalRender(true, "walk");
        } else {
          this.body.vel.x = 0;
        }
      }

      if (this.body.vel.x === 0 && !this.isAttacking) {
        this.isAttacking = true;
        this.anchorPoint.set(this.faceRight ? 0.7 : 0, 0.1);
        this.renderable = this.attackRenderable;
        this.renderable.setCurrentAnimation("startAttack2", (function() {
          var attack = me.pool.pull('enemySlashAttack',
            this.pos.x + (this.faceRight ? 0 : -25),
            this.pos.y,
            { width: 50, height: 20, source: this });
          me.game.world.addChild(attack);
          this.renderable.setCurrentAnimation("attack2", (function() {
            this.swapToMoveable();
            return false;
          }).bind(this));
          this.renderable.setAnimationFrame();
        }).bind(this));
        this.renderable.setAnimationFrame();
      }
      // this.doConditionalRender(this.body.vel.x === 0, "stand");
    }
    this.body.update(dt);
    me.collision.check(this);
    return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
  },

  onCollision: function(resp, other) {
    if (resp.b.body.collisionType === me.collision.types.PROJECTILE_OBJECT) {
      this.doHit(other);
    }
    if (resp.b.body.collisionType === me.collision.types.PLAYER_OBJECT) {
      resp.overlapV.x = 0;
      resp.overlapV.y = 0;
      return false;
    }
    return true;
  }
});

export {
  Skeleton,
  SkeletonAttack
};
