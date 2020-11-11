class UIText extends PIXI.Text {
	constructor(text: string, style?: PIXI.TextStyleOptions) {
		try {
			super(text, style);
			let h = this.height;
		} catch (ex) {
			delete style.fontFamily;
			console.log("字体加载失败，试图使用备用字体：", ex);
			$("body").addClass("bad-font");
			super(text, style);
		}
	}
}

class BlockDropIndicator extends PIXI.Sprite {
	constructor() {
		super(Assets.DUMMY_TEXTURE);
		this.visible = false;
		this.tint = Colors.LIGHTBLUE;
		this.alpha = 0.5;
		//let filter = new PIXI.filters.BlurXFilter(2);
		//this.filters = [filter];
	}
}

class Ending extends PIXI.Graphics {
	static readonly PADDING = 10;
	static readonly TITLE_SIZE = 20;
	static readonly MSG_SIZE = 24;

	txtBigTitle: UIText;
	txtReason: UIText;
	txtWinner: UIText;
	h: number;
	w: number;

	constructor(withWinner: boolean, msg: string) {
		super();

		let height = Ending.PADDING;
		let width = PlayerUI.WIDTH + Ending.PADDING * 2;

		this.txtBigTitle = new UIText("游戏结束", {
			fontFamily: Assets.fontFamily,
			fontSize: Ending.TITLE_SIZE,
			fill: "white",
			dropShadow: true,
			dropShadowDistance: 2,
			dropShadowColor: "black",
			dropShadowBlur: 0,
			fontWeight: "bold",
			padding: 2
		});
		this.txtBigTitle.anchor.set(0.5, 0);
		this.txtBigTitle.x = width / 2;
		this.txtBigTitle.y = height;
		this.addChild(this.txtBigTitle);

		height += Ending.TITLE_SIZE + 4 + Ending.PADDING;

		this.txtReason = new UIText(msg, {
			fontFamily: Assets.fontFamily,
			fontSize: Ending.MSG_SIZE,
			fill: "black",
			padding: 4,
			wordWrap: true,
			wordWrapWidth: (width - Ending.PADDING / 2) * 2,
			lineHeight: Ending.MSG_SIZE * 1.2
		});
		this.txtReason.scale.set(0.5, 0.5);
		this.txtReason.anchor.set(0.5, 0);
		this.txtReason.x = width / 2;
		this.txtReason.y = height;
		this.addChild(this.txtReason);

		height += (Ending.MSG_SIZE + 8) / 2 + Ending.PADDING;
		
		this.txtWinner = new UIText(withWinner ? "胜利者：" : "平局", {
			fontFamily: Assets.fontFamily,
			fontSize: Ending.MSG_SIZE,
			fill: "black",
			padding: 4
		});
		this.txtWinner.scale.set(0.5, 0.5);
		this.txtWinner.anchor.set(0.5, 0);
		this.txtWinner.x = width / 2;
		this.txtWinner.y = height;
		this.addChild(this.txtWinner);

		if (withWinner)
			height += (Ending.MSG_SIZE + 4) / 2 + Ending.PADDING + PlayerUI.HEIGHT + Ending.PADDING;
		else
			height += (Ending.MSG_SIZE + 4) / 2 + Ending.PADDING;
		this.h = height;
		this.w = width;

		this.beginFill(Colors.WHITE, 0.5);
		this.drawRect(0, 0, width, height);
		this.pivot.x = width / 2;
		this.pivot.y = height / 2;
	}
}

class Background extends PIXI.extras.TilingSprite {
	static readonly TILE_SIZE = 10;
	static readonly TEXTURE_SIZE = Background.TILE_SIZE * 10;
	static TEXTURE: PIXI.RenderTexture;

	constructor() {
		super(Background.TEXTURE);
	}

	beginAnimation() {
		return TweenMax.fromTo(this.tilePosition, 5, { x: 0, y: 0 }, {
			x: Background.TEXTURE_SIZE, y: Background.TEXTURE_SIZE, ease: Linear.easeNone, repeat: -1
		});
	}
}

class WarningText extends PIXI.extras.TilingSprite {
	static readonly STRIP_WIDTH = 5;
	static readonly HEIGHT = 40;
	static readonly FONT_SIZE = 12;
	static readonly STRIP_PADDING = 5;
	static TEXTURE: PIXI.Texture;

	private txtWarning: UIText;
	private bkg: PIXI.Sprite;
	constructor(gameField: GameField) {
		super(WarningText.TEXTURE, gameField.width, WarningText.HEIGHT);
		this.x = gameField.x;
		this.y = gameField.y + gameField.height / 2;

		this.bkg = new PIXI.Sprite(Assets.DUMMY_TEXTURE);
		this.bkg.x = 0;
		this.bkg.y = WarningText.STRIP_PADDING;
		this.bkg.width = gameField.width;
		this.bkg.height = WarningText.HEIGHT - WarningText.STRIP_PADDING * 2;
		this.addChild(this.bkg);

		this.txtWarning = new UIText("方块将满", {
			fontFamily: Assets.fontFamily,
			fontSize: WarningText.FONT_SIZE,
			fill: "black",
			fontWeight: "bold",
			padding: 4,
			wordWrap: true,
			wordWrapWidth: gameField.width * 2,
			breakWords: true
		});
		this.txtWarning.anchor.set(0.5, 0.5);
		this.txtWarning.x = gameField.width / 2;
		this.txtWarning.y = WarningText.HEIGHT / 2;
		this.addChild(this.txtWarning);

		this.pivot.y = WarningText.HEIGHT / 2;

		this.visible = false;
	}

	beginAnimation() {
		return TweenMax.fromTo(this.tilePosition, 1, { x: 0 }, {
			x: WarningText.STRIP_WIDTH * 2, ease: Linear.easeNone, repeat: -1
		});
	}
}

class Slash extends PIXI.Graphics {
	static readonly WIDTH = 10;
	static readonly HEIGHT = 80;
	static readonly GRADIENT_PADDING = 5;
	static readonly GRADIENT_ALPHA = 0.5;
	static readonly ANGLE = Math.PI / 12;

	constructor() {
		super();

		this.width = Slash.WIDTH;
		this.height = Slash.HEIGHT;

		this.beginFill(Colors.WHITE, Slash.GRADIENT_ALPHA);
		this.drawRect(0, 0, Slash.WIDTH, Slash.HEIGHT);
		this.beginFill(Colors.WHITE);
		this.drawRect(0, Slash.GRADIENT_PADDING,
			Slash.WIDTH, Slash.HEIGHT - Slash.GRADIENT_PADDING * 2);

		this.lineStyle(1, 0, Slash.GRADIENT_ALPHA);
		this.moveTo(0, 0);
		this.lineTo(0, Slash.HEIGHT);
		this.moveTo(Slash.WIDTH, 0);
		this.lineTo(Slash.WIDTH, Slash.HEIGHT);

		this.lineStyle(1, 0, 1);
		this.moveTo(0, Slash.GRADIENT_PADDING);
		this.lineTo(0, Slash.HEIGHT - Slash.GRADIENT_PADDING);
		this.moveTo(Slash.WIDTH, Slash.GRADIENT_PADDING);
		this.lineTo(Slash.WIDTH, Slash.HEIGHT - Slash.GRADIENT_PADDING);

		this.pivot.x = Slash.WIDTH / 2;
		this.pivot.y = Slash.HEIGHT / 2;
		this.rotation = Slash.ANGLE;
	}
}

class TetrominoSelector extends PIXI.Graphics {
	static readonly THICKNESS = 1;
	static readonly FONT_SIZE = 20;
	static readonly CORNER_PERCENTAGE = 0.4;

	selector: PIXI.Graphics = new PIXI.Graphics();
	tetrominos: Block.Tetromino[] = new Array(Block.Tetromino.TYPE_COUNT);
	rotating: TweenMax[];
	border: FieldBorder;
	size = 0;
	count: number[] = new Array(Block.Tetromino.TYPE_COUNT);
	txtCount: UIText[] = new Array(Block.Tetromino.TYPE_COUNT);
	enabled: boolean[] = new Array(Block.Tetromino.TYPE_COUNT);

	public get active() {
		return this.interactive;
	}
	public set active(to) {
		this.interactive = this.buttonMode = to;
		TweenMax.to(this, 0.1, { colorProps: { tint: Util.colors.scale(Colors.WHITE, to ? 1 : 0.5), format: "number" } });

		let n = this._selectedType;
		while (true) {
			if (this.enabled[n]) {
				this.selectedType = n;
				break;
			}
			n = (n + 1) % Block.Tetromino.TYPE_COUNT;
		}
	}

	public check() {
		let max = Math.max(...this.count),
			min = Math.min(...this.count),
			d = max - min;
		for (let i = 0; i < this.count.length; i++) {
			if (this.enabled[i] = !(d > 1 && this.count[i] == max)) {
				this.txtCount[i].style.fill = "green";
				this.tetrominos[i].children.forEach((x: Block.Component) => x.tint = Colors.WHITE);
			} else {
				this.txtCount[i].style.fill = "red";
				this.tetrominos[i].children.forEach((x: Block.Component) => x.tint = Util.colors.scale(Colors.WHITE, 0.5));
			}
		}
	}

	public tempAlterCount(type: number, by: number) {
		this.txtCount[type].text = (this.count[type] += by).toString();
		this.check();
	}

	public addCount(type: number): TweenMax {
		return TweenMax.to({}, 0.0001, {
			onComplete: () => {
				this.txtCount[type].text = (++this.count[type]).toString();
				this.check();
				if (this.active)
					this.active = true;
			},
			onReverseComplete: () => {
				this.txtCount[type].text = (--this.count[type]).toString();
				this.check();
			}
		});
	}

	constructor(public gameField: GameField) {
		super();

		let size = this.size = Math.floor(gameField.width / Block.Tetromino.TYPE_COUNT);

		this.beginFill(Colors.WHITE, 0.5);
		this.drawRect(0, 0, gameField.width, size);

		let s = this.selector;
		let corner = Math.floor(TetrominoSelector.CORNER_PERCENTAGE * size);
		s.lineStyle(TetrominoSelector.THICKNESS, Colors.GREEN, 0.5);

		s.moveTo(0, corner);
		s.lineTo(0, 0);
		s.lineTo(corner, 0);
		s.moveTo(size - corner, 0);
		s.lineTo(size, 0);
		s.lineTo(size, corner);
		s.moveTo(size, size - corner);
		s.lineTo(size, size);
		s.lineTo(size - corner, size);
		s.moveTo(corner, size);
		s.lineTo(0, size);
		s.lineTo(0, size - corner);

		this.addChild(s);

		for (let i = 0; i < Block.Tetromino.TYPE_COUNT; i++) {
			let text = this.txtCount[i] = new UIText("0", {
				fontFamily: Assets.fontFamily,
				fontSize: TetrominoSelector.FONT_SIZE,
				fill: "green",
				stroke: "white",
				strokeThickness: 2,
				fontWeight: "bold",
				padding: 8
			});
			text.resolution = 2;
			text.alpha = 0.5;
			text.anchor.set(0.5, 0.5);
			text.scale.set(0.5, 0.5);
			let b = new Block.Tetromino(gameField, i);
			text.x = b.x = gameField.x + size * i + size / 2;
			text.y = b.y = gameField.y - size / 2;
			b.scale.x = b.scale.y = Math.min(size / b.width, size / b.height);
			b.visible = true;
			b.children.forEach(c => c.visible = true);
			this.tetrominos[i] = b;
			this.count[i] = 0;
			this.enabled[i] = true;
		}

		this.interactive = this.buttonMode = false;
		this.on("pointertap", (e: PIXI.interaction.InteractionEvent) =>
			this.selectedType = Math.floor(e.data.getLocalPosition(this).x / size)
		);

		this.x = gameField.x;
		this.y = gameField.y - size;

		this.rotating = this.tetrominos.map(t => TweenMax.fromTo(t, 4, { rotation: 0 }, {
			rotation: Math.PI * 2, repeat: -1, ease: Linear.easeNone
		}).pause() as TweenMax);

		//this.border = new FieldBorder(this);
		//this.parent.addChild(this.border);
	}

	public putChildOnStage() {
		for (let i = 0; i < Block.Tetromino.TYPE_COUNT; i++) 
			this.gameField.stage.addChild(this.tetrominos[i], this.txtCount[i]);
		this.rotating[0].play();
	}

	private _selectedType = 0;
	public set selectedType(to) {
		if (this._selectedType == to ||
			to >= Block.Tetromino.TYPE_COUNT ||
			!this.enabled[to])
			return;
		this.rotating[this._selectedType].pause();
		TweenMax.to(this.selector, 0.2, {
			x: this.size * to
		});
		this.rotating[to].play();
		this._selectedType = to;
	}

	public get selectedType() {
		return this._selectedType;
	}
}

class PlayerUI extends PIXI.Graphics {
	static readonly PADDING = 6;
	static readonly WIDTH = 138;
	static readonly HEIGHT = 30;
	static readonly AVATAR_SIZE = 30;
	static readonly TILE_SIZE = 6;
	static readonly FONT_SIZE = 24;
	static readonly COLORS = [Colors.RED, Colors.BLUE];

	txtPlayerName: UIText;
	imgPlayer: PIXI.Sprite;
	
	applyMask(w: number, h: number) {
		let biasX = Slash.HEIGHT * Math.sin(Slash.ANGLE) / 2,
			areaH = Slash.HEIGHT * Math.cos(Slash.ANGLE);
		let g = new PIXI.Graphics();
		g.beginFill(Colors.WHITE, 1);
		g.drawPolygon([0, 0, w / 2 + biasX, 0,
			w / 2 - biasX, areaH, 0, areaH]);
		g.pivot.x = 0;
		g.pivot.y = areaH / 2;
		g.rotation = this.playerID ? Math.PI : 0;
		g.x = this.playerID ? w : 0;
		g.y = h / 2;
		this.parent.addChild(g);
		this.mask = g;
	}

	constructor(public playerID: number, public playerName: string, public imageURL: string) {
		super();

		this.width = PlayerUI.WIDTH;
		this.height = PlayerUI.HEIGHT;
		this.pivot.y = PlayerUI.HEIGHT / 2;
		this.scale.set(1.1, 1.1);

		this.imgPlayer = PIXI.Sprite.fromImage(imageURL);
		this.imgPlayer.width = this.imgPlayer.height = PlayerUI.AVATAR_SIZE;
		this.txtPlayerName = new UIText(playerName, {
			fontFamily: Assets.fontFamily,
			fontSize: PlayerUI.FONT_SIZE,
			fill: [Util.colors.add(PlayerUI.COLORS[playerID], 0.5), Colors.WHITE],
			stroke: "black",
			strokeThickness: 3,
			padding: 4,
			wordWrap: true,
			wordWrapWidth: (PlayerUI.WIDTH - PlayerUI.AVATAR_SIZE - PlayerUI.PADDING * 2) * 2,
			breakWords: true,
			align: playerID ? "right" : "left"
		});
		this.txtPlayerName.resolution = 2;
		this.txtPlayerName.scale.set(0.5, 0.5);
		if (playerID) {
			this.txtPlayerName.anchor.set(1, 0.5);
			this.txtPlayerName.x = PlayerUI.WIDTH - PlayerUI.AVATAR_SIZE - PlayerUI.PADDING;
			this.imgPlayer.x = PlayerUI.WIDTH - PlayerUI.AVATAR_SIZE;
			this.pivot.x = PlayerUI.WIDTH;
		} else {
			this.txtPlayerName.anchor.set(0, 0.5);
			this.txtPlayerName.x = PlayerUI.AVATAR_SIZE + PlayerUI.PADDING;
		}
		this.txtPlayerName.y = PlayerUI.HEIGHT / 2;

		let alphaDrop = 0.8 / (PlayerUI.WIDTH + PlayerUI.HEIGHT - 2);
		for (let y = 0; y < PlayerUI.HEIGHT; y += PlayerUI.TILE_SIZE)
			for (let x = 0; x < PlayerUI.WIDTH; x += PlayerUI.TILE_SIZE) {
				this.beginFill(PlayerUI.COLORS[playerID], Math.max(1 - alphaDrop * (x + y), 0));
				if (playerID)
					this.drawRect(PlayerUI.WIDTH - PlayerUI.TILE_SIZE - x, PlayerUI.HEIGHT - PlayerUI.TILE_SIZE - y,
						PlayerUI.TILE_SIZE, PlayerUI.TILE_SIZE);
				else
					this.drawRect(x, y, PlayerUI.TILE_SIZE, PlayerUI.TILE_SIZE);
			}

		//this.filters = [new PIXI.filters.PixelateFilter()];
		this.addChild(this.imgPlayer, this.txtPlayerName);
	}
}