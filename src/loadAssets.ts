import type { KAPLAYCtx } from "kaplay";
import { TIME_TOWER_BASE_ANIM_SPEED } from "./constants";

export default function loadAssets(k: KAPLAYCtx) {
    k.loadSprite("level1", "/sprites/level1.png");
    k.loadSprite("level1-2", "/sprites/level1-2.png");
    k.loadSprite("level2", "/sprites/level2.png");
    k.loadSprite("level2-2", "/sprites/level2-2.png");
    k.loadSprite("tree", "/sprites/tree.png");
    k.loadSprite("gold", "/sprites/coin.png");
    k.loadSprite("heart", "/sprites/heart.png");
    k.loadSprite("basic tower", "/sprites/basic-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("basic tower base", "/sprites/basic-tower-base.png");
    k.loadSprite("fire tower", "/sprites/fire-tower.png", {
        sliceX: 5,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 4, loop: false, speed: 20 }
        }
    });
    k.loadSprite("fire tower base", "/sprites/fire-tower-base.png");
    k.loadSprite("slime tower base", "/sprites/slime-tower-base.png");
    k.loadSprite("slime tower", "/sprites/slime-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("ice tower base", "/sprites/ice-tower-base.png");
    k.loadSprite("ice tower", "/sprites/ice-tower.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 5, loop: false, speed: 20 }
        }
    });
    k.loadSprite("lightning tower base", "/sprites/lightning-tower-base.png");
    k.loadSprite("lightning tower", "/sprites/lightning-tower.png", {
        sliceX: 8,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 7, loop: false, speed: 35 }
        }
    });
    k.loadSprite("lux tower base", "/sprites/lux-tower-base.png");
    k.loadSprite("lux tower", "/sprites/lux-tower.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 5, loop: false, speed: 30 }
        }
    });
    k.loadSprite("crow tower base", "/sprites/crow-tower-base.png");
    k.loadSprite("crow tower", "/sprites/crow-tower.png", {
        sliceX: 2,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 1, loop: false }
        }
    });
    k.loadSprite("bomb tower base", "/sprites/bomb-tower-base.png");
    k.loadSprite("bomb tower", "/sprites/bomb-tower.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 5, loop: false, speed: 20 }
        }
    });
    k.loadSprite("farm tower base", "/sprites/farm-tower-base.png");
    k.loadSprite("farm tower", "/sprites/farm-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            planted: 1,
            grow1: 2,
            grow2: 3
        }
    });
    k.loadSprite("plant tower base", "/sprites/plant-tower-base.png");
    k.loadSprite("chili tower", "/sprites/chili-pepper.png", {
        sliceX: 8,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 7, loop: false }
        }
    });
    k.loadSprite("nightshade tower base", "/sprites/nightshade-base.png");
    k.loadSprite("nightshade tower", "/sprites/nightshade.png", {
        sliceX: 5,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 4, loop: false }
        }
    });
    k.loadSprite("starfruit tower", "/sprites/starfruit.png", {
        sliceX: 7,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 6, loop: false }
        }
    });
    k.loadSprite("time tower base", "/sprites/time-tower-base.png");
    k.loadSprite("time tower", "/sprites/time-tower.png", {
        sliceX: 64,
        sliceY: 1,
        anims: {
            idle: { from: 0, to: 63, loop: true, speed: TIME_TOWER_BASE_ANIM_SPEED }
        }
    });
    k.loadSprite("toilet tower base", "/sprites/toilet-tower-base.png");
    k.loadSprite("toilet tower", "/sprites/toilet-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 10 }
        }
    });
    k.loadSprite("questionMark tower", "/sprites/questionMark-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("questionMark tower base", "/sprites/questionMark-tower-base.png");
    k.loadSprite("hammer tower", "/sprites/hammer.png", {
        sliceX: 1,
        sliceY: 1,
        anims: {
            idle: 0
        }
    });
    k.loadSprite("hammer handle", "/sprites/hammer-handle.png");
    k.loadSprite("hammer head", "/sprites/hammer-head.png");
    k.loadSprite("hammer tower base", "/sprites/hammer-tower-base.png");
    k.loadSprite("icicle tower", "/sprites/icicle-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("icicle tower base", "/sprites/icicle-tower-base.png");
    k.loadSprite("snowball tower base", "/sprites/snowball-tower-base.png");
    k.loadSprite("snowball tower", "/sprites/snowball-tower.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 5, loop: false, speed: 20 }
        }
    });
    k.loadSprite("shadow ball tower base", "/sprites/shadow-ball-tower-base.png");
    k.loadSprite("shadow ball tower", "/sprites/shadow-ball-tower.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 5, loop: false, speed: 20 }
        }
    });
    k.loadSprite("sludge bomb tower base", "/sprites/sludge-bomb-tower-base.png");
    k.loadSprite("sludge bomb tower", "/sprites/sludge-bomb-tower.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 5, loop: false, speed: 20 }
        }
    });
    k.loadSprite("sniper tower base", "/sprites/sniper-tower-base.png");
    k.loadSprite("sniper tower", "/sprites/sniper-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("laser cannon tower base", "/sprites/laser-cannon-tower-base.png");
    k.loadSprite("laser cannon tower", "/sprites/laser-cannon-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("balloon tower base", "/sprites/balloon-tower-base.png");
    k.loadSprite("balloon tower", "/sprites/balloon-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("beehive tower base", "/sprites/beehive-tower-base.png");
    k.loadSprite("beehive tower", "/sprites/beehive-tower.png", {
        sliceX: 1,
        sliceY: 1,
        anims: {
            idle: 0
        }
    });
    k.loadSprite("storm tower base", "/sprites/storm-tower-base.png");
    k.loadSprite("storm tower", "/sprites/storm-tower.png", {
        sliceX: 2,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 1, loop: false }
        }
    });
    k.loadSprite("frost ballista tower base", "/sprites/frost-ballista-tower-base.png");
    k.loadSprite("frost ballista tower", "/sprites/frost-ballista-tower.png", {
        sliceX: 5,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 4, loop: false }
        }
    });
    k.loadSprite("skull tower base", "/sprites/skull-tower-base.png");
    k.loadSprite("skull tower", "/sprites/skull-tower.png", {
        sliceX: 2,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 1, loop: false }
        }
    });
    k.loadSprite("time cannon tower base", "/sprites/time-cannon-tower-base.png");
    k.loadSprite("time cannon tower", "/sprites/time-cannon-tower.png", {
        sliceX: 64,
        sliceY: 1,
        anims: {
            idle: { from: 0, to: 63, loop: true, speed: TIME_TOWER_BASE_ANIM_SPEED }
        }
    });
    k.loadSprite("scythe tower", "/sprites/scythe-tower.png", {
        sliceX: 1,
        sliceY: 1,
        anims: {
            idle: 0
        }
    });
    k.loadSprite("god tower base", "/sprites/god-tower-base.png");
    k.loadSprite("god tower", "/sprites/god-tower.png", {
        sliceX: 2,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 1, loop: false }
        }
    });
    k.loadSprite("scythe handle", "/sprites/scythe-handle.png");
    k.loadSprite("scythe head", "/sprites/scythe-head.png");
    k.loadSprite("scythe tower base", "/sprites/scythe-tower-base.png");
    k.loadSprite("mine tower base", "/sprites/mine-tower-base.png");
    k.loadSprite("mine tower", "/sprites/mine-tower.png", {
        sliceX: 3,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 2, loop: false }
        }
    });
    k.loadSprite("blizzard tower base", "/sprites/blizzard-tower-base.png");
    k.loadSprite("blizzard tower", "/sprites/blizzard-tower.png", {
        sliceX: 2,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 1, loop: false, speed: 3 }
        }
    });
    k.loadSprite("flamethrower tower base", "/sprites/flamethrower-tower-base.png");
    k.loadSprite("flamethrower tower", "/sprites/flamethrower-tower.png", {
        sliceX: 1,
        sliceY: 1,
        anims: {
            idle: 0
        }
    });
    k.loadSprite("charge tower base", "/sprites/charge-tower-base.png");
    k.loadSprite("charge tower", "/sprites/charge-tower.png", {
        sliceX: 1,
        sliceY: 1,
        anims: {
            idle: 0
        }
    });
    k.loadSprite("lava tower base", "/sprites/lava-tower-base.png");
    k.loadSprite("lava tower", "/sprites/lava-tower.png", {
        sliceX: 5,
        sliceY: 1,
        anims: {
            idle: 0,
            pouring: {
                from: 1,
                to: 4,
                loop: true,
                speed: 7
            }
        }
    });
    k.loadSprite("fog", "/sprites/fog5.png");
    k.loadSprite("basic projectile", "/sprites/basic-projectile.png");
    k.loadSprite("slimeball", "/sprites/slimeball.png");
    k.loadSprite("fireball", "/sprites/fireball.png");
    k.loadSprite("light orb", "/sprites/light-orb.png");
    k.loadSprite("crow", "/sprites/crow.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            fly: { from: 0, to: 3, loop: true, speed: 5 }
        }
    });
    k.loadSprite("arrow", "/sprites/arrow.png");
    k.loadSprite("knife", "/sprites/knife.png");
    k.loadSprite("money bag", "/sprites/money-bag.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            break: { from: 1, to: 3, loop: false, speed: 6 }
        }
    });
    k.loadSprite("witch poison", "/sprites/witch-poison.png");
    k.loadSprite("musical note", "/sprites/musical-note.png");
    k.loadSprite("poison knife", "/sprites/poison-knife.png");
    k.loadSprite("flaming arrow", "/sprites/flaming-arrow.png");
    k.loadSprite("bomb", "/sprites/bomb.png", {
        sliceX: 7,
        sliceY: 1,
        anims: {
            idle: 0,
            explode: { from: 1, to: 6, loop: false, speed: 20 }
        }
    });
    k.loadSprite("frost arrow", "/sprites/frost-arrow.png");
    k.loadSprite("shadow blob", "/sprites/shadow-blob.png");
    k.loadSprite("star", "/sprites/star-projectile.png");
    k.loadSprite("poop", "/sprites/poop.png");
    k.loadSprite("icicle projectile", "/sprites/icicle-projectile.png");
    k.loadSprite("snowball", "/sprites/snowball.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            explode: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("sludge bomb", "/sprites/sludge-bomb.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            explode: { from: 1, to: 3, loop: false, speed: 10 }
        }
    });
    k.loadSprite("shadow ball", "/sprites/shadow-ball.png");
    k.loadSprite("bees", "/sprites/bees.png");
    k.loadSprite("ghostly skull", "/sprites/ghostly-skull.png");
    k.loadSprite("angel", "/sprites/angel.png");
    k.loadSprite("mine", "/sprites/mine.png", {
        sliceX: 7,
        sliceY: 1,
        anims: {
            explode: { from: 1, to: 6, loop: false, speed: 10 }
        }
    });
    k.loadSprite("archer base", "/sprites/archer-base2.png");
    k.loadSprite("archer", "/sprites/archer2.png", {
        sliceX: 5,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 4, loop: false, speed: 20 }
        }
    });
    k.loadSprite("archer celebrating", "/sprites/archer-celebrating.png", {
        sliceX: 30,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 29, loop: false }
        }
    });
    k.loadSprite("wizard base", "/sprites/wizard-base.png");
    k.loadSprite("wizard", "/sprites/wizard.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 10 }
        }
    });
    k.loadSprite("wizard celebrating", "/sprites/wizard-celebrating.png", {
        sliceX: 19,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 18, loop: false, speed: 13 }
        }
    });
    k.loadSprite("knight", "/sprites/knight.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 5, loop: false, speed: 20 }
        }
    });
    k.loadSprite("knight celebrating", "/sprites/knight-celebrating.png", {
        sliceX: 14,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 13, loop: false, speed: 8 }
        }
    });
    k.loadSprite("knight base", "/sprites/knight-base.png");
    k.loadSprite("assassin", "/sprites/assassin.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("assassin base", "/sprites/assassin-base.png");
    k.loadSprite("assassin celebrating", "/sprites/assassin-celebrating.png", {
        sliceX: 15,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 14, loop: false, speed: 7 }
        }
    });
    k.loadSprite("merchant base", "/sprites/merchant-base.png");
    k.loadSprite("merchant", "/sprites/merchant.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("merchant celebrating", "/sprites/merchant-celebrating.png", {
        sliceX: 10,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 9, loop: false, speed: 7 }
        }
    });
    k.loadSprite("witch base", "/sprites/witch-base.png");
    k.loadSprite("witch", "/sprites/witch.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("witch celebrating", "/sprites/witch-celebrating.png", {
        sliceX: 25,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 24, loop: false }
        }
    });
    k.loadSprite("songstress base", "/sprites/songstress-base.png");
    k.loadSprite("songstress celebrating", "/sprites/songstress-celebrating.png", {
        sliceX: 17,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 16, loop: false, speed: 9 }
        }
    });
    k.loadSprite("necromancer base", "/sprites/necromancer-base.png");
    k.loadSprite("necromancer", "/sprites/necromancer.png", {
        sliceX: 5,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 4, loop: false, speed: 10 }
        }
    });
    k.loadSprite("necromancer celebrating", "/sprites/necromancer-celebrating.png", {
        sliceX: 14,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 13, loop: false, speed: 8 }
        }
    });
    k.loadSprite("slime", "/sprites/slime.png", {
        sliceX: 7,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 5, loop: true },
            die: { from: 7, to: 12, loop: false }
        }
    });
    k.loadSprite("skeleton", "/sprites/skeleton.png", {
        sliceX: 5,
        sliceY: 3,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 5, to: 9, loop: false },
            attack: { from: 10, to: 13, loop: false }
        }
    });
    k.loadSprite("armoured skeleton", "/sprites/armoured-skeleton.png", {
        sliceX: 5,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 5, to: 9, loop: false }
        }
    });
    k.loadSprite("fairy", "/sprites/fairy.png", {
        sliceX: 4,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 4, to: 7, loop: false, speed: 7 }
        }
    });
    k.loadSprite("orc", "/sprites/orc.png", {
        sliceX: 5,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 5, to: 9, loop: false, speed: 7 }
        }
    });
    k.loadSprite("armoured orc", "/sprites/armoured-orc.png", {
        sliceX: 5,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 5, to: 9, loop: false, speed: 7 }
        }
    });
    k.loadSprite("giant slime", "/sprites/giant-slime.png", {
        sliceX: 7,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 5, loop: true },
            die: { from: 7, to: 10, loop: false }
        }
    });

    k.loadSprite("giant skeleton", "/sprites/giant-skeleton.png", {
        sliceX: 7,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 8, to: 13, loop: false }
        }
    });

    k.loadSprite("giant orc", "/sprites/giant-orc.png", {
        sliceX: 7,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 8, to: 11, loop: false }
        }
    });

    k.loadSprite("bee", "/sprites/bee.png", {
        sliceX: 6,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 10 },
            die: { from: 6, to: 11, loop: false }
        }
    });

    k.loadSprite("giant bee", "/sprites/giant-bee.png", {
        sliceX: 5,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 10 },
            die: { from: 5, to: 9, loop: false }
        }
    });

    k.loadSprite("ghost", "/sprites/ghost.png", {
        sliceX: 8,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 7, loop: true, speed: 10 },
            die: { from: 8, to: 14, loop: false }
        }
    });

    k.loadSprite("red fairy", "/sprites/red-fairy.png", {
        sliceX: 4,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 4, to: 7, loop: false, speed: 7 }
        }
    });

    k.loadSprite("spider", "/sprites/spider.png", {
        sliceX: 5,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 5, to: 9, loop: false, speed: 7 }
        }
    });

    k.loadSprite("spiderling", "/sprites/spiderling.png", {
        sliceX: 4,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 15 },
            die: { from: 4, to: 7, loop: false, speed: 7 }
        }
    });

    k.loadSprite("wolf", "/sprites/wolf.png", {
        sliceX: 4,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 7 },
            die: { from: 4, to: 7, loop: false, speed: 7 }
        }
    });

    k.loadSprite("poison", "/sprites/poison-icon.png");
    k.loadSprite("burn", "/sprites/burn-icon.png");
    k.loadSprite("chill", "/sprites/chill-icon.png");
    k.loadSprite("charge", "/sprites/charge-icon.png");
    k.loadSprite("curse", "/sprites/curse-icon.png");
    k.loadSprite("blind", "/sprites/blind-icon.png");
    k.loadSprite("frost particle", "/sprites/frost-particle.png");
    k.loadSprite("flame particle", "/sprites/flame-particle.png");
    k.loadSprite("ice blast", "/sprites/ice-blast.png");
    k.loadSprite("electric particle", "/sprites/electric-particle.png");
    k.loadSprite("smash effect", "/sprites/hammer-smash-effect.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            smash: { from: 0, to: 3, loop: false }
        }
    });
    k.loadSprite("slash effect", "/sprites/slash-effect.png");
    k.loadSprite("sniper laser", "/sprites/sniper-laser.png");
    k.loadSprite("thunder effect", "/sprites/thunder-effect3.png", {
        sliceX: 13,
        sliceY: 1,
        anims: {
            thunder: { from: 0, to: 12, loop: false, speed: 25 }
        }
    });
    k.loadSprite("heal effect", "/sprites/heal-effect.png", {
        sliceX: 7,
        sliceY: 1,
        anims: {
            heal: { from: 0, to: 6, loop: false, speed: 20 }
        }
    });
    k.loadSprite("entrance arrow", "/sprites/green-arrow.png");
    k.loadSprite("exit arrow", "/sprites/red-arrow.png");
    k.loadSprite("snow", "/sprites/snow.png");
    k.loadSprite("lava tile", "/sprites/lava-tile.png");
    k.loadSprite("stinger", "/sprites/bee-stinger.png");
    k.loadShader(
        "glow",
        null,
        `
    
            uniform float u_flash;
            uniform float u_opacity;
            uniform float u_r;
            uniform float u_g;
            uniform float u_b;
    
            vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
                vec4 texColor = texture2D(tex, uv);
                // blend texture with white based on flash, then apply opacity
                vec4 blended = mix(texColor, vec4(u_r, u_g, u_b, texColor.a), u_flash);
                blended.a *= u_opacity;
                return blended;
            }
        
    `
    );
    k.loadSprite("buff damage", "/sprites/damage-icon.png");
    k.loadSprite("buff fire rate", "/sprites/firerate-icon.png");
    k.loadSprite("buff crit", "/sprites/critchance-icon.png");
    k.loadSprite("buff crit damage", "/sprites/critdamage-icon.png");
}