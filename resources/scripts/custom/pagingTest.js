$(document).ready(function(){
	var tplContent = $('#line-template').html();
	var lineTpl = Handlebars.compile(tplContent);
	
	var testHandler = function (){
		//console.log(arguments);
	}
	
	$('div#testCont').ajaxPager({
		position:'both',
		limit: 10,
		ajaxoptions: {
			url: 'com/cc/Blog/Entries.cfc',
			data: {
				method: 'getEntries',
				returnFormat: 'json'
			},
			dataType: 'json'
		},
		params: {
			page: 'pageIndex',
			limit: 'pageSize',
			sort: 'sortCol',
			dir: 'sortDir'
		},
		reader: {
			totalpages: 'pageCount',
			totalrecords: 'recordCount',
			root: 'getEntries'
		},
		listeners: {
			init: testHandler,
			render: testHandler,
			preprocess: $.serializeCFJSON,
			beforeload	: testHandler,
			load		: testHandler,
			destroy		: testHandler
		},
		sortcolumn: 'title',
		sortby: {
			title: 'Title',
			posted: 'Date Posted',
			views: 'Views'
		},
		//searchtext: '{"title":"ColdFusion"}',
		renderoutput: lineTpl,
		stripedrows: true
	});
	
	prettyPrint();
});