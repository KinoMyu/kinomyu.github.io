/**
 * Copyright(c) 2011
 *
 * Licensed under the terms of the Open Source LGPL 3.0
 * http://www.gnu.org/licenses/lgpl.html
 * @author Greivin Britton, brittongr@gmail.com
 *
 * @link
 * http://www.sencha.com/forum/showthread.php?139600-CurrencyField-extends-NumberField-to-format-display-as-currency
 */
Ext.define('Ext.ux.CurrencyField', {
	extend: 'Ext.form.field.Number',
	alias: 'widget.currencyfield',
    alternateClassName: ['Ext.form.NumberField', 'Ext.form.Number'],
	fieldCls: Ext.baseCSSPrefix + 'form-field ' + Ext.baseCSSPrefix + 'form-currency',
	setValue: function (v) {
		this.callParent(arguments);
		if (!Ext.isEmpty(this.getValue())) {
			this.setRawValue(Ext.util.Format.number(this.getValue(), '0,0'));
		}
	},
	removeFormat: function (v) {
		if (Ext.isEmpty(v)) {
			return '';
		} else {
			v = v.toString().replace(/,/g, '');
			if (v % 1 === 0) {
				return Ext.util.Format.number(v, '0');
			} else {
				return Ext.util.Format.number(v, '0.00');
			}
		}
	},
	parseValue: function (v) {
		return this.callParent([this.removeFormat(v)]);
	},
	getErrors: function (v) {
		return this.callParent([this.removeFormat(v)]);
	},
	getSubmitData: function () {
		var returnObject = {};
		returnObject[this.name] = this.removeFormat(this.callParent(arguments)[this.name]);
		return returnObject;
	},
	preFocus: function () {
		this.setRawValue(this.removeFormat(this.getRawValue()));
		this.callParent(arguments);
	}
});
