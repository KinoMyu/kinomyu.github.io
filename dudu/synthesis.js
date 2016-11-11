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
 * synthesis.js
 * PSO2 能力追加シミュレーター
 *
 * このJavaScriptを利用するには、JSフレームワーク「ExtJS 4.0.7」が必要です。
 * http://www.sencha.com/products/extjs/download/
 *
 * このファイルより先に同梱の「ability.js」「result.js」をロードし、
 * HTML文書bodyタグ内の「<div class="viewport"></div>」を記述、
 * 以下のコードを書くことによりコンポーネントが挿入されます。
 *
 * Ext.onReady(function() {
 *     Ext.create('PSO2.SynthesisComponent', {
 *         outputViewport: 'viewport'
 *     });
 * });
 *
 * [注意事項]
 * 再配布・二次利用などは自由に行って頂いてOKです。
 * 情報が不確定な個所(継承・生成率など)、SEGA(R)公式による仕様変更は随時修正を行ってください。
 * 改変、ロジックの最適化などは自己責任でお願いします。
 *
 * [更新履歴]
 * @version 0.1 2012/12/24
 *     初回版アップしました。
 * @version 0.2 2012/12/26
 *     スマホ（ドラッグ&ドロップ非対応ブラウザ）を仮対応、
 *     合成パネルのURL制限を20から10へ縮小しました。
 * @version 0.2a 2012/12/27
 *     フォトンコレクトでアビリティの継承率があがる不具合を修正しました。
 * @version 0.21 2013/01/11
 *     ミューテーションIとソールによる継承率アップを同時に利用された場合、
 *     ミューテーションIが優先になるように修正しました。
 * @version 0.3 2013/03/04
 *     合成内容の状態をクッキーに保存・復元できるようにしました。
 * @version 0.4 2013/03/05
 *     レシピ例(仮)をメニュー追加しました。
 *     合成確率を常に表示するように変更しました。
 *     能力一覧をグルーピングしました。
 * @version 0.4a 2013/03/08
 *     ウィンクルムを追加しました。
 *     継承・生成確率はスティグマと同じ設定で行いました。
 * @version 0.4b 2013/03/28
 *     クロームソールを追加しました。
 * @version 0.4c 2013/04/11
 *     ゴロンソール、エクスソールを追加しました。
 * @version 0.5 2013/05/16
 *     エクストリーム実装に伴いフリクト・アルター系を追加しました。
 *     フォトンコレクトの属性耐性生成ボーナスを設定しました。
 *     状態異常4系、5系の継承率に誤りがあったのを修正しました。
 * @version 0.6 2013/06/13
 *     ペルソナ・ソール(射撃防御+30,HP+10,PP+2)、
 *     クーガー・ソール(打撃力+15,射撃力+15,法撃力+15,技量+15,HP+10,PP+2)を追加しました。
 *     期間限定「WEB連動パネル報酬」の特殊能力追加成功率+10%が選択できるようにしました。
 * @version 0.61 2013/06/18
 *     モデュレイター(打撃力+30,射撃力+30,法撃力+30)の継承率を2個=30%、3個=80%で追加しました。
 *     ステータスV系の継承率を仮対応しました。
 *     素体または素材の特殊能力を、右クリックを押すことでコピーができるようにしました。
 * @version 0.62 2013/07/10
 *     IE8で動作しない不具合を修正しました。
 * @version 0.7 2013/07/05
 *     コスト算出の作成途中までをアップ
 * @version 0.75 2013/07/18
 *     オルグ・ソール(打撃力+20,射撃力+20,HP+10)、バル・ソール(射撃力+20,法撃力+20,HP+10)を追加しました。
 *     特殊能力追加に打撃（パワーブースト）、射撃（シュートブースト）、法撃（テクニックブースト）を追加しました。
 *     コスト算出機能を追加しました。（PCブラウザ限定）
 * @version 1.0 2013/09/06
 *     リンガ・ソール(打撃力+20,法撃力+20,HP+10)、リーリー・ソール(打撃力+20,打撃防御+20,HP+10)、
 *     ソーマ・ソール(打撃力+20,射撃力+20,PP+2)を追加しました。
 *     タブパネルのコピーができるように追加しました。
 * @version 1.0 2013/09/30
 *     素材を2個使用した場合の、7スロットから8スロットEX拡張時の確率を35%→30%へ修正しました。
 * @version 1.0 2013/10/24
 *     ラタン・フィーバー(法撃力+10,技量+5,PP+2)を追加しました。
 * @version 1.0 2013/11/14
 *     メデューナ・ソール(打撃力+20,射撃力+20,HP+5,PP+1)を追加しました。
 *     マリューダ・ソール(打撃力+20,法撃力+20,PP+2)を追加しました。
 *     一部ソールの能力にて、PPの修正を行いました。
 * @version 1.0 2013/12/20
 *     セント・フィーバー(射撃力+10,技量+5,PP+2)を追加しました。
 *     ビブラス・ソール(射撃力+20,法撃力+20,HP+5,PP+1)を追加しました。
 * @version 1.0 2013/12/25
 *     レシピ例に「EX拡張」を追加、ドゥドゥ運試しができます。
 *     キャンペーン用ブーストをチェックボックスからプルダウンメニューへ変更しました。
 * @version 1.1 2014/02/26
 *     パターン(モニ？)を追加
 * @version 1.2_beta 2014/03/05
 *     同一アイテム時の確率アップを追加
 * @version 1.2 2014/03/05
 *     同一アイテム使用時による成功率上昇を対応しました。
 *     エクステンドスロット使用時の成功率上昇を対応しました。
 * @version 1.21 2014/03/11
 *     リターナーI,II,IIIを追加しました。
 *     完成品のステータス上昇を一覧で見れるようにしました。
 * @version 1.3 2014/04/25
 *     ソールレセプターへの対応
 * @version 1.31 2014/11/20
 *     素材を5個に対応するため以下を変更しました
 *     1) 素材の個数を指定するmaxMaterialを設定(初期値2)
 *     2) URLパラメータを従来のs,a,b,r,oからs,1～5,r,oに変更
 *     3) 同一ボーナスをチェックボックスに変更
 *     4) 生成率・継承率を既存の範囲を超える場合、エラーにならないよう対応
 *     5) レシピ例が長くて邪魔なのでコメントアウト
 * @version 1.32 2014/11/21
 *     データをJSON形式で外部保存しAjaxで取り込むように変更
 *     排他パターンの追加
 *
 *****************************************************************************/
Ext.ns('PSO2');

/* グリッドの変更チェックを行わないようオーバーライド */
Ext.override(Ext.data.Record, {
	isModified: function(fieldName) {
		return false;
	}
});

/* 英語表記を日本語にオーバーライド */
Ext.override(Ext.grid.header.Container, {
	sortAscText: 'Ascending',
	sortDescText: 'Descending',
	sortClearText: 'Clear',
	columnsText: 'Columns'
});
Ext.override(Ext.tab.Tab, {
	closeText: 'Close Tab'
});

Ext.define('PSO2.TabCloseMenu', {
	extend: 'Ext.tab.TabCloseMenu',
	closeTabText: 'Close this tab',
	closeText: 'Close this tab',
	closeOthersTabsText: 'Close other tabs',
	closeAllTabsText: 'Close all tabs'
});

/**
 * 能力一覧グリッドのグループヘッダー名を強制出力する
 */
Ext.define('PSO2.GridGrouping', {
	extend: 'Ext.grid.feature.Grouping',
	enableGroupingMenu: false,
	startCollapsed: true,
	groupHeaderTpl: '{[this.getHeaderName(values)]}',
	getFragmentTpl: function() {
		return Ext.apply(this.callParent(arguments) || {}, {
			getHeaderName: this.getHeaderName
		});
	},
	getHeaderName: function(values) {
		if (values['name'] == 'A') {
			return 'Stat Enhancement';
		} else if (values['name'] == 'A+') {
			return 'Stat Enhancement (Special)';
		} else if (values['name'] == 'B') {
			return 'Resistance';
		} else if (values['name'] == 'C') {
			return 'Status Effect';
		} else if (values['name'] == 'D') {
			return 'Soul';
		} else if (values['name'] == 'D+') {
			return 'Fever';
		} else if (values['name'] == 'E') {
			return 'Special';
		}
		return 'Other';
	}
});

/*****************************************************************************
 * PSO2.SynthesisComponent
 * 特殊能力追加コンポーネント
 *
 * noDDにTrueをせっとすることで、ドラッグ&ドロップ非対応の端末でもシミュレート
 * が可能
 *
 * @author 助右衛門@8鯖
 *****************************************************************************/
Ext.define('PSO2.SynthesisComponent', {
	extend: 'Ext.container.Container',

	/**
	 * @property {String} version
	 * 当コンポーネントのバージョン
	 */
	version: '1.5-Kino(2016/11/11 ver. EN) [<a href="http://hatsunemiku24.ddo.jp/dodo/">JP</a>]',

	/**
	 * @property {String} title
	 * タイトル
	 */
	title: 'PSO2 Affixing Simulator',

	/**
	 * @property {String} constCookieName
	 * クッキー保存名称
	 */
	constCookieName: 'pso2dodo',

	/**
	 * @property {String} outputViewport
	 * 出力先HTMLのクラス名(default 'viewport')
	 */
	outputViewport: false,

	/**
	 * @property {Number} limitUrlSize
	 * URL生成の制限サイズ(default 10)
	 */
	limitUrlSize: 10,

	/**
	 * @property {Number} maxMaterial
	 * 素材の最大数
	 */
	maxMaterial: 2,

	/**
	 * @property {Boolean} noDD
	 * ドラッグ&ドロップが利用できない端末の場合Trueをセット
	 */

	/**
	 * @cfg {Array} locationHash @hide
	 * URLハッシュを保持する
	 */

	/**
	 * @cfg {Ext.panel.Panel} currentTabItem @hide
	 * @private
	 * 選択中のタブパネルがセットされる
	 */
	currentTabItem: null,

	/**
	 * @cfg {Object} selectedGridCell @hide
	 * @private
	 * 選択中のグリッドのセル情報を保存する
	 */
	selectedGridCell: null,

	/**
	 * キャンペーン用テキスト
	 */
	boostCampaign: true,

	/**
	 * お薦めレシピ(仮)のメニュー
	 */
	getRecommendRecipe: false,

	/* 以下はレシピメニューを作成する場合の例 */
/*
	getRecommendRecipe: function() {
		var me = this;

		return [{
			text: '4 Slot',
			menu: [{
				text: 'Soul+Stat3+Abil3+Booster',
				scope: me,
				handler: function() {
					this.selectLoadData(null, {
						s: 'RA11.ZA01.ZB01.ZC01',
						1: 'RA11.AC03.AA03.ZD01',
						2: 'RA11.AC03.AB03.ZE01',
						3: 'RA11.AC03.AB03.ZE01',
						4: '',
						5: '',
						r: 'RA11.AC03.FA03',
						o: 'B02.A04'
					});
				}
			}]
		}];
	},
*/

	/**
	 * コンストラクタ
	 *
	 * @param {Object} config インスタンス生成時の設定情報
	 */
	constructor : function(config) {
		var me = this, items;

		/* 設定情報を反映 */
		Ext.apply(me, config);

		/* アビリティコンポーネントを生成 */
		var params = {};
		if (me.ajaxData) {
			/* 定義を上書き */
			if (me.ajaxData.abilityList)
				params['constAbility'] = me.ajaxData.abilityList;
			if (me.ajaxData.extraSlot)
				params['constExtra'] = me.ajaxData.extraSlot;
			if (me.ajaxData.boostPoint)
				params['constBoostPoint'] = me.ajaxData.boostPoint;
			if (me.ajaxData.extendAbility)
				params['constExtendAbility'] = me.ajaxData.extendAbility;
		}
		me.ability = Ext.create('PSO2.AbilityComponent', params);

		/* 子ノード領域の作成 */
		if (me.items) {
			if (!Ext.isArray(me.items)) {
				items = [me.items];
			} else {
				items = me.items;
			}
			delete me.items;
		} else {
			items = [];
		}

		/* ヘッダの表出 @@@@@ 自身のブログ宣伝などにご利用下さい @@@@@ */
		items.push({
			cls: 'app-header',
			region: 'north',
			height: 30,
			layout: 'fit',
			html: [
				'<div class="x-top-title">',
					me.title + ' ver ' + me.version + '&nbsp;',
					'<span class="x-top-author">',
					/*'[<a href="http://pso2numao.web.fc2.com/howto.html#update" target="_blank">更新履歴</a>]', */
					/*'[<a href="http://pso2numao.blog.fc2.com/" target="_blank">助右衛門@8鯖</a>]', */
					'</span>',
				'</div>'
			].join("")
		});
		/* フッタの表出 @@@@@ 以下は削除しないでいただきたいです(´;ω;｀) @@@@@ */
		items.push({
			region: 'south',
			frame: false,
			border: 0,
			html: [
				'<div style="text-align:right">',,
				'copyright &copy; 2014 <a target="_blank" href="http://pso2numao.web.fc2.com/dodo/" style="text-decoration:none">助右衛門@ship8</a>&nbsp;',
				'JavaScript framework <a href="http://www.sencha.com/products/extjs/" style="text-decoration:none">ExtJS</a>',
				'</div>'
			].join("")
		});

		/* パネルの名称 */
		me.panelNames = ['Base'];
		for (var i = 1; i <= me.maxMaterial; i++) {
			me.panelNames.push('Fodder ' + i);
		}

		if (me.noDD !== true) {
			/* ドラッグ&ドロップが可能な端末の場合アビリティグリッドを生成 */
			me.abilityGrid = Ext.create('Ext.grid.Panel', {
				title: 'Special Ability',
				region: 'west',
				collapsible: true,
				floatable: true,
				split: true,
				forceFit: true,
				sortableColumns: false,
				scroll: false,
				columns: [{
					dataIndex: 'name',
					header: 'Ability',
					width: 108,
					filterable: true,
					filter: {
						type: 'string'
					}
				}, {
					dataIndex: 'effect',
					header: 'Effect',
					width: 144,
					filter: {
						type: 'string'
					},
					renderer: function (value, meta, record) {
						if (record.get('extup')) {
							var bonus = [];

							Ext.Array.forEach(record.get('extup'), function(v) {
								var ab = this.ability.findAbilityName(v + '01');

								if (ab) {
									bonus.push(ab.get('name').replace(/[IV]+$/, ""));
								}
							}, me);

							meta.tdAttr = 'data-qtip="' + bonus.join(",") + 'Affix Bonus"';
						}
						return value;
					}
				}],
				features: [{
					ftype: 'filters',
					encode: false,
					local: true,
					menuFilterText: 'Search',
					filters: [{
						type: 'string',
						dataIndex: 'name'
					}, {
						type: 'string',
						dataIndex: 'effect'
					}]
				},
					Ext.create('PSO2.GridGrouping')
				],
				viewConfig: {
					altRowCls: 'x-grid-row-group',
					style: {
						overflow: 'auto',
						overflowX: 'hidden'
					},
					listeners: {
						render: me.initializeAbilityDragZone
					},
					doStripeRows: function(startRow, endRow) {
						// ensure stripeRows configuration is turned on
						if (this.stripeRows) {
							var rows   = this.getNodes(startRow, endRow),
								rowsLn = rows.length,
								i      = 0,
								row, rec, beforeCd = '';

							for (; i < rowsLn; i++) {
								row = rows[i];
								rec = this.getRecord(row);

								row.className = row.className.replace(this.rowClsRe, ' ');
								if (rec.get('code').substring(0, 2) !== beforeCd) {
									startRow++;
									beforeCd = rec.get('code').substring(0, 2);
								}

								if (startRow % 2 === 0) {
									row.className += (' ' + this.altRowCls);
								}
							}
						}
					}
				},
				store: me.ability.getAbilityStore()
			});
			items.push(me.abilityGrid);
		} else {
			/* ドラッグ&ドロップが不可能な端末の場合アビリティメニューを生成 */
			me.abilityWindow = Ext.create('widget.window', {
				title: 'Special Ability',
				autoDestroy: false,
				closable: true,
				closeAction: 'hide',
				modal: true,
				bodyStyle: 'padding:5px;',
				autoScroll: true,
				items: Ext.create('Ext.grid.Panel', {
					store: me.ability.getAbilityStore(),
					forceFit: true,
					scroll: false,
					columns: [{
						dataIndex: 'name',
						header: 'Ability',
						filter: {
							type: 'string'
						}
					}, {
						dataIndex: 'effect',
						header: 'Effect',
						filter: {
							type: 'string'
						}
					}],
					viewConfig: {
						style: {
							overflow: 'auto',
							overflowX: 'hidden'
						},
						listeners: {
							scope: me,

							/* セルクリック時に呼び出されるイベント処理 */
							cellclick: function(view, cell, cellIndex, record, row, rowIndex, e) {
								var me = this;

								/* 選択されいるグリッドへ特殊能力をセット */
								if (me.selectedGridCell) {
									me.selectedGridCell.view.getStore().addAbility(record.data);
								}

								/* ウィンドウを閉じる */
								me.selectedGridCell = null;
								me.abilityWindow.hide();
							}
						}
					}
				})
			});
		}

		/* タブパネルを生成 */
		me.tabPanel = Ext.createWidget('tabpanel', {
			resizeTabs: true,
			enableTabScroll: true,
			defaults: {
				autoScroll: true,
				bodyPadding: 1
			},
			plugins: Ext.create('PSO2.TabCloseMenu', {
				extraItemsTail: ['-', {
					text: 'Copy',
					scope: me,
					handler: function() {
						var me = this,
							closeMenu = me.tabPanel.plugins[0],
							index = me.findLocationHashBy(closeMenu.item);

						if (0 <= index) {
							me.selectLoadData(null, me.locationHash[index]);
						}
					}
				}],
				listeners: {
					scope: me,
					aftermenu: function () {
						this.currentTabItem = null;
					}
				}
			}),
			listeners: {
				scope: me,

				/* タブが閉じるられる直前に呼び出されるイベント処理 */
				beforeremove: function(tab, panel) {
					if (panel.$className != 'PSO2.CostPanel') {
						this.removeLocationHash(panel);
					}
				}
			}
		});

		/* メインパネルを生成(子ノードにタブパネルを設定) */
		var mainPanelItems = [Ext.create('Ext.Action', {
			iconCls: 'x-add-icon',
			text: 'Add panel',
			scope: me,
			handler: function() {
				/* フォーカスを変更 */
				me.tabPanel.setActiveTab(me.addTab());
			}
		}), Ext.create('Ext.Action', {
			iconCls: 'x-save-icon',
			text: 'Save',
			scope: me,
			handler: me.saveData
		}), Ext.create('Ext.Action', {
			iconCls: 'x-load-icon',
			text: 'Load',
			scope: me,
			handler: me.loadData
		})];

		if (me.noDD !== true) {
			/* コスト算出(PC限定) */
			mainPanelItems.push(Ext.create('Ext.button.Button', {
				iconCls: 'x-cost-icon',
				text: 'Calculate Cost',
				pressed: false,
				enableToggle: true,
				scope: me,
				handler: function (item) {
					if (item.pressed) {
						me.costPanel = Ext.create('PSO2.CostPanel', {
							title: 'Cost Calculation',
							autoDestroy: true,
							noDD: me.noDD,
							tabPanel: me.tabPanel
						});
						me.tabPanel.insert(0, me.costPanel);
						me.tabPanel.setActiveTab(0);
					} else {
						me.tabPanel.remove(me.costPanel, true);
						delete me.costPanel;
						me.costPanel = undefined;
					}
				}
			}));
		}

		if (me.boostCampaign === true) {
			/* ブーストキャンペーン */
			mainPanelItems.push('-');
			mainPanelItems.push(Ext.create('Ext.form.field.ComboBox', {
				store: Ext.create('Ext.data.JsonStore', {
					autoLoad: false,
					fields: ['T', 'V', 'F'],
					data: [
						{'T': 'No Boost',   'V': 0, 'F': null},
						{'T': 'Passive 5%',  'V': 5,  'F': function(v) { return Math.min(v + 5, 100); }},
						{'T': 'Passive 10%', 'V': 10,  'F': function(v) { return Math.min(v + 10, 100); }}
					]
				}),
				displayField: 'T',
				forceSelection: true,
				editable: false,
				queryMode: 'local',
				valueField: 'V',
				value: 0,
				typeAhead: true,
				width: 84,
				listeners: {
					change: function(item, newValue, oldValue) {
						var panel = me.tabPanel.query('resultpanel'), i;

						me.enableBoost = (0 < newValue);
						me.boostFunction = item.store.findRecord('V', newValue).get('F');
						if (me.enableBoost) {
							item.addCls('x-campaign-up');
						} else {
							item.removeCls('x-campaign-up');
						}
						if (Ext.isArray(panel)) {
							for (i = 0; i < panel.length; i++) {
								panel[i].boostFunction = me.boostFunction;
								if (panel[i].rendered) {
									panel[i].refresh();
								}
							}
						}
					}
				}
			}));
		}

		if (me.noDD !== true && Ext.isFunction(me.getRecommendRecipe)) {
			/* おすすめレシピ(PC限定) */
			mainPanelItems.push('-');
			mainPanelItems.push({
				iconCls: 'x-recommend-menu-icon',
				style: {
					overflow: 'visible'
				},
				text: 'レシピ例(仮)',
				menu: me.getRecommendRecipe()
			});
		}
		me.mainPanel = Ext.create('Ext.panel.Panel', {
			region: 'center',
			layout: 'fit',
			items: me.tabPanel,
			dockedItems: {
				xtype: 'toolbar',
				items: mainPanelItems
			},
			listeners: {
				scope: me,
				afterrender: me.restoreData
			}
		});
		items.push(me.mainPanel);

		/* ビューポート(メイン画面)を生成 */
		Ext.create('Ext.Viewport', {
			renderTo: me.outputViewport? Ext.get(me.outputViewport): Ext.getBody(),
			layout: 'border',
			items: items
		});

		/* メニューの作成(能力追加スロット用グリッドの削除メニュー) */
		me.initGridMenuButton();

		/* call parent */
//		me.callParent(config);
	},

	/**
	 *
	 */
	initGridMenuButton: function() {
		var me = this,
			items = [], i;

		for (i = 0; i < me.maxMaterial; i++) {
			items.push({
				iconCls: 'x-copy-icon',
				text: '',
				scope: me,
				btnIndex: i,
				handler: me.onCopyAbility
			});
		}
		items.push({
			iconCls: 'x-del-icon',
			text: 'Delete',
			scope: me,
			handler: function() {
				var me = this,
					item = me.selectedGridCell;

				if (item) {
					if (item.view.store.count() - 1 == item.rowIndex) {
						item.view.getStore().getAt(item.rowIndex).set('slot', null);
					} else {
						item.view.getStore().removeAbility(item.record, item.rowIndex);
					}
					item.view.refresh();
				}
				this.selectedGridCell = null;
			}
		});

		me.gridMenu = Ext.create('Ext.menu.Menu', {
			items: items
		});
	},

	/**
	 * @private
	 * タブパネルの内容を消去する
	 */
	clearTabPanel: function() {
		var me = this;

		me.initializedRestoreData = false;
		me.tabPanel.removeAll();
		me.locationHash = [];
		me.initializedRestoreData = true;
		me.updateLocationHash();
	},

	/**
	 * @private
	 * ページロード時のURLハッシュから能力追加データを再構築する
	 *
	 * 以下はURLハッシュのキー名と値の説明
	 * s: 素体にセットされている特殊能力コード(.区切り)
	 * 1～: 素材にセットされている特殊能力コード(.区切り)
	 * r: 選択されている特殊能力コード(.区切り)
	 * o: 選択されている能力追加オプションのコード(.区切り)
	 */
	restoreData: function() {
		var me = this;

		/* 再構築終了のフラグを初期化 */
		me.initializedRestoreData = false;

		/* URLハッシュが存在するかをチェック */
		if (location && location.hash && location.hash.match(/^#!\/([a-zA-Z0-9\.\=&\/]+)/)) {
			var params = RegExp.$1.split("/"),
				len = params.length, p, i;

			/* 値をチェックしながらタブパネルを生成していく */
			for (i = 0; i < len && i < me.limitUrlSize; i++) {
				p = Ext.urlDecode(params[i]);
				if (me.urlHashValidate(p)) {
					var tab = me.addTab(p),
						hash = me.addLocationHash(tab, true);

					/* ハッシュの初期値を設定する */
					hash['s'] = p['s']; hash['r'] = p['r']; hash['o'] = p['o'];
					for (j = 1; j <= me.maxMaterial; j++) hash[j] = p[j];
				} else {
					/* 不正な値が指定されている場合は終了 */
					break;
				}
			}
		}

		/* 再構築終了のフラグを立てる */
		me.initializedRestoreData = true;
	},

	/**
	 * @private
	 * URLハッシュのパラメータをチェックする
	 *
	 * @param {Object} p URLハッシュ
	 * @return {Boolean} 値が正しい場合True、不正な場合はFalseを返却
	 */
	urlHashValidate: function(p) {
		var me = this, arr = me.initHashArray(p),
			len = arr.length, i;

		/* 素体、素材のチェック */
		if (!p['s']) return false;
		for (i = 1; i < me.maxMaterial; i++) {
			if (!p[i] && p[i] !== "") return false;
		}
		for (i = 0; i < len; i++) {
			if (arr[i]) {
				if (!me.ability.isExistAbilities(arr[i].split('.')))
					return false;
			}
		}

		return true;
	},

	/**
	 * @private
	 * パラメータチェック用に配列にして返却する
	 * オプション(o)は含まない
	 *
	 * @param {Object} p URLハッシュ
	 * @return {Array} 配列にしたパラメータ
	 */
	initHashArray: function(p) {
		var me = this,
			arr = [p['s'], p['r']], i;

		for (i = 1; i <= me.maxMaterial; i++) {
			arr.push(p[i]);
		}

		return arr;
	},

	/**
	 * @private
	 * タブパネルに能力追加パネルを生成し追加する
	 *
	 * @param {Object} params 初期値パラメータ(URLハッシュから取得)
	 * @return {Ext.panel.Panel} 生成されたパネルを返却
	 */
	addTab: function(params) {
		var me = this,
			items = [{
				xtype: 'panel',
				frame: true,
				items: {
					xtype: 'fieldset',
					layout: 'anchor',
					title: 'Select Abilities',
					autoHeight: true,
					padding: '0 0 0 4',
					margin: '0 0 0 0',
					defaults: {
						xtype: 'checkbox',
						anchor: '100%',
						hideEmptyLabel: true,
						scope: me,
						handler: me.onCheckAbility
					}
				}
			}], opts = {};

		if (me.ajaxData) {
			/* 定義の上書き */
			if (me.ajaxData.optionList && me.ajaxData.optionList.support) {
				opts['optionStore1'] =  Ext.create('Ext.data.Store', {
					fields: ['name', 'sname', 'value', 'fn'],
					data: me.ajaxData.optionList.support
				});
			}
			if (me.ajaxData.optionList && me.ajaxData.optionList.additional) {
				opts['optionStore2'] =  Ext.create('Ext.data.Store', {
					fields: ['name', 'value', 'extend', 'effect'],
					data: me.ajaxData.optionList.additional
				});
			}
			if (me.ajaxData.sameBonusBoost)
				opts['sameBonusBoost'] = me.ajaxData.sameBonusBoost;
			if (me.ajaxData.exclusionPattern) {
				/* 排他パターンをオーバーライド */
				opts['isExclusionPattern'] = function(code1, code2) {
					var pattern = me.ajaxData.exclusionPattern, len = pattern.length,
						cd1 = code1.substr(0, 2), cd2 = code2.substr(0, 2),
						re = /([^\*]+)\*$/, mm,
						checked = function(p, cd) {
							if (mm = p.match(re)) {
								return p.substr(0, mm[1].length) == cd.substr(0, mm[1].length);
							}
							return p == cd;
						};

					if (cd1 == cd2) return true;
					for (var i = 0; i < len; i++) {
						var x = pattern[i], flag = false, j;

						for (j = 0; j < x.length; j++) {
							flag = checked(x[j], code1);
							if (flag) break;
						}
						if (flag) {
							for (j = 0; j < x.length; j++) {
								if (checked(x[j], code2)) return true;
							}
						}
					}
					return false;
				};
			}
		}
		items.push(Ext.create('PSO2.ResultPanel', Ext.apply({
			frame: true,
			noDD: me.noDD,
			abilityComponent: me.ability,
			boostFunction: me.enableBoost? me.boostFunction: null,
			listeners: {
				scope: me,
				opt1change: me.onAbilityOptionChange,
				opt2change: function(rp, item, init) {
					var me = this;
						me.onAbilityOptionChange(rp, item, init);
					me.updateCheckbox(rp, me.tabPanel.activeTab.query('fieldset')[0]);
				}
			}
		}, opts)));

		/* 結果側のパネル作製 */
		var panel = Ext.create('Ext.panel.Panel', {
			flex: 1,
			frame: true,
			border: false,
			autoScroll: true,
			margin: '0 0 0 0',
			padding: '0 0 0 0',
			layout: 'column',
			defaults: {
				columnWidth: 1 / 2,
				layout: 'anchor',
				autoHeight: true,
				defaults: {
					anchor: '100%'
				}
			},
			items: items,

			/* フィールドセットを取得する(チェックボックスの親コンポーネント) */
			getFieldSet: function() {
				var me = this;

				if (!me.fieldSet) {
					me.fieldSet = me.query('fieldset')[0];
				}

				return me.fieldSet;
			},

			/* 結果パネルを取得する */
			getResultPanel: function() {
				var me = this;

				if (!me.resultPanel) {
					me.resultPanel = me.query('resultpanel')[0];
				}

				return me.resultPanel;
			},

			/* 結果パネルの情報を更新する */
			updateResults: function() {
				var me = this,
					fs = me.getFieldSet(),
					rp = me.getResultPanel();

				rp.updateResults(fs);
			}
		});

		/* 再構築終了フラグが初期化されている場合、結果パネルの初期化を行う */
		if (me.initializedRestoreData === false) {
			var fs = panel.getFieldSet(),
				rp = panel.getResultPanel();

			/* フィールドセット描画後にチェックボックスを表示する処理を追加 */
			fs.on('afterrender', function(arg1, arg2) {
				var me = this,
					r = params.r;

				/* 結果パネルの内容を更新する */
				panel.updateResults();

				/* チェックボックスの初期化 */
				if (r) {
					var cc = r.split('.'),
						chk = me.query('checkbox'),
						len, i;

					arg2.myComponent.initializedCheckbox = false;
					if (Ext.isArray(chk) && (len = chk.length) > 0) {
						for (i = 0; i < len; i++) {
							if (0 <= Ext.Array.indexOf(cc, chk[i].inputValue)) {
								chk[i].setValue(true);
							}
						}
					}
					arg2.myComponent.initializedCheckbox = true;
				}
			}, fs, {delay: 1000, myComponent: me});

			/* 結果パネル描画後に能力追加オプションを選択する処理を追加 */
			rp.on('afterrender', function(arg1, arg2) {
				var me = this,
					o = params.o

				if (o) {
					var oo = o.split('.'),
						len = oo.length, i;

					arg2.myComponent.initializedSelectOption = false;
					for (i = 0; i < len; i++) {
						me.selectOption(oo[i]);
					}
					arg2.myComponent.initializedSelectOption = true;
				}
			}, rp, {delay: 1000, myComponent: me});
		}

		/* タブパネルに合成パネルを追加 */
		var gridItems = [me.createGridPanel(0, me.ability.createSlotStore(), panel, params? params['s']: null)];
		for (var i = 1; i <= me.maxMaterial; i++) {
			gridItems.push(me.createGridPanel(i, me.ability.createSlotStore(), panel, params? params[i]: null));
		}

		var retPanel = me.tabPanel.add({
			title: 'Synthesis Panel',
			autoScroll: true,
			closable: true,
			layout: {
				type: 'vbox',
				align: 'stretch',
				padding: '0 0 5 0'
			},
			items: [{
				layout: 'column',
				defaults: {
					columnWidth: 1 / (me.maxMaterial + 1),
					layout: 'anchor',
					autoHeight: true,
					defaults: {
						anchor: '100%'
					}
				},
				/* 能力追加スロット用のストアを生成してグリッドを作成 */
				items: gridItems
			}, panel],
			getResultPanel: panel.getResultPanel
		});

		/* URLハッシュを更新する */
		me.addLocationHash(retPanel);

		/* 生成された合成パネルを返却 */
		return retPanel;
	},

	/**
	 * @private
	 * 状態をクッキーへ保存する
	 */
	saveData: function() {
		var me = this;

		if (me.tabPanel.activeTab) {
			var index = me.findLocationHashBy(me.tabPanel.activeTab);

			if (0 <= index) {
				var p = me.locationHash[index];

				if (me.urlHashValidate(p)) {
					return Ext.Msg.prompt('Save Panel', 'Panel state was saved to a cookie.<br/>Input a name?', function(btn, text) {
						if (btn == 'ok') {
							var cookie = PSO2.Cookie.get(me.constCookieName) || {};

							if (text == "") text = Ext.Date.format(new Date(), 'Y-m-d H:i:s');

							if (cookie[text]) {
								Ext.Msg.confirm('Confirm', 'Data of the same name exists. Overwrite?', function(btn) {
									if (btn == 'yes') {
										cookie[text] = me.locationHash[index];
										PSO2.Cookie.set(me.constCookieName, cookie);
										Ext.Msg.alert('Information', 'Save complete.');
									}
								}, me);
							} else {
								cookie[text] = me.locationHash[index];
								PSO2.Cookie.set(me.constCookieName, cookie);
								Ext.Msg.alert('Information', 'Save complete.');
							}
						}
					}, me);
				}
			}
		}
		return Ext.Msg.alert('Save Panel', 'There is nothing to save.');
	},

	/**
	 * @private
	 * 状態をクッキーから読み込む
	 */
	loadData: function() {
		var me = this,
			cond = PSO2.Cookie.get(me.constCookieName);

		if (cond && Ext.isObject(cond)) {
			var list = [], n, listeners;
			for (n in cond) {
				list.unshift({key:n, value: cond[n]});
			}

			if (me.noDD === true) {
				listeners = {scope: me, itemclick: function(arg1, arg2) {
					this.selectLoadData(arg1, arg2);
					Ext.WindowMgr.getActive().close();
				}};
			} else {
				listeners = {scope: me, itemdblclick: function(arg1, arg2) {
					this.selectLoadData(arg1, arg2);
					Ext.WindowMgr.getActive().close();
				}};
			}

			Ext.create('widget.window', {
				title: 'Load Panel',
				modal: true,
				width: me.noDD === true? Ext.getBody().getWidth(): 600,
				height: 320,
				layout: 'fit',
				autoDestroy: true,
				closable: true,
				items: Ext.create('Ext.view.View', {
					anchor: '100%',
					autoScroll: true,
					allowBlank: false,
					store: Ext.create('Ext.data.Store', {
						model: 'PSO2.CookieModel',
						data: list
					}),
					tpl: [
						'<tpl for=".">',
							'<div class="cookie-wrap">',
								'<div class="cookie">{key}</div>',
							'</div>',
						'</tpl>',
						'<div class="x-clear"></div>'
					],
					listeners: listeners,
					trackOver: true,
					overItemCls: 'x-item-over',
					itemSelector: 'div.cookie-wrap'
				}),
				dockedItems: [{
					xtype: 'toolbar',
					ui: 'footer',
					dock: 'bottom',
					layout: {
						pack: 'center'
					},
					items: Ext.create('Ext.button.Button', {
						text: 'Close',
						scope: me,
						handler: function() {
							Ext.WindowMgr.getActive().close();
						},
						minWidth: 105
					})
				}]
			}).show();
		} else {
			Ext.Msg.alert('Load Panel', 'Panel was not restored.');
		}
	},

	/**
	 * @private
	 * 読み取りデータを選択された場合に呼び出される
	 *
	 * @param {Object} comp
	 * @param {Object} params
	 */
	selectLoadData: function(comp, params) {
		var me = this;

		if (params) {
			var v, tab, h, i;

			if (Ext.isFunction(params.get)) {
				v = params.get('value');
			} else {
				v = params;
			}

			/* パネルを追加する */
			me.initializedRestoreData = false;
			tab = me.addTab(v);
			me.initializedRestoreData = true;

			/* URLハッシュを作製する */
			h = me.addLocationHash(tab);
			h['s'] = v['s']; h['r'] = v['r']; h['o'] = v['o'];
			for (i = 1; i <= me.maxMaterial; i++) h[i] = v[i];

			/* URLハッシュを更新する */
			me.updateLocationHash();

			/* フォーカスを変更 */
			me.tabPanel.setActiveTab(tab);
		}
	},

	/**
	 * @private
	 * 能力追加オプションが変更された場合に呼び出されるイベント処理
	 * URLハッシュの更新を行う
	 *
	 * @param rp {PSO2.ResultPanel} 結果パネル
	 * @param item {Ext.form.field.Field} 選択されたアイテムフィールド
	 * @param init {Boolean} 初期値と同じ場合はTrueがセットされる
	 */
	onAbilityOptionChange: function(rp, item, init) {
		var me = this,
			index = me.findLocationHashBy(me.tabPanel.activeTab),
			prefix = item.value.charAt(0);

		if (me.locationHash[index]) {
			var ini = me.locationHash[index]['o'].split('.'),
				opts = [];

			Ext.Array.forEach(ini, function(v) {
				if (0 < v.length && v.charAt(0) != prefix) {
					opts.push(v);
				}
			});

			if (!init) {
				opts.push(item.value);
			}
			me.locationHash[index]['o'] = opts.join('.');
			me.updateLocationHash();
		}
	},

	/**
	 * @private
	 * 能力追加スロット用のグリッドパネルを生成する
	 *
	 * @param index {Number} インデックス(0=素体,1～=素材)
	 * @param store {Ext.data.Store} スロット用ストア
	 * @param panel {Ext.panel.Panel} 能力追加選択パネル
	 * @param initValue {Object} 初期表示用の値
	 * @return {Ext.grid.Panel} 生成したグリッドパネル
	 */
	createGridPanel: function(index, store, panel, initValue) {
		var me = this, grid, rp = panel.getResultPanel(), listeners, titleIndex = [];

		/* コピーメニュー用の配列を作成 */
		for (i = 0; i <= me.maxMaterial; i++) {
			if (i != index) titleIndex.push(i);
		}

		/* 能力追加スロット用ストアをバインド */
		rp.bindStore(store);

		/* パネルへの更新イベントを追加 */
		store.on({
			scope: panel,
			update: panel.updateResults
		});
		store.on({
			scope: me,
			update: me.onChangeAbility
		});

		/* 能力追加スロット用ストアをベースにグリッドパネルを生成 */
		grid = Ext.create('Ext.grid.Panel', {
			title: me.panelNames[index],
			titleIndex: titleIndex,
			sortableColumns: false,
			columns: [{
				dataIndex: 'name',
				header: 'Slot',
				width: 52,
				hidden: me.noDD || 2 < me.maxMaterial
			}, {
				dataIndex: 'slot',
				header: 'Ability',
				renderer : function(v) {
					if (v != null) {
						return v.name;
					}
					return '';
				}
			}],
			forceFit: true,
			store: store,
			viewConfig: {
				listeners: me.initDDListener(me.noDD)
			}
		});

		/* 初期表示用の値が設定されている場合の処理 */
		if (initValue) {
			var abilityStore = me.ability.getAbilityStore();

			Ext.Array.forEach(initValue.split('.'), function(code) {
				var rec = abilityStore.findRecord('code', code);

				if (rec) {
					grid.store.addAbility(rec.data);
				}
			});
		}

		/* 生成したグリッドパネルを返却 */
		return grid;
	},

	/**
	 * @private
	 * ドラッグアンドドロップイベントの初期設定
	 *
	 * @param {Object} params
	 */
	initDDListener: function(param) {
		var me = this,
			listeners = {scope: me};

		if (param !== true) {
			/* ドロップゾーンの初期化 */
			listeners['render'] = me.initializeSlotDropZone;

			/* 右クリック時のメニュー表示(PC) */
			listeners['cellcontextmenu'] = function(view, cell, cellIndex, record, row, rowIndex, e) {
				e.stopEvent();
				if (record.get('slot') != null) {
					me.selectedGridCell = {
						view: view,
						record: record,
						rowIndex: rowIndex
					};
					var target = [], i;

					Ext.Array.forEach(this.tabPanel.getActiveTab().query('grid'), function(grid) {
						if (grid.getView() !== view) {
							target.push(grid);
						}
					});

					for (i = 0; i < me.maxMaterial; i++) {
						me.copyButtonUpdate(view, me.gridMenu.items.getAt(i), i, target[i]);
					}
					me.gridMenu.showAt(e.getXY());
				}
			};
		} else {
			/* セルクリック時のメニュー表示(スマホ) */
			listeners['cellclick'] = function(view, cell, cellIndex, record, row, rowIndex, e) {
				e.stopEvent();
				me.selectedGridCell = {
					view: view,
					record: record,
					rowIndex: rowIndex
				};
				if (record.get('slot') != null) {
					/* アイテムがある場合は削除ボタンの表示 */
					var target = [];

					Ext.Array.forEach(this.tabPanel.getActiveTab().query('grid'), function(grid) {
						if (grid.getView() !== view) {
							target.push(grid);
						}
					});
					for (i = 0; i < me.maxMaterial; i++) {
						me.copyButtonUpdate(view, me.gridMenu.items.getAt(i), i, target[i]);
					}
					me.gridMenu.showAt(e.getXY());
				} else {
					/* アイテムがない場合は追加能力一覧を表示 */
					me.abilityWindow.setWidth(me.mainPanel.getWidth());
					me.abilityWindow.setHeight(Ext.getBody().getHeight());
					me.abilityWindow.showAt(0, 0);
				}
			}
		}

		return listeners
	},

	/**
	 * @private
	 * コピーボタンを更新する
	 *
	 * @param {Object} view
	 * @param {Ext.button.Button} btn
	 * @param {Number} index
	 * @param {Object} targetView
	 * @return
	 */
	copyButtonUpdate: function(view, btn, index, targetView) {
		var me = this,
			panel = view.ownerCt;

		btn.setText('Copy to ' + me.panelNames[panel.titleIndex[index]]);
		btn.targetView = targetView;

		return btn;
	},

	/**
	 * @private
	 * 能力のコピーを実行する
	 *
	 * @param {Ext.button.Button} btn
	 */
	onCopyAbility: function(btn) {
		var me = this,
			item = me.selectedGridCell;

		if (item && btn.targetView) {
			btn.targetView.getStore().addAbility(item.record.get('slot'));
		}

		this.selectedGridCell = null;
	},

	/**
	 * @private
	 * 特殊能力一覧グリッドから能力(セル)をドラッグできるように初期化する
	 *
	 * @param {Ext.panel.Panel} v ドラッグゾーン生成先パネル
	 */
	initializeAbilityDragZone: function(v) {
		v.dragZone = Ext.create('Ext.dd.DragZone', v.getEl(), {
			getDragData: function(e) {
				var sourceEl = e.getTarget(v.itemSelector, 10), d;
				if (sourceEl) {
					d = sourceEl.cloneNode(true);
					d.id = Ext.id();
					return v.dragData = {
						sourceEl: sourceEl,
						repairXY: Ext.fly(sourceEl).getXY(),
						ddel: d,
						patientData: v.getRecord(sourceEl).data
					};
				}
			},
			getRepairXY: function() {
				return this.dragData.repairXY;
			}
		});
	},

	/**
	 * @private
	 * 能力追加スロット用グリッドパネルへドロップができるよう初期化する
	 *
	 * @param {Ext.panel.Panel} v ドロップゾーン生成先パネル
	 */
	initializeSlotDropZone: function(v) {
		var gridView = v,
			grid = gridView.up('gridpanel');

		/* ドラッグゾーンの追加 */
		v.dragZone = Ext.create('Ext.dd.DragZone', v.getEl(), {
			getDragData: function(e) {
				var sourceEl = e.getTarget(v.itemSelector, 10), d;
				if (sourceEl) {
					d = sourceEl.cloneNode(true);
					d.id = Ext.id();
					return v.dragData = {
						sourceEl: sourceEl,
						repairXY: Ext.fly(sourceEl).getXY(),
						ddel: d,
						patientData: v.getRecord(sourceEl).data.slot
					};
				}
			},
			getRepairXY: function() {
				return this.dragData.repairXY;
			}
		});

		/* ドロップゾーンの追加 */

		grid.dropZone = Ext.create('Ext.dd.DropZone', v.el, {
			getTargetFromEvent: function(e) {
				return e.getTarget('.x-grid-cell-last');
			},
			onNodeDrop : function(target, dd, e, data) {
				var me = this;

				/* 能力の追加 */
				return gridView.getStore().addAbility(data.patientData);
			}
		});
	},

	/**
	 * @private
	 * 能力追加スロットの情報が変更された場合にに呼び出されるイベント処理
	 * URLハッシュの更新を行う
	 */
	onChangeAbility: function() {
		var me = this, tab, rp, as, index;

		if (me.initializedRestoreData === true) {
			tab = this.tabPanel.activeTab;
			rp = tab && tab.query('resultpanel')[0];
			as = rp && rp.abilitySet;
			index = me.findLocationHashBy(tab);

			if (as && me.locationHash[index]) {
				me.locationHash[index]['s'] = as.getLocationHash(0).join('.');

				for (var i = 0; i <= me.maxMaterial; i++) {
					me.locationHash[index][i] = as.getLocationHash(i).join('.');
				}
				me.locationHash[index]['r'] = rp.getValues().join('.');

				/* URLハッシュを更新する */
				me.updateLocationHash();
			}
		}
	},

	/**
	 * @private
	 * 追加する特殊能力を選択した場合に呼び出されるイベント処理
	 * 継承・生成率の計算後、URLハッシュの更新を行う
	 *
	 * @param {Ext.form.Checkbox} item チェックされたアイテム
	 * @param {Boolean} checked チェック状態
	 */
	onCheckAbility: function(item, checked) {
		var me = this,
			rp = item.resultPanel;

		if (rp) {
			if (checked) {
				/* 能力を追加 */
				rp.addAbility(item);
			} else {
				/* 能力を削除 */
				rp.removeAbility(item);
			}

			me.updateCheckbox(rp, item.fieldSet);

			if (me.tabPanel.activeTab) {
				/* URLハッシュの更新 */
				var index = me.findLocationHashBy(me.tabPanel.activeTab);

				if (0 <= index) {
					me.locationHash[index]['r'] = rp.getValues().join('.');
					me.updateLocationHash();
				}
			}
		}
	},

	/**
	 * @private
	 * 追加できる能力数(Ex込み)に達した場合、チェックボックスを選択できない
	 * ように変更する
	 *
	 * @param {PSO2.ResultPanel} rp 結果パネル
	 * @param {Ext.form.FieldSet} fs チェックボックス群の親パネル
	 */
	updateCheckbox: function(rp, fs) {
		var chkbox = fs.query('checkbox');

		if (rp.abilityCount() < rp.getEnableCheckMax()) {
			/* 能力数に達していない場合、チェックボックスを有効にする */
			Ext.Array.forEach(chkbox, function(box) {
				if (box.disabled)
					box.enable();
			});
		} else {
			/* 能力数に達っした場合、チェックボックスを無効にする */
			Ext.Array.forEach(chkbox, function(box) {
				if (!box.checked)
					box.disable();
			});
		}
	},

	/**
	 * @private
	 * 指定された合成パネルのハッシュパラメータを検索し、その位置を返却する
	 * 見つからない場合は-1を返す
	 *
	 * @param {Ext.panel.Panel} panel 検索する合成パネル
	 * @return {Number} ハッシュパラメータの位置
	 */
	findLocationHashBy: function(panel) {
		var me = this,
			len = me.locationHash.length, i;

		for (i = 0; i < len; i++) {
			if (me.locationHash[i]['id'] == panel.id) {
				return i;
			}
		}

		return -1;
	},

	/**
	 * @private
	 * URLに新規のハッシュパラメータを追加する
	 *
	 * @param {Ext.panel.Panel} panel 合成パネル
	 * @param {Boolean} force 強制フラグ
	 * @return {Object} 新規に生成されたハッシュ領域
	 */
	addLocationHash: function(panel, force) {
		var me = this, hash, i;

		if (me.initializedRestoreData === false && force !== true) {
			/* 再構築中は処理をしない */
			return location.hash;
		}

		me.locationHash = me.locationHash || [];

		/* 新しいハッシュ領域を作成し追加 */
		hash = {id: panel.id, s: '', r: '', o: ''};
		for (i = 1; i <= me.maxMaterial; i++) hash[i] = '';
		me.locationHash.push(hash);

		/* URLハッシュを更新する */
		me.updateLocationHash();

		return hash;
	},

	/**
	 * @private
	 * URLのハッシュパラメータを削除する
	 *
	 * @param {Ext.panel.Panel} panel 削除対象となる合成パネル
	 * @return {Object} 削除されたハッシュ領域
	 */
	removeLocationHash: function(panel) {
		var me = this,
			index = me.findLocationHashBy(panel),
			hash;

		if (me.initializedRestoreData === false) {
			/* 再構築中は処理をしない */
			return location.hash;
		}

		if (0 <= index) {
			hash = me.locationHash.splice(index, 1);
		}

		/* URLハッシュを更新する */
		me.updateLocationHash();

		return hash;
	},

	/**
	 * @private
	 * URLハッシュを更新する
	 */
	updateLocationHash: function() {
		var me = this,
			params = '',
			len = me.locationHash.length, i;

		if (me.initializedRestoreData !== false && me.initializedCheckbox !== false && me.initializedSelectOption !== false) {
			if (0 < len) {
				params = '#!';
				for (i = 0; i < len && i < me.limitUrlSize; i++) {
					params += '/' + me.makeHashParameter(me.locationHash[i], 's');
					for (j = 1; j <= me.maxMaterial; j++) {
						params += '&' + me.makeHashParameter(me.locationHash[i], j);
					}
					params += '&' + me.makeHashParameter(me.locationHash[i], 'r');
					params += '&' + me.makeHashParameter(me.locationHash[i], 'o');
				}
			}

			if (location.hash !== params) {
				/* URLを更新する */
				location.hash = params;
			}
		}
	},

	/**
	 * @private
	 * URLハッシュ用のパラメータを作成する
	 * 値が無い場合、undefine、nullになるのを防ぐため空文字をセットする
	 *
	 * @param {Object} hash ハッシュ
	 * @param {String} key キー
	 * @return {String} キーと値を'='で繋いだ文字列
	 */
	makeHashParameter: function(hash, key) {
		return key + '=' + (hash[key]? hash[key]: '');
	}
});
