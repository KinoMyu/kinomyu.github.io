/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/*****************************************************************************
 *
 * cost.js
 * コスト算出パネル
 *
 * @author 助右衛門@8鯖
 *
 *****************************************************************************/
Ext.ns('PSO2');

/*****************************************************************************
 * PSO2.CostPanel
 * コスト算出パネル
 *
 * @author 助右衛門@8鯖
 *****************************************************************************/
Ext.define('PSO2.CostPanel', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.costpanel',
	layout: 'anchor',
	baseCls: Ext.baseCSSPrefix + 'panel-body-default-framed ' + Ext.baseCSSPrefix + 'costpanel',
	xtype: 'costpanel',
	padding: '0 5px 0 5px',
	autoHeight: true,
	border: 0,
	frame: false,
	constCookieName: 'pso2cost',
	defaults: {
		anchor: '100%'
	},

	/**
	 * @cfg {Number} precision
	 * 小数点の桁数
	 */
	precision: 5,

	/**
	 * @cfg {Number} sequenceNumber
	 * 通し番号
	 */
	sequenceNumber: 0,

	/** @cfg {String} ddGroup @hide */
	ddGroup: 'cost',

	/** @cfg {String} constCostField @hide */
	constCostField: '-fl-',

	/** @cfg {String} constResultPanel @hide */
	constResultPanel: '-rp',

	/** @cfg {String} constRPCheckbox @hide */
	constRPCheckbox: '-chk',

	/** @cfg {String} constRPTotal @hide */
	constRPTotal: '-total',

	/** @cfg {String} constRPCost @hide */
	constRPCost: '-cost',

	/** @cfg {String} constRPExpectation @hide */
	constRPExpectation: '-exp',

	/** @cfg {String} constRequire @hide */
	constRequire: '-require',

	/** cls */
	referenceClass: 'x-reference-field',

	/**
	 * @property {Object} synthesisParams
	 * @private
	 * 合成パラメータ
	 * key => 合成パネル(タブパネル)のID
	 * ID => number: 通し番号
	 *       panel: コストパネル内コスト算出用パネル
	 *       totalPanel: panel内トータル確率パネル直接参照
	 *       costPanel: panel内コストパネル直接参照
	 *       expPanel: panel内期待値パネル直接参照
	 *       cost: 経費
	 *       exp: 期待値
	 */

	/**
	 * @property {Object} referenceFields
	 * @private
	 * key => 金額入力フィールドID
	 * ID => 参照先となる期待値(総経費)パネル
	 */

	/**
	 * @property {Object} referencePanels
	 * @private
	 * 循環参照のチェックに用いる
	 * key => 金額入力フィールドを持つ通し番号
	 * ID => [参照先となる期待値(総経費)の通し番号]
	 */

	/**
	 * @private
	 * コンポーネントの初期化
	 */
	initComponent: function() {
		var me = this;

		if (me.tabPanel) {
			me.tabPanel.on('beforeadd', me.addTabPanel, me);
			me.tabPanel.on('beforeremove', me.removeTabPanel, me);
		}

		/* private parameters */
		me.synthesisParams = {};

		/* private reference fields */
		me.referenceFields = {};
		me.referencePanels = {};
		me.referenceSets = {};
		me.referenceUpdate = false;

		/* call parent */
		me.callParent(arguments);
	},

	/**
	 * @private
	 * 子ノードの初期化を行う
	 */
	initItems: function() {
		var me = this,
			cookie = PSO2.Cookie.get(me.constCookieName) || {},
			costFieldItems = [], i,
			op1 = PSO2.AbilityOption.support,
			op2 = PSO2.AbilityOption.additional;

		for (i = 1; i < op1.length; i++) {
			costFieldItems.push({
				id: me.id + me.constCostField + op1[i].value,
				name: op1[i].value,
				fieldLabel: op1[i].name,
				value: cookie[op1[i].value] || 0,
				listeners: {
					scope: me,
					change: me.changeOptionCost
				}
			});
		}
		for (i = 1; i < op2.length; i++) {
			costFieldItems.push({
				id: me.id + me.constCostField + op2[i].value,
				name: op2[i].value,
				fieldLabel: op2[i].name,
				value: cookie[op2[i].value] || 0,
				listeners: {
					scope: me,
					change: me.changeOptionCost
				}
			});
		}
		costFieldItems.push({
			id: me.id + me.constRequire,
			name: me.constRequire,
			fieldLabel: 'Cost of Synthesis',
			value: cookie[me.constRequire] || 0,
			step: 1000,
			listeners: {
				scope: me,
				change: me.changeOptionCost
			}
		});
		costFieldItems.push({
			xtype: 'button',
			text: 'Save',
			scope: me,
			handler: function() {
				var me = this, cookie = {};
				me.costFieldSet.items.each(function(item) {
					if (item.xtype != 'button') {
						cookie[item.name] = item.getValue();
					}
				});
				PSO2.Cookie.set(me.constCookieName, cookie);
				Ext.Msg.alert('Information', 'Cookies must be enabled.');
			}
		});

		/* 経費設定 */
		me.costFieldSet = Ext.create('Ext.form.FieldSet', {
			title: 'Set Cost',
			frame: true,
			layout: 'anchor',
			collapsible: true,
			padding: '5px',
			defaultType: 'currencyfield',
			defaults: {
				width: 300,
				labelWidth: 140,
				labelAlign: 'right',
				minValue: 0,
				fieldStyle: 'text-align:right',
				step: 1050
			},
			items: costFieldItems
		});

		/* 各合成コストパネル */
		me.synthesisPanel = Ext.create('Ext.panel.Panel', {
			frame: false,
			border: 0,
			padding: '0',
			autoHeight: true,
			layout: 'anchor',
			defaults: {
				xtype: 'panel',
				baseCls: Ext.baseCSSPrefix + 'panel-body-default-framed ' + Ext.baseCSSPrefix + 'cost-field',
				frame: false,
				padding: '0',
				border: 0
			}
		});

		if (me.tabPanel) {
			for (var i = 0; i < me.tabPanel.items.length; i++) {
				me.addCost(me.tabPanel.items.getAt(i));
			}
		}

		/* 初期アイテム設定 */
		me.items = [me.costFieldSet, Ext.create('Ext.panel.Panel', {
			frame: false,
			border: 0,
			items:[
				me.synthesisPanel
			]
		})];

		/* call parent */
		me.callParent(arguments);
	},

	/**
	 * コストフィールドの追加を行う
	 *
	 * @param comp {Ext.panel.Panel} タブパネルに追加された合成パネル
	 */
	addCost: function(comp) {
		var me = this, rp = comp.getResultPanel(),
			cost = me.getCost(comp, rp),
			exp = me.getExpectation(comp, rp, cost),
			disabled = !rp.isDodo(),
			parentId = rp.id + me.constResultPanel,
			newPanel = me.synthesisPanel.add({
				id: parentId,
				targetPanel: comp,
				items: [{
					xtype: 'container',
					layout: {
						type: 'hbox',
						autoFlex: false
					},
					defaults: {
						style: 'margin-right:5px'
					},
					items: [{
						xtype: 'button',
						text: 'Panel No.' + (++me.sequenceNumber),
						scope: me,
						handler: function() {
							me.tabPanel.setActiveTab(comp);
						}
					}, {
						id: parentId + me.constRPTotal,
						frame: true,
						border: 1,
						width: 160,
						style: {
							textAlign: 'right'
						},
						html: me.getSuccess(comp, rp)
					}]
				}, {
					/* 金額入力フォーム */
					xtype: 'container',
					layout: {
						type: 'hbox',
						autoFlex: false
					},
					defaults: {
						xtype: 'currencyfield',
						labelWidth: 42,
						labelAlign: 'right',
						width: 200,
						minValue: 0,
						fieldStyle: 'text-align:right',
						margin: '4px 0 4px 8px',
						step: 1050,
						value: 0,
						disabled: disabled,
						listeners: {
							scope: me,
							change: me.changeMainCost,
							render: me.initializeCostDropZone
						}
					},
					items: [{
						name: rp.id + me.constResultPanel + '-cur-1',
						fieldLabel: 'Base'
					}, {
						name: rp.id + me.constResultPanel + '-cur-2',
						fieldLabel: 'Fodder 1'
					}, {
						name: rp.id + me.constResultPanel + '-cur-3',
						fieldLabel: 'Fodder 2'
					}]
				}, {
					xtype: 'container',
					layout: {
						type: 'hbox',
						autoFlex: false
					},
					padding: '0',
					defaults: {
						width: 200,
						border: 0,
						frame: false,
						margin: '0 0 0 8px'
					},
					items: [{
						xtype: 'checkbox',
						disabled: disabled,
						style: {
							textAlign: 'right'
						},
						listeners: {
							scope: me,
							change: me.changeSynthesisCost
						}
					}, {
						/* 経費表示パネル */
						id: parentId + me.constRPCost,
						parentId: parentId,
						frame: true,
						border: 1,
						autoHeight: true,
						layout: 'fit',
						tpl: new Ext.XTemplate([
							'<div class="x-cost-frame">',
								'<div class="x-cost-label">Expenses:</div>',
								'<div class="x-cost-value">{text}</div>',
							'</div>',
							'<div style="clear:both"></div>'
						]),
						style: {
							textAlign: 'right'
						},
						data: {
							value: cost,
							text: Ext.util.Format.number(cost, '0,0')
						},
						update: function(data) {
							this.data = {
								value: data,
								text: Ext.util.Format.number(data, '0,0')
							};
							this.tpl.overwrite(this.body, this.data);
						}
					}, {
						/* 期待値表示パネル */
						id: parentId + me.constRPExpectation,
						parentId: parentId,
						frame: true,
						border: 1,
						layout: 'fit',
						tpl: new Ext.XTemplate([
							'<div class="x-cost-frame">',
								'<img class="x-cost-drag-icon">',
								'<div class="x-cost-label">Expected Value:</div>',
								'<div class="x-cost-value">{text}</div>',
							'</div>',
							'<div style="clear:both"></div>'
						]),
						style: {
							textAlign: 'right'
						},
						itemSelector: '.x-cost-drag-icon',
						listeners: {
							scope: me,
							render: me.initializeCostDragZone
						},
						data: {
							value: exp,
							text: Ext.util.Format.number(exp, '0,0')
						},
						update: function(data) {
							this.data = {
								value: data,
								text: Ext.util.Format.number(data, '0,0')
							};
							this.tpl.overwrite(this.body, this.data);
							this.fireEvent('update', this, data, this.data, me);
						}
					}]
				}]
			});

		if (comp.rendered !== true) {
			comp.on('afterrender', me.tabAfterRender, me);
		}

		/* add parameters */
		me.synthesisParams[comp.id] = {
			number: me.sequenceNumber,
			panel: newPanel,
			totalPanel: Ext.getCmp(parentId + me.constRPTotal),
			costPanel: Ext.getCmp(parentId + me.constRPCost),
			expPanel: Ext.getCmp(parentId + me.constRPExpectation),
			cost: cost,
			exp: exp
		};

		/* add event */
		rp.on('dodochange', me.changeResult, me);
		rp.on('opt1change', me.changeSuccess, me);
		rp.on('opt2change', me.changeSuccess, me);
		rp.on('successchange', me.changeSuccess, me);
	},

	/**
	 * 合成パラメータを指定のキー&値から検索し、返却する
	 *
	 * @param key {String} キー
	 * @param value {Object} 検索するキーの値
	 * @return {Object} 合成パラメータ
	 */
	getSynthesisParams: function(key, value) {
		var me = this, id;

		for (id in me.synthesisParams) {
			if (me.synthesisParams[id][key] === value)
				return me.synthesisParams[id];
		}

		return false;
	},

	/**
	 * 循環参照のチェックを行う
	 *
	 * @param start {Number} 通し番号
	 * @param number {Number} チェックする通し番号
	 */
	checkReference: function(start, number) {
		var me = this,
			rp = me.referencePanels[start];

		if (rp) {
			for (var i = 0; i < rp.length; i++) {
				if (rp[i] == number) return true;
				if (me.checkReference(rp[i], number)) return true;
			}
		}
		return false;
	},

	/**
	 * 参照先の経費パネルを登録する
	 *
	 * @param expPanel 期待値(総経費)のパネル
	 * @param currencyField 金額入力フィールド
	 */
	registReferenceCost: function(expPanel, currencyField) {
		var me = this,
			exp = me.getSynthesisParams('expPanel', expPanel),
			target = me.synthesisParams[currencyField.ownerCt.ownerCt.targetPanel.id], ret;

		/* 永久循環参照のチェックを行う */
		ret = me.checkReference(exp.number, target.number);
		if (ret) {
			Ext.Msg.alert('Warning', 'Since the circular reference occurs, it could not continue processing.');

			/* failure */
			return false;
		}

		if (me.referenceFields[currencyField.id]) {
			/* 既に登録されていた場合 */
			if (me.referenceFields[currencyField.id] == expPanel) return false;

			/* 該当の数を減らす */
			var n = me.getSynthesisParams('expPanel', me.referenceFields[currencyField.id]).number,
				ref = me.referencePanels[target.number],
				index = Ext.Array.indexOf(ref, n);

			ref.splice(index, 1);
			me.referenceSets[target.number + '-' + n] -= 1;

			/* イベント削除 */
			me.referenceFields[currencyField.id].un({
				scope: currencyField,
				update: me.updateReferenceCost
			});

			/* tooltips */
			Ext.QuickTips.unregister(currencyField.getEl());
		}

		/* 参照パネルの追加を行う */
		if (me.referencePanels[target.number]) {
			if (Ext.Array.indexOf(me.referencePanels[target.number], exp.number) < 0) {
				me.referencePanels[target.number].push(exp.number);
			}
			if (me.referenceSets[target.number + '-' + exp.number]) {
				me.referenceSets[target.number + '-' + exp.number] += 1;
			} else {
				me.referenceSets[target.number + '-' + exp.number] = 1;
			}
		} else {
			/* 新規登録 */
			me.referencePanels[target.number] = [exp.number];
			me.referenceSets[target.number + '-' + exp.number] = 1;
		}

		/* イベントの登録 */
		expPanel.on({
			scope: currencyField,
			update: me.updateReferenceCost
		});

		/* 値のセット */
		me.referenceUpdate = true;
		currencyField.setValue(exp.exp);
		me.referenceUpdate = false;

		/* add class */
		currencyField.addCls(me.referenceClass);

		/* tooltips */
		Ext.QuickTips.register({
			target: currencyField.getEl(),
			text: 'パネル No.' + exp.number + 'の値'
		});

		/* 登録 */
		me.referenceFields[currencyField.id] = expPanel;

		/* success */
		return true;
	},

	/**
	 * 参照先コストが更新された場合に呼び出される
	 */
	updateReferenceCost: function(target, v, text, scope) {
		var me = this;

		scope.referenceUpdate = true;
		me.setValue(v);
		scope.referenceUpdate = false;
	},

	/**
	 * ドラッグゾーンの作成
	 *
	 * 作成場所は、期待値(総経費)の画像アイコンが元となる
	 */
	initializeCostDragZone: function(v) {
		var me = this;

		v.dragZone = Ext.create('Ext.dd.DragZone', v.getEl(), {
			ddGroup: me.ddGroup,
			getDragData: function(e) {
				var sourceEl = e.getTarget(v.itemSelector, 10), d;
				if (sourceEl) {
					d = sourceEl.cloneNode(true);
					d.id = Ext.id();
					return v.dragData = {
						sourceEl: sourceEl,
						repairXY: Ext.fly(sourceEl).getXY(),
						ddel: d,
						costPanel: v.ownerCt.ownerCt
					};
				}
			},
			getRepairXY: function() {
				return this.dragData.repairXY;
			}
		});
	},

	/**
	 * ドロップゾーンの作成
	 *
	 * 作成場所は、各金額設定を行う素体、素材1、素材2のフィールド
	 * 期待値(総経費)をドラッグし、各フィールドへ設定する。
	 */
	initializeCostDropZone: function(v) {
		var me = this,
			cost = me;

		v.dropZone = Ext.create('Ext.dd.DropZone', v.el, {
			ddGroup: me.ddGroup,
			getTargetFromEvent: function(e) {
				return e.getTarget('.x-form-currency');
			},
			onNodeDrop : function(target, dd, e, data) {
				var me = this,
					owner = v.ownerCt.ownerCt;

				/* 同じIDの場合はfalse */
				if (data.costPanel.id == owner.id) return false;

				/* 相手が未表示の場合はfalse */
				if (owner.targetPanel.rendered !== true) return false;

				/* 参照先が更新されたら場合のイベント */
				return cost.registReferenceCost(Ext.getCmp(dd.id), v);
			}
		});
	},

	/**
	 * トータル成功確率を取得する
	 *
	 * @param comp {Ext.panel.Panel} タブパネル
	 * @param rp {PSO2.ResultPanel} 結果パネル
	 */
	getSuccess: function(comp, rp) {
		return comp.rendered? Ext.util.Format.round(rp.totalValue, this.precision) + '%': 'パネルを押して下さい';
	},

	/**
	 * 経費を取得する
	 *
	 * @param comp {Ext.panel.Panel} タブパネル
	 * @param rp {PSO2.ResultPanel} 結果パネル
	 */
	getCost: function(comp, rp) {
		var me = this, v = 0, sel, cb;

		if (comp.rendered) {
			/* 能力オプションの選択状態を調べる */
			sel = rp.selectedOptions();
			Ext.Array.forEach(sel, function(key) {
				var p = this.costFieldSet.items.get(me.id + me.constCostField + key);

				if (p) {
					v += p.value;
				}
			}, me);

			/* 1回の合成費用 */
			if (me.synthesisParams[comp.id]) {
				cb = me.synthesisParams[comp.id].panel.query('checkbox');
				if (cb && Ext.isArray(cb)) {
					if (cb[0].checked) {
						v += me.costFieldSet.items.get(me.id + me.constRequire).value;
					}
				}
			}
		}
		return v;
	},

	/**
	 * 期待値を取得する
	 *
	 * @param comp {Ext.panel.Panel} タブパネル
	 * @param rp {PSO2.ResultPanel} 結果パネル
	 * @param cost {Number} 経費
	 * @return {Number} 期待値
	 */
	getExpectation: function(comp, rp, cost) {
		var me = this,
			params = me.synthesisParams[comp.id],
			v = 0, totalCost = 0;

		if (comp.rendered && 0 < rp.totalValue) {
			// 対象の合成が表示状態で、確率が0%を超える場合のみ計算
			totalCost += cost;

			if (params && params.panel) {
				Ext.Array.forEach(params.panel.query('currencyfield'), function(field) {
					totalCost += field.value;
				});
			}

			v = totalCost * (100 / rp.totalValue);
		}
		return v;
	},

	/**
	 * 素体、または素材の値が変更された場合に呼び出される
	 *
	 * @param item {Object} 変更された素材、または素体の価格フィールド
	 */
	changeMainCost: function(item) {
		var me = this,
			comp = item.ownerCt.ownerCt.targetPanel,
			rp = comp.getResultPanel(),
			params = me.synthesisParams[comp.id];

		if (me.referenceUpdate !== true && me.referenceFields[item.id]) {
			/* 参照設定がされている状態で手入力による値変更が行われた場合 */
			var n = me.synthesisParams[item.ownerCt.ownerCt.targetPanel.id].number,
				tn = me.getSynthesisParams('expPanel', me.referenceFields[item.id]).number;

			/* イベント削除 */
			me.referenceFields[item.id].un({
				scope: item,
				update: me.updateReferenceCost
			});

			/* remove class */
			item.removeCls(me.referenceClass);

			/* tooltips */
			Ext.QuickTips.unregister(item.getEl());

			/* キーの削除 */
			me.referenceSets[n + '-' + tn] -= 1;
			if (me.referenceSets[n + '-' + tn] <= 0) {
				var ref = me.referencePanels[n],
					index = Ext.Array.indexOf(ref, tn);

				ref.splice(index, 1);

				delete me.referenceSets[n + '-' + tn];
			}

			delete me.referenceFields[item.id];
		}

		/* 期待値の更新 */
		params.exp = me.getExpectation(comp, rp, params.cost);
		params.expPanel.update(params.exp);
	},

	/**
	 * 一回の合成費用の設定が変更された場合に呼び出される
	 */
	changeSynthesisCost: function(item, newvValue, oldValue) {
		var me = this,
			comp = item.ownerCt.ownerCt.targetPanel,
			rp = comp.getResultPanel(),
			params = me.synthesisParams[comp.id];

		/* 経費の更新 */
		params.cost = me.getCost(comp, rp);
		params.costPanel.update(params.cost);

		/* 期待値の更新 */
		params.exp = me.getExpectation(comp, rp, params.cost);
		params.expPanel.update(params.exp);
	},

	/**
	 * 経費設定の値が変更された場合に呼び出される
	 */
	changeOptionCost: function() {
		var me = this, id;

		/* パネル全てをループ */
		for (id in me.synthesisParams) {
			var comp = Ext.getCmp(id),
				rp = comp.getResultPanel(),
				params = me.synthesisParams[id];

			/* 経費の更新 */
			params.cost = me.getCost(comp, rp);
			params.costPanel.update(params.cost);

			/* 期待値の更新 */
			params.exp = me.getExpectation(comp, rp, params.cost);
			params.expPanel.update(params.exp);
		}
	},

	/**
	 * タブパネルが表示されたときに呼び出される
	 *
	 * @param comp {Ext.panel.Panel} 表示されたパネル
	 */
	tabAfterRender: function(comp) {
		var me = this, rp = comp.getResultPanel();

		me.changeResult(rp);
		me.changeSuccess(rp);
		comp.un('afterrender', me.tabAfterRender, me);
	},

	/**
	 * コストフィールドの削除を行う
	 *
	 * @param comp {Ext.panel.Panel} タブパネルから削除された合成パネル
	 */
	removeCost: function(comp) {
		var me = this, rp = comp.getResultPanel(),
			param = me.synthesisParams[comp.id],
			panel = param.panel;

		/* remove event */
		rp.un('dodochange', me.changeResult, me);
		rp.un('opt1change', me.changeSuccess, me);
		rp.un('opt2change', me.changeSuccess, me);
		rp.un('successchange', me.changeSuccess, me);

		var fields = me.synthesisParams[comp.id].panel.query('currencyfield');
		Ext.Array.forEach(fields, function(field) {
			if (me.referenceFields[field.id]) {
				/* イベント削除 */
				me.referenceFields[field.id].un({
					scope: field,
					update: me.updateReferenceCost
				});

				/* remove */
				delete me.referenceFields[field.id];
			}
			/* tooltips */
			Ext.QuickTips.unregister(field.getEl());
		}, me);

		/* 参照していたパネルの更新 */
		for (var f in me.referenceFields) {
			if (me.referenceFields[f] == param.expPanel) {
				var fl = Ext.getCmp(f);

				/* remove class */
				fl.removeCls(me.referenceClass);

				/* tooltips */
				Ext.QuickTips.unregister(fl.getEl());

				delete me.referenceFields[f];
			}
		}

		/* remove */
		delete me.referencePanels[param.number];
		delete me.synthesisParams[comp.id];
		for (var num in me.referencePanels) {
			var ref = me.referencePanels[num];
			if (ref) {
				var index = Ext.Array.indexOf(ref, param.number);
				if (0 <= index) {
					ref.splice(index, 1);
				}
			}
		}

		/* destroy */
		me.synthesisPanel.remove(panel, true);
	},

	/**
	 * タブパネルに合成パネルが追加された場合に呼び出される
	 *
	 * @param tab {Ext.container.Container} タブパネル
	 * @param comp {Ext.Component} 追加されたコンポーネント
	 * @param index {Number} 追加先インデックス
	 */
	addTabPanel: function(tab, comp, index) {
		var me = this;

		if (comp.title && comp.title != me.title) {
			me.addCost(comp);
		}
	},

	/**
	 * タブパネルから合成パネルが削除された場合に呼び出される
	 *
	 * @param tab {Ext.container.Container} タブパネル
	 * @param comp {Ext.Component} 削除されたコンポーネント
	 */
	removeTabPanel: function(tab, comp) {
		var me = this;

		if (comp.title && comp.title != me.title) {
			me.removeCost(comp);
		}
	},

	/**
	 * 結果パネルのドゥドゥボタンが変更された場合に呼び出される
	 *
	 * @param rp {PSO2.ResultPanel} 変更があった結果パネル
	 */
	changeResult: function(rp) {
		var me = this, ownerCmp = rp.ownerCt.ownerCt,
			panel = me.synthesisParams[ownerCmp.id].panel,
			cf = panel.query('currencyfield'), cb = panel.query('checkbox'), i;

		if (rp.isDodo()) {
			for (i = 0; i < cf.length; i++) {
				cf[i].enable();
			}
			for (i = 0; i < cb.length; i++) {
				cb[i].enable();
			}
		} else {
			for (i = 0; i < cf.length; i++) {
				cf[i].disable();
			}
			for (i = 0; i < cb.length; i++) {
				cb[i].disable();
			}
		}
	},

	/**
	 * 結果パネルの成功確率が変更された場合に呼び出される
	 *
	 * @param rp {PSO2.ResultPanel} 変更があった結果パネル
	 */
	changeSuccess: function(rp) {
		var me = this,
			ownerCmp = rp.ownerCt.ownerCt,
			params = me.synthesisParams[ownerCmp.id];

		/* トータル確率の更新 */
		params.totalPanel.update(Ext.util.Format.round(rp.totalValue, me.precision) + '%');

		/* 経費の更新 */
		params.cost = me.getCost(ownerCmp, rp);
		params.costPanel.update(params.cost);

		/* 期待値の更新 */
		params.exp = me.getExpectation(ownerCmp, rp, params.cost);
		params.expPanel.update(params.exp);
	},

	/* @override */
	destroy: function() {
		var me = this;

		for (id in me.synthesisParams) {
			me.removeCost(Ext.getCmp(id));
		}
		me.tabPanel.un('beforeadd', me.addTabPanel, me);
		me.tabPanel.un('beforeremove', me.removeTabPanel, me);

		me.callParent(arguments);
	}
});
