# Greenie's Jumping Adventure

**[Play Live Demo](https://aryansidbatte.github.io/Game4b/)**

A 2D platformer game built with Phaser.js featuring physics-based gameplay, multiple worlds, and key-collection mechanics.

## Overview

Greenie's Jumping Adventure is a browser-based platformer where players navigate through three interconnected worlds to collect keys and unlock the final door. The game demonstrates object-oriented JavaScript programming, game physics implementation, and scene management.

## Features

- **Physics-Based Platforming**: Smooth character movement with arcade physics and gravity
- **Multi-World System**: Three unique levels with progressive difficulty
- **Key Collection Mechanic**: Find two keys across the first two worlds to unlock the final world
- **Interactive Objects**: Doors, keys, and environmental triggers
- **Scene Management**: Efficient loading between different game scenes

## Controls

| Key | Action |
|-----|--------|
| ↑ ↓ ← → | Movement (Arrow Keys) |
| Space | Interact with objects |
| R | Restart level at spawn |

## Gameplay

Your mission: Find the two keys hidden in the first two worlds to open the last door in the third world.

## Tech Stack

- **Game Engine**: Phaser 3 (HTML5 game framework)
- **Language**: JavaScript (ES6+)
- **Physics**: Arcade Physics System
- **Rendering**: Canvas/WebGL
- **Deployment**: GitHub Pages

## Project Structure

```
Game4b/
├── src/
│   ├── main.js          # Game configuration and initialization
│   └── Scenes/          # Game scene classes
├── assets/              # Game sprites and assets
├── lib/                 # Phaser library
└── index.html           # Entry point
```

## Getting Started

### Play Online
Visit [https://aryansidbatte.github.io/Game4b/](https://aryansidbatte.github.io/Game4b/)

### Run Locally

1. Clone the repository:
```bash
git clone https://github.com/aryansidbatte/Game4b.git
cd Game4b
```

2. Serve the files using a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server
```

3. Open `http://localhost:8000` in your browser

## Learning Outcomes

This project demonstrates:
- Game loop and scene management
- Collision detection and physics
- State management for game progression
- Asset loading and sprite rendering
- Input handling and player controls

## License

This project was created as part of UCSC coursework.

---

*Built with Phaser.js | Deployed on GitHub Pages*
