enum Colors {
	WHITE = 0xFFFFFF,
	RED = 0xFF0000,
	BLUE = 0x0000FF,
	LIGHTGREEN = 0xBBFFBB,
	GOLD = 0xffd800,
	LIGHTBLUE = 0xbedbff,
	FIELD_BKG = 0xAAFFFF,
	YELLOW = 0xFFFF00,
	GREEN = 0x00AA33
}

namespace Assets {
	export var fontFamily = ["fzxs12", "-apple-system", "BlinkMacSystemFont", "Helvetica Neue", "Arial", "PingFang SC", "Hiragino Sans GB", "STHeiti", "Microsoft YaHei", "Microsoft JhengHei", "Source Han Sans SC", "Noto Sans CJK SC", "Source Han Sans CN", "Noto Sans SC", "Source Han Sans TC", "Noto Sans CJK TC", "WenQuanYi Micro Hei", "SimSun", "sans-serif"];

	export var err2chn = {
		"OVERFLOW": "场地已满",
		"OVERFLOW_LOWSCORE": "同时满但积分较低",
		"SEQ_TOO_LONG": "行动序列过长",
		"BLOCK_FORMAT_ERROR": "给出方块错误",
		"BLOCK_RESTRICTION_VIOLATED": "给出同类方块太多",
		"SEQ_FORMAT_ERROR": "序列格式错误",
		"BAD_SEQ": "非法序列",
		"LAST_POS_NOT_ON_GROUND": "落点不在地上",
		"NO_ROUTE": "落点不可达",
		"LAST_POS_INVALID": "落点非法",
		"LAST_POS_FORMAT_ERROR": "落点格式错误",
		"INVALID_INPUT_VERDICT_RE": "程序崩溃",
		"INVALID_INPUT_VERDICT_MLE": "程序内存爆炸",
		"INVALID_INPUT_VERDICT_TLE": "决策超时",
		"INVALID_INPUT_VERDICT_NJ": "程序输出不是JSON",
		"INVALID_INPUT_VERDICT_OLE": "程序输出爆炸",
		"INVALID_INPUT_VERDICT_OK": "程序输出格式错误"
	}

	export function generateTextures(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer) {
		Block.Component.TEXTURE = (() => {
			const g = new PIXI.Graphics();
			g.height = Block.Component.BLOCK_SIZE;
			g.width = Block.Component.BLOCK_SIZE;
			g.beginFill(0xAAAAAA);
			g.drawPolygon([0, 0, Block.Component.BLOCK_SIZE, 0, 0, Block.Component.BLOCK_SIZE]);
			g.beginFill(0xCCCCCC);
			g.drawPolygon([Block.Component.BLOCK_SIZE, Block.Component.BLOCK_SIZE,
				Block.Component.BLOCK_SIZE, 0, 0, Block.Component.BLOCK_SIZE]);
			g.beginFill(0xBBBBBB);
			g.drawRect(1, 1, Block.Component.BLOCK_SIZE - 2, Block.Component.BLOCK_SIZE - 2);
			g.endFill();
			return renderer.generateTexture(g);
		})();
		Background.TEXTURE = (() => {
			const g = new PIXI.Graphics();
			const baseColor = Util.colors.scale(Colors.FIELD_BKG, 0.8);
			const d = g.width = g.height = Background.TEXTURE_SIZE;
			for (let y = 0; y < d; y += Background.TILE_SIZE)
				for (let x = 0; x < d; x += Background.TILE_SIZE) {
					let rnd = Math.random() / 16;
					g.beginFill(Util.colors.add(baseColor, rnd, Math.floor(Math.random() * 0x1000000), 1 - rnd), 1);
					g.drawRect(x, y, Background.TILE_SIZE, Background.TILE_SIZE);
				}
			return renderer.generateTexture(g);
		})();
		WarningText.TEXTURE = (() => {
			const g = document.createElement('canvas');
			const c = g.getContext('2d');
			const d = g.width = g.height = WarningText.STRIP_WIDTH * 2;
			const pixels = c.createImageData(d, d);
			const yellow = Util.colors.extract(Colors.YELLOW), black = [0, 0, 0, 255];
			yellow.push(255);
			let i = 0;
			for (let y = 0; y < d; y++)
				for (let x = 0; x < d; x++) {
					let color: number[];
					if ((x + y) % d >= WarningText.STRIP_WIDTH)
						color = yellow;
					else
						color = black;
					pixels.data[i++] = color[0];
					pixels.data[i++] = color[1];
					pixels.data[i++] = color[2];
					pixels.data[i++] = color[3];
				}
			c.putImageData(pixels, 0, 0);
			return PIXI.Texture.fromCanvas(g);
		})();
		DUMMY_TEXTURE = (() => {
			const g = new PIXI.Graphics();
			g.height = 2;
			g.width = 2;
			g.beginFill(Colors.WHITE);
			g.drawRect(0, 0, 2, 2);
			g.endFill();
			return renderer.generateTexture(g);
		})();
	}

	export var DUMMY_TEXTURE;

	export var particleConfig = {
		"alpha": {
			"start": 1,
			"end": 0
		},
		"scale": {
			"start": 0.5,
			"end": 0.5,
			"minimumScaleMultiplier": 0.98
		},
		"color": {
			"start": "#e4f9ff",
			"end": "#ffffff"
		},
		"speed": {
			"start": 20,
			"end": 5,
			"minimumSpeedMultiplier": 1
		},
		"acceleration": {
			"x": 0,
			"y": 0
		},
		"maxSpeed": 0,
		"startRotation": {
			"min": 0,
			"max": 360
		},
		"noRotation": true,
		"rotationSpeed": {
			"min": 0,
			"max": 0
		},
		"lifetime": {
			"min": 0.2,
			"max": 0.8
		},
		"blendMode": "screen",
		"frequency": 0.001,
		"emitterLifetime": 0.1,
		"maxParticles": 20,
		"addAtBack": false,
		"spawnType": "rect",
		"pos": {
			"x": 0,
			"y": 0
		},
	};


}