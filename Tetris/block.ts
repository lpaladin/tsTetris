abstract class FieldProp extends PIXI.Sprite {
	abstract setRC(r?: number, c?: number, immediate?: boolean): TweenMax;

	public offsetX = 0;
	public offsetY = 0;

	constructor(texture?: PIXI.Texture) { super(texture); }
}


namespace Block {
	/**
	 * 元素块
	 */
	export class Component extends FieldProp {
		/*
		 * 每个元素块边长为几个像素
		 */
		static readonly BLOCK_SIZE = 12;
		static readonly STORE_SIZE = 600;
		static TEXTURE: PIXI.RenderTexture;
		static store: Component[];
		static storePointer = 0;

		private _r: number;
		private _c: number;

		public setRC(r: number = this.r, c: number = this.c, immediate = false): TweenMax {
			this._r = r;
			this._c = c;
			if (immediate) {
				this.x = c * Component.BLOCK_SIZE + this.offsetX;
				this.y = r * Component.BLOCK_SIZE + this.offsetY;
				return null;
			}
			return TweenMax.to(this, 0.3, {
				x: c * Component.BLOCK_SIZE + this.offsetX,
				y: r * Component.BLOCK_SIZE + this.offsetY
			});
		}

		public get r() {
			return this._r;
		}

		public get c() {
			return this._c;
		}

		static create(r: number, c: number, ox: number, oy: number) {
			if (!Component.store) {
				Component.store = new Array(Component.STORE_SIZE);
				for (let i = 0; i < Component.STORE_SIZE; i++)
					Component.store[i] = new Component();
			}
			let curr = Component.store[Component.storePointer];
			if (!curr) {
				curr = Component.store[Component.storePointer] = new Component();
			}
			Component.storePointer++;
			curr.offsetX = ox;
			curr.offsetY = oy;
			curr.visible = false;
			curr.scale.x = 1;
			curr.scale.y = 1;
			curr.setRC(r, c, true);
			return curr;
		}

		private constructor() {
			super(Component.TEXTURE);
			this.height = Component.BLOCK_SIZE;
			this.width = Component.BLOCK_SIZE;
		}
	}

	export interface IRouteKeyNode { r: number, c: number, o: number };

	/**
	 * 由四个元素块组成的整体块
	 */
	export class Tetromino extends FieldProp {

		txtActionTaken: PIXI.Text;
		public constructor(public readonly field: GameField, public readonly type: number, withMark = false) {
			super();
			this.height = Component.BLOCK_SIZE * 5;
			this.width = Component.BLOCK_SIZE * 5;
			this.on('pointerdown', Tetromino.onDragStart)
				.on('pointerup', Tetromino.onDragEnd)
				.on('pointerupoutside', Tetromino.onDragEnd)
				.on('pointermove', Tetromino.onDragMove)
				.on('pointerover', Tetromino.onHover)
				.on('pointerout', Tetromino.onLeave);

			let def = Tetromino.blockDef[type][0];
			for (let i = 0; i < 4; i++)
				this.addChild(Component.create(-def[i * 2 + 1], def[i * 2], -0.5 * Component.BLOCK_SIZE, -0.5 * Component.BLOCK_SIZE));

			if (withMark) {
				this.txtActionTaken = new PIXI.Text("✓", {
					fontFamily: Assets.fontFamily,
					fontSize: Component.BLOCK_SIZE * 2,
					fill: "#e28554",
					fontWeight: "bold",
					stroke: "white",
					strokeThickness: 2,
					padding: 4
				});
				this.txtActionTaken.anchor.set(0.5, 0.5);
				this.txtActionTaken.scale.set(0.5, 0.5);
				this.txtActionTaken.visible = false;
			}
		}

		public set actionShown(to: boolean) {
			if (to) {
				this.parent.addChild(this.txtActionTaken);
				this.txtActionTaken.x = this.x - 0.5 * Component.BLOCK_SIZE;
				this.txtActionTaken.y = this.y;
				this.txtActionTaken.alpha = 1;
				this.txtActionTaken.visible = true;
			} else {
				this.parent.removeChild(this.txtActionTaken);
				TweenMax.killTweensOf(this.txtActionTaken);
				this.txtActionTaken.visible = false;
			}
		}

		static readonly TYPE_COUNT = 7;
		static readonly ORIENTATION_COUNT = 4;
		//static OUTLINE_FILTER = new PIXI.filters.OutlineFilter(1, 0xFFFFFF);
		//static OUTLINE_HOVER_FILTER = new PIXI.filters.OutlineFilter(2, 0xCE00CE);
		private static readonly blockDef = [
			[ [ 0, 0, 1, 0, -1, 0, -1, -1 ],[ 0, 0, 0, 1, 0, -1, 1, -1 ],[ 0, 0, -1, 0, 1, 0, 1, 1 ],[ 0, 0, 0, -1, 0, 1, -1, 1 ] ],
			[ [ 0, 0, -1, 0, 1, 0, 1, -1 ],[ 0, 0, 0, -1, 0, 1, 1, 1 ],[ 0, 0, 1, 0, -1, 0, -1, 1 ],[ 0, 0, 0, 1, 0, -1, -1, -1 ] ],
			[ [ 0, 0, 1, 0, 0, -1, -1, -1 ],[ 0, 0, 0, 1, 1, 0, 1, -1 ],[ 0, 0, -1, 0, 0, 1, 1, 1 ],[ 0, 0, 0, -1, -1, 0, -1, 1 ] ],
			[ [ 0, 0, -1, 0, 0, -1, 1, -1 ],[ 0, 0, 0, -1, 1, 0, 1, 1 ],[ 0, 0, 1, 0, 0, 1, -1, 1 ],[ 0, 0, 0, 1, -1, 0, -1, -1 ] ],
			[ [ 0, 0, -1, 0, 0, 1, 1, 0 ],[ 0, 0, 0, -1, -1, 0, 0, 1 ],[ 0, 0, 1, 0, 0, -1, -1, 0 ],[ 0, 0, 0, 1, 1, 0, 0, -1 ] ],
			[ [ 0, 0, 0, -1, 0, 1, 0, 2 ],[ 0, 0, 1, 0, -1, 0, -2, 0 ],[ 0, 0, 0, 1, 0, -1, 0, -2 ],[ 0, 0, -1, 0, 1, 0, 2, 0 ] ],
			[ [ 0, 0, 0, 1, -1, 0, -1, 1 ],[ 0, 0, -1, 0, 0, -1, -1, -1 ],[ 0, 0, 0, -1, 1, -0, 1, -1 ],[ 0, 0, 1, 0, 0, 1, 1, 1 ] ]
		];
		//private static readonly rotationRequirement = [[[1, 1], [-1, 1], [-1, -1], [1, -1]],
		//	[[-1, -1], [1, -1], [1, 1], [-1, 1]],
		//	[[1, 1], [-1, 1], [-1, -1], [1, -1]],
		//	[[-1, -1], [1, -1], [1, 1], [-1, 1]],
		//	[[-1, -1, -1, 1, 1, 1],
		//	[-1, -1, -1, 1, 1, -1],
		//	[-1, -1, 1, 1, 1, -1],
		//	[-1, 1, 1, 1, 1, -1]],
		//	[[1, -1, -1, 1, -2, 1, -1, 2, -2, 2],
		//	[1, 1, -1, -1, -2, -1, -1, -2, -2, -2],
		//	[-1, 1, 1, -1, 2, -1, 1, -2, 2, -2],
		//	[-1, -1, 1, 1, 2, 1, 1, 2, 2, 2]],
		//	[[], [], [], []]
		//];
		private _orientation: number = 0;
		private dragging = false;
		private dragData: PIXI.interaction.InteractionData;
		private dragBeginPos = { x: 0, y: 0, r: 0, c: 0 };
		private _r: number;
		private _c: number;
		private _active = false;

		public check(r: number = this.r, c: number = this.c, o: number = this.orientation) {
			if (o >= 4 || o < 0)
				return false;
			let def = Tetromino.blockDef[this.type][o];
			for (let i = 0; i < 4; i++) {
				let _c = def[i * 2] + c, _r = -def[i * 2 + 1] + r;
				if (_r < 0 || _r >= GameField.FIELD_HEIGHT ||
					_c < 0 || _c >= GameField.FIELD_WIDTH ||
					this.field.fieldContent[_r][_c])
					return false;
			}
			return true;
		}

		public checkDirectDropTo(r: number, c: number, o: number, fromR = 0) {
			let def = Tetromino.blockDef[this.type][o];
			for (; r >= fromR; r--)
				for (let i = 0; i < 4; i++) {
					let _c = def[i * 2] + c, _r = -def[i * 2 + 1] + r;
					if (_r < 0)
						continue;
					if (_r >= GameField.FIELD_HEIGHT ||
						_c < 0 || _c >= GameField.FIELD_WIDTH ||
						this.field.fieldContent[_r][_c]) {
						return false;
					}
				}
			return true;
		}

		public drop() {
			let r = this.r, c = this.c;
			while (this.check(r, c) && r < GameField.FIELD_HEIGHT) r++;
			r--;
			if (r == this.r)
				return null;

			return this.setRC(r, c, false, Expo.easeIn).eventCallback("onComplete", () => {
				Util.emitParticleAt(this.parent, this.findHitBorder(r + 1, c));
				snd.playSoundImmediate(sounds.sndImpact);
			});
		}

		public findHitBorder(r: number, c: number, vibrate = true, x = this.x, y = this.y) {
			// 找出以rc为目标的撞击边缘矩形
			let dr = Util.sign(r - this.r), dc = Util.sign(c - this.c);
			let s = this.field.stage;
			if (vibrate && !TweenMax.isTweening(s))
				TweenMax.to(s, 0.05, { x: s.x + dc, y: s.y + dr, repeat: 1, yoyo: true });

			let def = Tetromino.blockDef[this.type][this.orientation];
			let maxR = -1, maxC = -1, maxs = { minR: 0, maxR: 0, minC: 0, maxC: 0 };
			for (let i = 0; i < 4; i++) {
				let _c = def[i * 2], _r = -def[i * 2 + 1];
				if (dc && _c * dc > maxC ||
					dr && _r * dr > maxR) {
					maxC = _c * dc;
					maxR = _r * dr;
					maxs = { minR: _r, maxR: _r, minC: _c, maxC: _c };
				} else if (dc && _c * dc == maxC ||
					dr && _r * dr == maxR) {
					maxs.minR = Math.min(maxs.minR, _r);
					maxs.maxR = Math.max(maxs.maxR, _r);
					maxs.minC = Math.min(maxs.minC, _c);
					maxs.maxC = Math.max(maxs.maxC, _c);
				}
			}
			let w = (maxs.maxC - maxs.minC) * Component.BLOCK_SIZE,
				h = (maxs.maxR - maxs.minR) * Component.BLOCK_SIZE;
			if (dc) {
				h += Component.BLOCK_SIZE;
				y += (maxs.minR - 1 / 2) * Component.BLOCK_SIZE;
			} else
				y += (dr / 2 + maxs.maxR) * Component.BLOCK_SIZE;
			if (dr) {
				w += Component.BLOCK_SIZE;
				x += (maxs.minC - 1 / 2) * Component.BLOCK_SIZE;
			} else
				x += (dc / 2 + maxs.maxC) * Component.BLOCK_SIZE;
			return { x, y, w, h };
		}

		public updateShadow(immediate = false) {
			if (!this._active)
				return;
			let def = Tetromino.blockDef[this.type][this.orientation];
			let lm = 4, rm = -4;
			for (let i = 0; i < 4; i++) {
				let _c = def[i * 2];
				lm = Math.min(_c, lm);
				rm = Math.max(_c, rm);
			}
			if (immediate) {
				this.field.activeBlockShadow.x = this.field.x + (this.c + lm) * Component.BLOCK_SIZE;
				this.field.activeBlockShadow.width = (rm - lm + 1) * Component.BLOCK_SIZE;
				return;
			}
			return TweenMax.to(this.field.activeBlockShadow, 0.3, {
				x: this.field.x + (this.c + lm) * Component.BLOCK_SIZE,
				width: (rm - lm + 1) * Component.BLOCK_SIZE
			});
		}

		public calcXY(r: number, c: number) {
			return {
				x: c * Component.BLOCK_SIZE + Component.BLOCK_SIZE / 2 + this.offsetX,
				y: r * Component.BLOCK_SIZE + Component.BLOCK_SIZE / 2 + this.offsetY
			};
		}

		public setRC(r?: number, c?: number, immediate?: false, ease?: Ease): TweenMax;
		public setRC(r?: number, c?: number, immediate?: true, ease?: Ease): false;
		public setRC(r?: number, c?: number, immediate?: boolean, ease?: Ease): TweenMax | false;
		public setRC(r: number = this.r, c: number = this.c, immediate = false, ease: Ease = Quad.easeOut): TweenMax | false {
			if (!this.check(r, c)) {
				!immediate && Util.emitParticleAt(this.parent, this.findHitBorder(r, c));
				return null;
			}
			this._r = r;
			this._c = c;

			this.updateShadow(immediate);
			let o = this.calcXY(r, c);
			if (immediate) {
				this.x = o.x;
				this.y = o.y;
				return false;
			}
			return TweenMax.to(this, 0.3, {
				x: o.x,
				y: o.y,
				ease
			});
		}

		public findHorizontalRouteTo(route: IRouteKeyNode[],
			r: number, fromC: number, fromO: number, toC: number, toO: number): boolean {
			if (!this.check(r, fromC, fromO))
				return false;
			if (fromC == toC && fromO == toO) {
				route.push({ r, c: fromC, o: fromO });
				return true;
			}

			let dc = Util.sign(toC - fromC); // 已经保证不是0了

			route.push({ r, c: fromC, o: fromO });
			if (dc != 0) {
				// 直接移动？
				if (this.findHorizontalRouteTo(route, r, fromC + dc, fromO, toC, toO))
					return true;
			}

			// 或者先原地旋转再移动
			let node = { r, c: fromC, o: fromO };
			route.push(node);
			for (let i = 1; i < 4; i++) {
				let o = node.o = (fromO + i) % 4;
				if (this.check(r, fromC, o)) {
					if (this.findHorizontalRouteTo(route, r, fromC + dc, o, toC, toO))
						return true;
				} else
					break;
			}
			
			route.pop();
			route.pop();
			return false;
		}

		public findRouteToNode(node: IRouteKeyNode) {
			if (this.r != node.r - 1)
				throw "路径非法";
			let dc = Util.sign(node.c - this.c);
			let upperR = this.r, lowerR = node.r;
			
			// 枚举拐点
			for (let turningPoint = this.c; ; turningPoint = (turningPoint + dc) % GameField.FIELD_WIDTH) {
				// 枚举拐点处的朝向
				for (let o = 0; o < 4; o++) {
					// 先检查是否可能
					if (!this.check(upperR, turningPoint, o) ||
						!this.check(lowerR, turningPoint, o))
						continue;

					// 再分别检查靠上一段和靠下一段
					let route: IRouteKeyNode[] = [];
					if (this.findHorizontalRouteTo(route, upperR, this.c, this.orientation, turningPoint, o) &&
						route.push({ r: upperR, c: turningPoint, o }),
						this.findHorizontalRouteTo(route, lowerR, turningPoint, o, node.c, node.o))
						return route;
				}
				if (turningPoint == (node.c + GameField.FIELD_WIDTH - 1) % GameField.FIELD_WIDTH)
					break;
			}

			throw "找不到合适路径";
		}

		public playRoute_new(newAPIRoute: IRouteKeyNode[]) {
			this.active = false;

			let route = newAPIRoute;

			let initial = route[0];
			this._c = initial.c;

			// 找起点
			for (this._r = 0;
				!this.checkDirectDropTo(this.r, this.c, initial.o) || !this.check(this._r, this.c, initial.o);
				this._r++)
				if (this._r > initial.r)
					throw "无法找到路径起点";
			// 开始画路径
			let tl = new TimelineMax();

			let ret = this.setOrientation(initial.o);
			if (ret) {
				snd.playSound(tl, sounds.sndRotate);
				tl.add(ret);
			}
			tl.add(this.setRC(undefined, undefined), 0);

			for (let i = 0; i < route.length; i++) {
				let node = route[i];
				if (node.c == this.c && node.o == this.orientation &&
					this.checkDirectDropTo(node.r, node.c, node.o, this.r)) {
					if (route.length == 1) {
						tl.add(this.setRC(node.r, node.c, false, Expo.easeIn));
						snd.playSound(tl, sounds.sndImpact);
					} else
						tl.add(this.setRC(node.r, node.c));
				} else if (i > 0) {
					let from = route[i - 1], to = node;
					let tween: TweenMax;
					if (from.o == to.o)
						tween = this.setRC(to.r, to.c);
					else {
						tween = this.setOrientation(to.o);
						snd.playSound(tl, sounds.sndRotate);
					}
					if (tween)
						tl.add(tween);
				} else
					throw "???";
			}
			return tl;
		}

		// 仅用于兼容
		public playRoute(oldAPIRoute: IRouteKeyNode[]) {
			this.simpifyRoute(oldAPIRoute);
			this.active = false;

			// 这里重演了一遍 Judge 的逻辑……

			let route = oldAPIRoute;

			// 首先确保所有坐标没有越界
			if (!route.every(obj => this.check(obj.r, obj.c, obj.o)))
				throw "路径坐标越界";

			let initial = route[0];
			this._c = initial.c;

			// 找起点
			for (this._r = 0;
				!this.checkDirectDropTo(this.r, this.c, initial.o) || !this.check(this._r, this.c, initial.o);
				this._r++)
				if (this._r > initial.r)
					throw "无法找到路径起点";
			// 开始画路径
			let tl = new TimelineMax();

			let ret = this.setOrientation(initial.o);
			if (ret) {
				snd.playSound(tl, sounds.sndRotate);
				tl.add(ret);
			}
			tl.add(this.setRC(undefined, undefined), 0);

			for (let node of route) {
				if (node.c == this.c && node.o == this.orientation &&
					this.checkDirectDropTo(node.r, node.c, node.o, this.r)) {
					if (route.length == 1) {
						tl.add(this.setRC(node.r, node.c, false, Expo.easeIn));
						snd.playSound(tl, sounds.sndImpact);
					} else
						tl.add(this.setRC(node.r, node.c));
				} else {
					let p = this.findRouteToNode(node);
					p.push(node);
					for (let i = 1; i < p.length; i++) {
						let from = p[i - 1], to = p[i];
						let tween: TweenMax;
						if (from.o == to.o)
							tween = this.setRC(to.r, to.c);
						else {
							tween = this.setOrientation(to.o);
							snd.playSound(tl, sounds.sndRotate);
						}
						if (tween)
							tl.add(tween);
					}
				}
			}
			return tl;
		}

		public simpifyRoute(oldAPIRoute: IRouteKeyNode[]) {
			// 进行一下简单压缩（检查有没有能直接掉落到的结点）
			for (let i = oldAPIRoute.length - 1; i >= 0; i--) {
				let item = oldAPIRoute[i];
				if (this.checkDirectDropTo(item.r, item.c, item.o)) {
					oldAPIRoute.splice(0, i);
					break;
				}
			}
			let last = oldAPIRoute[1];
			for (let i = 2; i < oldAPIRoute.length; i++) {
				let item = oldAPIRoute[i];
				if (item.c == last.c && item.o == last.o) {
					// 仅在 A、B、C除了r都一样的时候，删掉B
					if (oldAPIRoute[i - 1] != last) {
						oldAPIRoute.splice(i - 1, 1);
						i--;
					}
				} else
					last = item;
			}
		}

		public place(): TimelineMax {
			if (this.check(this.r + 1))
				return null; // 如果还能往下走就不能放置

			// 由于 addChild 会对 this.children 造成影响，因此需要复制
			let tl = new TimelineMax();
			tl.add(Util.biDirectionConstantSet(this, "visible", false));

			let def = Tetromino.blockDef[this.type][this.orientation];
			this.field.lastTetrominoComponents = [];
			for (let i = 0; i < 4; i++) {
				let child = Component.create(this.r - def[i * 2 + 1], this.c + def[i * 2], 0, 0);
				tl.add(Util.biDirectionConstantSet(child, "visible", true), 0);
				this.field.addChild(this.field.fieldContent[child.r][child.c] = child);
				this.field.lastTetrominoComponents.push(child);
			}
			return tl;
		}

		public setOrientation(to: number, immediate = false): TweenMax {
			to = (to + 4) % 4;
			if (!this.check(this.r, this.c, to))
				return;

			if (immediate) {
				this.rotation = -to * Math.PI / 2;
				this._orientation = to;
				this.updateShadow(immediate);
				return null;
			}

			if (this._orientation == to)
				return;
			if (this._orientation > to)
				this._orientation -= 4;

			let t = TweenMax.fromTo(this, 0.3,
				{ rotation: -this._orientation * Math.PI / 2 }, { rotation: -to * Math.PI / 2, immediateRender: false });
			this._orientation = to;
			this.updateShadow();
			return t;
		}

		public get orientation() {
			return this._orientation;
		}

		public get r() {
			return this._r;
		}

		public get c() {
			return this._c;
		}

		public get active() {
			return this._active;
		}

		public set active(to) {
			if (this._active == to)
				return;
			this.interactive = to;
			this.buttonMode = to;
			this.field.activeBlockShadow.visible = to;
			this._active = to;
			if (to) {
				this.updateShadow(true);
				//this.filters = [Tetromino.OUTLINE_FILTER];

				this.field.oppositeField.selector.active = true;
				TweenMax.to(this.field.oppositeField, 0.1, {
					colorProps: { tint: Util.colors.scale(Colors.WHITE, 0.5), format: "number" }
				});
				TweenMax.to(this.field, 0.1, { colorProps: { tint: Colors.WHITE, format: "number" } });
				this.field.selector.active = false;
			} else {
				this.filters = null;
				this.field.oppositeField.selector.active = false;
				TweenMax.to(this.field.oppositeField, 0.1, {
					colorProps: { tint: Colors.WHITE, format: "number" }
				});
			}
		}

		findBegin(_r: number, _c: number) {
			if (this.setRC(_r, _c, true) !== false) {
				// 在同一行寻找一个合适的起点
				outer:
				for (; _r < GameField.FIELD_HEIGHT; _r++)
					for (let dc = 0; dc < GameField.FIELD_WIDTH; dc++)
						for (let o = 0; o < 4; o++) {
							let c = (dc + _c) % GameField.FIELD_WIDTH;
							this._orientation = o;
							if (this.setRC(_r, c, true) === false && this.checkDirectDropTo(_r, c, o))
								break outer;
						}
				if (_r == GameField.FIELD_HEIGHT)
					throw "已经无处可下";
			}
			this.setOrientation(this._orientation, true);
		}

		findNextBegin() {
			let origR = this.r;
			let rBegin = this.r, cBegin = this.c, oBegin = this.orientation + 1;
			for (let r = rBegin; r < GameField.FIELD_HEIGHT; r++) {
				for (let c = cBegin; c < GameField.FIELD_WIDTH; c++) {
					for (let o = oBegin; o < 4; o++) {
						this._orientation = o;
						if (this.setRC(r, c, true) === false && this.checkDirectDropTo(r, c, o)) {
							this.setOrientation(this._orientation, true);
							this.updateShadow(true);
							return;
						}
						rBegin = cBegin = oBegin = 0;
					}
					rBegin = cBegin = oBegin = 0;
				}
				rBegin = cBegin = oBegin = 0;
			}
			if (origR == 0)
				return;
			this._r = 0;
			this.findNextBegin();
		}
		
		static onHover = function (this: Tetromino) {
			if (!this._active)
				return;
			//this.filters = [Tetromino.OUTLINE_HOVER_FILTER];
		}

		static onLeave = function (this: Tetromino) {
			if (!this._active)
				return;
			//this.filters = [Tetromino.OUTLINE_FILTER];
		}

		static onDragStart = function (this: Tetromino, event: PIXI.interaction.InteractionEvent) {
			if (!this._active)
				return;
			this.alpha = 0.8;
			this.dragging = true;
			this.dragData = event.data;
			let { x, y } = event.data.getLocalPosition(this.parent);
			this.dragBeginPos = {
				x, y, r: this.r, c: this.c
			};
		}

		static onDragEnd = function (this: Tetromino) {
			if (!this._active)
				return;
			if (this.r == this.dragBeginPos.r && this.c == this.dragBeginPos.c)
				this.drop();
			this.alpha = 1;
			this.dragging = false;
			this.dragData = null;
			//this.filters = [Tetromino.OUTLINE_FILTER];
		}

		static onDragMove = function (this: Tetromino) {
			if (!this._active)
				return;
			if (this.dragging) {
				let newPosition = this.dragData.getLocalPosition(this.parent);
				let r = this.dragBeginPos.r + Math.round((newPosition.y - this.dragBeginPos.y) / Component.BLOCK_SIZE);
				let c = this.dragBeginPos.c + Math.round((newPosition.x - this.dragBeginPos.x) / Component.BLOCK_SIZE);
				if (r == this.r && c == this.c)
					return;

				// 先检查是不是可以直接掉到这个位置
				if (this.checkDirectDropTo(r, c, this.orientation)) {
					this.setRC(r, c, true);
					return;
				}

				// 必须要一步一步模拟，避免穿墙
				let dr = r > this.r ? 1 : -1, dc = c > this.c ? 1 : -1;
				for (let or = this.r; or != r; or += dr)
					if (this.setRC(or, this.c, true) === null)
						return;
				for (let oc = this.c; oc != c; oc += dc)
					if (this.setRC(this.r, oc, true) === null)
						return;
			}
		}
	}
}