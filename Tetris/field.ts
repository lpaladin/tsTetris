
class FieldBorder extends PIXI.Graphics {
	static readonly THICKNESS = 2;

	constructor(private field: GameField) {
		super();
		this.x = field.x - FieldBorder.THICKNESS;
		this.y = field.y - FieldBorder.THICKNESS - field.selector.height;
		let h = this.height = field.height + field.selector.height + FieldBorder.THICKNESS * 2;
		let w = this.width = field.width + FieldBorder.THICKNESS * 2;
		this.lineStyle(FieldBorder.THICKNESS, 0);
		this.drawRect(0, 0, w, h);
	}
}

class FieldIndicator extends PIXI.Graphics {
	static readonly THICKNESS = 2;
	// static readonly WIDTH = TetrisGame.MARGIN_LEFT_RIGHT;
	static readonly LENGTH = 5;
	static readonly MARGIN = 2;
	static readonly FONT_SIZE = 24;

	txtHeight: UIText;
	constructor(private field: GameField) {
		super();
		this.txtHeight = new UIText("0", {
			fontFamily: Assets.fontFamily,
			fontSize: FieldIndicator.FONT_SIZE,
			fontWeight: "bold",
			fill: "black",
			padding: 4
		});
		this.txtHeight.resolution = 2;
		let w = this.width = TetrisGame.MARGIN_LEFT_RIGHT;
		let h = this.height = FieldIndicator.FONT_SIZE;
		this.addChild(this.txtHeight);
		this.lineStyle(FieldIndicator.THICKNESS, 0);
		if (field.side == 0) {
			this.txtHeight.anchor.set(1, 0.5);
			this.txtHeight.x = w - FieldIndicator.LENGTH - FieldIndicator.MARGIN;
			this.txtHeight.y = h / 2;
			this.moveTo(w, h / 2);
			this.lineTo(w - FieldIndicator.LENGTH, h / 2);
			this.pivot.x = w;
			this.pivot.y = h / 2;
			this.x = field.x;
		} else {
			this.txtHeight.anchor.set(0, 0.5);
			this.txtHeight.x = FieldIndicator.LENGTH + FieldIndicator.MARGIN;
			this.txtHeight.y = h / 2;
			this.moveTo(0, h / 2);
			this.lineTo(FieldIndicator.LENGTH, h / 2);
			this.pivot.x = 0;
			this.pivot.y = h / 2;
			this.x = field.x + field.width;
		}
		this.txtHeight.scale.x = this.txtHeight.scale.y = 0.5;
		this.y = field.y + Block.Component.BLOCK_SIZE * GameField.FIELD_HEIGHT;
	}

	private _value = 0;
	public get value() {
		return this._value;
	}
	public set value(to) {
		if (this._value == to)
			return;
		TweenMax.to(this, 0.2, {
			y: Block.Component.BLOCK_SIZE * (GameField.FIELD_HEIGHT - to) + this.field.y
		});
		this.txtHeight.text = to.toString();
		this._value = to;
	}
}

class GameField extends PIXI.Graphics {
	static readonly FIELD_HEIGHT = 20;
	static readonly FIELD_WIDTH = 10;
	static readonly WARNING_THRESHOLD = 16;

	// 左上为原点
	tetrominos: Block.Tetromino[][] = new Array(Block.Tetromino.TYPE_COUNT);
	liveTetrominos: Block.Tetromino[][] = new Array(Block.Tetromino.TYPE_COUNT);
	bufAltPointer: number[] = new Array(Block.Tetromino.TYPE_COUNT);
	bufAltPointerLive: number[] = new Array(Block.Tetromino.TYPE_COUNT);
	fieldContent: Block.Component[][] = new Array(GameField.FIELD_HEIGHT);
	oppositeField: GameField;
	lastTetrominoComponents: Block.Component[];

	border: FieldBorder;
	indicator: FieldIndicator;
	warningText: WarningText;
	selector: TetrominoSelector;

	currentTetromino: Block.Tetromino;
	nextBlock: number;

	private _warningShown = false;

	constructor(public stage: PIXI.Container, public activeBlockShadow: BlockDropIndicator, public side: number) {
		super();
		
		for (let r = 0; r < GameField.FIELD_HEIGHT; r++)
			this.fieldContent[r] = new Array(GameField.FIELD_WIDTH);

		for (let t = 0; t < Block.Tetromino.TYPE_COUNT; t++) {
			this.tetrominos[t] = [new Block.Tetromino(this, t), new Block.Tetromino(this, t)];
			this.liveTetrominos[t] = [new Block.Tetromino(this, t, true), new Block.Tetromino(this, t, true)];
			this.bufAltPointer[t] = 0;
			this.bufAltPointerLive[t] = 0;
		}
	
		let w = this.width = GameField.FIELD_WIDTH * Block.Component.BLOCK_SIZE;
		let h = this.height = GameField.FIELD_HEIGHT * Block.Component.BLOCK_SIZE;
		for (let y = 0; y < h; y += Block.Component.BLOCK_SIZE)
			for (let x = 0; x < w; x += Block.Component.BLOCK_SIZE) {
				let rnd = Math.random() / 16;
				this.beginFill(Util.colors.add(Colors.FIELD_BKG, rnd, PlayerUI.COLORS[side], 1 - rnd), 1);
				this.drawRect(x, y, Block.Component.BLOCK_SIZE, Block.Component.BLOCK_SIZE);
			}
	}

	decorate() {
		this.parent.addChild(
			this.selector = new TetrominoSelector(this),
			this.border = new FieldBorder(this),
			this.indicator = new FieldIndicator(this),
			this.warningText = new WarningText(this)
		);
		this.selector.putChildOnStage();
		this.warningText.beginAnimation();
	}

	lastCallDelta = 0;
	lift(row: number, target: number): TimelineMax {
		let tl = new TimelineMax();
		let hasBlock = false;
		for (let c of this.fieldContent[row])
			if (c) {
				tl.add(c.setRC(target), 0);
				hasBlock = true;
			}
		if (this.lastCallDelta != target - row && hasBlock && row != target) {
			this.lastCallDelta = target - row;
			tl.call(() => this.emitParticlesOnRowBottom(target));
		}
		return tl;
	}

	emitParticlesOnRowBottom(row: number) {
		let y = this.y + (row + 1) * Block.Component.BLOCK_SIZE,
			w = GameField.FIELD_WIDTH * Block.Component.BLOCK_SIZE;
		Util.emitParticleAt(this.parent, {
			x: this.x,
			y, w, h: 0
		});
	}

	check() {
		return GameField.check([this, this.oppositeField]);
	}

	static check(fields: GameField[]): TimelineMax {
		// 检查双方在此状态下是否能够消去块，并进行消去逻辑

		let tl = new TimelineMax();
		let exchangeRows: Block.Component[][][] = [[], []];
		let rowMappings: number[][] = [[], []]; // 映射，如果是undefined则表示是被消去的行

		// 第一遍：记录满行，并求出消除满行后堆叠起来的行的映射
		for (let id = 0; id < 2; id++) {
			let field = fields[id];
			let exRows = exchangeRows[id], mappings = rowMappings[id];
			for (let i = GameField.FIELD_HEIGHT - 1; i >= 0; i--) {
				let j;
				for (j = GameField.FIELD_WIDTH - 1; j >= 0; j--)
					if (!field.fieldContent[i][j])
						break;
				if (j < 0) {
					// 抠掉最后一块（注意一定要在下面循环之前）
					for (let c of field.lastTetrominoComponents) {
						if (c.r == i) {
							tl.to(c.scale, 0.3, { x: 0, y: 0 }, 0);
							tl.add(Util.biDirectionConstantSet(c, "visible", false), 0.3);
							field.fieldContent[c.r][c.c] = undefined;
						}
					}
					exRows.push(field.fieldContent[i]);
				} else
					mappings[i] = i + exRows.length;
			}
		}

		// 如果发生了任何消除：
		if (exchangeRows[0].length + exchangeRows[1].length != 0) {
			snd.playSound(tl, sounds.sndDestroy);
			// 第二遍：交换到对方侧，拱起来对方所有行，给行映射增加偏移
			for (let id = 0; id < 2; id++) {
				let opponentClearCount = exchangeRows[1 - id].length;
				if (opponentClearCount == 0)
					continue;
				let mappings = rowMappings[id];
				for (let i = 0; i < mappings.length; i++) {
					if (mappings[i] !== undefined)
						mappings[i] -= opponentClearCount;
				}
			}
			// 第三遍：让所有行到正确位置
			for (let id = 0; id < 2; id++) {
				let field = fields[id];
				field.lastCallDelta = 0;
				let mappings = rowMappings[id], lastMappingOffset = 0;
				let newField: Block.Component[][] = new Array(GameField.FIELD_HEIGHT);
				for (let i = field.fieldContent.length - 1; i >= 0; i--) {
					let row = field.fieldContent[i];
					let to = mappings[i];
					if (to !== undefined) {
						// 移动的行
						tl.add(field.lift(i, to), 0.3);
						newField[to] = row;
					}
				}

				let opponentClearRows = exchangeRows[1 - id];
				let compCount = 0;
				if (opponentClearRows.length != 0)
					for (let i = 0; i < opponentClearRows.length; i++) {
						let row = opponentClearRows[i];
						let to = GameField.FIELD_HEIGHT - 1 - i;
						// 对方插进来的行
						for (let c of row)
							if (c) {
								c.offsetX = field.x;
								c.offsetY = field.y;
								tl.add(c.setRC(to), 0.3);
								tl.to(c, 0.2, {
									colorProps: { tint: Colors.GOLD, format: "number" },
									ease: Expo.easeOut
								}, 0.01 * compCount++);
							}
						newField[to] = opponentClearRows[i];
					}

				for (let i = 0; i < GameField.FIELD_HEIGHT; i++)
					if (!newField[i])
						newField[i] = new Array(GameField.FIELD_WIDTH);

				field.fieldContent = newField;
			}
		}

		// 最后，更新高度指示器，并显示警告
		for (let id = 0; id < 2; id++) {
			let field = fields[id];
			let h = field.blockHeight;
			tl.add(Util.biDirectionConstantSet(field.indicator, "value", h));
			if (h < GameField.WARNING_THRESHOLD)
				field._warningShown = false;
			else if (!field._warningShown) {
				tl.call(() => {
					field.warningText.parent.addChild(field.warningText); // 放到最前面
					new TimelineMax()
						.add(Util.biDirectionConstantSet(field.warningText, "visible", true))
						.fromTo(field.warningText, 0.5, { alpha: 0 }, { alpha: 1 })
						.to(field.warningText, 0.5, { alpha: 0 }, 1)
						.add(Util.biDirectionConstantSet(field.warningText, "visible", false));
				});
				snd.playSound(tl, sounds.sndWarn);
				field._warningShown = true;
			}
		}
		return tl;
	}

	get blockHeight() {
		for (let i = 0; i < GameField.FIELD_HEIGHT; i++)
			for (let j = GameField.FIELD_WIDTH - 1; j >= 0; j--)
				if (this.fieldContent[i][j]) {
					return GameField.FIELD_HEIGHT - i;
				}
		return 0;
	}

	addChild<T extends FieldProp>(child: T): T;
	addChild<T extends FieldProp>(child: T, immediate: false): TweenMax;
	addChild<T extends FieldProp>(child: T, immediate = true): T | TweenMax {
		child.offsetX = this.x;
		child.offsetY = this.y;
		return child.setRC(undefined, undefined, immediate) || this.stage.addChild(child);
	}

	removeChild(child: FieldProp): PIXI.DisplayObject {
		return this.stage.removeChild(child);
	}

	dropInBlock(r: number, c: number, live = false): TimelineMax {
		let type = this.nextBlock;
		let tl = new TimelineMax();
		let b: Block.Tetromino;
		if (live) {
			b = this.liveTetrominos[type][this.bufAltPointerLive[type]];
			this.bufAltPointerLive[type] = 1 - this.bufAltPointerLive[type];
			b.txtActionTaken.visible = false;
			b.scale.set(1, 1);
			b.txtActionTaken.text = "✓";
			b.alpha = 1;
			this.selector.tempAlterCount(type, 1);
		} else {
			tl.add(this.selector.addCount(type));
			b = this.tetrominos[type][this.bufAltPointer[type]];
			this.bufAltPointer[type] = 1 - this.bufAltPointer[type];
		}
		b.x = b.y = 0;
		b.findBegin(r, c);
		this.addChild(b);
		tl.add(Util.biDirectionConstantSet(b, "visible", true), 0);
		tl.add(Util.biDirectionConstantSet(b.children, "visible", true), 0);
		tl.staggerTo(b.children, 0.1, { colorProps: { tint: Colors.LIGHTGREEN, format: "number" }, ease: Linear.easeNone }, 0.1);

		let t = this.selector.tetrominos[type];
		tl.fromTo(b.scale, 0.5, { x: t.scale.x, y: t.scale.y }, { x: 1, y: 1, ease: Back.easeOut }, 0);
		let rotation = -b.orientation * Math.PI / 2;
		tl.fromTo(b, 0.5, { x: t.x, y: t.y, rotation },
			{ x: b.x, y: b.y, rotation }, 0);
		this.currentTetromino = b;
		return tl;
	}
}