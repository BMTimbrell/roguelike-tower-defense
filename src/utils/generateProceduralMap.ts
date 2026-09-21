import type { KAPLAYCtx, Vec2 } from "kaplay";
import { createSeededRandom } from "./seededRandom";
import type { PathTile, Tile } from "../types";
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

    // 2. Generate path
    generatePath(tileGrid, rng);

    // 3. Generate trees
    generateTrees(tileGrid, rng);

    // 4. Create pathTiles
    const pathTiles: PathTile[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = tileGrid[y][x];

            if (tile.isPath) {
                pathTiles.push({
                    x,
                    y,
                    tile
                });
            }
        }
    }

    pathTiles.sort(
        (a, b) =>
            (a.tile.pathIndex ?? 0) -
            (b.tile.pathIndex ?? 0)
    );

    await generateMapSprite(k, tileGrid, pathTiles);

    const waypoints = generateWaypoints(k, pathTiles, width * TILE_SIZE);

    return {
        tileGrid,
        pathTiles,
        seed,
        waypoints
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

function generatePath(
    tileGrid: Tile[][],
    rng: () => number
) {
    const height = tileGrid.length;
    const width = tileGrid[0].length;

    let x = 0;
    let y = Math.floor(height / 2);
    let pathIndex = 0;

    function addPathTile(x: number, y: number) {
        const tile = tileGrid[y][x];

        tile.isPath = true;
        tile.blocked = true;
        tile.pathIndex = pathIndex++;
    }

    // Starting tile
    addPathTile(x, y);

    while (x < width - 1) {
        // -------------------------
        // Horizontal section
        // -------------------------

        const horizontalLength =
            4 + Math.floor(rng() * 5); // 4-8

        for (
            let i = 0;
            i < horizontalLength && x < width - 1;
            i++
        ) {
            x++;
            addPathTile(x, y);
        }

        // We've reached the end
        if (x >= width - 1) {
            break;
        }

        // -------------------------
        // Vertical section
        // -------------------------

        const verticalLength =
            2 + Math.floor(rng() * 4); // 2-5

        // Randomly choose up/down
        let direction = rng() < 0.5 ? -1 : 1;

        // If that direction won't fit, try the other
        if (!canMoveVertical(
            tileGrid,
            x,
            y,
            direction,
            verticalLength
        )) {
            direction *= -1;
        }

        // If neither direction works, just keep going right
        if (!canMoveVertical(
            tileGrid,
            x,
            y,
            direction,
            verticalLength
        )) {
            continue;
        }

        for (let i = 0; i < verticalLength; i++) {
            y += direction;
            addPathTile(x, y);
        }
    }
}

function canMoveVertical(
    tileGrid: Tile[][],
    x: number,
    y: number,
    direction: number,
    length: number
) {
    const height = tileGrid.length;

    const endY = y + direction * length;

    // Keep some space from the top/bottom edges
    if (endY < 2 || endY >= height - 2) {
        return false;
    }

    // Don't cross an existing path
    for (let i = 1; i <= length; i++) {
        const checkY = y + direction * i;

        if (tileGrid[checkY][x].isPath) {
            return false;
        }
    }

    return true;
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

        // Entrance / exit
        if (!previous || !next) {
            current.tile.pathFrame = PATH_FRAMES.HORIZONTAL;
            continue;
        }

        const incoming = getDirection(previous, current);
        const outgoing = getDirection(current, next);

        if (incoming === "right" && outgoing === "right") {
            current.tile.pathFrame = PATH_FRAMES.HORIZONTAL;
        }

        else if (
            (incoming === "down" && outgoing === "down") ||
            (incoming === "up" && outgoing === "up")
        ) {
            current.tile.pathFrame = PATH_FRAMES.VERTICAL;
        }

        else if (incoming === "right" && outgoing === "down") {
            current.tile.pathFrame = PATH_FRAMES.RIGHT_TO_DOWN;
        }

        else if (incoming === "down" && outgoing === "right") {
            current.tile.pathFrame = PATH_FRAMES.DOWN_TO_RIGHT;
        }

        else if (incoming === "right" && outgoing === "up") {
            current.tile.pathFrame = PATH_FRAMES.RIGHT_TO_UP;
        }

        else if (incoming === "up" && outgoing === "right") {
            current.tile.pathFrame = PATH_FRAMES.UP_TO_RIGHT;
        }
    }
}

function generateWaypoints(
    k: KAPLAYCtx,
    pathTiles: PathTile[],
    mapWidth: number
) {
    if (pathTiles.length === 0) return [];

    const waypoints: Vec2[] = [];

    const toWorldPos = (pathTile: PathTile) =>
        k.vec2(
            pathTile.x * TILE_SIZE + TILE_SIZE / 2,
            pathTile.y * TILE_SIZE + TILE_SIZE / 2
        );

    const first = pathTiles[0];

    waypoints.push(
        k.vec2(
            -TILE_SIZE / 2,
            first.y * TILE_SIZE + TILE_SIZE / 2
        )
    );

    for (let i = 1; i < pathTiles.length - 1; i++) {
        const previous = pathTiles[i - 1];
        const current = pathTiles[i];
        const next = pathTiles[i + 1];

        const incomingX = current.x - previous.x;
        const incomingY = current.y - previous.y;

        const outgoingX = next.x - current.x;
        const outgoingY = next.y - current.y;

        if (
            incomingX !== outgoingX ||
            incomingY !== outgoingY
        ) {
            waypoints.push(toWorldPos(current));
        }
    }

    const last = pathTiles[pathTiles.length - 1];

    waypoints.push(
        k.vec2(
            mapWidth * TILE_SIZE + TILE_SIZE / 2,
            last.y * TILE_SIZE + TILE_SIZE / 2
        )
    );

    return waypoints;
}