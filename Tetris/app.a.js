var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var FieldProp = (function (_super) {
    __extends(FieldProp, _super);
    function FieldProp(texture) {
        var _this = _super.call(this, texture) || this;
        _this.offsetX = 0;
        _this.offsetY = 0;
        return _this;
    }
    return FieldProp;
}(PIXI.Sprite));
var Block;
(function (Block) {
    /**
     * 元素块
     */
    var Component = (function (_super) {
        __extends(Component, _super);
        function Component() {
            var _this = _super.call(this, Component.TEXTURE) || this;
            _this.height = Component.BLOCK_SIZE;
            _this.width = Component.BLOCK_SIZE;
            return _this;
        }
        Component.prototype.setRC = function (r, c, immediate) {
            if (r === void 0) { r = this.r; }
            if (c === void 0) { c = this.c; }
            if (immediate === void 0) { immediate = false; }
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
        };
        Object.defineProperty(Component.prototype, "r", {
            get: function () {
                return this._r;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "c", {
            get: function () {
                return this._c;
            },
            enumerable: true,
            configurable: true
        });
        Component.create = function (r, c, ox, oy) {
            if (!Component.store) {
                Component.store = new Array(Component.STORE_SIZE);
                for (var i = 0; i < Component.STORE_SIZE; i++)
                    Component.store[i] = new Component();
            }
            var curr = Component.store[Component.storePointer];
            Component.storePointer = (Component.storePointer + 1) % Component.STORE_SIZE;
            curr.offsetX = ox;
            curr.offsetY = oy;
            curr.visible = false;
            curr.scale.x = 1;
            curr.scale.y = 1;
            curr.setRC(r, c, true);
            return curr;
        };
        return Component;
    }(FieldProp));
    /*
     * 每个元素块边长为几个像素
     */
    Component.BLOCK_SIZE = 12;
    Component.STORE_SIZE = 600;
    Component.storePointer = 0;
    Block.Component = Component;
    ;
    /**
     * 由四个元素块组成的整体块
     */
    var Tetromino = (function (_super) {
        __extends(Tetromino, _super);
        function Tetromino(field, type) {
            var _this = _super.call(this) || this;
            _this.field = field;
            _this.type = type;
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
            _this._orientation = 0;
            _this.dragging = false;
            _this.dragBeginPos = { x: 0, y: 0, r: 0, c: 0 };
            _this._active = false;
            _this.route = [];
            _this.height = Component.BLOCK_SIZE * 5;
            _this.width = Component.BLOCK_SIZE * 5;
            _this.on('pointerdown', Tetromino.onDragStart)
                .on('pointerup', Tetromino.onDragEnd)
                .on('pointerupoutside', Tetromino.onDragEnd)
                .on('pointermove', Tetromino.onDragMove)
                .on('pointerover', Tetromino.onHover)
                .on('pointerout', Tetromino.onLeave);
            var def = Tetromino.blockDef[type][0];
            for (var i = 0; i < 4; i++)
                _this.addChild(Component.create(-def[i * 2 + 1], def[i * 2], -0.5 * Component.BLOCK_SIZE, -0.5 * Component.BLOCK_SIZE));
            return _this;
        }
        Tetromino.prototype.check = function (r, c, o) {
            if (r === void 0) { r = this.r; }
            if (c === void 0) { c = this.c; }
            if (o === void 0) { o = this.orientation; }
            var def = Tetromino.blockDef[this.type][o];
            for (var i = 0; i < 4; i++) {
                var _c = def[i * 2] + c, _r = -def[i * 2 + 1] + r;
                if (_r < 0 || _r >= GameField.FIELD_HEIGHT ||
                    _c < 0 || _c >= GameField.FIELD_WIDTH ||
                    this.field.fieldContent[_r][_c])
                    return false;
            }
            return true;
        };
        Tetromino.prototype.checkDirectDropTo = function (r, c, o, fromR) {
            if (fromR === void 0) { fromR = 0; }
            var def = Tetromino.blockDef[this.type][o];
            for (; r >= fromR; r--)
                for (var i = 0; i < 4; i++) {
                    var _c = def[i * 2] + c, _r = -def[i * 2 + 1] + r;
                    if (_r < 0)
                        continue;
                    if (_r >= GameField.FIELD_HEIGHT ||
                        _c < 0 || _c >= GameField.FIELD_WIDTH ||
                        this.field.fieldContent[_r][_c]) {
                        return false;
                    }
                }
            return true;
        };
        Tetromino.prototype.drop = function () {
            var _this = this;
            var r = this.r, c = this.c;
            while (this.check(r, c) && r < GameField.FIELD_HEIGHT)
                r++;
            r--;
            if (r == this.r)
                return null;
            if (r > this.r + 1)
                for (var _r = this.r + 1; _r < r; _r++)
                    this.route.push({ r: _r, c: c, o: this.orientation });
            return this.setRC(r, c, false, Expo.easeIn).eventCallback("onComplete", function () {
                Util.emitParticleAt(_this.parent, _this.findHitBorder(r + 1, c));
            });
        };
        Tetromino.prototype.findHitBorder = function (r, c) {
            // 找出以rc为目标的撞击边缘矩形
            var dr = Util.sign(r - this.r), dc = Util.sign(c - this.c);
            var s = this.field.stage;
            if (!TweenMax.isTweening(s))
                TweenMax.to(s, 0.05, { x: s.x + dc, y: s.y + dr, repeat: 1, yoyo: true });
            var def = Tetromino.blockDef[this.type][this.orientation];
            var maxR = -1, maxC = -1, maxs = { minR: 0, maxR: 0, minC: 0, maxC: 0 };
            for (var i = 0; i < 4; i++) {
                var _c = def[i * 2], _r = -def[i * 2 + 1];
                if (dc && _c * dc > maxC ||
                    dr && _r * dr > maxR) {
                    maxC = _c * dc;
                    maxR = _r * dr;
                    maxs = { minR: _r, maxR: _r, minC: _c, maxC: _c };
                }
                else if (dc && _c * dc == maxC ||
                    dr && _r * dr == maxR) {
                    maxs.minR = Math.min(maxs.minR, _r);
                    maxs.maxR = Math.max(maxs.maxR, _r);
                    maxs.minC = Math.min(maxs.minC, _c);
                    maxs.maxC = Math.max(maxs.maxC, _c);
                }
            }
            var x, y, w = (maxs.maxC - maxs.minC) * Component.BLOCK_SIZE, h = (maxs.maxR - maxs.minR) * Component.BLOCK_SIZE;
            if (dc) {
                h += Component.BLOCK_SIZE;
                y = this.y + (maxs.minR - 1 / 2) * Component.BLOCK_SIZE;
            }
            else
                y = this.y + (dr / 2 + maxs.maxR) * Component.BLOCK_SIZE;
            if (dr) {
                w += Component.BLOCK_SIZE;
                x = this.x + (maxs.minC - 1 / 2) * Component.BLOCK_SIZE;
            }
            else
                x = this.x + (dc / 2 + maxs.maxC) * Component.BLOCK_SIZE;
            return { x: x, y: y, w: w, h: h };
        };
        Tetromino.prototype.updateShadow = function (immediate) {
            if (immediate === void 0) { immediate = false; }
            if (!this._active)
                return;
            var def = Tetromino.blockDef[this.type][this.orientation];
            var lm = 4, rm = -4;
            for (var i = 0; i < 4; i++) {
                var _c = def[i * 2];
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
        };
        Tetromino.prototype.recordKeyNode = function () {
            var r = this.r, c = this.c;
            // 记录路径
            var last = this.route[this.route.length - 1];
            if (r < last.r) {
                // 仅保留小于当前r的路径
                var i = void 0;
                for (i = this.route.length - 1; i >= 0; i--)
                    if (this.route[i].r < r) {
                        this.route.splice(i + 1, this.route.length - i - 1);
                        break;
                    }
                if (i < 0)
                    this.route = [{ r: r, c: c, o: this.orientation }];
                else
                    this.route.push({ r: r, c: c, o: this.orientation });
            }
            else if (r != last.r)
                this.route.push({ r: r, c: c, o: this.orientation });
            else {
                last.r = r;
                last.c = c;
                last.o = this.orientation;
            }
        };
        Tetromino.prototype.setRC = function (r, c, immediate, ease) {
            if (r === void 0) { r = this.r; }
            if (c === void 0) { c = this.c; }
            if (immediate === void 0) { immediate = false; }
            if (ease === void 0) { ease = Quad.easeOut; }
            if (!this.check(r, c)) {
                Util.emitParticleAt(this.parent, this.findHitBorder(r, c));
                return null;
            }
            this._r = r;
            this._c = c;
            if (this._active)
                this.recordKeyNode();
            this.updateShadow(immediate);
            if (immediate) {
                this.x = c * Component.BLOCK_SIZE + Component.BLOCK_SIZE / 2 + this.offsetX;
                this.y = r * Component.BLOCK_SIZE + Component.BLOCK_SIZE / 2 + this.offsetY;
                return false;
            }
            return TweenMax.to(this, 0.3, {
                x: c * Component.BLOCK_SIZE + Component.BLOCK_SIZE / 2 + this.offsetX,
                y: r * Component.BLOCK_SIZE + Component.BLOCK_SIZE / 2 + this.offsetY,
                ease: ease
            });
        };
        Tetromino.prototype.findHorizontalRouteTo = function (route, r, fromC, fromO, toC, toO) {
            if (!this.check(r, fromC, fromO))
                return false;
            if (fromC == toC)
                return fromO == toO;
            var dc = Util.sign(toC - fromC); // 已经保证不是0了
            // 直接移动？
            route.push({ r: r, c: fromC, o: fromO });
            if (this.findHorizontalRouteTo(route, r, fromC + dc, fromO, toC, toO))
                return true;
            // 或者先原地旋转再移动
            var node = { r: r, c: fromC, o: fromO };
            route.push(node);
            for (var i = 1; i < 4; i++) {
                var o = node.o = (fromO + i) % 4;
                if (this.check(r, fromC, o)) {
                    if (this.findHorizontalRouteTo(route, r, fromC + dc, o, toC, toO))
                        return true;
                }
                else
                    break;
            }
            route.pop();
            route.pop();
            return false;
        };
        Tetromino.prototype.findRouteToNode = function (node) {
            if (this.r != node.r - 1)
                throw "路径非法";
            var dc = Util.sign(node.c - this.c);
            var upperR = this.r, lowerR = node.r;
            // 枚举拐点
            for (var turningPoint = this.c;; turningPoint += dc) {
                // 枚举拐点处的朝向
                for (var o = 0; o < 4; o++) {
                    // 先检查是否可能
                    if (!this.check(upperR, turningPoint, o) ||
                        !this.check(lowerR, turningPoint, o))
                        continue;
                    // 再分别检查靠上一段和靠下一段
                    var route = [];
                    if (this.findHorizontalRouteTo(route, upperR, this.c, this.orientation, turningPoint, o) &&
                        this.findHorizontalRouteTo(route, lowerR, turningPoint, o, node.c, node.o))
                        return route;
                }
                if (turningPoint == node.c)
                    break;
            }
            throw "找不到合适路径";
        };
        Tetromino.prototype.playRoute = function () {
            this.simpifyRoute();
            this.active = false;
            // 这里重演了一遍 Judge 的逻辑……
            var route = this.route;
            // 首先确保所有坐标没有越界
            if (!route.every(function (obj) {
                return obj.r >= 0 && obj.r < GameField.FIELD_HEIGHT &&
                    obj.c >= 0 && obj.c < GameField.FIELD_WIDTH &&
                    obj.o >= 0 && obj.o < Tetromino.ORIENTATION_COUNT;
            }))
                throw "路径坐标越界";
            var initial = route[0];
            this._c = initial.c;
            // 找起点
            for (this._r = 0; !this.checkDirectDropTo(this.r, this.c, initial.o) || !this.check(this._r, this.c, initial.o); this._r++)
                if (this._r > initial.r)
                    throw "无法找到路径起点";
            // 开始画路径
            var tl = new TimelineMax();
            tl.add(this.setOrientation(initial.o));
            this.setRC(undefined, undefined, true);
            for (var _i = 0, route_1 = route; _i < route_1.length; _i++) {
                var node = route_1[_i];
                if (node.c == this.c && node.o == this.orientation &&
                    this.checkDirectDropTo(node.r, node.c, node.o, this.r))
                    tl.add(this.setRC(node.r, node.c));
                else {
                    var p = this.findRouteToNode(node);
                    p.push(node);
                    for (var i = 1; i < p.length; i++) {
                        var from = p[i - 1], to = p[i];
                        if (from.o == to.o)
                            tl.add(this.setRC(to.r, to.c));
                        else
                            tl.add(this.setOrientation(to.o));
                    }
                }
            }
            return tl;
        };
        Tetromino.prototype.simpifyRoute = function () {
            // 进行一下简单压缩（检查有没有能直接掉落到的结点）
            for (var i = this.route.length - 1; i >= 0; i--) {
                var item = this.route[i];
                if (this.checkDirectDropTo(item.r, item.c, item.o)) {
                    this.route.splice(0, i);
                    break;
                }
            }
            var last = this.route[1];
            for (var i = 2; i < this.route.length; i++) {
                var item = this.route[i];
                if (item.c == last.c && item.o == last.o) {
                    // 仅在 A、B、C除了r都一样的时候，删掉B
                    if (this.route[i - 1] != last) {
                        this.route.splice(i - 1, 1);
                        i--;
                    }
                }
                else
                    last = item;
            }
        };
        Tetromino.prototype.place = function () {
            if (this.check(this.r + 1))
                return null; // 如果还能往下走就不能放置
            this.recordKeyNode(); // 最后一步一定要记得记录
            this.simpifyRoute();
            // 由于 addChild 会对 this.children 造成影响，因此需要复制
            var tl = new TimelineMax();
            tl.add(Util.biDirectionConstantSet(this, "visible", false));
            var def = Tetromino.blockDef[this.type][this.orientation];
            this.field.lastTetrominoComponents = [];
            for (var i = 0; i < 4; i++) {
                var child = Component.create(this.r - def[i * 2 + 1], this.c + def[i * 2], 0, 0);
                child.tint = Colors.WHITE;
                tl.add(Util.biDirectionConstantSet(child, "visible", true), 0);
                this.field.addChild(this.field.fieldContent[child.r][child.c] = child);
                this.field.lastTetrominoComponents.push(child);
            }
            return tl;
        };
        Tetromino.prototype.setOrientation = function (to, immediate) {
            if (immediate === void 0) { immediate = false; }
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
            var t = TweenMax.fromTo(this, 0.3, { rotation: -this._orientation * Math.PI / 2 }, { rotation: -to * Math.PI / 2, immediateRender: false });
            this._orientation = to;
            this.updateShadow();
            return t;
        };
        Object.defineProperty(Tetromino.prototype, "orientation", {
            get: function () {
                return this._orientation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tetromino.prototype, "r", {
            get: function () {
                return this._r;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tetromino.prototype, "c", {
            get: function () {
                return this._c;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tetromino.prototype, "active", {
            get: function () {
                return this._active;
            },
            set: function (to) {
                if (this._active == to)
                    return;
                this.interactive = to;
                this.buttonMode = to;
                this.field.activeBlockShadow.visible = to;
                this._active = to;
                if (to) {
                    this.updateShadow(true);
                    this.filters = [Tetromino.OUTLINE_FILTER];
                }
                else
                    this.filters = null;
            },
            enumerable: true,
            configurable: true
        });
        Tetromino.prototype.findBegin = function (_r, _c) {
            this.route = [{ r: _r, c: _c, o: 0 }];
            if (this.setRC(_r, _c, true) !== false) {
                // 在同一行寻找一个合适的起点
                outer: for (; _r < GameField.FIELD_HEIGHT; _r++)
                    for (var dc = 0; dc < GameField.FIELD_WIDTH; dc++)
                        for (var o = 0; o < 4; o++) {
                            var c = (dc + _c) % GameField.FIELD_WIDTH;
                            this._orientation = o;
                            if (this.setRC(_r, c, true) === false && this.checkDirectDropTo(_r, c, o)) {
                                this.route = [{ r: this.r, c: this.c, o: this.orientation }];
                                break outer;
                            }
                        }
                if (_r == GameField.FIELD_HEIGHT)
                    throw "已经无处可下";
            }
            this.setOrientation(this._orientation, true);
        };
        return Tetromino;
    }(FieldProp));
    Tetromino.TYPE_COUNT = 7;
    Tetromino.ORIENTATION_COUNT = 4;
    Tetromino.OUTLINE_FILTER = new PIXI.filters.OutlineFilter(1, 0xFFFFFF);
    Tetromino.OUTLINE_HOVER_FILTER = new PIXI.filters.OutlineFilter(2, 0xCE00CE);
    Tetromino.blockDef = [
        [[0, 0, 1, 0, -1, 0, -1, -1], [0, 0, 0, 1, 0, -1, 1, -1], [0, 0, -1, 0, 1, 0, 1, 1], [0, 0, 0, -1, 0, 1, -1, 1]],
        [[0, 0, -1, 0, 1, 0, 1, -1], [0, 0, 0, -1, 0, 1, 1, 1], [0, 0, 1, 0, -1, 0, -1, 1], [0, 0, 0, 1, 0, -1, -1, -1]],
        [[0, 0, 1, 0, 0, -1, -1, -1], [0, 0, 0, 1, 1, 0, 1, -1], [0, 0, -1, 0, 0, 1, 1, 1], [0, 0, 0, -1, -1, 0, -1, 1]],
        [[0, 0, -1, 0, 0, -1, 1, -1], [0, 0, 0, -1, 1, 0, 1, 1], [0, 0, 1, 0, 0, 1, -1, 1], [0, 0, 0, 1, -1, 0, -1, -1]],
        [[0, 0, -1, 0, 0, 1, 1, 0], [0, 0, 0, -1, -1, 0, 0, 1], [0, 0, 1, 0, 0, -1, -1, 0], [0, 0, 0, 1, 1, 0, 0, -1]],
        [[0, 0, 0, -1, 0, 1, 0, 2], [0, 0, 1, 0, -1, 0, -2, 0], [0, 0, 0, 1, 0, -1, 0, -2], [0, 0, -1, 0, 1, 0, 2, 0]],
        [[0, 0, 0, 1, -1, 0, -1, 1], [0, 0, -1, 0, 0, -1, -1, -1], [0, 0, 0, -1, 1, -0, 1, -1], [0, 0, 1, 0, 0, 1, 1, 1]]
    ];
    Tetromino.onHover = function () {
        if (!this._active)
            return;
        this.filters = [Tetromino.OUTLINE_HOVER_FILTER];
    };
    Tetromino.onLeave = function () {
        if (!this._active)
            return;
        this.filters = [Tetromino.OUTLINE_FILTER];
    };
    Tetromino.onDragStart = function (event) {
        if (!this._active)
            return;
        this.alpha = 0.8;
        this.dragging = true;
        this.dragData = event.data;
        var _a = event.data.getLocalPosition(this.parent), x = _a.x, y = _a.y;
        this.dragBeginPos = {
            x: x, y: y, r: this.r, c: this.c
        };
    };
    Tetromino.onDragEnd = function () {
        if (!this._active)
            return;
        if (this.r == this.dragBeginPos.r && this.c == this.dragBeginPos.c)
            this.drop();
        this.alpha = 1;
        this.dragging = false;
        this.dragData = null;
        this.filters = [Tetromino.OUTLINE_FILTER];
    };
    Tetromino.onDragMove = function () {
        if (!this._active)
            return;
        if (this.dragging) {
            var newPosition = this.dragData.getLocalPosition(this.parent);
            var r = this.dragBeginPos.r + Math.round((newPosition.y - this.dragBeginPos.y) / Component.BLOCK_SIZE);
            var c = this.dragBeginPos.c + Math.round((newPosition.x - this.dragBeginPos.x) / Component.BLOCK_SIZE);
            if (r == this.r && c == this.c)
                return;
            // 先检查是不是可以直接掉到这个位置
            if (this.checkDirectDropTo(r, c, this.orientation)) {
                this.setRC(r, c, true);
                this.route = [{ r: r, c: c, o: this.orientation }];
                return;
            }
            // 必须要一步一步模拟，避免穿墙
            var dr = r > this.r ? 1 : -1, dc = c > this.c ? 1 : -1;
            for (var or = this.r; or != r; or += dr)
                if (this.setRC(or, this.c, true) === null)
                    return;
            for (var oc = this.c; oc != c; oc += dc)
                if (this.setRC(this.r, oc, true) === null)
                    return;
        }
    };
    Block.Tetromino = Tetromino;
})(Block || (Block = {}));
var Colors;
(function (Colors) {
    Colors[Colors["WHITE"] = 16777215] = "WHITE";
    Colors[Colors["RED"] = 16711680] = "RED";
    Colors[Colors["BLUE"] = 255] = "BLUE";
    Colors[Colors["LIGHTGREEN"] = 12320699] = "LIGHTGREEN";
    Colors[Colors["GOLD"] = 16766976] = "GOLD";
    Colors[Colors["LIGHTBLUE"] = 12508159] = "LIGHTBLUE";
    Colors[Colors["FIELD_BKG"] = 11206655] = "FIELD_BKG";
    Colors[Colors["YELLOW"] = 16776960] = "YELLOW";
    Colors[Colors["GREEN"] = 43571] = "GREEN";
})(Colors || (Colors = {}));
var Assets;
(function (Assets) {
    Assets.err2chn = {
        "OVERFLOW": "场地已满",
        "SEQ_TOO_LONG": "行动序列过长",
        "BLOCK_FORMAT_ERROR": "给出方块错误",
        "BLOCK_RESTRICTION_VIOLATED": "给出同类方块太多",
        "SEQ_FORMAT_ERROR": "序列格式错误",
        "BAD_SEQ": "非法序列",
        "INVALID_INPUT_VERDICT_RE": "程序崩溃",
        "INVALID_INPUT_VERDICT_MLE": "程序内存爆炸",
        "INVALID_INPUT_VERDICT_TLE": "决策超时",
        "INVALID_INPUT_VERDICT_NJ": "程序输出不是JSON",
        "INVALID_INPUT_VERDICT_OLE": "程序输出爆炸",
        "INVALID_INPUT_VERDICT_OK": "程序输出格式错误"
    };
    function generateTextures(renderer) {
        Block.Component.TEXTURE = (function () {
            var g = new PIXI.Graphics();
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
        Background.TEXTURE = (function () {
            var g = new PIXI.Graphics();
            var baseColor = Util.colors.scale(Colors.FIELD_BKG, 0.8);
            var d = g.width = g.height = Background.TEXTURE_SIZE;
            for (var y = 0; y < d; y += Background.TILE_SIZE)
                for (var x = 0; x < d; x += Background.TILE_SIZE) {
                    var rnd = Math.random() / 16;
                    g.beginFill(Util.colors.add(baseColor, rnd, Math.floor(Math.random() * 0x1000000), 1 - rnd), 1);
                    g.drawRect(x, y, Background.TILE_SIZE, Background.TILE_SIZE);
                }
            return renderer.generateTexture(g);
        })();
        WarningText.TEXTURE = (function () {
            var g = document.createElement('canvas');
            var c = g.getContext('2d');
            var d = g.width = g.height = WarningText.STRIP_WIDTH * 2;
            var pixels = c.createImageData(d, d);
            var yellow = Util.colors.extract(Colors.YELLOW), black = [0, 0, 0, 255];
            yellow.push(255);
            var i = 0;
            for (var y = 0; y < d; y++)
                for (var x = 0; x < d; x++) {
                    var color = void 0;
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
        Assets.DUMMY_TEXTURE = (function () {
            var g = new PIXI.Graphics();
            g.height = 2;
            g.width = 2;
            g.beginFill(Colors.WHITE);
            g.drawRect(0, 0, 2, 2);
            g.endFill();
            return renderer.generateTexture(g);
        })();
    }
    Assets.generateTextures = generateTextures;
    Assets.particleConfig = {
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
})(Assets || (Assets = {}));
var Util;
(function (Util) {
    var colors;
    (function (colors) {
        function extract(color) {
            return [(color & 0xff0000) >> 16, (color & 0x00ff00) >> 8, color & 0x0000ff];
        }
        colors.extract = extract;
        function add(color, degree2, color2, degree1) {
            if (color2 === void 0) { color2 = Colors.WHITE; }
            if (degree1 === void 0) { degree1 = 1; }
            var c2 = extract(color2);
            return extract(color)
                .map(function (comp, i) { return Math.min(Math.round(comp * degree1 + degree2 * c2[i]), 255); })
                .reduce(function (sum, val, i) { return (sum << 8) | val; });
        }
        colors.add = add;
        function scale(color, scale) {
            return [(color & 0xff0000) >> 16, (color & 0x00ff00) >> 8, color & 0x0000ff]
                .map(function (comp) { return Math.min(Math.round(comp * scale), 255); })
                .reduce(function (sum, val, i) { return (sum << 8) | val; });
        }
        colors.scale = scale;
    })(colors = Util.colors || (Util.colors = {}));
    function sign(x) {
        return x > 0 ? 1 : x < 0 ? -1 : 0;
    }
    Util.sign = sign;
    var emitter;
    function emitParticleAt(container, rect) {
        var config = JSON.parse(JSON.stringify(Assets.particleConfig));
        config.spawnRect = rect;
        config.maxParticles = (rect.w + rect.h) * 20 / Block.Component.BLOCK_SIZE;
        emitter = new PIXI.particles.Emitter(container, Assets.DUMMY_TEXTURE, config);
        emitter.playOnceAndDestroy();
    }
    Util.emitParticleAt = emitParticleAt;
    function rand(upper) {
        return Math.floor(Math.random() * upper);
    }
    Util.rand = rand;
    function createAt(ctor, x, y, w, h) {
        var args = [];
        for (var _i = 5; _i < arguments.length; _i++) {
            args[_i - 5] = arguments[_i];
        }
        var obj = new (ctor.bind.apply(ctor, [void 0].concat(args)))();
        obj.x = x;
        obj.y = y;
        obj.width = w;
        obj.height = h;
        return obj;
    }
    Util.createAt = createAt;
    function biDirectionConstantSet(obj, propName, to) {
        var initial;
        if (Array.isArray(obj))
            return TweenMax.to({}, 0.001, {
                immediateRender: false,
                onComplete: function () {
                    initial = obj[0] && obj[0][propName];
                    if (to instanceof Function)
                        to = to();
                    obj.forEach(function (o) { return o[propName] = to; });
                },
                onReverseComplete: function () {
                    return obj.forEach(function (o) { return o[propName] = initial; });
                }
            });
        else
            return TweenMax.to({}, 0.001, {
                immediateRender: false,
                onComplete: function () {
                    initial = obj[propName];
                    if (to instanceof Function)
                        obj[propName] = to();
                    else
                        obj[propName] = to;
                },
                onReverseComplete: function () {
                    return obj[propName] = initial;
                }
            });
    }
    Util.biDirectionConstantSet = biDirectionConstantSet;
})(Util || (Util = {}));
var Block;
(function (Block) {
    var Logic = (function (_super) {
        __extends(Logic, _super);
        function Logic() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Logic.prototype.findHorizontalRouteTo2 = function (r, fromC, fromO, toC, toO) {
            if (!this.check(r, fromC, fromO))
                return false;
            if (fromC == toC)
                return fromO == toO;
            var dc = Util.sign(toC - fromC); // 已经保证不是0了
            // 直接移动？
            if (this.findHorizontalRouteTo2(r, fromC + dc, fromO, toC, toO))
                return true;
            // 或者先原地旋转再移动
            for (var i = 1; i < 4; i++) {
                var o = (fromO - i + 4) % 4;
                if (this.check(r, fromC, o)) {
                    if (this.findHorizontalRouteTo2(r, fromC + dc, o, toC, toO))
                        return true;
                }
                else
                    return false;
            }
            return false;
        };
        Logic.prototype.findRouteToNode2 = function (node) {
            if (this.r != node.r - 1)
                return false;
            var dc = Util.sign(node.c - this.c);
            var upperR = this.r, lowerR = node.r;
            // 枚举拐点
            for (var turningPoint = this.c;; turningPoint += dc) {
                // 枚举拐点处的朝向
                for (var o = 0; o < 4; o++) {
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
        };
        return Logic;
    }(Block.Tetromino));
})(Block || (Block = {}));
var FieldBorder = (function (_super) {
    __extends(FieldBorder, _super);
    function FieldBorder(field) {
        var _this = _super.call(this) || this;
        _this.field = field;
        _this.x = field.x - FieldBorder.THICKNESS;
        _this.y = field.y - FieldBorder.THICKNESS - field.selector.height;
        var h = _this.height = field.height + field.selector.height + FieldBorder.THICKNESS * 2;
        var w = _this.width = field.width + FieldBorder.THICKNESS * 2;
        _this.lineStyle(FieldBorder.THICKNESS, 0);
        _this.drawRect(0, 0, w, h);
        return _this;
    }
    return FieldBorder;
}(PIXI.Graphics));
FieldBorder.THICKNESS = 2;
var FieldIndicator = (function (_super) {
    __extends(FieldIndicator, _super);
    function FieldIndicator(field) {
        var _this = _super.call(this) || this;
        _this.field = field;
        _this._value = 0;
        _this.txtHeight = new PIXI.Text("0", {
            fontFamily: ["fzxs12", "STSong"],
            fontSize: FieldIndicator.FONT_SIZE,
            fontWeight: "bold",
            fill: "black",
            padding: 4
        });
        _this.txtHeight.resolution = 2;
        var w = _this.width = TetrisGame.MARGIN_LEFT_RIGHT;
        var h = _this.height = FieldIndicator.FONT_SIZE;
        _this.addChild(_this.txtHeight);
        _this.lineStyle(FieldIndicator.THICKNESS, 0);
        if (field.side == 0) {
            _this.txtHeight.anchor.set(1, 0.5);
            _this.txtHeight.x = w - FieldIndicator.LENGTH - FieldIndicator.MARGIN;
            _this.txtHeight.y = h / 2;
            _this.moveTo(w, h / 2);
            _this.lineTo(w - FieldIndicator.LENGTH, h / 2);
            _this.pivot.x = w;
            _this.pivot.y = h / 2;
            _this.x = field.x;
        }
        else {
            _this.txtHeight.anchor.set(0, 0.5);
            _this.txtHeight.x = FieldIndicator.LENGTH + FieldIndicator.MARGIN;
            _this.txtHeight.y = h / 2;
            _this.moveTo(0, h / 2);
            _this.lineTo(FieldIndicator.LENGTH, h / 2);
            _this.pivot.x = 0;
            _this.pivot.y = h / 2;
            _this.x = field.x + field.width;
        }
        _this.txtHeight.scale.x = _this.txtHeight.scale.y = 0.5;
        _this.y = field.y + Block.Component.BLOCK_SIZE * GameField.FIELD_HEIGHT;
        return _this;
    }
    Object.defineProperty(FieldIndicator.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (to) {
            if (this._value == to)
                return;
            TweenMax.to(this, 0.2, {
                y: Block.Component.BLOCK_SIZE * (GameField.FIELD_HEIGHT - to) + this.field.y
            });
            this.txtHeight.text = to.toString();
            this._value = to;
        },
        enumerable: true,
        configurable: true
    });
    return FieldIndicator;
}(PIXI.Graphics));
FieldIndicator.THICKNESS = 2;
// static readonly WIDTH = TetrisGame.MARGIN_LEFT_RIGHT;
FieldIndicator.LENGTH = 5;
FieldIndicator.MARGIN = 2;
FieldIndicator.FONT_SIZE = 24;
var GameField = (function (_super) {
    __extends(GameField, _super);
    function GameField(stage, activeBlockShadow, side) {
        var _this = _super.call(this) || this;
        _this.stage = stage;
        _this.activeBlockShadow = activeBlockShadow;
        _this.side = side;
        // 左上为原点
        _this.tetrominos = new Array(Block.Tetromino.TYPE_COUNT);
        _this.fieldContent = new Array(GameField.FIELD_HEIGHT);
        _this._warningShown = false;
        for (var r = 0; r < GameField.FIELD_HEIGHT; r++)
            _this.fieldContent[r] = new Array(GameField.FIELD_WIDTH);
        for (var t = 0; t < Block.Tetromino.TYPE_COUNT; t++)
            _this.tetrominos[t] = new Block.Tetromino(_this, t);
        var w = _this.width = GameField.FIELD_WIDTH * Block.Component.BLOCK_SIZE;
        var h = _this.height = GameField.FIELD_HEIGHT * Block.Component.BLOCK_SIZE;
        for (var y = 0; y < h; y += Block.Component.BLOCK_SIZE)
            for (var x = 0; x < w; x += Block.Component.BLOCK_SIZE) {
                var rnd = Math.random() / 16;
                _this.beginFill(Util.colors.add(Colors.FIELD_BKG, rnd, PlayerUI.COLORS[side], 1 - rnd), 1);
                _this.drawRect(x, y, Block.Component.BLOCK_SIZE, Block.Component.BLOCK_SIZE);
            }
        return _this;
    }
    GameField.prototype.decorate = function () {
        this.parent.addChild(this.selector = new TetrominoSelector(this), this.border = new FieldBorder(this), this.indicator = new FieldIndicator(this), this.warningText = new WarningText(this));
        this.selector.putChildOnStage();
        this.warningText.beginAnimation();
    };
    GameField.prototype.lift = function (row, target) {
        var _this = this;
        var tl = new TimelineMax();
        var hasBlock = false;
        for (var _i = 0, _a = this.fieldContent[row]; _i < _a.length; _i++) {
            var c = _a[_i];
            if (c) {
                tl.add(c.setRC(target), 0);
                hasBlock = true;
            }
        }
        if (hasBlock && row != target)
            tl.call(function () { return _this.emitParticlesOnRowBottom(target); });
        return tl;
    };
    GameField.prototype.emitParticlesOnRowBottom = function (row) {
        var y = this.y + (row + 1) * Block.Component.BLOCK_SIZE, w = GameField.FIELD_WIDTH * Block.Component.BLOCK_SIZE;
        Util.emitParticleAt(this.parent, {
            x: this.x,
            y: y, w: w, h: 0
        });
    };
    GameField.prototype.check = function () {
        return GameField.check([this, this.oppositeField]);
    };
    GameField.check = function (fields) {
        // 检查双方在此状态下是否能够消去块，并进行消去逻辑
        var tl = new TimelineMax();
        var exchangeRows = [[], []];
        var rowMappings = [[], []]; // 映射，如果是undefined则表示是被消去的行
        // 第一遍：记录满行，并求出消除满行后堆叠起来的行的映射
        for (var id = 0; id < 2; id++) {
            var field = fields[id];
            var exRows = exchangeRows[id], mappings = rowMappings[id];
            for (var i = GameField.FIELD_HEIGHT - 1; i >= 0; i--) {
                var j = void 0;
                for (j = GameField.FIELD_WIDTH - 1; j >= 0; j--)
                    if (!field.fieldContent[i][j])
                        break;
                if (j < 0) {
                    // 抠掉最后一块（注意一定要在下面循环之前）
                    for (var _i = 0, _a = field.lastTetrominoComponents; _i < _a.length; _i++) {
                        var c = _a[_i];
                        if (c.r == i) {
                            tl.to(c.scale, 0.3, { x: 0, y: 0 }, 0);
                            tl.add(Util.biDirectionConstantSet(c, "visible", false), 0.3);
                            field.fieldContent[c.r][c.c] = undefined;
                        }
                    }
                    exRows.push(field.fieldContent[i]);
                }
                else
                    mappings[i] = i + exRows.length;
            }
        }
        // 如果发生了任何消除：
        if (exchangeRows[0].length + exchangeRows[1].length != 0) {
            // 第二遍：交换到对方侧，拱起来对方所有行，给行映射增加偏移
            for (var id = 0; id < 2; id++) {
                var opponentClearCount = exchangeRows[1 - id].length;
                if (opponentClearCount == 0)
                    continue;
                var mappings = rowMappings[id];
                for (var i = 0; i < mappings.length; i++) {
                    if (mappings[i] !== undefined)
                        mappings[i] -= opponentClearCount;
                }
            }
            // 第三遍：让所有行到正确位置
            for (var id = 0; id < 2; id++) {
                var field = fields[id];
                var mappings = rowMappings[id], lastMappingOffset = 0;
                var newField = new Array(GameField.FIELD_HEIGHT);
                for (var i = 0; i < field.fieldContent.length; i++) {
                    var row = field.fieldContent[i];
                    var to = mappings[i];
                    if (to !== undefined) {
                        // 移动的行
                        tl.add(field.lift(i, to), 0.3);
                        newField[to] = row;
                    }
                }
                var opponentClearRows = exchangeRows[1 - id];
                var compCount = 0;
                if (opponentClearRows.length != 0)
                    for (var i = 0; i < opponentClearRows.length; i++) {
                        var row = opponentClearRows[i];
                        var to = GameField.FIELD_HEIGHT - opponentClearRows.length + i;
                        // 对方插进来的行
                        for (var _b = 0, row_1 = row; _b < row_1.length; _b++) {
                            var c = row_1[_b];
                            if (c) {
                                c.offsetX = field.x;
                                c.offsetY = field.y;
                                tl.add(c.setRC(to), 0.3);
                                tl.to(c, 0.2, {
                                    colorProps: { tint: Colors.GOLD, format: "number" },
                                    ease: Expo.easeOut
                                }, 0.01 * compCount++);
                            }
                        }
                        newField[to] = opponentClearRows[i];
                    }
                for (var i = 0; i < GameField.FIELD_HEIGHT; i++)
                    if (!newField[i])
                        newField[i] = new Array(GameField.FIELD_WIDTH);
                field.fieldContent = newField;
            }
        }
        var _loop_1 = function (id) {
            var field = fields[id];
            var h = field.blockHeight;
            tl.add(Util.biDirectionConstantSet(field.indicator, "value", h));
            if (h < GameField.WARNING_THRESHOLD)
                field._warningShown = false;
            else if (!field._warningShown) {
                tl.call(function () {
                    field.warningText.parent.addChild(field.warningText); // 放到最前面
                    new TimelineMax()
                        .add(Util.biDirectionConstantSet(field.warningText, "visible", true))
                        .fromTo(field.warningText, 0.5, { alpha: 0 }, { alpha: 1 })
                        .to(field.warningText, 0.5, { alpha: 0 }, 1)
                        .add(Util.biDirectionConstantSet(field.warningText, "visible", false));
                });
                field._warningShown = true;
            }
        };
        // 最后，更新高度指示器，并显示警告
        for (var id = 0; id < 2; id++) {
            _loop_1(id);
        }
        return tl;
    };
    Object.defineProperty(GameField.prototype, "blockHeight", {
        get: function () {
            for (var i = 0; i < GameField.FIELD_HEIGHT; i++)
                for (var j = GameField.FIELD_WIDTH - 1; j >= 0; j--)
                    if (this.fieldContent[i][j]) {
                        return GameField.FIELD_HEIGHT - i;
                    }
            return 0;
        },
        enumerable: true,
        configurable: true
    });
    GameField.prototype.dbg = function () {
        game.activeBlock.playRoute().call(function () { return game.activeBlock.active = true; });
    };
    GameField.prototype.addChild = function (child, immediate) {
        if (immediate === void 0) { immediate = true; }
        child.offsetX = this.x;
        child.offsetY = this.y;
        return child.setRC(undefined, undefined, immediate) || this.stage.addChild(child);
    };
    GameField.prototype.removeChild = function (child) {
        return this.stage.removeChild(child);
    };
    GameField.prototype.dropInBlock = function (r, c) {
        var type = this.nextBlock;
        this.selector.addCount(type);
        var tl = new TimelineMax();
        var b = this.tetrominos[type];
        b.x = b.y = 0;
        b.findBegin(r, c);
        this.addChild(b);
        tl.add(Util.biDirectionConstantSet(b, "visible", true), 0);
        tl.add(Util.biDirectionConstantSet(b.children, "visible", true), 0);
        tl.staggerTo(b.children, 0.1, { colorProps: { tint: Colors.LIGHTGREEN, format: "number" }, ease: Linear.easeNone }, 0.1);
        var t = this.selector.tetrominos[type];
        tl.fromTo(b.scale, 0.5, { x: t.scale.x, y: t.scale.y }, { x: 1, y: 1, ease: Back.easeOut }, 0);
        tl.fromTo(b, 0.5, { x: t.x, y: t.y }, { x: b.x, y: b.y }, 0);
        this.oppositeField.selector.active = true;
        tl.to(this.oppositeField, 0.1, { colorProps: { tint: Util.colors.scale(Colors.WHITE, 0.5), format: "number" } }, 0);
        tl.to(this, 0.1, { colorProps: { tint: Colors.WHITE, format: "number" } }, 0);
        this.selector.active = false;
        this.currentTetromino = b;
        return tl;
    };
    return GameField;
}(PIXI.Graphics));
GameField.FIELD_HEIGHT = 20;
GameField.FIELD_WIDTH = 10;
GameField.WARNING_THRESHOLD = 16;
// 准备库环境
if (typeof infoProvider !== 'undefined') {
    // 生产模式，需要使用 Botzone 提供的 TweenMax
    window["TweenMax"] = infoProvider.v2.TweenMax;
    window["TimelineMax"] = infoProvider.v2.TimelineMax;
    var keys = {
        "Ease": true,
        "Expo": true,
        "Linear": true,
        "Back": true,
        "Quad": true
    };
    for (var k in keys)
        window[k] = parent[k];
}
else
    infoProvider = {
        dbgMode: true,
        getPlayerNames: function () { return [{ name: "七海千秋", imgid: "a.png" }, { name: "黑白熊", imgid: "a.png" }]; },
        v2: {
            setRenderTickCallback: function (cb) { return TweenMax.ticker.addEventListener('tick', cb); }
        }
    };
var TetrisGame = (function () {
    /**
     * 创建新的俄罗斯方块游戏实例
     */
    function TetrisGame() {
        var _this = this;
        this.pixelHeight = 0;
        this.pixelWidth = 0;
        this.scale = 0;
        this.mainStage = new PIXI.Graphics();
        this.fields = [];
        this.playerNames = infoProvider.getPlayerNames();
        this.playerTurn = !!infoProvider["dbgMode"];
        if ("id" in this.playerNames[0]) {
            this.playerNames[0].imgid = "/avatar/" + this.playerNames[0]["id"] + ".png";
            this.playerNames[1].imgid = "/avatar/" + this.playerNames[1]["id"] + ".png";
        }
        // 像素画风
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        // 接下来几句话的顺序至关重要
        this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, { antialias: false, transparent: false, backgroundColor: Util.colors.scale(Colors.FIELD_BKG, 0.8) });
        Assets.generateTextures(this.renderer);
        this.stageCreation();
        this.resize();
        var tl = this.uiCreation();
        window.addEventListener('resize', function () { return _this.resize(); });
        document.body.appendChild(this.canvas = this.renderer.view);
        this.prepareInteraction();
        // 开始渲染
        infoProvider.v2.setRenderTickCallback(function () { return _this.renderer.render(_this.bkg); });
        if (infoProvider["dbgMode"]) {
            this.fields[1].nextBlock = Util.rand(Block.Tetromino.TYPE_COUNT);
            tl.add(this.fields[1].dropInBlock(0, 5));
            this.activeBlock = this.fields[1].currentTetromino;
            return;
        }
        infoProvider.v2.setRequestCallback(function (req) {
            _this.playerTurn = true;
            _this.fields[infoProvider.getPlayerID()].currentTetromino.active = true;
            return null;
        });
        infoProvider.v2.setDisplayCallback(function (d) {
            try {
                if (!d)
                    return null;
                var tl_1 = new TimelineMax();
                for (var i = 0; i < 2; i++) {
                    var req = d[i.toString()];
                    if (!req)
                        continue;
                    var f = _this.fields[i];
                    if (req.seq)
                        tl_1.add(f.dropInBlock(0, 5), 0);
                    if (req.seq) {
                        f.currentTetromino.route = req.seq.map(function (n) { return ({
                            r: GameField.FIELD_HEIGHT - n.y,
                            c: n.x - 1,
                            o: n.o
                        }); });
                        tl_1.add(f.currentTetromino.playRoute(), 0.5);
                        tl_1.add(f.currentTetromino.place());
                    }
                }
                tl_1.add(GameField.check(_this.fields));
                for (var i = 0; i < 2; i++) {
                    var req = d[i.toString()];
                    if (!req)
                        continue;
                    var f = _this.fields[1 - i];
                    f.nextBlock = req.block;
                    tl_1.add(Util.biDirectionConstantSet(f.selector, "selectedType", req.block));
                }
                if ("result" in d) {
                    // 游戏好像结束了
                    var msg = "";
                    for (var i = 0; i < 2; i++) {
                        var str = i.toString();
                        if (str in d.err)
                            msg = (msg ? msg + "\n" : "") +
                                (i ? "蓝方：" : "红方：") +
                                Assets.err2chn[d.err[str]];
                    }
                    tl_1.add(_this.showEnding(msg, 1 - d.result));
                }
                return tl_1;
            }
            catch (ex) {
                parent["Botzone"].alert("播放器出错：" + ex);
                return null;
            }
        });
        infoProvider.v2.notifyInitComplete(tl);
    }
    TetrisGame.prototype.resize = function () {
        var w, h;
        this.renderer.resize(this.bkg.width = w = window.innerWidth, this.bkg.height = h = window.innerHeight);
        this.scale = this.mainStage.scale.x = this.mainStage.scale.y = Math.min(w / this.pixelWidth, h / this.pixelHeight);
        this.mainStage.x = (w - this.pixelWidth * this.scale) / 2;
        this.mainStage.y = (h - this.pixelHeight * this.scale) / 2;
    };
    TetrisGame.prototype.placeBlock = function () {
        if (!this.playerTurn)
            return;
        var t = this.activeBlock.place(), t2;
        if (t) {
            if (infoProvider["dbgMode"]) {
                t.add(this.activeBlock.field.check());
                this.activeBlock.field.oppositeField.nextBlock = this.activeBlock.field.oppositeField.selector.selectedType;
                t.add(this.activeBlock.field.oppositeField.dropInBlock(0, 5));
                this.activeBlock = this.activeBlock.field.oppositeField.currentTetromino;
                return;
            }
            infoProvider.notifyPlayerMove({
                seq: this.activeBlock.route.map(function (n) { return ({
                    x: n.c + 1,
                    y: GameField.FIELD_HEIGHT - n.r,
                    o: n.o
                }); }),
                block: this.activeBlock.field.oppositeField.selector.selectedType
            });
            this.playerTurn = false;
        }
    };
    TetrisGame.prototype.prepareInteraction = function () {
        var _this = this;
        window.addEventListener("keydown", function (ev) {
            if (!_this.activeBlock)
                return;
            var r = _this.activeBlock.r, c = _this.activeBlock.c;
            if (ev.keyCode == 32)
                return _this.activeBlock.setOrientation(_this.activeBlock.orientation + 1);
            else if (ev.keyCode == 37)
                c--;
            else if (ev.keyCode == 38)
                r--;
            else if (ev.keyCode == 39)
                c++;
            else if (ev.keyCode == 186)
                return _this.activeBlock.field.dbg();
            else if (ev.keyCode == 40)
                r++;
            else if (ev.keyCode == 191)
                return _this.activeBlock.drop();
            else if (ev.keyCode == 13)
                return _this.placeBlock();
            _this.activeBlock.setRC(r, c);
        });
        document.addEventListener("mousewheel", function (ev) {
            if (!_this.activeBlock)
                return;
            _this.activeBlock.setOrientation(_this.activeBlock.orientation + 1);
        });
        this.canvas.addEventListener("contextmenu", function (ev) {
            if (!_this.activeBlock)
                return;
            _this.placeBlock();
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        });
    };
    TetrisGame.prototype.stageCreation = function () {
        this.bkg = new Background();
        this.bkg.addChild(this.mainStage);
        var activeBlockShadow = new BlockDropIndicator();
        this.pixelWidth += TetrisGame.MARGIN_LEFT_RIGHT;
        this.pixelHeight += TetrisGame.MARGIN_TOP;
        activeBlockShadow.y = this.pixelHeight;
        for (var i = 0; i < TetrisGame.PLAYER_COUNT; i++) {
            var field = new GameField(this.mainStage, activeBlockShadow, i);
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
    };
    TetrisGame.prototype.uiCreation = function () {
        var _this = this;
        this.fields.forEach(function (f) { return f.decorate(); });
        var tl = new TimelineMax();
        var ui = [0, 1].map(function (id) { return new PlayerUI(id, _this.playerNames[id].name, _this.playerNames[id].imgid); });
        this.mainStage.addChild(ui[0], ui[1]);
        tl.fromTo(ui[0], 0.5, {
            x: -ui[0].width, y: this.pixelHeight / 2 - 5,
        }, { x: 0, ease: Back.easeOut }, 0);
        tl.fromTo(ui[1], 0.5, {
            x: this.pixelWidth + ui[1].width, y: this.pixelHeight / 2 + 5,
        }, { x: this.pixelWidth, ease: Back.easeOut }, 0);
        ui.forEach(function (ui) { return ui.applyMask(_this.pixelWidth, _this.pixelHeight); });
        var slash = new Slash();
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
                x: -ui[0].width / 4, yoyo: true, repeat: 1
            }),
            TweenMax.to(ui[1], 0.25, {
                x: this.pixelWidth + ui[1].width / 4, yoyo: true, repeat: 1
            })
        ]);
        tl.to([ui[0].scale, ui[1].scale], 0.2, { x: 1, y: 1, ease: Expo.easeIn });
        this.ui = {
            players: ui,
            slash: slash
        };
        this.bkg.beginAnimation();
        return tl;
    };
    TetrisGame.prototype.showEnding = function (message, winner) {
        var tl = new TimelineMax();
        var hasWinner = winner === 0 || winner === 1;
        var ending = new Ending(hasWinner, message);
        ending.x = this.pixelWidth / 2;
        ending.y = this.pixelHeight / 2;
        ending.txtReason.text = message;
        this.mainStage.addChild(ending);
        tl.fromTo(ending.scale, 0.3, { x: 0, y: 0 }, { x: 1, y: 1, ease: Back.easeOut }, 0);
        if (hasWinner) {
            var winnerUI = this.ui.players[winner];
            this.mainStage.addChild(winnerUI);
            tl.to(winnerUI.scale, 0.15, {
                x: 1.3, y: 1.3, yoyo: true, repeat: 1
            });
            tl.to(winnerUI, 0.3, {
                x: winner ? ending.x + ending.w / 2 - Ending.PADDING : ending.x - ending.w / 2 + Ending.PADDING,
                y: ending.y + ending.h / 2 - Ending.PADDING - winnerUI.height / 2
            }, 0.3);
        }
        return tl;
    };
    return TetrisGame;
}());
TetrisGame.PLAYER_COUNT = 2;
TetrisGame.MARGIN_LEFT_RIGHT = 15; // 所有的像素单位都不是屏幕上的实际像素
TetrisGame.MARGIN_FIELD = 15;
TetrisGame.MARGIN_TOP = 60;
TetrisGame.MARGIN_BOTTOM = 10;
var game;
window.onload = function () {
    if (!infoProvider["dbgMode"])
        infoProvider.v2.setMinSize(0, 600);
    TweenMax.ticker.fps(30);
    WebFont.load({
        custom: {
            families: ['fzxs12'],
            testStrings: {
                'fzxs12': '蛤'
            }
        },
        active: function () { return game = new TetrisGame(); }
    });
};
var BlockDropIndicator = (function (_super) {
    __extends(BlockDropIndicator, _super);
    function BlockDropIndicator() {
        var _this = _super.call(this, Assets.DUMMY_TEXTURE) || this;
        _this.visible = false;
        _this.tint = Colors.LIGHTBLUE;
        _this.alpha = 0.5;
        var filter = new PIXI.filters.BlurXFilter(2);
        _this.filters = [filter];
        return _this;
    }
    return BlockDropIndicator;
}(PIXI.Sprite));
var Ending = (function (_super) {
    __extends(Ending, _super);
    function Ending(withWinner, msg) {
        var _this = _super.call(this) || this;
        var height = Ending.PADDING;
        var width = PlayerUI.WIDTH + Ending.PADDING * 2;
        _this.txtBigTitle = new PIXI.Text("游戏结束", {
            fontFamily: ["fzxs12", "STSong"],
            fontSize: Ending.TITLE_SIZE,
            fill: "white",
            dropShadow: true,
            dropShadowDistance: 2,
            dropShadowColor: "black",
            dropShadowBlur: 0,
            fontWeight: "bold",
            padding: 2
        });
        _this.txtBigTitle.anchor.set(0.5, 0);
        _this.txtBigTitle.x = width / 2;
        _this.txtBigTitle.y = height;
        _this.addChild(_this.txtBigTitle);
        height += _this.txtBigTitle.height + Ending.PADDING;
        _this.txtReason = new PIXI.Text(msg, {
            fontFamily: ["fzxs12", "STSong"],
            fontSize: Ending.MSG_SIZE,
            fill: "black",
            padding: 4,
            wordWrap: true,
            wordWrapWidth: (width - Ending.PADDING / 2) * 2,
            lineHeight: Ending.MSG_SIZE * 1.2
        });
        _this.txtReason.scale.set(0.5, 0.5);
        _this.txtReason.anchor.set(0.5, 0);
        _this.txtReason.x = width / 2;
        _this.txtReason.y = height;
        _this.addChild(_this.txtReason);
        height += _this.txtReason.height + Ending.PADDING;
        _this.txtWinner = new PIXI.Text(withWinner ? "胜利者：" : "平局", {
            fontFamily: ["fzxs12", "STSong"],
            fontSize: Ending.MSG_SIZE,
            fill: "black",
            padding: 4
        });
        _this.txtWinner.scale.set(0.5, 0.5);
        _this.txtWinner.anchor.set(0.5, 0);
        _this.txtWinner.x = width / 2;
        _this.txtWinner.y = height;
        _this.addChild(_this.txtWinner);
        if (withWinner)
            height += _this.txtWinner.height + Ending.PADDING + PlayerUI.HEIGHT + Ending.PADDING;
        else
            height += _this.txtWinner.height + Ending.PADDING;
        _this.h = height;
        _this.w = width;
        _this.beginFill(Colors.WHITE, 0.5);
        _this.drawRect(0, 0, width, height);
        _this.pivot.x = width / 2;
        _this.pivot.y = height / 2;
        return _this;
    }
    return Ending;
}(PIXI.Graphics));
Ending.PADDING = 10;
Ending.TITLE_SIZE = 20;
Ending.MSG_SIZE = 24;
var Background = (function (_super) {
    __extends(Background, _super);
    function Background() {
        return _super.call(this, Background.TEXTURE) || this;
    }
    Background.prototype.beginAnimation = function () {
        return TweenMax.fromTo(this.tilePosition, 5, { x: 0, y: 0 }, {
            x: Background.TEXTURE_SIZE, y: Background.TEXTURE_SIZE, ease: Linear.easeNone, repeat: -1
        });
    };
    return Background;
}(PIXI.extras.TilingSprite));
Background.TILE_SIZE = 10;
Background.TEXTURE_SIZE = Background.TILE_SIZE * 10;
var WarningText = (function (_super) {
    __extends(WarningText, _super);
    function WarningText(gameField) {
        var _this = _super.call(this, WarningText.TEXTURE, gameField.width, WarningText.HEIGHT) || this;
        _this.x = gameField.x;
        _this.y = gameField.y + gameField.height / 2;
        _this.bkg = new PIXI.Sprite(Assets.DUMMY_TEXTURE);
        _this.bkg.x = 0;
        _this.bkg.y = WarningText.STRIP_PADDING;
        _this.bkg.width = gameField.width;
        _this.bkg.height = WarningText.HEIGHT - WarningText.STRIP_PADDING * 2;
        _this.addChild(_this.bkg);
        _this.txtWarning = new PIXI.Text("方块将满", {
            fontFamily: ["fzxs12", "STSong"],
            fontSize: WarningText.FONT_SIZE,
            fill: "black",
            fontWeight: "bold",
            padding: 4,
            wordWrap: true,
            wordWrapWidth: gameField.width * 2,
            breakWords: true
        });
        _this.txtWarning.anchor.set(0.5, 0.5);
        _this.txtWarning.x = gameField.width / 2;
        _this.txtWarning.y = WarningText.HEIGHT / 2;
        _this.addChild(_this.txtWarning);
        _this.pivot.y = WarningText.HEIGHT / 2;
        _this.visible = false;
        return _this;
    }
    WarningText.prototype.beginAnimation = function () {
        return TweenMax.fromTo(this.tilePosition, 1, { x: 0 }, {
            x: WarningText.STRIP_WIDTH * 2, ease: Linear.easeNone, repeat: -1
        });
    };
    return WarningText;
}(PIXI.extras.TilingSprite));
WarningText.STRIP_WIDTH = 5;
WarningText.HEIGHT = 40;
WarningText.FONT_SIZE = 12;
WarningText.STRIP_PADDING = 5;
var Slash = (function (_super) {
    __extends(Slash, _super);
    function Slash() {
        var _this = _super.call(this) || this;
        _this.width = Slash.WIDTH;
        _this.height = Slash.HEIGHT;
        _this.beginFill(Colors.WHITE, Slash.GRADIENT_ALPHA);
        _this.drawRect(0, 0, Slash.WIDTH, Slash.HEIGHT);
        _this.beginFill(Colors.WHITE);
        _this.drawRect(0, Slash.GRADIENT_PADDING, Slash.WIDTH, Slash.HEIGHT - Slash.GRADIENT_PADDING * 2);
        _this.lineStyle(1, 0, Slash.GRADIENT_ALPHA);
        _this.moveTo(0, 0);
        _this.lineTo(0, Slash.HEIGHT);
        _this.moveTo(Slash.WIDTH, 0);
        _this.lineTo(Slash.WIDTH, Slash.HEIGHT);
        _this.lineStyle(1, 0, 1);
        _this.moveTo(0, Slash.GRADIENT_PADDING);
        _this.lineTo(0, Slash.HEIGHT - Slash.GRADIENT_PADDING);
        _this.moveTo(Slash.WIDTH, Slash.GRADIENT_PADDING);
        _this.lineTo(Slash.WIDTH, Slash.HEIGHT - Slash.GRADIENT_PADDING);
        _this.pivot.x = Slash.WIDTH / 2;
        _this.pivot.y = Slash.HEIGHT / 2;
        _this.rotation = Slash.ANGLE;
        return _this;
    }
    return Slash;
}(PIXI.Graphics));
Slash.WIDTH = 10;
Slash.HEIGHT = 80;
Slash.GRADIENT_PADDING = 5;
Slash.GRADIENT_ALPHA = 0.5;
Slash.ANGLE = Math.PI / 12;
var TetrominoSelector = (function (_super) {
    __extends(TetrominoSelector, _super);
    function TetrominoSelector(gameField) {
        var _this = _super.call(this) || this;
        _this.gameField = gameField;
        _this.selector = new PIXI.Graphics();
        _this.tetrominos = new Array(Block.Tetromino.TYPE_COUNT);
        _this.size = 0;
        _this.count = new Array(Block.Tetromino.TYPE_COUNT);
        _this.txtCount = new Array(Block.Tetromino.TYPE_COUNT);
        _this.enabled = new Array(Block.Tetromino.TYPE_COUNT);
        _this._selectedType = 0;
        var size = _this.size = Math.floor(gameField.width / Block.Tetromino.TYPE_COUNT);
        _this.beginFill(Colors.WHITE, 0.5);
        _this.drawRect(0, 0, gameField.width, size);
        var s = _this.selector;
        var corner = Math.floor(TetrominoSelector.CORNER_PERCENTAGE * size);
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
        _this.addChild(s);
        for (var i = 0; i < Block.Tetromino.TYPE_COUNT; i++) {
            var text = _this.txtCount[i] = new PIXI.Text("0", {
                fontFamily: ["fzxs12", "STSong"],
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
            var b = new Block.Tetromino(gameField, i);
            text.x = b.x = gameField.x + size * i + size / 2;
            text.y = b.y = gameField.y - size / 2;
            b.scale.x = b.scale.y = Math.min(size / b.width, size / b.height);
            b.visible = true;
            b.children.forEach(function (c) { return c.visible = true; });
            _this.tetrominos[i] = b;
            _this.count[i] = 0;
            _this.enabled[i] = true;
        }
        _this.interactive = _this.buttonMode = false;
        _this.on("pointertap", function (e) {
            return _this.selectedType = Math.floor(e.data.getLocalPosition(_this).x / size);
        });
        _this.x = gameField.x;
        _this.y = gameField.y - size;
        _this.rotating = _this.tetrominos.map(function (t) { return TweenMax.fromTo(t, 4, { rotation: 0 }, {
            rotation: Math.PI * 2, repeat: -1, ease: Linear.easeNone
        }).pause(); });
        return _this;
        //this.border = new FieldBorder(this);
        //this.parent.addChild(this.border);
    }
    Object.defineProperty(TetrominoSelector.prototype, "active", {
        get: function () {
            return this.interactive;
        },
        set: function (to) {
            this.interactive = this.buttonMode = to;
            TweenMax.to(this, 0.1, { colorProps: { tint: Util.colors.scale(Colors.WHITE, to ? 1 : 0.5), format: "number" } });
        },
        enumerable: true,
        configurable: true
    });
    TetrominoSelector.prototype.addCount = function (type) {
        this.txtCount[type].text = (++this.count[type]).toString();
        var max = Math.max.apply(Math, this.count), min = Math.min.apply(Math, this.count), d = max - min;
        for (var i = 0; i < this.count.length; i++) {
            if (this.enabled[i] = !(d > 1 && this.count[i] == max)) {
                this.txtCount[i].style.fill = "green";
                this.tetrominos[i].children.forEach(function (x) { return x.tint = Colors.WHITE; });
            }
            else {
                this.txtCount[i].style.fill = "red";
                this.tetrominos[i].children.forEach(function (x) { return x.tint = Util.colors.scale(Colors.WHITE, 0.5); });
            }
        }
        var n = (this._selectedType + 1) % Block.Tetromino.TYPE_COUNT;
        while (true) {
            if (this.enabled[n]) {
                this.selectedType = n;
                break;
            }
            n = (n + 1) % Block.Tetromino.TYPE_COUNT;
        }
    };
    TetrominoSelector.prototype.putChildOnStage = function () {
        for (var i = 0; i < Block.Tetromino.TYPE_COUNT; i++)
            this.gameField.stage.addChild(this.tetrominos[i], this.txtCount[i]);
        this.rotating[0].play();
    };
    Object.defineProperty(TetrominoSelector.prototype, "selectedType", {
        get: function () {
            return this._selectedType;
        },
        set: function (to) {
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
        },
        enumerable: true,
        configurable: true
    });
    return TetrominoSelector;
}(PIXI.Graphics));
TetrominoSelector.THICKNESS = 1;
TetrominoSelector.FONT_SIZE = 20;
TetrominoSelector.CORNER_PERCENTAGE = 0.4;
var PlayerUI = (function (_super) {
    __extends(PlayerUI, _super);
    function PlayerUI(playerID, playerName, imageURL) {
        var _this = _super.call(this) || this;
        _this.playerID = playerID;
        _this.playerName = playerName;
        _this.imageURL = imageURL;
        _this.width = PlayerUI.WIDTH;
        _this.height = PlayerUI.HEIGHT;
        _this.pivot.y = PlayerUI.HEIGHT / 2;
        _this.scale.set(1.1, 1.1);
        _this.imgPlayer = PIXI.Sprite.fromImage(imageURL);
        _this.imgPlayer.width = _this.imgPlayer.height = PlayerUI.AVATAR_SIZE;
        _this.txtPlayerName = new PIXI.Text(playerName, {
            fontFamily: ["fzxs12", "STSong"],
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
        _this.txtPlayerName.resolution = 2;
        _this.txtPlayerName.scale.set(0.5, 0.5);
        if (playerID) {
            _this.txtPlayerName.anchor.set(1, 0.5);
            _this.txtPlayerName.x = PlayerUI.WIDTH - PlayerUI.AVATAR_SIZE - PlayerUI.PADDING;
            _this.imgPlayer.x = PlayerUI.WIDTH - PlayerUI.AVATAR_SIZE;
            _this.pivot.x = PlayerUI.WIDTH;
        }
        else {
            _this.txtPlayerName.anchor.set(0, 0.5);
            _this.txtPlayerName.x = PlayerUI.AVATAR_SIZE + PlayerUI.PADDING;
        }
        _this.txtPlayerName.y = PlayerUI.HEIGHT / 2;
        var alphaDrop = 0.8 / (PlayerUI.WIDTH + PlayerUI.HEIGHT - 2);
        for (var y = 0; y < PlayerUI.HEIGHT; y += PlayerUI.TILE_SIZE)
            for (var x = 0; x < PlayerUI.WIDTH; x += PlayerUI.TILE_SIZE) {
                _this.beginFill(PlayerUI.COLORS[playerID], Math.max(1 - alphaDrop * (x + y), 0));
                if (playerID)
                    _this.drawRect(PlayerUI.WIDTH - PlayerUI.TILE_SIZE - x, PlayerUI.HEIGHT - PlayerUI.TILE_SIZE - y, PlayerUI.TILE_SIZE, PlayerUI.TILE_SIZE);
                else
                    _this.drawRect(x, y, PlayerUI.TILE_SIZE, PlayerUI.TILE_SIZE);
            }
        //this.filters = [new PIXI.filters.PixelateFilter()];
        _this.addChild(_this.imgPlayer, _this.txtPlayerName);
        return _this;
    }
    PlayerUI.prototype.applyMask = function (w, h) {
        var biasX = Slash.HEIGHT * Math.sin(Slash.ANGLE) / 2, areaH = Slash.HEIGHT * Math.cos(Slash.ANGLE);
        var g = new PIXI.Graphics();
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
    };
    return PlayerUI;
}(PIXI.Graphics));
PlayerUI.PADDING = 6;
PlayerUI.WIDTH = 138;
PlayerUI.HEIGHT = 30;
PlayerUI.AVATAR_SIZE = 30;
PlayerUI.TILE_SIZE = 6;
PlayerUI.FONT_SIZE = 24;
PlayerUI.COLORS = [Colors.RED, Colors.BLUE];
//# sourceMappingURL=app.js.map