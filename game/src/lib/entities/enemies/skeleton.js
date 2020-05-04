const COOL_DOWN = 400;
const LINE_OF_SIGHT = 160;

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

    let frames = 0;
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
    this.coolDown = {
      duration: 0,
      isCooling: false
    };
    this.recordedAttack = null;
    this.isAttacking = false;
    this.faceRight = true;
    this.health = 30;
  },

  swapToMoveable: function() {
    this.isAttacking = false;
    this.anchorPoint.set(-0.8, -0.4);
    this.renderable = this.movementRenderable;
  },

  swapToAttack: function() {
    this.isAttacking = true;
    this.anchorPoint.set(this.faceRight ? 0.7 : 0, 0.1);
    this.renderable = this.attackRenderable;
  },

  requireCooldown: function(duration = COOL_DOWN) {
    this.coolDown = {
      duration,
      isCooling: duration > 0
    };
  },

  takeHit: function(recordedAttack) {
    if (recordedAttack !== this.recordedAttack) {
      this.recordedAttack = recordedAttack;
      this.health -= recordedAttack.hitPower;
      this.requireCooldown();
      this.swapToMoveable();
      this.renderable.flicker(200);
      if (this.health <= 0) {
        this.alive = false;
        this.renderable.setCurrentAnimation("death", () => {
          me.game.world.removeChild(this);
          return false;
        });
      } else {
        this.renderable.setCurrentAnimation("hit", () => {
          return false;
        });
      }
    }
  },

  attack: function() {
    this.swapToAttack();
    this.renderable.setCurrentAnimation("startAttack2", () => {
      this.createSwordAttack();
      this.renderable.setCurrentAnimation("attack2", () => {
        this.swapToMoveable();
        this.requireCooldown();
        this.renderable.setCurrentAnimation("stand");
        return false;
      });
      this.renderable.setAnimationFrame();
    });
    this.renderable.setAnimationFrame();
  },

  conditionalRender: function(condition, action) {
    if (condition && !this.renderable.isCurrentAnimation(action)) {
      this.renderable.setCurrentAnimation(action);
    }
  },

  createSwordAttack: function() {
    let attack = me.pool.pull('enemySlashAttack',
      this.pos.x + (this.faceRight ? 0 : -25),
      this.pos.y,
      { width: 50, height: 20, source: this });
    me.game.world.addChild(attack);
    return attack;
  },

  checkAndWalk: function(left, distance) {
    this.faceRight = !left;
    this.renderable.flipX(left);
    this.attackRenderable.flipX(left);
    if (distance > this.attackDistance && distance < LINE_OF_SIGHT) {
      let multipler = left ? -1 : 1;
      this.body.vel.x = this.body.vel.x + (multipler * this.body.maxVel.x * me.timer.tick);
      this.conditionalRender(true, "walk");
    } else {
      this.body.vel.x = 0;
      this.conditionalRender(!this.isAttacking, "stand");
    }
  },

  update: function(dt) {
    if (!this.mainPlayer) {
      this.mainPlayer = me.game.world.getChildByProp("name", "mainPlayer")[0];
    }

    // cooldown or be aggro
    if (this.coolDown.isCooling) {
      this.coolDown.duration -= dt;
      if (this.coolDown.duration <= 0) {
        this.coolDown.isCooling = false;
      }
    } else if (this.alive && !this.isAttacking) {
      let headLeft = true;
      let distance = this.mainPlayer.pos.distance(this.pos);
      if (this.mainPlayer.pos.x < this.pos.x) {
        this.checkAndWalk(headLeft, distance);
      } else if (this.mainPlayer.pos.x > this.pos.x) {
        this.checkAndWalk(!headLeft, distance);
      }

      if (distance <= this.attackDistance && this.body.vel.x === 0) {
        this.attack();
      }
    }
    this.body.update(dt);
    me.collision.check(this);
    return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
  },

  onCollision: function(resp, other) {
    if (resp.b.body.collisionType === me.collision.types.PROJECTILE_OBJECT) {
      this.takeHit(other);
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
