import type { KAPLAYCtx, Vec2 } from "kaplay";
import { createSeededRandom, getMapOrientation, type MapOrientation } from "./seededRandom";
import type { MapChunk, ObeliskId, PathTile, Tile, TotemId, TowerGameObj } from "../types";
import { ENDLESS_MUSIC, TILE_SIZE, TOTEMS } from "../constants";
import { endlessMapStateAtom, gameStateAtom, store } from "../store";
import { clearMusic, playMusic, sleep } from "./soundHelpers";
import makeObelisk from "../entities/Obelisk";
import makeTotem from "../entities/Totem";

export async function generateForestMap(
    k: KAPLAYCtx,
    seed: number
) {
    const rng = createSeededRandom(seed);
    const orientation = getMapOrientation(seed);

    const width = orientation === "horizontal" ? 50 : 25;
    const height = orientation === "horizontal" ? 25 : 50;

    const tileGrid: Tile[][] = [];

    // 1. Create empty grid
    for (let y = 0; y < height; y++) {
        tileGrid[y] = [];

        for (let x = 0; x < width; x++) {
            tileGrid[y][x] = {
                blocked: false,
                isPath: false,
            };
        }
    }

    // generate chunks
    const chunks = createChunks(width, height, orientation);

    const sidewaysLength =
        orientation === "horizontal" ? height : width;

    const minEntrance = Math.floor(sidewaysLength * 0.3);
    const maxEntrance = Math.floor(sidewaysLength * 0.7);


    let entrance = minEntrance +
        Math.floor(rng() * (maxEntrance - minEntrance + 1));

    for (const chunk of chunks) {
        const result = generateValidChunkPath(
            tileGrid,
            chunk,
            entrance,
            rng,
            orientation
        );

        chunk.pathTiles = result.pathTiles;
        entrance = result.exitY;
    }

    // 3. Generate trees
    if (k.getSceneName() === "endlessForest") generateTrees(tileGrid, rng);

    // 4. Create pathTiles
    const pathTiles = chunks
        .flatMap(chunk => chunk.pathTiles)
        .filter((pathTile, index, array) => {
            if (index === 0) return true;

            const previous = array[index - 1];

            return (
                pathTile.x !== previous.x ||
                pathTile.y !== previous.y
            );
        });

    pathTiles.forEach((pathTile, index) => {
        pathTile.tile.pathIndex = index;
    });

    let obelisks: GeneratedHellEntity[] | undefined;
    let totems: GeneratedHellEntity[] | undefined;

    if (k.getSceneName() === "endlessHell") {
        const hellEntities = generateHellEntities(tileGrid, chunks, pathTiles, rng);
        obelisks = hellEntities.obelisks;
        totems = hellEntities.totems;
    }

    for (const chunk of chunks) {
        blockHiddenChunkTiles(
            tileGrid,
            chunk
        );
    }

    await generateMapSprite(k, tileGrid, pathTiles, orientation);

    const waypoints = generateWaypoints(k, chunks, orientation);

    return {
        tileGrid,
        pathTiles,
        seed,
        waypoints,
        chunks,
        orientation,
        obelisks,
        totems
    };
}

function generateTrees(
    tileGrid: Tile[][],
    rng: () => number
) {
    const destroyedTrees = store.get(endlessMapStateAtom).destroyedTrees;

    for (let y = 0; y < tileGrid.length; y++) {
        for (let x = 0; x < tileGrid[y].length; x++) {
            const tile = tileGrid[y][x];

            if (tile.isPath) {
                continue;
            }
            const shouldHaveTree = rng() < 0.2;

            const wasDestroyed = destroyedTrees.some(
                tree => tree.x === x && tree.y === y
            );

            if (shouldHaveTree && !wasDestroyed) {
                tile.hasTree = true;
                tile.blocked = true;
            }
        }
    }
}

function generateChunkPath(
    tileGrid: Tile[][],
    chunk: MapChunk,
    entranceY: number,
    targetLength: number,
    rng: () => number,
    orientation: MapOrientation
) {
    const pathTiles: PathTile[] = [];

    const vertical = orientation === "vertical";

    const startX = vertical ? chunk.startY : chunk.startX;

    const endX = startX +
        (vertical ? chunk.height : chunk.width) - 1;

    const minY = (vertical ? chunk.startX : chunk.startY) + 2;

    const maxY = minY +
        (vertical ? chunk.width : chunk.height) - 5;

    let x = startX;
    let y = entranceY;

    let segments = 0;
    const MAX_SEGMENTS = 30;

    function toWorld(x: number, y: number) {
        return vertical
            ? { x: y, y: x }
            : { x, y };
    }

    function getTile(x: number, y: number) {
        const world = toWorld(x, y);
        return tileGrid[world.y][world.x];
    }

    function addPathTile(x: number, y: number) {
        const world = toWorld(x, y);
        const tile = getTile(x, y);

        tile.isPath = true;
        tile.blocked = true;

        pathTiles.push({
            x: world.x,
            y: world.y,
            tile
        });
    }

    function hasUnrelatedPathNeighbour(
        x: number,
        y: number,
        allowedX: number,
        allowedY: number
    ) {
        const neighbours = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 },
        ];

        for (const neighbour of neighbours) {
            // Outside this chunk doesn't matter here.
            if (
                neighbour.x < startX ||
                neighbour.x > endX ||
                neighbour.y < minY - 2 ||
                neighbour.y > maxY + 2
            ) {
                continue;
            }

            // This is the tile we're deliberately connecting from.
            if (
                neighbour.x === allowedX &&
                neighbour.y === allowedY
            ) {
                continue;
            }

            if (getTile(neighbour.x, neighbour.y).isPath) {
                return true;
            }
        }

        return false;
    }

    function canMoveHorizontal(
        direction: -1 | 1,
        length: number
    ) {
        let previousX = x;

        for (let i = 1; i <= length; i++) {
            const nextX = x + direction * i;

            // Don't leave the chunk.
            if (
                nextX < startX ||
                nextX > endX
            ) {
                return false;
            }

            // Don't cross an existing path.
            if (getTile(nextX, y).isPath) {
                return false;
            }

            // Don't run alongside / reconnect with an unrelated path.
            if (
                hasUnrelatedPathNeighbour(
                    nextX,
                    y,
                    previousX,
                    y
                )
            ) {
                return false;
            }

            previousX = nextX;
        }

        return true;
    }

    function canMoveVertical(
        direction: -1 | 1,
        length: number
    ) {
        let previousY = y;

        for (let i = 1; i <= length; i++) {
            const nextY = y + direction * i;

            // Keep a little space from the top/bottom of the chunk.
            if (
                nextY < minY ||
                nextY > maxY
            ) {
                return false;
            }

            // Don't cross an existing path.
            if (getTile(x, nextY).isPath) {
                return false;
            }

            // Don't run alongside / reconnect with an unrelated path.
            if (
                hasUnrelatedPathNeighbour(
                    x,
                    nextY,
                    x,
                    previousY
                )
            ) {
                return false;
            }

            previousY = nextY;
        }

        return true;
    }

    // -----------------------------
    // Start
    // -----------------------------

    addPathTile(x, y);

    // -----------------------------
    // Generate sections
    // -----------------------------

    while (
        x < endX &&
        segments < MAX_SEGMENTS
    ) {
        segments++;

        const distanceToExit = endX - x;

        const minimumAcceptedLength =
            targetLength - PATH_LENGTH_TOLERANCE;

        const minimumFinalLength =
            pathTiles.length + distanceToExit;

        const lengthNeeded =
            minimumAcceptedLength - minimumFinalLength;

        const needsDetour =
            minimumFinalLength < minimumAcceptedLength;

        // We already have enough distance.
        // Finish directly if possible.
        if (!needsDetour) {
            if (
                distanceToExit > 0 &&
                canMoveHorizontal(1, distanceToExit)
            ) {
                for (
                    let i = 0;
                    i < distanceToExit;
                    i++
                ) {
                    x++;
                    addPathTile(x, y);
                }

                break;
            }
        }

        // =================================
        // Horizontal section
        // =================================

        let horizontalDirection: -1 | 1 = 1;

        if (
            needsDetour &&
            x >= startX + 5
        ) {
            const leftChance =
                lengthNeeded >= 6
                    ? 0.6
                    : 0.35;

            if (rng() < leftChance) {
                horizontalDirection = -1;
            }
        }

        let horizontalLength =
            horizontalDirection === 1
                ? 3 + Math.floor(rng() * 4)
                : 2 + Math.floor(rng() * 3);

        if (horizontalDirection === 1) {
            let maxRightMovement =
                endX - x;

            // Don't reach the exit while the
            // resulting path would still be too short.
            if (needsDetour) {
                maxRightMovement =
                    Math.max(
                        0,
                        maxRightMovement - 1
                    );
            }

            horizontalLength = Math.min(
                horizontalLength,
                maxRightMovement
            );
        }

        let canMove =
            horizontalLength > 0 &&
            canMoveHorizontal(
                horizontalDirection,
                horizontalLength
            );

        // If backwards didn't work, try right instead.
        if (
            !canMove &&
            horizontalDirection === -1
        ) {
            horizontalDirection = 1;

            let maxRightMovement =
                endX - x;

            // Still don't allow the fallback movement
            // to reach the exit if the path is too short.
            if (needsDetour) {
                maxRightMovement = Math.max(
                    0,
                    maxRightMovement - 1
                );
            }

            horizontalLength = Math.min(
                3 + Math.floor(rng() * 4),
                maxRightMovement
            );

            canMove =
                horizontalLength > 0 &&
                canMoveHorizontal(
                    horizontalDirection,
                    horizontalLength
                );
        }

        if (canMove) {
            for (
                let i = 0;
                i < horizontalLength;
                i++
            ) {
                x += horizontalDirection;
                addPathTile(x, y);
            }
        }

        if (x === endX) {
            break;
        }

        const newDistanceToExit = endX - x;

        const newMinimumFinalLength =
            pathTiles.length + newDistanceToExit;

        const stillNeedsDetour =
            newMinimumFinalLength <
            targetLength - PATH_LENGTH_TOLERANCE;

        if (!stillNeedsDetour) {
            if (
                newDistanceToExit > 0 &&
                canMoveHorizontal(1, newDistanceToExit)
            ) {
                for (
                    let i = 0;
                    i < newDistanceToExit;
                    i++
                ) {
                    x++;
                    addPathTile(x, y);
                }

                break;
            }
        }

        // =================================
        // Vertical section
        // =================================

        const verticalLength =
            2 + Math.floor(rng() * 4); // 2-5

        let verticalDirection: -1 | 1 =
            rng() < 0.5 ? -1 : 1;

        // Try chosen direction.
        let canMoveVertically =
            canMoveVertical(
                verticalDirection,
                verticalLength
            );

        // Try opposite direction.
        if (!canMoveVertically) {
            verticalDirection =
                verticalDirection === 1 ? -1 : 1;

            canMoveVertically =
                canMoveVertical(
                    verticalDirection,
                    verticalLength
                );
        }

        if (canMoveVertically) {
            for (
                let i = 0;
                i < verticalLength;
                i++
            ) {
                y += verticalDirection;
                addPathTile(x, y);
            }
        }

        // If neither horizontal nor vertical movement was possible,
        // we don't want to get stuck looping forever.
        if (!canMove && !canMoveVertically) {
            break;
        }
    }

    // -----------------------------
    // Result
    // -----------------------------

    return {
        pathTiles,
        exitY: y,
        reachedExit: x === endX,
    };
}

async function generateMapSprite(
    k: KAPLAYCtx,
    tileGrid: Tile[][],
    pathTiles: PathTile[],
    orientation: MapOrientation
) {
    const mapWidth = tileGrid[0].length * TILE_SIZE;
    const mapHeight = tileGrid.length * TILE_SIZE;

    assignPathFrames(pathTiles, orientation);

    // Native browser canvas — completely independent of KAPLAY viewport.
    const canvas = document.createElement("canvas");
    canvas.width = mapWidth;
    canvas.height = mapHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Failed to create map canvas context");
    }

    ctx.imageSmoothingEnabled = false;

    // Load the same image used by the KAPLAY atlas.
    const tileset = new Image();

    await new Promise<void>((resolve, reject) => {
        tileset.onload = () => resolve();
        tileset.onerror = () => reject(
            new Error("Failed to load endless tileset")
        );

        tileset.src = `sprites/${k.getSceneName() === "endlessHell" ? "hell-tileset-endless.png" : "grass-tileset-endless.png"}`;
    });

    for (let y = 0; y < tileGrid.length; y++) {
        for (let x = 0; x < tileGrid[y].length; x++) {
            const tile = tileGrid[y][x];

            const destX = x * TILE_SIZE;
            const destY = y * TILE_SIZE;

            if (!tile.isPath) {
                // "grass" = top-left 32×32 of the atlas
                ctx.drawImage(
                    tileset,
                    0,
                    0,
                    32,
                    32,
                    destX,
                    destY,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }

            if (
                tile.isPath &&
                tile.pathFrame !== undefined
            ) {
                const frame = tile.pathFrame;

                // pathTiles is a 3×3 spritesheet.
                const sourceX = (frame % 3) * 32;
                const sourceY = Math.floor(frame / 3) * 32;

                ctx.drawImage(
                    tileset,

                    // Source frame
                    sourceX,
                    sourceY,
                    32,
                    32,

                    // Destination tile
                    destX,
                    destY,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }
    }

    const dataURL = canvas.toDataURL();

    await k.loadSprite("endlessMap", dataURL);

    k.add([
        k.sprite("endlessMap"),
        k.pos(0, 0),
        k.z(-100),
        "endlessMap"
    ]);
}

function getDirection(
    from: PathTile,
    to: PathTile
) {
    if (to.x > from.x) return "right";
    if (to.x < from.x) return "left";
    if (to.y > from.y) return "down";
    return "up";
}

const PATH_FRAMES = {
    HORIZONTAL: 7,
    VERTICAL: 5,

    RIGHT_TO_DOWN: 2,
    DOWN_TO_RIGHT: 6,

    RIGHT_TO_UP: 8,
    UP_TO_RIGHT: 1,
};

function assignPathFrames(pathTiles: PathTile[], orientation: MapOrientation) {
    for (let i = 0; i < pathTiles.length; i++) {
        const current = pathTiles[i];
        const previous = pathTiles[i - 1];
        const next = pathTiles[i + 1];

        // Start / end
        if (!previous || !next) {
            current.tile.pathFrame =
                orientation === "horizontal"
                    ? PATH_FRAMES.HORIZONTAL
                    : PATH_FRAMES.VERTICAL;
            continue;
        }

        const incoming = getDirection(previous, current);
        const outgoing = getDirection(current, next);

        // -------------------------
        // Straight
        // -------------------------

        if (
            (incoming === "right" && outgoing === "right") ||
            (incoming === "left" && outgoing === "left")
        ) {
            current.tile.pathFrame = PATH_FRAMES.HORIZONTAL;
        }

        else if (
            (incoming === "up" && outgoing === "up") ||
            (incoming === "down" && outgoing === "down")
        ) {
            current.tile.pathFrame = PATH_FRAMES.VERTICAL;
        }

        // -------------------------
        // Corners
        // -------------------------

        // ┐
        else if (
            (incoming === "right" && outgoing === "down") ||
            (incoming === "up" && outgoing === "left")
        ) {
            current.tile.pathFrame = PATH_FRAMES.RIGHT_TO_DOWN;
        }

        // └
        else if (
            (incoming === "down" && outgoing === "right") ||
            (incoming === "left" && outgoing === "up")
        ) {
            current.tile.pathFrame = PATH_FRAMES.DOWN_TO_RIGHT;
        }

        // ┘
        else if (
            (incoming === "right" && outgoing === "up") ||
            (incoming === "down" && outgoing === "left")
        ) {
            current.tile.pathFrame = PATH_FRAMES.RIGHT_TO_UP;
        }

        // ┌
        else if (
            (incoming === "up" && outgoing === "right") ||
            (incoming === "left" && outgoing === "down")
        ) {
            current.tile.pathFrame = PATH_FRAMES.UP_TO_RIGHT;
        }
    }
}

export function generateWaypoints(
    k: KAPLAYCtx,
    chunks: MapChunk[],
    orientation: MapOrientation
) {
    const revealedChunks = chunks.filter(
        chunk => chunk.revealed
    );

    if (revealedChunks.length === 0) {
        return [];
    }

    // Path is generated left -> right, but enemies
    // travel right -> left.
    const pathTiles = revealedChunks
        .flatMap(chunk => chunk.pathTiles)
        .reverse();

    if (pathTiles.length === 0) {
        return [];
    }

    const waypoints: Vec2[] = [];

    const toWorldPos = (pathTile: PathTile) =>
        k.vec2(
            pathTile.x * TILE_SIZE + TILE_SIZE / 2,
            pathTile.y * TILE_SIZE + TILE_SIZE / 2
        );

    const first = pathTiles[0];

    // Spawn just outside the right edge of the
    // currently revealed path.
    waypoints.push(
        orientation === "horizontal"
            ? k.vec2(
                first.x * TILE_SIZE + TILE_SIZE * 1.5,
                first.y * TILE_SIZE + TILE_SIZE / 2
            )
            : k.vec2(
                first.x * TILE_SIZE + TILE_SIZE / 2,
                first.y * TILE_SIZE + TILE_SIZE * 1.5
            )
    );

    // Add corners.
    for (
        let i = 1;
        i < pathTiles.length - 1;
        i++
    ) {
        const previous = pathTiles[i - 1];
        const current = pathTiles[i];
        const next = pathTiles[i + 1];

        const incomingX =
            current.x - previous.x;

        const incomingY =
            current.y - previous.y;

        const outgoingX =
            next.x - current.x;

        const outgoingY =
            next.y - current.y;

        if (
            incomingX !== outgoingX ||
            incomingY !== outgoingY
        ) {
            waypoints.push(
                toWorldPos(current)
            );
        }
    }

    // Exit always remains to the left of chunk 0.
    const last = pathTiles[pathTiles.length - 1];

    waypoints.push(
        orientation === "horizontal"
            ? k.vec2(
                -TILE_SIZE / 2,
                last.y * TILE_SIZE +
                TILE_SIZE / 2
            )
            : k.vec2(
                last.x * TILE_SIZE +
                TILE_SIZE / 2,
                -TILE_SIZE / 2
            )
    );

    return waypoints;
}

function getRevealedChunkCount(waveNumber: number) {
    return 1 + Math.ceil(waveNumber / 5);
}

function createChunks(
    mapWidth: number,
    mapHeight: number,
    orientation: MapOrientation
): MapChunk[] {
    const chunks: MapChunk[] = [];

    const revealedChunkCount =
        getRevealedChunkCount(store.get(gameStateAtom).waveNumber);

    const horizontal = orientation === "horizontal";
    const chunkSize = 10;
    const totalLength = horizontal ? mapWidth : mapHeight;

    let index = 0;

    for (let start = 0; start < totalLength; start += chunkSize) {
        chunks.push({
            index,
            startX: horizontal ? start : 0,
            startY: horizontal ? 0 : start,
            width: horizontal
                ? Math.min(chunkSize, mapWidth - start)
                : mapWidth,
            height: horizontal
                ? mapHeight
                : Math.min(chunkSize, mapHeight - start),
            revealed: index < revealedChunkCount,
            pathTiles: []
        });

        index++;
    }

    return chunks;
}

function clearPath(pathTiles: PathTile[]) {
    for (const pathTile of pathTiles) {
        pathTile.tile.isPath = false;
        pathTile.tile.blocked = false;
        pathTile.tile.pathIndex = undefined;
        pathTile.tile.pathFrame = undefined;
    }
}

const MIN_TARGET_PATH_LENGTH = 18;
const MAX_TARGET_PATH_LENGTH = 22;

const PATH_LENGTH_TOLERANCE = 2;

const MAX_CHUNK_GENERATION_ATTEMPTS = 50;

function generateValidChunkPath(
    tileGrid: Tile[][],
    chunk: MapChunk,
    entranceY: number,
    rng: () => number,
    orientation: MapOrientation
) {
    const targetLength =
        MIN_TARGET_PATH_LENGTH +
        Math.floor(
            rng() *
            (
                MAX_TARGET_PATH_LENGTH -
                MIN_TARGET_PATH_LENGTH +
                1
            )
        );

    for (
        let attempt = 0;
        attempt < MAX_CHUNK_GENERATION_ATTEMPTS;
        attempt++
    ) {
        const result = generateChunkPath(
            tileGrid,
            chunk,
            entranceY,
            targetLength,
            rng,
            orientation
        );

        const validLength =
            Math.abs(
                result.pathTiles.length -
                targetLength
            ) <= PATH_LENGTH_TOLERANCE;

        // console.log(
        //     `Chunk ${chunk.index}, attempt ${attempt + 1}:`,
        //     `target=${targetLength}`,
        //     `length=${result.pathTiles.length}`,
        //     `reachedExit=${result.reachedExit}`,
        //     `validLength=${validLength}`
        // );

        if (
            result.reachedExit &&
            validLength
        ) {
            return result;
        }

        clearPath(result.pathTiles);
    }

    throw new Error(
        `Failed to generate valid path for chunk ${chunk.index}`
    );
}

function blockHiddenChunkTiles(
    tileGrid: Tile[][],
    chunk: MapChunk
) {
    if (chunk.revealed) return;

    for (
        let y = chunk.startY;
        y < chunk.startY + chunk.height;
        y++
    ) {
        for (
            let x = chunk.startX;
            x < chunk.startX + chunk.width;
            x++
        ) {
            tileGrid[y][x].blocked = true;
            tileGrid[y][x].notRevealed = true;
        }
    }
}

export function unblockRevealedChunkTiles(
    tileGrid: Tile[][],
    chunk: MapChunk
) {
    for (
        let y = chunk.startY;
        y < chunk.startY + chunk.height;
        y++
    ) {
        for (
            let x = chunk.startX;
            x < chunk.startX + chunk.width;
            x++
        ) {
            const tile = tileGrid[y][x];

            tile.blocked =
                tile.isPath ||
                tile.hasTree === true;

            tile.notRevealed = false;
        }
    }
}

export function startEndlessMusic(k: KAPLAYCtx) {
    let previousIndex = k.getSceneName() === "endlessHell" ? 6 : 0;

    async function playTrack(index: number) {
        previousIndex = index;

        const result = await playMusic(
            k,
            ENDLESS_MUSIC[index],
            0.7,
            false
        );

        if (!result) return;

        const music = result.music;

        music.onEnd(async () => {
            clearMusic(music);

            await sleep(k.rand(8, 15) * 1000);

            let nextIndex: number;

            do {
                nextIndex = k.randi(ENDLESS_MUSIC.length);
            } while (
                ENDLESS_MUSIC.length > 1 &&
                nextIndex === previousIndex
            );

            playTrack(nextIndex);
        });
    }

    void playTrack(k.getSceneName() === "endlessHell" ? 6 : 0);
}

function getDistanceToPath(
    x: number,
    y: number,
    pathTiles: { x: number; y: number }[]
): number {
    let closest = Infinity;

    for (const path of pathTiles) {
        const distance = Math.hypot(
            x - path.x,
            y - path.y
        );

        if (distance < closest) {
            closest = distance;
        }
    }

    return closest;
}

function findEntityPosition(
    tileGrid: Tile[][],
    chunk: MapChunk,
    pathTiles: { x: number; y: number }[],
    placedEntities: { x: number; y: number }[],
    rng: () => number,
    minPathDistance: number,
    maxPathDistance: number,
    minEntityDistance: number
) {
    const candidates: { x: number; y: number }[] = [];
    const margin = 1;

    for (let y = chunk.startY + margin; y < chunk.startY + chunk.height - margin; y++) {
        for (let x = chunk.startX + margin; x < chunk.startX + chunk.width - margin; x++) {
            const tile = tileGrid[y][x];

            if (tile.blocked || tile.hasTree) continue;

            // Distance to nearest path tile
            const pathDistance = getDistanceToPath(x, y, pathTiles);

            if (
                pathDistance < minPathDistance ||
                pathDistance > maxPathDistance
            ) {
                continue;
            }

            // Distance to other totems / obelisks
            const tooClose = placedEntities.some(pos =>
                Math.hypot(pos.x - x, pos.y - y) < minEntityDistance
            );

            if (tooClose) continue;

            candidates.push({ x, y });
        }
    }

    if (!candidates.length) return null;

    return candidates[Math.floor(rng() * candidates.length)];
}

export type GeneratedHellEntity = {
    id: string;
    x: number;
    y: number;
    chunkIndex: number;
    element: TotemId | ObeliskId;
};

function generateHellEntities(
    tileGrid: Tile[][],
    chunks: MapChunk[],
    pathTiles: { x: number; y: number }[],
    rng: () => number
) {
    const totems: GeneratedHellEntity[] = [];
    const obelisks: GeneratedHellEntity[] = [];

    const placedEntities: { x: number; y: number }[] = [];
    const elements = Object.keys(TOTEMS) as (TotemId | ObeliskId)[];

    for (const chunk of chunks) {

        for (let i = 0; i < 2; i++) {

            let pos = findEntityPosition(
                tileGrid,
                chunk,
                pathTiles,
                placedEntities,
                rng,
                2,
                3,
                2
            );

            if (pos) {
                totems.push({
                    id: `totem-${pos.x}-${pos.y}`,
                    x: pos.x,
                    y: pos.y,
                    chunkIndex: chunk.index,
                    element: elements[Math.floor(rng() * elements.length)]
                });

                placedEntities.push(pos);
            }

            pos = findEntityPosition(
                tileGrid,
                chunk,
                pathTiles,
                placedEntities,
                rng,
                1,
                4,
                2
            );

            if (pos) {
                obelisks.push({
                    id: `obelisk-${pos.x}-${pos.y}`,
                    x: pos.x,
                    y: pos.y,
                    chunkIndex: chunk.index,
                    element: elements[Math.floor(rng() * elements.length)]
                });
                placedEntities.push(pos);
            }
        }

        // extra obelisk for chunks after the first one
        if (chunk.index > 0) {
            const pos = findEntityPosition(
                tileGrid,
                chunk,
                pathTiles,
                placedEntities,
                rng,
                1,
                4,
                2
            );

            if (pos) {
                obelisks.push({
                    id: `obelisk-${pos.x}-${pos.y}`,
                    x: pos.x,
                    y: pos.y,
                    chunkIndex: chunk.index,
                    element: elements[Math.floor(rng() * elements.length)]
                });
                placedEntities.push(pos);
            }
        }

    }

    return { totems, obelisks };
}

export function spawnHellChunkEntities(
    k: KAPLAYCtx,
    chunkIndex: number,
    totems: GeneratedHellEntity[],
    obelisks: GeneratedHellEntity[],
    tileGrid: Tile[][]
) {
    const chunkTotems = totems.filter(t => t.chunkIndex === chunkIndex);
    const chunkObelisks = obelisks.filter(o => o.chunkIndex === chunkIndex);

    const state = store.get(endlessMapStateAtom);

    for (const obelisk of chunkObelisks) {
        const saved = state.obelisks.find(o => o.id === obelisk.id);

        if (saved?.isDestroyed) continue;

        const obj = makeObelisk(
            k,
            obelisk.element,
            k.vec2(obelisk.x * TILE_SIZE, obelisk.y * TILE_SIZE),
            tileGrid
        );

        tileGrid[obelisk.y][obelisk.x].blocked = true;

        // Important for saving HP later
        obj.instanceId = obelisk.id;

        if (saved) {
            // Existing obelisk: restore saved HP
            obj.setHP(saved.hp);
            obj.setMaxHP(saved.maxHP);
            console.log(obj.hp(), obj.maxHP());

            for (const { x, y } of saved.corruptedTiles ?? []) {
                const tile = tileGrid[y]?.[x];
                if (!tile) continue;

                tile.blocked = true;

                obj.corruptedTiles.push({
                    tile,
                    x,
                    y
                });

                k.add([
                    k.sprite("corrupted tile"),
                    k.pos(x * TILE_SIZE, y * TILE_SIZE),
                    "corrupted tile"
                ]);
            }
        } else {
            // Newly revealed obelisk: save its starting HP
            store.set(endlessMapStateAtom, prev => ({
                ...prev,
                obelisks: [
                    ...prev.obelisks,
                    {
                        id: obelisk.id,
                        isDestroyed: false,
                        hp: obj.hp(),
                        maxHP: obj.maxHP() ?? obj.hp(),
                        corruptedTiles: []
                    }
                ]
            }));
        }
    }

    for (const totem of chunkTotems) {
        const saved = state.totems.find(t => t.id === totem.id);

        const obj = makeTotem(
            k,
            totem.element,
            k.vec2(totem.x * TILE_SIZE, totem.y * TILE_SIZE)
        );

        tileGrid[totem.y][totem.x].blocked = true;

        if (saved) {
            obj.isCaptured = saved.isCaptured;
            obj.captureProgress = saved.captureProgress;
            obj.requiredDamage = saved.requiredDamage;

            console.log(obj.requiredDamage)

            if (saved.captureTowerId !== null) {
                obj.captureTower = (k.get("tower") as TowerGameObj[])
                    .find(t => t.instanceId === saved.captureTowerId) ?? null;
            }

            if (obj.isCaptured) obj.play("tower");
        } else {
            store.set(endlessMapStateAtom, prev => ({
                ...prev,
                totems: [
                    ...prev.totems,
                    {
                        id: totem.id,
                        isCaptured: false,
                        captureProgress: 0,
                        captureTowerId: null,
                        requiredDamage: obj.requiredDamage
                    }
                ]
            }));
        }

        obj.instanceId = totem.id;
    }
}