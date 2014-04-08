// jshint -W084
String.prototype.fuzzy = function (s) {
	var hay = this.toLowerCase(), i = 0, n = -1, l;
	s = s.toLowerCase();
	for (; l = s[i++] ;) if (!~(n = hay.indexOf(l, n + 1))) return false;
	return true;
};


/*global process, require, Buffer, __dirname, __filename */
var Args = new require('arg-parser'), args,
	Msg = require('node-msg'),
	Http = require('http'),
	FS = require('fs'),
	Path = require('path'),
	_funcDescription = 'One of the below:\n' +
		'list\t\tshow applications\n' +
		'stop\t\tstop an application\n' +
		'start\tstart an application\n' +
		'restart\trestart an application\n' +
		'undeploy\tundeploy an application\n' +
		'kill\t\tstop -> undeploy\n\n' +
		'deploy\tdeploy app to the server\n' +
		'clean\tclean-up the build folders\n' +
		'delete\tremove the app folder from the server\n' +
		'redeploy\tstop -> undeploy -> clean -> deploy\n',


	_confFname = __dirname + '\\' + Path.basename(__filename, '.js') + '.json',
	_conf = FS.existsSync(_confFname) ? require(_confFname) : null,
	urlCfg = null,




	/*** HELPERS ******************************************************************************************************/
	_get = function (path, cb, errorcb) {
		var resp = '', lp = 'tomcat:tomcat';		// default
		if (!urlCfg) {
			if (_conf && _conf.tomcat && _conf.tomcat.loginpass) lp = _conf.tomcat.loginpass;
			urlCfg = {
				hostname: 'localhost',
				port: 8080,
				path: '/manager/text',
				headers : { 'Authorization' : 'Basic ' + new Buffer(lp).toString('base64') }
			};
		}
		urlCfg.path = '/manager/text/' + path;
		Http.request(urlCfg, function (res) {
			res.on('data', function (chunk) { resp += chunk; });
			res.on('end', function () { if (typeof cb === 'function') cb(resp); });
		}).on('error', function (e) {
			if (typeof errorcb === 'function') errorcb();
			else if (e && e.code === 'ECONNREFUSED') Msg.error('Server is not running!');
			else Msg.error(e);
		}).end();
	},

	_formatResponse = function (msg) {
		msg = ('' + msg).trim();
		if (!msg) return;
		msg = msg
			.replace(/(OK - )(.+)/, Msg.cyan('[OK]') + ' $2')
			.replace(/(FAIL - )(.+)/, Msg.red('[ERROR]') + ' $2')
			.replace(/(\[INFO\])(.+)?/ig, Msg.cyan('[INFO]') + ' $2')
			.replace(/(\[DEBUG\])(.+)?/ig, Msg.cyan('[DEBUG]') + ' $2')
			.replace(/(\[WARNING\])(.+)?/ig, Msg.yellow('[WARNING]') + ' $2')
			.replace(/(\[ERROR\])(.+)?/ig, Msg.red('[ERROR]') + ' $2')
			.replace(/BUILD SUCCESS/ig, Msg.bold('BUILD SUCCESS'))
			.replace(/SUCCESS/ig, Msg.bold('SUCCESS'))
			.replace(/ERROR/ig, Msg.red('ERROR'));
		Msg.log(msg);
	},

	_findAppAndRun = function (params) {
		var paramApp = params.app && params.app.toLowerCase(), amb = 0, app = '';
		_run.list({}, function (apps) {
			apps.forEach(function (a) {
				if (a.toLowerCase().indexOf(paramApp) > -1) { amb++; app = a; }
			});
			if (amb > 1) return Msg.error('Cannot find the application');
			if (app) params.app = app;
			_run[params.func](params);
		});
	},
	/*** HELPERS ******************************************************************************************************/





	/*** FUNCTIONS ****************************************************************************************************/
	_list = function (params, cb) {
		var ignoredApps = [ 'ROOT', 'manager', 'docs', 'examples', 'host-manager' ],
			apps = [ ['Name', 'Status', 'Sessions'] ],
			appList = [];

		_get('list', function (resp) {
			resp.split('\n').forEach(function (line) {
				if (line.indexOf('OK - Listed applications') === 0) return;
				line = line.trim();
				if (!line.length) return;
				line = line.split(':');
				if (ignoredApps.indexOf(line[3]) > -1 && !params.all && !params.app) return;
				if (params.app && !line[3].fuzzy(params.app)) return;
				// { name: line[3], status: line[1], path: line[0], sessions: line[2] }
				apps.push([ line[3], line[1], line[2] ]);
				appList.push(line[3]);
			});

			if (_conf && _conf.apps && _conf.apps.length) {
				if (apps.length > 1) apps.push([ '', '', '' ]);
				_conf.apps.forEach(function (app) {
					if (params.app && !app.name.fuzzy(params.app)) return;
					if (appList.indexOf(app.name) === -1) {				// skip apps already deployed
						apps.push([ app.name, 'not deployed', '' ]);
					}
				});
			}

			if (cb && typeof cb === 'function') cb(appList);
			else Msg.table(apps);

		}, function () {												// server not running - do only the conf part
			Msg.error('Server is not running!');

			if (_conf && _conf.apps && _conf.apps.length) {
				if (apps.length > 1) apps.push([ '', '', '' ]);
				_conf.apps.forEach(function (app) {
					if (params.app && !app.name.fuzzy(params.app)) return;
					apps.push([ app.name, 'config:', Object.keys(app.actions).join(', ') ]);
				});
			}

			if (cb && typeof cb === 'function') cb(appList);
			else Msg.table(apps);
		});
	},

	_stop = function (params) { _get('stop?path=/' + params.app, _formatResponse); },

	_start = function (params) {
		Msg.log('Starting ' + params.app + '...');
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

	_redeploy = function (params) {
		_get('stop?path=/' + params.app, function (resp) {					// stop
			_formatResponse(resp);
			_get('undeploy?path=/' + params.app, function (resp) {			// undeploy
				_formatResponse(resp);
				_runUndeployed({ app: params.app, func: 'clean' }, function (resp) {
					_formatResponse(resp);
					_runUndeployed({ app: params.app, func: 'deploy' }, _formatResponse);
				});
			});
		});
	},

	_executeConfigCmd = function (cmd, path, callback) {
		var prev = '', tmp, type,
			cli = require('child_process').spawn('cmd', ['/c', cmd], { cwd: path });

		cli.on('error', callback);
		cli.stderr.on('data', Msg.error);
		cli.stdout.on('data', function (data) {
			data = ('' + data).trim();
			if (!/^\[\w+\]/.test(data)) data = prev + ' ' + data;
			if (data && data.replace(/\[\w+\]/g, '').trim().length) {			// if there's more text than [info]
				// show errors only (if not -V)
				if (args.params.verbose || (/ERROR|FAIL/ig).test(data)) callback(data);
				else {
					type = data.match(/\[\w+\]/);
					if (type && type.length) type = type[0];
					tmp = data.replace(/\[\w+\]/g, '').replace(/\-\-/g, '').trim();
					if ((/success/ig).test(tmp)) callback(type + tmp);
				}
			}
			prev = data.match(/\[\w+\]/);
			if (prev && prev.length) prev = prev[0];
		});
	},
	/*** FUNCTIONS ****************************************************************************************************/





	/*** INIT *********************************************************************************************************/
	_runUndeployed = function (params, callback) {
		var App = [], Func = [], options = {};

		if (!_conf || !_conf.apps || !_conf.apps.length) return;
		_conf.apps.forEach(function (app) {
			if (!params.app || !params.func || !app.name) return;
			if (app.name.fuzzy(params.app) || app.name.fuzzy(params.func)) {
				App.push(app);
				if (app.actions[params.app]) Func.push(params.app);
				if (app.actions[params.func]) Func.push(params.func);
			}
		});

		if (!App.length || !Func.length) return _runDeployed(params, callback);
		if (App.length > 1) return Msg.error('App name is ambiguous');
		if (Func.length > 1) return Msg.error('Function name is ambiguous');

		_executeConfigCmd(App[0].actions[Func[0]], App[0].path, callback);
	},


	_runDeployed = function (params, callback) {
		if (params.app) params.app = params.app.trim('/');
		if (params.func) params.func = params.func.trim('/');
		if (typeof _run[params.func] !== 'function' && typeof _run[params.app] === 'function') {
			params.func = [params.app, params.app = params.func][0];	// swap fn with appName
		}

		if (typeof _run[params.func] === 'function') {
			if (params.func === 'list') _run[params.func](params);
			else if (params.app) _findAppAndRun(params);		// if not list - allow for partial matches of the "app" param
		}
		else Msg.error('Unknown function');
	},

	_run = {
		list : _list,
		stop : _stop,
		start : _start,
		restart : _restart,
		undeploy : _undeploy,
		kill : _kill,			// stop -> undeploy
		redeploy : _redeploy	// stop -> undeploy -> clean -> deploy
	};
	/*** INIT *********************************************************************************************************/







args = new Args('TomcatManager', '2.3', 'View and Manage Tomcat Applications');
args.add({ name: 'all', desc: 'also show ignored applications (like /docs, /examples, /manager)', switches: ['-a', '--all'] });
args.add({ name: 'verbose', desc: 'show all output (e.g. "deploy" or "clean" from config)', switches: ['-V', '--verbose'] });
args.add({ name: 'func', required: true, desc: _funcDescription });
args.add({ name: 'app', desc: 'Application name' });

if (args.parse()) {
	if (_conf) _runUndeployed(args.params, _formatResponse);
	else _runDeployed(args.params, _formatResponse);
}
