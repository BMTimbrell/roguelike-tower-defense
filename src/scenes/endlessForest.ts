import type { KAPLAYCtx } from "kaplay";
import { generateForestMap } from "../utils/generateProceduralMap";
import initCam from "../utils/initCam";
import { TILE_SIZE } from "../constants";
import onAction from "../utils/onAction";
import { controlsAtom, gameStateAtom, pauseMenuAtom, store } from "../store";
import generateFog from "../utils/generateFog";
import isButtonDown from "../utils/isButtonDown";
import makeWaveSpawner from "../entities/WaveSpawner";

export default function endlessForest(k: KAPLAYCtx) {
    k.scene("endlessForest", async () => {
        const seed = Math.floor(Math.random() * 2 ** 32);
        const { tileGrid, pathTiles, waypoints } = await generateForestMap(k, seed);

        // Compute screen bounds and save in store
        const mapWorldWidth = tileGrid[0].length * TILE_SIZE;
        const mapWorldHeight = tileGrid.length * TILE_SIZE;
        let zoom = initCam(k);

        let dragActive = false;

        // k.onKeyPress("l", () => {
        //     store.set(gameStateAtom, prev => ({
        //         ...prev,
        //         hideUI: !store.get(gameStateAtom).hideUI
        //     }));
        // });

        // ---- Mouse ----
        onAction(k, "scroll", {
            onPress: () => dragActive = true,
            onRelease: () => dragActive = false,
        });

        k.onUpdate(() => {
            const controls = store.get(controlsAtom);
            const speed = 400 * k.dt();
            const EDGE = 20;

            if (!dragActive) {
                // wasd
                if (isButtonDown(k, controls, "camLeft")) k.setCamPos(k.getCamPos().add(-speed, 0));
                if (isButtonDown(k, controls, "camRight")) k.setCamPos(k.getCamPos().add(speed, 0));
                if (isButtonDown(k, controls, "camUp")) k.setCamPos(k.getCamPos().add(0, -speed));
                if (isButtonDown(k, controls, "camDown")) k.setCamPos(k.getCamPos().add(0, speed));

                // --- Mouse Edge ---
                if (store.get(gameStateAtom).camMoveAtEdge) {
                    const m = k.mousePos();
                    const w = k.width();
                    const h = k.height();

                    if (m.x < EDGE) k.setCamPos(k.getCamPos().add(-speed, 0));
                    if (m.x > w - EDGE) k.setCamPos(k.getCamPos().add(speed, 0));
                    if (m.y < EDGE) k.setCamPos(k.getCamPos().add(0, -speed));
                    if (m.y > h - EDGE) k.setCamPos(k.getCamPos().add(0, speed));
                }
            }

            if (dragActive && isButtonDown(k, controls, "scroll")) {
                const d = k.mouseDeltaPos();
                k.setCamPos(k.getCamPos().sub(d));
            }
        });

        let viewW = k.width() / zoom;
        let viewH = k.height() / zoom;
        const scrollHeight = mapWorldHeight + 4 * TILE_SIZE;
        let minX = viewW / 2;
        let minY = viewH / 2 - 3 * TILE_SIZE;
        let maxX = mapWorldWidth - viewW / 2;
        let maxY = scrollHeight - viewH / 2;

        generateFog(k, mapWorldWidth, mapWorldHeight);

        k.onUpdate(() => {
            const p = k.getCamPos();
            const camX = viewW < mapWorldWidth ? k.clamp(p.x, minX, maxX) : mapWorldWidth / 2;
            const camY = viewH < scrollHeight ? k.clamp(p.y, minY, maxY) : scrollHeight / 2;
            k.setCamPos(k.vec2(camX, camY));

            if (store.get(pauseMenuAtom).visible) {
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUI: null
                }));
                k.get("*").forEach(obj => obj.paused = true);
            }
        });

        k.onResize(() => {
            zoom = initCam(k);
            viewW = k.width() / zoom;
            viewH = k.height() / zoom;
            minX = viewW / 2;
            minY = viewH / 2 - 3 * TILE_SIZE;
            maxX = mapWorldWidth - viewW / 2;
            maxY = scrollHeight - viewH / 2;
        });

        k.onScroll(delta => {
            zoom -= delta.y * 0.001;
            zoom = k.clamp(zoom, 1, 3);
            k.setCamScale(k.vec2(zoom));

            viewW = k.width() / zoom;
            viewH = k.height() / zoom;
            minX = viewW / 2;
            minY = viewH / 2 - 3 * TILE_SIZE;
            maxX = mapWorldWidth - viewW / 2;
            maxY = scrollHeight - viewH / 2;
        });

        const cursor = k.add([
            "cursor",
            k.pos(k.toWorld(k.mousePos())),
            k.area({
                shape: new k.Rect(k.vec2(0), 1, 1)
            })
        ]);

        cursor.onUpdate(() => {
            cursor.pos = k.toWorld(k.mousePos());
        });

        for (let y = 0; y < tileGrid.length; y++) {
            for (let x = 0; x < tileGrid[y].length; x++) {
                const tile = tileGrid[y][x];

                if (tile.hasTree) {
                    k.add([
                        k.sprite("tree"),
                        k.pos(x * TILE_SIZE, y * TILE_SIZE),
                        "tree",
                        {
                            tileX: x,
                            tileY: y,
                            tile
                        }
                    ]);
                }
            }
        }

        makeWaveSpawner(k, "level1-2", waypoints);
    });
}