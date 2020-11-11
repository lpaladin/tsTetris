/**
 * 俄罗斯方块展示程序
 * 作者：zhouhy
 */
// 类型定义
interface DisplayDetail {
	block: number;
	seq?: { x: number, y: number, o: number }[];
	route?: { x: number, y: number, o: number }[];
}
interface DisplayLog {
	"0": DisplayDetail;
	"1": DisplayDetail;
	err?: {
		"0"?: string;
		"1"?: string;
	};
	result: number;
}
interface PlayerRequest {
	block: number;
	x: number;
	y: number;
	o: number;
}
interface PlayerResponse extends PlayerRequest {
	seq?: { x: number, y: number, o: number }[]; // 仅用于旧版API
}

// 准备库环境
if (typeof infoProvider !== 'undefined') {
	// 生产模式，需要使用 Botzone 提供的 TweenMax
	window["TweenMax"] = infoProvider.v2.TweenMax;
	window["TimelineMax"] = infoProvider.v2.TimelineMax;
	let keys = {
		"Ease": true,
		"Expo": true,
		"Linear": true,
		"Back": true,
		"Quad": true
	};
	for (let k in keys)
		window[k] = parent[k];
} else // 调试模式
	infoProvider = <any>{
		dbgMode: true,
		getPlayerNames: () => [{ name: "七海千秋", imgid: "a.png" }, { name: "黑白熊", imgid: "a.png" }],
		v2: {
			setRenderTickCallback: (cb) => TweenMax.ticker.addEventListener('tick', cb)
		}
	};

class TetrisGame {
	static readonly PLAYER_COUNT = 2;
	static readonly MARGIN_LEFT_RIGHT = 15; // 所有的像素单位都不是屏幕上的实际像素
	static readonly MARGIN_FIELD = 15;
	static readonly MARGIN_TOP = 60;
	static readonly MARGIN_BOTTOM = 10;

	pixelHeight: number = 0;
	pixelWidth: number = 0;
	scale: number = 0;

	renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
	canvas: HTMLCanvasElement;
	bkg: Background;
	mainStage = new PIXI.Graphics();
	fields: GameField[] = [];

	ui: {
		players: PlayerUI[],
		slash: Slash
	};

	playerNames = infoProvider.getPlayerNames();
	typeBak = 0;
	currTurn = 0;
	isInvalid = false;
	
	/**
	 * 创建新的俄罗斯方块游戏实例
	 */
	constructor() {

		// 像素画风
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

		// 接下来几句话的顺序至关重要
		let options: PIXI.RendererOptions = {
			antialias: false,
			transparent: false,
			backgroundColor: Util.colors.scale(Colors.FIELD_BKG, 0.8),
			roundPixels: true
		};
		try {
			this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, options);
		} catch (ex) {
			console.log("自动检测渲染器失败：", ex);
			this.renderer = new PIXI.CanvasRenderer(window.innerWidth, window.innerHeight, options);
		}
		Assets.generateTextures(this.renderer);
		this.stageCreation();
		this.resize();
		let tl = this.uiCreation();
		window.addEventListener('resize', () => this.resize());
		$("body").append(this.canvas = this.renderer.view);
		this.prepareInteraction();

		// 开始渲染
		infoProvider.v2.setRenderTickCallback(() => this.renderer.render(this.bkg));
		if (infoProvider["dbgMode"]) {
			this.fields[1].nextBlock = Util.rand(Block.Tetromino.TYPE_COUNT);
			tl.add(this.fields[1].dropInBlock(0, 5));
			this.activeBlock = this.fields[1].currentTetromino;
			return;
		}
		infoProvider.v2.setRequestCallback(req => {
			let t: TimelineMax = parent["rootTimeline"];
			$("body").removeClass("not-player-turn");
			let cb = (rm = true) => {
				this.playerTurn = true;
				let id = infoProvider.getPlayerID();
				let f = this.fields[id];
				f.dropInBlock(0, 5, true);

				let f2 = this.fields[1 - id];
				let tl = f2.dropInBlock(0, 5, true);
				this.opponentBlock = f2.currentTetromino;
				this.opponentBlock.txtActionTaken.text = "（决策中）";
				tl.call(() =>
					this.opponentBlock.actionShown = true);
				TweenMax.fromTo(this.opponentBlock, 5, { rotation: 0 }, { rotation: Math.PI * 2, repeat: -1, ease: Linear.easeNone });

				this.typeBak = f.oppositeField.selector.selectedType;
				this.activeBlock = f.currentTetromino;
				f.currentTetromino.active = true;
				if (rm)
					t.remove(cb);
			};
			if (t.progress() == 1)
				cb(false);
			else
				t.call(cb);
			return null;
		});
		infoProvider.v2.setDisplayCallback(d => {
			if (this.isInvalid || !d)
				return null;
			if (this.activeBlock) {
				let b = this.activeBlock;
				b.field.selector.tempAlterCount(b.field.nextBlock, -1);
				b.field.oppositeField.selector.tempAlterCount(b.field.oppositeField.nextBlock, -1);
				b.field.oppositeField.selector.selectedType = this.typeBak;
				b.actionShown = false;
				TweenMax.fromTo(b, 0.3, { alpha: 1 }, { alpha: 0, onComplete: () => b.visible = false });
				TweenMax.killTweensOf(this.opponentBlock);
				this.opponentBlock.actionShown = false;
				this.opponentBlock.visible = false;
				this.activeBlock = null;
			}
			let tl = new TimelineMax();
			for (let i = 0; i < 2; i++) {
				let req: DisplayDetail = d[i.toString()];
				if (!req)
					continue;
				let f = this.fields[i];
				if (req.seq || req.route) {
					tl.add(f.dropInBlock(0, 5), 0);
					let t = f.currentTetromino;
					try {
						let r: TimelineMax;
						if (req.seq)
							r = t.playRoute(req.seq.map(n => ({
								r: GameField.FIELD_HEIGHT - n.y,
								c: n.x - 1,
								o: n.o
							})));
						else
							r = t.playRoute_new(req.route.map(n => ({
								r: GameField.FIELD_HEIGHT - n.y,
								c: n.x - 1,
								o: n.o
							})));
						tl.add(r, 0.5);
						let pos = t.calcXY(t.r, t.c);
						let hitBorder = t.findHitBorder(t.r + 1, t.c, false, pos.x, pos.y);
						tl.call(() =>
							Util.emitParticleAt(this.mainStage, hitBorder),
							null, null, 0.5 + r.duration()
						);
						let temp = t.place();
						if (temp)
							tl.add(temp);
					} catch (ex) {
						this.isInvalid = true;
						parent["Botzone"].alert(
							"第" + this.currTurn + "回合无法重现" + (i ? "蓝方：" : "红方：") + ex +
							"<br />播放已经中止，该对局可能有误，请再次进行对局或联系管理员。"
						);
					}
				}
			}
			this.currTurn++;
			tl.add(GameField.check(this.fields));
			//let r2s = function (r) {
			//	let s = "";
			//	for (let i = 0; i < 10; i++)
			//		s += !!r[i] ? "[]" : "  ";
			//	return s;
			//};
			//console.log(this.fields[0].fieldContent.map((r, i) => r2s(r) + " | " + r2s(this.fields[1].fieldContent[i])).join('\n'));
			for (let i = 0; i < 2; i++) {
				let req: PlayerResponse = d[i.toString()];
				if (!req)
					continue;
				let f = this.fields[1 - i];
				f.nextBlock = req.block;
				tl.add(Util.biDirectionConstantSet(f.selector, "selectedType", req.block), 0.5);
			}
			if ("result" in d) {
				// 游戏好像结束了
				let msg = "";
				for (let i = 0; i < 2; i++) {
					let str = i.toString();
					if (str in d.err)
						msg = (msg ? msg + "\n" : "") +
							(i ? "蓝方：" : "红方：") +
							Assets.err2chn[d.err[str]];
				}
				tl.add(this.showEnding(msg, 1 - d.result));
				snd.playSound(tl, sounds.sndVictory);
			}
			return tl;
		});
		infoProvider.v2.notifyInitComplete(tl);
	}

	resize() {
		let w: number, h: number;
		this.renderer.resize(this.bkg.width = w = window.innerWidth,
			this.bkg.height = h = window.innerHeight);
		this.scale = this.mainStage.scale.x = this.mainStage.scale.y = Math.min(w / this.pixelWidth, h / this.pixelHeight);
		this.mainStage.x = (w - this.pixelWidth * this.scale) / 2;
		this.mainStage.y = (h - this.pixelHeight * this.scale) / 2;
	}

	public activeBlock: Block.Tetromino;
	public opponentBlock: Block.Tetromino;
	playerTurn = !!infoProvider["dbgMode"];

	placeBlock() {
		if (!this.playerTurn)
			return;
		if (!this.activeBlock.check(this.activeBlock.r + 1)) {

			if (infoProvider["dbgMode"]) {
				let t = this.activeBlock.field.check();
				this.activeBlock.field.oppositeField.nextBlock = this.activeBlock.field.oppositeField.selector.selectedType;
				t.add(this.activeBlock.field.oppositeField.dropInBlock(0, 5));
				this.activeBlock = this.activeBlock.field.oppositeField.currentTetromino;
				return;
			}
			infoProvider.notifyPlayerMove({
				x: this.activeBlock.c + 1,
				y: GameField.FIELD_HEIGHT - this.activeBlock.r,
				o: this.activeBlock.orientation,
				block: this.activeBlock.field.oppositeField.selector.selectedType
			});
			this.activeBlock.active = false;
			$("body").addClass("not-player-turn");
			snd.playSoundImmediate(sounds.sndConfirm);
			this.activeBlock.actionShown = true;
			this.opponentBlock.txtActionTaken.text = "（等待中）";
			TweenMax.fromTo(this.activeBlock.txtActionTaken.scale, 0.3, { x: 3, y: 3 }, { x: 1, y: 1 });
			TweenMax.fromTo(this.activeBlock.txtActionTaken, 0.3, { alpha: 0 }, { alpha: 1 });
			this.playerTurn = false;
		}
	}

	rotate() {
		if (!this.playerTurn)
			return;
		this.activeBlock.setOrientation(this.activeBlock.orientation + 1);
		snd.playSoundImmediate(sounds.sndRotate);
	}

	tryNext() {
		if (!this.playerTurn)
			return;
		this.activeBlock.findNextBegin();
		snd.playSoundImmediate(sounds.sndRotate);
	}

	prepareInteraction() {
		$(document).keydown((ev) => {
			if (!this.playerTurn)
				return;
			let r = this.activeBlock.r, c = this.activeBlock.c;
			if (ev.keyCode == 32)
				return this.rotate();
			else if (ev.keyCode == 37)
				c--;
			else if (ev.keyCode == 38)
				r--;
			else if (ev.keyCode == 39)
				c++;
			else if (ev.keyCode == 190)
				return this.tryNext();
			else if (ev.keyCode == 40)
				r++;
			else if (ev.keyCode == 191 || ev.keyCode == 222)
				return this.activeBlock.drop();
			else if (ev.keyCode == 13)
				return this.placeBlock();
			else if (ev.keyCode >= 49 && ev.keyCode <= 55)
				return this.activeBlock.field.oppositeField.selector.selectedType = ev.keyCode - 49;
			this.activeBlock.setRC(r, c);
		});
		$(document).on("mousewheel", (ev) => {
			if (!this.playerTurn)
				return;
			this.rotate();
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		});
		$(this.canvas).contextmenu((ev) => {
			if (!this.playerTurn)
				return;
			this.placeBlock();
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		});
	}

	stageCreation() {
		this.bkg = new Background();
		this.bkg.addChild(this.mainStage);

		let activeBlockShadow = new BlockDropIndicator();

		this.pixelWidth += TetrisGame.MARGIN_LEFT_RIGHT;
		this.pixelHeight += TetrisGame.MARGIN_TOP;
		activeBlockShadow.y = this.pixelHeight;
		for (let i = 0; i < TetrisGame.PLAYER_COUNT; i++) {
			let field = new GameField(this.mainStage, activeBlockShadow, i);
			field.x = this.pixelWidth;
			field.y = this.pixelHeight;
			activeBlockShadow.height = field.height;
			this.pixelWidth += TetrisGame.MARGIN_FIELD + field.width;
			this.fields.push(this.mainStage.addChild(field));
		}
		this.mainStage.addChild(activeBlockShadow);
		this.fields[1].oppositeField = this.fields[0];
		this.fields[0].oppositeField = this.fields[1];

		this.pixelWidth += TetrisGame.MARGIN_LEFT_RIGHT - TetrisGame.MARGIN_FIELD;
		this.pixelHeight += TetrisGame.MARGIN_BOTTOM + this.fields[0].height;
	}

	uiCreation() {
		this.fields.forEach(f => f.decorate());

		let tl = new TimelineMax();
		let ui = [0, 1].map(id => new PlayerUI(id, this.playerNames[id].name, this.playerNames[id].imgid));
		this.mainStage.addChild(ui[0], ui[1]);
		tl.fromTo(ui[0], 0.5, {
			x: -PlayerUI.WIDTH, y: this.pixelHeight / 2 - 5,
		}, { x: 0, ease: Back.easeOut }, 0);
		tl.fromTo(ui[1], 0.5, {
			x: this.pixelWidth + PlayerUI.WIDTH, y: this.pixelHeight / 2 + 5,
		}, { x: this.pixelWidth, ease: Back.easeOut }, 0);
		ui.forEach(ui => ui.applyMask(this.pixelWidth, this.pixelHeight));

		let slash = new Slash();
		slash.x = this.pixelWidth / 2;
		slash.y = this.pixelHeight / 2;
		this.mainStage.addChild(slash);
		tl.fromTo(slash.scale, 0.5, {
			x: 1, y: 0
		}, { y: 1, ease: Back.easeOut }, 0.2);
		tl.to(slash, 0.3, { alpha: 0 }, 0.7);
		tl.add([
			Util.biDirectionConstantSet(slash, "visible", false),
			Util.biDirectionConstantSet(ui[0].mask, "visible", false),
			Util.biDirectionConstantSet(ui[1].mask, "visible", false),
			Util.biDirectionConstantSet(ui[0], "mask", undefined),
			Util.biDirectionConstantSet(ui[1], "mask", undefined)
		]);
		tl.add([
			TweenMax.to(ui, 0.5, { y: (TetrisGame.MARGIN_TOP - this.fields[0].selector.height) / 2 }),
			TweenMax.to(ui[0], 0.25, {
				x: -PlayerUI.WIDTH / 4, yoyo: true, repeat: 1
			}),
			TweenMax.to(ui[1], 0.25, {
				x: this.pixelWidth + PlayerUI.WIDTH / 4, yoyo: true, repeat: 1
			})
		]);
		tl.to([ui[0].scale, ui[1].scale], 0.2, { x: 1, y: 1, ease: Expo.easeIn });
		
		this.ui = {
			players: ui,
			slash
		};

		this.bkg.beginAnimation();
		return tl;
	}

	showEnding(message: string, winner: number) {
		let tl = new TimelineMax();

		let hasWinner = winner === 0 || winner === 1;
		let ending = new Ending(hasWinner, message);
		ending.x = this.pixelWidth / 2;
		ending.y = this.pixelHeight / 2;
		ending.txtReason.text = message;
		this.mainStage.addChild(ending);
		tl.fromTo(ending.scale, 0.3, { x: 0, y: 0 }, { x: 1, y: 1, ease: Back.easeOut }, 0);
		if (hasWinner) {
			let winnerUI = this.ui.players[winner];
			this.mainStage.addChild(winnerUI);
			tl.to(winnerUI.scale, 0.15, {
				x: 1.3, y: 1.3, yoyo: true, repeat: 1
			});
			tl.to(winnerUI, 0.3, {
				x: winner ? ending.x + ending.w / 2 - Ending.PADDING : ending.x - ending.w / 2 + Ending.PADDING,
				y: ending.y + ending.h / 2 - Ending.PADDING - PlayerUI.HEIGHT / 2
			}, 0.3);
		}
		return tl;
	}
}

class SoundProvider {
	_enableSound = false;

	get sound() {
		return this._enableSound;
	}

	set sound(to) {
		if (this._enableSound == to)
			return;

		if (to) {
			sounds.sndBGM.play();
			sounds.sndBGM.volume = 0.5;
			$("#btnSound").removeClass("disabled");
		} else {
			for (let id in sounds)
				sounds[id].pause();
			$("#btnSound").addClass("disabled");
		}
		localStorage.setItem("tetris-sound", to ? "true" : "false");
		this._enableSound = to;
	}

	playSoundImmediate(sound: HTMLAudioElement) {
		if (this.sound) {
			sound.currentTime = 0;
			sound.play();
		}
	}

	playSound(tl: TimelineMax, sound: HTMLAudioElement, at = "+=0") {
		tl.call(() => {
			if (this.sound) {
				sound.currentTime = 0;
				sound.play();
			}
		}, null, null, at);
	}

	constructor() {
		this.sound = localStorage.getItem("tetris-sound") === "true";
	}
}

let game: TetrisGame;
let snd: SoundProvider;
let sounds = {
	sndBGM: <HTMLAudioElement>null,
	sndImpact: <HTMLAudioElement>null,
	sndDestroy: <HTMLAudioElement>null,
	sndWarn: <HTMLAudioElement>null,
	sndRotate: <HTMLAudioElement>null,
	sndConfirm: <HTMLAudioElement>null,
	sndVictory: <HTMLAudioElement>null,
};

function init() {
	try {
		snd = new SoundProvider();
		game = new TetrisGame();
	} catch (ex) {
		parent["Botzone"].alert(
			"播放器载入失败……"
		);
		console.log("播放器初始化失败：", ex);
		infoProvider.v2.setRequestCallback(() => undefined);
		infoProvider.v2.setDisplayCallback(() => undefined);
		infoProvider.v2.notifyInitComplete();
	}
}

$(() => {
	if (!infoProvider["dbgMode"])
		infoProvider.v2.setMinSize(0, 550);
	for (var id in sounds)
		sounds[id] = document.getElementById(id);
	TweenMax.ticker.fps(25);
	WebFont.load({
		custom: {
			families: ['fzxs12'],
			testStrings: {
				'fzxs12': '蛤'
			}
		},
		inactive: init,
		active: init
	});
});
