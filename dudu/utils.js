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
 * utlis.js
 * ユーティリティ
 *
 *****************************************************************************/
Ext.ns('PSO2');

/* クッキー用モデルの作成 */
Ext.define('PSO2.CookieModel', {
	extend: 'Ext.data.Model',
	idProperty: 'key',
	fields: [
		{name: 'key'},
		{name: 'value'}
	]
});

/**
 * クッキーの制御
 */
PSO2.Cookie = {
	/** 保存期間(日) */
	expiresDay: 90,

	/**
	 * 初期化
	 */
	init: function() {
		PSO2.Cookie.cookieProvider = Ext.create('Ext.state.CookieProvider', {
			path   : location.pathname,
			domain : location.hostname,
			expires: new Date(new Date().getTime() + (86400000 * PSO2.Cookie.expiresDay))
		});
		Ext.state.Manager.setProvider(PSO2.Cookie.cookieProvider);
	},

	/**
	 * 指定されたキーに対応するクッキーデータを取得する
	 *
	 * @param {String} key キー
	 */
	get: function(key) {
		if (!Ext.isDefined(PSO2.Cookie.cookieProvider))
			PSO2.Cookie.init();

		var val = PSO2.Cookie.cookieProvider.get(key);
		if (Ext.isDefined(val)) {
			val = JSON.parse(val);
		}
		return val;
	},

	/**
	 * キーと値をクッキーへ保存する
	 *
	 * @param {String} key キー
	 * @param {Object} val 保存するデータ
	 */
	set: function(key, val) {
		if (!Ext.isDefined(PSO2.Cookie.cookieProvider))
			PSO2.Cookie.init();
		if (Ext.isObject(val)) {
			// Object
			PSO2.Cookie.cookieProvider.set(key, JSON.stringify(val));
		} else {
			// String
			PSO2.Cookie.cookieProvider.set(key, val);
		}
	}
};
PSO2.utils = {
	/**
	 * @private
	 * 配列の要素範囲を超えない値を返却する
	 * 従来3個までだった素材数を超えた場合に最大値を返すための補助
	 *
	 * @param max 要素数
	 * @param value 値
	 * @param opt 要素番号の補正値
	 * @return
	 */
	overflow: function(max, value, opt) {
		if (max < value) return max - 1;
		return Math.max(0, value - opt);
	}
};
