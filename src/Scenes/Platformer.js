//Platformer.js

// Global table survives scene restarts and world hops
window.gameSave = window.gameSave ?? {
    // structure will end up like:
    // candy-world:    { keyCollected: true }
    // industry-world: { keyCollected: false }
};

window.gameSave.keysHeld = window.gameSave.keysHeld ?? 0;   // total keys in inventory

class Platformer extends Phaser.Scene {
    constructor () { super('platformerScene'); }

    /* ---------------------------------- bootstrap ---------------------------------- */
    init (data) {
        this.mapKey   = data.map   ?? 'hub-world';  // default on first load
        this.spawnTag = data.spawn ?? null;         // undefined → use map's "spawn"
        this.ACCELERATION = 400;
        this.DRAG         = 1000;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -400;
        this.SCALE = 2;
        this.walkCounter = 0; // used to play random footstep sounds

        this.maxVelocity = 200; // max velocity for player sprite

        this.WALL_SLIDE_SPEED   = 80;   // max fall speed while hugging wall
        this.WALL_JUMP_VEL_X    = 50;   // kick-off force
        this.WALL_JUMP_VEL_Y    = -350; // vertical boost
        this.wallJumpLockMs     = 200;  // short lock-out so you can’t spam-jump
        this._nextWallJumpTime  = 0;    // timestamp helper
    }

    create () {
        // map configuration
        this.map = this.make.tilemap({ key: this.mapKey });
        const map = this.map;   // optional shorthand

        const ts1 = map.addTilesetImage('tilemap_packed1', 'tilemap_sheet1');
        const ts2 = map.addTilesetImage('tilemap_packed2', 'tilemap_sheet2');
        const ts3 = map.addTilesetImage('tilemap_packed3', 'tilemap_sheet3');

        const ground = map.createLayer('Ground-n-Platforms', [ts1, ts2, ts3]);
        ground.setCollisionByProperty({ collides: true });

        this.physics.world.setBounds(
                0, 0,
                this.map.widthInPixels,      // full pixel width of the map
                this.map.heightInPixels      // full pixel height of the map
            );

        /* 2 ─────────── choose the correct spawn point */
        const spawnLayer  = map.getObjectLayer('Spawns')       // try a layer literally called "Spawns"
                         ?? map.getObjectLayer('Objects')      // or "Objects"
                         ?? { objects: [] };

        const defaultSpawn = spawnLayer.objects.find(o => o.name === 'spawn');
        const chosenSpawn  = this.spawnTag
                           ? spawnLayer.objects.find(o => o.name === this.spawnTag) || defaultSpawn
                           : defaultSpawn;

        const spawnX = chosenSpawn?.x ?? 32;
        const spawnY = chosenSpawn?.y ?? 32;

        // player
        my.sprite.player = this.physics.add
            .sprite(spawnX, spawnY, 'platformer_characters', 'tile_0000.png')
            .setCollideWorldBounds(true);

        this.physics.add.collider(my.sprite.player, ground);

        this.physics.world.setBoundsCollision(true, true, true, false);

        // player sounds
        this.jumpSfx = this.sound.add("jump_sfx", {
            volume: 0.4,   // tweak to taste
        });

        this.steps = [
            this.sound.add("step1"),
            this.sound.add("step2"),
            this.sound.add("step3"),
            this.sound.add("step4"),
            this.sound.add("step5")
        ];


        // Door triggers
        const doorObjs = map.getObjectLayer('Doors')?.objects ?? [];
        const doors    = this.physics.add.staticGroup();

        doorObjs.forEach(o => {
            const targetProp = o.properties?.find(p => p.name === 'target')?.value;
            if (!targetProp) {
                console.warn(`Door at (${o.x},${o.y}) is missing 'target' property`);
                return;                                         // skip mis-configured door
            }

            const spawnProp  = o.properties?.find(p => p.name === 'spawn')?.value; // may be undefined

            doors.create(o.x + o.width/2, o.y - o.height/2)
                 .setSize(o.width, o.height)
                 .setVisible(false)
                 .setData('target', targetProp)
                 .setData('spawn',  spawnProp);                 // may be undefined
        });

        if (this.mapKey !== 'hub-world' && defaultSpawn) {
            doors.create(defaultSpawn.x, defaultSpawn.y)       // centre on the spawn point
                .setSize(32, 32)                              // 32×32 invisible hit-box
                .setVisible(false)
                .setData('target', 'hub-world')               // always go back to the hub
                .setData('spawn',  null);                     // hub’s normal 'spawn'
        }

        /* 5 ─────────── camera */
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
                         .startFollow(my.sprite.player)
                         .setZoom(this.SCALE);

        /* 6 ─────────── input */
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');

        this.spaceKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.currentDoor = null;

        /* overlap only *marks* the door we’re touching */
        this.physics.add.overlap(my.sprite.player, doors, (_p, door) => {
            this.currentDoor = door;
        });

        if (this.mapKey === 'industry-world') {
            this.background = this.add.tileSprite(0, 200, 1440, 396, "industry_level_background").setScale(4).setScrollFactor(0.2).setDepth(-1);
        }
        else {
            this.background = this.add.tileSprite(0, 200, 1440, 396, "level_background").setScale(4).setScrollFactor(0.2).setDepth(-1);
        }

        // One time use locks
        if (this.mapKey === 'snow-world') {

            // per map save
            const snowSave = window.gameSave['snow-world'] ?? (window.gameSave['snow-world'] = {
                locksUnlockedCount: 0          // how many locks have been opened so far
            });

            // create lock sprite that are still locked
            const liveLocks = this.map.createFromObjects('Objects', {
                name : 'lock',
                key  : 'tilemap_sheet1',
                frame: 28
            }).filter(() => snowSave.locksUnlockedCount < 2);   // skip if both gone

            if (liveLocks.length) {
                this.physics.world.enable(liveLocks, Phaser.Physics.Arcade.STATIC_BODY);
                this.lockGroup   = this.add.group(liveLocks);
                this.currentLock = null;

                this.physics.add.overlap(my.sprite.player, this.lockGroup, (_p, lock) => {
                    this.currentLock = lock;
                });
            }

            // credits door 
            const creditsArr = this.map.createFromObjects('Objects', {
                name : 'credits',
                key  : 'tilemap_sheet1',
                frame: 29
            });
            if (creditsArr.length) {
                this.physics.world.enable(creditsArr, Phaser.Physics.Arcade.STATIC_BODY);
                this.creditsGroup  = this.add.group(creditsArr).setVisible(snowSave.locksUnlockedCount === 2);
                this.currentCredit = null;

                this.physics.add.overlap(my.sprite.player, this.creditsGroup, (_p, cred) => {
                    this.currentCredit = cred;
                });
            }
        }

        // single use key

        // per map save
        const save = window.gameSave[this.mapKey] ?? (window.gameSave[this.mapKey] = {});

        if (save.keyCollected) return;

        // build keys
        //     layer name = "Objects"
        const keys = this.map.createFromObjects('Objects', {
            name : 'key',                
            key  : 'tilemap_sheet1',
            frame: 27
        });

        if (keys.length === 0) {
            console.warn(`${this.mapKey}: no object named 'key' found on layer "Objects"`);
            return; // Make sure nothing is after this in create()
        }

        this.physics.world.enable(keys, Phaser.Physics.Arcade.STATIC_BODY);

        const keyGroup = this.add.group(keys);

        this.physics.add.overlap(my.sprite.player, keyGroup, (_p, keySprite) => {
            save.keyCollected = true;       // per-map flag
            window.gameSave.keysHeld += 1;  // add to player’s inventory
            keySprite.destroy();
            console.log(`${this.mapKey}: key collected ✔  (keysHeld = ${window.gameSave.keysHeld})`);
        });
    }

    update () {
        
        // wall slide and wall jump logic
        const onGround    = my.sprite.player.body.blocked.down;
        const onLeftWall  = my.sprite.player.body.blocked.left;
        const onRightWall = my.sprite.player.body.blocked.right;
        const onAnyWall   = (onLeftWall || onRightWall) && !onGround;

        if (this.currentDoor &&
            Phaser.Input.Keyboard.JustDown(this.spaceKey)) {

            this.scene.start('platformerScene', {
                map:   this.currentDoor.getData('target'),
                spawn: this.currentDoor.getData('spawn')   // may be undefined
            });
        }

        // clear door if we’re not touching it anymore
        if (this.currentDoor &&
            !this.physics.world.overlap(my.sprite.player, this.currentDoor)) {

            this.currentDoor = null;
        }
        
        
        // left right movement
        const randomStep = () => Phaser.Math.RND.pick(this.steps);

        const randomDetune = () => Phaser.Math.Between(-1000, -500);

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            
            if(my.sprite.player.body.blocked.down && this.walkCounter-- % 6 == 0){
                if(this.walkCounter < 0){
                    this.walkCounter = 20;
                    randomStep().play({
                        volume: 0.1,
                        detune: randomDetune() 
                    });
                }
            }

            if (my.sprite.player.body.velocity.x < -this.maxVelocity) {
                my.sprite.player.body.setVelocityX(-this.maxVelocity);
            }
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            if(my.sprite.player.body.blocked.down && this.walkCounter-- % 6 == 0){
                if(this.walkCounter < 0){
                    this.walkCounter = 20;
                    randomStep().play({
                        volume: 0.1,
                        detune: randomDetune()
                    });
                }
            }

            if (my.sprite.player.body.velocity.x > this.maxVelocity) {
                my.sprite.player.body.setVelocityX(this.maxVelocity);
            }
        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }
        // Wall Slide
        if (onAnyWall && my.sprite.player.body.velocity.y > this.WALL_SLIDE_SPEED) {
            my.sprite.player.body.setVelocityY(this.WALL_SLIDE_SPEED);
        }

        // Jump
        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            const now = this.time.now;

            // ground jump
            if (onGround) {
                my.sprite.player.setVelocityY(this.JUMP_VELOCITY);
                this.jumpSfx.play();
            }
            // wall jump
            else if (onAnyWall && now >= this._nextWallJumpTime) {
                my.sprite.player.setVelocityY(this.WALL_JUMP_VEL_Y);
                if (onLeftWall)  my.sprite.player.setVelocityX(this.WALL_JUMP_VEL_X);
                if (onRightWall) my.sprite.player.setVelocityX(-this.WALL_JUMP_VEL_X);
                this._nextWallJumpTime = now + this.wallJumpLockMs;
                this.jumpSfx.play();
            }
        }

        // anim in air
        if (!onGround) my.sprite.player.anims.play('jump');

        // vertical wrap-around
        const worldTop    = this.physics.world.bounds.top;
        const worldBottom = this.physics.world.bounds.bottom;
        const buffer      = 4;

        if (my.sprite.player.body.y > worldBottom) {
            my.sprite.player.body.reset(my.sprite.player.x, worldTop + buffer);
            my.sprite.player.body.setVelocityY(0);
        }

        // unlock a lock w/ space key
        if (this.currentLock && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {

            if (window.gameSave.keysHeld > 0) {
                window.gameSave.keysHeld -= 1; // use 1 key
                this.currentLock.destroy();    // destory spite
                this.currentLock = null;

                const snowSave = window.gameSave['snow-world'];
                snowSave.locksUnlockedCount += 1; // save data
                console.log(`Unlocked a lock! (${snowSave.locksUnlockedCount}/2)  keysHeld=${window.gameSave.keysHeld}`);

                // Credits if both locks are cleared
                if (snowSave.locksUnlockedCount === 2 && this.creditsGroup) {
                    this.creditsGroup.setVisible(true);
                    console.log('All locks cleared → credits enabled.');
                }
            } else {
                console.log('Door is locked — you have no keys!');
            }
        }

        /* ── press SPACE on credits to roll credits ───────────── */
        if (this.currentCredit && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start('creditsScene');   // change the scene key if needed
        }

        /* quick restart */
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart({ map: this.mapKey, spawn: this.spawnTag });
        }
    }
}