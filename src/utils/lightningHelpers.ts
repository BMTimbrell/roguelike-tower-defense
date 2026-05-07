import type { KAPLAYCtx, Vec2 } from "kaplay";
import { selectBounceTarget } from "./targetingHelpers";
import type { EnemyGameObj } from "../types";

export function resolveChain(
    k: KAPLAYCtx,
    {
        target,
        maxChains,
        range
    }: {
        target: EnemyGameObj;
        maxChains: number;
        range: number;
    }
): EnemyGameObj[] {

    const targets: EnemyGameObj[] = [];
    let nextTarget = target;

    while (maxChains > 0) {
        if (!nextTarget) break;

        maxChains--;

        targets.push(nextTarget);

        nextTarget = selectBounceTarget(
            k,
            nextTarget,
            {
                bounceRange: range,
                exclude: new Set(targets)
            }
        );
    }

    return targets;
}

export function buildLightningSegments(k: KAPLAYCtx, chain: Vec2[]) {
    const segments = [];

    for (let i = 0; i < chain.length - 1; i++) {
        segments.push(
            generateLightning(
                k,
                chain[i],
                chain[i + 1]
            )
        );
    }

    return segments;
}

export function generateLightning(k: KAPLAYCtx, a: Vec2, b: Vec2) {
    const dist = a.dist(b);
    const steps = Math.max(2, Math.floor(dist / 16));
    const spread = k.clamp(dist * 0.08, 4, 12);

    const points = [];
    const dir = b.sub(a);
    const normal = k.vec2(-dir.y, dir.x).unit();

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const base = a.lerp(b, t);

        const offset =
            i === 0 || i === steps
                ? k.vec2(0, 0)
                : normal.scale(k.rand(-spread, spread));

        points.push(base.add(offset));
    }

    return points;
}

export function drawLightning(k: KAPLAYCtx, points: Vec2[], width: number) {
    for (let i = 0; i < points.length - 1; i++) {
        k.drawLine({
            p1: points[i],
            p2: points[i + 1],
            width,
            color: k.rgb(255, 238, 84),
        });
    }
}