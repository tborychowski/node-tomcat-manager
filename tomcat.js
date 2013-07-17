var http = require('http'),
	urlCfg = {
		hostname: 'localhost',
		port: 8080,
		path: '/manager/text',
		headers : { 'Authorization' : 'Basic ' + new Buffer('tomcat:tomcat').toString('base64') }
	},

	get = function (path, cb) {
		urlCfg.path = '/manager/text/' + path;
		http.request(urlCfg, function (res) {
			var resp = '';
			res.on('data', function (chunk) { resp += chunk; });
			res.on('end', function () { cb(resp); });
		}).on('error', function (e) { console.log('Error: ' + e.message); }).end();
	},

	ver = function () { console.log('Tomcat Manager v1.0'); },
	help = function () {
		console.log('Usage: tomcat [function] [arguments]');
		console.log('\nFunction');
		console.log(' list\t\tshow applications');
		console.log(' stop\t\tstop an application');
		console.log(' start\t\tstart an application');
		console.log(' undeploy\tundeploy an application');
		console.log(' kill\t\tstop and undeploy an application');

		console.log('\nArguments');
		console.log(' -v\t\tshow script version');
		console.log(' -h\t\tshow script help');
		console.log(' -all\t\tshow all applications (if used with "list")');
		console.log(' [app name]\tdo something with that app');
	},
	
	run = {
		list : function (app, param) {
			var showAll = (param === '-all'),
				ignoredApps = [ 'ROOT', 'manager', 'docs', 'examples', 'host-manager' ];

			get('list', function (resp) {
				console.log('Up      App Name\n--------------------------');
				resp.split('\n').forEach(function (line) {
					if (line.indexOf('OK - Listed applications') === 0) return;
					line = line.trim();
					if (!line.length) return;
					line = line.split(':');
					if (ignoredApps.indexOf(line[3]) > -1 && !showAll && !app) return;
					if (typeof app !== 'undefined' && line[3] !== app) return;
					else console.log((line[1] === 'running') + '    ' + line[3]);
				});
			});
		},

		stop : function (app, param) { get('stop?path=/' + app, function (resp) { console.log(resp); }); },
		start : function (app, param) { get('start?path=/' + app, function (resp) { console.log(resp); }); },
		undeploy : function (app, param) { get('undeploy?path=/' + app, function (resp) { console.log(resp); }); },

		// stop & undeploy
		kill : function (app) {
			get('stop?path=/' + app, function (resp) {
				console.log(resp);
				get('undeploy?path=/' + app, function (resp) {
					console.log(resp);
				});
			});
		},
	};


var fn, app, param, i = 2, p, fnList = Object.keys(run);

for (; p = process.argv[i++] ;) {
	if (fnList.indexOf(p) > -1) fn = p;
	else if (p.indexOf('-') === 0) param = p;
	else app = p;
}

if (param === '-v') ver();
else if (typeof run[fn] === 'function') run[fn](app, param);
else help();
