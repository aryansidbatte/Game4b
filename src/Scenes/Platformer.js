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
        this.DRAG         = 500;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.SCALE = 2;
    }

    /* ---------------------------------- create ---------------------------------- */
    create () {
        /* 1 ─────────── build the map & collision */
        this.map = this.make.tilemap({ key: this.mapKey });
        const map = this.map;   // optional shorthand


        const ts1 = map.addTilesetImage('tilemap_packed1', 'tilemap_sheet1');
        const ts2 = map.addTilesetImage('tilemap_packed2', 'tilemap_sheet2');
        const ts3 = map.addTilesetImage('tilemap_packed3', 'tilemap_sheet3');

        const ground = map.createLayer('Ground-n-Platforms', [ts1, ts2, ts3]);
        ground.setCollisionByProperty({ collides: true });

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

        /* 3 ─────────── player */
        my.sprite.player = this.physics.add
            .sprite(spawnX, spawnY, 'platformer_characters', 'tile_0000.png')
            .setCollideWorldBounds(true);

        this.physics.add.collider(my.sprite.player, ground);

        /* 4 ─────────── invisible door triggers */
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

        /* ── ONE-USE LOCKS (SnowWorld) ───────────────────────────── */
        if (this.mapKey === 'snow-world') {

            console.warn('SnowWorld: locks and credits are experimental!');

            /* ---------- persistent per-map save --------- */
            const snowSave = window.gameSave['snow-world'] ?? (window.gameSave['snow-world'] = {
                locksUnlockedCount: 0          // how many locks have been opened so far
            });

            /* ---------- build every lock sprite that is still locked ---------- */
            const liveLocks = this.map.createFromObjects('Objects', {
                name : 'lock',                 // <-- both of your objects are named “lock”
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

            /* ---------- build the credits object (hidden until all locks gone) ---------- */
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

        /* 7 ─── single-use key ─────────────────────────────────────────────── */

        // ❶ set up a tiny per-map save record
        const save = window.gameSave[this.mapKey] ?? (window.gameSave[this.mapKey] = {});

        // ❷ quit early if key already collected in this map
        if (save.keyCollected) return;

        // ❸ build sprites from Tiled objects named "key"
        //     layer name = "Objects"
        const keys = this.map.createFromObjects('Objects', {
            name : 'key',                // Tiled: Name field must be exactly "key"
            key  : 'tilemap_sheet1',     // texture key you loaded in Load.js
            frame: 27                    // frame index / frame name that looks like a key
        });

        if (keys.length === 0) {
            console.warn(`${this.mapKey}: no object named 'key' found on layer "Objects"`);
            return; // Make sure nothing is after this in create()
        }

        // ❹ give them static physics bodies so Arcade overlap works
        this.physics.world.enable(keys, Phaser.Physics.Arcade.STATIC_BODY);

        // ❺ put them in a normal display group (optional but tidy)
        const keyGroup = this.add.group(keys);

        // ❻ overlap → collect once
        this.physics.add.overlap(my.sprite.player, keyGroup, (_p, keySprite) => {
            save.keyCollected = true;       // per-map flag
            window.gameSave.keysHeld += 1;  // add to player’s inventory
            keySprite.destroy();
            console.log(`${this.mapKey}: key collected ✔  (keysHeld = ${window.gameSave.keysHeld})`);
        });
    }

    /* ---------------------------------- update ---------------------------------- */
    update () {
        if (this.currentDoor &&
            Phaser.Input.Keyboard.JustDown(this.spaceKey)) {

            this.scene.start('platformerScene', {
                map:   this.currentDoor.getData('target'),
                spawn: this.currentDoor.getData('spawn')   // may be undefined
            });
        }

        /* 2. clear the reference as soon as we’re no longer overlapping         */
        if (this.currentDoor &&
            !this.physics.world.overlap(my.sprite.player, this.currentDoor)) {

            this.currentDoor = null;
        }
        
        
        /* ----- your existing left / right / jump logic ----- */
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // smoke etc.
        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.setVelocityY(this.JUMP_VELOCITY);
            this.JUMP_VELOCITY = -600;
        }

        /* ── unlock a lock with SPACE ─────────────────────────── */
        if (this.currentLock && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {

            if (window.gameSave.keysHeld > 0) {
                window.gameSave.keysHeld -= 1;                 // consume one key
                this.currentLock.destroy();                    // remove lock sprite
                this.currentLock = null;

                const snowSave = window.gameSave['snow-world'];
                snowSave.locksUnlockedCount += 1;              // remember permanently
                console.log(`Unlocked a lock! (${snowSave.locksUnlockedCount}/2)  keysHeld=${window.gameSave.keysHeld}`);

                /* reveal credits when both locks gone */
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
            this.scene.start('CreditsScene');   // change the scene key if needed
        }

        /* quick restart */
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart({ map: this.mapKey, spawn: this.spawnTag });
        }
    }
}