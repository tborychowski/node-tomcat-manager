/*global console, require, Buffer */
var Args = new require('arg-parser'), args,
	Msg = require('msg'),
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
	_spaces = function (i, chr) { if (i < 0) return ''; return new Array(i || 1).join(chr || ' '); },
	_printList = function (apps) {
		var lenApp = 1, lenStat = 7, lenSess = 8, lenPath = 1;
		apps.forEach(function (app) {
			lenApp = Math.max(lenApp, app.name.length);
			lenStat = Math.max(lenStat, app.status.length);
			lenSess = Math.max(lenSess, (app.sessions + '').length);
			lenPath = Math.max(lenPath, app.path.length);
		});
		lenApp += 5;
		lenStat ++;
		lenSess ++;
		lenPath += 5;
		console.log('Path' + _spaces(lenPath - 4) + ' Status' + _spaces(lenStat - 6) +
			' Sessions\n' + _spaces(lenPath, '-') + ' ' + _spaces(lenStat, '-') + ' ' + _spaces(lenSess, '-'));

		apps.forEach(function (app) {
			console.log(app.path + _spaces(lenPath - app.path.length) + ' ' +
				app.status + _spaces(lenStat - app.status.length) + ' ' +
				app.sessions + _spaces(lenSess - ('' + app.sessions).length));
		});
	},
	_formatResponse = function (msg) {
		msg = msg.trim()
			.replace(/(OK - )(.+)/g, Msg.cyan('[OK]') + ' $2')
			.replace(/(FAIL - )(.+)/g, Msg.red('[ERROR]') + ' $2');
		console.log(msg);
	},

	_list = function (params) {
		var apps = [], ignoredApps = [ 'ROOT', 'manager', 'docs', 'examples', 'host-manager' ];
		_get('list', function (resp) {
			resp.split('\n').forEach(function (line) {
				if (line.indexOf('OK - Listed applications') === 0) return;
				line = line.trim();
				if (!line.length) return;
				line = line.split(':');
				if (ignoredApps.indexOf(line[3]) > -1 && !params.all && !params.app) return;
				if (typeof params.app !== 'undefined' && line[3] !== params.app) return;
				apps.push({ name: line[3], status: line[1], path: line[0], sessions: line[2] });
			});
			_printList(apps);
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
	if (typeof _run[args.params.func] === 'function') _run[args.params.func](args.params);
	else Msg.error('Unknown function');
}




