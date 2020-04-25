import 'melonjs';
import game from './lib/game';
import './index.css';

// Entry point to game
me.device.onReady(() => {
  game.onload();
});
