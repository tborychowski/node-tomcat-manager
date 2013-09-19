/*global console, require, Buffer */
var Args = new require('arg-parser'), args,
	Msg = require('node-msg'),
	Http = require('http'),
	urlCfg = {
		hostname: 'localhost',
		port: 8080,
		path: '/manager/text',
		headers : { 'Authorization' : 'Basic ' + new Buffer('tomcat:tomcat').toString('base64') }
	},
	_get = function (path, cb) {
		urlCfg.path = '/manager/text/' + path;
		Http.request(urlCfg, function (res) {
			var resp = '';
			res.on('data', function (chunk) { resp += chunk; });
			res.on('end', function () { cb(resp); });
		}).on('error', function (e) { console.log('Error: ' + e.message); }).end();
	},

	_formatResponse = function (msg) {
		msg = msg.trim()
			.replace(/(OK - )(.+)/g, Msg.cyan('[OK]') + ' $2')
			.replace(/(FAIL - )(.+)/g, Msg.red('[ERROR]') + ' $2');
		console.log(msg);
	},

	_findAppAndRun = function (params) {
		var paramApp = params.app.toLowerCase(), amb = 0, app = '';
		_run.list({}, function (apps) {
			apps.forEach(function (a) {
				if (a.toLowerCase().indexOf(paramApp) > -1) { amb++; app = a; }
			});
			if (amb > 1) return Msg.error('Cannot find the application');
			if (app) params.app = app;
			_run[params.func](params);
		});
	},

	_list = function (params, cb) {
		var ignoredApps = [ 'ROOT', 'manager', 'docs', 'examples', 'host-manager' ],
			apps = [ ['Path', 'Status', 'Sessions'] ],
			appList = [];

		_get('list', function (resp) {
			resp.split('\n').forEach(function (line) {
				if (line.indexOf('OK - Listed applications') === 0) return;
				line = line.trim();
				if (!line.length) return;
				line = line.split(':');
				if (ignoredApps.indexOf(line[3]) > -1 && !params.all && !params.app) return;
				if (params.app && line[3] !== params.app) return;
				// { name: line[3], status: line[1], path: line[0], sessions: line[2] }
				apps.push([ line[0], line[1], line[2] ]);
				appList.push(line[0].substr(1));
			});
			if (cb && typeof cb === 'function') cb(appList);
			else Msg.table(apps);
		});
	},
	_stop = function (params) { _get('stop?path=/' + params.app, _formatResponse); },
	_start = function (params) {
		console.log('Starting ' + params.app + '...');
		_get('start?path=/' + params.app, _formatResponse);
	},
	_undeploy = function (params) { _get('undeploy?path=/' + params.app, _formatResponse); },
	_restart = function (params) {
		_get('stop?path=/' + params.app, function (resp) {
			_formatResponse(resp);
			_start(params);
		});
	},
	_kill = function (params) {
		_get('stop?path=/' + params.app, function (resp) {
			_formatResponse(resp);
			_undeploy(params);
		});
	},

	_run = {
		list : _list,
		stop : _stop,
		start : _start,
		restart : _restart,
		undeploy : _undeploy,
		kill : _kill	// stop & undeploy
	},
	_funcDescription = 'One of the below:\n' +
		'list\t\tshow applications\n' +
		'stop\t\tstop an application\n' +
		'start\tstart an application\n' +
		'restart\trestart an application\n' +
		'undeploy\tundeploy an application\n' +
		'kill\t\tstop and undeploy an application';



args = new Args('TomcatManager', '2.0', 'View and Manage Tomcat Applications');
args.add({ name: 'all', desc: 'also show ignored applications (like /docs, /examples, /manager)', switches: ['-a', '--all'] });
args.add({ name: 'func', required: true, desc: _funcDescription });
args.add({ name: 'app', desc: 'Application name' });

if (args.parse()) {
	if (args.params.app) args.params.app = args.params.app.trim('/');
	if (typeof _run[args.params.func] === 'function') {
		if (args.params.func === 'list') _run[args.params.func](args.params);
		else _findAppAndRun(args.params);		// if not list - allow for partial matches of the "app" param
	}
	else Msg.error('Unknown function');
}
