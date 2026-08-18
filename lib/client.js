// dsh-keyboard-history — browser half.
//
// 纯净实现：只在会话输入框“空草稿 + 未忙 + 非 IME”时接管 ↑/↓，翻阅本会话
// 已发送的消息文本，其余情况一律交还原生行为（斜杠菜单开着时草稿必然非空，
// 因此天然不会与其冲突）。
window.__ModuleLoader__.load({
	id: "dsh-keyboard-history",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var react = require("react");
		//#region history
		/** 从用户消息块中取纯文本（仅 text 块；图片等块忽略）。 */
		function textOf(block) {
			return block !== null && typeof block === "object" && block.type === "text" && typeof block.text === "string" ? block.text : "";
		}
		/** 由会话快照的消息节点推导历史：仅 user 消息，相邻同文去重，跳过空文本。 */
		function historyOf(nodes) {
			var out = [];
			if (!Array.isArray(nodes)) return out;
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (node === null || typeof node !== "object" || node.kind !== "user" || !Array.isArray(node.content)) continue;
				var text = "";
				for (var j = 0; j < node.content.length; j++) text += textOf(node.content[j]);
				text = text.trim();
				if (text === "") continue;
				if (out[out.length - 1] !== text) out.push(text);
			}
			return out;
		}
		//#endregion
		//#region slot
		/**
		 * 挂载在 conversation.input.overlay（session 级，list seat）的隐形组件：
		 * 不渲染任何 UI，只在 window 上以捕获阶段监听 keydown。
		 */
		function HistoryRecall(props) {
			var useSession = props.useSession;
			var useInput = props.useInput;
			var inputActions = props.inputActions;
			var nodes = useSession(function (s) { return s.nodes; });
			var input = useInput(function (s) { return s; });
			var indexRef = react.useRef(-1);
			var browsingRef = react.useRef(false);
			var lastSetRef = react.useRef(null);
			var history = react.useMemo(function () { return historyOf(nodes); }, [nodes]);
			/** 草稿一旦偏离召回设置的文本（编辑、回车发出、IME 等），退出翻阅态。 */
			react.useEffect(function () {
				if (browsingRef.current && input.draft !== lastSetRef.current) {
					browsingRef.current = false;
					indexRef.current = -1;
					lastSetRef.current = null;
				}
			}, [input.draft]);
			react.useEffect(function () {
				if (inputActions === void 0 || typeof inputActions.setDraft !== "function") return;
				var onKeyDown = function (e) {
					var up = e.key === "ArrowUp";
					var down = e.key === "ArrowDown";
					if (!up && !down) return;
					if (e.ctrlKey || e.metaKey || e.altKey) return;
					if (e.isComposing || e.keyCode === 229) return;
					var target = e.target;
					if (target === null || target === void 0 || target.tagName !== "TEXTAREA") return;
					if (typeof target.closest !== "function" || target.closest("[data-composer-card]") === null) return;
					// 核心守卫：仅当「未在翻阅」时才要求空草稿（抬起手时不能动已输入内容）；
					// 已在翻阅中（草稿 = 刚召回的条目）则继续翻不受草稿限制。斜杠菜单侵入时
					// 草稿必非空，天然不相撞。
					if (input === void 0 || input.phase !== "plain") return;
					if (!browsingRef.current && input.draft !== "") return;
					if (history.length === 0) return;
					// 状态机：up 开始翻阅（从最新一条起）/ 继续回翻；down 向新翻，越过最新一
					// 条则退出翻阅并清空草稿。
					if (up && !browsingRef.current) {
						indexRef.current = history.length - 1;
						browsingRef.current = true;
					} else if (up) {
						indexRef.current = Math.max(0, indexRef.current - 1);
					} else if (down && browsingRef.current) {
						if (indexRef.current >= history.length - 1) {
							indexRef.current = -1;
							browsingRef.current = false;
							lastSetRef.current = null;
							inputActions.setDraft("");
							return;
						}
						indexRef.current += 1;
					} else {
						return;
					}
					var text = history[indexRef.current];
					lastSetRef.current = text;
					e.preventDefault();
					e.stopPropagation();
					inputActions.setDraft(text);
					requestAnimationFrame(function () {
						if (document.activeElement === target) target.setSelectionRange(text.length, text.length);
					});
				};
				window.addEventListener("keydown", onKeyDown, true);
				return function () { window.removeEventListener("keydown", onKeyDown, true); };
			}, [input, history, inputActions]);
			return null;
		}
		//#endregion
		//#region plugin
		function apply(ctx) {
			ctx.slots.inject("conversation.input.overlay", function () {
				return ctx.slots.register({
					name: "conversation.input.overlay",
					id: "dsh-keyboard-history",
					order: 999
				}, HistoryRecall);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = ["slots"];
		return module.exports;
	}
});