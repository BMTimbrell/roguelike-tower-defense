import type { KAPLAYCtx, Vec2 } from "kaplay";
import { createSeededRandom } from "./seededRandom";
import type { MapChunk, PathTile, Tile } from "../types";
import { TILE_SIZE } from "../constants";

export async function generateForestMap(
    k: KAPLAYCtx,
    seed: number
) {
    const rng = createSeededRandom(seed);

    const width = 40;
    const height = 25;

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
    const chunks = createChunks(width, height);

    const minEntranceY = Math.floor(height * 0.3);
    const maxEntranceY = Math.floor(height * 0.7);

    let entranceY =
        minEntranceY +
        Math.floor(
            rng() *
            (maxEntranceY - minEntranceY + 1)
        );

    for (const chunk of chunks) {
        const result = generateValidChunkPath(
            tileGrid,
            chunk,
            entranceY,
            rng
        );

        chunk.pathTiles = result.pathTiles;
        entranceY = result.exitY;
    }

    // 3. Generate trees
    generateTrees(tileGrid, rng);

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


    for (const chunk of chunks) {
        blockHiddenChunkTiles(
            tileGrid,
            chunk
        );
    }

    await generateMapSprite(k, tileGrid, pathTiles);

    const waypoints = generateWaypoints(k, chunks);

    return {
        tileGrid,
        pathTiles,
        seed,
        waypoints,
        chunks
    };
}

function generateTrees(
    tileGrid: Tile[][],
    rng: () => number
) {
    for (let y = 0; y < tileGrid.length; y++) {
        for (let x = 0; x < tileGrid[y].length; x++) {
            const tile = tileGrid[y][x];

            if (tile.isPath) {
                continue;
            }

            if (rng() < 0.2) {
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
    rng: () => number
) {
    const pathTiles: PathTile[] = [];

    const startX = chunk.startX;
    const endX = chunk.startX + chunk.width - 1;

    const minY = chunk.startY + 2;
    const maxY = chunk.startY + chunk.height - 3;

    let x = startX;
    let y = entranceY;

    let segments = 0;
    const MAX_SEGMENTS = 30;

    function addPathTile(x: number, y: number) {
        const tile = tileGrid[y][x];

        tile.isPath = true;
        tile.blocked = true;

        pathTiles.push({
            x,
            y,
            tile,
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
                neighbour.y < chunk.startY ||
                neighbour.y >= chunk.startY + chunk.height
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

            if (tileGrid[neighbour.y][neighbour.x].isPath) {
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
            if (tileGrid[y][nextX].isPath) {
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
            if (tileGrid[nextY][x].isPath) {
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

async function generateMapSprite(k: KAPLAYCtx, tileGrid: Tile[][], pathTiles: PathTile[]) {
    const mapWidth = tileGrid[0].length;
    const mapHeight = tileGrid.length;
    const canvas = k.makeCanvas(k.width(), k.height());

    assignPathFrames(pathTiles);

    canvas.draw(() => {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const tile = tileGrid[y][x];

                if (!tile.isPath) k.drawSprite({
                    sprite: "grass",
                    pos: k.vec2(x * TILE_SIZE, y * TILE_SIZE)
                });

                if (tile.isPath && tile.pathFrame !== undefined) {
                    k.drawSprite({
                        sprite: "pathTiles",
                        frame: tile.pathFrame,
                        pos: k.vec2(x * TILE_SIZE, y * TILE_SIZE)
                    });
                }
            }
        }

    });

    const dataURL = canvas.toDataURL();

    await k.loadSprite("endlessMap", dataURL);

    canvas.free();

    k.add([
        k.sprite("endlessMap"),
        k.pos(k.vec2(0, 0)),
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

function assignPathFrames(pathTiles: PathTile[]) {
    for (let i = 0; i < pathTiles.length; i++) {
        const current = pathTiles[i];
        const previous = pathTiles[i - 1];
        const next = pathTiles[i + 1];

        // Start / end
        if (!previous || !next) {
            current.tile.pathFrame = PATH_FRAMES.HORIZONTAL;
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
    chunks: MapChunk[]
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
        k.vec2(
            first.x * TILE_SIZE +
                TILE_SIZE +
                TILE_SIZE / 2,
            first.y * TILE_SIZE +
                TILE_SIZE / 2
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
        k.vec2(
            -TILE_SIZE / 2,
            last.y * TILE_SIZE +
                TILE_SIZE / 2
        )
    );

    return waypoints;
}

const CHUNK_WIDTH = 10;
const CHUNK_HEIGHT = 25;

function createChunks(
    mapWidth: number,
    mapHeight: number
): MapChunk[] {
    const chunks: MapChunk[] = [];

    let index = 0;

    for (let x = 0; x < mapWidth; x += CHUNK_WIDTH) {
        chunks.push({
            index,

            startX: x,
            startY: 0,

            width: Math.min(CHUNK_WIDTH, mapWidth - x),
            height: mapHeight,

            revealed: index === 0,

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
    rng: () => number
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
            rng
        );

        const validLength =
            Math.abs(
                result.pathTiles.length -
                targetLength
            ) <= PATH_LENGTH_TOLERANCE;

        console.log(
            `Chunk ${chunk.index}, attempt ${attempt + 1}:`,
            `target=${targetLength}`,
            `length=${result.pathTiles.length}`,
            `reachedExit=${result.reachedExit}`,
            `validLength=${validLength}`
        );

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