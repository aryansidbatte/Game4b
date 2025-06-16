//Title.js
class TitleScene extends Phaser.Scene {
    constructor() { super('TitleScene'); }

    init() {
        this.scrollSpeed = 0.05;   // background pan speed (px / frame)
        this.fadeTime    = 400;   // ms for fade-in/out
    }

    create() {
        const { width, height } = this.scale;

        /* parallax background */
        this.background = this.add
            .tileSprite(0, -200, 1440, 396, 'level_background')
            .setScale(8.5)
            .setScrollFactor(0) 
            .setDepth(-1)
            .setOrigin(0);

        /* fade-in from black */
        this.cameras.main.fadeIn(this.fadeTime, 0, 0, 0);

        /* game title */
        this.add.text(width * 0.5, height * 0.25, "Greenie's Jumping Adventure", {
            fontFamily: 'sans-serif',
            fontSize  : '64px',
            color     : '#61A933',
            stroke    : '#9999',
            strokeThickness: 4
        }).setOrigin(0.5);

        /* “Start” button */
        const startBtn = this.add.text(width * 0.5, height * 0.55, '▶  Start', {
            fontFamily: 'sans-serif',
            fontSize  : '32px',
            backgroundColor: '#eeeeee',
            color     : '#000',
            padding   : { left: 24, right: 24, top: 12, bottom: 12 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        startBtn.on('pointerup', () => this.startGame());
        this.input.keyboard.once('keydown-SPACE', () => this.startGame());

        /* Credits shortcut */
        const credBtn = this.add.text(width * 0.5, height * 0.7, 'Credits', {
            fontFamily: 'sans-serif',
            fontSize  : '24px',
            color     : '#000000'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        credBtn.on('pointerup', () => this.showCredits());
    }

    update(_, delta) {
        this.background.tilePositionX += this.scrollSpeed * delta;
    }

    // ─────────────────────────────────────────────────────────────
    startGame() {
        this.cameras.main.fadeOut(this.fadeTime, 0, 0, 0);
        this.time.delayedCall(this.fadeTime, () => {
            this.scene.start('platformerScene', { map: 'hub-world', spawn: 'spawn' });
        });
    }

    showCredits() {
        this.cameras.main.fadeOut(this.fadeTime, 0, 0, 0);
        this.time.delayedCall(this.fadeTime, () => {
            this.scene.start('creditsScene');
        });
    }
}