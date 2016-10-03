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
 * result.js
 * まさにドゥドゥ(モニカ)本体を現す結果表示パネル
 *
 * 指定された素体、素材A(+素材B)の特殊能力情報を基に、指定できる特殊能力の出力
 * を行い、その中から選択された特殊能力から継承・生成率の表示を行う
 * また、能力追加オプションの選択、ドゥドゥシミュレーションも行う
 *
 * このパネルのみを利用する場合、このファイルより先に同梱の「ability.js」を
 * ロードする必要があります
 *
 *****************************************************************************/
Ext.ns('PSO2');

/* 能力オプション */
PSO2.AbilityOption = {
	support: [
			{name: 'Nothing',           sname: 'None', value: 'A01', fn: function(v){ return v; }},
			{name: 'Ability Success +5%',  sname: '+5%',      value: 'A02', fn: function(v){ return Math.min(v +  5, 100); }},
			{name: 'Ability Success +10%', sname: '+10%',     value: 'A03', fn: function(v){ return Math.min(v + 10, 100); }},
			{name: 'Ability Success +20%', sname: '+20%',     value: 'A04', fn: function(v){ return Math.min(v + 20, 100); }},
			{name: 'Ability Success +30%', sname: '+30%',     value: 'A05', fn: function(v){ return Math.min(v + 30, 100); }},
			{name: 'Ability Success +40%', sname: '+40%',     value: 'A06', fn: function(v){ return Math.min(v + 40, 100); }}
	],
	additional: [
		{name: 'Nothing',             value: 'B01'},
		{name: 'Add Special Ability （HP）',   value: 'B02', extend: 100, effect: 'HP(+45)'},
		{name: 'Add Special Ability （PP）',   value: 'B03', extend: 100, effect: 'PP(+5)'},
		{name: 'Add Special Ability （S-ATK）', value: 'B04', extend: 100, effect: 'S-ATK(+25)'},
		{name: 'Add Special Ability （R-ATK）', value: 'B05', extend: 100, effect: 'R-ATK(+25)'},
		{name: 'Add Special Ability （T-ATK）', value: 'B06', extend: 100, effect: 'T-ATK(+25)'}
	]
};

/* 成功率グラフの色設定 */
Ext.chart.theme.Browser = Ext.extend(Ext.chart.theme.Base, {
	constructor: function(config) {
		Ext.chart.theme.Base.prototype.constructor.call(this, Ext.apply({
			colors: [
				'rgb(0, 0, 255)',
				'rgb(127, 255, 0)',
				'rgb(255, 215, 0)',
				'rgb(255, 165, 0)',
				'rgb(255, 69, 0)',
				'rgb(128, 10, 128)',
				'rgb(128, 0, 0)',
				'rgb(64, 64, 64)',
				'rgb(0, 0, 0)',
				'rgb(32, 0, 0)'
			]
		}, config));
	}
});

/*****************************************************************************
 * PSO2.ResultPanel
 * 結果表示パネル
 *
 * @author 助右衛門@8鯖
 * @since  2012/12/24
 *****************************************************************************/
Ext.define('PSO2.ResultPanel', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.resultpanel',
	layout: 'anchor',
	baseCls: Ext.baseCSSPrefix + 'panel-body-default-framed ' + Ext.baseCSSPrefix + 'resultpanel',
	xtype: 'resultpanel',
	padding: '0',
	autoHeight: true,

	/** @cfg {String} constViewPanel @hide */
	constViewPanel: '-viewpanel',

	/** @cfg {String} constSelOption1 @hide */
	constSelOption1: '-selopt-1',

	/** @cfg {String} constSelOption2 @hide */
	constSelOption2: '-selopt-2',

	/** @cfg {String} constChkOption1 @hide */
	constChkOption1: '-chkopt-1',

	/** @cfg {String} constSuccessPanel @hide */
	constSuccessPanel: '-successpanel',

	/** @cfg {String} emptyText @hide */
	emptyText: '&nbsp;',

	/**
	 * @property {String} dodoButtonText
	 * シミュレーションウィンドウ表示用ボタンのテキスト
	 */
	dodoButtonText: 'Dudu It',

	/**
	 * @property {String} redodoButtonText
	 * リトライ用ボタンのテキスト
	 */
		/**
	 * @property {String} redodoButtonText
	 * リトライ用ボタンのテキスト
	 */
	redodoButtonText: 'Dudu It Again',

	/**
	 * @property {String} monimoniButtonText
	 * モニター表示用ボタンのテキスト
	 */
	monimoniButtonText: 'Details',

	/**
	 * 以下はモニター用パラメータ算出のためのプロパティです
	 * ability.jsの特殊能力リストの効果(effect)から正規表現で数値を抜き取り
	 * 表出しています
	 */
	/* パラメータリスト(出力順序を配列により指定) */
	abText: [
		'S-ATK', 'R-ATK', 'T-ATK',
		'S-DEF', 'R-DEF', 'T-DEF',
		'DEX',
		'HP', 'PP',
		'Strike Resist', 'Range Resist', 'Tech Resist',
		'Fire Resist', 'Ice Resist', 'Lightning Resist', 'Wind Resist', 'Light Resist', 'Dark Resist'
	],

	/* "ALL"(アビ＆ミューテーション)時にアップするパラメータ一覧 */
	allUp: ['S-ATK', 'R-ATK', 'T-ATK', 'S-DEF', 'R-DEF', 'T-DEF', 'DEX'],

	/* "全属性耐性"時にアップするパラメータ一覧 */
	resistAll: ['Strike Resist', 'Range Resist', 'Tech Resist', 'Fire Resist', 'Ice Resist', 'Lightning Resist', 'Wind Resist', 'Light Resist', 'Dark Resist'],

	/**
	 * @cfg {Ext.data.Store} optionStore1
	 * 能力追加成功率アップのアイテムを定義
	 *  name: オプション名
	 * value: ユニークな値(1文字目がoptionStore2と区別がつくように定義)
	 *    fn: 計算ロジック
	 */
	optionStore1: Ext.create('Ext.data.Store', {
		fields: ['name', 'sname', 'value', 'fn'],
		data: PSO2.AbilityOption.support
	}),

	/**
	 * @cfg {String} initOption1Value
	 * 初期表示オプション番号
	 */
	initOption1Value: 'A01',

	/**
	 * @property {Ext.data.Store} optionStore2
	 * 追加できる特殊能力のアイテムを定義
	 *   name: オプション名
	 * value: ユニークな値(1文字目がoptionStore1と区別がつくように定義)
	 * extend: 継承率
	 */
	optionStore2: Ext.create('Ext.data.Store', {
		fields: ['name', 'value', 'extend', 'effect'],
		data: PSO2.AbilityOption.additional
	}),

	/**
	 * @cfg {String} initOption2Value
	 * 初期表示オプション番号
	 */
	initOption2Value: 'B01',

	/**
	 * @private
	 * @property {Number} totalValue
	 */
	totalValue: 0,

	/**
	 * @property {String} sameBonusText
	 * 同一ボーナス用ボタンのテキスト
	 */
	sameBonusText: 'Same',

	/**
	 * @private {Array} sameBonusBoost
	 * 同一数による同一ボーナスのブースト値
	 * 1個 = 1, 2個 = 1.1, 3個以上 = 1.15
	 */
	sameBonusBoost: [1.0, 1.1, 1.15],

	/**
	 * @private {Function} calcSameBonus
	 * 同一ボーナス算出用関数
	 * @param v
	 * @param s 同一数
	 * @return 100を上限とするブースト後の成功確率
	 */
	calcSameBonus: function(v, s) {
		var me = this;

		//if (v['name'].indexOf("Returner") < 0) {
			return Math.min(parseInt(v['success'] * me.sameBonusBoost[PSO2.utils.overflow(me.sameBonusBoost.length, s + 1, 1)]), 100);
		//}
		//return v['success'];
	},

	/**
	 * @private
	 * コンポーネントの初期化
	 */
	initComponent: function() {
		var me = this;

		/* 能力追加情報を生成 */
		me.abilitySet = Ext.create('PSO2.AbilitySet', {
			abilityComponent: me.abilityComponent,
			abilityStore: me.abilityComponent.getAbilityStore()
		});

		/* イベントの追加*/
		this.addEvents(
			/**
			 * @event opt1change
			 * @param {PSO2.ResultPanel} this 結果パネル
			 * @param {Ext.form.field.Field} item 選択されたアイテムフィールド
			 * @param {Boolean} init 初期値と同じ場合はTrueがセットされる
			 */
			'opt1change',

			/**
			 * @event opt2change
			 * @param {PSO2.ResultPanel} this 結果パネル
			 * @param {Ext.form.field.Field} item 選択されたアイテムフィールド
			 * @param {Boolean} init 初期値と同じ場合はTrueがセットされる
			 */
			'opt2change',

			/**
			 * @event dodochange
			 * @param {PSO2.ResultPanel} this 結果パネル
			 * @param {Boolean} newValue 新しい値
			 * @param {Boolean} oldValue 直前の値
			 */
			'dodochange',

			/**
			 * @event successchange
			 * @param {PSO2.ResultPanel} this 結果パネル
			 * @param {Number} newValue 新しい値
			 * @param {Number} oldValue 直前の値
			 */
			'successchange'
		);

		/* call parent */
		me.callParent(arguments);
	},

	/**
	 * @private
	 * 子ノードの初期化を行う
	 */
	initItems: function() {
		var me = this;

		me.resultItems = [];
		me.optionItems = [];

		/* 表示パネルの生成 */
		me.successStore = Ext.create('Ext.data.ArrayStore', {
			autoDestroy: true,
			storeId: me.id + '-store',
			idIndex: 0,
			fields: [
				{name: 'name', type: 'string'},
				{name: 'success', type: 'numeric'}
			]
		});

		/* 表示パネル(iPadだとレイアウトが崩れてしまうためHTMLを記述) */
		me.viewPanel = Ext.create('Ext.view.View', {
			autoWidth: true,
			autoHeight: true,
			store: me.successStore,
			tpl: [
				'<table style="width:100%">',
					'<tpl for=".">',
					'<tr id="success">',
						'<td style="width:50%;padding-bottom:5px">{name}</td>',
						'<td style="width:50%;padding-bottom:5px">{success}%</td>',
					'</tr>',
					'</tpl>',
				'</table>',
				'<div style="clear:both"></div>'
			],
			itemSelector: 'tr#success'
		});

		/* 能力追加オプション1コンボボックスの生成 */
		me.selOpt1 = Ext.create('Ext.form.field.ComboBox', {
			id: me.id + me.constSelOption1,
			store: me.optionStore1,
			displayField: 'name',
			forceSelection: true,
			editable: false,
			queryMode: 'local',
			valueField: 'value',
			value: me.initOption1Value,
			typeAhead: true,
			anchor: '100%',
			disabled: true,
			listeners: {
				scope: me,
				change: function(item) {
					var me = this;

					/* 情報を更新後、イベントを発行 */
					me.refresh();
					me.fireEvent('opt1change', me, item, item.originalValue == item.value);
				}
			}
		});

		/* 能力追加オプション2コンボボックスの生成 */
		me.selOpt2 = Ext.create('Ext.form.field.ComboBox', {
			id: me.id + me.constSelOption2,
			store: me.optionStore2,
			displayField: 'name',
			forceSelection: true,
			editable: false,
			queryMode: 'local',
			valueField: 'value',
			value: me.initOption2Value,
			typeAhead: true,
			anchor: '100%',
			disabled: true,
			listeners: {
				scope: me,
				change: function(item) {
					var me = this;

					if (item.value == null || item.originalValue == item.value) {
						me.optionItems = [];
					} else {
						me.optionItems = [me.getSelectOptionRecord(item)];
					}

					/* 情報を更新後、イベントを発行 */
					me.refresh();
					me.fireEvent('opt2change', me, item, item.originalValue == item.value);
				}
			}
		});

		/* 同一ボーナス使用時のチェックボックス生成 */
		var gid = me.id + me.constChkOption1;
		me.chkOpt1 = Ext.create('Ext.form.Checkbox', {
			id: gid,
			labelWidth: 38,
			fieldLabel: me.sameBonusText,
			getSameCount: function() {
				if (!this.checked) return 0;

				var as = me.abilitySet,
					len = as.stores.length, i, cnt = 0;

				for (i = 0; i < len; i++) {
					cnt += as.stores[i].exist()? 1: 0;
				}

				/* 0以上 */
				return Math.max(0, cnt - 1);
			},
			listeners: {
				scope: me,
				change: function(parent, newValue, oldValue, eOpts) {
					this.refresh();
				}
			}
		});

		/* トータル能力追加成功率表示パネルの生成 */
		me.successPanel = Ext.create('Ext.panel.Panel', {
			id: me.id + me.constSuccessPanel,
			xtype: 'panel',
			html: me.emptyText,
			style: {
				textAlign: 'right'
			},
			padding: '0 0 5 0',
			anchor: '100%'
		});

		/* ドゥドゥるボタンの生成 */
		me.dodoButton = Ext.create('Ext.button.Button', {
			xtype: 'button',
			text: me.dodoButtonText,
			anchor: '70%',
			disabled: true,
			scope: me,
			handler: me.onClickDoDo
		});

		/* モニ？ボタンの生成 */
		me.patternButton = Ext.create('Ext.button.Button', {
			xtype: 'button',
			text: me.monimoniButtonText,
			anchor: '30%',
			disabled: true,
			scope: me,
			handler: me.onClickPattern
		});

		/* 子ノードの設定 */
		me.items = [me.viewPanel, me.selOpt1, me.selOpt2, me.chkOpt1, me.successPanel, me.dodoButton, me.patternButton];

		/* コード値の頭1文字目によるアイテムの参照指定 */
		me.prefixOptions = me.prefixOptions || {};
		me.prefixOptions[me.initOption1Value.charAt(0)] = me.selOpt1;
		me.prefixOptions[me.initOption2Value.charAt(0)] = me.selOpt2;

		/* call parent */
		me.callParent(arguments);
	},

	/**
	 * 能力追加スロット用ストアへのバインド登録を行う
	 *
	 * @param {Ext.data.Store} store バインドするストアデータ
	 * @return {Boolean} 登録に成功した場合Trueを返却する
	 */
	bindStore: function(store) {
		var me = this;

		return me.abilitySet.putStore(store);
	},

	/**
	 * @private
	 * 特殊能力追加セレクトの指定された値を取得する
	 *
	 * @param {Ext.form.field.ComboBox} opt 特殊能力追加セレクト
	 * @return {Ext.data.Model} フィールドの値
	 */
	getSelectOptionRecord: function(opt) {
		return opt.findRecord('value', opt.getValue());
	},

	/**
	 * @private
	 * 特殊能力追加セレクトを選択する
	 *
	 * @param {String} v 選択するオプションの値
	 */
	selectOption: function(v) {
		var me = this,
			opt = me.prefixOptions[v.charAt(0)];

		if (opt) {
			opt.select(v);
		}
	},

	/**
	 * @private
	 * 結果表示パネルを再表示する
	 */
	refresh: function() {
		var me = this, vp = me.viewPanel, sp = me.successPanel,
			boostFn = me.getSelectOptionRecord(me.selOpt1).get('fn'),
			sames = me.chkOpt1.getSameCount(), i, success = 100, ss = [], sss;

		/* 結果パネルの更新 */
		me.successStore.loadData(ss);

		/* 成功率の取得 */
		me.successItems = me.abilityComponent.getSuccessList(me.abilitySet, me.resultItems, me.optionItems);
		for (i = 0; i < me.successItems.length; i++) {
			sss = boostFn(me.calcSameBonus(me.successItems[i], sames));
			if (me.boostFunction) {
				/* キャンペーン用ブーストファンクション */
				sss = me.boostFunction(sss);
			}
			ss.push([me.successItems[i]['name'], sss]);

			success *= sss;
		}

		if (0 < ss.length) {
			me.successStore.loadData(ss);
		}

		/* トータル合成確立の更新 */
		var before = me.totalValue;
		if (me.successItems.length == 0) {
			me.totalValue = 0;
			sp.update(me.emptyText);
		} else {
			me.totalValue = success / Math.pow(100, i);
			sp.update(me.totalValue + '%');
		}

		/* アイテムの有効チェック */
		me.enableDoDoButton();
		me.enableOptionsSelect();

		if (before != me.totalValue) {
			me.fireEvent('successchange', me, me.totalValue, before);
		}
	},

	/**
	 * ドゥドゥれるかどうかをチェックする
	 *
	 * @return {Boolean}ドゥドゥれる場合はTrue,ドゥドゥれない場合はFalse
	 */
	isDodo: function() {
		var me = this;

/*
		return (0 < me.abilitySet.enableCheckMax && (me.abilitySet.enableCheckMax - 1) <= me.abilityCount());
*/
		return (0 < me.abilitySet.enableCheckMax && 1 <= me.abilityCount());
	},

	/**
	 * ドゥドゥるボタンを有効にする
	 *
	 * 1つ以上の有効な能力が選択されていれば有効にする
	 */
	enableDoDoButton: function() {
		var me = this, button = me.dodoButton, b2 = me.patternButton,
			state = button.isDisabled();

		if (me.isDodo()) {
			button.enable();b2.enable();
			if (state) {
				// call event
				me.fireEvent('dodochange', me, true, false);
			}
		} else {
			button.disable();b2.disable();
			if (!state) {
				// call event
				me.fireEvent('dodochange', me, false, true);
			}
		}
	},

	/**
	 * 現在選択されている能力(能力追加オプション含む)数を返却する
	 *
	 * @return {Number} 選択されている能力数
	 */
	abilityCount: function() {
		var me = this;

		return me.resultItems.length + me.optionItems.length;
	},

	/**
	 * 能力追加オプションを有効にする
	 */
	enableOptionsSelect: function() {
		var me = this;

		/* 能力追加成功率 */
		if (0 < me.abilityCount()) {
			me.selOpt1.enable();
		} else {
			me.selOpt1.select(me.optionStore1.getAt(0));
			me.selOpt1.disable();
		}

		/* 特殊能力追加 */
		if (me.resultItems.length < me.abilitySet.enableCheckMax) {
			me.selOpt2.enable();
		} else {
			me.selOpt2.disable();
		}
	},

	/**
	 * 結果パネルにあるアイテムを全て削除する
	 */
	removeAll: function() {
		var me = this;

		me.resultItems = [];
		me.abilitySet.resetAbility();
		me.selOpt2.select(me.optionStore2.getAt(0));
	},

	/**
	 * 結果パネルの内容を更新する
	 *
	 * @param {Ext.form.FieldSet} fs チェックボックス群の親パネル
	 */
	updateResults: function(fs) {
		var me = this,
			stack = [], success;

		/* 表示されていない場合は終了 */
		if (!fs.rendered) return false;

		/* フィールドセットの情報をクリア */
		fs.removeAll(true);

		/* 結果パネルの情報をクリア */
		me.removeAll();

		/* 成功率を取得する */
		me.abilitySet.forEach(function(ability) {
			stack.push(ability);
		}, me);
		success = me.abilityComponent.getSuccessList2(me.abilitySet, stack);

		/* チェックボックスを追加していく */
		/* my method */
		me.abilitySet.forEach(function(ability) {
			if (success[ability['code']]) {
				fs.add({
					fieldStyle: 'float:left',
					boxLabel: '<p style="float:left;padding-left:3px">' + ability['name'] + '</p><p style="float:right;padding-right:3px">' + success[ability['code']] + '%</p>',
					inputValue: ability['code'],
					abilityData: ability,
					resultPanel: me,
					fieldSet: fs
				});
			}
		}, me);

		/* 情報の更新 */
		me.refresh();
	},

	/**
	 * 有効にできる能力の最大数を返却する
	 *
	 * @return {Number} 有効にできる能力の最大数
	 */
	getEnableCheckMax: function() {
		return this.abilitySet.enableCheckMax;
	},

	/**
	 * 結果パネルに表示されている能力コードを全て取得する
	 *
	 * @return {Array} 表示されている能力コード
	 */
	getValues: function() {
		var me = this,
			ret = [];

		Ext.Array.forEach(me.resultItems, function(chk) {
			ret.push(chk.inputValue);
		});

		return ret;
	},

	/**
	 * @private
	 * 排他パターンのチェックを行う
	 *
	 * @param {String} 特殊能力コード1
	 * @param {String} 特殊能力コード2
	 * @return {Boolean} 同時が不可の場合はTrueを返す
	 */
	isExclusionPattern: function(code1, code2) {
		var me = this, cd1 = code1.substr(0, 2), cd2 = code2.substr(0, 2);

		return cd1 == cd2;
	},

	/**
	 * 特殊能力を合成結果に追加する
	 *
	 * @param {Ext.form.Checkbox} item 追加する特殊能力追加アイテム
	 * @param {Boolean} silent 結果表示パネルの再描画を行わない場合Trueを指定
	 * @param {Number} 現在選択されている能力追加数
	 */
	addAbility: function(item, silent) {
		var me = this, stack = [],
			len = me.resultItems.length, i;

		for (i = 0; i < len; i++) {
			if (me.isExclusionPattern(item.inputValue, me.resultItems[i].inputValue)) {
				/* 同じ系統の能力の場合チェックをオフにする */
				stack.push(me.resultItems[i]);
			}
		}
		for (i = 0; i < stack.length; i++) {
			stack[i].setValue(false);
		}

		/* アイテムを追加 */
		me.resultItems.push(item);
		if (silent !== true) {
			me.refresh();
		}

		return me.abilityCount();
	},

	/**
	 * 特殊能力を合成結果から削除する
	 *
	 * @param {Ext.form.Checkbox} item 削除する特殊能力追加アイテム
	 * @param {Boolean} silent 結果表示パネルの再描画を行わない場合Trueを指定
	 * @param {Number} 現在選択されている能力追加数
	 */
	removeAbility: function(item, silent) {
		var me = this;

		me.resultItems.splice(Ext.Array.indexOf(me.resultItems, item), 1);
		if (silent !== true) {
			me.refresh();
		}

		return me.abilityCount();
	},

	/**
	 * ドゥドゥさんのお導きのままに
	 *
	 * @param {Array} success 能力追加に成功した場合に追加される領域
	 * @param {Array} fail 能力追加に失敗した場合に追加される領域
	 * @return {Boolean} 素晴らしく運が良い場合にTrueが返却される
	 */
	doDo: function(success, fail) {
		var me = this,
			boostFn = me.getSelectOptionRecord(me.selOpt1).get('fn'),
			sames = me.chkOpt1.getSameCount(), items = me.successItems,
			len = items.length, i, sss;

		if (0 < len) {
			for (i = 0; i < len; i++) {
				sss = boostFn(me.calcSameBonus(items[i], sames));
				if (me.boostFunction) {
					/* キャンペーン用ブーストファンクション */
					sss = me.boostFunction(sss);
				}

				if (100 <= sss || Math.floor(Math.random() * 100) < sss) {
					success.push({fieldLabel: items[i].name, name: (me.id + '-' + i), value: sss + '%'});
				} else {
					fail.push({fieldLabel: items[i].name, name: (me.id + '-' + i), value: sss + '%'});
				}
			}
		}

		return (0 < success.length) && (fail.length == 0);
	},

	/**
	 * トータルの合成成功確率をテキストで返却する
	 *
	 * @return {String} トータルの合成成功確率
	 */
	getTotalSuccess: function(s, f) {
		var html = 'Total: ' + s + ' / ' + (s + f) + ' = ';

		if (s == 0) {
			html += '0%';
		} else {
			html += Ext.util.Format.number((s / (s + f)) * 100, '0.000') + '%';
		}
		return html;
	},

	/**
	 * 選択済みオプションを取得する
	 */
	selectedOptions: function() {
		var me = this;

		return [me.selOpt1.value, me.selOpt2.value];
	},

	/**
	 * @private
	 * ドゥドゥるボタンクリック時に呼び出されるイベント処理
	 * 特殊能力追加の疑似シミュレーションを実行する
	 */
	onClickDoDo: function() {
		var me = this;

		if (0 < me.items.length) {
			var success = [], fail = [],
				s = me.doDo(success, fail);

			/* ドゥドゥウィンドウを表示 */
			me.win = Ext.create('widget.window', {
				title: 'Synthesis Results',
				autoDestroy: true,
				closable: true,
				closeAction: 'destroy',
				width: me.noDD === true? Ext.getBody().getWidth(): 600,
				height: 148 + (success.length + fail.length) * 26,
				modal: true,
				successNum: s? 1: 0,
				failNum: s? 0: 1,
				layout: 'anchor',
				bodyStyle: 'padding: 5px;',
				defaults: {
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					frame: true,
					title: 'Addition Successful',
					margins: '0 5 0 5',
					layout: 'anchor',
					autoHeight: true,
					defaultType: 'textfield',
					defaults: {
						readOnly: true,
						labelWidth: me.noDD === true? (Ext.getBody().getWidth() / 2): 140,
						anchor: '100%'
					},
					items: success
				}, {
					xtype: 'fieldset',
					frame: true,
					title: 'Addition Failed',
					margins: '0 5 0 5',
					layout: 'anchor',
					autoHeight: true,
					defaultType: 'textfield',
					defaults: {
						readOnly: true,
						labelWidth: me.noDD === true? (Ext.getBody().getWidth() / 2): 140,
						anchor: '100%'
					},
					items: fail
				}],
				dockedItems: [{
					xtype: 'toolbar',
					ui: 'footer',
					dock: 'bottom',
					items: [{
						xtype: 'label',
						readOnly: true,
						textAlign: 'right',
						html: me.getTotalSuccess(s? 1: 0, s? 0: 1),
						bodyStyle: {
							'float': 'hidden'
						}
					}, '->', Ext.create('Ext.button.Button', {
						text: me.redodoButtonText,
						scope: me,
						handler: function () {
							var me = this,
								success = [], fail = [],
								fs = me.win.query('fieldset'),
								ft = me.win.query('toolbar')[0].query('label');

							if (me.doDo(success, fail)) {
								me.win.successNum++;
							} else {
								me.win.failNum++;
							}
							fs[0].removeAll();
							fs[0].add(success);
							fs[1].removeAll();
							fs[1].add(fail);
							ft[0].update(me.getTotalSuccess(me.win.successNum, me.win.failNum));
						},
						minWidth: 105
					}), Ext.create('Ext.button.Button', {
						text: 'Close',
						scope: me,
						handler: function() {
							if (this.win)
								this.win.close();
							delete this.win;
							this.win = null;
						},
						minWidth: 105
					})]
				}]
			}).show();
		}
	},

	/**
	 * @private
	 *
	 * 立っているビットの数を返す
	 */
	popCnt: function(n) {
		n >>>= 0;
		for (var i = 0; n; n &= n - 1) {
			i++;
		}
		return i;
	},
	probability: function(s) {
		var len = s.length, ret = 1;
		for (var i = 0; i < len; i++) {
			ret *= s[i];
		}
		return ret / Math.pow(100, len);
	},
	addition: function(s) {
		var len = s.length, sum = 0;
		for (var i = 0; i < len; i++) {
			sum += s[i];
		}
		return sum;
	},
	getSuccessPattern: function(drop, items, boostFn) {
		var me = this, len = items.length,
			p = 0x0001 << len,
			ret = [], i, j;

		for (i = 0; i < p; i++) {
			if (drop == me.popCnt(i)) {
				/* 落ちる数とマッチ */
				var s = [];
				for (j = 0; j < len; j++) {
					if (i & (0x001 << j)) {
						/* フラグが立っているアイテムだけ逆算(落ちる可能性) */
						s.push(100 - boostFn(items[j]));
					} else {
						/* それ以外は通常の確率 */
						s.push(boostFn(items[j]));
					}
				}
				/* 計算した確率をスタック */
				ret.push(me.probability(s));
			}
		}
		return me.addition(ret);
	},

	/**
	 * @private
	 * 能力の名前から、性能値を上げる
	 *
	 * @param {Object} p 性能格納場所
	 * @param {String} name 性能の名称
	 * @param {Number} value 性能上昇値
	 */
	addAbilityParameter: function(p, name, value) {
		var me = this;

		if (name == 'ALL') {
			for (var i = 0; i < me.allUp.length; i++) {
				me.addAbilityParameter(p, me.allUp[i], value);
			}
		} else if (name == "All Resist") {
			for (var i = 0; i < me.resistAll.length; i++) {
				me.addAbilityParameter(p, me.resistAll[i], value);
			}
		} else {
			if (!p[name]) p[name] = 0;
			p[name] += value;
		}
	},

	/**
	 * @private
	 * パターンボタンクリック時に呼び出されるイベント処理
	 */
	onClickPattern: function() {
		var me = this;

		if (0 < me.items.length) {
			var items = me.successItems,
				len = items.length, i, j, success = [], sss, rec,
				opt = me.selOpt1.store, cnt = opt.count(), sames = me.chkOpt1.getSameCount(),
				html, winItems = [], as = me.abilitySet.abilityStore, ab, lst, e, param = {},
				re = new RegExp("([^\\(]+)\\(\\+(\\d+)\\)"), ppp = [];

			/* 能力パラメータ */
			for (i = 0; i < len; i++) {
				ab = as.findRecord('name', items[i].name) || me.optionStore2.findRecord('name', items[i].name);
				lst = ab.get('effect').replace(/<br>/g,'').split(',');
				for (j = 0; j < lst.length; j++) {
					e = lst[j].match(re);
					if (e && e.length == 3) {
						me.addAbilityParameter(param, e[1], parseInt(e[2]));
					}
				}
			}
			html = '';
			for (i = 0; i < me.abText.length; i++) {
				if (param[me.abText[i]]) {
					html += '<div>' + me.abText[i] + '<span style="color:red;font-weight:bold">&nbsp;&nbsp;(+' + param[me.abText[i]] + ')</span></div>';
				}
			}
			winItems.push({
				title: 'Performance',
				html: html
			});

			/* 成功率パターン表 */
			for (i = 0; i < len; i++) {
				sss = me.calcSameBonus(items[i], sames);
				if (me.boostFunction) {
					/* キャンペーン用ブーストファンクション */
					sss = me.boostFunction(sss);
				}
				success.push(sss);
			}

			/* ヘッダ */
			html = '<table id="ps"><tr><td id="psh"></td>';
			for (j = 0; j < cnt; j++) {
				rec = opt.getAt(j);
				html += '<td id="psh" style="width:' + parseInt(88 / cnt) +'%">' + rec.get('sname') + '</td>';
			}
			html += '</tr>';

			/* グラフ用データの作成 */
			var patternData = [], vname, fields = [];
			for (i = 0; i <= len; i++) {
				/* スロット毎の確率 */
				if (i == 0) vname = 'Success';
				else if (i == len) vname = 'Complete Failure';
				else vname = i + ' Failure(s)';
				html += '<tr><td id="ps">' + vname + '</td>';
				fields.push(vname);
				for (j = 0; j < cnt; j++) {
					/* ヘッダ毎の確率 */
					var p = me.getSuccessPattern(i, success, opt.getAt(j).get('fn'));

					html += '<td';
					if (p == 1) html += ' id="bold"';
					else if (0.8 < p) html += ' id="high"';
					else if (p < 0.1) html += ' id="low"';
					html += '>' + Ext.util.Format.number(p * 100, '0.000')  + '%</td>';

					patternData[j] = patternData[j] || {};
					if (i == 0) {
						/* 初回だけ名前を設定 */
						patternData[j]['name'] = opt.getAt(j).get('sname');
					}
					patternData[j][vname] = p * 100;
				}
				html += '</tr>';
			}
			html += '</table>';

			/* テーブルの追加 */
			winItems.push({
				title: 'Success Rate Pattern',
				html: html
			});

			/* グラフの追加 */
			var browserStore = Ext.create('Ext.data.JsonStore', {
				fields: fields,
				data: patternData
			});
			winItems.push({
				xtype: 'chart',
				title: 'Success Rate Graph',
				height: 160 + 24 * len,
				style: 'background:#fff',
				animate: true,
				theme: 'Browser:gradients',
				defaultInsets: 30,
				store: browserStore,
				legend: {
					position: 'right'
				},
				axes: [{
					type: 'Numeric',
					position: 'left',
					fields: fields,
					title: 'Lost %',
					grid: true,
					decimals: 0,
					minimum: 0,
					maximum: 100
				}, {
					type: 'Category',
					position: 'bottom',
					fields: ['name'],
					title: 'Usage'
				}],
				series: [{
					type: 'area',
					axis: 'left',
					highlight: true,
					tips: {
						trackMouse: true,
						width: 170,
						height: 28,
						renderer: function(storeItem, item) {
							this.setTitle(item.storeField + ' - ' + Ext.util.Format.number(storeItem.get(item.storeField), '0.000') + '%');
						}
					},
					xField: 'name',
					yField: fields,
					style: {
						lineWidth: 1,
						stroke: '#666',
						opacity: 0.86
					}
				}]
			});

			/* パターンウィンドウを表示 */
			me.win = Ext.create('widget.window', {
				title: 'Data Monitor',
				autoDestroy: true,
				closable: true,
				closeAction: 'destroy',
				width: me.noDD === true? Ext.getBody().getWidth(): 600,
				autoHeight: true,
				modal: true,
				layout: 'fit',
				bodyStyle: 'padding: 5px;',
				items: Ext.createWidget('tabpanel', {
					activeTab: 0,
					defaults :{
						bodyPadding: 5
					},
					items: winItems
				}),
				dockedItems: [{
					xtype: 'toolbar',
					ui: 'footer',
					dock: 'bottom',
					items: ['->', Ext.create('Ext.button.Button', {
						text: 'Close',
						scope: me,
						handler: function() {
							if (this.win)
								this.win.close();
							delete this.win;
							this.win = null;
						},
						minWidth: 105
					})]
				}]
			}).show();
		}
	}
});
