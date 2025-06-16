//Credits.js
class CreditsScene extends Phaser.Scene {
    constructor() { super('creditsScene'); }

    init() {
        this.scrollSpeed = 50;          // px per second
        this.fadeTime    = 500;         // ms
    }

    create() {
        const { width, height } = this.scale;

        /* Black background */
        this.cameras.main.setBackgroundColor('#000');
        this.cameras.main.fadeIn(this.fadeTime);

        /* credits content */
        const lines = [
            "Greenie's Jumping Adventure",
            '',
            'Design & Code',
            'Aryan Sidbatte',
            '',
            'Art Assets',
            'Kenney.nl  (CC0)',
            '',
            'Sound',
            'Aryan Sidbatte',
            '',
            'Thank you for playing!'
        ];

        const style = { fontFamily: 'sans-serif', fontSize: '24px', align: 'center', color: '#ffffff' };
        this.creditText = this.add.text(width * 0.5, height + 50, lines, style)
                                   .setOrigin(0.5, 0);   // top-center
        this.creditText.setLineSpacing(6);

        /* input to skip */
        this.input.keyboard.once('keydown-ESC',  () => this.endCredits());
        this.input.keyboard.once('keydown-SPACE',() => this.endCredits());
        this.input.once('pointerup',             () => this.endCredits());
    }

    update(time, delta) {
        /* scroll upward */
        this.creditText.y -= this.scrollSpeed * (delta / 1000);

        /* when the entire text has left the screen, end automatically */
        if (this.creditText.y + this.creditText.height < 0) {
            this.endCredits();
        }
    }

    endCredits() {
        /* fade out, then jump to hub world */
        this.cameras.main.fadeOut(this.fadeTime);
        this.time.delayedCall(this.fadeTime, () => {
            this.scene.start('TitleScene');
        });
    }
}