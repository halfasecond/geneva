import { paths } from "./components/Environment";

interface BoundingBox {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

// Check if position is blocked by river
export const isBlockedByRiver = (box: BoundingBox, rivers: { left: number; top: number; width: number; height: number }[]): boolean => {
    return rivers.some(river => {
        const buffer = 30;
        const riverBox = {
            left: river.left + buffer,
            right: river.left + river.width - buffer,
            top: river.top + buffer,
            bottom: river.top + river.height - buffer
        };
        return !(
            box.left >= riverBox.right ||
            box.right <= riverBox.left ||
            box.top >= riverBox.bottom ||
            box.bottom <= riverBox.top
        );
    });
};

// Check if box overlaps with any path
export const isOnPath = (box: BoundingBox): boolean => {
    return paths.some(path => {
        const buffer = 80;
        const pathBox = {
            left: path.left + buffer,
            right: path.left + path.width - buffer,
            top: path.top + buffer,
            bottom: path.top + path.height - buffer
        };
        return !(
            box.left >= pathBox.right ||
            box.right <= pathBox.left ||
            box.top >= pathBox.bottom ||
            box.bottom <= pathBox.top
        );
    });
};

// Check if horse's left edge enters race start box
export const isInStartBox = (box: BoundingBox): boolean => {
    const startBox = {
        left: 580,
        right: 700,
        top: 2060,
        bottom: 2160
    };
    
    // Only check if left edge is in horizontal range and horse overlaps vertically
    return (
        box.left >= startBox.left &&
        box.left <= startBox.right &&
        !(box.top >= startBox.bottom || box.bottom <= startBox.top)
    );
};

// Race state type
export type RaceState = 'not_started' | 'countdown' | 'racing' | 'finished';