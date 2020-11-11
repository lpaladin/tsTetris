namespace Util {

	export namespace colors {
		export function extract(color: number) {
			return [(color & 0xff0000) >> 16, (color & 0x00ff00) >> 8, color & 0x0000ff];
		}

		export function add(color: number, degree2: number, color2 = Colors.WHITE, degree1 = 1) {
			let c2 = extract(color2);
			return extract(color)
				.map((comp, i) => Math.min(Math.round(comp * degree1 + degree2 * c2[i]), 255))
				.reduce((sum, val, i) => (sum << 8) | val);
		}

		export function scale(color: number, scale: number) {
			return [(color & 0xff0000) >> 16, (color & 0x00ff00) >> 8, color & 0x0000ff]
				.map(comp => Math.min(Math.round(comp * scale), 255))
				.reduce((sum, val, i) => (sum << 8) | val);
		}
	}

	export function sign(x: number) {
		return x > 0 ? 1 : x < 0 ? -1 : 0;
	}

	let emitter: PIXI.particles.Emitter;

	export function emitParticleAt(container: PIXI.Container, rect: { x: number, y: number, w: number, h: number }) {
		let config = JSON.parse(JSON.stringify(Assets.particleConfig));
		config.spawnRect = rect;
		config.maxParticles = (rect.w + rect.h) * 20 / Block.Component.BLOCK_SIZE;
		emitter = new PIXI.particles.Emitter(container, Assets.DUMMY_TEXTURE, config);
		emitter.playOnceAndDestroy();
	}

	export function rand(upper: number) {
		return Math.floor(Math.random() * upper);
	}

	export function createAt<T extends PIXI.Container>(ctor: new (...args: any[]) => T,
		x: number, y: number, w: number, h: number, ...args: any[]): T {
		let obj = new ctor(...args);
		obj.x = x;
		obj.y = y;
		obj.width = w;
		obj.height = h;
		return obj;
	}

	export function biDirectionConstantSet(obj: Object, propName: string, to: (() => void) | any) {
		let initial: any;
		if (Array.isArray(obj))
			return TweenMax.to({}, 0.001, {
				immediateRender: false,
				onComplete: () => {
					initial = obj[0] && obj[0][propName];
					if (to instanceof Function)
						to = to();
					obj.forEach(o => o[propName] = to);
				},
				onReverseComplete: () =>
					obj.forEach(o => o[propName] = initial)
			});
		else
			return TweenMax.to({}, 0.001, {
				immediateRender: false,
				onComplete: () => {
					initial = obj[propName];
					if (to instanceof Function)
						obj[propName] = to();
					else
						obj[propName] = to;
				},
				onReverseComplete: () =>
					obj[propName] = initial
			});
	}
}

module Block {
	class Logic extends Block.Tetromino {
		public findHorizontalRouteTo2(r: number, fromC: number, fromO: number, toC: number, toO: number): boolean {
			if (!this.check(r, fromC, fromO))
				return false;
			if (fromC == toC)
				return fromO == toO;

			let dc = Util.sign(toC - fromC); // 已经保证不是0了

			// 直接移动？
			if (this.findHorizontalRouteTo2(r, fromC + dc, fromO, toC, toO))
				return true;

			// 或者先原地旋转再移动
			for (let i = 1; i < 4; i++) {
				let o = (fromO - i + 4) % 4;
				if (this.check(r, fromC, o)) {
					if (this.findHorizontalRouteTo2(r, fromC + dc, o, toC, toO))
						return true;
				} else
					return false;
			}
			
			return false;
		}

		public findRouteToNode2(node: IRouteKeyNode) {
			if (this.r != node.r - 1)
				return false;
			let dc = Util.sign(node.c - this.c);
			let upperR = this.r, lowerR = node.r;

			// 枚举拐点
			for (let turningPoint = this.c; ; turningPoint += dc) {
				// 枚举拐点处的朝向
				for (let o = 0; o < 4; o++) {
					// 先检查是否可能
					if (!this.check(upperR, turningPoint, o) ||
						!this.check(lowerR, turningPoint, o))
						continue;

					// 再分别检查靠上一段和靠下一段
					if (this.findHorizontalRouteTo2(upperR, this.c, this.orientation, turningPoint, o) &&
						this.findHorizontalRouteTo2(lowerR, turningPoint, o, node.c, node.o))
						return true;
				}
				if (turningPoint == node.c)
					break;
			}

			return false;
		}
	}
}