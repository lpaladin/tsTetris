declare class Ease {
    constructor(func?: () => void, extraParams?: any[], type?: number, power?: number);

    /** Translates the tween's progress ratio into the corresponding ease ratio. */
    getRatio(p: number): number;
}

declare class EaseLookup {
    static find(name: string): Ease;
}

declare class Back extends Ease {
    static easeIn: Back;
    static easeInOut: Back;
    static easeOut: Back;
    config(overshoot: number): Elastic;

}
declare class Bounce extends Ease {
    static easeIn: Bounce;
    static easeInOut: Bounce;
    static easeOut: Bounce;
}
declare class Circ extends Ease {
    static easeIn: Circ;
    static easeInOut: Circ;
    static easeOut: Circ;
}
declare class Cubic extends Ease {
    static easeIn: Cubic;
    static easeInOut: Cubic;
    static easeOut: Cubic;
}

declare class Elastic extends Ease {
    static easeIn: Elastic;
    static easeInOut: Elastic;
    static easeOut: Elastic;
    config(amplitude: number, period: number): Elastic;
}

declare class Expo extends Ease {
    static easeIn: Expo;
    static easeInOut: Expo;
    static easeOut: Expo;
}

declare class Linear extends Ease {
    static ease: Linear;
    static easeIn: Linear;
    static easeInOut: Linear;
    static easeNone: Linear;
    static easeOut: Linear;
}

declare class Quad extends Ease {
    static easeIn: Quad;
    static easeInOut: Quad;
    static easeOut: Quad;
}

declare class Quart extends Ease {
    static easeIn: Quart;
    static easeInOut: Quart;
    static easeOut: Quart;
}

declare class Quint extends Ease {
    static easeIn: Quint;
    static easeInOut: Quint;
    static easeOut: Quint;
}

declare class Sine extends Ease {
    static easeIn: Sine;
    static easeInOut: Sine;
    static easeOut: Sine;
}

declare class SlowMo extends Ease {
    static ease: SlowMo;
    config(linearRatio: number, power: number, yoyoMode: boolean): SlowMo;
}

declare class SteppedEase extends Ease {
    constructor(staps: number);
    config(steps: number): SteppedEase;
}

declare interface RoughEaseConfig {
    clamp?: boolean;
    points?: number;
    randomize?: boolean;
    strength?: number;
    taper?: 'in' | 'out' | 'both' | 'none';
    template?: Ease;
}

declare class RoughEase extends Ease {
    static ease: RoughEase;
    constructor(vars: RoughEaseConfig);
    config(steps?: number): RoughEase;
}


declare var Power0: typeof Linear;
declare var Power1: typeof Quad;
declare var Power2: typeof Cubic;
declare var Power3: typeof Quart;
declare var Power4: typeof Quint;
declare var Strong: typeof Quint;
