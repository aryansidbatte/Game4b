class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("tilemap_packed1", "tilemap_packed1.png");            // Packed tilemap
        this.load.image("tilemap_packed2", "tilemap_packed2.png");            // Packed tilemap
        this.load.image("tilemap_packed3", "tilemap_packed3.png");            // Packed tilemap

        this.load.image("level_background", "LevelBackground.png");
        this.load.image("industry_level_background", "IndustryWorldBackground.png");

        this.load.tilemapTiledJSON("hub-world", "HubWorld.tmj");             // Tilemap in JSON
        this.load.tilemapTiledJSON("candy-world", "CandyWorld.tmj");         // Tilemap in JSON
        this.load.tilemapTiledJSON("industry-world", "IndustryWorld.tmj");   // Tilemap in JSON
        this.load.tilemapTiledJSON("snow-world", "SnowWorld.tmj");           // Tilemap in JSON

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet1", "tilemap_packed1.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet("tilemap_sheet2", "tilemap_packed2.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet("tilemap_sheet3", "tilemap_packed3.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.audio("jump_sfx", "jump.wav");
        this.load.audio("step1", "step1.ogg");
        this.load.audio("step2", "step2.ogg");
        this.load.audio("step3", "step3.ogg");
        this.load.audio("step4", "step4.ogg");
        this.load.audio("step5", "step5.ogg");

        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

         // ...and pass to the next Scene

        this.scene.start('TitleScene');
        //this.scene.start('platformerScene', { map: 'hub-world', spawn: 'hubSpawn' });
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}